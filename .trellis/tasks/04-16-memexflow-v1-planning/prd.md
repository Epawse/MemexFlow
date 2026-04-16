# brainstorm: MemexFlow v1 Tech Stack & Scope

## Goal

Validate and finalize the tech stack for MemexFlow v1, and define the scope for a "basically usable product" (not a minimal MVP). Research the latest AI app ecosystem (as of 2026-04) to ensure we're making informed choices.

## What I already know

* Product: agent-native personal research OS — project-based memory, signals, briefs, recall
* Strategy doc (2026-04-15) originally recommended Flutter, now **decided: Tauri 2 + React/TS**
* User has Web full-stack background, leveraging React/TS for fastest velocity
* Target: macOS-first (Apple Silicon), Windows Phase 2
* Goal is an internship portfolio project that demonstrates product thinking
* User wants v1 to be a basically usable product, not a throwaway demo

## Assumptions (all confirmed)

* Supabase as managed backend — best managed Postgres + pgvector + Auth + Storage
* Python as AI worker — best ecosystem for LLM/PDF/embeddings
* Local-first with SQLite — PowerSync bridges Supabase ↔ SQLite from Day 1
* Frontend: Tauri 2 + React/TypeScript — web skills, fast dev, tiny bundle, desktop+web

## Decision 1 (ADR-lite): Frontend Framework

**Context**: Strategy doc recommended Flutter, but user has web full-stack background and wants fastest velocity to a usable v1.
**Decision**: Tauri 2 + React/TypeScript. Web frontend wrapped in Tauri for desktop.
**Consequences**: 
- Guidelines in `.trellis/spec/frontend/` need to be rewritten from Flutter/Dart to React/TypeScript
- PowerSync JS SDK instead of Flutter SDK (slightly less mature but functional)
- Can ship web version simultaneously — URL shareable for portfolio demos
- Mobile support deferred to later (Tauri mobile still maturing)

## Decision 2 (ADR-lite): Platform Strategy

**Context**: All major AI desktop apps (Claude, Codex, Gemini, Cowork) prioritize macOS/Apple Silicon. Codex and Claude use Electron; Gemini uses native Swift.
**Decision**: macOS-first (Apple Silicon) with Tauri 2. Windows as Phase 2. Web as Phase 3 (optional).
**Consequences**:
- Aligns with market direction (Codex M1+, Gemini Apple Silicon only, Cowork M1+ for agentic tab)
- Tauri 2 is lighter than Electron (2-10MB vs 150MB+), same cross-platform story
- Rust FFI can bridge to macOS APIs (including future Core AI/MCP from WWDC 2026)
- Windows support deferred but available from same codebase when ready

## Decision 3 (ADR-lite): Scope

**Context**: User wants a basically usable product, not a throwaway MVP.
**Decision**: Full 7 modules — Home, Projects, Capture, Signals, Memory, Briefs, Recall.
**Consequences**: Large scope requires phased implementation plan. Core value chain (Capture → Memory → Briefs) prioritized.

## Decision 4 (ADR-lite): Local-First Strategy

**Context**: Supabase has no built-in offline support. Need to decide whether to invest in PowerSync from day 1 or defer.
**Decision**: PowerSync from Day 1 — Postgres ↔ SQLite sync engine integrated from project start.
**Consequences**:
- Data model must be designed with sync in mind (PowerSync requires explicit sync rules)
- Local SQLite in Tauri provides instant UI response, offline capability from v1
- Adds upfront complexity but avoids painful migration later (schema + state management refactoring)
- Aligns with Hermes (SQLite FTS5) and Codex (SQLite) patterns — industry standard for desktop AI apps
- React Query + PowerSync JS SDK as the data layer

## Decision 5 (ADR-lite): Worker Communication

**Context**: Tauri frontend needs to trigger long-running AI jobs (ingestion, extraction, briefing). Options: (A) Python as Tauri sidecar, (B) Python as standalone service with Supabase as job queue, (C) Supabase Edge Functions (Deno only).
**Decision**: Supabase as job queue (pattern B). Frontend writes job records → Python worker polls Supabase → processes → writes results back → frontend subscribes via Realtime.
**Consequences**:
- No extra message broker infrastructure (Redis/RabbitMQ) needed for a single-user app
- Python worker can run locally (dev) or deployed (prod) — same mechanism
- PowerSync syncs job status to local SQLite — UI shows progress even offline
- Worker uses `postgres_listener` (Supabase Realtime) for push, with polling fallback
- Job states: `pending` → `running` → `completed` / `failed`, with progress percentage

