# Fix: Tools

> **Flow:** [`docs/flows/tools.md`](../flows/tools.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** 🟢 In Progress (Bridge Complete)

## Vision vs Reality

The flow describes: tools call services, services call DB. Accounting tools go through lib/bookkeeping/. Deterministic rule tools for Swedish law. Zod validation on every tool.

### What exists
- 60+ AI tools in `src/lib/ai-tools/`
- Bookkeeping engine in `src/lib/bookkeeping/` (production quality, 11 files)
- Service layer in `src/services/`
- **[FIXED]** `create_verification` and `run_payroll` now use the engine.

### What's missing
- ✅ **Wire bookkeeping engine to AI tools** — Core accounting tools (`create_verification`, `run_payroll`) now use the engine for legal validation and sequential numbering.
- 🔵 **Pending → Confirmed pattern** — Implementation started via `pending-booking-service.ts`.
- 🟢 **Missing rule tools** — `calculate_312` (K10/gränsbelopp), `get_tax_table` (municipal rates) still need wiring.
- 🟢 **Tool namespacing** — tools should be namespaced by domain.
- 🟢 **7 tools not yet implemented** — `create_supplier_invoice`, `batch_create_verifications`, etc.

## Acceptance Criteria
- [x] Every AI tool that creates a verification uses `lib/bookkeeping/` functions
- [x] No AI tool does raw Supabase inserts for accounting entries (Purged in core tools)
- [ ] Pending → Confirmed flow works for all mutation tools
- [ ] All deterministic rule tools from the flow doc exist and work
- [ ] Tools are namespaced by domain
