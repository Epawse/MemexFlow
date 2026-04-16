# PowerSync Setup Guide

PowerSync provides offline-first data sync between Supabase (Postgres) and local SQLite.

## Architecture

```
Tauri App (SQLite) <---> PowerSync Service <---> Supabase (Postgres)
```

- **Local SQLite**: Fast queries, works offline
- **PowerSync Service**: Handles sync logic, conflict resolution
- **Supabase**: Source of truth, server-side logic

## Step 1: Create PowerSync Instance

1. Go to [powersync.com](https://powersync.com)
2. Sign up or log in
3. Click "Create Instance"
4. Connect to your Supabase project:
   - Project URL: `https://vwloyomsrbrefuwfmnln.supabase.co`
   - Service Role Key: (from Supabase dashboard)

## Step 2: Configure Sync Rules

In PowerSync dashboard, create sync rules for each table:

```yaml
# sync-rules.yaml
bucket_definitions:
  user_data:
    parameters:
      - SELECT user_id FROM auth.users WHERE id = token_parameters.user_id
    data:
      - SELECT * FROM projects WHERE user_id = bucket.user_id
      - SELECT * FROM captures WHERE user_id = bucket.user_id
      - SELECT * FROM memories WHERE user_id = bucket.user_id
      - SELECT * FROM briefs WHERE user_id = bucket.user_id
      - SELECT * FROM signals WHERE user_id = bucket.user_id
      - SELECT * FROM jobs WHERE user_id = bucket.user_id
```

This ensures users only sync their own data (respecting RLS policies).

## Step 3: Get PowerSync URL

After creating the instance, copy the PowerSync URL:
- Format: `https://your-instance.powersync.com`

Add to `.env`:
```
VITE_POWERSYNC_URL=https://your-instance.powersync.com
```

## Step 4: Test Sync

1. Start the app: `npm run tauri dev`
2. Sign in (we'll implement auth in Step 5)
3. Create a project
4. Check Supabase dashboard - data should appear
5. Go offline (disable network)
6. Create another project - should work
7. Go online - data should sync

## How It Works

### Local Schema

PowerSync maintains a local SQLite database with a simplified schema:
- No vector columns (embeddings stay server-side)
- JSON columns stored as TEXT
- Optimized indexes for common queries

### Sync Flow

**Downstream (Server → Client)**:
1. PowerSync watches Postgres replication log
2. Filters changes based on sync rules
3. Pushes changes to client SQLite

**Upstream (Client → Server)**:
1. App writes to local SQLite
2. PowerSync queues changes
3. Uploads to Supabase via REST API
4. Supabase triggers update Postgres

### Conflict Resolution

PowerSync uses "last write wins" by default:
- Timestamp-based conflict resolution
- Server timestamp is authoritative
- Client changes are rebased on server state

## Usage in Code

### Query Data (Reactive)

```tsx
import { useProjects } from '@/hooks/usePowerSyncQueries';

function ProjectList() {
  const { data: projects } = useProjects(userId);
  
  return (
    <ul>
      {projects.map(p => <li key={p.id}>{p.title}</li>)}
    </ul>
  );
}
```

### Write Data

```tsx
import { usePowerSync } from '@powersync/react';

function CreateProject() {
  const db = usePowerSync();
  
  const handleCreate = async () => {
    await db.execute(
      'INSERT INTO projects (id, user_id, title) VALUES (?, ?, ?)',
      [crypto.randomUUID(), userId, 'New Project']
    );
    // Automatically syncs to Supabase
  };
}
```

### Watch Sync Status

```tsx
import { usePowerSync } from '@powersync/react';

function SyncStatus() {
  const db = usePowerSync();
  const [status, setStatus] = useState(db.currentStatus);
  
  useEffect(() => {
    return db.registerListener({
      statusChanged: (status) => setStatus(status),
    });
  }, []);
  
  return <div>Status: {status.connected ? 'Online' : 'Offline'}</div>;
}
```

## Limitations

- **No vector sync**: Embeddings (1536 dimensions) are too large for mobile sync
  - Solution: Embeddings stay server-side, search via API
- **Schema changes**: Require PowerSync dashboard update
- **Large files**: Store in Supabase Storage, sync URLs only

## Troubleshooting

### "Not authenticated" error
- Make sure user is signed in via Supabase Auth
- Check that JWT token is valid

### Data not syncing
- Check sync rules in PowerSync dashboard
- Verify RLS policies allow the operation
- Check network connectivity

### Slow initial sync
- First sync downloads all user data
- Subsequent syncs are incremental (only changes)
- Consider pagination for large datasets

## Next Steps

- Step 5: Implement authentication (Supabase Auth + Tauri deep links)
- Step 6: Build UI components
- Step 7: Add end-to-end tests
