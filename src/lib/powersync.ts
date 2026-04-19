import {
  column,
  CrudBatch,
  PowerSyncBackendConnector,
  Schema,
  Table,
  type AbstractPowerSyncDatabase,
} from "@powersync/common";
import { PowerSyncDatabase } from "@powersync/web";
import { supabase } from "./supabase";

// Local schema mirroring Supabase tables (column names MUST match DB exactly)
const AppSchema = new Schema({
  users: new Table(
    {
      id: column.text,
      email: column.text,
      display_name: column.text,
      avatar_url: column.text,
      preferences: column.text,
      created_at: column.text,
      updated_at: column.text,
    },
    { indexes: {} },
  ),
  projects: new Table(
    {
      id: column.text,
      user_id: column.text,
      title: column.text,
      description: column.text,
      color: column.text,
      icon: column.text,
      archived: column.integer,
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_projects_user_id: ["user_id"],
        idx_projects_archived: ["archived"],
      },
    },
  ),
  captures: new Table(
    {
      id: column.text,
      user_id: column.text,
      project_id: column.text,
      type: column.text,
      title: column.text,
      content: column.text,
      url: column.text,
      metadata: column.text,
      status: column.text,
      confirmed_at: column.text,
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_captures_user_id: ["user_id"],
        idx_captures_project_id: ["project_id"],
        idx_captures_type: ["type"],
        idx_captures_status: ["status"],
      },
    },
  ),
  memories: new Table(
    {
      id: column.text,
      user_id: column.text,
      project_id: column.text,
      capture_id: column.text,
      content: column.text,
      summary: column.text,
      metadata: column.text,
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_memories_user_id: ["user_id"],
        idx_memories_project_id: ["project_id"],
        idx_memories_capture_id: ["capture_id"],
      },
    },
  ),
  briefs: new Table(
    {
      id: column.text,
      user_id: column.text,
      project_id: column.text,
      title: column.text,
      content: column.text,
      type: column.text,
      status: column.text,
      metadata: column.text,
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_briefs_user_id: ["user_id"],
        idx_briefs_project_id: ["project_id"],
        idx_briefs_status: ["status"],
      },
    },
  ),
  signals: new Table(
    {
      id: column.text,
      user_id: column.text,
      project_id: column.text,
      type: column.text,
      title: column.text,
      description: column.text,
      confidence: column.real,
      related_memory_ids: column.text,
      metadata: column.text,
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_signals_user_id: ["user_id"],
        idx_signals_project_id: ["project_id"],
        idx_signals_type: ["type"],
      },
    },
  ),
  jobs: new Table(
    {
      id: column.text,
      user_id: column.text,
      type: column.text,
      status: column.text,
      input: column.text,
      output: column.text,
      error: column.text,
      created_at: column.text,
      updated_at: column.text,
      started_at: column.text,
      completed_at: column.text,
    },
    { indexes: { idx_jobs_user_id: ["user_id"], idx_jobs_status: ["status"] } },
  ),
  memory_associations: new Table(
    {
      id: column.text,
      user_id: column.text,
      from_memory_id: column.text,
      to_memory_id: column.text,
      relation_type: column.text,
      note: column.text,
      created_at: column.text,
    },
    {
      indexes: {
        idx_memory_associations_from: ["from_memory_id"],
        idx_memory_associations_to: ["to_memory_id"],
        idx_memory_associations_user: ["user_id"],
      },
    },
  ),
  brief_memories: new Table(
    {
      brief_id: column.text,
      memory_id: column.text,
      relevance: column.text,
    },
    {
      indexes: {
        idx_brief_memories_brief: ["brief_id"],
        idx_brief_memories_memory: ["memory_id"],
      },
    },
  ),
  signal_rules: new Table(
    {
      id: column.text,
      user_id: column.text,
      project_id: column.text,
      name: column.text,
      query: column.text,
      match_type: column.text,
      channel_type: column.text,
      channel_config: column.text,
      is_active: column.integer,
      last_checked_at: column.text,
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_signal_rules_user: ["user_id"],
        idx_signal_rules_project: ["project_id"],
      },
    },
  ),
  signal_matches: new Table(
    {
      id: column.text,
      user_id: column.text,
      signal_rule_id: column.text,
      memory_id: column.text,
      matched_text: column.text,
      is_dismissed: column.integer,
      matched_at: column.text,
    },
    {
      indexes: {
        idx_signal_matches_rule: ["signal_rule_id"],
        idx_signal_matches_user: ["user_id"],
      },
    },
  ),
  signal_discoveries: new Table(
    {
      id: column.text,
      user_id: column.text,
      signal_rule_id: column.text,
      project_id: column.text,
      source_type: column.text,
      source_uri: column.text,
      title: column.text,
      summary: column.text,
      published_at: column.text,
      is_captured: column.integer,
      capture_id: column.text,
      discovered_at: column.text,
    },
    {
      indexes: {
        idx_signal_discoveries_user: ["user_id"],
        idx_signal_discoveries_rule: ["signal_rule_id"],
        idx_signal_discoveries_captured: ["is_captured"],
        idx_signal_discoveries_discovered: ["discovered_at"],
      },
    },
  ),
  recalls: new Table(
    {
      id: column.text,
      user_id: column.text,
      project_id: column.text,
      memory_id: column.text,
      reason: column.text,
      priority: column.text,
      reason_detail: column.text,
      scheduled_at: column.text,
      revisited_at: column.text,
      dismissed_at: column.text,
      created_at: column.text,
    },
    {
      indexes: {
        idx_recalls_user: ["user_id"],
        idx_recalls_memory: ["memory_id"],
      },
    },
  ),
});

