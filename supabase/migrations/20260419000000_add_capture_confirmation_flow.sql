-- Add candidate confirmation flow to captures
-- Phase 3A: Captures now require explicit user confirmation before extraction

-- Add status column (pending = awaiting review, confirmed = user approved, ignored = user dismissed)
ALTER TABLE public.captures
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ignored')),
  ADD COLUMN confirmed_at TIMESTAMPTZ;

-- Index for status-based filtering (pending captures tab, dashboard count)
CREATE INDEX idx_captures_status ON public.captures(status);
CREATE INDEX idx_captures_user_status ON public.captures(user_id, status);

-- Backfill: captures that already have linked memories are confirmed
UPDATE public.captures
SET status = 'confirmed', confirmed_at = NOW()
WHERE id IN (
  SELECT DISTINCT c.id FROM public.captures c
  INNER JOIN public.memories m ON m.capture_id = c.id
);

-- Update jobs type constraint to include 'confirm'
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'confirm', 'recall', 'echo'));

-- Rollback:
-- ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
-- ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check CHECK (type IN ('ingestion', 'extraction', 'embed', 'briefing', 'brief', 'signal', 'echo'));
-- DROP INDEX IF EXISTS public.idx_captures_user_status;
-- DROP INDEX IF EXISTS public.idx_captures_status;
-- ALTER TABLE public.captures DROP COLUMN IF EXISTS confirmed_at;
-- ALTER TABLE public.captures DROP COLUMN IF EXISTS status;