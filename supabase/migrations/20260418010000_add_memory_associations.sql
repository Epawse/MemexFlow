-- Create memory_associations table for evidence linking
-- Phase 2A: Enhanced Memory

CREATE TABLE public.memory_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  to_memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('supports', 'contradicts', 'elaborates', 'related')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate associations for same pair + type
CREATE UNIQUE INDEX idx_memory_associations_unique
  ON public.memory_associations(from_memory_id, to_memory_id, relation_type);

CREATE INDEX idx_memory_associations_from ON public.memory_associations(from_memory_id);
CREATE INDEX idx_memory_associations_to ON public.memory_associations(to_memory_id);
CREATE INDEX idx_memory_associations_user ON public.memory_associations(user_id);

-- RLS
ALTER TABLE public.memory_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own associations" ON public.memory_associations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own associations" ON public.memory_associations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own associations" ON public.memory_associations
  FOR DELETE USING (auth.uid() = user_id);

-- Rollback:
-- DROP TABLE IF EXISTS public.memory_associations;