// PowerSync connector for Supabase
class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.warn("[PowerSync] No auth session — cannot connect yet");
      return null;
    }

    const endpoint = import.meta.env.VITE_POWERSYNC_URL;
    if (!endpoint) {
      throw new Error("VITE_POWERSYNC_URL not configured");
    }

    const token = session.data.session.access_token;
    if (import.meta.env.DEV) {
      console.debug(
        "[PowerSync] fetchCredentials OK — user:",
        session.data.session.user.email,
        "endpoint:",
        endpoint,
      );
    }
    return { endpoint, token };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const batch = await database.getCrudBatch();
    if (!batch) return;

    await this._handleBatch(batch);
  }

  private async _handleBatch(batch: CrudBatch) {
    try {
      for (const op of batch.crud) {
        // Dynamic table access — cast to bypass strict Supabase generated types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableRef: any = supabase.from(op.table);
        const record = this._transformForSupabase(op.table, op.opData ?? {});

        if (import.meta.env.DEV) {
          console.debug(`[PowerSync] Upload ${op.op} on ${op.table}:`, record);
        }

        switch (op.op) {
          case "PUT":
            await tableRef.upsert(record);
            break;
          case "PATCH":
            await tableRef.update(record).eq("id", op.id);
            break;
          case "DELETE":
            await tableRef.delete().eq("id", op.id);
            break;
        }
      }

      await batch.complete();
    } catch (error) {
      console.error("[PowerSync] Upload error:", error);
      throw error;
    }
  }

  /**
   * Local SQLite stores jsonb columns as text (stringified JSON). When we
   * upload to Supabase we must hand back actual objects, otherwise Postgres
   * stores the string as a jsonb *string* and downstream readers have to
   * JSON.parse twice to get at the fields.
   */
  private _transformForSupabase(
    table: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    const JSONB_COLUMNS: Record<string, string[]> = {
      jobs: ["input", "output"],
      captures: ["metadata"],
      memories: ["metadata"],
      briefs: ["metadata"],
      signals: ["metadata", "related_memory_ids"],
      signal_rules: ["channel_config"],
      users: ["preferences"],
    };
    const cols = JSONB_COLUMNS[table];
    if (!cols) return data;

    const out = { ...data };
    for (const col of cols) {
      const v = out[col];
      if (typeof v === "string" && v.length > 0) {
        try {
          out[col] = JSON.parse(v);
        } catch {
          /* leave as-is */
        }
      }
    }
    return out;
  }
}

/**
 * Create FTS5 virtual table + triggers for local memory search.
 * Safe to call on every init — uses IF NOT EXISTS.
 */
async function setupFTS5(db: PowerSyncDatabase) {
  try {
    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        summary,
        content='memories',
        content_rowid='rowid'
      )
    `);

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, content, summary) VALUES (new.rowid, new.content, new.summary);
      END
    `);

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, summary) VALUES('delete', old.rowid, old.content, old.summary);
      END
    `);

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, summary) VALUES('delete', old.rowid, old.content, old.summary);
        INSERT INTO memories_fts(rowid, content, summary) VALUES (new.rowid, new.content, new.summary);
      END
    `);

    if (import.meta.env.DEV) console.debug("[PowerSync] FTS5 index ready");
  } catch (err) {
    console.warn("[PowerSync] FTS5 setup skipped (may not be supported):", err);
  }
}

let _powerSyncDb: PowerSyncDatabase | null = null;
let _connector: SupabaseConnector | null = null;
let _initialized = false;
const _syncStatus = {
  connected: false,
  lastSyncAt: null as Date | null,
  downloadError: null as string | null,
};

