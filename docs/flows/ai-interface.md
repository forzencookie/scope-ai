# Workflow: AI Interface

> How users interact with Scooby. This is the primary and only interaction surface for all mutations.

## What It Is

The app is ChatGPT with 60+ Swedish accounting tools connected to a real database. Users talk to Scooby. Scooby understands, picks tools, executes, and responds. Pages exist for reviewing data — chat is where things happen. Mobile-first.

## Opening the App

User opens the app and sees:

1. **Sidebar (left):**
   - Conversation history, grouped by time (Idag, Igår, Förra veckan, Tidigare)
   - **"Att göra" section** — 3-5 most urgent pending tasks:
     ```
     ┌─ Att göra ──────────────────────┐
     │ ○ 3 obehandlade transaktioner   │
     │ ○ Moms Q1 — förfaller 12 maj   │
     │ ○ Skicka faktura till Acme AB   │
     │                                 │
     │ Visa alla (7) →                 │
     └─────────────────────────────────┘
     ```
   - "Visa alla" → opens a tasks overlay (not a page) with all tasks grouped by urgency

2. **Main content area (right):**
   - Scooby mascot + contextual greeting — references pending items, recent activity, upcoming deadlines. Powered by memory + activity snapshot.
   - Chat input — the primary interaction surface. `/` triggers skill menu.
   - Recent conversations — quick access to continue where they left off.
   - Page navigation badges — Händelser, Bokföring, Löner, Rapporter, Ägare.

## Task Sources

Tasks in the sidebar come from three places:

| Source | Examples |
|--------|---------|
| **System-generated** | Unbooked transactions, overdue invoices, upcoming deadlines |
| **AI-generated** | From `/morgon` briefings, period close checklists |
| **User-created** | "Kom ihåg att skicka faktura till Acme" → Scooby saves as task |

## The Interaction Flow

Every scenario follows this pattern:

```
User sends message (or uses /skill)
  → Scooby streams text + compact preview card in chat
  → Card fields are inline-editable (dotted underline = clickable)
  → User clicks a value to edit it directly on the card
  → OR user chats "Ändra X till Y" and Scooby updates the card
  → Iterate until happy
  → User clicks card → full walkthrough overlay opens
  → Overlay has: "Godkänn" / "Ändra" / "Gå till [sida]"
  → On confirm: action executed, user navigates to reference page with item highlighted
  → Done.
```

## Two-Layer Card System

### Layer 1: Compact Preview Card (inline in chat)

When Scooby generates something (verification, invoice, payslip, report), it appears as a compact card in the chat stream:

```
┌─────────────────────────────────────┐
│  Verifikation #A-2026-0047          │
│                                     │
│  Beskrivning:  Shopify··············│  ← dotted underline = editable
│  Belopp:       100 kr···············│  ← click to change
│  Konto:        6540·················│  ← click to change
│  Moms:         25%··················│  ← click to change
│  Datum:        2026-03-13···········│  ← click to change
│                                     │
│  [Visa förhandsgranskning]  [Bokför]│
└─────────────────────────────────────┘
```

**How inline editing works:**
- Default state: read-only. Card values are plain text, not clickable.
- User activates edit mode via pencil/edit button on the card
- In edit mode: dotted underline appears on editable values
- Click a value → inline text field (no modal)
- Change a value → Scooby recalculates dependent fields (e.g., change belopp → moms recalculates)
- Exit edit mode: click done/checkmark, or send a new chat message
- For complex changes: user can still chat naturally ("Ändra kontot till 5420")

### Layer 2: Full Preview Overlay (on click)

User clicks "Visa förhandsgranskning" or the card itself → walkthrough overlay opens in main content area with complete detailed preview:
- All line items, calculated totals, affected accounts, cascaded entries
- Actions: "Godkänn" / "Ändra" (returns to chat) / "Gå till [sida]"
- "Gå till" navigates to the relevant page with the item highlighted/scrolled-to

## Scenarios

**Scenario 1: "Bokför det här kvittot" (with receipt image)**
1. Scooby OCRs receipt, extracts data
2. Compact card: Beskrivning: Shopify, Belopp: 100 kr, Konto: 6540, Moms: 25%
3. User sees konto is wrong → clicks "6540" → changes to "5420"
4. Clicks "Bokför" → verification created
5. Card updates with confirmation + "Gå till Huvudbok" button

**Scenario 2: "Kör lönerna för mars"**
1. Scooby calls `run_payroll` using deterministic tax tools
2. Compact payroll card: employee names, gross/net summary, total cost
3. User clicks Erik's semestertillägg → changes it inline
4. Clicks "Visa förhandsgranskning" → full preview with every line item
5. Clicks "Godkänn" → payslips saved, vacation accrual auto-posted, AGI staged

**Scenario 3: "Hur ser resultaträkningen ut?"**
1. Scooby calls report tool (deterministic math, not AI reasoning)
2. Streams a financial-table card inline
3. Adds commentary: "Kostnader upp 12% jämfört med förra månaden"
4. User: "Varför ökade kontorsmaterial?" → Scooby drills into 6110

**Scenario 4: Reference page → Chat handoff**
1. User clicks "Bokföring" in sidebar → Transaktioner inbox
2. Sees ambiguous transaction → clicks "Fråga Scooby"
3. Navigates to chat with context prefilled
4. Scooby asks clarifying question → books it correctly

