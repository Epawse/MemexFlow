#!/usr/bin/env node
// Seed demo data into MemexFlow cloud Supabase
// Usage: node scripts/seed-demo.mjs <USER_ID>
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env (find it in Supabase Dashboard → Settings → API)
// The service role key bypasses RLS, which is needed for seeding.

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.argv[2];

if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL in .env");
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("Find it at: Supabase Dashboard → Settings → API → service_role key");
  process.exit(1);
}
if (!userId) {
  console.error("Usage: node scripts/seed-demo.mjs <USER_ID>");
  console.error("Get your User ID from Supabase Dashboard → Authentication → Users");
  process.exit(1);
}

// Service role client bypasses RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(now.getTime() - n * 3600000).toISOString();

// Deterministic UUID v4 from seed index (valid hex-only format)
function uuid(seed, index = 0) {
  const hex = (n) => n.toString(16).padStart(8, "0");
  const prefix = hex(seed);
  return `${prefix}0001-${hex(index).slice(0, 4)}-4${hex(index + 1).slice(0, 3)}-a${hex(index + 2).slice(0, 3)}-${hex(seed)}${hex(index)}00000000`.slice(0, 36);
}

async function seed() {
  console.log(`Seeding data for user: ${userId}`);

  // ── Topics ─────────────────────────────────────────────────────────
  const topics = [
    { id: uuid(1, 1), title: "RAG & Retrieval Systems", description: "Research on retrieval-augmented generation, vector databases, and knowledge retrieval methods", color: "#6366f1", archived: false, created_at: daysAgo(14), updated_at: hoursAgo(2) },
    { id: uuid(1, 2), title: "AI Agent Frameworks", description: "Comparing LangGraph, CrewAI, AutoGen, and other multi-agent orchestration frameworks", color: "#ec4899", archived: false, created_at: daysAgo(10), updated_at: daysAgo(1) },
    { id: uuid(1, 3), title: "Productivity Systems", description: "Personal knowledge management, second brain, and workflow automation for researchers", color: "#22c55e", archived: false, created_at: daysAgo(7), updated_at: hoursAgo(3) },
  ];
  for (const t of topics) {
    const { error } = await supabase.from("projects").upsert({ ...t, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  projects:", error.message);
  }
  console.log("  ✓ 3 topics");

  // ── Captures ───────────────────────────────────────────────────────
  const captures = [
    { id: uuid(2, 1), project_id: topics[0].id, type: "url", title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", content: "Retrieval-Augmented Generation (RAG) combines a retrieval system with a seq2seq model. The retrieval component fetches relevant documents from a large corpus, and the generator synthesizes answers using the retrieved context. Key findings: RAG models achieve state-of-the-art results on open-domain QA, fact verification, and Jeopardy question generation. The approach reduces hallucination by grounding generation in external knowledge.", url: "https://arxiv.org/abs/2005.11401", metadata: { confidence: 0.95, key_claims: ["RAG combines retrieval with generation to reduce hallucination", "Achieves SOTA on open-domain QA tasks", "Retrieved context grounds model outputs in factual knowledge"] }, status: "confirmed", created_at: daysAgo(13), updated_at: daysAgo(13) },
    { id: uuid(2, 2), project_id: topics[0].id, type: "url", title: "Vector Search at Scale: Building Production RAG Systems", content: "Production RAG systems face challenges with vector search at scale: latency increases with index size, embedding quality varies by model choice, and chunking strategy significantly impacts retrieval quality. Hybrid search (combining sparse and dense retrieval) consistently outperforms pure vector search by 15-20% on recall@k metrics.", url: "https://blog.pinecone.io/vector-search-at-scale", metadata: { confidence: 0.88, key_claims: ["Hybrid search outperforms pure vector search by 15-20%", "Chunking strategy significantly impacts retrieval quality", "pgvector is viable for moderate-scale production use"] }, status: "confirmed", created_at: daysAgo(12), updated_at: daysAgo(12) },
    { id: uuid(2, 3), project_id: topics[0].id, type: "url", title: "Chunking Strategies for RAG: A Comprehensive Evaluation", content: "Effective chunking strategies for RAG include: (1) Fixed-size with overlap — simple but may split semantic units; (2) Sentence-based — preserves semantic boundaries but creates variable-size chunks; (3) Semantic chunking using embeddings — groups related sentences but adds computational cost; (4) Document-structure-based — uses headings, paragraphs, and sections as natural boundaries.", url: "https://arxiv.org/abs/2405.09543", metadata: { confidence: 0.91, key_claims: ["Overlap of 10-20% reduces boundary information loss", "Semantic chunking adds computational cost but improves coherence"] }, status: "confirmed", created_at: daysAgo(10), updated_at: daysAgo(10) },
    { id: uuid(2, 4), project_id: topics[0].id, type: "note", title: "Personal note: RAG evaluation framework ideas", content: "Key metrics for evaluating RAG systems: Context Relevance, Faithfulness, Answer Relevance. The RAGAS framework provides automated evaluation. Need to benchmark our system against these metrics before demo.", url: null, metadata: { confidence: 0.7 }, status: "confirmed", created_at: daysAgo(8), updated_at: daysAgo(8) },
    { id: uuid(2, 5), project_id: topics[1].id, type: "url", title: "LangGraph: Building Multi-Agent Systems", content: "LangGraph extends LangChain with graph-based agent orchestration. Key features: stateful conversations, cyclic agent loops, human-in-the-loop breakpoints, and persistent memory. Compared to CrewAI, LangGraph offers more control over agent flow but requires more setup.", url: "https://langchain-ai.github.io/langgraph/", metadata: { confidence: 0.92, key_claims: ["LangGraph offers cyclic agent loops and backtracking", "StateGraph abstraction maps to complex workflows", "More control but more setup than CrewAI"] }, status: "confirmed", created_at: daysAgo(9), updated_at: daysAgo(9) },
    { id: uuid(2, 6), project_id: topics[1].id, type: "url", title: "CrewAI: Orchestrating Role-Playing AI Agents", content: "CrewAI defines agents with roles, goals, and backstories. Tasks are assigned sequentially or hierarchically. Lower barrier to entry than LangGraph, but less control over execution flow. Best for well-defined, sequential workflows.", url: "https://docs.crewai.com/", metadata: { confidence: 0.87, key_claims: ["CrewAI agents have roles, goals, and backstories", "Lower barrier to entry than LangGraph", "Less control over execution flow"] }, status: "confirmed", created_at: daysAgo(7), updated_at: daysAgo(7) },
    { id: uuid(2, 7), project_id: topics[1].id, type: "url", title: "AutoGen: Enabling Next-Gen LLM Applications", content: "AutoGen enables multi-agent conversations with customizable agents. The AssistantAgent and UserProxyAgent pattern enables human-AI collaboration. Supports nested conversations and code execution in sandboxed environments.", url: "https://microsoft.github.io/autogen/", metadata: { confidence: 0.89, key_claims: ["AutoGen supports multi-agent conversations with different LLMs", "UserProxyAgent pattern enables human-AI collaboration"] }, status: "confirmed", created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: uuid(2, 8), project_id: topics[2].id, type: "url", title: "Building a Second Brain: Capture, Organize, Distill, Express", content: "The PARA method organizes information into Projects, Areas, Resources, and Archives. Progressive summarization surfaces key ideas over time. The CODA framework provides a complete workflow for knowledge workers.", url: "https://buildingsb.com/", metadata: { confidence: 0.93, key_claims: ["PARA separates actionable projects from reference material", "Progressive summarization surfaces key ideas over time"] }, status: "confirmed", created_at: daysAgo(6), updated_at: daysAgo(6) },
    { id: uuid(2, 9), project_id: topics[2].id, type: "url", title: "Zettelkasten Method for Academic Research", content: "The Zettelkasten method creates atomic, linked notes. Each note represents a single idea with permanent IDs. Literature notes capture others' ideas, permanent notes contain your own thinking. Digital tools like Obsidian implement this with backlinks and graph views.", url: "https://zettelkasten.de/", metadata: { confidence: 0.85, key_claims: ["Each note represents a single atomic idea", "Permanent IDs enable stable linking"] }, status: "confirmed", created_at: daysAgo(4), updated_at: daysAgo(4) },
    { id: uuid(2, 10), project_id: topics[0].id, type: "url", title: "Mixture of Experts for Efficient LLM Inference", content: "Mixture of Experts (MoE) models activate only a subset of parameters per token, enabling larger model capacity without proportional compute cost. Mixtral 8x7B demonstrates competitive performance with dense models 2-3x its active parameter count.", url: "https://arxiv.org/abs/2401.04088", metadata: { confidence: 0.9 }, status: "pending", created_at: hoursAgo(1), updated_at: hoursAgo(1) },
  ];
  for (const c of captures) {
    const { error } = await supabase.from("captures").upsert({ ...c, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  captures:", error.message);
  }
  console.log("  ✓ 10 captures (9 confirmed, 1 pending)");

  // ── Memories ───────────────────────────────────────────────────────
  const memories = [
    { id: uuid(3, 1), project_id: topics[0].id, capture_id: captures[0].id, content: "RAG combines a retrieval system with a seq2seq model. The retrieval component fetches relevant documents from a large corpus, and the generator synthesizes answers using the retrieved context. RAG achieves state-of-the-art on open-domain QA and reduces hallucination by grounding generation in external knowledge.", summary: "RAG grounds generation in retrieved external knowledge to reduce hallucination and achieve SOTA on open-domain QA", metadata: { confidence: 0.95, key_claims: ["RAG combines retrieval with generation to reduce hallucination", "Achieves SOTA on open-domain QA tasks"] }, created_at: daysAgo(13), updated_at: daysAgo(13) },
    { id: uuid(3, 2), project_id: topics[0].id, capture_id: captures[1].id, content: "Production RAG systems face latency challenges at scale. Hybrid search (combining sparse and dense retrieval) consistently outperforms pure vector search by 15-20% on recall@k metrics. pgvector is viable for moderate-scale production use.", summary: "Hybrid search combining sparse and dense retrieval outperforms pure vector search by 15-20% on recall@k", metadata: { confidence: 0.88, key_claims: ["Hybrid search outperforms pure vector search by 15-20%", "Chunking strategy significantly impacts retrieval quality"] }, created_at: daysAgo(12), updated_at: daysAgo(12) },
    { id: uuid(3, 3), project_id: topics[0].id, capture_id: captures[2].id, content: "Effective chunking strategies include fixed-size with overlap (10-20% reduces boundary information loss), sentence-based (preserves semantic boundaries), semantic chunking using embeddings (groups related sentences but adds cost), and document-structure-based (uses headings and sections).", summary: "Overlap of 10-20% reduces boundary information loss; semantic chunking improves coherence at computational cost", metadata: { confidence: 0.91, key_claims: ["Overlap of 10-20% reduces boundary information loss", "Semantic chunking adds computational cost but improves coherence"] }, created_at: daysAgo(10), updated_at: daysAgo(10) },
    { id: uuid(3, 4), project_id: topics[0].id, capture_id: captures[3].id, content: "Key RAG evaluation metrics: Context Relevance (retrieved chunks on-topic?), Faithfulness (answer follows from context?), Answer Relevance (answer addresses the question?). RAGAS framework provides automated evaluation.", summary: "RAG evaluation uses Context Relevance, Faithfulness, and Answer Relevance metrics; RAGAS provides automated evaluation", metadata: { confidence: 0.7 }, created_at: daysAgo(8), updated_at: daysAgo(8) },
    { id: uuid(3, 5), project_id: topics[1].id, capture_id: captures[4].id, content: "LangGraph extends LangChain with graph-based agent orchestration. Key features: stateful conversations, cyclic agent loops, human-in-the-loop breakpoints, and persistent memory. The StateGraph abstraction maps well to complex workflows where agents need to loop, branch, and backtrack.", summary: "LangGraph provides stateful, cyclic agent orchestration via StateGraph; more control than CrewAI but more setup required", metadata: { confidence: 0.92, key_claims: ["LangGraph offers cyclic agent loops and backtracking", "StateGraph abstraction maps to complex workflows"] }, created_at: daysAgo(9), updated_at: daysAgo(9) },
    { id: uuid(3, 6), project_id: topics[1].id, capture_id: captures[5].id, content: "CrewAI defines agents with roles, goals, and backstories. Tasks assigned sequentially or hierarchically. Lower barrier to entry than LangGraph, but less control over execution flow. Best for well-defined sequential workflows.", summary: "CrewAI offers role-based agent orchestration with lower setup cost but less control than LangGraph", metadata: { confidence: 0.87, key_claims: ["CrewAI agents have roles, goals, and backstories", "Lower barrier to entry than LangGraph"] }, created_at: daysAgo(7), updated_at: daysAgo(7) },
    { id: uuid(3, 7), project_id: topics[1].id, capture_id: captures[6].id, content: "AutoGen enables multi-agent conversations with customizable agents. The AssistantAgent and UserProxyAgent pattern enables human-AI collaboration. Supports nested conversations and code execution in sandboxed environments.", summary: "AutoGen supports nested multi-agent conversations with human-AI collaboration via UserProxyAgent pattern", metadata: { confidence: 0.89, key_claims: ["AutoGen supports multi-agent conversations with different LLMs", "UserProxyAgent pattern enables human-AI collaboration"] }, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: uuid(3, 8), project_id: topics[2].id, capture_id: captures[7].id, content: "PARA method organizes into Projects (actionable), Areas (ongoing responsibilities), Resources (interests), Archives (inactive). Progressive summarization surfaces key ideas over time. CODA framework: Capture, Organize, Distill, Express.", summary: "PARA organizes knowledge into Projects, Areas, Resources, Archives; progressive summarization surfaces key ideas", metadata: { confidence: 0.93, key_claims: ["PARA separates actionable projects from reference material", "Progressive summarization surfaces key ideas over time"] }, created_at: daysAgo(6), updated_at: daysAgo(6) },
    { id: uuid(3, 9), project_id: topics[2].id, capture_id: captures[8].id, content: "Zettelkasten creates atomic linked notes with permanent IDs. Literature notes capture others' ideas; permanent notes contain your own thinking. Digital tools like Obsidian implement this with backlinks and graph views for emergent connections.", summary: "Zettelkasten uses atomic linked notes with permanent IDs; digital tools enable emergent connections via backlinks", metadata: { confidence: 0.85, key_claims: ["Each note represents a single atomic idea", "Permanent IDs enable stable linking"] }, created_at: daysAgo(4), updated_at: daysAgo(4) },
  ];
  for (const m of memories) {
    const { error } = await supabase.from("memories").upsert({ ...m, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  memories:", error.message);
  }
  console.log("  ✓ 9 memories");

  // ── Briefs ─────────────────────────────────────────────────────────
  const briefs = [
    { id: uuid(4, 1), project_id: topics[0].id, title: "RAG Systems: Current State and Best Practices", content: "## Overview of RAG Systems\n\nRetrieval-Augmented Generation (RAG) has emerged as the dominant pattern for building knowledge-intensive AI applications. By combining a retrieval system with a generative model, RAG reduces hallucination and grounds outputs in factual knowledge [M1].\n\n## Key Findings\n\n### Hybrid Search Outperforms Pure Vector Search\nProduction RAG systems that combine sparse (keyword) and dense (vector) retrieval consistently outperform pure vector search by 15-20% on recall@k metrics [M2]. This is particularly important at scale where latency and accuracy both matter.\n\n### Chunking Strategy Matters\nThe choice of chunking strategy significantly impacts retrieval quality [M2]. Options include:\n- Fixed-size with 10-20% overlap — simple but may split semantic units\n- Sentence-based — preserves semantic boundaries\n- Semantic chunking using embeddings — improves coherence at computational cost\n- Document-structure-based — uses headings and sections as natural boundaries [M3]\n\n### Evaluation Frameworks\nThe RAGAS framework provides automated evaluation across three dimensions: Context Relevance, Faithfulness, and Answer Relevance [M4]. These metrics are essential for benchmarking production RAG systems.\n\n## Recommendations\n\n1. Start with hybrid search (sparse + dense) rather than pure vector search\n2. Use 10-20% overlap in fixed-size chunking as a baseline\n3. Benchmark with RAGAS metrics before deploying to production", type: "project", status: "completed", metadata: { confidence: 0.94 }, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: uuid(4, 2), project_id: topics[1].id, title: "AI Agent Frameworks Comparison", content: "", type: "project", status: "processing", metadata: {}, created_at: hoursAgo(2), updated_at: hoursAgo(2) },
    { id: uuid(4, 3), project_id: topics[2].id, title: "Knowledge Management for Researchers", content: "", type: "daily", status: "pending", metadata: {}, created_at: hoursAgo(0.5), updated_at: hoursAgo(0.5) },
  ];
  for (const b of briefs) {
    const { error } = await supabase.from("briefs").upsert({ ...b, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  briefs:", error.message);
  }
  console.log("  ✓ 3 briefs (1 completed, 1 processing, 1 pending)");

  // ── Brief-Memory Citations ─────────────────────────────────────────
  const briefMemories = [
    { brief_id: briefs[0].id, memory_id: memories[0].id, relevance: "Core definition of RAG and its key advantage" },
    { brief_id: briefs[0].id, memory_id: memories[1].id, relevance: "Hybrid search performance data" },
    { brief_id: briefs[0].id, memory_id: memories[2].id, relevance: "Chunking strategy comparison" },
    { brief_id: briefs[0].id, memory_id: memories[3].id, relevance: "Evaluation metrics framework" },
  ];
  for (const bm of briefMemories) {
    const { error } = await supabase.from("brief_memories").upsert(bm, { onConflict: "brief_id,memory_id" });
    if (error) console.error("  brief_memories:", error.message);
  }
  console.log("  ✓ 4 brief-memory citations");

  // ── Memory Associations ────────────────────────────────────────────
  const associations = [
    { id: uuid(5, 1), from_memory_id: memories[0].id, to_memory_id: memories[1].id, relation_type: "supports", note: "Hybrid search is a technique that makes RAG more effective" },
    { id: uuid(5, 2), from_memory_id: memories[1].id, to_memory_id: memories[2].id, relation_type: "elaborates", note: "Chunking strategy directly affects retrieval quality metrics" },
    { id: uuid(5, 3), from_memory_id: memories[4].id, to_memory_id: memories[5].id, relation_type: "contradicts", note: "LangGraph vs CrewAI: more control vs lower barrier to entry" },
    { id: uuid(5, 4), from_memory_id: memories[7].id, to_memory_id: memories[8].id, relation_type: "related", note: "PARA and Zettelkasten are complementary knowledge management methods" },
  ];
  for (const a of associations) {
    const { error } = await supabase.from("memory_associations").upsert({ ...a, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  memory_associations:", error.message);
  }
  console.log("  ✓ 4 memory associations");

  // ── Signal Rules ───────────────────────────────────────────────────
  const signalRules = [
    { id: uuid(6, 1), project_id: topics[0].id, name: "RAG & Retrieval Mentions", query: "retrieval-augmented generation", match_type: "keyword", is_active: true, last_checked_at: daysAgo(1), created_at: daysAgo(6), updated_at: daysAgo(1) },
    { id: uuid(6, 2), project_id: topics[1].id, name: "AI Agent News", query: "multi-agent framework", match_type: "keyword", is_active: true, last_checked_at: daysAgo(3), created_at: daysAgo(8), updated_at: daysAgo(3) },
    { id: uuid(6, 3), project_id: topics[1].id, name: "LangChain Blog", query: "langchain", match_type: "keyword", is_active: true, last_checked_at: daysAgo(2), created_at: daysAgo(7), updated_at: daysAgo(2) },
  ];
  for (const sr of signalRules) {
    const { error } = await supabase.from("signal_rules").upsert({ ...sr, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  signal_rules:", error.message);
  }
  console.log("  ✓ 3 signal rules");

  // ── Signal Matches ─────────────────────────────────────────────────
  const signalMatches = [
    { id: uuid(7, 1), signal_rule_id: signalRules[0].id, memory_id: memories[0].id, matched_text: "retrieval-augmented generation", is_dismissed: false, matched_at: daysAgo(1) },
    { id: uuid(7, 2), signal_rule_id: signalRules[0].id, memory_id: memories[1].id, matched_text: "retrieval-augmented generation", is_dismissed: false, matched_at: daysAgo(1) },
  ];
  for (const sm of signalMatches) {
    const { error } = await supabase.from("signal_matches").upsert({ ...sm, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  signal_matches:", error.message);
  }
  console.log("  ✓ 2 signal matches");

  // ── Recalls ────────────────────────────────────────────────────────
  const recalls = [
    { id: uuid(8, 1), project_id: topics[0].id, memory_id: memories[0].id, reason: "time_based", priority: "high", reason_detail: "Not reviewed in 13 days — this is a foundational RAG concept", scheduled_at: now.toISOString(), created_at: now.toISOString() },
    { id: uuid(8, 2), project_id: topics[1].id, memory_id: memories[2].id, reason: "association_dense", priority: "medium", reason_detail: "Connected to 2 other memories via associations", scheduled_at: now.toISOString(), created_at: now.toISOString() },
    { id: uuid(8, 3), project_id: topics[1].id, memory_id: memories[5].id, reason: "project_active", priority: "low", reason_detail: "Topic recently updated with new capture", scheduled_at: now.toISOString(), created_at: now.toISOString() },
  ];
  for (const r of recalls) {
    const { error } = await supabase.from("recalls").upsert({ ...r, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  recalls:", error.message);
  }
  console.log("  ✓ 3 recall suggestions");

  // ── Jobs ───────────────────────────────────────────────────────────
  const jobs = [
    { id: uuid(9, 1), type: "ingestion", status: "completed", input: { capture_id: captures[0].id }, output: { memories_created: 1 }, created_at: daysAgo(13), updated_at: daysAgo(13) },
    { id: uuid(9, 3), type: "briefing", status: "completed", input: { project_id: topics[0].id }, output: { brief_id: briefs[0].id }, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: uuid(9, 4), type: "brief", status: "processing", input: { project_id: topics[1].id }, output: null, created_at: hoursAgo(2), updated_at: hoursAgo(2) },
    { id: uuid(9, 5), type: "signal", status: "completed", input: { signal_rule_id: signalRules[0].id }, output: { matches_found: 2 }, created_at: daysAgo(1), updated_at: daysAgo(1) },
  ];
  for (const j of jobs) {
    const { error } = await supabase.from("jobs").upsert({ ...j, user_id: userId }, { onConflict: "id" });
    if (error) console.error("  jobs:", error.message);
  }
  console.log("  ✓ 4 jobs");

  console.log("\n✅ Demo data seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});