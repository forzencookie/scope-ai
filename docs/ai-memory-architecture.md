# AI Memory Architecture

How Scope's AI companion remembers, forgets, and gets smarter over time.

---

## Current State

Each conversation is isolated. The AI receives:
1. Static system prompt (Swedish accounting domain knowledge)
2. Live company KPIs injected per request (unpaid invoices, unread inbox, etc.)
3. Current conversation messages (verbatim, all of them)

No cross-conversation memory. No summarization. No decay. A new chat starts from zero context every time.

---

## Target Architecture

```
Every AI request receives:

┌─────────────────────────────────────────────────┐
│  1. System Prompt (static, ~2k tokens)          │
├─────────────────────────────────────────────────┤
│  2. Company Memory (cross-conversation,         │
│     compressed insights, ~1-3k tokens)          │
├─────────────────────────────────────────────────┤
│  3. Live Company State (real-time KPIs,         │
│     ~500 tokens)                                │
├─────────────────────────────────────────────────┤
│  4. Conversation Context                        │
│     ├── Summary of older messages (~500 tokens) │
│     └── Recent messages verbatim (~4-8k tokens) │
├─────────────────────────────────────────────────┤
│  5. Current user message                        │
└─────────────────────────────────────────────────┘

Total context budget: ~10-15k tokens out of 200k available
Leaves ~185k for AI reasoning + response generation
```

---

## Layer 1 — Conversation Context (within a single chat)

### Problem
Today all messages are sent verbatim. A 50-message conversation burns tokens on early small talk that no longer matters.

### Solution: Sliding Window + Summary

Keep the last N messages verbatim. Summarize everything before that into a single context block.

```
Messages 1-30:  → Summarized into ~200 tokens
Messages 31-50: → Sent verbatim
```

### Implementation

**When to summarize:** After every 20 messages, summarize the oldest batch. This runs server-side before calling the model.

**What the summary captures:**
- Decisions made ("user chose to take 150k dividend")
- Questions answered ("explained difference between K2 and K3")
- Current task state ("halfway through kontering of October transactions")
- User's apparent skill level and tone

**What the summary drops:**
- Greetings, filler, pleasantries
- Repeated clarifications that led to a final answer
- Intermediate tool outputs that were already acted on

**Storage:** Add a `summary` TEXT column to `conversations`. Updated incrementally as batches are compressed. The summary is prepended to the message array as a system message before sending to the model.

**Format sent to model:**
```
[CONVERSATION CONTEXT]
Earlier in this conversation:
- User asked about October VAT, I showed a dynamic walkthrough
- User is a beginner, prefers simple Swedish explanations
- We identified 3 transactions that need manual review
- User decided to postpone closing October until invoices are paid
[END CONTEXT]
```

### Token budget
- Summary: ~200-500 tokens (grows slowly, gets re-summarized if too long)
- Verbatim window: last 20 messages, ~4-8k tokens
- Total per-conversation: ~5-9k tokens

---

## Layer 2 — Company Memory (cross-conversation)

This is the core innovation. Since each account maps to one company, the company itself is the "project." Every conversation contributes knowledge to a shared memory pool.

### What gets remembered

**Category 1 — Decisions & Actions**
- "Took 150,000 kr in dividend on 2025-12-15"
- "Chose K2 over K3 for annual report"
- "Hired employee Anna Svensson, started 2025-11-01"
- "Set up quarterly VAT reporting"

**Category 2 — User Preferences**
- "Prefers simple explanations, beginner level"
- "Wants proactive reminders for deadlines"
- "Usually chats in casual Swedish, uses 'du'"
- "Asks about tax implications before every decision"

**Category 3 — Company Knowledge**
- "Has 2 employees, considering a third"
- "Main revenue from consulting (konto 3010)"
- "Fiscal year Jan-Dec, uses BAS 2024"
- "Owner holds 100% of shares, no minority shareholders"

**Category 4 — Unresolved Items**
- "Discussed selling the company but hasn't decided"
- "Needs to review October transactions — postponed"
- "Mentioned wanting to understand K10 better"

### What does NOT get remembered
- Casual greetings, jokes, off-topic chat
- Intermediate debugging steps that resolved
- Raw financial numbers (already in the live DB)
- Anything the live KPI injection already covers

### Database Schema

```sql
CREATE TABLE company_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'decision', 'preference', 'knowledge', 'unresolved'
    )),
    content TEXT NOT NULL,
    source_conversation_id UUID REFERENCES conversations(id),
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- NULL = never expires
    superseded_by UUID REFERENCES company_memory(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_company_memory_active
    ON company_memory (company_id, category)
    WHERE superseded_by IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
```

Key design choices:
- **`superseded_by`**: When new info contradicts old, the old entry points to its replacement rather than being deleted. Keeps audit trail.
- **`confidence`**: Extracted facts start at 1.0, decay over time or get boosted when re-confirmed.
- **`expires_at`**: Unresolved items auto-expire after 30 days. Decisions persist indefinitely.
- **`category`**: Enables selective injection — e.g., always inject preferences, only inject decisions when relevant.

### Extraction Process

After each conversation ends (user navigates away or starts a new chat), run an async extraction job:

```
Input:  Full conversation transcript
Prompt: "Extract memorable facts from this conversation.
         Return JSON array of {category, content, confidence}.
         Only extract information worth remembering across sessions.
         Do not extract anything already captured in the company database."
Output: [{category: "decision", content: "User decided to take 120k dividend", confidence: 0.95}, ...]
```

**When to run:**
- Triggered when conversation becomes inactive (no new message for 5 minutes)
- Or when user starts a new conversation
- Runs as a background job, does not block the user

