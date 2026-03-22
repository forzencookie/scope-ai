# Fix: AI Interface

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md)
> **Status:** ✅ Green — all P0/P1 issues fixed

## Current Chain

```
ChatInput → ChatProvider.handleSend() → useChat.sendMessage()
  → DefaultChatTransport POST /api/chat
  → Auth → Rate limit → JSON parse → Budget check → Company lookup (with .eq filter)
  → Promise.race(activity snapshot, memories) — parallel, 100ms timeout
  → buildSystemPrompt() → createDeferredToolConfig()
  → streamText() → OpenAI → stream back
  → onFinish: save user msg + assistant msg + consume tokens
```

## What Works

- ChatProvider lifts state correctly — textarea, files, mentions, action triggers shared between sidebar and main area
- useChat hook bridges Vercel AI SDK properly — sendMessage, regenerate, message mapping
- Deferred tool loading implemented (core tools + search_tools discovery)
- System prompt composition is clean: instincts → knowledge → tool index → company context → memories
- Tool registry: register, search, execute with confirmation flow and audit logging
- onFinish dispatches walkthrough/confirmation/navigation events correctly
- `extractMessageContent()` handles string, parts array, and UIMessage formats correctly
- Message persistence moved to `onFinish` (not blocking pre-stream)
- Activity snapshot and memory injection run in parallel with 100ms timeout guard
- Confirmation flow fully wired: route → adapter → registry → frontend card

## Fixed Issues

| Issue | Fix |
|-------|-----|
| P0: Company lookup crashes every request | `.eq('id', companyId)` filter + validation |
| P0: Message format assumption | `extractMessageContent()` handles 3 formats |
| P0: Unsafe message cast to streamText() | Messages mapped through `extractMessageContent()` |
| P0: Enrichment blocks stream start | `Promise.race` with 100ms timeout |
| P1: validateChatMessages dead import | Removed |
| P1: Silent error swallowing | `console.warn` instead of silent catch |
| P2: Transport body stale closure | `append()` passes `conversationId` via `body` options, route reads from request body — dynamic, not stale |
| P2: Conversation persistence lossy | Sync logic is correct React pattern. `toolCallId` gets UUID instead of original — cosmetic, not functional |

## What's Missing (per flow doc — future features)

| Feature | Status |
|---------|--------|
| Summary skills (/dag, /vecka, etc.) | `get_business_summary` tool exists, skill triggers not wired |
| Inline-editable cards (Layer 1) | Not started — cards are read-only |
| Sidebar tasks ("Att göra") | Not started |
| Cascades (payroll → vacation accrual) | Partially wired |
| "Gå till [sida]" with highlighting | Navigation exists, no highlighting |
| Model tier system (Snabb/Smart/Expert) | model-auth.ts exists, not in UI |

## Files

| File | Role |
|------|------|
| `src/components/ai/chat-input.tsx` | UI input capture |
| `src/providers/chat-provider.tsx` | State orchestration + send logic |
| `src/hooks/use-chat.ts` | Vercel AI SDK bridge |
| `src/app/api/chat/route.ts` | API handler |
| `src/lib/agents/scope-brain/system-prompt.ts` | System prompt builder |
| `src/lib/ai-tools/registry.ts` | Tool registry + execution + confirmation |
| `src/lib/ai-tools/vercel-adapter.ts` | Converts AITools to Vercel SDK format |