**Scenario 5: Returning user**
1. Scooby's greeting uses memory: "Du stängde februari igår. Mars har 2 nya transaktioner."

## Cascades — Automatic Downstream Effects

When Scooby executes an action, downstream entries are created automatically:
- **Payroll** → vacation accrual (7090/2920) auto-posted
- **Invoice** → verification auto-created on confirm
- **Dividend** → withholding tax (2898/2750) auto-posted
- **Period close** → routine accruals offered
- User never manually creates the second entry

## Internet Access (Scoped)

Scooby can search the web for external data — not for rules we should own:

| Use Case | Example |
|----------|---------|
| Customer lookup | Search allabolag.se for org.nr, address |
| Exchange rates | Current SEK/EUR for foreign transactions |
| Regulatory updates | "Has SKV changed the AGI deadline for 2026?" |

**Rule:** If it's a number that affects a booking, it comes from a deterministic tool. Internet is for context, not calculations.

## Skills / Slash Commands

### Action Skills
| Command | What It Does |
|---------|-------------|
| `/faktura` | Start invoice creation flow |
| `/lön` | Start payroll for current month |
| `/moms` | Start VAT declaration for current period |
| `/bokför` | Start booking flow |
| `/stäng` | Start period close for current month |

### Summary Skills
Living briefings that combine past data, upcoming deadlines, goal alignment, and user notes from memory:

| Command | Scope | Shows |
|---------|-------|-------|
| `/dag` | Today | Today's activity, pending items, deadlines |
| `/morgon` | Morning | What needs attention today, overnight changes |
| `/vecka` | Week | Mon-Sun activity, what's left, revenue/costs |
| `/månad` | Month | Full month status, VAT, payroll, close readiness |
| `/kvartal` | Quarter | Tax filings, trends, quarterly comparison |
| `/år` | Year (YTD) | P&L summary, filings completed, what's left |
| `/status` | Snapshot | Quick health check: unhandled count, next deadline |

Summary skills always query memory for user notes relevant to the report period. This is what makes them "living" — they reflect what the user told Scooby, not just DB state.

## The Technical Chain

```
ChatInput → /api/chat/route.ts → AI model → tool selection
  → Tool → Service layer → lib/bookkeeping/ (for accounting) → Supabase
  → Result → AI composes response with blocks/cards
  → Streams to UI via Vercel AI SDK
```

**Rules:**
- Tools ALWAYS go through the service layer. Never direct DB calls.
- Accounting mutations ALWAYS go through `lib/bookkeeping/` for BAS validation, debit/credit balance, sequential numbering.
- All mutations require user confirmation before finalizing.

## Deferred Tool Loading

Not all 60+ tools load on every conversation:
1. 5 core tools always available
2. `search_tools` meta-tool lets Scooby discover others by description
3. Discovered tools become available for that conversation
4. ~95% token reduction vs loading everything

## System Prompt Composition

On each conversation:
- App manifest context (relevant slice only)
- User memory (preferences, patterns, per-company context)
- Company context (org type, momsperiod, fiscal year)
- Core tool definitions + search_tools

## Confirmation Pattern

All mutations follow:
1. AI creates **pending** record
2. AI returns **confirmation card** showing what will happen
3. User clicks **Confirm** → record finalized
4. User clicks **Reject** → pending record deleted

Non-negotiable. The business owner bears legal responsibility.

## Model Tier System

### Vision

Three model tiers give users control over speed vs. intelligence per message:

| Tier | Label | Use Case | Target Model |
|------|-------|----------|-------------|
| **Snabb** | Fast | Simple lookups, navigation, quick answers | `gpt-4o-mini` |
| **Smart** | Default | Most accounting tasks, tool calls, analysis | `gpt-4o` |
| **Expert** | Deep reasoning | Complex tax optimization, multi-step legal analysis | `o3-mini` or equivalent reasoning model |

The user selects a tier from the model selector in the chat input area. Each tier consumes tokens at different rates (reflected in billing).

### Current State

- `src/lib/models.ts` defines tiers but uses fictional model IDs that do not correspond to real OpenAI models.
- `src/components/layout/model-selector.ts` hardcodes `gpt-4o` regardless of which tier the user selects.
- `src/lib/model-auth.ts` has tier-checking logic but is not wired to the chat route — all users get the same model.

### What Needs to Happen

1. Replace fictional model IDs in `models.ts` with real OpenAI model identifiers (e.g., `gpt-4o-mini`, `gpt-4o`, `o3-mini`).
2. Wire `model-auth.ts` into `/api/chat/route.ts` so the selected tier determines which model is called.
3. Make the model selector in the UI functional — selection should persist per conversation and be sent with each chat request.
4. Enforce tier access based on subscription plan (free users get snabb only, paid users get all three).
5. Update token consumption tracking to reflect the cost difference between tiers.

## What Connects Here

- Every other workflow passes through this chain
- Memory system feeds context into system prompt
- App manifest tells Scooby what tools exist for what purpose
- Walkthrough overlays render when user clicks cards
- Page overlays render when user clicks table rows on information pages
- Tasks in sidebar come from system, AI, and user — all feed back into chat when clicked
