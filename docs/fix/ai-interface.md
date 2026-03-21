# Fix: AI Interface

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md)
> **Status:** Red — chat breaks on first message

## Current Chain (Broken)

```
ChatInput → ChatProvider.handleSend() → useChat.sendMessage()
  → DefaultChatTransport POST /api/chat
  → 10 sequential gates (auth, rate limit, validation, budget, company lookup)
  → Save user message to DB (BLOCKING — before AI responds)
  → Fetch activity snapshot (BLOCKING)
  → Fetch memories (BLOCKING)
  → createAgentContext() → buildSystemPrompt() → createDeferredToolConfig()
  → streamText() → OpenAI → stream back
  → onFinish: save assistant message + consume tokens
```

## Target Chain (Per Vercel SDK + OpenAI Best Practices)

```
ChatInput → ChatProvider.handleSend() → useChat.sendMessage()
  → DefaultChatTransport POST /api/chat
  → Auth (5ms) → Budget check (20ms) → Company type (20ms, cached)
  → buildSystemPrompt() → createDeferredToolConfig()
  → streamText() → OpenAI → stream back IMMEDIATELY
  → onFinish: save user msg + assistant msg + consume tokens + activity snapshot
```

Key principle: **everything between "user hits enter" and "stream starts" is dead time.**
Only auth, budget, and company type are required before calling the model.
Message saves, conversation creation, activity snapshot, and memory injection
should happen in `onFinish` or in parallel — never blocking the stream.

