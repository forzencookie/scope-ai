# 02 — Dead Code Cleanup

| Field | Value |
|-------|-------|
| **Status** | 🟡 Nearly done |
| **Priority** | 🔴 Critical |
| **Phase** | 1 — Clean Foundation |
| **Dream State Section** | Section 2 — Chat Is Everything (remove old UI cruft) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC removed** | ~100 remaining (was ~3,060) |

## Completed

- **Duplicate booking flows — DONE.** All 3 booking dialogs deleted (`BookingWizardDialog`, `BookingDialog`, `NewTransactionDialog`). All mutation dialogs removed from pages.
- **18 mutation dialogs deleted** across bokforing/agare/loner — pages are now read-only as intended.
- **Deleted file references cleaned** — `bank.ts`, `upload-invoice/route.ts`, `kivra.svg` removed and imports cleared.
- **Duplicate tool name collision — FIXED.** `events.ts` now exports `getUpcomingDeadlinesTool` (uses real `taxService.getUpcomingDeadlines()`). No registry collision.
- **`get_activity_summary` stub — FIXED.** Now uses real `activityService.getActivitySummary()`.

## Remaining

- **1 stub AI tool:** `src/lib/ai-tools/common/navigation.ts:415-437` — `get_upcoming_deadlines` returns hardcoded 2 deadlines. Note: this version is NOT exported to the registry, so it's dead code rather than an active bug. Should be deleted.
- **Disconnected model system:** `src/lib/ai/models.ts` defines fictional model IDs (`gpt-5-mini`, `gpt-5`, `gpt-5-turbo`) with a tier system (snabb/smart/expert). All actual API routes hardcode real `gpt-4o` / `gpt-4o-mini`. The entire `models.ts` + `model-auth.ts` tier system is disconnected. See also workstream 04.

## What to Do

1. 🟢 **Delete stub `get_upcoming_deadlines` from `navigation.ts`** — the real version lives in `events.ts`.
2. 🟢 **Clean up disconnected model system** — `models.ts` + `model-auth.ts` define a tier system that nothing uses. Either delete or rewire. Coordinate with workstream 04.
3. 🟢 **Run build** to verify nothing breaks: `npm run build`

## Acceptance Criteria

- [x] `npm run build` passes with zero errors (from dead code — type errors tracked in WS-01)
- [x] No file in the codebase imports from deleted paths
- [x] No duplicate tool names in the registry
- [ ] No stub tools returning hardcoded mock data (1 remaining — not exported, but should be deleted)
- [ ] Disconnected model/tier system cleaned up

## Do NOT Touch

- The card system (`src/components/ai/cards/`, `card-registry.ts`, `card-renderer.tsx`) — these are Layer 1 compact chat previews, complementary to blocks (Layer 2 overlay content). NOT deprecated.
- The block rendering system (`src/components/ai/blocks/`) — Layer 2 walkthrough overlay content
- `src/lib/bookkeeping/` — that's workstream 03
- Any working AI tool that queries real data
- `src/data/ai-knowledge/` — this is NOT dead code (7 knowledge files + 4 skill workflows, wired into system prompt and `get_knowledge` tool)
