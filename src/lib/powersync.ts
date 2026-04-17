import { column, Schema, Table } from "@powersync/common";
import {
  CrudBatch,
  PowerSyncBackendConnector,
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
      return null;
    }

    const endpoint = import.meta.env.VITE_POWERSYNC_URL;
    if (!endpoint) {
      throw new Error("VITE_POWERSYNC_URL not configured");
    }

    return {
      endpoint,
      token: session.data.session.access_token,
    };
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
      console.error("Upload error:", error);
      throw error;
    }
  }
}

let _powerSyncDb: PowerSyncDatabase | null = null;
let _connector: SupabaseConnector | null = null;

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
  const powerSyncDb = getPowerSyncDb();
  const connector = getConnector();

  if (!powerSyncDb || !connector) {
    console.warn("PowerSync not configured - skipping initialization");
    return;
  }

  await powerSyncDb.init();
  await powerSyncDb.connect(connector);

  powerSyncDb.registerListener({
    onChange: () => {
      connector.uploadData(powerSyncDb).catch(console.error);
    },
  });
}
