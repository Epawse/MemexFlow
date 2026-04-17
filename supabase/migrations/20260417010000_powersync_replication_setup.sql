-- PowerSync replication setup for Supabase
-- Step 1 of PowerSync integration: Create replication role and publication

-- Create PowerSync database role with replication privileges
-- This role is used by PowerSync to read data from your Postgres database.
-- Replace 'myhighlyrandompassword' with a secure password before running!
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'CHANGE_ME_SECURE_PASSWORD';

-- Grant read-only (SELECT) access to all existing tables in the public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- Grant SELECT on all future tables (so new tables are automatically accessible)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

-- Create a publication for PowerSync logical replication
-- The publication must be named "powersync"
CREATE PUBLICATION powersync FOR ALL TABLES;