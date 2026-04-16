-- MemexFlow Database Schema
-- Phase 0: Foundation - Core Tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captures table (URLs, notes, files)
CREATE TABLE public.captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('url', 'note', 'file')),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table (processed knowledge)
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  capture_id UUID REFERENCES public.captures(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Briefs table (AI-generated summaries)
CREATE TABLE public.briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'project', 'custom')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals table (pattern detection)
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('trend', 'connection', 'gap', 'insight')),
  title TEXT NOT NULL,
  description TEXT,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  related_memory_ids UUID[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table (AI worker task queue)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('embed', 'summarize', 'brief', 'signal')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_captures_user_id ON public.captures(user_id);
CREATE INDEX idx_captures_project_id ON public.captures(project_id);
CREATE INDEX idx_memories_user_id ON public.memories(user_id);
CREATE INDEX idx_memories_project_id ON public.memories(project_id);
CREATE INDEX idx_memories_embedding ON public.memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_briefs_user_id ON public.briefs(user_id);
CREATE INDEX idx_briefs_project_id ON public.briefs(project_id);
CREATE INDEX idx_signals_user_id ON public.signals(user_id);
CREATE INDEX idx_signals_project_id ON public.signals(project_id);
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_captures_updated_at BEFORE UPDATE ON public.captures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own captures" ON public.captures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own captures" ON public.captures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captures" ON public.captures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own captures" ON public.captures
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own briefs" ON public.briefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs" ON public.briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs" ON public.briefs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own briefs" ON public.briefs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own signals" ON public.signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signals" ON public.signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signals" ON public.signals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signals" ON public.signals
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Function: Vector similarity search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
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