Sources:
- [Vercel AI SDK: Storing Messages](https://sdk.vercel.ai/docs/ai-sdk-ui/storing-messages) — save in `onFinish`, not before
- [Vercel AI SDK Discussion #4845](https://github.com/vercel/ai/discussions/4845) — community consensus on persistence
- [OpenAI: Latency Optimization](https://developers.openai.com/api/docs/guides/latency-optimization) — minimize pre-stream work
- [OpenAI: Streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses) — streaming is #1 latency fix

## What Works

- ChatProvider lifts state correctly — textarea, files, mentions, action triggers shared between sidebar and main area
- useChat hook bridges Vercel AI SDK properly — sendMessage, regenerate, message mapping
- Deferred tool loading implemented (core tools + search_tools discovery)
- System prompt composition is clean: instincts → knowledge → tool index → company context → memories
- Tool registry: register, search, execute with confirmation flow and audit logging
- onFinish dispatches walkthrough/confirmation/navigation events correctly

## What's Broken

### P0: Route does ~300ms of blocking work before streaming

The route runs 10 sequential steps before calling `streamText()`. Per Vercel AI SDK docs and OpenAI latency guides, message persistence should happen in `onFinish` — not before the stream. Current blocking pre-stream work:

| Step | Time | Blocks stream? | Should it? |
|------|------|---------------|------------|
| Auth | ~5-10ms | Yes | **Yes** — need userId |
| Rate limit | ~1ms | Yes | **Yes** — but move to middleware |
| JSON parse | <1ms | Yes | **Yes** |
| Budget check | ~20-50ms | Yes | **Yes** — don't call OpenAI if broke |
| **Save user message** | ~30-50ms | Yes | **No** — save in onFinish |
| **Create conversation** | ~30-50ms | Yes | **No** — generate ID client-side (already done) |
| **Activity snapshot** | ~30-50ms | Yes | **No** — nice context, not essential |
| Company type lookup | ~20-30ms | Yes | **Yes** — but cache it |
| **Memory injection** | ~30-50ms | Yes | **No** — enrich if fast, skip if slow |
| Build prompt + stream | ~200ms TTFT | Yes | **Yes** — this is the actual work |

**Fix:** Restructure route into 3 phases:
1. **Gate** (blocking, ~50ms): Auth → Budget → Company type
2. **Stream** (immediate): buildSystemPrompt → streamText → return response
3. **Persist** (in onFinish): Save user msg + assistant msg + consume tokens

Activity snapshot and memories can run as parallel promises with a timeout — if they resolve before prompt building finishes, include them. If not, skip for this request.

### P0: Company lookup crashes every request

`route.ts:172-178` — queries `companies` table with `.single()` but **no filter**:

```typescript
const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('company_type')
    .single()  // expects exactly 1 row — fails if 0 or 2+
```

Relies entirely on RLS to scope. If user has no company (incomplete onboarding) or RLS returns multiple rows, this returns 400 "Foretagsinformation saknas." — the immediate error.

**Fix:** Use `companyId` from `getAuthContext()` (already fetched at line 51):
```typescript
const { data: company } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .single()
```
And handle the `companyId === null` case explicitly before querying.

### P0: Message format assumption

`route.ts:81` casts messages as `Array<{ role: string; content: string }>`. Vercel AI SDK v4 sends UIMessages with `parts` array. The transport layer may serialize `content` as a string or as an array of content parts. If `content` is an array, every downstream use breaks:
- `latestContent` (line 99) becomes `[object Object]`
- Messages passed to `streamText()` (line 273) have wrong shape
- Messages mapped to `AgentMessage[]` (line 195-203) get garbage content

**Fix:** Extract content from both formats:
```typescript
function extractContent(msg: Record<string, unknown>): string {
    if (typeof msg.content === 'string') return msg.content
    if (Array.isArray(msg.parts)) {
        const textPart = msg.parts.find((p: any) => p.type === 'text')
        return textPart?.text || ''
    }
    return ''
}
```

### P1: validateChatMessages imported but never called

`route.ts:9` imports `validateChatMessages` but the route only calls `validateJsonBody`. Messages go to OpenAI completely unvalidated — no role check, no content length check, no sanitization.

**Fix:** Call `validateChatMessages` on the extracted messages array, or remove the import (dead code).

### P1: Silent error swallowing

Two try/catch blocks silently eat errors:
- Activity snapshot (line 168-170): `console.error` only
- Memory injection (line 243-245): `console.error` only

Per CLAUDE.md zero-tolerance policy, errors should not be swallowed. These aren't fatal but the user gets degraded context with no indication.

**Fix:** Track which context pieces loaded and include a warning in the response if partial.

### P2: Conversation persistence is lossy

`use-chat.ts:160-196` maps stored AppMessages back to UIMessages, but:
- Tool invocation parts are reconstructed from `toolResults` — loses `args` if no matching `toolCall`
- `toolCallId` gets a random UUID instead of the original
- Only syncs if `vercelMessages.length === 0` — switching back to a conversation after chatting in another won't restore

Per flow doc requirement #3 (Conversation Persistence — Full Restore): "Click old conversation -> everything loads: text, tool results, cards with editable state." Currently only partially works.

### P2: Transport body stale closure

`use-chat.ts:87-94` — `DefaultChatTransport` is created with `conversationId` and `modelId` baked into the body. But these values come from React state. If `currentConversationId` changes (e.g., user starts a new conversation), the transport still sends the old ID because `useVercelChat` doesn't re-create the transport on every render.

**Fix:** Pass dynamic values via `sendMessage`'s options.body (which is already done at line 269-273), and remove them from the transport constructor. But verify Vercel SDK merges these correctly.

## What's Missing (per flow doc)

| Feature | Status | Notes |
|---------|--------|-------|
| Summary skills (/dag, /vecka, etc.) | Not started | No skill infrastructure exists |
| Inline-editable cards (Layer 1) | Not started | Cards are read-only |
| Sidebar tasks ("Att gora") | Not started | No task sources, no sidebar section |
| Cascades (payroll -> vacation accrual) | Partially wired | Needs verification for invoice, dividend |
| "Ga till [sida]" with highlighting | Not started | Navigation exists but no item highlighting |
| Model tier system (Snabb/Smart/Expert) | Partially wired | model-auth.ts exists, not connected to UI selection |

## Files in This Chain

| File | Role |
|------|------|
| `src/components/ai/chat-input.tsx` | UI input capture |
| `src/providers/chat-provider.tsx` | State orchestration + send logic |
| `src/hooks/use-chat.ts` | Vercel AI SDK bridge |
| `src/app/api/chat/route.ts` | API handler — the 10 gates |
| `src/lib/agents/types.ts` | AgentContext + AgentMessage types |
| `src/lib/agents/scope-brain/system-prompt.ts` | System prompt builder |
| `src/lib/agents/scope-brain/model-selector.ts` | Model selection (currently returns default) |
| `src/lib/agents/scope-brain/scenarios-loader.ts` | Loads knowledge master + scenario files |
| `src/lib/ai-tools/index.ts` | Tool initialization (registers all 60+) |
| `src/lib/ai-tools/registry.ts` | Tool registry + execution + confirmation |
| `src/lib/ai-tools/vercel-adapter.ts` | Converts AITools to Vercel SDK format |
| `src/lib/ai-tools/types.ts` | AITool, AIToolResult type definitions |
| `src/lib/validation.ts` | Zod schemas for message validation |
| `src/lib/database/auth-server.ts` | Auth + company membership lookup |
| `src/lib/model-auth.ts` | Token budget + model authorization |
| `src/lib/rate-limiter.ts` | Rate limiting |

## Execution Order

1. Fix company lookup — add `.eq('id', companyId)` filter (P0, unblocks chat entirely)
2. Fix message format extraction (P0, ensures content reaches OpenAI correctly)
3. Restructure route into Gate → Stream → Persist pattern (P0, ~300ms latency win)
   - Move message saves + conversation creation into `onFinish`
   - Move activity snapshot + memory injection to parallel promises with timeout
   - Use `toUIMessageStreamResponse({ onFinish })` per Vercel SDK docs
4. Wire validateChatMessages or remove dead import (P1)
5. Address silent error swallowing (P1)
6. Fix transport body stale closure (P2)
7. Fix conversation persistence (P2)
8. Build missing features (summary skills, editable cards, tasks, cascades)