export function getPowerSyncDb(): PowerSyncDatabase | null {
  if (!import.meta.env.VITE_POWERSYNC_URL) {
    return null;
  }

  if (!_powerSyncDb) {
    _powerSyncDb = new PowerSyncDatabase({
      database: {
        dbFilename: "memexflow.db",
      },
      schema: AppSchema,
      flags: {
        enableMultiTabs: false,
        useWebWorker: false,
      },
      sync: {
        worker: "/WASQLiteDB.worker.js",
      },
    });
  }

  return _powerSyncDb;
}

export function getConnector(): SupabaseConnector | null {
  if (!import.meta.env.VITE_POWERSYNC_URL) {
    return null;
  }

  if (!_connector) {
    _connector = new SupabaseConnector();
  }

  return _connector;
}

export async function initPowerSync() {
  if (_initialized) {
    if (import.meta.env.DEV) console.debug("[PowerSync] Already initialized, skipping");
    return;
  }
  _initialized = true;

  const powerSyncDb = getPowerSyncDb();
  const connector = getConnector();

  if (!powerSyncDb || !connector) {
    console.warn("[PowerSync] Not configured — skipping initialization");
    return;
  }

  await powerSyncDb.init();
  console.info("[PowerSync] Database initialized, connecting...");

  await powerSyncDb.connect(connector);
  console.info("[PowerSync] connect() resolved");

  await setupFTS5(powerSyncDb);

  // Expose for ad-hoc debugging: window.__psdb.getAll("SELECT ...")
  // and window.__psDebug() for sync diagnostics
  (window as unknown as { __psdb: unknown }).__psdb = powerSyncDb;
  (window as unknown as { __psDebug: unknown }).__psDebug = debugPowerSyncTables;

  powerSyncDb.registerListener({
    statusChanged: (status) => {
      _syncStatus.connected = status.connected;
      if (status.connected) {
        _syncStatus.lastSyncAt = new Date();
      }
      _syncStatus.downloadError = status.dataFlowStatus?.downloadError?.message ?? null;
      console.info("[PowerSync] Status:", {
        connected: status.connected,
        connecting: status.connecting,
        hasSynced: status.hasSynced,
        uploading: status.dataFlowStatus?.uploading,
        downloading: status.dataFlowStatus?.downloading,
        downloadError: status.dataFlowStatus?.downloadError?.message,
      });
    },
  });
}

/** Disconnect and reconnect PowerSync to pick up sync config changes. */
export async function reconnectPowerSync() {
  const db = getPowerSyncDb();
  const connector = getConnector();
  if (!db || !connector) {
    throw new Error("PowerSync not configured — VITE_POWERSYNC_URL is missing");
  }

  // Verify auth session exists before reconnecting
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    throw new Error("No auth session — please sign in again");
  }

  console.info("[PowerSync] Reconnecting...");
  try {
    await db.disconnect();
    console.info("[PowerSync] Disconnected, reconnecting...");
  } catch {
    console.warn("[PowerSync] Disconnect failed, proceeding with connect");
  }

  // Small delay to let disconnect fully settle
  await new Promise((r) => setTimeout(r, 500));

  // Connect with a timeout so it doesn't spin forever
  const connectPromise = db.connect(connector);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PowerSync connect timed out after 10s — check if the PowerSync service is reachable")), 10_000),
  );
  await Promise.race([connectPromise, timeoutPromise]);
  console.info("[PowerSync] Reconnected");
}

/** Check local PowerSync tables and log row counts for diagnostics. */
export async function debugPowerSyncTables() {
  const db = getPowerSyncDb();
  if (!db) {
    console.warn("[PowerSync Debug] Not configured — VITE_POWERSYNC_URL is not set");
    return null;
  }

  // Auth session check
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  console.info("[PowerSync Debug] Auth session:", session
    ? { user: session.user.email, expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : "unknown" }
    : "NO SESSION",
  );
  console.info("[PowerSync Debug] PowerSync URL:", import.meta.env.VITE_POWERSYNC_URL || "NOT SET");

  const tables = [
    "projects", "captures", "memories", "briefs", "signals",
    "signal_rules", "signal_matches", "signal_discoveries", "recalls",
    "memory_associations", "brief_memories", "jobs",
  ];

  console.group("[PowerSync Debug] Local table row counts");
  for (const table of tables) {
    try {
      const result = await db.execute(`SELECT count(*) as cnt FROM ${table}`);
      const row = result.rows?.item?.(0) ?? result.rows?._array?.[0];
      const count = row?.cnt ?? "?";
      console.info(`  ${table}: ${count}`);
    } catch (err) {
      console.info(`  ${table}: (error — ${err})`);
    }
  }
  console.groupEnd();

  console.info("[PowerSync Debug] Sync status:", _syncStatus);
  return { ..._syncStatus, hasAuthSession: !!session };
}
