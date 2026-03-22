# 04 — Generator Fixes

| Field | Value |
|-------|-------|
| **Status** | 🟡 Partially done |
| **Priority** | 🟠 High |
| **Phase** | 3 — Polish |
| **Dream State Section** | Section 3 — Deterministic Rule Engine (generators must produce legally correct output) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC changed** | ~100 |

## Progress (as of 2026-03-21)

- **SRU generator bug — FIXED.** Line 397 now correctly uses `info.orgnr` (not `info.phone`).

## Remaining

- **Disconnected model system:** `src/lib/ai/models.ts` defines fictional model IDs (`gpt-5-mini`, `gpt-5`, `gpt-5-turbo`) with a tier system (snabb/smart/expert). Meanwhile, all API routes hardcode real `gpt-4o` / `gpt-4o-mini` (10+ files). The two systems are completely disconnected — the tier UI is non-functional. Coordinate with workstream 02.
- **AGI/annual report generator** — needs audit against ÅRL compliance
- **iXBRL generator** — needs audit for tag coverage

## What to Do

1. ~~Fix SRU generator bug~~ ✅ Done
2. 🟢 **Fix model ID system:** Either:
   - Delete `models.ts` + `model-auth.ts` as dead code (if the tier system isn't needed yet), OR
   - Rewire `model-selector.ts` to use `models.ts` and replace fictional IDs with real ones
3. 🟢 **Audit all generators** in `src/lib/generators/`:
   - SRU generator: Verify all field mappings against Skatteverket SRU spec
   - Annual report generator: Audit against ÅRL compliance
   - iXBRL generator: Audit for tag coverage
4. 🟢 **Add validation assertions** to generator outputs where feasible

## Acceptance Criteria

- [x] SRU generator uses `info.orgnr` not `info.phone`
- [ ] All generator field mappings verified against official specs
- [ ] Model ID system either deleted or rewired with real model IDs
- [ ] Generator outputs include basic validation (required fields, format checks)

## Do NOT Touch

- Generator architecture or output format
- AI tool interfaces
- UI components