## Decision 6 (ADR-lite): Authentication

**Context**: Tauri desktop app needs auth. Standard Web OAuth redirect doesn't work directly in desktop — need a flow that works for native apps.
**Decision**: Supabase Auth with PKCE flow. Tauri registers a deep-link (`memexflow://auth/callback`) as the redirect target. Supabase Auth handles email/password + OAuth providers (GitHub, Google).
**Consequences**:
- Deep-link registration required in Tauri config (both macOS and Windows)
- Session tokens stored securely in Tauri's Rust-side keychain integration (not localStorage)
- PowerSync sync rules are scoped per user via Supabase RLS policies
- No custom auth needed — Supabase handles password reset, email verification, OAuth

## Decision 7 (ADR-lite): Worker Deployment

**Context**: Python AI worker needs to run somewhere accessible. Dev vs prod have different constraints.
**Decision**: Local process in dev, Fly.io (or Railway) in prod. Same code, configured via environment variables.
**Consequences**:
- Dev: `python -m worker` runs locally, connects to Supabase project via env vars
- Prod: Deploy as Docker container on Fly.io — cheap ($3-5/month for single-user), auto-scales to zero when idle
- Worker is stateless — all state lives in Supabase. Can restart/redeploy without data loss
- Alternative: Railway (simpler deploy, slightly more expensive), Render (similar), or always-local (user runs worker on their machine — not ideal for portfolio demo)

## Open Questions

All resolved. Decisions 1-7 cover:
1. ~~Frontend framework~~ → Tauri 2 + React/TS
2. ~~Platform strategy~~ → macOS-first
3. ~~Scope~~ → Full 7 modules
4. ~~Local-first~~ → PowerSync from Day 1
5. ~~Worker communication~~ → Supabase as job queue
6. ~~Auth flow~~ → Supabase Auth with PKCE + deep-link
7. ~~Worker deployment~~ → Local (dev) / Fly.io (prod)

## Research Notes

### Desktop Framework Landscape (2026-04)

#### Tauri 2 (v2.10.x stable)
- 96% smaller than Electron, 50% less RAM
- Rust backend + any web frontend (React/Vue/Svelte/Next.js)
- Mobile support (Android + iOS) — functional but still maturing
- Growing 55% YoY on GitHub, production apps: Spacedrive, AppFlowy, Hoppscotch
- Security: audited by Radically Open Security, capability-based permissions
- **Limitation**: Next.js requires static export (no SSR in desktop)

#### Flutter (v3.41.x stable)
- Desktop support production-ready, Impeller rendering engine (40% CPU reduction)
- Multi-window support (useful for productivity apps)
- True single codebase for desktop + mobile + web
- Dart language (new learning curve for web devs)
- PowerSync has official Flutter SDK for local-first + Supabase

#### Electron (v34.x)
- Still dominant but plateauing. Heavy (150MB+ bundle, 200-400MB RAM)
- Mature ecosystem, VS Code / Discord / Slack
- Not recommended for new projects in 2026 unless team is fully JS-based

### Local-First / Offline Sync (2026-04)

#### PowerSync + Supabase
- Purpose-built Postgres ↔ SQLite sync engine
- First-class offline support, causal consistency
- SDKs for Flutter, React Native, JS/Web, Swift, Kotlin
- Handles conflict resolution (LWW default, custom merge support)
- **This is the recommended approach for local-first Supabase apps**

