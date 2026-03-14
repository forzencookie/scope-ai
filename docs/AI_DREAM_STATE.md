# Scope AI — Dream State & Architecture Review

**Date:** 2026-03-13
**Status:** Founder + Claude alignment doc
**Context:** Review of Gemini-assisted code changes, architectural decisions, and definition of the target product state.

---

## 1. Where We Are (Honest Assessment)

The AI mode is ~20% complete in terms of working logic. The shell looks further along than it is.

### What's Broken Right Now

| Problem | Impact |
|---|---|
| **Tool calling is unreliable** | User asks something, tools don't fire accurately, nothing renders, no error shown |
| **Old conversations don't restore** | Can't click a past chat and see it with cards/tool results intact — only raw text loads |
| **Silent failures everywhere** | When something breaks, the user sees... nothing. No error message, no fallback |
| **Dual message format** | `AppMessage` vs Vercel `UIMessage` — conversion layer loses data on every round-trip |
| **52K tokens burned before user speaks** | All 60+ tools loaded upfront, system prompt bloated with scenarios |
| **Memory injection is dumb** | Top 20 memories injected regardless of relevance |
| **AI relies on model knowledge for Swedish law** | GPT might hallucinate account numbers, tax rates, or legal rules — no deterministic guardrails |

### What Gemini Built (Review)

**The plan (AI_NATIVE_FLOW_REDESIGN.md):** Excellent. The diagnosis is correct — two disconnected apps (pages + Scooby), overlay is a dead end, 33 tabs that should be 10. The consolidation and phase structure are solid.

**Custom memory system:** Works but oversold. Gemini said "cheaper than OpenAI SDK memory" — technically true but misleading since we still call GPT-4o-mini for extraction. The real issue: injection is a blind top-20 dump with no relevance filtering. Confidence scores exist but aren't used for injection. 30-day expiry on "pending" memories is too aggressive.

**Vercel AI SDK integration:** Half-committed. Bolted Vercel on top of the existing message format instead of replacing it. Result: two message systems, a fragile translation layer, `@ts-expect-error` scattered through the adapter, `messages as any` casts. Either commit fully to Vercel's format or drop it — the current middle ground causes most of the bugs.

**Side panel (ai-side-panel.tsx):** Clean code, but wrong UX decision for an MVP that needs to work on mobile. Killed in favor of inline-everything approach (see Section 2).

---

## 2. The Dream State — How Scope AI Works When It's Done

### 2.1 Core Principle

**One surface. One interaction pattern. Chat is everything.**

The app is ChatGPT with 60+ Swedish accounting tools connected to a real database. Every business action flows through conversation. No mode switching. No side panels. Mobile-first.

### 2.2 Opening the App

User opens the app. They see:

1. **Scooby mascot + contextual greeting** — references what's pending, what happened yesterday, upcoming deadlines. Powered by memory + activity snapshot.
2. **Chat input** — the primary interaction surface. `/` triggers skill menu.
3. **Recent conversations** — below the greeting, quick access to continue where they left off.
4. **Pending tasks** — in the sidebar, a small section showing 3-5 unchecked tasks (AI-generated, system-generated, or user-created). "Visa alla" opens a lightweight **tasks overlay** (not a full page) showing all undone + upcoming tasks in one scrollable view.

### 2.3 The Interaction Flow

Every scenario follows this pattern:

```
User sends message (or uses /skill)
  → Scooby streams text + compact preview card in chat
  → Card fields are inline-editable (dotted underline = clickable)
  → User clicks a value to edit it directly on the card
  → OR user chats "Ändra X till Y" and Scooby updates the card
  → Iterate until happy
  → User clicks card → full preview overlay opens
  → Preview has: "Godkänn" / "Ändra" / "Gå till [sida]"
  → On confirm: action executed, user can navigate to the reference page with item highlighted
  → Done.
```

### 2.4 The Two-Layer Card System

**Layer 1: Compact Preview Card (inline in chat)**

When Scooby generates something (payroll, booking, invoice, report), it appears as a compact card in the chat stream. This card shows the key fields — but each value is **inline-editable**.

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
- **Default state: read-only.** Card values are plain text, not clickable. No accidental edits.
- User activates edit mode via a **pencil/edit button** on the card (or a `/redigera` skill command)
- In edit mode: dotted underline appears on editable values, signaling "this is interactive"
- User clicks a value → it becomes an editable text field (inline, no modal)
- User changes it → Scooby recalculates dependent fields (e.g., change belopp → moms recalculates)
- No need to type a full chat message to fix one number
- User can exit edit mode (click done/checkmark) or it auto-exits when they send a new chat message
- For complex changes that affect multiple fields, user can still chat naturally (no need to enter edit mode)

**Layer 2: Full Preview Overlay (on click)**

User clicks "Visa förhandsgranskning" (or the card itself) → a full-screen overlay opens with the complete detailed preview. This is the final review before confirming.

- On mobile: full-screen overlay
- On desktop: centered modal
- Shows everything: all line items, calculated totals, affected accounts, cascaded entries
- Buttons: "Godkänn" / "Ändra" (returns to chat) / "Gå till [Huvudbok/Fakturor/etc.]"
- The "Gå till" button navigates to the relevant reference page with the newly created item **highlighted/scrolled-to**

**Why two layers:**
- Compact card keeps the chat readable — you don't want a 30-row payroll table inline
- Inline editing handles 80% of corrections without typing
- Full preview is the "are you sure?" gate before irreversible writes
- Mobile-friendly — both layers work on phones

### 2.5 Scenarios

**Scenario 1: "Kör lönerna för mars"**
1. Scooby calls `run_payroll` with correct parameters (using deterministic tax tools, not model knowledge)
2. Compact payroll card appears inline — employee names, gross/net summary, total cost
3. User clicks Erik's semestertillägg value (8000) → changes it to 9000 inline
4. Card recalculates. Or user chats "Lägg till övertid för Anna, 5 timmar"
5. User clicks "Visa förhandsgranskning" → full preview overlay with every line item
6. Clicks "Godkänn" → payslips saved, vacation accrual auto-posted (7090/2920), AGI staged
7. Preview shows: "Gå till Löner" button → navigates to Löner page with March payroll highlighted

**Scenario 2: "Bokför det här kvittot" (with receipt image)**
1. Scooby OCRs the receipt, extracts data
2. Compact card: Beskrivning: Shopify, Belopp: 100 kr, Konto: 6540, Moms: 25%
3. User sees konto is wrong → clicks "6540" → changes to "5420" inline
4. Clicks "Bokför" → verification created
5. Card updates with confirmation + "Gå till Huvudbok" button
6. Click → lands on Huvudbok with verification A-2026-0047 highlighted

**Scenario 3: "Hur ser resultaträkningen ut?"**
1. Scooby calls report tool (using deterministic account balance calculations)
2. Streams a financial-table card inline — revenue, costs, result
3. Adds commentary: "Kostnader upp 12% jämfört med förra månaden, främst 6110 Kontorsmaterial"
4. User: "Varför ökade kontorsmaterial?"
5. Scooby drills into 6110 transactions, shows them
6. User: "Exportera som PDF" → download link inline

**Scenario 4: Reference page → Chat handoff**
1. User clicks "Bokföring" in sidebar → lands on Transaktioner inbox
2. Unhandled transactions at top. Simple ones: one-click "Bokför" inline.
3. Ambiguous one: clicks "Fråga Scooby" → navigates to chat with context prefilled
4. Scooby asks "Är detta kundbetalning eller förskott?" → books it correctly
5. Reference pages are for **reading**. Chat is for **doing**.

**Scenario 5: "Stäng februari"**
1. Scooby runs pre-checks (deterministic: all booked? VAT filed? Numbering intact?)
2. Streams status checklist card (green checks / red warnings)
3. "Allt ser bra ut. Ska jag skapa periodavgränsningar?"
4. User: "Ja"
5. Accrual verifications created, period locked
6. "Gå till Arkiv" → February shows locked with green checkmark

**Scenario 6: Returning user, next day**
1. Scooby's greeting references context from memory:
   > "Välkommen tillbaka. Du stängde februari igår. Mars har 2 nya banktransaktioner att hantera."
2. Works because memory persists between sessions and is contextually injected

**Scenario 7: Loading an old conversation**
1. User clicks a conversation from last week in sidebar
2. Full conversation loads — all messages, all tool results, all inline cards (with their editable state)
3. Exactly as it looked when they had it. Can continue chatting.

---

## 3. Deterministic Rule Engine — Don't Trust the Model

### 3.1 The Problem

Right now Scooby relies on GPT's training data to know Swedish accounting rules. This is dangerous:
- Models hallucinate numbers (GPT might say semesterlön is 10% instead of 12%)
- Models pick wrong accounts (6100 instead of 6110)
- Tax rates vary by municipality — no model knows Malmö vs Luleå rates
- Legal rules change yearly — a model trained on 2024 data doesn't know 2026 rates

**Rule: The AI decides WHAT to do. Deterministic tools decide HOW to calculate.**

### 3.2 Required Rule Tools

These tools contain hardcoded Swedish law. The AI calls them instead of guessing:

| Tool | What It Does | Why Not Model Knowledge |
|---|---|---|
| `lookup_bas_account(query)` | Fuzzy search over BAS kontoplan (400+ accounts in `accounts.ts`) | Model might pick 6100 vs 6110 vs 6120 — the lookup is authoritative |
| `calculate_employer_tax(gross, municipality)` | Returns arbetsgivaravgift using SKV tax tables | Rates vary by municipality and age bracket, change yearly |
| `calculate_vat(amount, type)` | Returns correct VAT rate (25/12/6/0%) based on transaction type | Edge cases (food=12%, books=6%, export=0%) are codified |
| `calculate_vacation_accrual(gross)` | Returns 12% semesterlöneskuld per Semesterlagen | Fixed by law, must not be approximated |
| `validate_verification(entries)` | Checks BFL compliance: debit=credit, sequential numbering, period not locked | Legal requirement, not a suggestion |
| `calculate_312(salary, dividends, shares, ...)` | 3:12 rules for K10/gränsbelopp | Complex formula with annual updates — must be deterministic |
| `get_tax_table(municipality, year)` | Returns income tax table for specific municipality | 290 municipalities, each with different rates |
| `get_filing_deadlines(company_type, period)` | Returns SKV deadlines for moms, AGI, INK | Deadlines are fixed dates, not vibes |

### 3.3 What the AI Still Does

The AI's job becomes:
- **Understand intent** — "bokför det här" → needs a verification
- **Call the right tools** — lookup account, calculate VAT, validate
- **Compose results** — render the card with correct data from tools
- **Handle ambiguity** — "Är detta kundbetalning eller förskott?" (AI judgment)
- **Provide commentary** — "Kostnader upp 12%" (AI analysis on top of deterministic data)

### 3.4 Internet Access (Scoped)

Scooby can search the web for **external data** — not for rules we should own:

