# Multi-Agent Architecture

> ⚠️ **Note:** This is reference documentation for the multi-agent architecture. Review the source code for the current implementation.

## Overview

Scope AI uses a multi-agent architecture where specialized AI agents handle different domains of the accounting platform. This design provides:

- **Specialization**: Each agent is an expert in its domain
- **Scalability**: Agents can be improved independently
- **Clarity**: Smaller, focused prompts perform better than mega-prompts
- **Flexibility**: Easy to add new agents or modify existing ones
- **Observability**: Built-in metrics tracking for performance analysis

## Architecture

```
                              ┌─────────────────┐
                              │      GOJO       │
                              │  (Orchestrator) │
                              └────────┬────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │              │               │               │              │
        ▼              ▼               ▼               ▼              ▼
   ┌─────────┐   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Bokför- │   │ Receipt │    │ Invoice │    │  Löner  │    │  Skatt  │
   │  ing    │   │  Agent  │    │  Agent  │    │  Agent  │    │  Agent  │
   └─────────┘   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │              │               │               │              │
        └──────────────┴───────────────┴───────────────┴──────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │              │               │               │              │
        ▼              ▼               ▼               ▼              ▼
   ┌─────────┐   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Rapport │   │Complian-│    │Statistik│    │Händelser│    │Inställ- │
   │  Agent  │   │ce Agent │    │  Agent  │    │  Agent  │    │ningar   │
   └─────────┘   └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

## System Components

### Core Files

| File                               | Purpose                                          |
| ---------------------------------- | ------------------------------------------------ |
| `src/lib/agents/types.ts`          | Type definitions for agents, contexts, responses |
| `src/lib/agents/base-agent.ts`     | Abstract base class all agents extend            |
| `src/lib/agents/registry.ts`       | Agent registry singleton                         |
| `src/lib/agents/message-bus.ts`    | Inter-agent communication                        |
| `src/lib/agents/metrics.ts`        | Performance tracking and analytics               |
| `src/lib/agents/orchestrator/`     | Gojo orchestrator, classifier, router, planner   |
| `src/lib/agents/domains/`          | All 10 domain agents                             |
| `src/app/api/chat/agents/route.ts` | Production-ready streaming API endpoint          |
| `src/hooks/use-agent-chat.ts`      | React hook for agent chat UI                     |

## Agents

### Orchestrator (Gojo)

- **Role**: Routes requests, coordinates workflows
- **Model**: GPT-4o-mini (fast, cheap)
- **Capabilities**: Intent classification, agent selection, multi-step planning

### Core Business Agents

| Agent               | Domain     | Tools                                                             |
| ------------------- | ---------- | ----------------------------------------------------------------- |
| **BokforingAgent**  | Accounting | `create_verification`, `get_transactions`, `match_transaction`    |
| **ReceiptAgent**    | Expenses   | `create_receipt`, `extract_receipt`, `categorize_expense`         |
| **InvoiceAgent**    | Revenue    | `create_invoice`, `send_invoice`, `send_reminder`                 |
| **LonerAgent**      | Payroll    | `calculate_salary`, `generate_payslip`, `generate_agi`            |
| **SkattAgent**      | Tax        | `calculate_vat`, `calculate_k10`, `manage_periodiseringsfond`     |
| **RapporterAgent**  | Reports    | `generate_pl_report`, `generate_balance_sheet`, `compare_periods` |
| **ComplianceAgent** | Filings    | `get_deadlines`, `create_filing`, `check_requirements`            |

### Platform Control Agents

| Agent                  | Domain   | Tools                                                            |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| **StatistikAgent**     | KPIs     | `get_financial_kpis`, `get_revenue_trends`, `generate_insights`  |
| **HandelserAgent**     | Events   | `get_events`, `create_event`, `get_roadmap`                      |
| **InstallningarAgent** | Settings | `get_integrations`, `connect_integration`, `manage_team_members` |

## Usage

### Basic Usage

```typescript
import { handleUserMessage } from "@/lib/agents";

const response = await handleUserMessage(
  "Skapa en faktura till Företag AB på 10 000 kr",
  userId,
  companyId,
  "AB",
);

console.log(response.message);
// "Ska vi skapa en faktura! 📄..."
```

### With Full Context

```typescript
import {
  initializeAgents,
  processMessage,
  createAgentContext,
} from "@/lib/agents";

// Initialize once at startup
initializeAgents();

// Create context
const context = createAgentContext(
  userId,
  companyId,
  "AB",
  userMessage,
  conversationId,
);

// Add shared memory if needed
context.sharedMemory["uploadedImage"] = imageData;

// Process
const response = await processMessage(userMessage, context);
```

### API Endpoint

```bash
POST /api/chat/agents

{
    "message": "Hur går det för företaget?",
    "companyId": "company-123",
    "companyType": "AB"
}
```

## Agent Communication

Agents communicate through a message bus:

```typescript
// Request
{
    type: 'request',
    from: 'orchestrator',
    to: 'bokforing',
    content: 'Bokför 500 kr på konto 5410',
    correlationId: 'uuid'
}

// Response
{
    type: 'response',
    from: 'bokforing',
    to: 'user',
    content: 'Jag föreslår följande kontering...',
    confirmationRequired: { ... }
}