#### Supabase alone
- NO built-in offline support (community's #1 requested feature)
- Real-time subscriptions work, but no offline queue

### AI PKM Competitive Landscape (2026-04)

- **Tana**: "King of structured AI-native knowledge" — node-based, supertags, built-in AI
- **Capacities**: Object-based, AI understands knowledge graph, clean UI
- **Obsidian**: Plugin ecosystem, local-first, privacy-focused, no built-in AI
- **Notion AI**: Team-focused, $10/mo add-on, locked models
- **Read AI**: Personal knowledge graph across meetings/emails/messages

**MemexFlow's gap**: None of these do project-based research with long-term memory, evidence tracking, and agent-driven briefs. The positioning is valid.

### Agent Infrastructure Research (2026-04)

#### Hermes Agent (Nous Research) — Python, SQLite FTS5, self-improving
- **Core**: Python 3.11, ~8,900 lines in run_agent.py, 48 tools, 40 toolsets
- **Memory**: Three-tier — session (SQLite FTS5), persistent (MEMORY.md + USER.md in system prompt), external (8 pluggable providers: Mem0, Honcho, etc.)
- **Skills**: After 5+ tool calls, auto-generates SKILL.md (agentskills.io format). Progressive disclosure — load summary first, expand on demand. ~10ms retrieval over 10,000+ skills
- **Execution**: 6 backends (local, Docker, SSH, Daytona, Singularity, Modal)
- **Gateway**: 14 messaging platforms from single daemon
- **Key insight**: "The hard problem is memory and self-improvement" — Hermes improves 40% on repetitive tasks via skill accumulation
- **Growth**: 57,200 GitHub stars in 6 weeks (April 2026)
- **MemexFlow relevance**: SQLite FTS5 for memory search, skill format for procedural memory, three-tier memory model maps directly to episodic/semantic/procedural

#### OpenClaw — TypeScript/Node.js, gateway control plane
- **Core**: TypeScript ESM, Node 22+/Bun, hub-and-spoke architecture
- **Gateway**: Always-on control plane (port 18789) — session management, channel routing, tool dispatch, events
- **Channels**: 50+ messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, etc.)
- **Tools**: MCP bridge via mcporter, browser automation, file access, Docker sandboxing
- **Hooks**: Full lifecycle — before_agent_start → agent_end, before_tool_call → after_tool_call, etc.
- **Skills**: SKILL.md (markdown + YAML frontmatter, no SDK needed)
- **Security concern**: CVE-2026-25253 (patched RCE via WebSocket token leak) — highlights importance of security-first design
- **Ecosystem**: OpenClaw (general), NanoClaw (high security), ZeroClaw (Rust, edge)
- **Growth**: 340,000+ GitHub stars (March 2026)
- **MemexFlow relevance**: Gateway pattern for long-running services, hook/plugin architecture for extensibility, but MemexFlow is an app not an assistant

#### Claude Code — TypeScript, three-layer harness
- **Core**: ~500,000 lines TypeScript (leaked March 2026 via npm source map)
- **Architecture**: Three layers — QueryEngine.ts (46K lines, LLM orchestration) + base tool layer (29K lines, schema/permissions/errors) + ~40 modular tools
- **Tools**: 19 permission-gated tools (files, shell, git, web, MCP). Each tool implements uniform interface (identity, execution, validation, permissions, presentation)
- **Permissions**: Three tiers — auto-approved (reads), prompt (writes), classifier-gated (Sonnet 4.6 background classifier evaluates without seeing model prose)
- **MCP**: 6 transport types (Stdio, SSE, HTTP, WebSocket, SDK, ClaudeAiProxy). 25K token default limit, 500K max for disk-persisted results
- **Memory**: Three-layer — short-term context, session persistence, long-term memory files. Auto-compaction at 98% context usage
- **Key insight**: "The challenge of production AI is not about the model — it is about the harness"
- **MemexFlow relevance**: Permission model for agent actions, tool system design, harness pattern (model = intelligence, harness = control)

#### Claude Cowork — Desktop agent for knowledge work
- **GA**: April 9, 2026 on macOS + Windows, all paid tiers
- **Architecture**: Same agentic harness as Claude Code, adapted for non-coding knowledge work
- **Multi-agent**: "Team" features — multiple AI instances collaborate on complex tasks
- **Plugins**: Marketplace — bundle skills + connectors + sub-agents into role specialists
- **Connectors**: Zoom, AWS, n8n, Honeycomb, Fellow.ai (MCP-based)
- **Enterprise**: RBAC, spend limits, OpenTelemetry observability, SCIM integration
- **Users**: Non-engineering teams (ops, marketing, finance, legal) are majority of usage
- **MemexFlow relevance**: Shows market direction for desktop AI agents. Plugin/connector model. But Cowork is general-purpose; MemexFlow is research-specific

#### OpenAI Codex — Cloud sandbox, unified app server
- **Architecture**: Unified "App Server" powers CLI, VS Code, web, macOS, Windows, JetBrains, Xcode
- **Sandbox**: Each task runs in isolated cloud container. Internet disabled during execution. Only pre-loaded repo + dependencies
- **Desktop app**: macOS (Feb 2026), Windows (March 2026) — "command center for agents"
- **SuperApp**: March 2026 — merging ChatGPT + Codex + Atlas browser into single desktop app
- **Security**: Codex Security agent — scanned 1.2M commits, found 800 critical vulns
- **Models**: GPT-5.3-Codex, then Codex-Spark (15x faster, Cerebras hardware)
- **Growth**: 2M+ weekly active users (March 2026)
- **MemexFlow relevance**: Sandbox pattern for safe AI task execution, unified app server pattern for multi-client support

