# Scope AI Agent Architecture Refactor Plan

> **Status:** ✅ COMPLETE (Phase 1-5)  
> **Completed:** 2026-02-04  
> **Note:** Phase 6 (LLM pre-classification) is optional, implement only if pattern matching has >10% misclassification

## Overview

Refactoring from multi-agent orchestration to a single unified agent with intelligent model selection.

```
Current:  User → Classifier → Orchestrator (Gojo) → 10 Domain Agents → Tools
Target:   User → Model Selector → Scope AI Brain → Tools
```

## Why This Change?

1. **Simpler architecture** - One agent with full context, no information loss from decomposition
2. **Better reasoning** - Single LLM can reason across domains (e.g., "this salary affects VAT")
3. **Lower latency** - No classification hop, no agent handoffs
4. **Easier maintenance** - One system prompt vs 11 separate agents
5. **Cost efficient** - Smart model routing (Haiku/Sonnet/Sonnet+thinking)

---

## Phase 1: Create the Single Agent Brain

**Goal:** Build the new single agent alongside existing system (no breaking changes)

### 1.1 New Directory Structure

```
src/lib/agents/scope-brain/
├── agent.ts           # Single agent implementation
├── system-prompt.ts   # Comprehensive Swedish accounting prompt
├── model-selector.ts  # Haiku/Sonnet/Sonnet+thinking routing
└── index.ts
```

### 1.2 Unified System Prompt

Combines expertise from all 10 domain agents into one comprehensive prompt:

```typescript
// system-prompt.ts
export const SCOPE_BRAIN_PROMPT = `Du är Scope AI, en expert på svensk bokföring och företagsekonomi.

## Dina expertområden:
- Bokföring: Verifikationer, kontoplan, BAS-konton, avstämning
- Fakturering: Kundfakturor, betalningsuppföljning
- Löner: Löneberäkning, arbetsgivaravgifter, AGI, skatteavdrag
- Skatt: Moms, F-skatt, deklarationer, K10
- Rapporter: Resultaträkning, balansräkning, årsbokslut
- Compliance: Deadlines, myndighetskrav, Bolagsverket, Skatteverket

## Verktyg
Du har tillgång till verktyg för att utföra uppgifter. Använd dem när användaren ber dig göra något konkret.

## Regler
- Svara alltid på svenska
- Vid osäkerhet, fråga användaren
- Dubbelkolla belopp och datum innan du skapar verifikationer
- Förklara skattekonsekvenser när relevant
...`
```

### 1.3 Model Selector

Pattern-based routing to appropriate model/mode:

```typescript
// model-selector.ts
export type ModelConfig = {
  model: 'haiku' | 'sonnet'
  thinking: boolean
  thinkingBudget?: number
}

export function selectModel(query: string, detectedTools?: string[]): ModelConfig {
  const q = query.toLowerCase()

  // Complex → Sonnet + extended thinking
  const complexPatterns = [
    /planera/, /strategi/, /analys/, /optimera/, /rekommend/,
    /årsbokslut/, /skatteplanering/, /budget/, /prognos/
  ]
  if (complexPatterns.some(p => p.test(q))) {
    return { model: 'sonnet', thinking: true, thinkingBudget: 8000 }
  }

  // Write operations → Sonnet (no thinking)
  const writeTools = ['create_verification', 'generate_payslip', 'generate_agi', 'create_invoice']
  if (detectedTools?.some(t => writeTools.includes(t))) {
    return { model: 'sonnet', thinking: false }
  }

  // Simple lookups → Haiku
  const simplePatterns = [/visa/, /hämta/, /lista/, /öppna/, /gå till/]
  if (simplePatterns.some(p => p.test(q))) {
    return { model: 'haiku', thinking: false }
  }

  // Default
  return { model: 'sonnet', thinking: false }
}
```

### 1.4 Brain Agent Implementation

```typescript
// agent.ts
export class ScopeBrain {
  async handle(message: string, context: Context): Promise<StreamingResponse> {
    const modelConfig = selectModel(message)

    const response = await this.callAnthropic({
      model: modelConfig.model === 'haiku'
        ? 'claude-haiku-3-5-20241022'
        : 'claude-sonnet-4-20250514',
      thinking: modelConfig.thinking
        ? { type: 'enabled', budget_tokens: modelConfig.thinkingBudget }
        : undefined,
      system: buildSystemPrompt(context),
      messages: context.conversationHistory,
      tools: getAllTools()  // All 60 tools available
    })

    return this.streamResponse(response)
  }
}
```

---

## Phase 2: New API Route (Parallel to Existing)

**Goal:** Test new system without breaking existing users

