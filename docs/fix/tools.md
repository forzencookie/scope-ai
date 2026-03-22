# Fix: Tools

> **Flow:** [`docs/flows/tools.md`](../flows/tools.md)
> **Status:** ✅ Green — registry, execution, and confirmation all working

## What the Flow Describes

60+ tools organized by domain. Every tool: Zod validation → service layer → DB (or lib/bookkeeping/ for accounting). Deterministic rule tools for Swedish law. Confirmation pattern for all mutations. No direct Supabase calls from tools.

## What Works

### Registry (`registry.ts`)
- Register, get, search, execute — all working
- Company-type guard: checks `allowedCompanyTypes` before execution
- Confirmation flow: preflight → pending confirmation (in-memory + DB) → confirm/expire
- Audit logging via `aiAuditService` for write/confirmation tools
- `getCoreTools()` returns tools marked with `coreTool: true`
- `search()` scores by name (3x), keywords (2x), description (1x)
- `getToolIndex()` generates compact domain-grouped list (~300 tokens)

### Vercel Adapter (`vercel-adapter.ts`)
- Converts AITool[] to Vercel SDK ToolSet
- Handles both Zod schemas and JSON schemas
- `makeExecute()` bridges registry.execute() to Vercel's tool() format
- Passes `confirmationId` through to registry for 2-step confirmation
- Two `@ts-expect-error` are justified (Vercel SDK generic overload limitation)

### Initialization (`index.ts`)
- 6 domain groups: bokforing, loner, skatt, parter, common, planning
- Single `initializeAITools()` registers all at once
- Lazy initialization in route (only runs once per server lifecycle)

### Core Tools (verified ✅)
- `search_tools` — tool discovery
- `create_verification` — booking transactions
- `get_transactions` — transaction queries
- `navigate_to_page` — page navigation
- `get_knowledge` — knowledge retrieval

### Rule Tools (verified ✅)
- `lookup_bas_account` — BAS chart lookup
- `calculate_employer_tax` — employer tax calculation
- `calculate_vat` — VAT calculation
- `calculate_vacation_accrual` — vacation pay accrual
- `validate_verification` — bookkeeping validation

## Fixed Issues

| Issue | Fix |
|-------|-----|
| P0: company-service.server.ts untracked | Tracked and committed |
| P1: Tool execute passes wrong context | Confirmation flow fully wired through adapter |
| P1: Core tools list | Verified — 5 correct tools |

## Future Features

These are backlog items — not broken, just not built yet. Pages are read-only by design; these tools would enable mutations via chat.

### Missing mutation tools (dialog replacements)
All 8 reference dialogs that have been deleted. Pages are read-only as designed.

| Tool | Domain |
|------|--------|
| `create_supplier_invoice` | bokforing |
| `batch_create_verifications` | bokforing |
| `plan_meeting` | parter |
| `send_meeting_notice` | parter |
| `create_motion` | parter |
| `add_member` | parter |
| `add_partner` | parter |
| `create_time_report` | loner |

### Missing rule tools
| Tool | Status |
|------|--------|
| `calculate_312` | Not built |
| `get_tax_table` | Not built |
| `get_filing_deadlines` | Not built |

### Tool namespacing
Flow doc says `bokforing:create_verification`. Currently flat names. Low priority.

## Files

| File | Role |
|------|------|
| `src/lib/ai-tools/registry.ts` | Central registry + execution |
| `src/lib/ai-tools/vercel-adapter.ts` | Vercel SDK conversion |
| `src/lib/ai-tools/types.ts` | AITool type definitions |
| `src/lib/ai-tools/index.ts` | Domain exports + registration |
| `src/lib/ai-tools/bokforing/` | Accounting tools |
| `src/lib/ai-tools/loner/` | Payroll tools |
| `src/lib/ai-tools/skatt/` | Tax tools |
| `src/lib/ai-tools/parter/` | Partners/shareholders tools |
| `src/lib/ai-tools/common/` | Navigation, company, settings, events, stats |
| `src/lib/ai-tools/planning/` | Roadmap tools |
