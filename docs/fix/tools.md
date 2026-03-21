# Fix: Tools

> **Flow:** [`docs/flows/tools.md`](../flows/tools.md)
> **Status:** Yellow — registry and execution work, individual tools need audit

## What the Flow Describes

60+ tools organized by domain. Every tool: Zod validation -> service layer -> DB (or lib/bookkeeping/ for accounting). Deterministic rule tools for Swedish law. Confirmation pattern for all mutations. No direct Supabase calls from tools.

## What Works

### Registry (`registry.ts`)
- Register, get, search, execute — all working
- Company-type guard: checks `allowedCompanyTypes` before execution
- Confirmation flow: preflight -> pending confirmation (in-memory + DB) -> confirm/expire
- Audit logging via `aiAuditService` for write/confirmation tools
- `getCoreTools()` returns tools marked with `coreTool: true`
- `search()` scores by name (3x), keywords (2x), description (1x)

### Vercel Adapter (`vercel-adapter.ts`)
- Converts AITool[] to Vercel SDK ToolSet
- Handles both Zod schemas and JSON schemas
- `makeExecute()` bridges registry.execute() to Vercel's tool() format
- Two `@ts-expect-error` are justified (Vercel SDK generic overload limitation)

### Initialization (`index.ts`)
- 6 domain groups: bokforing, loner, skatt, parter, common, planning
- Single `initializeAITools()` registers all at once
- Lazy initialization in route (only runs once per server lifecycle)

## What's Broken

### P0: company-service.server.ts is untracked

`registry.ts:165` imports `company-service.server.ts` for the company-type guard:
```typescript
const { companyService } = await import('@/services/company-service.server')
```

Per git status, this file is **untracked** (new, uncommitted). If it has errors or missing exports, every tool execution that has `allowedCompanyTypes` will fail.

**Action:** Audit `company-service.server.ts` — verify it exports `companyService` with a `getByUserId()` method that returns `{ companyType: string }`.

### P1: Tool execute passes wrong context shape

`vercel-adapter.ts:22-25` — `makeExecute` calls `registry.execute()` with:
```typescript
{ userId: context.userId, companyId: context.companyId }
```

But `registry.execute()` at line 149-153 builds its own `InteractionContext`:
```typescript
const context: InteractionContext = {
    userId: options?.userId || 'system',
    companyId: options?.companyId || '',
    isConfirmed: false
}
```

The `isConfirmed` is always `false` here, which is correct for first calls. But the adapter never passes `confirmationId` or `skipConfirmation` — so confirmed tool calls from the UI won't actually confirm.

**Fix:** The confirmation flow needs to be wired through the Vercel adapter. When the model calls a tool with a confirmationId argument, the adapter should pass it to `registry.execute()`.

### P1: Core tools list needs verification

The deferred loading system depends on `coreTool: true` being set on the right tools. Per the flow doc, core tools should be:
- `search_tools`
- `create_verification`
- `get_transactions`
- `navigate_to_page`
- `get_company_info`

**Action:** Grep for `coreTool: true` across all tool definitions and verify these 5 (and only these 5) are marked.

### P2: No tool namespacing

Flow doc says: `bokforing:create_verification`, `loner:run_payroll`. Currently all tools use flat names. Low priority but affects tool discovery when the registry grows.

### P2: Missing tools (per flow doc)

| Tool | Domain | Was |
|------|--------|-----|
| `create_supplier_invoice` | bokforing | SupplierInvoiceDialog |
| `batch_create_verifications` | bokforing | AutoVerifikationDialog |
| `plan_meeting` | parter | PlanMeetingDialog |
| `send_meeting_notice` | parter | SendNoticeDialog |
| `create_motion` | parter | MotionDialog |
| `add_member` | parter | AddMemberDialog |
| `add_partner` | parter | AddPartnerDialog |
| `create_time_report` | loner | ReportDialog |

### P2: Rule tools incomplete

| Tool | Status |
|------|--------|
| `lookup_bas_account` | Exists |
| `calculate_employer_tax` | Exists |
| `calculate_vat` | Exists |
| `calculate_vacation_accrual` | Exists |
| `validate_verification` | Exists (via bookkeeping engine) |
| `calculate_312` | Needs verification |
| `get_tax_table` | Needs verification |
| `get_filing_deadlines` | Needs verification |

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
| `src/services/company-service.server.ts` | Company lookup (untracked) |
| `src/services/ai-audit-service.ts` | Audit logging for tool execution |

## Execution Order

1. Audit and commit `company-service.server.ts` (P0)
2. Verify core tools are marked correctly (P1)
3. Wire confirmation flow through Vercel adapter (P1)
4. Verify rule tools exist and work (P2)
5. Build missing dialog-replacement tools (P2)
6. Add tool namespacing (P2)
