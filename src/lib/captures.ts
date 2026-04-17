import { getPowerSyncDb } from "./powersync";
import { supabase } from "./supabase";

interface CreateCaptureParams {
  userId: string;
  url: string;
  projectId?: string | null;
}

function normalizeUrl(raw: string): string {
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

export async function createCapture({
  userId,
  url,
  projectId,
}: CreateCaptureParams) {
  const normalizedUrl = normalizeUrl(url);
  const captureId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
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
    await db.execute(
      "INSERT INTO jobs (id, user_id, type, status, input, output, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '', '', ?, ?)",
      [
        jobId,
        userId,
        "ingestion",
        "pending",
        JSON.stringify({
          capture_id: captureId,
          url: normalizedUrl,
          user_id: userId,
        }),
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

    await (supabase.from("jobs") as any).insert({
      user_id: userId,
      type: "ingestion",
      status: "pending",
      input: JSON.stringify({
        capture_id: captureId,
        url: normalizedUrl,
        user_id: userId,
      }),
    });
  }

  return captureId;
}
