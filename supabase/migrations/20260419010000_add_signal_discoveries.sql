-- Phase 3B: External Signals — signal_discoveries table and signal_rules channel columns
-- Adds support for RSS and GitHub Release channel adapters alongside existing internal signals.

-- 1. Add channel columns to signal_rules
ALTER TABLE public.signal_rules
  ADD COLUMN channel_type TEXT NOT NULL DEFAULT 'internal'
    CHECK (channel_type IN ('internal', 'rss', 'github_release')),
  ADD COLUMN channel_config JSONB DEFAULT '{}'::jsonb;

-- 2. Create signal_discoveries table
CREATE TABLE public.signal_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_rule_id UUID NOT NULL REFERENCES public.signal_rules(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'github_release')),
  source_uri TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ,
  is_captured BOOLEAN DEFAULT FALSE,
  capture_id UUID REFERENCES public.captures(id) ON DELETE SET NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX idx_signal_discoveries_user ON public.signal_discoveries(user_id);
CREATE INDEX idx_signal_discoveries_rule ON public.signal_discoveries(signal_rule_id);
CREATE INDEX idx_signal_discoveries_captured ON public.signal_discoveries(is_captured) WHERE is_captured = FALSE;
CREATE INDEX idx_signal_discoveries_discovered ON public.signal_discoveries(discovered_at DESC);

-- 4. RLS
ALTER TABLE public.signal_discoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own discoveries" ON public.signal_discoveries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own discoveries" ON public.signal_discoveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discoveries" ON public.signal_discoveries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discoveries" ON public.signal_discoveries
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Update jobs type constraint to include signal_scan
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'signal_scan', 'confirm', 'recall', 'echo'));

-- Rollback:
-- DROP TABLE IF EXISTS public.signal_discoveries;
-- ALTER TABLE public.signal_rules DROP COLUMN IF EXISTS channel_config;
-- ALTER TABLE public.signal_rules DROP COLUMN IF EXISTS channel_type;
-- ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
-- ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'confirm', 'recall', 'echo'));