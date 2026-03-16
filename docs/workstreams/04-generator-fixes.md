# 09 — Generator Fixes

| Field | Value |
|-------|-------|
| **Status** | ⬜ Not started |
| **Priority** | 🟠 High |
| **Phase** | 3 — Polish |
| **Dream State Section** | Section 3 — Deterministic Rule Engine (generators must produce legally correct output) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC changed** | ~100 |

## Audit Findings

- **BUG:** `src/lib/generators/sru-generator.ts` line 397 uses `info.phone` instead of `info.orgnr` — SRU files submitted to Skatteverket would have wrong org number
- **Disconnected model system:** `src/lib/ai/models.ts` defines fictional model IDs (`gpt-5-mini`, `gpt-5`, `gpt-5-turbo`) with a tier system (snabb/smart/expert). Meanwhile, `model-selector.ts` hardcodes `gpt-4o` and ignores `models.ts` entirely. The two systems are disconnected — the tier UI is non-functional.
- AGI/annual report generator — needs audit against ÅRL compliance
- iXBRL generator — needs audit for tag coverage

## Why

Generators produce legally binding documents. A wrong field in an SRU file means incorrect tax submission. The founder's explicit fear: "The paperwork might not be sufficient — government says it's missing stuff." Every generator output must be audit-proof.

## What to Do

1. 🟢 **Fix SRU generator bug:** Line 397 in `sru-generator.ts` — change `info.phone` to `info.orgnr`.
2. 🟢 **Fix model ID system:** Either:
   - Delete `models.ts` + `model-auth.ts` as dead code (if the tier system isn't needed yet), OR
   - Rewire `model-selector.ts` to use `models.ts` and replace fictional IDs with real ones
3. 🟢 **Audit all generators** in `src/lib/generators/`:
   - SRU generator: Verify all field mappings against Skatteverket SRU spec
   - Annual report generator: Audit against ÅRL compliance
   - iXBRL generator: Audit for tag coverage
4. 🟢 **Add validation assertions** to generator outputs where feasible — e.g., org number format check, required field presence.

## Files to Touch

- `src/lib/generators/sru-generator.ts` (fix bug + audit)
- `src/lib/generators/` (audit all files)
- `src/lib/ai/models.ts` (fix or delete — coordinate with workstream 02)
- `src/lib/model-auth.ts` (fix or delete — coordinate with workstream 02)

## Acceptance Criteria

- [ ] SRU generator line 397 uses `info.orgnr` not `info.phone`
- [ ] All generator field mappings verified against official specs
- [ ] Model ID system either deleted or rewired with real model IDs
- [ ] Generator outputs include basic validation (required fields, format checks)

## Do NOT Touch

- Generator architecture or output format
- AI tool interfaces
- UI components
