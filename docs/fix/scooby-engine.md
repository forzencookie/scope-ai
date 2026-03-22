# Fix: Scooby Engine

> **Flow:** [`docs/flows/scooby-engine.md`](../flows/scooby-engine.md)
> **Status:** ✅ Green — architecture works, future enhancements tracked below

## What the Flow Describes

The "Doctor Model" — Scooby arrives with persona + general knowledge (~1,600 tokens), discovers tools on demand, loads skill files for complex domains, and uses memory for personalization. Target: ~3,000-4,000 tokens per request instead of 53,000.

## What Works

### System Prompt Composition (`system-prompt.ts`)
Clean 6-part structure, static-first for prompt caching:
1. Core Instincts (~500 tokens) — persona, tone rules, response format
2. Knowledge Master — loaded from `src/data/ai-knowledge/master.md`
3. Tool index — `aiToolRegistry.getToolIndex()` injects ~300 token compact list grouped by domain ✅
4. Company context — type, name, current page, attachments, selected items
5. Activity snapshot — pending transactions, overdue invoices (100ms timeout guard) ✅
6. User memories — filtered by relevance (100ms timeout guard) ✅

### Deferred Tool Loading (`vercel-adapter.ts`)
- `createDeferredToolConfig()` registers ALL tools but only exposes core tools via `activeTools`
- `prepareStep()` reads `search_tools` output and expands active tools
- `stepCountIs(10)` prevents infinite loops
- Token savings: ~85-90% as designed

### Confirmation Flow
Fully wired: route parses `confirmationId` → adapter passes to registry → registry validates and executes with `isConfirmed: true` → audit log written.

## Token Budget

| Component | Tokens | Status |
|-----------|--------|--------|
| Core Instincts | ~500 | On target |
| Knowledge Master | ~500 | On target |
| Tool index | ~300 | On target ✅ |
| Company context | ~200 | On target |
| Activity snapshot | ~50 | On target |
| User memories | ~100-300 | On target |
| **Total** | **~1,650-1,850** | Good |

## Known Limitations

### Memory filtering is keyword-based
`route.ts` uses 20 hardcoded Swedish keywords for relevance matching. Works for ~60% of accounting vocabulary. Misses synonyms and compound terms. Preferences always pass regardless of keywords (good).

Not blocking — functional for common queries, imperfect for edge cases.

## Future Features

These are enhancements from the flow doc. Zero code exists for any of them.

| Feature | What It Is |
|---------|-----------|
| Semantic memory search | Vector similarity instead of keyword matching |
| Core Memory scratchpad | MemGPT-style editable JSON blocks pinned to context + `update_core_memory` tool |
| Context compaction | Summarize older messages, clear old tool results, just-in-time context loading |
| Artifact handle pattern | Store large tool outputs as refs, not inline in message stream |
| Sub-agent delegation | Focused sub-agents for complex tasks (monthly closing, annual report) |

## Files

| File | Role |
|------|------|
| `src/lib/agents/scope-brain/system-prompt.ts` | Prompt builder (6 sections) |
| `src/lib/agents/scope-brain/scenarios-loader.ts` | Loads master.md + scenario files |
| `src/lib/agents/types.ts` | AgentContext, AgentMessage, Agent interfaces |
| `src/lib/ai-tools/vercel-adapter.ts` | Deferred tool config |
| `src/lib/ai-tools/registry.ts` | Tool index generation |
| `src/app/api/chat/route.ts` | Context assembly + memory injection |
| `src/services/user-memory-service.ts` | Memory retrieval |
