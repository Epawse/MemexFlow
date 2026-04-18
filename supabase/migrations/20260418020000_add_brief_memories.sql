-- Create brief_memories junction table for brief citations
-- Phase 2B: Briefs

CREATE TABLE public.brief_memories (
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  relevance TEXT,
  PRIMARY KEY (brief_id, memory_id)
);

CREATE INDEX idx_brief_memories_brief ON public.brief_memories(brief_id);
CREATE INDEX idx_brief_memories_memory ON public.brief_memories(memory_id);

-- RLS
ALTER TABLE public.brief_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brief memories" ON public.brief_memories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.briefs WHERE briefs.id = brief_memories.brief_id AND briefs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own brief memories" ON public.brief_memories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.briefs WHERE briefs.id = brief_memories.brief_id AND briefs.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own brief memories" ON public.brief_memories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.briefs WHERE briefs.id = brief_memories.brief_id AND briefs.user_id = auth.uid())
  );

-- Rollback:
-- DROP TABLE IF EXISTS public.brief_memories;
