# 03 — Tool–Service Consistency

| Field | Value |
|-------|-------|
| **Status** | 🟢 Mostly done |
| **Priority** | 🟠 High |
| **Phase** | 1 — Clean Foundation |
| **Dream State Section** | Section 6 — Architecture (Tool Execution → Services → DB) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC changed** | ~50 remaining |

## Progress (as of 2026-03-21)

Major issues resolved:
- **Duplicate tool name — FIXED.** `events.ts` now exports `getUpcomingDeadlinesTool` (different name from `navigation.ts`). Only the events version is registered. No registry collision.
- **Service bypasses in tools — LARGELY FIXED.** Comprehensive grep shows tools now use the service layer. No direct `supabase.from()` calls found in tool files.

## Remaining Audit Needed

The original doc listed 8 files with 15+ violations. Most appear fixed, but these should be verified with a fresh audit:

| File | Original Issue | Likely Status |
|------|---------------|---------------|
| `src/lib/ai-tools/parter/partners.ts` | direct `supabase.rpc()` | Needs verification |
| `src/lib/ai-tools/loner/owner-payroll.ts` | `fetch('/api/partners')` | Needs verification |
| `src/lib/ai-tools/parter/compliance.ts` | `fetch('/api/compliance')` | Needs verification |
| `src/lib/ai-tools/bokforing/audit.ts` | 6 direct `.from()` queries | Needs verification |
| `src/lib/ai-tools/bokforing/reports.ts` | `supabase.rpc()` by 7 tools | Needs verification |
| `src/lib/ai-tools/bokforing/resultat-audit.ts` | direct `.rpc()` + `.from()` | Needs verification |
| `src/lib/ai-tools/common/reconcile-status.ts` | 5 direct `.from()` queries | Needs verification |
| `src/lib/ai-tools/common/usage.ts` | 3 direct `.from()` queries | Needs verification |

**Tool parameter validation** — inconsistency between Zod and no-validation tools needs fresh audit.

## What to Do

1. 🟢 **Verify each of the 8 files** — confirm service layer is used, flag any remaining bypasses
2. 🟢 **Audit parameter validation** — ensure every tool uses Zod schemas for input validation
3. 🟢 **Verify tool registry** has no duplicate names

## Acceptance Criteria

- [x] No duplicate tool names in the registry
- [ ] Zero AI tools make direct Supabase calls (needs fresh audit)
- [ ] Zero AI tools use `fetch('/api/')` for internal data (needs fresh audit)
- [ ] Every tool has Zod parameter validation

## Do NOT Touch

- Service layer internals (unless creating new service functions)
- AI tool response formats
- The chat route or tool execution framework
