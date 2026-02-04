# AI Architecture v2 - Scenario-First Design

> Replaces `ai-memory-architecture.md` with a simpler, AI-native approach.

---

## Core Insight

LLMs don't need human-style memory retrieval. They excel at:
- Pattern matching from examples (few-shot learning)
- Large context windows (200k tokens)
- Implicit reasoning over examples

**Architecture principle:** Load scenarios as few-shot examples. Use memory only for user-specific personalization.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  SYSTEM PROMPT (~15k tokens)                        │
│                                                     │
│  ├── [500 tokens] Core Instincts                    │
│  │   "How to think" - minimal reasoning rules       │
│  │                                                  │
│  ├── [10k tokens] Scenarios (few-shot examples)     │
│  │   All of ai-conversation-scenarios.md            │
│  │   LLM pattern-matches against these natively     │
│  │                                                  │
│  ├── [2k tokens] Company Context                    │
│  │   Company type, employees, current page, KPIs    │
│  │                                                  │
│  └── [2k tokens] User Memory (when relevant)        │
│      Queried only for personalization               │
│      "Has this user discussed dividends before?"    │
│                                                     │
└─────────────────────────────────────────────────────┘
                         ↓
              LLM processes request
              Pattern-matches to scenarios
              Uses tools as needed
                         ↓
              Post-conversation:
              Extract user-specific facts → Memory
```

---

## Layer 1: Core Instincts (~500 tokens)

Minimal "how to think" rules. Not domain knowledge.

```markdown
## Core Instincts

1. **Clarification Loop**
   If you don't have enough information to act, ask ONE clear question.
   Repeat until you have what you need. Don't guess.

2. **Tone Matching**
   - User sounds confused → simplify, use analogies
   - User is brief/expert → match their pace, skip basics
   - User is anxious → reassure first, then solve

3. **Problem-First**
   If something is wrong (blocking issue, warning), address it FIRST
   before showing data or answering the original question.

4. **Action Orientation**
   After answering, offer the logical next step.
   "Vill du att jag skickar påminnelser?" not just listing data.

5. **Pattern Matching**
   The scenarios below show how to handle common situations.
   Match the user's request to the closest scenario and follow that pattern.
```

---

## Layer 2: Scenarios (~10k tokens)

The entire `ai-conversation-scenarios.md` file, loaded directly.

**Why this works:**
- LLMs learn from examples (few-shot learning)
- 2500 lines ≈ 10k tokens = 5% of context
- No retrieval step needed - instant pattern matching

**Format in prompt:**
```markdown
## Scenarios

The following are example conversations showing how to handle
common situations. Match the user's request to the closest scenario.

---

### Bokföring > Transaktioner > Scenario 1: New user, confused

**User:** hej jag är ny här, massa transaktioner som är röda...
**You:** [explanation of colors] + [offer to help kontera]

---

### Bokföring > Fakturor > Scenario 2: Overdue invoices

**User:** har nån kund inte betalat?
**You:** [list overdue] + [offer to send reminders]

---
[... all scenarios ...]
```

---

## Layer 3: Company Context (~2k tokens)

Injected per-request. Real-time KPIs and context.

```markdown
## Current Context

**Company:** Example AB (Aktiebolag)
**Fiscal Year:** Jan-Dec
**Accounting Method:** Invoice (fakturametoden)
**Employees:** 2

**Current Page:** Bokföring > Transaktioner
**Unbooked Transactions:** 12
**Unpaid Customer Invoices:** 45,000 kr
**Bank Balance:** 234,500 kr
**Next Deadline:** AGI due Feb 12
```

---

## Layer 4: User Memory (~2k tokens, only when relevant)

**Key difference from old approach:**
- Memory is NOT pre-stuffed into every request
- Memory is QUERIED when the scenario suggests it's relevant
- Only stores user/company-specific facts, not domain knowledge

### What Gets Stored

| Category | Example | TTL |
|----------|---------|-----|
| **Decision** | "Took 120k dividend Dec 2025" | Never expires |
| **Preference** | "Prefers simple explanations" | Never expires |
| **Pending** | "Considering hiring third employee" | 30 days |

### What Does NOT Get Stored

- Domain knowledge (scenarios have this)
- Current financial numbers (live KPIs have this)
- Conversation transcripts (summarize, don't store)

### Database Schema

```sql
CREATE TABLE user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('decision', 'preference', 'pending')),
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- NULL = never
    superseded_by UUID REFERENCES user_memory(id),
    source_conversation_id UUID
);

CREATE INDEX idx_user_memory_active ON user_memory (company_id)
WHERE superseded_by IS NULL AND (expires_at IS NULL OR expires_at > NOW());
```

### Memory Operations

Post-conversation extraction (async):
1. LLM reviews conversation
2. Extracts user-specific facts
3. For each fact: ADD (new) | UPDATE (refine existing) | DELETE (contradicts)
4. Never hard-delete - use `superseded_by`

---

## Request Flow

```
1. User sends message

2. Build system prompt:
   ├── Core instincts (static)
   ├── All scenarios (static, from file)
   ├── Company context (live KPIs)
   └── Recent conversation messages

3. LLM processes:
   ├── Pattern-matches to closest scenario
   ├── If scenario suggests checking memory → query memory
   ├── Follows scenario's response pattern
   └── Uses tools as needed

4. Response sent

5. Post-conversation (async, when conversation ends):
   ├── Extract user-specific facts
   └── ADD/UPDATE/DELETE to user_memory
```

---

## Implementation Checklist

### Phase 1: Update System Prompt ✨
- [ ] Rewrite `system-prompt.ts` with instinct-first structure
- [ ] Load `ai-conversation-scenarios.md` directly into prompt
- [ ] Add company context injection
- [ ] Remove old "expertise" listing (domain knowledge in scenarios)

### Phase 2: User Memory
- [ ] Create `user_memory` table migration
- [ ] Create `UserMemoryService` for CRUD + query
- [ ] Add post-conversation extraction job
- [ ] Add memory query tool for AI

### Phase 3: Verify & Test
- [ ] Test with scenarios from the doc
- [ ] Verify pattern matching works
- [ ] Test memory extraction
- [ ] Measure token usage

---

## Token Budget

| Component | Tokens | Notes |
|-----------|--------|-------|
| Core instincts | 500 | Static |
| Scenarios | 10,000 | From file |
| Company context | 2,000 | Per-request |
| User memory | 1,000 | When queried |
| Conversation | 5,000 | Recent messages |
| **Total** | **~18,500** | 9% of 200k |

Leaves ~180k tokens for AI reasoning + response.

---

## Key Differences from v1

| v1 (ai-memory-architecture.md) | v2 (This doc) |
|-------------------------------|---------------|
| RAG for knowledge retrieval | Scenarios pre-loaded |
| 4-layer memory hierarchy | 2 layers: scenarios + user memory |
| Complex decay/compression | Simple - narrow memory scope |
| Memory stuffed into every request | Memory queried when relevant |
| Sliding window summarization | Not needed (scenarios cover patterns) |
| Monthly compression jobs | Not needed (memory is small) |

---

## Principles

1. **Scenarios are the knowledge** - Don't duplicate in memory
2. **Memory is for personalization** - User-specific facts only
3. **Load, don't retrieve** - Use context window capacity
4. **Pattern match natively** - LLMs already do this
5. **Audit trail matters** - Never hard-delete (superseded_by)
