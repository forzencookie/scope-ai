# Fix: Scooby Engine

> **Flow:** [`docs/flows/scooby-engine.md`](../flows/scooby-engine.md)
> **Status:** Yellow — architecture is sound, implementation has gaps

## What the Flow Describes

The "Doctor Model" — Scooby arrives with persona + general knowledge (~1,600 tokens), discovers tools on demand, loads skill files for complex domains, and uses MemGPT-style memory (core in-context, recall/archival out-of-context). Target: ~3,000-4,000 tokens per request instead of 53,000.

## What Works

### System Prompt Composition (`system-prompt.ts`)
Clean 6-part structure, static-first for prompt caching:
1. Core Instincts (~500 tokens) — persona, tone rules, response format
2. Knowledge Master — loaded from `src/data/ai-knowledge/master.md`
3. Tool reference — compact paragraph pointing to `get_knowledge` and `search_tools`
4. Company context — type, name, current page, attachments, selected items
5. Activity snapshot — pending transactions, overdue invoices
6. User memories — filtered by relevance

Token budget is close to target. No scenarios are injected (moved to skills as planned).

### Deferred Tool Loading (`vercel-adapter.ts`)
Working correctly:
- `createDeferredToolConfig()` registers ALL tools but only exposes core tools via `activeTools`
- `prepareStep()` reads `search_tools` output and expands active tools
- `stepCountIs(10)` prevents infinite loops
- Token savings: ~85-90% as designed

### Tool Index (`registry.ts:66-81`)
`getToolIndex()` generates a compact name+one-liner list grouped by domain (~300 tokens). Available but NOT currently injected into the system prompt — the prompt uses a text paragraph instead of the actual index.

## What's Broken

### P1: Tool index not injected

`system-prompt.ts:122` writes a generic paragraph about tools:
```
"Du har tillgang till over 100 verktyg..."
```

But the flow doc says the system prompt should include the actual tool index (~300 tokens, 60 names + one-liners) so Scooby knows what exists before calling `search_tools`. The registry has `getToolIndex()` ready — it's just not called.

**Fix:** Replace the paragraph with `aiToolRegistry.getToolIndex()`.

### P1: Memory and snapshot block the stream

Activity snapshot and memory injection run sequentially before `streamText()`, adding ~60-100ms of dead time. Per the route restructure in `fix/ai-interface.md`, these should be **parallel promises with a short timeout** (~50ms). If they resolve in time, inject into the prompt. If not, the AI responds without them — the user gets a fast answer, and the context catches up on the next message.

This aligns with the flow doc's own principle: "Just-in-time context. Don't pre-load data."

### P1: Memory filtering is keyword-based, not semantic

`route.ts:218-231` — relevance filtering uses 12 hardcoded Swedish keywords:
```typescript
const keywords = ['lon', 'anstalld', 'skatt', 'moms', ...]
return keywords.some(k => query.includes(k) && content.includes(k))
```

Problems:
- Only matches if both query AND memory contain the exact same keyword
- Misses synonyms ("salary" won't match "lon" memories)
- Preferences always pass (good), but decisions/notes rarely match
- 12 keywords cover maybe 40% of accounting vocabulary

The flow doc wants: "Ask about payroll -> recalls payroll preferences." This works only if the user literally types "lon".

**Fix (short-term):** Expand keyword list, add bigrams, match domain categories not just words.
**Fix (long-term):** Vector similarity search on memories (archival memory per flow doc).

### P1: No Core Memory (JSON scratchpad)

The flow doc describes a MemGPT-style Core Memory — editable JSON blocks pinned to context:
```json
{ "company": { "type": "AB", "period": "Q1" }, "user": { "style": "expert" }, "session": { "currentTask": "payroll" } }
```

Currently: company type is injected but nothing else. No user style, no session tracking, no editable scratchpad. The model can't update its own context mid-conversation.

**Status:** Not started. Requires a `update_core_memory` tool + persistent storage.

### P2: No context compaction

The flow doc describes three compaction strategies:
1. Clear old tool results after acting on them
2. Summarize older messages on approach to context limit
3. Just-in-time context (load via tools, don't pre-load)

Currently: all messages are passed to `streamText()` without any compaction. Long conversations will hit context limits and degrade.

**Status:** Not started. Strategy #3 is partially achieved via deferred tools.

### P2: No artifact handle pattern

Large tool outputs (reports, payroll breakdowns) should be stored as artifacts with lightweight references in the prompt. Currently: full tool results live in the message stream.

**Status:** Not started.

### P3: No sub-agent delegation

Complex tasks (monthly closing, annual report) should delegate to focused sub-agents. Currently: everything runs in one conversation context.

**Status:** Not started. Agent types are defined in `agents/types.ts` but no sub-agents are implemented.

## Current Token Budget (Estimated)

| Component | Tokens | Target | Status |
|-----------|--------|--------|--------|
| Core Instincts | ~500 | ~500 | On target |
| Knowledge Master | ~500 | ~500 | On target |
| Tool reference | ~50 | ~300 (index) | Under — should inject actual index |
| Company context | ~200 | ~300 | On target |
| Activity snapshot | ~50 | ~50 | On target |
| User memories | ~100-300 | ~300 | On target |
| **Total** | **~1,400-1,600** | **~1,900** | Good — slightly under |

The system prompt is lean. Main issue is tool discovery, not prompt bloat.

## Files

| File | Role |
|------|------|
| `src/lib/agents/scope-brain/system-prompt.ts` | Prompt builder (6 sections) |
| `src/lib/agents/scope-brain/scenarios-loader.ts` | Loads master.md + scenario files |
| `src/lib/agents/scope-brain/model-selector.ts` | Model selection (returns default) |
| `src/lib/agents/types.ts` | AgentContext, AgentMessage, Agent interfaces |
| `src/lib/ai-tools/vercel-adapter.ts` | Deferred tool config |
| `src/lib/ai-tools/registry.ts` | Tool index generation |
| `src/app/api/chat/route.ts` | Context assembly + memory injection |
| `src/services/user-memory-service.ts` | Memory retrieval |

## Execution Order

1. Inject actual tool index into system prompt (P1)
2. Improve memory relevance filtering (P1)
3. Build Core Memory scratchpad + update tool (P1)
4. Add message compaction for long conversations (P2)
5. Implement artifact handle pattern (P2)
6. Build sub-agent delegation for complex tasks (P3)
