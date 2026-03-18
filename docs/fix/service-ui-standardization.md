# Fix: Service-UI Type Standardization

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md), [`docs/flows/tools.md`](../flows/tools.md)
> **Thinking:** 🔴 Hard Fix (Zero Guessing)
> **Status:** 🟡 In Progress

## The Problem: Data Contract Drift
The app is currently suffering from "Language Drift." The Service layer and the UI layer use different names for the same concepts, leading to "NaN" values, crashes, and a broken "Digital CFO" experience.

### Key Drifts
1. **Shareholders:** DB/Old UI uses `shares_count`, but the Service/New UI expects `sharesCount`.
2. **Meetings:** The UI is trying to `JSON.parse` a `content` field from database rows, but the `board-service.ts` now returns a flattened, structured `GeneralMeeting` object.
3. **Stochastic Bridge:** AI display cards in `chat-message-list.tsx` are using `as any` or `as unknown as Type`, which masks data mismatches rather than fixing them.

## The "Digital CFO" Mandate (Hard Fix)
We are moving away from "Cheap Fixes" (casts, `?` fallbacks, `undefined`). We are implementing strict alignment.

### 1. Unified Meeting Model
- **Action:** Refactor all meeting-related hooks (`use-general-meetings.ts`, `use-arsmote-stats.ts`, `use-dividend-logic.ts`) to consume the `GeneralMeeting` type from `board-service.ts`.
- **Constraint:** Remove all `JSON.parse(doc.content)` calls. The service is responsible for the mapping.
- **Goal:** Clicking any meeting card or table row must load a **guaranteed** object structure.

### 2. Standardized Shareholder Properties
- **Action:** Global search and replace for `shares_count` → `sharesCount` and `shares_percentage` → `ownershipPercentage` in all UI components.
- **Target Files:** `firmatecknare.tsx`, `dividend-form.tsx`, `k10/index.tsx`, `aktiebok/use-aktiebok-logic.ts`.
- **Constraint:** No `as any` casts to bridge the drift.

### 3. Deterministic AI-UI Bridge
- **Action:** Every AI card in `chat-message-list.tsx` must pass through the `normalizeAIDisplay` function in `src/lib/ai-schema.ts`.
- **Constraint:** If the AI sends a new data type, a Zod schema **must** be created first. No direct rendering of raw AI objects.

## Execution Steps
1. [ ] **Registry & Types:** Make `allowedCompanyTypes` and `requiresConfirmation` optional in `AITool` to support partial loading. (DONE)
2. [ ] **Meeting Hook Gutting:** Rewrite `use-general-meetings.ts` to use `boardService.getCompanyMeetings()` directly with no string parsing.
3. [ ] **Shareholder Alignment:** Update `firmatecknare.tsx` and `aktiebok` to use `sharesCount`.
4. [ ] **Verification:** `npm run typecheck` must reach **zero errors** in the affected files.

## Acceptance Criteria
- [ ] No `shares_count` remains in the UI.
- [ ] No `JSON.parse(doc.content)` remains in meeting hooks.
- [ ] `use-general-meetings.ts` has 0 type errors.
- [ ] `firmatecknare.tsx` has 0 type errors.
- [ ] The "Digital CFO" scenario plays out flawlessly without crashes.
