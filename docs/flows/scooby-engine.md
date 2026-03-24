# Workflow: Scooby Engine

> The technical brain behind Scooby. Context engineering, token management, memory architecture, and the systems that must work.

## What It Is

This doc covers how Scooby works under the hood — not what the user sees (that's `ai-interface.md`), but the engineering that makes it reliable, fast, and cost-effective.

## The Doctor Model

Like a doctor who shows up with a persona and general knowledge — not carrying every instrument in the hospital:

### Layer 1: Persona (Always Loaded, ~1,500 tokens)
```
Persona + tone + rules:        ~500 tokens
Company context (JSON block):  ~300 tokens  (type, period, fiscal year, momsperiod)
Relevant memories:             ~300 tokens  (5-8 filtered, not 20 blind)
Tool index:                    ~300 tokens  (60 names + one-liners, NO schemas)
search_tools meta-tool:        ~200 tokens  (the one tool always loaded)
─────────────────────────────────────────────
TOTAL before user speaks:    ~1,600 tokens
```

### Layer 2: Core Tools (Always Loaded, ~1,500 tokens)
The 5 most common tools — always in the pocket:
- `search_tools` — discovers other tools on demand
- `create_verification` — the most common write action
- `get_transactions` — the most common read action
- `navigate_to_page` — page navigation
- `get_company_info` — company context lookup

### Layer 3: Discovered Tools (On Demand, ~500-2,000 tokens)
User says "kör lönerna" → Scooby calls `search_tools("payroll löner")` → gets back `run_payroll`, `get_employees`, `calculate_employer_tax` → uses them. 3 tools loaded instead of 60.

### Layer 4: Deep Knowledge / Skills (On Demand, ~500-1,000 tokens)
For complex domains, Scooby loads a skill file:
- "Beräkna K10" → loads `skills/skatt/k10-rules.md`
- "Bokför transaktionen" → loads `skills/bokforing/SKILL.md`
- Simple question → loads nothing extra

**Total per request: ~3,000-4,000 tokens instead of 53,000. 90-95% reduction.**

## Token Budget

| State | Before | Target | Reduction |
|-------|--------|--------|-----------|
| System prompt (persona) | ~500 | ~500 | 0% |
| Scenarios (few-shot) | ~10,000 | 0 (moved to skills) | 100% |
| Tool definitions | ~40,000 | ~1,800 (5 core + index) | 95% |
| Company context | ~2,000 | ~300 (JSON scratchpad) | 85% |
| Memories | ~1,000 (20 blind) | ~300 (5-8 filtered) | 70% |
| **TOTAL before user speaks** | **~53,500** | **~2,900** | **95%** |

## Memory Architecture

Based on MemGPT/Letta model:

### In Context (visible to model)
- **Message Buffer** — recent conversation turns. FIFO eviction with summarization on overflow.
- **Core Memory (JSON scratchpad)** — editable JSON blocks pinned to context:
  - Company: `{ type: "AB", period: "Q1", ... }`
  - User: `{ style: "expert", prefs: [...] }`
  - Session: `{ currentTask: "payroll", ... }`

### Out of Context (searchable, not loaded)
- **Recall Memory** — complete interaction history, searchable via query tool
- **Archival Memory** — vector-indexed knowledge base: company rules, patterns, long-term preferences

**For Scope AI:**
- Core Memory (in context): Company JSON block + 5-8 relevant memories (~300 tokens)
- Recall Memory (out of context): Full `user_memory` table, searched with `query_memories` tool
- Archival Memory (out of context): BAS kontoplan, tax tables, legal rules — loaded via skill files on demand

### Memory Categories for Reports
- **task** — specific thing to do at a specific time (has expiry)
- **goal** — target to track against (year/quarter scoped)
- **decision** — strategic choice that affects advice (no expiry)
- **preference** — recurring pattern ("always close by the 5th")
- **note** — free-form context for future reports

## Context Management

### Context Rot
As token count increases, accuracy decreases. With 50+ tools, attention dilutes. This is architectural.

### Compaction Strategies
1. **Clear old tool results.** Once a tool has been called and Scooby acted on results, the raw output is dead weight. Clear it.
2. **Summarize on approach to context limit.** Summarize older messages. Preserve decisions and unresolved items; discard redundant details.
3. **Just-in-time context.** Don't pre-load data. Keep lightweight identifiers and dynamically load via tools at runtime.

### Artifact Handle Pattern
Large data (reports, payroll breakdowns) should NOT live in the prompt:
1. Tool generates large output → stored as artifact in Supabase
2. Model sees only a lightweight reference: `{ artifact_id: "payroll-march-2026", summary: "3 anställda, total 145K kr" }`
3. If model needs details → calls `load_artifact(id)`
4. After done → artifact offloads from context

## Sub-Agent Delegation

For complex tasks (monthly closing, annual report, tax declaration):
- Main conversation stays lightweight
- Complex task delegated to a sub-agent with focused context
- Sub-agent might use 30K tokens internally
- Returns only a 1-2K token summary to main conversation

Example: "stäng mars" → delegate to `month-close-agent` that loads period close skill, calls 5-6 tools, generates accruals, returns compact status card.

## The 6 Load-Bearing Systems

Everything else is polish. These must work:

### 1. Tool Calling — Reliable, Every Time
- User asks → Scooby calls right tool with right parameters
- Tool result renders as compact preview card
- Failures → clear error message, not silence
- Requires: slim context, proper descriptions, structured error returns

### 2. Deterministic Rule Engine
- All Swedish accounting/tax/legal calculations go through hardcoded rule tools
- AI never guesses a BAS account, tax rate, or legal threshold
- Rule tools versioned by year
- AI's role: understand intent, call rules, compose results

### 3. Conversation Persistence — Full Restore
- Click old conversation → everything loads: text, tool results, cards with editable state
- Requires: storing full Vercel `UIMessage` parts in DB, not just content strings

### 4. Streaming — No Dead States
- User sends → loading indicator → text streams → tool call fires → card renders → done
- Every state transition visible. No "nothing happened" moments.

### 5. Memory — Contextual, Not Dumb
- Ask about payroll → recalls payroll preferences
- Ask about VAT → recalls momsperiod
- Relevance filtering at injection time, not blanket top-20

### 6. Cascades — Automatic Downstream Effects
- Payroll → vacation accrual auto-posted
- Invoice → verification auto-created on confirm
- Dividend → withholding tax auto-posted
- User never manually creates the second entry

## Tool Design Principles (Cross-Lab Consensus)

1. **No functional overlap.** If a human can't say which tool to use, AI can't either.
2. **Keyword-rich descriptions.** Names and descriptions are the search index.
3. **Return high-signal responses.** Names, amounts, status — not raw DB rows with UUIDs.
4. **Actionable error messages.** Not `{ error: "INVALID_ACCOUNT" }`. Instead: `{ error: "Account 9999 not found. Did you mean 6110?" }`
5. **Flatten parameters.** Nested objects degrade performance.
6. **Add 1-3 examples for ambiguous tools.** Accuracy: 72% → 90%.
7. **Namespace by domain.** `bokforing:create_verification`, `loner:run_payroll`.
8. **Consolidate related reads.** Consider `query_data(type, filters)` over separate tools per entity.

## Research Sources

- [Anthropic: Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [Anthropic: Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills)
- [OpenAI: Function Calling](https://developers.openai.com/api/docs/guides/function-calling/)
- [Google: Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Google: ADK Multi-Agent](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
- [Speakeasy: 100x Token Reduction](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)
- [Letta/MemGPT: Agent Memory](https://www.letta.com/blog/agent-memory)
