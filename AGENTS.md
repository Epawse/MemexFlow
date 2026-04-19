<!-- TRELLIS:START -->

# Trellis Instructions

These instructions are for AI assistants working in this project.

Use the `/trellis:start` command when starting a new session to:

- Initialize your developer identity
- Understand current project context
- Read relevant guidelines

Use `@/.trellis/` to learn:

- Development workflow (`workflow.md`)
- Project structure guidelines (`spec/`)
- Developer workspace (`workspace/`)

If you're using Codex, project-scoped helpers may also live in:

- `.agents/skills/` for reusable Trellis skills
- `.codex/agents/` for optional custom subagents

Keep this managed block so 'trellis update' can refresh the instructions.

<!-- TRELLIS:END -->

## Goal

Build **MemexFlow** — a Tauri 2 desktop app for research knowledge management. The app captures URLs, extracts structured memories via AI, organizes them in projects, and generates research briefs. The project follows a Trellis-managed workflow with phases (Phase 0: Foundation ✅, Phase 1: Capture & Memory Pipeline — in progress).

## Instructions

- Follow Trellis workflow: PRD → plan → implement → test → record session
- Always write PRD **before** implementing for new phases
- Use commit message format: `type(scope): description`
- Record sessions with `python3 ./.trellis/scripts/add_session.py`
- Tailwind v4 custom colors go in `@theme {}` in `src/index.css`, NOT in `tailwind.config.js`
- For Supabase queries, use `(supabase.from('table') as any)` to bypass strict generated types
- Worker job `input` field stores JSON strings — must `json.loads()` in Python
- Gemini API: primary model is `gemini-3-flash-preview`, fallback is `gemini-2.5-flash` on 503
- Read `.trellis/spec/` guidelines before coding
- Troubleshooting docs are in `docs/troubleshooting/`