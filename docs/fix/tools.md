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
- 🟢 **`register_dividend` tool** — currently only creates verifications (GL entries). Needs to also write to `dividends` table for persistent record. Depends on `fix/database-schema.md` (dividends table recreation).
- 🟢 **Compliance deadlines only cover AB** — `get_compliance_deadlines` tool calculates AGM + Bolagsverket deadlines for AB only. HB/KB/EF/Förening have no deadline logic.
- 🟢 **7 tools not yet implemented** — `create_supplier_invoice`, `batch_create_verifications`, `plan_meeting`, `send_meeting_notice`, `create_motion`, `add_member`, `add_partner`, `create_time_report`
- 🟢 **Benefits tools hardcoded** — `get_available_benefits`, `list_benefits`, etc. read from hardcoded `lib/formaner` data instead of the `benefits` DB table that `benefit-service.ts` queries.

### Company-type enforcement on tools
- 🔵 **Every company-type-specific tool needs a guard** — check `company.companyType` before executing. Return a clear Swedish error if the user's company type doesn't match (e.g. "Utdelning gäller bara aktiebolag"). See `fix/database-schema.md` section 5 for the full list of tools that need guards.
- 🟢 **Deferred tool discovery should filter by company type** — add `companyTypes` field to tool definitions so `search_tools` only returns relevant tools for the user's company type. An EF user searching for "utdelning" should not find `register_dividend`.

### Suspicious / needs founder input
- 7 stub AI tools return hardcoded data — are any of these needed or all dead? (blocked by workstream 02)

## Acceptance Criteria
- [ ] Every AI tool that creates a verification uses `lib/bookkeeping/` functions
- [ ] No AI tool does raw Supabase inserts for accounting entries
- [ ] Pending → Confirmed flow works for all mutation tools
- [ ] All deterministic rule tools from the flow doc exist and work
- [ ] Tools are namespaced by domain
- [ ] Every company-type-specific tool has a `companyType` guard that rejects wrong types with a clear Swedish message
- [ ] Tool definitions include `companyTypes` field for deferred discovery filtering
