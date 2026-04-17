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
      created_at: column.text,
      updated_at: column.text,
    },
    {
      indexes: {
        idx_captures_user_id: ["user_id"],
        idx_captures_project_id: ["project_id"],
        idx_captures_type: ["type"],
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
    console.log(
      "[PowerSync] fetchCredentials OK — user:",
      session.data.session.user.email,
      "endpoint:",
      endpoint,
      "token length:",
      token.length,
    );
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
        const record = op.opData ?? {};

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
}

let _powerSyncDb: PowerSyncDatabase | null = null;
let _connector: SupabaseConnector | null = null;
let _initialized = false;

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
    console.log("[PowerSync] Already initialized, skipping");
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
  console.log("[PowerSync] Database initialized, connecting...");

  await powerSyncDb.connect(connector);
  console.log("[PowerSync] connect() resolved");

  powerSyncDb.registerListener({
    statusChanged: (status) => {
      console.log("[PowerSync] Status:", {
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