#### Agent Skills Standard (agentskills.io)
- **Format**: SKILL.md + scripts/ + references/ + assets/
- **Frontmatter**: YAML with name + description (required), optional fields
- **Body**: Markdown instructions, <5,000 tokens recommended
- **Progressive disclosure**: Metadata loaded first, full instructions on demand
- **Adopted by**: Claude Code, Codex CLI, Gemini CLI, GitHub Copilot, Cursor, Cline, Windsurf, OpenCode
- **Key insight**: Intentionally minimal. Portable across all major agent platforms
- **MemexFlow relevance**: Use for procedural memory / workflow templates. Interoperable with entire agent ecosystem

#### PKM + AI + MCP Ecosystem
- **Tana**: MCP server launched — Claude Code/Cursor can query/update Tana nodes directly. Supertags + live search nodes + AI command nodes
- **Capacities**: Object-based, Readwise integration, Kanban views, AI chat
- **AFFiNE**: MCP integration for document access
- **Readwise**: MCP server for reading highlights
- **Trend**: MCP is becoming the standard interop layer between PKM tools and AI agents
- **MemexFlow relevance**: Building an MCP server for MemexFlow would allow Claude Code, Cursor, etc. to access its knowledge base — massive value add

### Key Architectural Patterns Across Systems

| Pattern | Used by | MemexFlow application |
|---------|---------|----------------------|
| Three-tier memory | Hermes, Claude Code | Episodic (raw sources) / Semantic (extracted claims) / Procedural (workflow skills) |
| SQLite FTS5 for search | Hermes | Local full-text search over memories, fast retrieval |
| Gateway / control plane | OpenClaw, Hermes | Python worker as long-running service with job queue |
| agentskills.io format | Claude Code, Codex, Hermes | Procedural memory / workflow templates |
| MCP server | Tana, Readwise, AFFiNE | Expose MemexFlow knowledge base to external agents |
| Permission-gated tools | Claude Code | Agent actions require approval for writes/external calls |
| Harness pattern | Claude Code, Codex | Model provides intelligence, harness provides control |
| Event-driven hooks | OpenClaw | Plugin extensibility for custom workflows |

### Approach Evaluation (historical)

Three approaches were evaluated before selecting **Approach A** (see Decision 1):

- **Approach A (Selected)**: Tauri 2 + React/TS + Supabase + Python — leverages web skills, tiny bundles, desktop+web
- **Approach B (Rejected)**: Flutter + Supabase + PowerSync — best local-first story, but Dart learning curve too steep for timeline
- **Approach C (Rejected)**: Next.js web-only — fastest to ship, but doesn't differentiate and no offline capability

## Requirements (finalized)

* Cross-platform desktop app (macOS-first, Windows Phase 2)
* Local-first data architecture with PowerSync + Supabase sync
* AI-powered content ingestion and summarization (Python worker)
* Project-based knowledge organization (7 modules)
* Evidence-backed memory system
* Agent-native: MCP server for external agent integration

## Key User Flows

### Flow 1: Quick Capture (most frequent, < 30s)
> User finds an article → wants to save the key insight

1. Open MemexFlow (already running in background, or foreground)
2. Paste URL into Capture input (global shortcut or drag-drop)
3. Select target project (defaults to last active project)
4. System shows "Capturing..." → extraction runs in background
5. Within 30s, Memory cards appear in the project with extracted claims
6. User can optionally edit/tag memories immediately, or move on

**Key metric**: Time from paste to seeing first extracted memory < 30s.

### Flow 2: Research Review (weekly, 5-15 min)
> User wants to review what they've been capturing for a project

1. Open project → see Memory timeline (newest first)
2. Browse memories, click to see full source context
3. Link related memories (supports/contradicts/elaborates)
4. Request a Brief → system synthesizes memories into structured report
5. Review Brief, click through to source memories for verification

**Key metric**: Brief generation < 2 min for a project with 20+ memories.

### Flow 3: Knowledge Recall (on-demand, < 10s)
> User has a question about something they've researched before

