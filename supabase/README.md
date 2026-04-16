# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - Project name: `memexflow`
   - Database password: (generate a strong password)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

## Step 2: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the schema

This will create:
- 7 core tables (users, projects, captures, memories, briefs, signals, jobs)
- Vector search indexes for semantic search
- Row Level Security (RLS) policies
- Triggers for automatic `updated_at` timestamps
- Helper function `match_memories()` for vector similarity search

## Step 3: Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
   ```

## Step 5: Enable Authentication Providers

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable the providers you want:
   - **Email** (enabled by default)
   - **Google OAuth** (recommended)
   - **GitHub OAuth** (optional)

For OAuth providers:
1. Create OAuth app in provider's developer console
2. Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret to Supabase

## Step 6: Configure Deep Link for Tauri

For Tauri OAuth callback, we'll use a custom protocol `memexflow://`:

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   memexflow://auth/callback
   ```

This will be handled by Tauri's deep link system (configured in Phase 0 Step 5).

## Step 7: Verify Setup

Run the following query in SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- briefs
- captures
- jobs
- memories
- projects
- signals
- users

## Next Steps

- Continue to Phase 0 Step 3: PowerSync integration
- Or test the connection by running the app: `npm run tauri dev`

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire `schema.sql` file
- Check that you're in the correct project

### "permission denied" error
- RLS policies are enabled
- Make sure you're authenticated when accessing data
- Check that `auth.uid()` matches the `user_id` in queries

### Vector extension not found
- pgvector extension should be enabled by default in Supabase
- If not, run: `CREATE EXTENSION IF NOT EXISTS vector;`
