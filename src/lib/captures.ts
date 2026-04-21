import { getPowerSyncDb } from "./powersync";
import { supabase } from "./supabase";
import i18n from "../i18n/config";
import type { Capture } from "./models";

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
  if (!trimmed) throw new Error(i18n.t("captures.urlRequired"));

  const hasScheme = /^https?:\/\//i.test(trimmed);

  // If user didn't type a scheme, require the input to look like a domain
  // *before* we prepend https://. Otherwise new URL() happily turns "123"
  // into https://0.0.0.123/ (numeric IPv4 coercion).
  if (!hasScheme && !/^[^\s/]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) {
    throw new Error(i18n.t("captures.invalidUrl"));
  }

  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error(i18n.t("captures.invalidUrl"));
  }
  if (!parsed.hostname) {
    throw new Error(i18n.t("captures.missingDomain"));
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
  const language = i18n.language || "zh";

  const input = { capture_id: captureId, url, user_id: userId, language };

  if (db) {
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '', '', ?, ?)",
      [jobId, userId, "ingestion", "pending", JSON.stringify(input), now, now],
    );
  } else {
    // jobs.input is jsonb — pass object directly so Postgres stores it
    // as a jsonb object rather than a jsonb string.
    // NOTE: `as any` required because Database type lacks Relationships
    // field needed for Supabase-js v2 generic inference.
    const { error } = await (supabase.from("jobs") as any).insert({
      user_id: userId,
      type: "ingestion",
      status: "pending",
      input,
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
      "INSERT INTO captures (id, user_id, project_id, type, title, url, content, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '', '{}', 'pending', ?, ?)",
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
      status: "pending",
    });
    if (captureError) throw captureError;
  }

  await createIngestionJob({ userId, captureId, url: normalizedUrl });
  return captureId;
}

/** Confirm a pending capture and create an extraction job if content is ready. */
export async function confirmCapture(capture: Capture) {
  const db = getPowerSyncDb();
  const now = new Date().toISOString();

  if (db) {
    await db.execute(
      "UPDATE captures SET status = 'confirmed', confirmed_at = ?, updated_at = ? WHERE id = ?",
      [now, now, capture.id],
    );
  } else {
    const { error } = await (supabase.from("captures") as any)
      .update({ status: "confirmed", confirmed_at: now })
      .eq("id", capture.id);
    if (error) throw error;
  }

  // If ingestion has completed (content exists), create extraction job
  if (capture.content && capture.content.trim().length > 0) {
    const jobId = crypto.randomUUID();
    const language = i18n.language || "zh";
    const jobInput = JSON.stringify({
      content: capture.content.slice(0, 8000),
      capture_id: capture.id,
      user_id: capture.user_id,
      project_id: capture.project_id || "",
      language,
    });

    if (db) {
      await db.execute(
        "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, 'extraction', 'pending', ?, '', '', ?, ?)",
        [jobId, capture.user_id, jobInput, now, now],
      );
    } else {
      const { error } = await (supabase.from("jobs") as any).insert({
        user_id: capture.user_id,
        type: "extraction",
        status: "pending",
        input: {
          content: capture.content.slice(0, 8000),
          capture_id: capture.id,
          user_id: capture.user_id,
          project_id: capture.project_id || "",
          language,
        },
      });
      if (error) throw error;
    }
  }
}

/** Ignore a pending capture — no extraction will run. */
export async function ignoreCapture(captureId: string) {
  const db = getPowerSyncDb();
  const now = new Date().toISOString();

  if (db) {
    await db.execute(
      "UPDATE captures SET status = 'ignored', updated_at = ? WHERE id = ?",
      [now, captureId],
    );
  } else {
    const { error } = await (supabase.from("captures") as any)
      .update({ status: "ignored" })
      .eq("id", captureId);
    if (error) throw error;
  }
}

/** Reactivate an ignored capture back to pending. */
export async function reactivateCapture(captureId: string) {
  const db = getPowerSyncDb();
  const now = new Date().toISOString();

  if (db) {
    await db.execute(
      "UPDATE captures SET status = 'pending', confirmed_at = NULL, updated_at = ? WHERE id = ?",
      [now, captureId],
    );
  } else {
    const { error } = await (supabase.from("captures") as any)
      .update({ status: "pending", confirmed_at: null })
      .eq("id", captureId);
    if (error) throw error;
  }
}