| Use Case | Example |
|---|---|
| Customer lookup | Search allabolag.se for org.nr, address |
| Exchange rates | Current SEK/EUR for foreign transactions |
| Regulatory updates | "Has SKV changed the AGI deadline for 2026?" |
| Edge case guidance | Unusual BAS account classification |

**Rule: If it's a number that affects a booking, it comes from a deterministic tool. Internet is for context, not calculations.**

---

## 4. Tasks System

### 4.1 Sidebar Tasks (3-5 items)

The sidebar shows a small "Att göra" section with the most urgent pending tasks:

```
┌─ Att göra ──────────────────────┐
│ ○ 3 obehandlade transaktioner   │
│ ○ Moms Q1 — förfaller 12 maj   │
│ ○ Skicka faktura till Acme AB   │
│                                 │
│ Visa alla (7) →                 │
└─────────────────────────────────┘
```

### 4.2 Task Sources

Tasks come from three places:

| Source | Examples |
|---|---|
| **System-generated** | Unbooked transactions, overdue invoices, upcoming deadlines |
| **AI-generated** | From `/morgon` briefings, period close checklists, plan steps |
| **User-created** | "Kom ihåg att skicka faktura till Acme" → Scooby saves as task |

### 4.3 "Visa alla" → Tasks Overlay

Clicking "Visa alla" opens a lightweight overlay (not a full page) with all tasks:
- Undone tasks at top, grouped by urgency (overdue → due this week → upcoming)
- Completed tasks below (collapsible)
- Each task is clickable → navigates to chat with context or to the relevant page
- Dismissible with X or swipe

---

## 5. Skills / Slash Commands

### 5.1 Action Skills

Quick shortcuts that start a workflow:

| Command | What It Does |
|---|---|
| `/faktura` | Start invoice creation flow |
| `/lön` | Start payroll for current month |
| `/moms` | Start VAT declaration for current period |
| `/bokför` | Start booking flow (with page context if any) |
| `/stäng` | Start period close for current month |

### 5.2 Summary / Status Report Skills

**These are the core intelligence features.** Not just data dumps — they're living briefings that combine:
- **What happened** (past data from DB)
- **What's coming** (upcoming deadlines, scheduled tasks)
- **Goal alignment** (if user has set goals/plans, how are we tracking)
- **User notes from memory** (things the user told Scooby to remember for this period)
- **Proactive reminders** ("Du sa att du ville skicka faktura till Acme på fredag")

| Command | Time Scope | What It Shows |
|---|---|---|
| `/dag` | Today | What happened today, what's due today, pending items, any user-noted tasks for today from memory |
| `/morgon` | Today (morning) | Morning variant: what needs attention today, overnight changes, today's deadlines, cash position |
| `/vecka` | Current week | Mon-Sun: what's been done, what's left, revenue/costs this week, upcoming deadlines, user-noted weekly tasks |
| `/månad` | Current month | Full month status: booked vs unbooked, revenue/costs, VAT status, close readiness, goal progress |
| `/kvartal` | Current quarter | Q1/Q2/Q3/Q4: financial summary, tax filings done/pending, trend vs previous quarter, goal alignment |
| `/år` | Current year (YTD) | Year-to-date: P&L summary, budget vs actual, filings completed, what's left before year-end, strategic goals progress |
| `/status` | Snapshot | Quick health check: unhandled count, overdue count, period status, cash, next deadline |

### 5.3 How Summary Skills Work (The Intelligence Layer)

**Example: It's Wednesday. User types `/vecka`**

Scooby gathers:
1. **Past (Mon-Wed):** 5 transactions booked, 2 invoices sent, 1 payroll run, revenue 45K kr
2. **Future (Thu-Fri):** Moms Q1 deadline Friday, 3 unbooked transactions remaining
3. **Memory:** User said on Monday "på fredag vill jag skicka faktura till Acme AB och stänga mars"
4. **Goals:** User's plan says "nå 500K omsättning Q1" — currently at 480K

Scooby renders a card:

```
┌─ Veckorapport (v.11, 10-14 mars) ────────────────┐
│                                                     │
│  ✅ Gjort                                           │
│  • 5 transaktioner bokförda                        │
│  • 2 fakturor skickade (totalt 45 000 kr)         │
│  • Lönekörning mars klar                           │
│                                                     │
│  ⏳ Kvar                                            │
│  • 3 obehandlade transaktioner                     │
│  • Moms Q1 — förfaller fredag 14 mars ⚠️          │
│                                                     │
│  📌 Dina anteckningar                              │
│  • Fredag: Skicka faktura till Acme AB             │
│  • Fredag: Stäng mars                              │
│                                                     │
│  📊 Mål: Q1 omsättning                             │
│  • Mål: 500 000 kr                                 │
│  • Nu: 480 000 kr (96%)                            │
│  • Behöver: 20 000 kr till på 2 dagar              │
│                                                     │
│  💡 Scooby noterar                                  │
│  • "Om du skickar Acme-fakturan (est. 35K) når     │
│    du Q1-målet med marginal."                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Example: It's June. User types `/år`**

Scooby gathers:
1. **Jan-Jun data:** Revenue, costs, profit, tax payments, filed declarations
2. **Jul-Dec outlook:** Remaining filings (INK2 deadline, AGI deadlines), upcoming payrolls
3. **Goals:** Annual revenue target, hiring plan, investment plans
4. **Memory:** Strategic decisions user has shared ("Vi siktar på att anställa i Q3")

```
┌─ Årsrapport 2026 (jan-jun, halvår) ──────────────┐
│                                                     │
│  📊 Ekonomisk sammanfattning                       │
│  • Omsättning: 1 240 000 kr (mål: 2 500 000)     │
│  • Kostnader: 890 000 kr                           │
│  • Resultat: +350 000 kr                           │
│  • Prognos helår: ~2 480 000 kr (99% av mål)      │
│                                                     │
│  ✅ Klart                                           │
│  • Moms Q1 + Q2 deklarerad                         │
│  • AGI jan-jun inlämnad                            │
│  • Lönekörning jan-jun klar                        │
│  • Årsredovisning 2025 inlämnad                    │
│                                                     │
│  ⏳ Kvar (jul-dec)                                  │
│  • Moms Q3 — deadline 12 nov                       │
│  • Moms Q4 — deadline 12 feb 2027                  │
│  • AGI jul-dec                                     │
│  • Inkomstdeklaration 2026 (INK2)                  │
│  • Årsbokslut 2026                                 │
│                                                     │
│  📌 Strategiska anteckningar                       │
│  • "Anställa en person i Q3" — budget: ~35K/mån   │
│  • "Utvärdera kontorsyta i augusti"                │
│                                                     │
│  💡 Scooby noterar                                  │
│  • "Med nuvarande tillväxttakt når du årsmålet.    │
│    Om du anställer i Q3 ökar kostnaderna ~105K     │
│    för resten av året. Resultat fortfarande        │
│    positivt vid ~245K."                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.4 User Notes → Memory → Surfaced in Reports

The key feature: **users can tell Scooby things to remember for future reports.**

| User says | Scooby does | Surfaced when |
|---|---|---|
| "Anteckna: på fredag ska jag bokföra alla kvitton" | Saves to memory: task, category=pending, expires=Friday | `/vecka`, `/dag` (on Friday), `/morgon` (on Friday) |
| "Kom ihåg: vi ska anställa i Q3" | Saves to memory: decision, no expiry | `/kvartal` (Q3), `/år`, strategic questions |
| "Notera: månadsstängning ska göras senast 5:e varje månad" | Saves to memory: preference, no expiry | `/månad`, `/morgon` (on the 5th), period close flows |
| "Jag vill nå 2.5M omsättning i år" | Saves to memory: goal, year-scoped | `/kvartal`, `/år`, any financial summary |
| "Moms Q1 ska deklareras i helgen" | Saves to memory: task, expires=Sunday | `/vecka`, `/dag` (weekend), `/morgon` |

**The memory categories for reports:**
- **task** — specific thing to do at a specific time (has expiry)
- **goal** — target to track against (year/quarter scoped)
- **decision** — strategic choice that affects advice (no expiry)
- **preference** — recurring pattern ("always close by the 5th")
- **note** — free-form context for future reports

### 5.5 Empty Reports Are Fine

If there's no data for a period, Scooby doesn't make things up:

```
┌─ Veckorapport (v.11) ────────────────────────────┐
│                                                     │
│  Inga bokförda transaktioner denna vecka.           │
│  Inga förfallna fakturor.                          │
│  Inga kommande deadlines.                          │
│                                                     │
│  📌 Dina anteckningar                              │
│  • Fredag: Skicka faktura till Acme AB             │
│                                                     │
│  Vill du att jag gör något? Skriv vad du planerar  │
│  för veckan så antecknar jag det.                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.6 Implementation

Skills map to the existing Quick Actions system (`/` trigger in chat input). Each skill is a **premade prompt** with instructions for Scooby to:

1. Call multiple data-gathering tools
2. Query memory for relevant user notes, goals, and preferences
3. Compose results into a structured briefing card
4. Add proactive insights based on the data + context
5. If empty, acknowledge it gracefully and invite the user to add notes

The skill prompt template includes the time scope, which tools to call, and the card format. Scooby fills in the data.

**Memory integration:** Summary skills always call `query_memories(category, time_scope)` to find user notes relevant to the report period. This is what makes reports "living" — they reflect what the user told Scooby, not just database state.

---

## 6. Architecture

```
┌──────────────────────────────────────────────────┐
│                   Browser                         │
│                                                   │
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ Sidebar  │  │        Chat Area             │  │
│  │          │  │                              │  │
│  │ History  │  │  Messages                    │  │
│  │ Nav      │  │  + Compact preview cards     │  │
│  │          │  │    (inline-editable fields)  │  │
│  │ ──────── │  │  + Skill briefing cards      │  │
│  │ Att göra │  │  + Confirmation messages     │  │
│  │ (3-5)    │  │                              │  │
│  │ Visa alla│  │  ┌────────────────────────┐  │  │
│  │          │  │  │     Chat Input          │  │  │
│  └──────────┘  │  │  / triggers skill menu  │  │  │
│                │  └────────────────────────┘  │  │
│                └──────────────┬───────────────┘  │
│                               │                   │
│  ┌─ Overlays (when triggered) ┤                   │
│  │ • Full preview (confirm)   │                   │
│  │ • Tasks list (visa alla)   │                   │
│  └────────────────────────────┘                   │
│                                                   │
│  ┌─ Reference pages (/dashboard/<slug>) ──────┐  │
│  │ Transaktioner inbox, Fakturor kanban,       │  │
│  │ Huvudbok ledger, Team cards, etc.           │  │
│  │ Items can be highlighted via URL params     │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                         │
                    POST /api/chat
                         │
               ┌─────────▼──────────┐
               │   Chat Route       │
               │                    │
               │ 1. Auth + limits   │
               │ 2. Load memories   │  ← relevant ones only
               │ 3. Build prompt    │  ← slim (~5K tokens)
               │ 4. Load tools      │  ← deferred, on-demand
               │ 5. streamText()    │
               │ 6. Save full msg   │  ← including tool parts + card state
               │ 7. Extract memory  │  ← post-conversation
               └────────────────────┘
                         │
               ┌─────────▼──────────┐
               │   Tool Execution   │
               │                    │
               │ AI Tools (intent)  │
               │   ↓                │
               │ Rule Tools (calc)  │  ← deterministic Swedish law
               │   ↓                │
               │ DB Write + Cascade │  ← auto downstream effects
               │   ↓                │
               │ Card Response      │  ← structured for inline rendering
               └────────────────────┘
