# Scope AI

AI-first Swedish accounting platform. Users talk to Scooby (AI assistant), Scooby handles all accounting through chat. Next.js 16, React 19, Supabase, Vercel AI SDK, OpenAI GPT-5.

## Session Protocol

1. Run `git log --oneline -20` — this is the source of truth for what happened. Not notes, not memory.
2. Run `git status` — see what's uncommitted. Flag it immediately.
3. Read MEMORY.md and relevant domain files — cross-reference against code. Code wins.
4. Brief King: what was done, what's uncommitted, what's next. Don't wait to be asked.

## Your Workspace

**Path:** `/Users/rice/.claude/projects/-Users-rice-Development-startups-scope-ai/memory/`

This is your workspace. You maintain it. You keep it fresh. Everything that matters lives here — not in your context window.

### The Index
- `MEMORY.md` — auto-loaded into every conversation. Pointers only. Never put content here. Lines after 200 are truncated so keep entries to one line each.

### Foundation Files
- `agent_rules.md` — how you operate: session protocol, agentic behaviours, what makes you useful
- `founder.md` — King: solo founder, expectations, how to work with him
- `philosophy.md` — AI-first product philosophy
- `architecture.md` — stack, codebase map, key files, layout decisions

### Domain Files (`domain_*.md`)
One file per product area. Always describes the current state of that area — not what it used to be. Update immediately when you change code in that domain. Overwrite stale content, don't append to it.
- `domain_bookkeeping.md` — accounting engine, verifications, invoices, SIE, two-phase tool flow
- `domain_chat_scooby.md` — chat interface, Scooby engine, streaming, tools
- `domain_pages_overlays.md` — read-only pages, overlays, walkthrough overlay gap
- `domain_tools_services.md` — AI tools layer, service layer, isConfirmed pattern, schema gaps
- `domain_ownership.md` — aktiebok, meetings, dividends, partners, members
- `domain_payroll.md` — löner, payslips, employer contributions, benefits
- `domain_tax_reports.md` — K10, AGI, moms, INK2, årsredovisning, balansräkning
- `domain_funnel.md` — landing page, Stripe, onboarding, pre-launch gate
- `domain_settings.md` — configuration overlay, company info, billing
- `domain_test_ui.md` — four test surfaces: streaming, chat-tools, ai-overlays, read-only

### Improvements (`improvements/`)
Known issues found during scans. One file per area. Check before working in that area. `README.md` is the index.
**When a fix is implemented:** remove the item from the improvements file and update the relevant domain file to reflect the new reality. Files are never static — they always describe the current state of the codebase, not what it used to be.

### Specs & Planning
- `flows/` — how each feature should work (target spec)
- `pre-production/` — pre-production UI and system prompt specs
- `production/` — architecture of features actually built (reality)
- `progress.md` — workstream status and backlog
- `workstream_*.md` — per-workstream detail
- `pre-launch-strategy.md` — gate logic, launch checklist
- `scooby_behavior_spec.md` — how Scooby should feel and respond

### Feedback Files (`feedback_*.md`)
Behavioural rules from King — what to do, what not to do, and why. Read these when you're unsure how to approach something.

### What Goes Where
- **What happened / what's next** — `git log` is the record. Domain files describe current state.
- **Permanent knowledge about a domain** — `domain_*.md`
- **Known bugs and issues** — `improvements/`
- **How a feature should work** — `flows/`
- **King's behavioural guidance** — `feedback_*.md`

## Code Rules (Non-Negotiable)

- Zero tolerance: no `as any`, no `@ts-ignore`, no `@ts-nocheck`, no `eslint-disable`, no `// TODO: fix later`
- Architecture: Tools → Services → DB. No shortcuts. No direct DB from tools.
- Accounting entries through `src/lib/bookkeeping/` only — never raw inserts
- Tax rates, account plans, legal thresholds from data sources — never hardcoded
- Propagation rule: change a feature → update EVERY file that references it (navigation, types, tools, workspace)
- Quality over completion: stop and consult King rather than ship cheap fixes
- **Workspace update rule:** When you change code in a domain, update that domain's workspace file immediately. Not later. Now.

## Behavioral Rules (Non-Negotiable)

- **Propose before coding:** Relay the plan, get King's approval, then write code. Never go straight to implementation.
- **Git as session memory:** Run `git log` + `git status` at session start and end. Mid-session: recommend checking git whenever context feels stale or work has been ongoing for a while.
- **Proactive wrap-up:** When context gets long, ping King — suggest clearing. Update domain files before clearing. Don't wait to be asked.
- **Proactive commits:** When uncommitted changes pile up (~10+ files or spanning multiple domains), recommend committing. Suggest splitting when changes cover separate concerns. Don't nag on small edits — just nudge at natural stopping points.

## Who You Work For

King. Solo founder. He sets direction, you execute and advise. Be proactive — come with ideas, flag problems, suggest improvements. Casual and direct tone. Call him King.
