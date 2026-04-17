-- Add user profile auto-creation trigger
-- This trigger creates a public.users row whenever a new auth.users row is created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix embedding dimension to match worker model (384-dim all-MiniLM-L6-v2)
-- Note: This requires re-creating the index. If there is existing data, back it up first.
DROP INDEX IF EXISTS public.idx_memories_embedding;

-- If the column type needs changing, we need to recreate it
-- First, remove any existing embeddings stored with wrong dimension
UPDATE public.memories SET embedding = NULL WHERE embedding IS NOT NULL;

-- Alter the vector column dimension from 1536 to 384
ALTER TABLE public.memories ALTER COLUMN embedding TYPE vector(384) USING NULL;

-- Recreate the index with the correct dimension
CREATE INDEX idx_memories_embedding ON public.memories USING ivfflat (embedding vector_cosine_ops);

-- Update the match_memories function to accept 384-dim vectors
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  summary text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.summary,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.memories m
  WHERE
    (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;