Create new route at `/api/chat/v2` while keeping existing `/api/chat/agents` working:

```typescript
// src/app/api/chat/v2/route.ts
import { ScopeBrain } from '@/lib/agents/scope-brain'

export async function POST(req: Request) {
  const { messages, companyId } = await req.json()

  const brain = new ScopeBrain()
  const context = await buildContext(companyId, messages)

  return brain.handle(messages.at(-1).content, context)
}
```

### Testing Strategy

- Feature flag to route users to v2
- A/B test response quality
- Monitor latency and costs
- Gather user feedback

---

## Phase 3: Migrate Tools

**Goal:** Ensure all tools work with single agent

### 3.1 Audit Tool Registry

Existing `AIToolRegistry` stays intact. Verify all tools have:
- Clear descriptions (LLM needs to understand when to use them)
- Proper parameter schemas
- No agent-specific assumptions

### 3.2 Improve Tool Descriptions

```typescript
// Before (vague)
{ name: 'get_transactions', description: 'Hämtar transaktioner' }

// After (clear for single agent)
{
  name: 'get_transactions',
  description: 'Hämtar banktransaktioner för ett datumintervall. Använd för att visa kontoutdrag, hitta specifika betalningar, eller förbereda avstämning.',
  parameters: { ... }
}
```

### 3.3 Tool Categories to Audit

- [ ] Bokföring tools
- [ ] Faktura tools
- [ ] Löner tools
- [ ] Skatt tools
- [ ] Rapport tools
- [ ] Compliance tools
- [ ] Navigation tools

---

## Phase 4: Simplify Streaming

**Goal:** Clean up streaming to work with Anthropic's format

Simplify streaming protocol:

```typescript
async *streamResponse(response: AnthropicStream) {
  for await (const event of response) {
    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'thinking_delta') {
        // Optionally stream thinking for transparency
        yield `TH:${event.delta.thinking}\n`
      }
      if (event.delta.type === 'text_delta') {
        yield `T:${JSON.stringify(event.delta.text)}\n`
      }
    }
    if (event.type === 'tool_use') {
      const result = await this.executeTool(event)
      yield `D:${JSON.stringify(result)}\n`
    }
  }
}
```

### Streaming Protocol Changes

| Old | New | Notes |
|-----|-----|-------|
| `A:<agent info>` | Removed | No longer needed |
| `T:<text>` | `T:<text>` | Keep |
| `D:<data>` | `D:<data>` | Keep |
| `E:<error>` | `E:<error>` | Keep |
| - | `TH:<thinking>` | Optional: stream extended thinking |

---

## Phase 5: Remove Old Multi-Agent Code

**Goal:** Clean up codebase once v2 is stable

### Prerequisites Before Deletion

- [ ] v2 has been in production for 2+ weeks
- [ ] No critical bugs reported
- [ ] Performance metrics are equal or better
- [ ] All edge cases handled
- [ ] Team sign-off

### Files to Delete

```
src/lib/agents/orchestrator/          # Gojo orchestrator
├── agent.ts
├── classifier.ts
└── router.ts

src/lib/agents/domains/               # 10 domain agents
├── bokforing-agent.ts
├── receipt-agent.ts
├── invoice-agent.ts
├── loner-agent.ts
├── skatt-agent.ts
├── rapporter-agent.ts
├── compliance-agent.ts
├── statistik-agent.ts
├── handelser-agent.ts
└── installningar-agent.ts

src/lib/agents/message-bus.ts         # Agent communication
src/lib/agents/registry.ts            # Agent registry
src/lib/agents/base-agent.ts          # Base class (if not reused)

src/app/api/chat/agents/              # Old API route
├── route.ts
├── handlers.ts
├── streaming.ts
└── intent-mapper.ts
```

### Files to Keep

```
src/lib/ai-tools/                     # Tool definitions and registry (KEEP)
├── registry.ts
├── bokforing/
├── loner/
├── skatt/
└── ...

src/lib/agents/scope-brain/           # New single agent (KEEP)
├── agent.ts
├── system-prompt.ts
├── model-selector.ts
└── index.ts

src/app/api/chat/v2/                  # New route → rename to /api/chat
└── route.ts
```

### Deletion Checklist

1. [ ] Remove feature flag routing to old system
2. [ ] Delete old agent files
3. [ ] Delete old API route
4. [ ] Rename `/api/chat/v2` to `/api/chat`
5. [ ] Update any imports/references
6. [ ] Remove unused dependencies
7. [ ] Update documentation

---

## Phase 6: Enhance Model Selection (Optional)

If pattern matching isn't accurate enough, add Haiku pre-classification:

```typescript
async function selectModelWithLLM(query: string): Promise<ModelConfig> {
  const classification = await anthropic.messages.create({
    model: 'claude-haiku-3-5-20241022',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Klassificera denna bokföringsfråga:

"${query}"

Svara med ETT ord:
- SIMPLE: Visa data, navigering, enkla frågor
- MEDIUM: Beräkningar, skapa poster, förklaringar
- COMPLEX: Planering, analys, rådgivning, flera steg`
    }]
  })

  const level = classification.content[0].text.trim()

  switch (level) {
    case 'SIMPLE':
      return { model: 'haiku', thinking: false }
    case 'MEDIUM':
      return { model: 'sonnet', thinking: false }
    case 'COMPLEX':
      return { model: 'sonnet', thinking: true, thinkingBudget: 8000 }
    default:
      return { model: 'sonnet', thinking: false }
  }
}
```

**Cost:** ~$0.0002 per classification
**When to implement:** If pattern-based routing has >10% misclassification rate

---

## Phase 7: Session Feedback & Learning Loop (RLHF)

**Goal:** Implement a reinforcement learning feedback system where the AI learns from user satisfaction ratings.

### 7.1 Concept

Similar to how AlphaGo learned chess through reward signals:
- User completes a session with the AI
- AI detects session completion and prompts for rating (1-10)
- Rating + session context is saved
- AI learns from highly-rated sessions to improve future interactions

```
Session Flow:
User ←→ Scope AI ←→ [Task Complete]
                         ↓
              [Rating Prompt UI: 1-10]
                         ↓
              [Save Session + Rating]
                         ↓
              [Learn from patterns]
```

### 7.2 Session Detection

Detect when a session/task is "complete":

```typescript
// Signals that a task is done:
const SESSION_COMPLETE_SIGNALS = [
  // Explicit completion
  /tack|bra|perfekt|precis|exakt/i,

  // Task confirmation received
  toolResult.type === 'confirmation_accepted',

  // Navigation away (implicit completion)
  toolResult.navigation !== undefined,

  // Idle timeout (e.g., 2 min without follow-up)
  timeSinceLastMessage > 120000,
]
```

### 7.3 Rating UI Component

```typescript
// components/ai/SessionRatingPrompt.tsx
interface SessionRatingProps {
  sessionId: string
  onRate: (rating: number, feedback?: string) => void
  onDismiss: () => void
}

// Simple 1-10 scale with optional text feedback
// Stars or number buttons
// "Vad kunde varit bättre?" optional text field
```

### 7.4 Database Schema

```sql
-- Session feedback table
CREATE TABLE ai_session_feedback (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES ai_sessions(id),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),

  -- Rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  feedback_text TEXT,

  -- Session context (for learning)
  query_summary TEXT,           -- What the user asked
  tools_used TEXT[],            -- Which tools were invoked
  model_used TEXT,              -- haiku/sonnet/sonnet+thinking
  response_summary TEXT,        -- How the AI responded
  turn_count INTEGER,           -- Number of back-and-forths

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learned patterns table
CREATE TABLE ai_learned_patterns (
  id UUID PRIMARY KEY,
  pattern_type TEXT,            -- 'response_style', 'tool_preference', 'explanation_depth'
  pattern_key TEXT,             -- e.g., 'user_123_prefers_detailed'
  pattern_value JSONB,          -- Pattern data
  confidence FLOAT,             -- 0-1 based on feedback count
  feedback_count INTEGER,       -- How many ratings contributed
  avg_rating FLOAT,             -- Average rating for this pattern
  updated_at TIMESTAMP
);
```

### 7.5 Learning Algorithm

```typescript
// lib/agents/scope-brain/learning.ts

interface LearnedPreference {
  userId: string
  preferences: {
    explanationDepth: 'brief' | 'detailed' | 'step-by-step'
    responseStyle: 'formal' | 'casual' | 'technical'
    preferredTools: string[]
    avoidPatterns: string[]
  }
  confidence: number
}

async function learnFromFeedback(
  sessionId: string,
  rating: number,
  sessionData: SessionData
): Promise<void> {
  // High ratings (8-10): Reinforce patterns
  if (rating >= 8) {
    await reinforcePatterns(sessionData)
  }

  // Low ratings (1-4): Learn to avoid patterns
  if (rating <= 4) {
    await penalizePatterns(sessionData)
  }

  // Update user preference model
  await updateUserPreferences(sessionData.userId, rating, sessionData)
}