1. Open Recall (global shortcut or sidebar)
2. Type natural language query ("What did I find about transformer attention mechanisms?")
3. System returns relevant memories with source evidence
4. Optionally, LLM synthesizes a grounded answer with citations

**Key metric**: Search results < 2s; synthesized answer < 15s.

### Flow 4: Signal Monitoring (passive, always-on)
> User wants to stay updated on research topics without active searching

1. Create a Signal rule in a project ("new papers about RAG", "competitor updates")
2. System periodically checks for matches
3. When match found → notification badge on Home + project
4. User reviews signal matches → dismiss or capture into memory

**Key metric**: Signal check interval configurable (default: daily).

## Design Direction

### Visual Identity
- **Tone**: Professional but not corporate. Think "researcher's workbench" not "startup dashboard".
- **Color**: Dark mode primary (reduce eye strain for long research sessions), light mode as alternative.
- **Typography**: System font stack for performance. Monospace accents for code/data.
- **Inspiration**: Linear (clarity), Notion (content density), Obsidian (knowledge graph).

### Layout Principles
- **Sidebar navigation** — Projects list + module tabs (Home, Capture, Memory, Briefs, Signals, Recall)
- **Content area** — List/card view for memories, document view for briefs, split view for source ↔ extracted
- **Command palette** (Phase 3) — Cmd+K for quick navigation and actions
- **Contextual panels** — Source detail slides in from right, not a full page navigation

### Interaction Philosophy
- **Inline over modal** — Prefer inline editing, expanding sections, and slide-panels over blocking modals
- **Progressive disclosure** — Show summary by default, expand for detail (matches agentskills.io pattern)
- **Undo over confirm** — Allow undo instead of "Are you sure?" dialogs where possible
- **Background processing** — AI jobs run in background; show progress, don't block the UI

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| App cold start | < 3s | First impression; Tauri advantage over Electron |
| Page/module switch | < 200ms | Must feel instant, not web-like page load |
| Local search (FTS5) | < 100ms | SQLite FTS5 easily achieves this for < 100K memories |
| Semantic search (pgvector) | < 2s | Network + vector similarity; acceptable for AI-powered feature |
| Capture ingestion | < 30s | URL fetch + LLM extraction; background job |
| Brief generation | < 2 min | Multiple memories + LLM synthesis; background job |
| Memory list render | < 16ms (60fps) | Smooth scrolling through memory cards |
| Offline availability | 100% read, queue writes | PowerSync handles this; all reads from local SQLite |

## Module Descriptions

### Home — Dashboard & Overview
The landing view. Shows what's changed since last visit: recent captures across all projects, active signals that fired, pending briefs, memory stats. Acts as the "ambient awareness" layer — quick glance tells you what's new without opening a specific project.

### Projects — Research Container
A project is a scoped workspace for a research topic. Each project has its own captures, memories, briefs, and signals. Basic v1: create, rename, archive, list. Enhanced v1: settings (description, color, tags), export (markdown/PDF), archive with date.

### Capture — Content Ingestion
The input funnel. Paste a URL, drag a PDF, or type raw text. The system extracts clean content (via Python worker ingestion job), stores it in Supabase Storage, and triggers the extraction pipeline. Supports: web articles, PDFs, plain text. Future: images, audio transcripts, browser extension.

### Memory — Knowledge Units
The core of MemexFlow's differentiation. Each Memory is an AI-extracted knowledge unit: a claim, summary, entity, or insight with source attribution (linked to Capture) and confidence score. Memories can link to each other via associations (supports, contradicts, elaborates). Searchable via FTS5 (local) and pgvector (semantic). This is the "evidence-backed memory" layer.

### Briefs — AI Research Reports
Auto-generated or user-requested research reports. A Brief synthesizes selected project memories into a structured document (executive summary, key findings, evidence, gaps, recommendations). Each Brief references specific Memories — every claim is traceable to source material. The "so what" of accumulated research.

### Signals — Proactive Monitoring
Rules that watch for new information relevant to your projects. A SignalRule defines what to watch for (keywords, topics, specific sources). When a match is found, it creates a SignalMatch and notifies the user. Think of it as "Google Alerts but for your research knowledge base." v1: keyword-based matching. Future: RSS feeds, API integrations, embedding-based semantic matching.

