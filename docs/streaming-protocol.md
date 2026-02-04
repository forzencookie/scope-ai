# Chat Streaming Protocol

Streaming protocol for the Scope AI chat API (`/api/chat/v2`).

## Line Format

Each line follows the format:
```
{PREFIX}:{JSON_PAYLOAD}\n
```

## Prefixes

| Prefix | Type | Description |
|--------|------|-------------|
| `T:` | `string` | Text content delta (appended to response) |
| `TH:` | `string` | Extended thinking (internal reasoning, not shown to user) |
| `D:` | `object` | Structured data: metadata, tool results, display instructions |
| `E:` | `{ error: string }` | Error message |
| `W:` | `WalkthroughBlockResponse` | Walkthrough UI blocks |

## Examples

### Text streaming
```
T:"Hej! "
T:"Jag kan hjälpa dig "
T:"med bokföringen."
```

### Tool result
```
D:{"tool":"get_transactions","result":{"success":true,"data":[...]}}
```

### Extended thinking
```
TH:"User is asking about VAT. I should check..."
TH:"The deadline is 12th. Let me explain..."
```

### Error
```
E:{"error":"Ett fel uppstod vid bearbetning."}
```

## Implementation

- **Backend**: `src/app/api/chat/v2/route.ts`
- **Frontend**: `src/hooks/chat/use-stream-parser.ts`

## Migration Notes

The old multi-agent system (`/api/chat/agents`) used an additional `A:` prefix for agent routing info. This is **not used in v2** since there's only one agent (ScopeBrain).
