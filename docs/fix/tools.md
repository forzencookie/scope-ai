# Fix: Tools

> **Flow:** [`docs/flows/tools.md`](../flows/tools.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: tools call services, services call DB. Accounting tools go through lib/bookkeeping/. Deterministic rule tools for Swedish law. Zod validation on every tool.

### What exists
- 60+ AI tools in `src/lib/ai-tools/`
- Bookkeeping engine in `src/lib/bookkeeping/` (production quality, 11 files)
- Service layer in `src/services/`
- Some rule tools exist (BAS lookup, VAT calculation)

### What's missing
- 🔵 **Wire bookkeeping engine to AI tools** — the engine exists and works but ZERO AI tools call it. All bookings currently do raw Supabase inserts, bypassing BAS validation, debit/credit balance, and sequential numbering. This is the single biggest gap.
- 🔵 **Pending → Confirmed pattern** — AI creates pending verification via engine, user confirms, then finalized. Pattern needs to be consistent across all mutation tools.
- 🟢 **Missing rule tools** — `calculate_312` (K10/gränsbelopp), `get_tax_table` (municipal rates), `get_filing_deadlines` may not exist yet
- 🟢 **Tool namespacing** — tools should be namespaced by domain (`bokforing:create_verification`, `loner:run_payroll`)

### Suspicious / needs founder input
- 7 stub AI tools return hardcoded data — are any of these needed or all dead? (blocked by workstream 02)

## Acceptance Criteria
- [ ] Every AI tool that creates a verification uses `lib/bookkeeping/` functions
- [ ] No AI tool does raw Supabase inserts for accounting entries
- [ ] Pending → Confirmed flow works for all mutation tools
- [ ] All deterministic rule tools from the flow doc exist and work
- [ ] Tools are namespaced by domain