async function reinforcePatterns(session: SessionData) {
  // Extract what worked well:
  // - Response length/style
  // - Tools used
  // - Explanation approach
  // - Block composition choices

  const patterns = extractPatterns(session)

  for (const pattern of patterns) {
    await db.upsert('ai_learned_patterns', {
      pattern_key: pattern.key,
      pattern_value: pattern.value,
      confidence: sql`confidence * 1.1`,  // Increase confidence
      avg_rating: sql`(avg_rating * feedback_count + ${session.rating}) / (feedback_count + 1)`,
      feedback_count: sql`feedback_count + 1`,
    })
  }
}
```

### 7.6 Applying Learned Preferences

Inject learned preferences into system prompt:

```typescript
// In system-prompt.ts
export function buildSystemPrompt(context: AgentContext): string {
  let prompt = SCOPE_BRAIN_PROMPT

  // Add learned user preferences
  const prefs = await getUserPreferences(context.userId)

  if (prefs && prefs.confidence > 0.7) {
    prompt += `\n\n## Användarpreferenser (Inlärda)\n`
    prompt += `Denna användare föredrar:\n`

    if (prefs.explanationDepth === 'detailed') {
      prompt += `- Detaljerade förklaringar med steg-för-steg\n`
    }
    if (prefs.responseStyle === 'casual') {
      prompt += `- Avslappnad, vänlig ton\n`
    }
    if (prefs.preferredTools.length > 0) {
      prompt += `- Föredrar verktygen: ${prefs.preferredTools.join(', ')}\n`
    }
  }

  return prompt
}
```

### 7.7 Implementation Phases

| Step | What | Priority |
|------|------|----------|
| 7.1 | Add rating UI component | High |
| 7.2 | Session completion detection | High |
| 7.3 | Database schema for feedback | High |
| 7.4 | Basic pattern storage | Medium |
| 7.5 | Preference injection in prompt | Medium |
| 7.6 | Advanced learning algorithms | Low (future) |

### 7.8 Privacy Considerations

- Users can opt-out of learning
- No PII stored in patterns (only behavioral preferences)
- Patterns are per-user, not shared across users
- "Forget me" button clears learned preferences

### 7.9 Success Metrics

- Average rating improves over time per user
- Repeat users have higher ratings than new users
- Fewer follow-up clarifications needed
- Session completion rate increases

---

## Summary: File Changes

| Action | Files |
|--------|-------|
| **Create** | `src/lib/agents/scope-brain/*` |
| **Create** | `src/app/api/chat/v2/route.ts` |
| **Create** | `src/lib/agents/scope-brain/learning.ts` (Phase 7) |
| **Create** | `src/components/ai/SessionRatingPrompt.tsx` (Phase 7) |
| **Modify** | `src/lib/ai-tools/registry.ts` (improve descriptions) |
| **Modify** | `src/lib/ai-tools/*/` (audit tool definitions) |
| **Modify** | Database schema (add feedback tables - Phase 7) |
| **Delete** | `src/lib/agents/orchestrator/*` |
| **Delete** | `src/lib/agents/domains/*` |
| **Delete** | `src/lib/agents/message-bus.ts` |
| **Delete** | `src/lib/agents/registry.ts` |
| **Delete** | `src/app/api/chat/agents/*` |

---

## Cost Comparison

### Before (Multi-Agent)

| Step | Model | Cost |
|------|-------|------|
| Classification | gpt-4o-mini | $0.0003 |
| Agent response | gpt-4o / claude | $0.01 |
| **Total** | | ~$0.01 |

### After (Single Agent)

| Query Type | Model | Cost |
|------------|-------|------|
| Simple (50%) | Haiku | $0.001 |
| Medium (40%) | Sonnet | $0.01 |
| Complex (10%) | Sonnet + thinking | $0.03 |
| **Blended avg** | | ~$0.007 |

**Estimated savings: 30% reduction in AI costs**

---

## Timeline

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 1: Create brain | 2-3 days | None (additive) | ✅ COMPLETE |
| Phase 2: New API route | 1 day | None (parallel) | ✅ COMPLETE |
| Phase 3: Migrate tools | 2-3 days | Low |
| Phase 4: Simplify streaming | 1 day | Low |
| Phase 5: Remove old code | 1 day | Medium (wait for stability) |
| Phase 6: Enhance selection | Optional | Low |
| Phase 7: Feedback & Learning | 3-5 days | Low (additive) |

**Total: ~2-3 weeks** (excluding stabilization period before Phase 5)

---

## Rollback Plan

If issues arise after deployment:

1. Feature flag exists to route back to old system
2. Old code remains until Phase 5
3. Database schema unchanged
4. Tool implementations unchanged

Low-risk migration with clear rollback path.
