# Fix: Scooby Engine

> **Flow:** [`docs/flows/scooby-engine.md`](../flows/scooby-engine.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: the Doctor Model (layered context loading), memory architecture (core/recall/archival), context compaction, artifact handles, sub-agent delegation, 6 load-bearing systems.

### What exists
- Deferred tool loading (search_tools meta-tool) — implemented
- Basic memory service (`user-memory-service.ts`) — exists but has `@ts-nocheck`
- Memory injection into system prompt — exists but blind top-20 dump
- Conversation save/load — partially works

### What's missing
- 🔵 **Company-type awareness in system prompt** — Scooby must know the user's company type (AB/EF/HB/KB/Förening) and tailor behavior accordingly. An EF user should never be offered AB features like aktiebok, utdelning, or bolagsstämma. The system prompt must inject company type and restrict Scooby's suggestions to relevant features. See `fix/database-schema.md` section 5 for the full enforcement model across all layers.
- 🔵 **Memory relevance filtering** — replace blind top-20 injection with keyword/embedding-based relevance matching per query
- 🔵 **Memory categories** — task, goal, decision, preference, note. Schema needs updating.
- 🔵 **Memory AI tools** — `recall_memory`, `save_memory`, `list_memories` for Scooby to read/write memory
- 🔵 **AI knowledge base** — `src/data/ai-knowledge/` is EMPTY. Needs BAS account reference, Swedish tax rules, common categorization patterns.
- 🔵 **App manifest** — JSON file mapping pages → tools → data → connections. Scooby needs a map of the entire app.
- 🔵 **Conversation persistence with full card state** — old conversations must reload with tool results, cards, and interactive state intact
- 🔵 **Context compaction** — clear old tool results after use, summarize long conversations
- 🔵 **Artifact handle pattern** — large tool outputs stored externally, summary in context
- 🔵 **Sub-agent delegation** — complex tasks (period close, annual report) delegated to focused sub-agents

### Suspicious / needs founder input
- `src/services/user-memory-service.ts` has `@ts-nocheck` — needs full type rewrite (blocked by workstream 01)
- Current memory injection in chat route — is it doing anything useful or just burning tokens?

## Acceptance Criteria
- [ ] Memory injection is relevance-filtered, not blind top-20
- [ ] Memory categories (task/goal/decision/preference/note) work
- [ ] AI tools for memory CRUD exist
- [ ] `ai-knowledge/` populated with reference data
- [ ] App manifest exists and is injected into system prompt
- [ ] Old conversations reload with full card/block state
- [ ] Token usage per request is under ~5,000 (down from ~53,000)
