import { getPowerSyncDb } from "./powersync";
import { supabase } from "./supabase";

interface CreateCaptureParams {
  userId: string;
  url: string;
  projectId?: string | null;
}

interface CreateIngestionJobParams {
  userId: string;
  captureId: string;
  url: string;
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("URL is required");

  const hasScheme = /^https?:\/\//i.test(trimmed);

  // If user didn't type a scheme, require the input to look like a domain
  // *before* we prepend https://. Otherwise new URL() happily turns "123"
  // into https://0.0.0.123/ (numeric IPv4 coercion).
  if (!hasScheme && !/^[^\s/]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) {
    throw new Error("That doesn't look like a valid URL");
  }

  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error("That doesn't look like a valid URL");
  }
  if (!parsed.hostname) {
    throw new Error("URL is missing a valid domain");
  }
  return parsed.toString();
}

/**
 * Queue an ingestion job for a capture. Local-first via PowerSync when
 * available, otherwise goes straight to Supabase. Used by the initial
 * capture flow and by the retry action on failed captures.
 */
export async function createIngestionJob({
  userId,
  captureId,
  url,
}: CreateIngestionJobParams) {
  const db = getPowerSyncDb();
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (db) {
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '', '', ?, ?)",
      [
        jobId,
        userId,
        "ingestion",
        "pending",
        JSON.stringify({ capture_id: captureId, url, user_id: userId }),
        now,
        now,
      ],
    );
  } else {
    // jobs.input is jsonb — pass object directly so Postgres stores it
    // as a jsonb object rather than a jsonb string.
    const { error } = await (supabase.from("jobs") as any).insert({
      user_id: userId,
      type: "ingestion",
      status: "pending",
      input: { capture_id: captureId, url, user_id: userId },
    });
    if (error) throw error;
  }
}

export async function createCapture({
  userId,
  url,
  projectId,
}: CreateCaptureParams) {
  const normalizedUrl = normalizeUrl(url);
  const captureId = crypto.randomUUID();
  const db = getPowerSyncDb();
  const now = new Date().toISOString();

  if (db) {
    await db.execute(
      "INSERT INTO captures (id, user_id, project_id, type, title, url, content, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '', '{}', ?, ?)",
      [
        captureId,
        userId,
        projectId || null,
        "url",
        normalizedUrl,
        normalizedUrl,
        now,
        now,
      ],
    );
  } else {
    const { error: captureError } = await (
      supabase.from("captures") as any
    ).insert({
      id: captureId,
      user_id: userId,
      project_id: projectId || null,
      type: "url",
      title: normalizedUrl,
      url: normalizedUrl,
    });
    if (captureError) throw captureError;
  }

  await createIngestionJob({ userId, captureId, url: normalizedUrl });
  return captureId;
}