### Recall — Context-Aware Retrieval
Query your accumulated knowledge. Type a question, get relevant Memories with source evidence. Uses pgvector semantic search + FTS5 keyword search + optional LLM synthesis to generate a grounded answer. The difference from simple search: Recall understands context (which project, what you've been working on) and surfaces not just matches but associated evidence.

## Implementation Phases

### Phase 0: Foundation
> Project scaffold + data layer + basic UI framework
- Tauri 2 + React/TS project init, Supabase project + DB schema
- PowerSync integration (sync rules, SQLite local)
- Base UI component library + routing (React Router)
- Python worker init + basic job queue
- **Deliverable**: Running shell app with data sync pipeline working
- **Acceptance**:
  - [ ] `cargo tauri dev` launches app with React UI
  - [ ] Supabase schema created, RLS policies configured
  - [ ] PowerSync syncs a test table between Postgres ↔ SQLite
  - [ ] Python worker connects to Supabase, picks up a test job
  - [ ] Auth flow works: login → session → deep-link callback

### Phase 1: Capture & Memory
> Core value chain: capture content → extract structured memories
- Projects (basic): create/list projects as containers
- Capture: URL paste/drag → content extraction → store
- Memory (basic): AI extracts claims/summaries from captures → memory list
- Home (basic): dashboard with recent captures, active projects, stats
- Python worker: ingestion job + extraction job
- **Deliverable**: Paste URL → AI auto-extracts → structured memories
- **Acceptance**:
  - [ ] Create a project, see it in project list
  - [ ] Paste a URL → content extracted and stored within 30s
  - [ ] Extracted content shows as Memory cards with source attribution
  - [ ] Home dashboard shows recent captures and project stats
  - [ ] Offline: capture a URL while offline → syncs when back online

### Phase 2: Briefs & Signals
> Intelligence layer: auto-generate briefs, proactive signal monitoring
- Briefs: auto-generate research briefs from project memories
- Signals: keyword/topic tracking → periodic check → notifications
- Memory (enhanced): search, filter, evidence linking, associations
- Python worker: briefing job + signals job
- **Deliverable**: Complete Capture → Memory → Briefs value chain
- **Acceptance**:
  - [ ] Request a brief from project memories → generated within 2 min
  - [ ] Brief references specific memories with source links
  - [ ] Create a signal rule → matches show in notification area
  - [ ] Memory search returns relevant results (FTS5)
  - [ ] Link two memories as "supports" or "contradicts"

### Phase 3: Recall & Polish
> Final module + UX polish → basically usable product
- Recall: context-aware memory retrieval (query/conversational)
- Projects (enhanced): settings, archive, export
- Signals (enhanced): more sources (RSS, API)
- Global polish: shortcuts, drag-drop, animations, empty states, error handling
- **Deliverable**: All 7 modules working, portfolio-ready product
- **Acceptance**:
  - [ ] Recall query returns relevant memories with evidence
  - [ ] Export a project's memories/briefs as Markdown
  - [ ] App feels responsive: <200ms UI interactions, meaningful loading states
  - [ ] Empty states guide new users (no blank screens)
  - [ ] Error states are handled gracefully (worker down, API error, offline)

### Dependency Graph
```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3
Foundation    Capture     Briefs      Recall
              Memory      Signals     Polish
              Projects    (Memory+)
              Home
```

## Final Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Desktop | Tauri 2 | Rust backend, web frontend wrapper |
| Frontend | React 19 + TypeScript | React Router, Tailwind CSS |
| State/Cache | React Query + PowerSync JS | Server state + local sync |
| Local DB | SQLite (via PowerSync) | Offline-first, FTS5 for search |
| Remote DB | Supabase (Postgres + pgvector) | Managed, Auth, Storage, Realtime |
| Sync | PowerSync | Postgres ↔ SQLite bidirectional |
| Auth | Supabase Auth (PKCE + deep-link) | Email/password + OAuth (GitHub, Google) |
| AI Worker | Python | Ingestion, extraction, briefing, retrieval |
| Worker Deploy | Fly.io (prod) / local (dev) | Docker container, auto-scale to zero |
| AI Models | Claude API / OpenAI | Configurable, per-task model selection |
| Skills | agentskills.io format | Procedural memory / workflow templates |
| Interop | MCP Server | Expose knowledge base to external agents |
| Testing (FE) | Vitest + React Testing Library | Unit + component tests |
| Testing (BE) | pytest + Ruff + mypy | Unit + integration tests |
| CI | GitHub Actions | Lint + type check + test on push |

## Data Model (Core Entities)

```
User (Supabase Auth)
 └── Project (1:N)
      ├── Capture (1:N) — raw content: URL, PDF, text, image
      │    └── Memory (1:N) — extracted claim / summary / entity
      │         └── MemoryAssociation (M:N self-ref) — evidence links, contradictions
      ├── Memory (1:N) — project-scoped memories (from captures + manual)
      ├── Brief (1:N) — AI-generated research report
      │    └── BriefMemory (M:N) — which memories were referenced
      ├── SignalRule (1:N) — monitoring rule (keyword, topic, source)
      │    └── SignalMatch (1:N) — a signal that fired
      └── Recall (1:N) — context-aware retrieval session (future: RecallMemory M:N)
```

### Key Design Decisions
- **Capture vs Memory**: Capture is raw input (URL content, PDF text). Memory is the AI-extracted knowledge unit (claim + source + confidence). One Capture yields N Memories.
- **Evidence linking**: Memories link to other Memories via MemoryAssociation (supports, contradicts, elaborates). This is the "evidence-backed" differentiator.
- **pgvector**: Each Memory has an embedding vector for semantic search (Recall module).
- **FTS5 (local)**: PowerSync syncs memories to local SQLite with FTS5 index for instant local search.

## LLM Strategy

| Task | Model Tier | Rationale |
|------|-----------|-----------|
| Ingestion (URL → clean text) | Cheap (Haiku / GPT-4o-mini) | High volume, simple extraction |
| Extraction (text → claims) | Mid (Sonnet / GPT-4o) | Needs reasoning to identify claims and evidence |
| Embedding | Dedicated (text-embedding-3-small) | Not a chat model, optimized for vector similarity |
| Briefing (memories → brief) | Strong (Sonnet-4.6 / GPT-4o) | Needs synthesis, writing quality, citation |
| Recall (query → answer) | Mid (Sonnet) + embedding search | Search + optional synthesis |
| Signals matching | Rule-based + embedding | Mostly programmatic, LLM only for complex rules |

### Cost Management
- Estimated cost: $5-15/month for personal use (most calls use cheap models)
- All AI calls go through Python worker — easy to add caching, rate limiting, budget caps
- Embedding calls are batched (not real-time) — reduces API calls significantly
- Local embedding fallback: not in v1, but Tauri's Rust layer could run ONNX models later

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Tauri Desktop App                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ React UI │  │React Qry │  │PowerSync │  │   SQLite (local) │ │
│  │  (views) │←→│  (cache) │←→│   JS SDK │←→│ FTS5 + vectors   │ │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────────────────┘ │
└───────────────────────────────────┼──────────────────────────────┘
                                    │ bidirectional sync
┌───────────────────────────────────┼──────────────────────────────┐
│                         Supabase  │                              │
│  ┌──────────┐  ┌──────────┐  ┌───┴──────┐  ┌──────────────────┐ │
│  │  Auth    │  │ Storage  │  │ Postgres │  │   Realtime       │ │
│  │          │  │ (files)  │  │ +pgvector│  │   (subscriptions)│ │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────────────────┘ │
└───────────────────────────────────┼──────────────────────────────┘
                                    │ job queue (poll + push)
┌───────────────────────────────────┼──────────────────────────────┐
│                      Python AI Worker                            │
│  ┌──────────┐  ┌──────────┐  ┌───┴──────┐  ┌──────────────────┐ │
│  │Ingestion │  │Extraction│  │ Briefing │  │   Embeddings     │ │
│  │  jobs    │  │  jobs    │  │  jobs    │  │   (batched)      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ Signals  │  │  Recall  │     LLM APIs: Claude / OpenAI      │
│  │  jobs    │  │  jobs    │                                    │
│  └──────────┘  └──────────┘                                    │
└─────────────────────────────────────────────────────────────────┘

Flow: Capture → Ingest → Extract → Embed → Store
      Project memories → Brief request → Generate brief → Store
      User query → Embed search → Recall → (optional LLM synthesis)
      Signal rule → Periodic check → Match → Notify
```

## Out of Scope (v1)

* Mobile apps (iOS/Android) — deferred until Tauri mobile matures or React Native port
* Team/collaboration features — MemexFlow v1 is personal use only
* Plugin/extension marketplace — extensibility hooks only, no third-party plugins
* Payment/billing — no monetization in v1
* Multi-language UI — English only for v1
* Real-time collaboration (multi-user editing) — single user
* Browser extension (capture from web) — deferred to Phase 3 or later
* Local LLM support — cloud APIs only in v1 (Rust ONNX fallback is future)
* Custom model fine-tuning — use pre-trained models only
* Import from existing PKM tools (Notion, Obsidian) — manual entry only

## Acceptance Criteria (finalized)

* [x] Tech stack decision documented with clear rationale (4 ADR-lites)
* [x] v1 scope defined with feature list (7 modules)
* [x] Architecture and data flow defined (data flow diagram + entity model)
* [x] Clear implementation plan with phases (4 phases)
* [x] Worker communication pattern defined (Supabase as job queue)
* [x] LLM strategy defined (model tier per task)
* [x] Out of scope items listed

## Definition of Done

* [x] Tech stack validated against latest ecosystem (2026-04 research)
* [x] Scope agreed upon (full 7 modules, phased delivery)
* [x] PRD ready for implementation (all open questions resolved)

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PowerSync JS SDK maturity gaps | Medium | High | Evaluate SDK in Phase 0; if blocking, fall back to Supabase-only with React Query caching |
| Tauri 2 desktop native feel "webby" | Low | Medium | Invest in platform-native patterns (menus, shortcuts, drag-drop); use Tauri APIs for native integration |
| LLM API cost overruns | Low | Medium | Per-task model tiers; budget caps in worker; caching for repeated queries |
| Single-user Supabase free tier limits | Medium | Low | Free tier: 500MB DB, 1GB storage. Sufficient for personal use. Upgrade to Pro ($25/mo) if needed |
| Python worker cold start latency (Fly.io) | Medium | Low | Auto-scale to zero saves money; use Supabase Realtime push to wake worker; accept ~2s cold start |
| Scope creep (7 modules is ambitious) | High | High | Strict phase boundaries; each phase has a deliverable that works independently |
| Embedding quality for recall | Medium | Medium | Use established models (text-embedding-3-small); add re-ranking in Phase 3 if needed |

## Testing Strategy

Testing serves two purposes: correctness during development, and portfolio demonstration of engineering quality.

### Frontend (React + TypeScript)

| Type | Tool | Scope | When |
|------|------|-------|------|
| Unit | Vitest | Utility functions, hooks, data transformations | Per-phase |
| Component | Vitest + React Testing Library | UI components in isolation | Per-phase |
| Integration | Playwright (optional) | Key user flows (capture → memory) | Phase 2+ |

Guiding principle: test behavior, not implementation. A component test verifies "paste URL → shows loading → shows extracted content", not "setState was called with X".

### Backend (Python Worker)

| Type | Tool | Scope | When |
|------|------|-------|------|
| Unit | pytest | Individual job handlers, extraction logic, LLM prompts | Per-phase |
| Integration | pytest + test Supabase | Full job lifecycle (create → process → result) | Per-phase |
| Prompt | pytest + LLM fixtures | Extraction quality on golden examples | Phase 1+ |

Guiding principle: mock external APIs (LLM, web scraping), test against real Supabase (local or test project). Prompt tests use fixed LLM outputs to ensure parsing doesn't break.

### End-to-End (manual for v1)

No automated E2E in v1. Each phase's acceptance criteria are verified manually before moving to the next phase. Rationale: automated E2E for a desktop app is high effort, low ROI for a personal project. Focus testing budget where it catches the most bugs (unit + integration).

### CI (GitHub Actions)

```
on push:
  - frontend: lint (ESLint) + type check (tsc) + unit tests (Vitest)
  - backend: lint (Ruff) + type check (mypy) + unit tests (pytest)
  - no E2E in CI (manual verification)
```

## Technical Notes

* Strategy doc: `MemexFlow-2026Q2-Strategy.md` (original Flutter recommendation, superseded by this PRD)
* Product design: `KnowledgeClaw.md`
* Guidelines: `.trellis/spec/backend/` (current, Python), `.trellis/spec/frontend/` (needs rewrite from Flutter to React/TS)
* Sources: tech-insider.org, redskydigital.com, flutter.dev, v2.tauri.app, powersync.com, supabase.com, encore.dev

## Next Steps

1. Rewrite `.trellis/spec/frontend/` guidelines from Flutter/Dart to React/TypeScript
2. Update memory files (project_overview.md still says Flutter)
3. Create Phase 0 implementation task
4. Begin Phase 0 development
