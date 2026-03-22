# Fix: Service-UI Type Standardization

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md), [`docs/flows/tools.md`](../flows/tools.md)
> **Status:** ✅ Green

## The Problem (Now Resolved)

The app was suffering from "Language Drift." The Service layer and the UI layer used different names for the same concepts.

## Fixed Issues

1. **Meetings:** All three meeting hooks (`use-general-meetings.ts`, `use-arsmote-stats.ts`, `use-dividend-logic.ts`) now consume structured `GeneralMeeting` objects directly. Zero `JSON.parse(doc.content)` calls remain. ✅

2. **Shareholders:** `shares_count` is consistently snake_case across the full chain:
   - `onboarding-wizard.tsx` sends `shares_count` → API seed endpoint expects `shares_count` → DB stores `shares_count` ✅
   - Hooks like `use-aktiebok-logic.ts` and `use-general-meetings.ts` use camelCase `sharesCount` after service translation ✅
   - `investments-processor.ts` translates `row.shares_count` → `sharesCount` and back ✅
   - **Note:** The onboarding→API→DB chain is consistently snake_case. Other hooks use camelCase after service-layer translation. This is the correct pattern — DB uses snake_case, TypeScript uses camelCase, services translate at the boundary.

3. **AI-UI Bridge:** `normalizeAIDisplay` exists and is active:
   - Defined in `src/lib/ai-schema.ts` with Zod validation
   - Used in `chat-message-list.tsx` and `use-stream-parser.ts`
   - Zero `as any` — proper type narrowing via `message.display?.type` discriminant ✅
   - `Record<string, unknown>` instead of `Record<string, any>` in `chat-types.ts` ✅

## Acceptance Criteria
- [x] No `JSON.parse(doc.content)` remains in meeting hooks
- [x] `use-general-meetings.ts` uses camelCase
- [x] `normalizeAIDisplay` exists and is wired into card rendering
- [x] `shares_count` chain is consistent (snake_case at boundary, camelCase in TypeScript)
- [x] Zero `as any` in `chat-message-list.tsx`
