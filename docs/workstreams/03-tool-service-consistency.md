# 04 — Tool–Service Consistency

| Field | Value |
|-------|-------|
| **Status** | ⬜ Not started |
| **Priority** | 🟠 High |
| **Phase** | 1 — Clean Foundation |
| **Dream State Section** | Section 6 — Architecture (Tool Execution → Services → DB) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC changed** | ~300 |

## Audit Findings

- **8 files with 15+ service layer violations** — direct Supabase calls or HTTP round-trips from AI tools:
  1. `src/lib/ai-tools/parter/partners.ts` — direct `supabase.rpc()`
  2. `src/lib/ai-tools/loner/owner-payroll.ts` — `fetch('/api/partners')`
  3. `src/lib/ai-tools/parter/compliance.ts` — `fetch('/api/compliance')`
  4. `src/lib/ai-tools/bokforing/audit.ts` — 6 direct `.from()` queries
  5. `src/lib/ai-tools/bokforing/reports.ts` — `supabase.rpc()` used by 7 tools
  6. `src/lib/ai-tools/bokforing/resultat-audit.ts` — direct `.rpc()` + `.from()`
  7. `src/lib/ai-tools/common/reconcile-status.ts` — 5 direct `.from()` queries
  8. `src/lib/ai-tools/common/usage.ts` — 3 direct `.from()` queries
- **Duplicate tool name** `get_upcoming_deadlines` exists in two files (`navigation.ts` and `events.ts`) — causes registry collision
- Some tools use `fetch('/api/...')` (HTTP round-trip) while others use service functions directly — inconsistent patterns
- Tool parameter validation is inconsistent — some use Zod, some use nothing

## Why

The dream state architecture is: Chat Route → Tool Execution → Service Layer → Database. When tools bypass services, business logic gets duplicated, validation is skipped, and changes to the service layer don't propagate. The duplicate tool name is a latent bug.

## What to Do

1. 🟢 **Fix duplicate tool name:** Rename one of the two `get_upcoming_deadlines` tools — pick the correct one to keep, rename or merge the other.
2. 🟢 **Rewire all 8 files to use the service layer:**
   - If a service function exists, use it
   - If no service exists, create one in the appropriate `src/services/` file
3. 🟢 **Standardize parameter validation:** Ensure every tool uses Zod schemas for input validation.
4. 🟢 **Verify tool registry** has no duplicate names after fixes.

## Files to Touch

- 8 AI tool files listed above (rewire to services)
- Possibly `src/services/` (create missing service functions)
- Tool registry file (verify no duplicate names)

## Acceptance Criteria

- [ ] Zero AI tools make direct Supabase calls (all go through services)
- [ ] Zero AI tools use `fetch('/api/')` for internal data
- [ ] No duplicate tool names in the registry
- [ ] Every tool has Zod parameter validation
- [ ] All existing tests pass

## Do NOT Touch

- Service layer internals (unless creating new service functions)
- AI tool response formats
- The chat route or tool execution framework