**Deduplication:**
Before inserting, check for semantic similarity with existing memories. If a new extraction overlaps with an existing one:
- Same fact, higher confidence → supersede the old one
- Same fact, lower confidence → skip
- Contradictory fact → supersede old, flag for review

### Injection into AI requests

On every new request, fetch active memories for the company:

```sql
SELECT category, content FROM company_memory
WHERE company_id = $1
  AND superseded_by IS NULL
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY
  CASE category
    WHEN 'preference' THEN 1  -- always first
    WHEN 'unresolved' THEN 2  -- high relevance
    WHEN 'decision' THEN 3
    WHEN 'knowledge' THEN 4
  END,
  created_at DESC
LIMIT 30;
```

**Format sent to model:**
```
[COMPANY MEMORY]
User preferences:
- Beginner, prefers simple Swedish explanations
- Wants proactive deadline reminders

Recent decisions:
- Took 120k dividend (Dec 2025)
- Using K2 for annual report

Company context:
- 2 employees, consulting firm
- Fiscal year Jan-Dec

Open items:
- Considering hiring a third employee
- October transactions not yet fully reviewed
[END COMPANY MEMORY]
```

Token budget: ~1-3k tokens depending on memory volume.

---

## Layer 3 — Memory Decay & Compression

Memory cannot grow forever. The system needs to forget gracefully.

### Decay Rules

| Category | Initial TTL | Decay behavior |
|---|---|---|
| `preference` | Never expires | Re-confirmed on use, superseded if contradicted |
| `decision` | Never expires | Becomes "historical" after 1 year, compressed into annual summary |
| `knowledge` | 6 months | Re-confirmed when user mentions again, otherwise fades |
| `unresolved` | 30 days | Expires unless user brings it up again |

### Compression Cycle

Run monthly (or when memory count exceeds 50 active entries):

1. **Group** related memories: all dividend-related, all employee-related, etc.
2. **Summarize** each group into a single entry: "User has taken dividends twice: 120k in Dec 2025, 100k in Jun 2025. Prefers to maximize within 3:12 rules."
3. **Supersede** the individual entries, pointing to the compressed summary
4. **Prune** expired unresolved items

This keeps the active memory pool between 15-30 entries at all times.

### Re-confirmation

When the AI notices a memory being relevant to the current conversation (e.g., user asks about dividends and there's a dividend memory), it should internally boost that memory's confidence. This is passive — no explicit "do you still want X?" questions.

If the user contradicts a stored memory ("actually I switched to K3"), the AI should:
1. Acknowledge the change
2. Supersede the old memory
3. Create new memory with the updated fact

---

## Layer 4 — Proactive Memory (AI-Initiated)

The companion shouldn't only remember — it should use memories to initiate.

### Trigger Conditions

On each page load or conversation start, check:

```
IF user has unresolved item older than 7 days:
  → "Förra veckan pratade vi om [X]. Vill du fortsätta med det?"

IF user made a decision that requires follow-up:
  → "Du bestämde dig för att ta utdelning. Ska jag förbereda K10:an?"

IF a deadline approaches and relates to a stored decision:
  → "Momsen ska in om 3 dagar. Förra gången ville du att jag förberedde — ska jag köra igen?"
```

These are injected as suggested prompts in the chat UI, not as unsolicited AI messages. The user chooses whether to engage.

---

## Implementation Priority

### Phase 1 — Fix fundamentals
- Fix past chat loading (messages not showing when clicking old conversations)
- Ensure messages are properly persisted and retrieved

### Phase 2 — Conversation-level compression
- Add `summary` column to `conversations`
- Implement sliding window: summarize after 20 messages
- Inject summary as system context

### Phase 3 — Company memory extraction
- Create `company_memory` table
- Build async extraction job (runs after conversation ends)
- Inject top memories into every request
- Basic deduplication

### Phase 4 — Decay & compression
- Monthly compression job
- TTL enforcement
- Supersession logic
- Re-confirmation boosting

### Phase 5 — Proactive memory
- Suggested prompts based on stored memories
- Deadline-aware nudges
- Follow-up detection

---

## Best Practices & Principles

### 1. Memory should be invisible
The user should never have to "manage" their AI's memory. No settings page for memories, no "delete this memory" button (at least initially). The system learns silently and the user simply notices the AI getting better.

### 2. Never hallucinate memories
If the AI isn't sure whether something was discussed, it should not pretend to remember. "Jag tror vi diskuterade X, stämmer det?" is better than confidently stating something wrong. The `confidence` field exists for this reason — low-confidence memories get hedged language.

### 3. Fresh data beats stale memory
Live KPIs from the database always override stored memories. If memory says "2 employees" but the DB shows 3, the DB wins. Memory is for soft knowledge that isn't captured in structured data.

### 4. Summarization model should be cheap and fast
Use a small model (GPT-4o-mini, Claude Haiku) for extraction and compression. These are background jobs — latency doesn't matter, cost does. Save the expensive model for actual user-facing conversations.

### 5. Context budget discipline
Never let memory injection exceed 3k tokens. If it would, compress more aggressively. The user's current question and the AI's reasoning space are always more important than historical context. A slim, high-signal memory block beats a verbose one.

### 6. Semantic deduplication over exact matching
"User took 120k dividend" and "Dividend of 120,000 kr was distributed" are the same fact. Use embedding similarity (or just ask the cheap model) to detect overlaps. Never store the same fact twice.

### 7. The company is the memory scope
All memory is scoped to `company_id`, not `user_id`. If multiple users share a company (future team plan), they share the memory pool. This means the AI knows what the accountant discussed even when the CEO is chatting.

### 8. Audit trail matters
Never hard-delete memories. The `superseded_by` chain lets you trace how the AI's understanding evolved. This is important for a financial product where decisions have legal weight.