// Consultation
{
    type: 'consult',
    from: 'receipts',
    to: 'skatt',
    content: 'Vilken momssats gäller för detta?'
}
```

## Multi-Agent Workflows

For complex requests, the orchestrator creates a workflow plan:

```typescript
{
    name: 'Årsbokslut',
    steps: [
        { agentId: 'bokforing', task: 'Stäng öppna verifikationer' },
        { agentId: 'skatt', task: 'Beräkna periodiseringsfonder' },
        { agentId: 'rapporter', task: 'Generera årsredovisning' },
        { agentId: 'compliance', task: 'Kontrollera deadlines' }
    ]
}
```

## Adding a New Agent

1. Create a new folder in `src/lib/agents/domains/`:

```
src/lib/agents/domains/my-agent/
├── agent.ts
└── index.ts
```

2. Extend `BaseAgent`:

```typescript
import { BaseAgent } from "../../base-agent";
import type { AgentDomain, AgentContext, AgentResponse } from "../../types";

const MY_PROMPT = `# My Agent...`;

export class MyAgent extends BaseAgent {
  id: AgentDomain = "my-agent"; // Add to AgentDomain type
  name = "My Agent";
  description = "Does something useful";

  capabilities = ["keyword1", "keyword2"];
  tools = ["tool1", "tool2"];
  systemPrompt = MY_PROMPT;

  async handle(message: string, context: AgentContext): Promise<AgentResponse> {
    // Implementation
  }
}

export const myAgent = new MyAgent();
```

3. Register in `domains/index.ts`:

```typescript
export { MyAgent, myAgent } from "./my-agent";

// Add to domainAgents array
export const domainAgents = [
  // ...existing
  myAgent,
];
```

4. Add to `AgentDomain` type in `types.ts`:

```typescript
export type AgentDomain =
  // ...existing
  "my-agent";
```

5. Add intent patterns in `orchestrator/router.ts`:

```typescript
const INTENT_PATTERNS: Record<IntentCategory, RegExp[]> = {
  // ...
  MY_CATEGORY: [/keyword/i, /pattern/i],
};
```

## File Structure

```
src/lib/agents/
├── index.ts                      # Main exports, initialization
├── types.ts                      # Core interfaces
├── base-agent.ts                 # Abstract base class
├── registry.ts                   # Agent registration
├── message-bus.ts                # Inter-agent communication
│
├── orchestrator/
│   ├── index.ts
│   ├── agent.ts                  # Gojo (orchestrator)
│   ├── router.ts                 # Intent classification
│   └── planner.ts                # Workflow planning
│
└── domains/
    ├── index.ts
    ├── bokforing/
    ├── receipts/
    ├── invoices/
    ├── loner/
    ├── skatt/
    ├── rapporter/
    ├── compliance/
    ├── statistik/
    ├── handelser/
    └── installningar/
```

## Configuration

### Environment Variables

```bash
# Enable agent system (default: true in development)
AGENT_SYSTEM_ENABLED=true

# LLM API keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
```

## API Endpoint

### POST `/api/chat/agents`

Streaming endpoint for agent chat.

**Request:**

```json
{
  "messages": [{ "role": "user", "content": "Skapa en faktura..." }],
  "conversationId": "optional-uuid",
  "model": "gpt-4o",
  "attachments": [],
  "mentions": []
}
```

**Response (Streaming):**

```
T:"Jag skapar "
T:"fakturan..."
A:{"activeAgent":"invoices","agentName":"Faktura Agent"}
D:{"display":{"type":"card","data":{...}}}
D:{"toolResults":[{"tool":"create_invoice","success":true}]}
```

**Stream Protocol:**

- `T:` - Text chunk (JSON string)
- `D:` - Data payload (JSON object)
- `A:` - Agent info (which agent is active)
- `E:` - Error message

### Confirmation Flow

For destructive actions:

```json
{
  "confirmationId": "uuid-from-previous-response",
  "confirmationAction": "confirm"
}
```

## React Hook

```tsx
import { useAgentChat } from "@/hooks";

function ChatComponent() {
  const { messages, isLoading, activeAgent, sendMessage, stopGeneration } =
    useAgentChat();

  return (
    <div>
      {messages.map((m) => (
        <Message key={m.id} {...m} />
      ))}
      {activeAgent && <Badge>{activeAgent.name} is thinking...</Badge>}
      <ChatInput
        onSend={(content) => sendMessage({ content })}
        disabled={isLoading}
      />
    </div>
  );
}
```

## Metrics & Observability

Metrics are automatically tracked to the `agent_metrics` table:

```sql
SELECT
  selected_agent,
  COUNT(*) as requests,
  AVG(total_time_ms) as avg_time,
  SUM(CASE WHEN response_success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
FROM agent_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY selected_agent
ORDER BY requests DESC;
```

## Testing

```bash
# Run agent tests
npm test -- --testPathPattern=agents

# Test a specific agent
npm test -- src/lib/agents/domains/invoices
```

// Default configuration
const DEFAULT_AGENT_CONFIG: AgentConfig = {
maxConsultationDepth: 3, // Max nested agent consultations
maxHandoffs: 5, // Max agent-to-agent handoffs
routingConfidenceThreshold: 0.7, // Min confidence for auto-routing
enableLogging: true,
enableMetrics: true,
}

```

## Next Steps

1. **Scenario Library**: Add example interactions for few-shot learning
2. **LLM Classification**: Replace pattern matching with LLM for better intent detection
3. **Metrics Dashboard**: Track agent performance and user satisfaction
4. **Feedback Loop**: Learn from user corrections to improve agents
```
