# 02 — Dead Code Cleanup

| Field | Value |
|-------|-------|
| **Status** | 🟡 In progress |
| **Priority** | 🔴 Critical |
| **Phase** | 1 — Clean Foundation |
| **Dream State Section** | Section 2 — Chat Is Everything (remove old UI cruft) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC removed** | ~500 remaining (was ~3,060) |

## Completed

- **Duplicate booking flows — DONE.** All 3 booking dialogs deleted (`BookingWizardDialog`, `BookingDialog`, `NewTransactionDialog`). All mutation dialogs removed from pages.
- **18 mutation dialogs deleted** across bokforing/agare/loner — pages are now read-only as intended.
- **Deleted file references cleaned** — `bank.ts`, `upload-invoice/route.ts`, `kivra.svg` removed and imports cleared.

## Remaining Audit Findings

- **3 stub AI tools returning hardcoded data:**
  1. `src/lib/ai-tools/common/navigation.ts:421-434` — `get_upcoming_deadlines` (hardcoded 2 deadlines)
  2. `src/lib/ai-tools/common/events.ts:216-267` — `get_upcoming_deadlines` (hardcoded 5 deadlines, DUPLICATE NAME with navigation.ts)
  3. `src/lib/ai-tools/common/events.ts:319-342` — `get_activity_summary` (hardcoded mock stats)
- **Disconnected model system:** `src/lib/ai/models.ts` defines fictional model IDs (`gpt-5-mini`, `gpt-5`, `gpt-5-turbo`) while `model-selector.ts` hardcodes `gpt-4o`. The entire `models.ts` + `model-auth.ts` tier system (snabb/smart/expert) is disconnected dead code. See also workstream 04 for the model ID fix.

## Why

Dead code confuses AI assistants and humans alike. Every deprecated file is cognitive overhead and a place where an AI might accidentally wire up old patterns. The app needs to be lean — only code that serves the dream state should exist.

## What to Do

1. 🟢 **Rewire 3 stub AI tools** that return hardcoded data — replace with real DB queries or remove entirely.
2. 🟢 **Clean up disconnected model system** — `models.ts` + `model-auth.ts` define a tier system that nothing uses. Either delete or rewire. Coordinate with workstream 04.
3. 🟢 **Run build** to verify nothing breaks: `npm run build`

## Files to Touch

- `src/lib/ai-tools/common/navigation.ts` (stub tool)
- `src/lib/ai-tools/common/events.ts` (2 stub tools)
- `src/lib/ai/models.ts` (fictional model IDs — coordinate with workstream 04)
- `src/lib/model-auth.ts` (disconnected tier system)
- Any file importing deleted modules

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] No file in the codebase imports from deleted paths
- [ ] No stub tools returning hardcoded mock data
- [ ] Disconnected model/tier system cleaned up

## Do NOT Touch

- The card system (`src/components/ai/cards/`, `card-registry.ts`, `card-renderer.tsx`) — these are Layer 1 compact chat previews, complementary to blocks (Layer 2 overlay content). NOT deprecated.
- The block rendering system (`src/components/ai/blocks/`) — Layer 2 walkthrough overlay content
- `src/lib/bookkeeping/` — that's workstream 03
- Any working AI tool that queries real data
- `src/data/ai-knowledge/` — this is NOT dead code (7 knowledge files + 4 skill workflows, wired into system prompt and `get_knowledge` tool)
