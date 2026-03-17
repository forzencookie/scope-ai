# Fix: Scooby Engine

> **Flow:** [`docs/flows/scooby-engine.md`](../flows/scooby-engine.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** 🟡 In Progress (Memory Gap Identified)

## Vision vs Reality

The engine is currently "forgetful" and "blind" to company type.

### What's missing
- 🔴 **Relevance Filtering (Memory)** — Current logic just grabs the last 20 memories. Needs to filter based on current user intent.
- 🔴 **Company-Type Awareness** — `api/chat/route.ts` hardcodes `companyType: 'AB'`. Must fetch real type from DB.
- 🔵 **Token Optimization** — We are injecting too much raw data into every prompt.

## Acceptance Criteria
- [ ] Memory injection is relevant to the user query
- [x] System prompt includes user's company type (Added to prompt builder)
- [ ] Hardcoded 'AB' removed from Chat API
- [ ] Token usage per request is optimized
