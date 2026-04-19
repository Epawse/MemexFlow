-- MemexFlow Demo Seed Data
-- Run with: supabase db reset (or psql)

-- ============================================================
-- Demo user (password: demo123456)
-- Auth user is created by trigger on auth.users insert
-- ============================================================

-- Create auth user first, then the profile is auto-created
-- Note: In local dev, use the Supabase dashboard or CLI to create the user
-- This script assumes a user_id that you'll replace with your actual auth.uid()

-- For demo purposes, we'll use a placeholder UUID.
-- Replace 'DEMO_USER_ID' with your actual user ID after signing up.
-- You can find it in the Supabase dashboard > auth > users.

-- Example: After signing up with demo@memexflow.ai / demo123456,
-- run: SELECT id FROM auth.users WHERE email = 'demo@memexflow.ai';
-- Then replace DEMO_USER_ID below.

-- ============================================================
-- Topics (Projects)
-- ============================================================

INSERT INTO projects (id, user_id, title, description, color, archived, created_at, updated_at) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'RAG & Retrieval Systems', 'Research on retrieval-augmented generation, vector databases, and knowledge retrieval methods', '#6366f1', false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 hours'),
  ('a0000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'AI Agent Frameworks', 'Comparing LangGraph, CrewAI, AutoGen, and other multi-agent orchestration frameworks', '#ec4899', false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  ('a0000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'Productivity Systems', 'Personal knowledge management, second brain, and workflow automation for researchers', '#22c55e', false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 hours');

-- ============================================================
-- Captures
-- ============================================================

INSERT INTO captures (id, user_id, project_id, type, title, content, url, metadata, status, created_at, updated_at) VALUES
  -- RAG topic captures
  ('c0000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'url', 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'Retrieval-Augmented Generation (RAG) combines a retrieval system with a seq2seq model. The retrieval component fetches relevant documents from a large corpus, and the generator synthesizes answers using the retrieved context. Key findings: RAG models achieve state-of-the-art results on open-domain QA, fact verification, and Jeopardy question generation. The approach reduces hallucination by grounding generation in external knowledge.', 'https://arxiv.org/abs/2005.11401', '{"confidence": 0.95, "key_claims": ["RAG combines retrieval with generation to reduce hallucination", "Achieves SOTA on open-domain QA tasks", "Retrieved context grounds model outputs in factual knowledge"]}', 'confirmed', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),

  ('c0000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'url', 'Vector Search at Scale: Building Production RAG Systems', 'Production RAG systems face challenges with vector search at scale: latency increases with index size, embedding quality varies by model choice, and chunking strategy significantly impacts retrieval quality. Pinecone, Weaviate, and pgvector each offer different tradeoffs. Hybrid search (combining sparse and dense retrieval) consistently outperforms pure vector search by 15-20% on recall@k metrics.', 'https://blog.pinecone.io/vector-search-at-scale', '{"confidence": 0.88, "key_claims": ["Hybrid search outperforms pure vector search by 15-20%", "Chunking strategy significantly impacts retrieval quality", "pgvector is viable for moderate-scale production use"]}', 'confirmed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  ('c0000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'url', 'Chunking Strategies for RAG: A Comprehensive Evaluation', 'Effective chunking strategies for RAG include: (1) Fixed-size with overlap — simple but may split semantic units; (2) Sentence-based — preserves semantic boundaries but creates variable-size chunks; (3) Semantic chunking using embeddings — groups related sentences but adds computational cost; (4) Document-structure-based — uses headings, paragraphs, and sections as natural boundaries. Overlap of 10-20% reduces information loss at boundaries.', 'https://arxiv.org/abs/2405.09543', '{"confidence": 0.91, "key_claims": ["Overlap of 10-20% reduces boundary information loss", "Semantic chunking adds computational cost but improves coherence", "Fixed-size chunks may split semantic units"]}', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  ('c0000001-0000-0000-0000-000000000004', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'note', 'Personal note: RAG evaluation framework ideas', 'Key metrics for evaluating RAG systems: Context Relevance (are retrieved chunks on-topic?), Faithfulness (does the answer follow from context?), Answer Relevance (does the answer address the question?). The RAGAS framework provides automated evaluation. Need to benchmark our system against these metrics before demo.', NULL, '{"confidence": 0.7}', 'confirmed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

  -- AI Agents topic captures
  ('c0000001-0000-0000-0000-000000000005', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'url', 'LangGraph: Building Multi-Agent Systems', 'LangGraph extends LangChain with graph-based agent orchestration. Key features: stateful conversations, cyclic agent loops, human-in-the-loop breakpoints, and persistent memory. Compared to CrewAI, LangGraph offers more control over agent flow but requires more setup. The StateGraph abstraction maps well to complex workflows where agents need to loop, branch, and backtrack.', 'https://langchain-ai.github.io/langgraph/', '{"confidence": 0.92, "key_claims": ["LangGraph offers cyclic agent loops and backtracking", "StateGraph abstraction maps to complex workflows", "More control but more setup than CrewAI"]}', 'confirmed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

  ('c0000001-0000-0000-0000-000000000006', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'url', 'CrewAI: Orchestrating Role-Playing AI Agents', 'CrewAI defines agents with roles, goals, and backstories. Tasks are assigned sequentially or hierarchically. The framework handles delegation, tool use, and output formatting automatically. Key advantage: lower barrier to entry than LangGraph. Limitation: less control over execution flow. Best for well-defined, sequential workflows.', 'https://docs.crewai.com/', '{"confidence": 0.87, "key_claims": ["CrewAI agents have roles, goals, and backstories", "Lower barrier to entry than LangGraph", "Less control over execution flow"]}', 'confirmed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

  ('c0000001-0000-0000-0000-000000000007', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'url', 'AutoGen: Enabling Next-Gen LLM Applications', 'AutoGen enables multi-agent conversations with customizable agents. Agents can be powered by different LLMs, use tools, and maintain conversation history. The AssistantAgent and UserProxyAgent pattern enables human-AI collaboration. Key differentiator: supports nested conversations and code execution in sandboxed environments.', 'https://microsoft.github.io/autogen/', '{"confidence": 0.89, "key_claims": ["AutoGen supports multi-agent conversations with different LLMs", "UserProxyAgent pattern enables human-AI collaboration", "Supports nested conversations and sandboxed code execution"]}', 'confirmed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

  -- Productivity topic captures
  ('c0000001-0000-0000-0000-000000000008', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000003', 'url', 'Building a Second Brain: Capture, Organize, Distill, Express', 'The PARA method organizes information into Projects, Areas, Resources, and Archives. Key insight: separate actionable projects from reference material. Progressive summarization (highlighting bolds, then bolds within bolds) surfaces key ideas over time. The CODA framework (Capture, Organize, Distill, Express) provides a complete workflow for knowledge workers.', 'https://buildingsb.com/', '{"confidence": 0.93, "key_claims": ["PARA separates actionable projects from reference material", "Progressive summarization surfaces key ideas over time", "CODA framework provides complete knowledge workflow"]}', 'confirmed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

  ('c0000001-0000-0000-0000-000000000009', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000003', 'url', 'Zettelkasten Method for Academic Research', 'The Zettelkasten method creates atomic, linked notes. Each note represents a single idea with permanent IDs. Literature notes capture others'' ideas, permanent notes contain your own thinking in your own words. The linking structure creates emergent connections. Digital tools like Obsidian and Logseq implement this with backlinks and graph views.', 'https://zettelkasten.de/', '{"confidence": 0.85, "key_claims": ["Each note represents a single atomic idea", "Permanent IDs enable stable linking", "Literature notes capture others ideas, permanent notes your own"]}', 'confirmed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

  -- A pending capture for demo
  ('c0000001-0000-0000-0000-000000000010', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'url', 'Mixture of Experts for Efficient LLM Inference', 'Mixture of Experts (MoE) models activate only a subset of parameters per token, enabling larger model capacity without proportional compute cost. Mixtral 8x7B demonstrates competitive performance with dense models 2-3x its active parameter count. Routing networks learn to specialize experts on different types of reasoning.', 'https://arxiv.org/abs/2401.04088', '{"confidence": 0.9}', 'pending', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- ============================================================
-- Memories (extracted from confirmed captures)
-- ============================================================

INSERT INTO memories (id, user_id, project_id, capture_id, content, summary, metadata, created_at, updated_at) VALUES
  -- RAG topic memories
  ('m0000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'RAG combines a retrieval system with a seq2seq model. The retrieval component fetches relevant documents from a large corpus, and the generator synthesizes answers using the retrieved context. RAG achieves state-of-the-art on open-domain QA and reduces hallucination by grounding generation in external knowledge.',
   'RAG grounds generation in retrieved external knowledge to reduce hallucination and achieve SOTA on open-domain QA',
   '{"confidence": 0.95, "key_claims": ["RAG combines retrieval with generation to reduce hallucination", "Achieves SOTA on open-domain QA tasks", "Retrieved context grounds model outputs in factual knowledge"]}',
   NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),

  ('m0000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002',
   'Production RAG systems face latency challenges at scale. Hybrid search (combining sparse and dense retrieval) consistently outperforms pure vector search by 15-20% on recall@k metrics. pgvector is viable for moderate-scale production use.',
   'Hybrid search combining sparse and dense retrieval outperforms pure vector search by 15-20% on recall@k',
   '{"confidence": 0.88, "key_claims": ["Hybrid search outperforms pure vector search by 15-20%", "Chunking strategy significantly impacts retrieval quality"]}',
   NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  ('m0000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003',
   'Effective chunking strategies include fixed-size with overlap (10-20% reduces boundary information loss), sentence-based (preserves semantic boundaries), semantic chunking using embeddings (groups related sentences but adds cost), and document-structure-based (uses headings and sections).',
   'Overlap of 10-20% reduces boundary information loss; semantic chunking improves coherence at computational cost',
   '{"confidence": 0.91, "key_claims": ["Overlap of 10-20% reduces boundary information loss", "Semantic chunking adds computational cost but improves coherence"]}',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  ('m0000001-0000-0000-0000-000000000004', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004',
   'Key RAG evaluation metrics: Context Relevance (retrieved chunks on-topic?), Faithfulness (answer follows from context?), Answer Relevance (answer addresses the question?). RAGAS framework provides automated evaluation.',
   'RAG evaluation uses Context Relevance, Faithfulness, and Answer Relevance metrics; RAGAS provides automated evaluation',
   '{"confidence": 0.7}',
   NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

  -- AI Agents topic memories
  ('m0000001-0000-0000-0000-000000000005', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000005',
   'LangGraph extends LangChain with graph-based agent orchestration. Key features: stateful conversations, cyclic agent loops, human-in-the-loop breakpoints, and persistent memory. The StateGraph abstraction maps well to complex workflows where agents need to loop, branch, and backtrack.',
   'LangGraph provides stateful, cyclic agent orchestration via StateGraph; more control than CrewAI but more setup required',
   '{"confidence": 0.92, "key_claims": ["LangGraph offers cyclic agent loops and backtracking", "StateGraph abstraction maps to complex workflows"]}',
   NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

  ('m0000001-0000-0000-0000-000000000006', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000006',
   'CrewAI defines agents with roles, goals, and backstories. Tasks assigned sequentially or hierarchically. Lower barrier to entry than LangGraph, but less control over execution flow. Best for well-defined sequential workflows.',
   'CrewAI offers role-based agent orchestration with lower setup cost but less control than LangGraph',
   '{"confidence": 0.87, "key_claims": ["CrewAI agents have roles, goals, and backstories", "Lower barrier to entry than LangGraph", "Less control over execution flow"]}',
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

  ('m0000001-0000-0000-0000-000000000007', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000007',
   'AutoGen enables multi-agent conversations with customizable agents. The AssistantAgent and UserProxyAgent pattern enables human-AI collaboration. Supports nested conversations and code execution in sandboxed environments.',
   'AutoGen supports nested multi-agent conversations with human-AI collaboration via UserProxyAgent pattern',
   '{"confidence": 0.89, "key_claims": ["AutoGen supports multi-agent conversations with different LLMs", "UserProxyAgent pattern enables human-AI collaboration"]}',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

  -- Productivity topic memories
  ('m0000001-0000-0000-0000-000000000008', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000008',
   'PARA method organizes into Projects (actionable), Areas (ongoing responsibilities), Resources (interests), Archives (inactive). Progressive summarization surfaces key ideas over time. CODA framework: Capture, Organize, Distill, Express.',
   'PARA organizes knowledge into Projects, Areas, Resources, Archives; progressive summarization surfaces key ideas',
   '{"confidence": 0.93, "key_claims": ["PARA separates actionable projects from reference material", "Progressive summarization surfaces key ideas over time"]}',
   NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

  ('m0000001-0000-0000-0000-000000000009', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000009',
   'Zettelkasten creates atomic linked notes with permanent IDs. Literature notes capture others'' ideas; permanent notes contain your own thinking. Digital tools like Obsidian implement this with backlinks and graph views for emergent connections.',
   'Zettelkasten uses atomic linked notes with permanent IDs; digital tools enable emergent connections via backlinks',
   '{"confidence": 0.85, "key_claims": ["Each note represents a single atomic idea", "Permanent IDs enable stable linking"]}',
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days');

-- ============================================================
-- Briefs
-- ============================================================

INSERT INTO briefs (id, user_id, project_id, title, content, type, status, metadata, created_at, updated_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001',
   'RAG Systems: Current State and Best Practices',
   '## Overview of RAG Systems

Retrieval-Augmented Generation (RAG) has emerged as the dominant pattern for building knowledge-intensive AI applications. By combining a retrieval system with a generative model, RAG reduces hallucination and grounds outputs in factual knowledge [M1].

## Key Findings

### Hybrid Search Outperforms Pure Vector Search
Production RAG systems that combine sparse (keyword) and dense (vector) retrieval consistently outperform pure vector search by 15-20% on recall@k metrics [M2]. This is particularly important at scale where latency and accuracy both matter.

### Chunking Strategy Matters
The choice of chunking strategy significantly impacts retrieval quality [M2]. Options include:
- Fixed-size with 10-20% overlap — simple but may split semantic units
- Sentence-based — preserves semantic boundaries
- Semantic chunking using embeddings — improves coherence at computational cost
- Document-structure-based — uses headings and sections as natural boundaries [M3]

### Evaluation Frameworks
The RAGAS framework provides automated evaluation across three dimensions: Context Relevance, Faithfulness, and Answer Relevance [M4]. These metrics are essential for benchmarking production RAG systems.

## Recommendations

1. Start with hybrid search (sparse + dense) rather than pure vector search
2. Use 10-20% overlap in fixed-size chunking as a baseline
3. Benchmark with RAGAS metrics before deploying to production',
   'project', 'completed', '{"confidence": 0.94}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

  ('b0000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002',
   'AI Agent Frameworks Comparison', NULL, 'project', 'processing', '{}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('b0000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000003',
   'Knowledge Management for Researchers', NULL, 'daily', 'pending', '{}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');

-- ============================================================
-- Brief-Memory Citations
-- ============================================================

INSERT INTO brief_memories (brief_id, memory_id, relevance) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000001', 'Core definition of RAG and its key advantage'),
  ('b0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000002', 'Hybrid search performance data'),
  ('b0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000003', 'Chunking strategy comparison'),
  ('b0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000004', 'Evaluation metrics framework');

-- ============================================================
-- Memory Associations
-- ============================================================

INSERT INTO memory_associations (id, user_id, from_memory_id, to_memory_id, relation_type, note, created_at) VALUES
  ('ma000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'm0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000002', 'supports', 'Hybrid search is a technique that makes RAG more effective'),
  ('ma000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'm0000001-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000003', 'elaborates', 'Chunking strategy directly affects retrieval quality metrics'),
  ('ma000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'm0000001-0000-0000-0000-0000-000000000005', 'm0000001-0000-0000-0000-000000000006', 'contradicts', 'LangGraph vs CrewAI: more control vs lower barrier to entry'),
  ('ma000001-0000-0000-0000-000000000004', 'DEMO_USER_ID', 'm0000001-0000-0000-0000-000000000008', 'm0000001-0000-0000-0000-000000000009', 'related', 'PARA and Zettelkasten are complementary knowledge management methods');

-- ============================================================
-- Signal Rules
-- ============================================================

INSERT INTO signal_rules (id, user_id, project_id, name, query, match_type, channel_type, channel_config, is_active, last_checked_at, created_at, updated_at) VALUES
  ('sr000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'RAG & Retrieval Mentions', 'retrieval-augmented generation', 'keyword', 'internal', '{}', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),
  ('sr000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'AI Agent News', 'multi-agent framework', 'keyword', 'internal', '{}', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),
  ('sr000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'LangChain Blog', 'langchain', 'keyword', 'rss', '{"feed_url": "https://blog.langchain.dev/feed.xml"}', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days');

-- ============================================================
-- Signal Matches
-- ============================================================

INSERT INTO signal_matches (id, user_id, signal_rule_id, memory_id, matched_text, is_dismissed, matched_at, created_at) VALUES
  ('sm000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'sr000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000001', 'retrieval-augmented generation', false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('sm000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'sr000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000002', 'retrieval-augmented generation', false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================================
-- Recalls
-- ============================================================

INSERT INTO recalls (id, user_id, project_id, memory_id, reason, priority, reason_detail, scheduled_at, created_at) VALUES
  ('r0000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000001', 'time_based', 'high', 'Not reviewed in 13 days — this is a foundational RAG concept', NOW(), NOW()),
  ('r0000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000003', 'association_dense', 'medium', 'Connected to 2 other memories via associations', NOW(), NOW()),
  ('r0000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'a0000001-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000006', 'project_active', 'low', 'Topic recently updated with new capture', NOW(), NOW());

-- ============================================================
-- Jobs (a few processing/completed jobs for realism)
-- ============================================================

INSERT INTO jobs (id, user_id, type, status, input, output, created_at, updated_at) VALUES
  ('j0000001-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'ingestion', 'completed', '{"capture_id": "c0000001-0000-0000-0000-000000000001"}', '{"memories_created": 1}', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ('j0000001-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'extraction', 'completed', '{"capture_id": "c0000001-0000-0000-0000-000000000001"}', '{"memories_extracted": 1}', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ('j0000001-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'briefing', 'completed', '{"project_id": "a0000001-0000-0000-0000-000000000001"}', '{"brief_id": "b0000001-0000-0000-0000-000000000001"}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('j0000001-0000-0000-0000-000000000004', 'DEMO_USER_ID', 'brief', 'processing', '{"project_id": "a0000001-0000-0000-0000-000000000002"}', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('j0000001-0000-0000-0000-000000000005', 'DEMO_USER_ID', 'signal', 'completed', '{"signal_rule_id": "sr000001-0000-0000-0000-000000000001"}', '{"matches_found": 2}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');