```

---

## 7. Context Engineering — Research from AI Labs

### 7.1 The Problem (Industry Consensus)

Every major AI lab warns against loading too many tools:

| Lab | Guidance | Benchmark |
|---|---|---|
| **Anthropic** | Tool Search pattern — defer tools behind a search meta-tool | 60+ tools: **49% accuracy**. With Tool Search: **74%**. (Opus 4) |
| **OpenAI** | "Aim for fewer than 20 functions at the start of a turn" | Exceeding this reduces accuracy |
| **Google** | "Aim for 10-20 tools maximum" | Too many increases risk of suboptimal selection |
| **Speakeasy** (real-world) | 3-tool dynamic architecture | **96.7% token reduction**, 100% success rate on 40-400 tool libraries |

**Scope AI currently loads 60+ tools (40K+ tokens) on every request. This is the #1 cause of unreliable tool calling.**

Source: [Anthropic Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use), [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling/), [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)

### 7.2 The Doctor Model (Target Architecture)

Like a doctor who shows up with a persona and general knowledge — not carrying every instrument in the hospital:

**Layer 1: Persona (Always Loaded, ~1,500 tokens)**

Who Scooby IS. Never changes per request.

```
Persona + tone + rules:        ~500 tokens
Company context (JSON block):  ~300 tokens  (type, period, fiscal year, momsperiod)
Relevant memories:             ~300 tokens  (5-8 filtered, not 20 blind)
Tool index:                    ~300 tokens  (60 names + one-liners, NO schemas)
search_tools meta-tool:        ~200 tokens  (the one tool always loaded)
─────────────────────────────────────────────
TOTAL before user speaks:    ~1,600 tokens
```

**Layer 2: Core Tools (Always Loaded, ~1,500 tokens)**

The 5 most common tools — like a doctor's stethoscope, always in the pocket:

- `search_tools` — discovers other tools on demand
- `create_verification` — the most common write action
- `get_transactions` — the most common read action
- `navigate_to_page` — page navigation
- `get_company_info` — company context lookup

**Layer 3: Discovered Tools (On Demand, ~500-2,000 tokens per query)**

User says "kör lönerna" → Scooby calls `search_tools("payroll löner")` → gets back `run_payroll`, `get_employees`, `calculate_employer_tax` → uses them. 3 tools loaded instead of 60.

**Layer 4: Deep Knowledge / Skills (On Demand, ~500-1,000 tokens)**

For complex domains, Scooby loads a skill file — like a doctor opening a textbook to a specific chapter:
- "Beräkna K10" → loads `skills/skatt/k10-rules.md`
- "Bokför den här transaktionen" → loads `skills/bokforing/SKILL.md`
- Simple question → loads nothing extra

**Total per request: ~3,000-4,000 tokens instead of 53,000. That's a 94% reduction.**

### 7.3 The Three-Tool Discovery Pattern (Speakeasy)

The most token-efficient pattern from real-world benchmarks. Three meta-tools replace static loading:

| Meta-Tool | Purpose | When Called |
|---|---|---|
| `search_tools(query)` | Semantic search over all 60+ tools. Returns names + short descriptions of matches. | Every request where Scooby needs a tool it doesn't have loaded |
| `describe_tools(names[])` | Returns full JSON schemas for specific tools by name. | After search, before calling the tool |
| `execute_tool(name, params)` | Executes a discovered tool. | After getting the schema |

**Results from Speakeasy (40-400 tools):**
- Input tokens: **96.7% reduction** (simple tasks), **91.2%** (complex)
- Total tokens: **96.4% reduction** (simple), **90.7%** (complex)
- Success rate: **100%** across all toolset sizes
- Trade-off: 2-3x more tool calls per task (6-8 vs 3), ~50% slower per request

**For Scope AI:** We can simplify this to 2 meta-tools since `execute_tool` adds unnecessary indirection when we can just load and call directly:

1. `search_tools(query)` → returns matching tool names + descriptions
2. Tools are loaded dynamically into the conversation → Scooby calls them normally

Source: [Speakeasy: Reducing Token Usage by 100x](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)

### 7.4 Progressive Skill Disclosure (Anthropic)

Anthropic's official pattern for domain knowledge loading:

```
skills/
├── bokforing/
│   ├── SKILL.md              ← Level 2: "How to handle bookkeeping" (~500 tokens)
│   ├── scenarios.md           ← Level 3: Detailed examples (on demand)
│   └── bas-kontoplan.md       ← Level 3: Account reference (on demand)
├── loner/
│   ├── SKILL.md              ← Level 2: "How to handle payroll"
│   └── tax-tables.md         ← Level 3: SKV tables (on demand)
├── skatt/
│   ├── SKILL.md              ← Level 2: "How to handle tax"
│   └── k10-rules.md          ← Level 3: 3:12 rules (on demand)
└── agare/
    ├── SKILL.md              ← Level 2: "How to handle governance"
    └── abl-rules.md          ← Level 3: ABL compliance (on demand)
```

**Level 1 (always loaded):** Just skill names + one-line descriptions (~100 tokens per skill, ~600 total)
**Level 2 (loaded when triggered):** Full SKILL.md with domain instructions (~500 tokens each)
**Level 3 (loaded on demand):** Reference files like tax tables, account plans (~2-5K tokens)

**Anthropic's authoring rules:**
- Keep SKILL.md **under 500 lines**
- Challenge each paragraph: **"Does this justify its token cost?"**
- "Claude is already very smart" — only add context it doesn't already have
- Write descriptions in third person (injected into system prompt)
- Scripts can be **executed without loading into context** — only output consumes tokens

Source: [Anthropic Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills), [Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

### 7.5 Context Rot and Compaction (Anthropic)

**Context rot:** As token count increases, accuracy decreases. It's a gradient, not a cliff. With 50+ tools, the model's attention dilutes across too many tokens and performance drops. This is architectural (n-squared pairwise relationships in attention) and from training distribution (shorter sequences are more common).

**Compaction strategies:**

1. **Clear old tool results.** Anthropic calls this "low-hanging fruit." Once a tool has been called and the model acted on results, the raw output is dead weight. A payroll tool that returned 50 employee records? After Scooby rendered the card, those records are just noise in context. Clear them.

2. **Summarize on approach to context limit.** When conversation gets long, summarize older messages and reinitiate with the summary. Preserve architectural decisions and unresolved items; discard redundant details.

3. **Just-in-time context.** Don't pre-load data. Keep lightweight identifiers (IDs, file paths) and dynamically load via tools at runtime. Claude Code uses "targeted queries, store results, and leverage specific commands" rather than pre-loading everything.

Source: [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### 7.6 Memory Architecture (MemGPT/Letta Model)

The most sophisticated memory pattern from research:

```
┌─────────────────────────────────────────────────────┐
│  IN CONTEXT (visible to model)                       │
│                                                      │
│  ┌─ Message Buffer (Working Memory) ──────────────┐ │
│  │ Recent conversation turns                       │ │
│  │ FIFO eviction — summarize on overflow           │ │
│  │ Evict ~70% when capacity reached                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Core Memory (JSON Scratchpad) ────────────────┐ │
│  │ Editable JSON blocks pinned to context          │ │
│  │ Company: { type: "AB", period: "Q1", ... }      │ │
│  │ User: { style: "expert", prefs: [...] }         │ │
│  │ Session: { currentTask: "payroll", ... }        │ │
│  └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  OUT OF CONTEXT (searchable, not loaded)             │
│                                                      │
│  ┌─ Recall Memory ────────────────────────────────┐ │
│  │ Complete interaction history                    │ │
│  │ Searchable via query tool                       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Archival Memory ─────────────────────────────┐  │
│  │ Vector-indexed knowledge base                  │  │
│  │ Company rules, patterns, long-term prefs       │  │
│  │ Searched via embedding similarity              │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key insight:** Use a **JSON scratchpad** for session state, not conversation history. The model reads/writes structured JSON blocks, which is "far more reliable than unstructured state." This maps to our existing `context.sharedMemory`.

**For Scope AI's memory:**
- **Core Memory (in context):** Company JSON block + 5-8 relevant memories (~300 tokens)
- **Recall Memory (out of context):** Full `user_memory` table, searched with `query_memories` tool
- **Archival Memory (out of context):** BAS kontoplan, tax tables, legal rules — loaded via skill files on demand

