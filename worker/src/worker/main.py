"""AI Worker - polls Supabase jobs table and processes jobs."""

import asyncio
import json
import os
import signal
import types

import httpx
from dotenv import load_dotenv

from .jobs.handlers import JOB_HANDLERS
from .utils.logging import logger
from .utils.supabase import get_supabase

# Map DB job types to handler names
TYPE_MAP = {
    "ingestion": "ingestion",
    "extraction": "extraction",
    "embed": "ingestion",
    "briefing": "briefing",
    "brief": "briefing",
    "signal": "signal",
}

load_dotenv()

POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "5"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "5"))

running = True


def handle_shutdown(signum: int, frame: types.FrameType | None) -> None:
    """Signal handler to gracefully stop the polling loop."""
    global running
    logger.info("shutdown_signal", signal=signum)
    running = False


signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)


def fetch_pending_jobs() -> list[dict[str, object]]:
    """Fetch pending jobs from the queue."""
    response = (
        get_supabase().table("jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", desc=False)
        .limit(BATCH_SIZE)
        .execute()
    )
    return response.data or []


def claim_job(job_id: str) -> bool:
    """Atomically claim a job. Returns True if claimed."""
    response = (
        get_supabase().table("jobs")
        .update({"status": "processing", "started_at": "now()"})
        .eq("id", job_id)
        .eq("status", "pending")
        .execute()
    )
    return len(response.data or []) > 0


def complete_job(job_id: str, output: dict[str, object]) -> None:
    """Mark job as completed with output."""
    get_supabase().table("jobs").update({
        "status": "completed",
        "output": output,
        "completed_at": "now()",
    }).eq("id", job_id).execute()


def fail_job(job_id: str, error: str) -> None:
    """Mark job as failed with error message."""
    get_supabase().table("jobs").update({
        "status": "failed",
        "output": {"error": error},
        "completed_at": "now()",
    }).eq("id", job_id).execute()


async def process_job(job: dict[str, object]) -> None:
    """Process a single job by dispatching to the appropriate handler."""
    job_id = job["id"]
    job_type = job["type"]
    input_data = job.get("input", {})
    if isinstance(input_data, str):
        try:
            input_data = json.loads(input_data)
        except (json.JSONDecodeError, TypeError):
            input_data = {}

    # Inject job-level context into input_data so handlers can use it
    input_data.setdefault("user_id", job.get("user_id", ""))
    input_data.setdefault("job_id", job_id)

    handler_name = TYPE_MAP.get(job_type)
    if not handler_name:
        fail_job(job_id, f"Unknown job type: {job_type}")
        logger.warning("unknown_job_type", job_type=job_type, job_id=job_id)
        return

    handler = JOB_HANDLERS.get(handler_name)
    if not handler:
        fail_job(job_id, f"Unknown job type: {job_type}")
        logger.warning("unknown_job_type", job_type=job_type, job_id=job_id)
        return

    logger.info("processing_job", job_id=job_id, job_type=job_type)

    try:
        result = await handler(input_data)
        complete_job(job_id, result)
        logger.info("job_completed", job_id=job_id, job_type=job_type)
    except (ValueError, RuntimeError, OSError, KeyError, TypeError, httpx.HTTPError) as e:
        fail_job(job_id, str(e))
        logger.error("job_failed", job_id=job_id, job_type=job_type, error=str(e))


async def main() -> None:
    """Main polling loop."""
    get_supabase()  # Initialize connection early to fail fast
    logger.info("worker_started", poll_interval=POLL_INTERVAL, batch_size=BATCH_SIZE)

    while running:
        try:
            jobs = fetch_pending_jobs()

            if jobs:
                logger.info("jobs_found", count=len(jobs))
                for job in jobs:
                    if not running:
                        break
                    if claim_job(job["id"]):
                        await process_job(job)
            else:
                await asyncio.sleep(POLL_INTERVAL)

        except (ValueError, RuntimeError, OSError, KeyError, TypeError, httpx.HTTPError) as e:
            logger.error("poll_error", error=str(e))
            await asyncio.sleep(POLL_INTERVAL)

    logger.info("worker_stopped")


def run() -> None:
    """Entry point for the CLI."""
    asyncio.run(main())


if __name__ == "__main__":
    run()
