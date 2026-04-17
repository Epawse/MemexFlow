/**
 * Schema Consistency Checker for MemexFlow
 *
 * Compares PowerSync local schema columns against actual Supabase columns.
 * Uses the service_role key to bypass RLS for schema inspection.
 *
 * Run: node --env-file=.env scripts/check-schema.mjs
 *
 * Required env vars (in .env):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (do NOT commit this — service_role bypasses RLS)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "❌ Missing env vars. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env,\n" +
      "   then run: node --env-file=.env scripts/check-schema.mjs",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// PowerSync schema columns (from src/lib/powersync.ts)
const POWERSYNC_SCHEMA = {
  users: [
    "id",
    "email",
    "display_name",
    "avatar_url",
    "preferences",
    "created_at",
    "updated_at",
  ],
  projects: [
    "id",
    "user_id",
    "title",
    "description",
    "color",
    "icon",
    "archived",
    "created_at",
    "updated_at",
  ],
  captures: [
    "id",
    "user_id",
    "project_id",
    "type",
    "title",
    "content",
    "url",
    "metadata",
    "created_at",
    "updated_at",
  ],
  memories: [
    "id",
    "user_id",
    "project_id",
    "capture_id",
    "content",
    "summary",
    "metadata",
    "created_at",
    "updated_at",
  ],
  briefs: [
    "id",
    "user_id",
    "project_id",
    "title",
    "content",
    "type",
    "status",
    "metadata",
    "created_at",
    "updated_at",
  ],
  signals: [
    "id",
    "user_id",
    "project_id",
    "type",
    "title",
    "description",
    "confidence",
    "related_memory_ids",
    "metadata",
    "created_at",
    "updated_at",
  ],
  jobs: [
    "id",
    "user_id",
    "type",
    "status",
    "input",
    "output",
    "error",
    "created_at",
    "updated_at",
    "started_at",
    "completed_at",
  ],
};

async function main() {
  console.log("🔍 MemexFlow Schema Consistency Check\n");
  console.log(
    "Comparing PowerSync local columns vs Supabase actual columns:\n",
  );

  let allOk = true;

  for (const [table, psColumns] of Object.entries(POWERSYNC_SCHEMA)) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
      allOk = false;
      continue;
    }

    const dbColumns = data && data[0] ? Object.keys(data[0]) : [];

    // Check for columns in PowerSync but not in Supabase
    const extraInPS = psColumns.filter((c) => !dbColumns.includes(c));
    // Check for columns in Supabase but not in PowerSync
    const missingFromPS = dbColumns.filter((c) => !psColumns.includes(c));

    const status =
      extraInPS.length === 0 && missingFromPS.length === 0 ? "✅" : "⚠️ ";
    console.log(
      `${status} ${table}: ${dbColumns.length} Supabase cols, ${psColumns.length} PowerSync cols`,
    );

    if (extraInPS.length > 0) {
      console.log(
        `   PowerSync has but Supabase doesn't: ${extraInPS.join(", ")}`,
      );
      allOk = false;
    }
    if (missingFromPS.length > 0) {
      console.log(
        `   Supabase has but PowerSync doesn't: ${missingFromPS.join(", ")}`,
      );
      allOk = false;
    }

    // Show actual Supabase columns for reference
    console.log(`   Supabase columns: ${dbColumns.join(", ")}`);
    console.log();
  }

  if (allOk) {
    console.log("✅ All schemas match perfectly!");
  } else {
    console.log("⚠️  Schema mismatches detected. See above for details.");
  }

  // Cleanup: delete any test rows we might have created
  console.log("\nDone.");
}

main().catch(console.error);