Source: [Letta/MemGPT Agent Memory](https://www.letta.com/blog/agent-memory)

### 7.7 Artifact Handle Pattern (Google ADK)

Large data (reports, payroll breakdowns, PDF previews) should NOT live in the prompt. Instead:

1. Tool generates large output → stored as an **artifact** in external storage (Supabase, memory)
2. Model sees only a **lightweight reference**: `{ artifact_id: "payroll-march-2026", type: "payroll_report", summary: "3 anställda, total 145,000 kr" }`
3. If the model needs details, it calls `load_artifact(id)` — loads temporarily
4. After the model is done, the artifact **offloads from context** — "preventing permanent context tax"

**For Scope AI:** When `run_payroll` returns 50 rows of employee data, store the full result as an artifact. Put only the summary in the conversation. If user asks "visa detaljer för Erik" → load just Erik's data. Keeps context clean.

Source: [Google ADK Multi-Agent Framework](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)

### 7.8 OpenAI-Specific Optimizations

**`allowed_tools` parameter:** Filter which tools are available per turn without modifying the full tool list. Maximizes prompt caching — full tool list stays cached, subset is active. Get caching discount AND fewer-tool accuracy.

**`strict: true`:** Enforce JSON schema adherence at token generation level. Model literally cannot produce invalid tool parameters. Eliminates "hallucinated parameter" errors and retry loops.

**Prompt caching:** Minimum 1,024 tokens for caching (Anthropic: 2,048). **50-90% discount** on cached tokens. Structure prompts: **static content first** (persona, rules) → dynamic content last (user message, memories). Static prefix gets cached across requests.

**Front-load critical rules:** OpenAI found **6% accuracy improvement** when key rules appear before descriptive content in function descriptions. Put the most important constraints first.

**Persist reasoning between tool calls:** Using `encrypted_content` for reasoning items yields "significantly higher performance" on multi-step tasks.

Source: [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling/), [o3/o4-mini Guide](https://developers.openai.com/cookbook/examples/o-series/o3o4-mini_prompting_guide/), [Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)

### 7.9 Sub-Agent Delegation

For complex tasks (monthly closing, annual report, tax declaration), both Anthropic and Google recommend **sub-agents**:

- Main conversation stays lightweight
- Complex task is delegated to a sub-agent with a focused context window
- Sub-agent might use 30K tokens internally (loading skills, calling 10+ tools, iterating)
- Returns only a **1-2K token summary** to the main conversation
- "Clear separation of concerns"

**For Scope AI:** When user says "stäng mars", delegate to a `month-close-agent` that:
1. Loads the period close skill
2. Calls 5-6 verification/status tools
3. Generates accruals
4. Returns: "Mars stängd. 3 periodavgränsningar skapade. Alla verifikationer i ordning." + compact status card

The main conversation never sees the 30K tokens of intermediate work.

Source: [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [Google ADK](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)

### 7.10 Token Budget Summary

| State | Current | Target | Reduction |
|---|---|---|---|
| System prompt (persona) | ~500 | ~500 | 0% |
| Scenarios (few-shot) | ~10,000 | 0 (moved to skills) | 100% |
| Tool definitions | ~40,000 | ~1,800 (5 core + index) | 95% |
| Company context | ~2,000 | ~300 (JSON scratchpad) | 85% |
| Memories | ~1,000 (20 blind) | ~300 (5-8 filtered) | 70% |
| **TOTAL before user speaks** | **~53,500** | **~2,900** | **95%** |
| Per-query tool loading | 0 | ~1,500 (2-4 discovered tools) | — |
| Per-query skill loading | 0 | ~500-1,000 (1 skill if needed) | — |
| **TOTAL per request** | **~53,500** | **~4,400-5,400** | **90-92%** |

**Cost impact:** At GPT-4o pricing ($2.50/1M input tokens), going from 53K to 5K tokens per request saves ~$0.12 per 1,000 requests. At scale (10K requests/day), that's ~$36/day or ~$1,100/month saved on input tokens alone.

### 7.11 Tool Design Principles (Cross-Lab Consensus)

Rules that every lab agrees on:

1. **No functional overlap.** "If a human engineer can't say which tool should be used, an AI agent can't do better." (Anthropic)
2. **Keyword-rich descriptions.** Tool names and descriptions are the search index — make them findable.
3. **Return high-signal responses.** Don't return raw database rows with UUIDs. Return names, amounts, status labels. Truncate at 25K tokens.
4. **Actionable error messages.** Not `{ error: "INVALID_ACCOUNT" }`. Instead: `{ error: "Account 9999 not found. Did you mean 6110 (Kontorsmaterial)? Use lookup_bas_account to search." }`
5. **Flatten parameters.** Deeply nested parameter objects degrade performance. (OpenAI)
6. **Add 1-3 examples for ambiguous tools.** Accuracy goes from 72% to 90%. (Anthropic)
7. **Namespace by domain.** `bokforing:create_verification`, `loner:run_payroll`. Helps model select categories. (OpenAI)
8. **Consolidate related reads.** Instead of `get_transactions`, `get_invoices`, `get_receipts` as 3 tools, consider `query_data(type, filters)`. (Anthropic)

### 7.12 Research Sources

- [Anthropic: Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [Anthropic: Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills)
- [Anthropic: Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [OpenAI: Function Calling Guide](https://developers.openai.com/api/docs/guides/function-calling/)
- [OpenAI: o3/o4-mini Prompting Guide](https://developers.openai.com/cookbook/examples/o-series/o3o4-mini_prompting_guide/)
- [OpenAI: Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)
- [OpenAI: Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Google: Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Google: ADK Multi-Agent Framework](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
- [Speakeasy: 100x Token Reduction](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)
- [Letta/MemGPT: Agent Memory](https://www.letta.com/blog/agent-memory)
- [Maxim: Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots)

---

## 8. The 6 Systems That Must Work

Everything else is polish. These six are load-bearing:

### 8.1 Tool Calling — Reliable, Every Time

- User asks → Scooby calls the right tool with the right parameters
- Tool result renders as a compact preview card with inline-editable fields
- If it fails → user sees a clear error message, not silence
- Requires: slim context (deferred tool loading), proper tool descriptions, structured error returns

### 8.2 Deterministic Rule Engine

- All Swedish accounting/tax/legal calculations go through hardcoded rule tools
- The AI never guesses a BAS account number, tax rate, or legal threshold
- Rule tools are versioned by year (2025 rates vs 2026 rates)
- The AI's role: understand intent, call rules, compose results

### 8.3 Conversation Persistence — Full Restore

- Click an old conversation → see everything: text, tool results, inline cards with editable state
- Requires: storing full Vercel `UIMessage` parts (including `tool-invocation`) in DB, not just `content` strings
- On load: reconstruct the complete message with card rendering

### 8.4 Streaming — No Dead States

- User sends → loading indicator → text streams → tool call fires → card renders → done
- Every state transition is visible. No "nothing happened" moments.
- Requires: proper error boundaries, loading states per tool call, timeout handling

### 8.5 Memory — Contextual, Not Dumb

- Scooby remembers what's relevant to THIS query
- Ask about payroll → recalls payroll preferences
- Ask about VAT → recalls momsperiod
- Requires: relevance filtering at injection time (embedding search or keyword match), not blanket top-20

### 8.6 Cascades — Automatic Downstream Effects

- Payroll → vacation accrual (7090/2920) auto-posted
- Invoice → pending booking auto-created
- Dividend → withholding tax (2898/2750) auto-posted
- Period close → routine accruals offered
- User never manually creates the second entry

---

## 9. Implementation Plan — Task Breakdown with Thinking Levels

### How to Read This

- **ULTRA** = Turn on extended thinking / ultrathink. These are architecture decisions, complex debugging, or tricky logic where deep reasoning pays off.
- **MEDIUM** = Normal or medium thinking. Pattern-following, mechanical work, straightforward implementation.
- Start a **fresh conversation** for each block (or sub-block) to keep context clean and quota efficient.

---

### Block 1: Fix the Foundation (~2-3 coding days) ✅ IMPLEMENTED 2026-03-14

| # | Task | Thinking | Status | What Was Done |
|---|---|---|---|---|
| 1.1 | Debug why tool calling fails silently | **ULTRA** | ✅ Done | Root cause: `toTextStreamResponse()` strips tool metadata. Client expects UIMessage protocol with `tool-invocation` parts but only receives plain text. |
| 1.2 | Fix stream protocol + message format | MEDIUM | ✅ Done | `route.ts:265`: Changed `toTextStreamResponse()` → `toUIMessageStreamResponse()`. This single change unblocks the entire tool pipeline — client now receives structured `tool-invocation` SSE chunks. |
| 1.3 | Fix conversation DB storage | **ULTRA** | ✅ Done | `route.ts:onFinish`: Now saves `tool_calls` and `tool_results` as JSON to existing DB columns. Also saves assistant messages even when `text` is empty (tool-only responses). |
| 1.4 | Fix conversation loading | MEDIUM | ✅ Done | `use-conversations.ts:mapConversation`: Now preserves `tool_calls`/`tool_results` from DB. `use-chat.ts` sync effect reconstructs `tool-invocation` UIMessage parts with `state: 'result'` so loaded conversations render identically to live ones. |
| 1.5 | Fix cardType mapping + error handling | MEDIUM | ✅ Done | `use-chat.ts`: Added `deriveCardType()` helper — maps tool names to card types (invoice, transaction, verification, payroll, vat, dividend, receipt, report). Added `onError` callback dispatching `ai-dialog-error` event. `chat-message-list.tsx`: Added pending tool call loading indicator using `AiProcessingState`. |
| 1.6 | Test & verify full loop | MEDIUM | ⏳ Pending | Needs manual testing: send message → tool fires → card renders → reload → cards restore → error handling works. |

**Files modified:**
- `src/app/api/chat/route.ts` — `toUIMessageStreamResponse()`, save tool data in onFinish
- `src/hooks/chat/use-conversations.ts` — preserve tool_calls/tool_results in mapConversation
- `src/lib/chat-types.ts` — added `toolCalls`, `pendingTools` fields to Message interface, widened cardType to `string`
- `src/hooks/use-chat.ts` — reconstruct tool-invocation parts on load, `deriveCardType()`, `onError` handler
- `src/components/ai/chat-message-list.tsx` — pending tool call loading states

---

### Block 2: Context Engineering (~1-2 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 2.1 | Design `search_tools` meta-tool — decide: search method (keyword/BM25/embedding), index format, what stays always-loaded vs deferred | **ULTRA** | Architecture decision that affects all tool calling going forward | 1 hr |
| 2.2 | Build `search_tools` implementation + tool index | MEDIUM | Follows the design from 2.1 | 30 min |
| 2.3 | Mark 55+ tools as deferred, keep 5 core tools always loaded | MEDIUM | Mechanical — add flags to tool registry | 20 min |
| 2.4 | Compile Swedish accounting rules into cacheable text blocks (BAS, tax, BFL, ABL, VAT) | MEDIUM | Content curation — gather from existing files, format for prompt | 1 hr |
| 2.5 | Set up prompt caching — structure prompt with static content first, dynamic last | MEDIUM | Config change in chat route | 20 min |
| 2.6 | Slim system prompt — remove inline scenarios, move to skill files | MEDIUM | Cut and paste, reorganize | 30 min |
| 2.7 | Build skill file structure (`skills/bokforing/SKILL.md`, etc.) | MEDIUM | File creation following Anthropic's pattern | 30 min |

---

### Block 3: Deterministic Rule Engine (~1-2 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 3.1 | Design rule engine architecture — how rules, tools, and AI interact; folder structure; API pattern | **ULTRA** | One-time design decision, sets the pattern for all rule tools | 30 min |
| 3.2 | `lookup_bas_account(query)` — fuzzy search over `accounts.ts` | MEDIUM | pg_trgm or simple string matching | 20 min |
| 3.3 | `calculate_vat(amount, type)` — 25/12/6/0% logic | MEDIUM | Switch/map, well-defined rules | 15 min |
| 3.4 | `calculate_employer_tax(gross, municipality)` — SKV tables | MEDIUM | Table lookup, need to verify data is correct | 30 min |
| 3.5 | `calculate_vacation_accrual(gross)` — 12% Semesterlagen | MEDIUM | One-liner essentially | 10 min |
| 3.6 | `validate_verification(entries)` — BFL compliance (debit=credit, sequential numbering, period check) | MEDIUM | Well-defined rules | 20 min |
| 3.7 | `calculate_312(salary, dividends, shares, ...)` — K10/gränsbelopp | **ULTRA** | 3:12 rules are genuinely complex — multiple formulas, edge cases, förenklingsregeln vs huvudregeln, annual updates | 1-2 hrs |
| 3.8 | Wire all existing AI tools to use rule engine instead of model knowledge | MEDIUM | Find-and-replace tool calls with rule engine calls | 30 min |

---

### Block 4: Cards + Inline Editing (~2-3 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 4.1 | Design card component architecture — edit mode state management, field types (text/number/select), recalculation flow, versioning strategy | **ULTRA** | Core UX pattern, need to think through all edge cases before building | 1 hr |
| 4.2 | Build `CompactCard` base component with field rendering (read-only default) | MEDIUM | Follows design from 4.1 | 30 min |
| 4.3 | Build edit mode — pencil button activates dotted underlines, click-to-edit fields, auto-exit on chat send | MEDIUM | Standard UI state | 30 min |
| 4.4 | Build field recalculation — changing belopp recalculates moms, etc. | MEDIUM | Per-card-type logic | 30 min |
| 4.5 | Build card variants: VerificationCard, PayrollCard, InvoiceCard, ReportCard, VATCard, BriefingCard | MEDIUM | Repeat the pattern from 4.2 for each type | 1-2 hrs |
| 4.6 | Build preview overlay — full detail view, Godkänn/Ändra/Gå till sida buttons | MEDIUM | Simple modal/overlay component | 30 min |
| 4.7 | "Gå till sida" with URL param highlighting — pass item ID, scroll-to + highlight on target page | MEDIUM | URL param + useEffect scroll | 20 min |
| 4.8 | Card versioning — when Scooby regenerates after edit, old card updates or new version appears | MEDIUM | State management in chat context | 20 min |

---

### Block 5: Memory + Skills (~1-2 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 5.1 | Fix memory injection — replace blind top-20 with relevance filtering (keyword match on latest user message) | MEDIUM | Query change in chat route | 30 min |
| 5.2 | Add memory categories for reports — task, goal, decision, note, preference | MEDIUM | DB column or category enum update | 15 min |
| 5.3 | Design summary skill system — how skills compose tool calls + memory queries + card formatting; the template/prompt pattern | **ULTRA** | This is the brain of the skill system — how Scooby gathers data, queries memory, and renders a structured briefing | 1 hr |
| 5.4 | Build `/morgon` skill (morning briefing) | MEDIUM | First implementation of the template from 5.3 | 30 min |
| 5.5 | Build `/dag`, `/vecka`, `/månad`, `/kvartal`, `/år`, `/status` skills | MEDIUM | Repeat pattern from 5.4 with different time scopes and tool calls | 1-1.5 hrs |
| 5.6 | Memory-to-report surfacing — skills call `query_memories(category, time_scope)` to find user notes | MEDIUM | Query + inject into skill prompt | 20 min |
| 5.7 | Design compaction strategy — when to summarize, what to keep, artifact offloading logic | **ULTRA** | Affects context health for all long conversations — needs careful thinking | 1 hr |
| 5.8 | Build compaction — tool result offloading, progressive summarization | MEDIUM | Implementation follows design from 5.7 | 30 min |

---

### Block 6: Tasks + Remaining Cascades (~1 coding day)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 6.1 | Tasks sidebar section — 3-5 items from system/AI/user sources | MEDIUM | Simple React component | 30 min |
| 6.2 | Tasks overlay — "Visa alla" with grouped undone + upcoming tasks | MEDIUM | Overlay with list | 30 min |
| 6.3 | Task creation from chat — user says "kom ihåg X" → Scooby saves as task | MEDIUM | Wire to memory with task category | 20 min |
| 6.4 | Finish cascade wiring — month-close routine accruals, remaining cross-module cascades | MEDIUM | Wire existing functions, pattern already established in payroll/dividend | 1 hr |

---

### Block 7: Codebase Cleanup (~1-2 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 7.1 | Dead code audit — find and remove deleted components still imported, unused exports | MEDIUM | Mechanical search and delete | 1 hr |
| 7.2 | Split files over 500 lines into focused modules | MEDIUM | Mechanical refactoring | 30 min |
| 7.3 | Add barrel exports (index.ts) to all folders | MEDIUM | File creation | 20 min |
| 7.4 | Replace all `@ts-ignore` with `@ts-expect-error` + reason | MEDIUM | Find and replace | 20 min |
| 7.5 | Create `CHANGELOG.md` with history from git log | MEDIUM | Read git log, format | 30 min |
| 7.6 | Create `ARCHITECTURE.md` — system overview for new engineers | MEDIUM | Write doc based on current knowledge | 30 min |
| 7.7 | Create `API.md` — all 52 API routes documented | MEDIUM | Read route files, document | 1 hr |
| 7.8 | Consolidate/archive redundant MD files | MEDIUM | Review and merge/delete | 20 min |
| 7.9 | Remove console.log debug statements, verify .env.example | MEDIUM | Grep and clean | 20 min |

---

### Block 8: Filing Gaps — SRU/iXBRL Generators (~3-4 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 8.1 | Design SRU generator architecture — shared field-code mapping pattern, output format, how generators share base logic (INK2 exists, NE/INK4 reuse it) | **ULTRA** | One-time design that sets the pattern for all SRU generators — needs to support 5+ form variants cleanly | 1 hr |
| 8.2 | Build NE-bilaga SRU generator (EF) — map resultaträkning fields to SKV field codes | MEDIUM | Follows INK2 pattern, different field codes | 2-3 hrs |
| 8.3 | Build INK4 + INK4R SRU generator (HB/KB) — company-level declaration + räkenskapsschema | MEDIUM | Similar to INK2 but different fields + partner distribution section | 2-3 hrs |
| 8.4 | Build INK4S + INK4DU SRU generator (HB/KB) — skattemässiga justeringar + delägaruppgifter | MEDIUM | Extension of 8.3, needs partner profit-sharing data | 1-2 hrs |
| 8.5 | Build N3A per-partner SRU generator (HB/KB, physical persons) — kapitalunderlag, räntefördelning, expansionsfond | **ULTRA** | Complex partnership tax rules — multiple formulas, per-partner calculations, spärrade underskott edge cases | 2-3 hrs |
| 8.6 | Wire iXBRL generator into årsredovisning walkthrough (AB, Förening) — `xbrl-generator.ts` exists, needs UI + download button | MEDIUM | Generator exists, wiring + card with download action | 1 hr |
| 8.7 | Make Inkomstdeklaration walkthrough company-type-aware — route to correct form (INK2 vs NE vs INK4) based on `CompanyType` | MEDIUM | Switch on company type, call correct generator | 30 min |

---

### Block 9: Page UI + Model Routing + Onboarding (~2-3 coding days)

| # | Task | Thinking | Why This Level | Est. |
|---|---|---|---|---|
| 9.1 | Design company-type-adaptive tab rendering — how `ownership-page.tsx`, `payroll-page.tsx` select tabs based on `CompanyType`, shared pattern for all pages | **ULTRA** | Affects 4 page components, needs clean gating pattern (not nested if/else) | 30 min |
| 9.2 | Build Delägare page (HB/KB) — partner cards with vinstandel %, firmatecknare badges, event timeline | MEDIUM | Follow existing Aktiebok pattern | 1-2 hrs |
| 9.3 | Build Medlemsregister page (Förening) — searchable member list with roles, status, bulk actions | MEDIUM | Standard list component | 1-2 hrs |
| 9.4 | Build Rapporter hub page — generate buttons filtered by company type + `generated_reports` table + saved report list | MEDIUM | Simple page + Supabase table | 1-2 hrs |
| 9.5 | Add `generated_reports` Supabase migration — table for persisted report snapshots (type, period, data, created_at) | MEDIUM | Standard migration | 15 min |
| 9.6 | Implement 3-tier model routing — update `selectModel()` to route Nano/Mini/Full based on query complexity classification | MEDIUM | Already designed in §17, straightforward switch logic | 30 min |
| 9.7 | Add prompt caching structure — static content (persona, rules, tool index) first, dynamic content (memories, user message) last for cache hit | MEDIUM | Reorder system prompt construction in chat route | 20 min |
| 9.8 | Build conversational onboarding — detect no-company state, Scooby greeting with org.nr lookup flow, auto-fill company record | **ULTRA** | End-to-end flow touching auth, company creation, memory seeding, and first-run UX — needs to handle edge cases (no org.nr found, manual entry, re-onboarding) | 1-2 hrs |
| 9.9 | AI insight cards on reference pages — when Scooby notices something ("2 förfallna fakturor"), show subtle info card at page top | MEDIUM | Small component + data hook per page | 30 min |

---

### Summary

| | ULTRA Tasks | MEDIUM Tasks | Total Est. |
|---|---|---|---|
| Block 1: Foundation | 2 (debug pipeline, conversation persistence) | 4 | 3-5 hrs |
| Block 2: Context Engineering | 1 (search_tools design) | 6 | 3-4 hrs |
| Block 3: Rule Engine | 2 (architecture, K10 calc) | 6 | 3-4 hrs |
| Block 4: Cards + Editing | 1 (card architecture) | 7 | 3-5 hrs |
| Block 5: Memory + Skills | 2 (skill system, compaction design) | 6 | 4-5 hrs |
| Block 6: Tasks + Cascades | 0 | 4 | 2 hrs |
| Block 7: Cleanup | 0 | 9 | 3-4 hrs |
| Block 8: Filing Gaps | 2 (SRU architecture, N3A partnership tax) | 5 | 8-12 hrs |
| Block 9: Pages + Routing + Onboarding | 2 (tab gating design, onboarding flow) | 7 | 5-8 hrs |
| **Totals** | **12 ULTRA tasks** | **54 MEDIUM tasks** | **~34-50 hrs coding** |

**Quota strategy:** ULTRA tasks burn ~3-5x more quota. Do MEDIUM tasks in batches to save quota. Group related MEDIUM tasks in one session. Do ULTRA tasks one at a time in fresh conversations.

**Optimal session plan:**
1. Session 1: Block 1.1 (ULTRA) — debug tool calling
2. Session 2: Block 1.2-1.6 (all MEDIUM) — batch the fixes
3. Session 3: Block 2.1 (ULTRA) — design search_tools
4. Session 4: Block 2.2-2.7 (all MEDIUM) — batch implementation
5. Session 5: Block 3.1 (ULTRA) — design rule engine
6. Session 6: Block 3.2-3.6 (all MEDIUM) — batch rule tools
7. Session 7: Block 3.7 (ULTRA) — K10/3:12 calculation
8. Session 8: Block 3.8 + 4.1 (MEDIUM + ULTRA) — wire rules + design cards
9. Session 9: Block 4.2-4.8 (all MEDIUM) — batch card building
10. Session 10: Block 5.3 (ULTRA) — design skill system
11. Session 11: Block 5.1-5.2 + 5.4-5.6 (all MEDIUM) — batch memory + skills
12. Session 12: Block 5.7 (ULTRA) — design compaction
13. Session 13: Block 5.8 + 6.1-6.4 (all MEDIUM) — batch compaction + tasks
14. Session 14: Block 7.1-7.9 (all MEDIUM) — batch cleanup
15. Session 15: Block 8.1 (ULTRA) — design SRU generator architecture
16. Session 16: Block 8.2-8.4 + 8.6-8.7 (all MEDIUM) — batch NE, INK4, iXBRL wiring
17. Session 17: Block 8.5 (ULTRA) — N3A partnership tax generator
18. Session 18: Block 9.1 (ULTRA) — design company-type tab gating
19. Session 19: Block 9.2-9.7 + 9.9 (all MEDIUM) — batch pages, routing, insight cards
20. Session 20: Block 9.8 (ULTRA) — conversational onboarding

**Total: ~20 sessions. At 10 daily sessions/week available = done in ~2 weeks.**

---

## 10. Decisions Made in This Review

| Decision | Rationale |
|---|---|
| **Kill side panel for MVP** | Doesn't work on mobile. Compact cards + preview overlay instead. |
| **Two-layer cards: compact inline + full preview overlay** | Compact card keeps chat readable. Inline editing handles 80% of corrections. Full preview is the final gate. |
| **Inline-editable card fields** | Dotted underline on values = clickable. Change one number without typing a sentence. Scooby recalculates dependents. |
| **"Gå till sida" with item highlighting** | After confirming in preview, user can navigate to reference page with the item scrolled-to and highlighted. Closes the loop between chat and pages. |
| **Deterministic rule tools** | AI decides what to do, hardcoded tools calculate how. Never trust model knowledge for BAS accounts, tax rates, or legal rules. |
| **Internet access (scoped)** | External data only (customer lookup, exchange rates, regulatory updates). Not for calculations or rules we own. |
| **Tasks in sidebar** | 3-5 pending items from system/AI/user. "Visa alla" opens lightweight overlay. Not a full page. |
| **Commit to Vercel AI SDK** | Already integrated. Drop `AppMessage`, use `UIMessage` everywhere. Remove the dual-format translation layer. |
| **Keep custom memory** | It works, we own the data. Fix injection (relevance filtering, not top-20). |
| **Context engineering is priority** | Deferred tool loading (52K→5K tokens) improves accuracy AND reduces cost. |
| **Add /skills for briefings** | `/morgon`, `/vecka`, `/månad`, `/status` — high-value, maps to existing Quick Actions system. |

---

## 11. Gemini Code Review Summary

| Area | Verdict | Action |
|---|---|---|
| Plan (AI_NATIVE_FLOW_REDESIGN.md) | Excellent diagnosis and structure | Keep, update with decisions from this doc |
| Memory system | Good foundation, bad injection | Fix: relevance filtering, use confidence scores, extend pending expiry |
| Vercel adapter | Half-committed, causes most bugs | Fix: commit fully, drop AppMessage, store UIMessage parts in DB |
| Side panel (ai-side-panel.tsx) | Clean code, wrong UX for MVP | Kill — replaced by compact cards + preview overlay |
| Quick Actions | Good, needs skills added | Add /morgon, /vecka, /månad, /status |
| useChatNavigation | Bug: hardcoded pageType | Fix: pass as parameter |
| Context engineering (Section 11 of redesign doc) | Best part of the plan | Prioritize: this is #4 after tool calling, rules, and persistence |

---

## 12. Knowledge Retrieval Strategy — CAG + Agentic Search + RAG

### 12.1 The Modern Landscape (Research Findings)

Traditional RAG (chunk → embed → vector search → stuff into prompt) is no longer the default recommendation. Major AI labs have converged on a layered approach:

**Anthropic:** *"If your knowledge base is smaller than 200K tokens (~500 pages), just include everything in the prompt. No need for RAG."* They also abandoned RAG in Claude Code in favor of agentic search (Grep/Glob/Read tools). Quote: *"Agentic search outperformed RAG by a lot."*

**Amazon Science (Feb 2026):** Keyword search via agentic tool use achieves >90% of RAG-level performance without any vector database.

**CAG benchmarks:** 10-40x faster than RAG, higher accuracy (BERTScore 0.7759 vs RAG's best 0.7549).

**The pattern all labs converge on: give the model tools to search with, not pre-computed embeddings to search through.**

### 12.2 Token Budget Reality Check

Does Scope AI's knowledge base fit in context (making RAG unnecessary for core rules)?

```
CACHED KNOWLEDGE (Swedish law via CAG):
─────────────────────────────────────────
BAS kontoplan (400 accounts):       ~8,000 tokens
Core tax rules (SKV rates):         ~4,000 tokens
BFL/ABL key sections:               ~5,000 tokens
Semesterlagen/employment rules:     ~3,000 tokens
─────────────────────────────────────────
Subtotal:                          ~20,000 tokens   ← fits easily

SYSTEM CONTEXT (always loaded):
─────────────────────────────────────────
Persona + rules:                      ~500 tokens
Company context (JSON scratchpad):    ~300 tokens
Tool index (60 names):                ~300 tokens
search_tools meta-tool:               ~200 tokens
Relevant memories:                    ~300 tokens
─────────────────────────────────────────
Subtotal:                           ~1,600 tokens

TOTAL BEFORE USER SPEAKS:          ~21,600 tokens
```

On GPT-4o's 128K context window, that's **17%**. Leaves 106K tokens for conversation. With prompt caching, the 20K knowledge block gets a **50-90% discount** on every request.

**Conversation capacity with compaction:**
- 20-turn deep session: ~40K tokens conversation → total ~62K (48% of 128K) ✅
- 40-turn power session: ~80K raw, but with compaction (summarize old turns, offload tool results to artifacts) → ~35K → total ~57K (44%) ✅
- Even without compaction, you don't hit 128K until ~50+ turns

**Verdict: Core Swedish accounting rules fit in CAG. No RAG needed for domain knowledge.**

### 12.3 Three Retrieval Layers (What We Actually Build)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Layer 1: CAG (Cached in Prompt)                            │
│  ─────────────────────────────────                          │
│  • BAS kontoplan (400 accounts)                             │
│  • Tax rules, VAT rates, Semesterlagen                     │
│  • BFL/ABL core sections                                   │
│  • Always available, no retrieval step                     │
│  • Cached with prompt caching (50-90% discount)            │
│  • ~20K tokens, fits in any context window                 │
│                                                              │
│  Layer 2: Agentic Search (Tool-Based Retrieval)             │
│  ─────────────────────────────────────────────              │
│  • lookup_bas_account(query) — fuzzy DB search              │
│  • calculate_tax(type, params) — deterministic calc         │
│  • search_legal(topic) — keyword search over SKV docs       │
│  • get_invoices/transactions(filters) — Supabase queries   │
│  • AI decides WHEN and WHAT to search                      │
│  • No embeddings needed — plain DB queries + keyword match │
│                                                              │
│  Layer 3: RAG (Only for User-Uploaded Documents)            │
│  ───────────────────────────────────────────────            │
│  • Activated when user uploads docs (bolagsordning, avtal) │
│  • pgvector in Supabase (enable now, populate later)       │
│  • Contextual Retrieval (Anthropic's pattern: +context     │
│    per chunk before embedding, 67% fewer retrieval failures)│
│  • Hybrid: vector search + BM25 keyword search             │
│  • NOT needed for core accounting operations               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 12.4 When Each Layer Is Used

| User Action | Layer | Why |
|---|---|---|
| "Bokför kontorsmaterial" | Layer 1 (CAG) | BAS account is in cached knowledge |
| "Vad är momsen på mat?" | Layer 1 (CAG) | VAT rules are in cached knowledge |
| "Visa alla förfallna fakturor" | Layer 2 (Agentic) | Tool queries Supabase |
| "Beräkna arbetsgivaravgift för Malmö" | Layer 2 (Agentic) | Tool does deterministic calc from tax tables |
| "Kan jag dra av den här middagen?" | Layer 1 + 2 | CAG has the rules, tool checks amount/context |
| "Vad säger bolagsordningen om utdelning?" | Layer 3 (RAG) | User-uploaded doc, needs retrieval |
| "Sammanfatta alla avtal vi har" | Layer 3 (RAG) | Multiple user docs, needs search across them |
| "Hur sparar jag pengar som nystartat AB?" | Layer 1 + 2 | CAG has tax rules, tools fetch company data |

### 12.5 What to Build Pre-Launch

| Task | Layer | Effort | Why Now |
|---|---|---|---|
| Compile Swedish accounting rules into cacheable text blocks | CAG | 1 day | Core accuracy depends on this |
| Build deterministic rule tools (lookup_account, calc_tax, etc.) | Agentic | 2-3 days | Replaces model guessing |
| Set up prompt caching for the knowledge block | CAG | 2 hrs | 50-90% cost reduction |
| Enable pgvector extension in Supabase | RAG (prep) | 5 min | One SQL command, zero downside |
| Create `knowledge_chunks` table schema | RAG (prep) | 30 min | Ready when users upload docs |
| Implement conversation compaction (summarize old turns) | All | 1 day | Prevents context overflow on long sessions |
| Implement artifact offloading (tool results → storage) | All | 1 day | Keeps context clean |

### 12.6 What to Build Post-Launch (When Users Upload Documents)

| Task | Effort | Trigger |
|---|---|---|
| Document upload → chunk → embed pipeline | 1 day | First user uploads a document |
| `retrieve_from_docs(query)` AI tool | 2 hrs | Searches user's uploaded documents |
| Contextual Retrieval preprocessing (Anthropic pattern) | 4 hrs | Improves retrieval accuracy 67% |
| Hybrid search (pgvector + BM25 in one query) | 2 hrs | Best of both worlds |
| Full SKV guideline indexing | 1 day | Edge-case tax questions |

### 12.7 Compaction Strategy (Keeps Context Clean)

Since we're using CAG instead of RAG for core knowledge, conversation length is the main context pressure. Compaction prevents overflow:

1. **Tool result offloading:** After Scooby renders a card from a tool result, replace the raw result in history with a summary reference: `{ tool: "run_payroll", summary: "3 anställda, 145K kr", artifact_id: "..." }`. Turns 3,000 tokens into 50.

2. **Progressive summarization:** When conversation exceeds ~60K tokens:
   - Turns 1-N (oldest 60%): compressed into a ~1K token summary
   - Recent turns: kept verbatim
   - As conversation grows, the compression window moves forward

3. **Artifact storage:** Large outputs (full reports, payroll details, PDF content) stored in Supabase storage. Lightweight reference in context. `load_artifact(id)` tool retrieves on demand.

---

## 13. Codebase Quality — Pre-Launch Cleanup

### 13.1 The Problem

The codebase has ~823 TypeScript files. Engineers joining the team need to read, understand, and contribute quickly. Current state:

- Dead code from deleted features still lingering
- MD files scattered with overlapping content
- No consistent folder labeling conventions
- No changelog discipline
- Monolithic files in some areas (2000+ line files)
- Missing or inconsistent barrel exports

### 13.2 Folder Structure Standard

```
src/
├── app/                        # Next.js routes (pages + API)
│   ├── api/
│   │   ├── chat/               # AI chat endpoint + memory extraction
│   │   ├── search/             # Global search
│   │   ├── bokforing/          # Accounting API routes
│   │   ├── loner/              # Payroll API routes
│   │   ├── rapporter/          # Reports API routes
│   │   └── agare/              # Ownership API routes
│   └── dashboard/              # Dashboard pages
│
├── components/                 # React components
│   ├── ai/                     # Chat, cards, input, skills
│   ├── bokforing/              # Accounting page components
│   ├── loner/                  # Payroll page components
│   ├── rapporter/              # Report page components
│   ├── agare/                  # Ownership page components
│   ├── handelser/              # Events page components
│   ├── layout/                 # Shell, sidebar, main area
│   └── ui/                     # Shadcn/shared primitives
│
├── hooks/                      # React hooks
│   ├── chat/                   # Chat-specific hooks
│   └── ...                     # Feature hooks
│
├── lib/                        # Business logic (non-React)
│   ├── ai/                     # AI context, prompts
│   ├── ai-tools/               # Tool registry + tool definitions
│   │   ├── common/             # Cross-domain tools (memory, navigation)
│   │   ├── bokforing/          # Accounting tools
│   │   ├── loner/              # Payroll tools
│   │   ├── rapporter/          # Report tools
│   │   ├── agare/              # Ownership tools
│   │   └── skills/             # Skill definitions (SKILL.md files)
│   ├── bookkeeping/            # Double-entry engine
│   ├── rules/                  # Deterministic rule engine (NEW)
│   │   ├── bas-kontoplan.ts    # BAS account lookup
│   │   ├── tax-tables.ts       # SKV municipal tax tables
│   │   ├── vat-rules.ts        # VAT rate logic
│   │   ├── vacation-accrual.ts # Semesterlagen 12%
│   │   └── k10-rules.ts       # 3:12 calculations
│   └── database/               # Supabase client + helpers
│
├── providers/                  # React context providers
├── services/                   # Service layer (DB operations)
└── data/                       # Static data (accounts, municipalities)

docs/
├── AI_DREAM_STATE.md           # This file — product vision + architecture
├── AI_NATIVE_FLOW_REDESIGN.md  # Phase plan + technical detail
├── APP_FEATURE_SPEC.md         # Founder spec
├── ACCOUNTING_APP_AUDIT.md     # 8-phase audit
├── PRODUCTION_ROADMAP.md       # Master plan
├── CHANGELOG.md                # Structured changelog (NEW)
├── ARCHITECTURE.md             # System architecture overview (NEW)
└── API.md                      # API route documentation (NEW)
```

### 13.3 Documentation Standards

**Consolidate MD files.** Current state: docs are scattered and overlapping. Target:

| File | Purpose | Rule |
|---|---|---|
| `AI_DREAM_STATE.md` | Product vision, dream state, context engineering research | Updated in this session |
| `AI_NATIVE_FLOW_REDESIGN.md` | Technical implementation phases + dead code tracking | Keep, but stop adding vision content here |
| `APP_FEATURE_SPEC.md` | Founder spec — read-only reference | Never modify, only reference |
| `PRODUCTION_ROADMAP.md` | Master plan — what's done, what's next | Keep updated as single source of progress |
| `CHANGELOG.md` | Structured changelog per session/date | NEW — every change session gets an entry |
| `ARCHITECTURE.md` | System architecture for new engineers | NEW — how the pieces connect |
| `API.md` | API route docs (endpoint, method, params, response) | NEW — generated from route files |

**Kill or archive:** Any other .md files that duplicate content in the above. `AI_NATIVE_REDESIGN.md` (deprecated, noted in memory). `ui-fixes-founder.md` (merge into changelog). One-off docs that served their purpose.

### 13.4 Changelog Format

```markdown
## [2026-03-13] — AI Dream State + Context Engineering

### Added
- `docs/AI_DREAM_STATE.md` — product vision, architecture, context engineering research
- Inline-editable card concept (two-layer: compact card + preview overlay)
- Deterministic rule engine spec (BAS lookup, tax tables, VAT rules)
- Tasks system spec (sidebar 3-5 items + overlay)
- Skills spec (/morgon, /vecka, /månad, /status)

### Changed
- Memory injection strategy: relevance filtering replaces blind top-20

### Removed
- Side panel as primary UX (killed for MVP)

### Decisions
- Cards are read-only by default; edit mode activated by button
- AI never guesses Swedish accounting rules — deterministic tools required
- Context engineering: 53K→5K tokens target (94% reduction)
```

### 13.5 Code Quality Rules (Pre-Launch)

| Rule | Why |
|---|---|
| **No file over 500 lines** | Split into focused modules. 2000-line files are unreadable. |
| **Every folder has an index.ts barrel** | Clean imports: `from '@/lib/rules'` not `from '@/lib/rules/bas-kontoplan'` |
| **No dead code** | If it's deleted from the UI, delete the component. No commented-out blocks. |
| **No `// TODO` without a linked task** | TODOs without accountability are dead code |
| **No `any` types without `@ts-expect-error` comment explaining why** | Type safety is readability |
| **No `@ts-ignore`** | Use `@ts-expect-error` with explanation instead — it fails if the error is fixed |
| **Consistent naming** | Files: kebab-case. Components: PascalCase. Hooks: camelCase. Tools: snake_case. |
| **Every AI tool has a description + 1-3 examples** | Required for tool search accuracy (Anthropic: 72%→90% with examples) |
| **Every service has JSDoc on public methods** | New engineers need to understand the API without reading implementation |

### 13.6 Pre-Launch Cleanup Checklist

- [ ] Audit all files for dead code (deleted components still imported, unused exports)
- [ ] Split files over 500 lines
- [ ] Add barrel exports to all folders
- [ ] Remove all `@ts-ignore` → replace with `@ts-expect-error` + reason
- [ ] Create `CHANGELOG.md` with history from git log
- [ ] Create `ARCHITECTURE.md` with system overview
- [ ] Create `API.md` with all 52 API routes documented
- [ ] Consolidate/archive redundant MD files
- [ ] Verify all AI tools have descriptions + examples
- [ ] Run TypeScript strict mode and fix errors
- [ ] Remove console.log debugging statements
- [ ] Verify all environment variables are documented in `.env.example`

---

## 14. Filing Gaps — What Each Company Type Actually Files

*(Migrated from AI_NATIVE_FLOW_REDESIGN.md — this is the ground truth for what filings exist, what's missing, and what's misplaced.)*

### 14.1 Skatteverket Digital APIs (Available Now)

| API / Service | Format | Status | Agreement Required |
|---|---|---|---|
| **Momsdeklaration API** | XML (eSKDUpload DTD 6.0) | Production | Yes — formal agreement with Skatteverket |
| **AGI API** (Arbetsgivardeklaration) | XML | Production | Yes — formal agreement |
| **Filöverföring** (SRU upload) | SRU files (ISO-8859-1) | Production | No — open e-tjänst with BankID login |
| **Bolagsverket Årsredovisning API** | iXBRL (se-cd taxonomy) | Production | Yes — formal agreement |

**Our current state:** We generate all correct file formats (SRU, XML, iXBRL) but have NO live API integration. Users must download files and upload manually. This is fine for launch — API integration is a business development milestone, not a code blocker.

### 14.2 AB (Aktiebolag)

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | Monthly / Quarterly | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly | ✅ Real |
| **INK2** (corporate tax return) | Skatteverket | SRU | Yearly | ✅ Real |
| **Årsredovisning** (K2/K3) | Bolagsverket | iXBRL | Yearly | ⚠️ Generator exists (`xbrl-generator.ts`) but NOT wired into UI |
| **K10** | Skatteverket (owner's personal INK1) | SRU | Yearly | ✅ Real |

**Important:** K10 is NOT a company filing — it's an attachment to the owner's personal INK1. Frame as "Hjälp ägaren beräkna K10."

**Important:** Årsredovisning becomes mandatory digital (iXBRL) for all AB from fiscal years starting after 2025-12-31. Wire the generator into the walkthrough — this is a priority.

### 14.3 EF (Enskild Firma)

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | Monthly / Quarterly / Yearly | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly (if has employees) | ✅ Real |
| **NE-bilaga** (personal tax attachment) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **Årsbokslut** (förenklat) | NOWHERE — kept in records | — | Yearly | ✅ Generation exists |
| **Egenavgifter** | NOWHERE — auto-calculated by SKV | — | — | ✅ Calculator exists |

**NE-bilaga is the critical gap.** Most important yearly filing for EF users. Maps business income/expenses from resultaträkning into SKV field codes. Must be built as walkthrough with SRU export.

**Egenavgifter is NOT a filing.** It's `profit × 0.75 × 28.97%`. SKV calculates it from the NE-bilaga. Should be an instant Scooby calculation (inline card, 2 seconds).

### 14.4 HB/KB (Handelsbolag / Kommanditbolag)

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | Monthly / Quarterly | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly (if has employees) | ✅ Real |
| **INK4** (company-level declaration) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **INK4R** (räkenskapsschema) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **INK4S** (skattemässiga justeringar) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **INK4DU** (delägaruppgifter) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **N3A** (per-partner, physical persons) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **N3B** (per-partner, legal entities) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **Årsbokslut** (förenklat) | NOWHERE (unless ALL partners are legal entities) | — | Yearly | ✅ Generation exists |

**INK4 is a significant gap.** HB/KB users currently see an "Inkomstdeklaration" page that likely renders INK2 logic — wrong for their type. INK4 has different field codes and includes mandatory delägaruppgifter (INK4DU).

**N3A/N3B per-partner declarations are missing.** Each partner needs their own form with kapitalunderlag, räntefördelning, expansionsfond, and spärrade underskott.

### 14.5 Förening (Ideell Förening)

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | If VAT registered | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly (if has employees) | ✅ Real |
| **INK2 or INK3** | Skatteverket | SRU | Yearly (if taxable) | ⚠️ INK2 exists, INK3 does not |
| **Årsredovisning** | Bolagsverket | iXBRL | Yearly (ekonomisk förening only) | ⚠️ Generator exists, not wired |

Many ideell föreningar are **exempt from tax** and don't file INK. Ekonomisk förening files årsredovisning (same as AB). Ideell förening does NOT.

### 14.6 What's Misplaced in the Current App

| Feature | Current Placement | Correct Placement |
|---|---|---|
| **Egenavgifter** | Dedicated report tab | Instant Scooby calculation — inline card |
| **K10** | Report tab under Rapporter | Scooby walkthrough — owner's personal attachment, not a company report |
| **Årsbokslut** (EF/HB/KB) | Report tab | Scooby walkthrough — generate + "Spara som PDF" (never submitted anywhere) |
| **Årsredovisning** | Report tab | Scooby walkthrough — generate + "Ladda ner iXBRL" + PDF |
| **Inkomstdeklaration** | Single report tab | Company-type-aware walkthrough (INK2 vs NE vs INK4 vs INK3) |

### 14.7 Capability Matrix

| Capability | AB | EF | HB/KB | Förening |
|---|---|---|---|---|
| Momsdeklaration + XML | ✅ | ✅ | ✅ | ✅ |
| AGI + XML | ✅ | ✅ | ✅ | ✅ |
| Resultaträkning | ✅ | ✅ | ✅ | ✅ |
| Balansräkning | ✅ | ✅ | ✅ | ✅ |
| INK2 + SRU | ✅ | N/A | N/A | ⚠️ |
| NE-bilaga + SRU | N/A | ❌ **GAP** | N/A | N/A |
| INK4 + SRU | N/A | N/A | ❌ **GAP** | N/A |
| N3A/N3B + SRU | N/A | N/A | ❌ **GAP** | N/A |
| K10 + SRU | ✅ | N/A | N/A | N/A |
| Egenavgifter calculator | N/A | ✅ | ✅ | N/A |
| Årsredovisning iXBRL | ⚠️ disconnected | N/A | N/A | ⚠️ disconnected |
| Årsbokslut | N/A | ✅ | ✅ | N/A |
| Skatteverket API | ❌ manual upload | ❌ | ❌ | ❌ |

**Critical gaps before HB/KB/EF users can do yearly declarations:**
1. NE-bilaga SRU generator (EF)
2. INK4 + INK4R + INK4S + INK4DU SRU generator (HB/KB)
3. N3A per-partner SRU generator (HB/KB)
4. Wire iXBRL generator into årsredovisning walkthrough (AB, Förening)

---

## 15. Company-Type Tab Matrices

*(Migrated from AI_NATIVE_FLOW_REDESIGN.md — defines exactly which tabs each company type sees after consolidation.)*

### 15.1 Ägare: Per Company Type

| Company Type | Tab 1 | Tab 2 | Walkthroughs (via Scooby) |
|---|---|---|---|
| **AB** | Aktiebok & Styrning (aktiebok + firmatecknare) | Möten & Beslut (stämma + styrelseprotokoll) | Utdelning, K10 |
| **EF** | Ägarinfo (single card, no tabs) | — | — |
| **HB** | Delägare (partners + firmatecknare) | — | Delägaruttag |
| **KB** | Delägare (partners + firmatecknare) | — | Delägaruttag |
| **Förening** | Medlemsregister | Möten & Beslut (stämma + årsmöte + protokoll) | — |

- EF gets one card, not tabs. `EnskildFirmaOwnerInfo` handles this.
- HB/KB have no formal meetings → only 1 tab. Firmatecknare merges into Delägare.
- Förening keeps Medlemsregister as a tab (legal register per stadgar). Årsmöte merges into Möten & Beslut.
- AB gets 2 tabs: share register (ABL required) + meeting archive.

### 15.2 Löner: Per Company Type

| Company Type | Tab 1 | Tab 2 | Walkthroughs (via Scooby) |
|---|---|---|---|
| **AB** | Löneöversikt | Team | AGI, K10 |
| **EF** | Löneöversikt | Team | Egenavgifter, AGI |
| **HB/KB** | Löneöversikt | Team | Delägaruttag, Egenavgifter, AGI |
| **Förening** | Löneöversikt | Team | AGI |

All types keep 2 tabs. Delägaruttag, Egenavgifter, AGI, K10 become walkthroughs.

### 15.3 Rapporter: Per Company Type

All report types become AI walkthroughs. The Rapporter hub page shows a grid of recently generated reports + quick-generate buttons filtered by company type.

| Company Type | Available Report Walkthroughs |
|---|---|
| **AB** | Resultaträkning, Balansräkning, Momsdeklaration, INK2, Årsredovisning (K2/K3) |
| **EF** | Resultaträkning, Balansräkning, Momsdeklaration, NE-bilaga, Årsbokslut (förenklat) |
| **HB/KB** | Resultaträkning, Balansräkning, Momsdeklaration, INK4, Årsbokslut (förenklat) |
| **Förening** | Resultaträkning, Balansräkning, Momsdeklaration, INK2/INK3, Årsredovisning |

AB uses `arsredovisning` (formal). EF/HB/KB use `arsbokslut` (simplified). Already handled by `CompanyTypeInfo.arsbokslutVariant`.

### 15.4 Full Tab Count Summary

| Company Type | Händelser | Bokföring | Löner | Rapporter | Ägare | Total |
|---|---|---|---|---|---|---|
| **AB** | 2 | 3 | 2 | hub | 2 | 10 |
| **EF** | 2 | 3 | 2 | hub | 1 | 9 |
| **HB/KB** | 2 | 3 | 2 | hub | 1 | 9 |
| **Förening** | 2 | 3 | 2 | hub | 2 | 10 |

---

## 16. Reference Page UI Specs

*(Migrated from AI_NATIVE_FLOW_REDESIGN.md — defines the unique UI pattern for each surviving page.)*

Pages are for **reading**. Chat is for **doing**. Each surviving page has a UI pattern suited to its data type — no more uniform stat cards + table everywhere.

### 16.1 Page Patterns

**Transaktioner** → **Inbox pattern.** Unhandled items float to top with "action needed" state. Handled items below. Receipts (kvitton) appear as thumbnail attachments on linked transactions. The count of unhandled items IS the stat — no stat cards. "Bokför" action is either inline (obvious categorization) or a command button to Scooby (ambiguous). Filter, search, OCR upload always available.

**Fakturor** → **Kanban (keep as-is).** Lifecycle columns (Utkast → Skickad → Betald → Förfallen). Already works well. No changes.

**Huvudbok** → **Inline-expansion ledger.** Each verification shows as a row with number, date, description, total. Click to expand and see debit/credit rows underneath — no separate details dialog. Sequential numbering visible at a glance (BFL compliance). Most recent at top.

**Team** → **Card grid (keep as-is).** Card per person with drill-down to dossier. Already works.

**Aktiebok & Styrning (AB)** → **Registry + timeline.** Top: shareholder cards (name, share count, ownership %, role, firmatecknare badge). Bottom: event timeline of corporate actions (emissions, transfers, dividends, meetings). Command buttons for Scooby actions.

**Delägare (HB/KB)** → **Partner registry.** Partner cards with role (komplementär/kommanditdelägare for KB), vinstandel %, firmatecknare badge. Event timeline below (vinstfördelning, bolagsavtal updates). Command buttons for partner actions.

**Medlemsregister (Förening)** → **Searchable member list.** Name, status (aktiv/vilande/avslutad), role (ordförande/kassör/ledamot), membership start date. Bulk actions.

**Händelser — Översikt** → **Calendar + activity dashboard.** Calendar with day-by-day activity feed, Deadlines section (upcoming filings/payments), "Dina planer" section showing active plan cards with progress bars from `roadmaps` table.

**Händelser — Arkiv** → **Keep as-is.** 12-month grid with period closing checklists. Best UI in the app.

**Rapporter** → **Hub page (no tabs).** Quick-generate buttons filtered by company type + list of previously generated report snapshots. Needs `generated_reports` table.

**Ägare (EF)** → **Single info card.** Owner/company info via `EnskildFirmaOwnerInfo`. No tabs. Command buttons for EF-specific Scooby actions.

### 16.2 Design Principles

1. **No stat cards unless the stat is actionable.** "3 att hantera" = actionable. "Totalt: 245 st" = remove.
2. **Inline expansion over dialogs.** Click a row to expand details in place.
3. **Unhandled items float to top.** Separate "needs attention" from "handled."
4. **Command buttons, not form dialogs.** Complex creation flows route to Scooby.

---

## 17. GPT Model Routing

*(Migrated from AI_NATIVE_FLOW_REDESIGN.md — defines the 3-tier model strategy.)*

### 17.1 3-Tier Model Routing

```
Old:  GPT-4o-mini (simple) → GPT-4o (complex)
New:  GPT-5 Nano (simple)  → GPT-5 Mini (medium) → GPT-5.1 (complex)
```

| Tier | Model | When | ~% of Traffic |
|------|-------|------|---------------|
| **Nano** | `gpt-5-nano` | Greeting, classification, simple Q&A, memory updates | 50% |
| **Mini** | `gpt-5-mini` | Tool calling (1-3 tools), standard bookkeeping, invoice creation | 40% |
| **Full** | `gpt-5.1` | Multi-step reasoning, month-close, complex analysis, walkthrough generation | 10% |

### 17.2 Pricing (per 1M tokens)

| Model | Input | Output | Role |
|-------|-------|--------|------|
| **GPT-5 Nano** | $0.05 | $0.40 | Simple queries, routing, classification |
| **GPT-5 Mini** | $0.25 | $2.00 | Tool calling, medium complexity |
| **GPT-5 / 5.1** | $1.25 | $10.00 | Complex reasoning, multi-step tasks |
| **GPT-5.2** | $1.75 | $14.00 | Frontier — strongest model |
| *Claude Haiku 4.5* | *$1.00* | *$5.00* | *Reference — 4x more than GPT-5 Mini* |
| *Claude Sonnet 4.6* | *$3.00* | *$15.00* | *Reference — 2.4x more than GPT-5.1* |

### 17.3 Cost Projection

At ~1000 requests/day (70% Nano, 25% Mini, 5% Full):

| Tier | Requests/day | Output cost/day | Monthly |
|------|-------------|-----------------|---------|
| Nano | 700 | $0.14 | $4.20 |
| Mini | 250 | $0.75 | $22.50 |
| Full | 50 | $1.50 | $45.00 |
| **Total** | **1000** | **$2.39** | **~$72/mo** |

GPT-5 Nano has 90% cached input discount ($0.005/M) — system prompt + tools are identical every request.

---

## 18. Onboarding Flow

*(Migrated from AI_NATIVE_FLOW_REDESIGN.md — defines conversational first-time setup.)*

### 18.1 First-Time User Experience

When a user creates an account and has no company connected, the app guides them through setup via Scooby — not a traditional form wizard. This reinforces the AI-first pattern from the first interaction.

### 18.2 Flow

1. User signs up → lands on `/dashboard` → sees Scooby's greeting
2. Scooby greets: "Välkommen! Jag är Scooby, din AI-bokförare. Ska vi sätta upp ditt företag?"
3. Asks for org.nr → calls Bolagsverket/allabolag lookup → auto-fills company name, type, address, SNI
4. Confirms details → creates company record
5. Asks about momsperiod, räkenskapsår, bankuppkoppling
6. Suggests first actions based on company type: "Du har ett AB — vill du börja med att lägga in aktieägarna?"
7. Dynamic suggestion chips update to reflect the new company's state

### 18.3 Why This Works

- No separate onboarding page or wizard to build/maintain
- Scooby learns the company while setting it up (first memory entries)
- Reinforces "you do everything by talking to Scooby"
- If user types something else first, onboarding happens naturally whenever they're ready

---

## 19. The End State (One Paragraph)

User opens Scope AI on their phone. Sidebar shows "2 att göra." Scooby greets them: "3 nya transaktioner, moms Q1 förfaller fredag." They type `/morgon` and get a briefing card. They photograph a Shopify receipt and say "bokför det här" — Scooby OCRs it, shows a compact card: Shopify, 100 kr, konto 6540, moms 25%. The "100 kr" has a dotted underline — they tap it, change to 120 kr, moms recalculates. They tap "Bokför" → verification created → "Gå till Huvudbok" → the verification is highlighted on the page. They say "kör lönerna" and get a payroll card — they tap Erik's semestertillägg to adjust it, then tap "Visa förhandsgranskning" for the full breakdown, then "Godkänn." Vacation accrual posts automatically. They close the app. Tomorrow, Scooby remembers everything. That's the product.
