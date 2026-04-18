-- Create signal_rules and signal_matches tables
-- Phase 2C: Signals
-- Also updates jobs type constraint to include 'signal' type

-- Signal rules: user-defined monitoring queries
CREATE TABLE public.signal_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'keyword' CHECK (match_type IN ('keyword', 'regex')),
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signal_rules_user ON public.signal_rules(user_id);
CREATE INDEX idx_signal_rules_project ON public.signal_rules(project_id);
CREATE INDEX idx_signal_rules_active ON public.signal_rules(is_active) WHERE is_active = TRUE;

-- Signal matches: when a rule fires
CREATE TABLE public.signal_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_rule_id UUID NOT NULL REFERENCES public.signal_rules(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  matched_text TEXT,
  is_dismissed BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signal_matches_rule ON public.signal_matches(signal_rule_id);
CREATE INDEX idx_signal_matches_user ON public.signal_matches(user_id);
CREATE INDEX idx_signal_matches_dismissed ON public.signal_matches(is_dismissed) WHERE is_dismissed = FALSE;

-- RLS
ALTER TABLE public.signal_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signal rules" ON public.signal_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signal rules" ON public.signal_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signal rules" ON public.signal_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signal rules" ON public.signal_rules
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.signal_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signal matches" ON public.signal_matches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signal matches" ON public.signal_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signal matches" ON public.signal_matches
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signal matches" ON public.signal_matches
  FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger (only signal_rules has updated_at column)
CREATE TRIGGER update_signal_rules_updated_at BEFORE UPDATE ON public.signal_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update jobs type constraint to include 'signal'
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'echo'));

-- Rollback:
-- DROP TABLE IF EXISTS public.signal_matches;
-- DROP TABLE IF EXISTS public.signal_rules;
-- ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
-- ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'echo'));