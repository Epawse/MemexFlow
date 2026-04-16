import { WASQLitePowerSyncDatabaseOpenFactory } from '@powersync/web';
import { PowerSyncDatabase } from '@powersync/web';
import { supabase } from './supabase';

// Define the local schema that mirrors Supabase tables
const schema = {
  users: `
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      preferences TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
  `,
  projects: `
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX idx_projects_user_id ON projects(user_id);
    CREATE INDEX idx_projects_status ON projects(status);
  `,
  captures: `
    CREATE TABLE captures (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      url TEXT NOT NULL,
      title TEXT,
      content TEXT,
      capture_type TEXT DEFAULT 'url',
      status TEXT DEFAULT 'pending',
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX idx_captures_user_id ON captures(user_id);
    CREATE INDEX idx_captures_project_id ON captures(project_id);
    CREATE INDEX idx_captures_status ON captures(status);
  `,
  memories: `
    CREATE TABLE memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      content TEXT NOT NULL,
      memory_type TEXT DEFAULT 'note',
      source_capture_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX idx_memories_user_id ON memories(user_id);
    CREATE INDEX idx_memories_project_id ON memories(project_id);
    CREATE INDEX idx_memories_type ON memories(memory_type);
  `,
  briefs: `
    CREATE TABLE briefs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      brief_type TEXT DEFAULT 'daily',
      generated_at TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX idx_briefs_user_id ON briefs(user_id);
    CREATE INDEX idx_briefs_project_id ON briefs(project_id);
    CREATE INDEX idx_briefs_generated_at ON briefs(generated_at);
  `,
  signals: `
    CREATE TABLE signals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      signal_type TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX idx_signals_user_id ON signals(user_id);
    CREATE INDEX idx_signals_project_id ON signals(project_id);
    CREATE INDEX idx_signals_status ON signals(status);
  `,
  jobs: `
    CREATE TABLE jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      input_data TEXT,
      output_data TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX idx_jobs_status ON jobs(status);
  `,
};

// PowerSync connector for Supabase
class SupabaseConnector {
  async fetchCredentials() {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('Not authenticated');
    }

    // PowerSync endpoint - you'll need to set this up in PowerSync dashboard
    const endpoint = import.meta.env.VITE_POWERSYNC_URL;
    if (!endpoint) {
      throw new Error('VITE_POWERSYNC_URL not configured');
    }

    return {
      endpoint,
      token: session.data.session.access_token,
    };
  }

  async uploadData(database: PowerSyncDatabase) {
    // Upload local changes to Supabase
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = op.table;
        const record = op.opData;

        switch (op.op) {
          case 'PUT':
            await supabase.from(table).upsert(record);
            break;
          case 'PATCH':
            await supabase.from(table).update(record).eq('id', op.id);
            break;
          case 'DELETE':
            await supabase.from(table).delete().eq('id', op.id);
            break;
        }
      }

      await transaction.complete();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

// Initialize PowerSync database
export const powerSyncDb = new PowerSyncDatabase({
  database: {
    dbFilename: 'memexflow.db',
  },
  schema: Object.values(schema),
  flags: {
    enableMultiTabs: false, // Tauri is single-instance
  },
});

export const connector = new SupabaseConnector();

// Initialize connection
export async function initPowerSync() {
  await powerSyncDb.init();

  // Connect to PowerSync service
  await powerSyncDb.connect(connector);

  // Set up upload interval
  powerSyncDb.registerListener({
    onChange: () => {
      connector.uploadData(powerSyncDb).catch(console.error);
    },
  });
}
