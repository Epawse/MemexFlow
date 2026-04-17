# PowerSync Setup Guide for MemexFlow

PowerSync provides offline-first data sync between Supabase (Postgres) and local SQLite.

## Architecture

```
Tauri App (SQLite) <---> PowerSync Service <---> Supabase (Postgres)
```

- **Local SQLite**: Fast queries, works offline
- **PowerSync Service**: Handles sync logic, conflict resolution
- **Supabase**: Source of truth, server-side logic

## Step 1: Create PowerSync Replication Role on Supabase

Run the SQL migration on your Supabase database:

```bash
# Option A: Via Supabase CLI
supabase db push

# Option B: Via Supabase SQL Editor (dashboard)
# Copy the contents of supabase/migrations/20260417010000_powersync_replication_setup.sql
```

**Important**: Change `CHANGE_ME_SECURE_PASSWORD` to a secure password before running!

This creates:

- `powersync_role` with replication privileges
- `powersync` publication for logical replication
- Read-only grants on all public tables

## Step 2: Create PowerSync Cloud Instance

1. Sign up at https://dashboard.powersync.com
2. Create a new project (e.g., "MemexFlow")
3. Go to **Database Connections** → **Connect to Source Database**
4. Select **Supabase** tab and enter:
   - Host: `db.vwloyomsrbrefuwfmnln.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `powersync_role`
   - Password: (the secure password from Step 1)
   - SSL Mode: `verify-full`
5. Click **Test Connection** then **Save Connection**

## Step 3: Deploy Sync Rules

1. In the PowerSync Dashboard, go to **Sync Streams**
2. Copy the contents of `powersync/sync-config.yaml`
3. Paste into the dashboard editor
4. Click **Deploy**

The sync rules filter data by `user_id` using `token.sub` from Supabase Auth JWTs, ensuring users only see their own data.

## Step 4: Configure Client Auth

1. Go to **Client Auth** in PowerSync Dashboard
2. Select **Supabase** as the auth provider
3. Enter your Supabase project URL and JWT secret
4. Enable **Development Tokens** for testing (optional)
5. Save

## Step 5: Update .env

Copy the PowerSync instance URL from the dashboard and add to `.env`:

```bash
VITE_POWERSYNC_URL=https://your-instance.powersync.com
```

## Step 6: Test Sync

1. Run `cargo tauri dev`
2. Sign in with a user account
3. Create a project in the UI → verify in Supabase Dashboard
4. Create a project in Supabase Dashboard → verify in the UI
5. Disconnect network, create data, reconnect → verify sync

## Naming Convention

| Supabase Column        | PowerSync Local Column | Notes                    |
| ---------------------- | ---------------------- | ------------------------ |
| `type`                 | `type`                 | Same name for all tables |
| `input` (jobs)         | `input`                | JSON stored as TEXT      |
| `embedding` (memories) | N/A                    | Not synced (too large)   |

## Sync Rules Reference

See `powersync/sync-config.yaml` for the complete sync configuration using edition 3 (Sync Streams).

Key design decisions:

- User-scoped: Each stream filters by `user_id = token.sub`
- All 7 tables synced: users, projects, captures, memories, briefs, signals, jobs
- Embeddings NOT synced (384-dim vectors, too large for mobile)

## Troubleshooting

### "Not authenticated" error

- Ensure user is signed in via Supabase Auth
- Check that JWT token is valid and not expired

### Data not syncing

- Check sync rules in PowerSync dashboard
- Verify RLS policies allow the operation
- Check that `powersync` publication exists: `SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';`

### Slow initial sync

- First sync downloads all user data
- Subsequent syncs are incremental
- For large datasets, consider pagination
