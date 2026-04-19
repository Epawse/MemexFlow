-- Recall loop: surface memories worth revisiting
CREATE TABLE public.recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('time_based', 'project_active', 'association_dense', 'signal_triggered')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reason_detail TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisited_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recalls_user ON public.recalls(user_id);
CREATE INDEX idx_recalls_memory ON public.recalls(memory_id);
CREATE INDEX idx_recalls_pending ON public.recalls(user_id, dismissed_at) WHERE dismissed_at IS NULL;

-- RLS
ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recalls" ON public.recalls
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recalls" ON public.recalls
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recalls" ON public.recalls
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recalls" ON public.recalls
  FOR DELETE USING (auth.uid() = user_id);

-- Update jobs type constraint to include recall
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'signal_scan', 'confirm', 'recall', 'echo'));

-- Rollback:
-- DROP TABLE IF EXISTS public.recalls;
-- ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
-- ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'signal_scan', 'confirm', 'echo'));