# Workflow: Scooby Streaming UI — Component Catalog & Rendering Rules

> How Scooby composes chat responses using structured UI components. This is the production specification for what Scooby renders in conversation, when, and how.

## Purpose

This document is the **production reference** for building the AI streaming layer. Every scenario built in the test pages (`test-ui/ai-streaming/`) defines how Scooby should render a response for that domain. This doc codifies the rules so we can implement the matching production logic.

**The flow:**
1. Test pages define the visual contract (static renders of ideal conversations)
2. This doc captures the rules and component specifications
3. Production code implements Scooby's system prompt + rendering to match

## The Conversation Anatomy

Every Scooby response follows a consistent structure:

```
User sends message
  → AiProcessingState (shimmer: "Söker bland verktyg...")
  → AiProcessingState (shimmer: "Hämtar transaktioner...")
  → AiProcessingState completes (✓ checkmarks appear)
  → Markdown text (Scooby's natural language)
  → [Optional] Inline UI component (card, table, confirmation)
  → [Optional] More markdown text
  → [Optional] More UI components
```

The key insight: **Scooby's response is a stream of interleaved markdown text and structured UI components.** The text provides context, explanation, and personality. The components provide actionable data, confirmations, and navigation.

## Component Catalog

### 1. AiProcessingState

**What it is:** A shimmer/checkmark indicator showing which tool Scooby is calling.

**When it appears:** At the start of every Scooby response, before any text or cards.

**Behavior:**
- While running: shimmer animation with Swedish label (e.g., "Hämtar transaktioner...")
- When complete: green checkmark + label (e.g., "✓ Hämtar transaktioner")
- Multiple can appear in sequence (one per tool call)

**Deterministic mapping:** Tool name → Swedish label is hardcoded in `src/components/shared/ai-processing-state.tsx`. Not stochastic.

**Props:** `toolName: string`, `completed: boolean`

**Component:** `<AiProcessingState toolName="get_transactions" completed />`

---

### 2. ConfirmationCard

**What it is:** The human-in-the-loop approval card. Scooby proposes an action, user confirms or rejects.

**When it appears:** After Scooby has gathered data and composed a proposal for a WRITE action.

**States:**
- **Pending:** Shows summary rows + "Godkänn" / "Avbryt" buttons
- **Done (isDone):** Shows summary rows + green "Klart" checkmark (buttons removed)

**Scooby provides:**
- `title`: What the action is (e.g., "Bokför kvitto")
- `description`: Context (e.g., "Kjell & Company — kontorsmaterial")
- `summary[]`: Array of `{ label, value }` rows
- `warnings[]`: Optional amber warning messages
- `action`: `{ toolName, params }` — which tool to execute on confirm

**Card chrome (deterministic):**
- `icon`: Chosen by Scooby from a domain-appropriate set (see Accent Guide)
- `accent`: Color theme — `blue | green | emerald | purple | amber | red | indigo | teal`

**Accent Guide:**

| Domain | Accent | Icon Examples |
|--------|--------|---------------|
| Bokföring (transactions, receipts) | `blue` | Receipt, ArrowLeftRight |
| Bokföring (verifikationer) | `indigo` | Hash, BookOpen |
| Fakturor (create, payment) | `teal` | FileText, CreditCard |
| Fakturor (makulera) | `amber` | XCircle, AlertTriangle |
| Löner | `blue` | Coins, Users |
| Inventarier | `indigo` | Package, TrendingDown |
| Förmåner | `green` / `blue` | Gift, Car |
| Ägare / delägare | `purple` | Users, Landmark |
| Utdelning | `green` | Banknote |
| Delägaruttag | `blue` / `green` | Wallet, ArrowUpCircle |
| Destructive actions | `amber` | AlertTriangle, XCircle |

**Component:** `<ConfirmationCard confirmation={...} icon={Receipt} accent="blue" isDone onConfirm={fn} onCancel={fn} />`

---

### 3. WalkthroughOpenerCard

**What it is:** A clickable card that appears after Scooby generates a report. Clicking it opens the full walkthrough overlay with the detailed view.

**When it appears:** After a report/calculation tool completes and Scooby has summarized the results in markdown.

**The flow:**
```
User: "Generera resultaträkning för Q1"
  → Tool calls (get_income_statement, generate_report)
  → Markdown summary with key numbers
  → WalkthroughOpenerCard appears (clickable)
  → User clicks → full walkthrough overlay opens in main content area
```

**Deterministic mapping (walkthroughType → icon + color):**

Scooby provides ONLY:
- `walkthroughType`: one of the fixed set below
- `title`: dynamic string (e.g., "Resultaträkning Q1 2026")
- `subtitle`: dynamic string with key numbers (e.g., "Intäkter 485 000 kr · Resultat 173 000 kr")

The component handles icon, color, and click target:

| `walkthroughType` | Icon | Color | Click Target |
|---|---|---|---|
| `resultaträkning` | TrendingUp | emerald | Resultaträkning walkthrough |
| `balansräkning` | Scale | blue | Balansräkning walkthrough |
| `momsdeklaration` | Receipt | amber | Momsdeklaration walkthrough |
| `k10` | PieChart | purple | K10 walkthrough |
| `egenavgifter` | Calculator | amber | Egenavgifter walkthrough |
| `agi` | Send | blue | AGI walkthrough |
| `inkomstdeklaration` | FileText | red | Inkomstdeklaration walkthrough |
| `årsredovisning` | BookOpen | indigo | Årsredovisning walkthrough |
| `lönespecifikation` | Users | green | Lönespecifikation walkthrough |

**Why deterministic:** The icon and color are the "plumbing" — they must be consistent for trust. Resultaträkning is ALWAYS emerald/TrendingUp. The text is stochastic (Scooby names it), the chrome is fixed.

**Component:** `<WalkthroughOpenerCard walkthroughType="resultaträkning" title="..." subtitle="..." />`

---

### 4. InlineCardRenderer

**What it is:** Compact clickable data rows that appear inline in Scooby's response. Clicking navigates to the relevant read-only page with the item highlighted.

**When it appears:** After READ queries that return lists of entities (transactions, invoices, verifications, payroll, etc.)

**Card types:**

| `cardType` | Renders | Click Target |
|---|---|---|
| `invoice` | Customer, amount, status badge | Bokföring → Fakturor tab |
| `transaction` | Description, amount, Bokförd/Obokförd | Bokföring → Transaktioner tab |
| `verification` | Verification number, description, amount | Bokföring → Verifikationer tab |
| `payroll` | Employee name, period, net amount | Löner → Lönebesked tab |
| `report` | Report title, period | Rapporter page |
| `receipt` | Supplier, amount, date | Bokföring → Kvitton tab |
| `vat` | Period, amount, status | Rapporter page |
| `dividend` | Name, amount, year | Ägare → Utdelning tab |

**Component:** `<InlineCardRenderer card={{ cardType: "transaction", data: { ... } }} />`

---

### 5. CardRenderer (Data Display Cards)

**What it is:** Richer data cards for activity feeds, status checklists, summaries, and lists.

**Card subtypes:**

#### ActivityFeed / Status Checklist
Shows a list of events or status items with action badges.

**When it appears:**
- "Vad behöver jag göra?" → status checklist with error/warning/done/pending badges
- "Vad hände igår?" → activity timeline with booked/created/updated badges
- Månadsavslut → checklist of items to review
- Payroll blockers → error checklist of missing data

**Scooby provides:** `{ type: "activityfeed", data: { title, description, events[] } }`

Each event: `{ id, action, entityType, title, description, timestamp }`

Action badge mapping (deterministic):
- `done` → green checkmark
- `error` → red alert
- `warning` → amber warning
- `pending` → gray clock
- `booked` / `created` / `updated` → contextual action badges

#### Summary Card
Shows a calculation result with labeled rows and one highlighted total.

**When it appears:** After calculation tools complete (payroll, egenavgifter, löneberäkning).

**Scooby provides:** `{ type: "summary", data: { title, items[] } }`

Each item: `{ label, value, highlight? }`

#### Generic List
Compact list of search results or entities.

**Scooby provides:** `{ type: "genericlist", data: { title, items[] } }`

---

### 6. BalanceAuditCard / ResultatAuditCard

**What it is:** Inline audit results showing pass/warning/fail checks.

**When it appears:** After balanskontroll or resultatkontroll runs.

**Scooby provides:** `{ date, checks[], summary: { total, passed, warnings, failed } }`

Each check: `{ name, status: "pass" | "warning" | "fail", description, details? }`

---

## Rendering Rules

### Rule 1: Tool calls ALWAYS appear first
AiProcessingState indicators render before any text or cards.

### Rule 2: Markdown wraps around components
Scooby's text appears before AND after inline components. Text provides context ("Jag hittade..."), components provide the data, and trailing text provides next steps ("Vill du att jag...?").

### Rule 3: One confirmation per action
Each WRITE action gets exactly one ConfirmationCard. Batch operations get one card with all items listed.

### Rule 4: Cascades get their own confirmation
When a primary action triggers a cascade (e.g., payroll → AGI), the cascade gets a SEPARATE ConfirmationCard that appears after the primary confirmation.

### Rule 5: READ responses use inline cards
Lists of entities (transactions, invoices, etc.) render as InlineCardRenderer rows. Not as markdown tables (unless the data is too heterogeneous for cards).

### Rule 6: Reports produce WalkthroughOpenerCards
When Scooby generates a formal report (resultaträkning, K10, moms, etc.), a WalkthroughOpenerCard appears at the end. Clicking opens the full walkthrough overlay.

### Rule 7: Status checks use ActivityFeed
"What do I need to do?" and monthly closing scenarios use the ActivityFeed card with status badges. Not markdown checklists.

### Rule 8: Company type badges on scenarios
Entity-specific scenarios show badges (AB, EF, HB, KB, Förening) so the user knows which company types see which flows.

---

## Scooby's Streaming Behavior

### Text Style
- **Concise and action-oriented.** No filler.
- **Swedish throughout.** All labels, explanations, numbers.
- **Bold key terms inline** — not entire sentences. Used to anchor the reader's eye.
- **Numbered lists with bold label + em-dash** — for enumerable items (e.g., "1. **Bolagsstämman beslutar** — utdelning kräver...")
- **Bold inline labels as section markers** — used as mini-headers within flowing text (e.g., "**I korthet:** ...", "**Min rekommendation:** ...")
- **Markdown tables** for comparative data (deadlines, tax scenarios, account mappings)
- **Tips in blockquotes.** `> 💡 *Tips:* ...`
- **Warnings with ⚠️.** For items requiring attention
- **Short paragraphs** — 2-3 sentences max. Never walls of text.

### Format Scaling (Question Complexity → Response Format)

Scooby adapts response format based on question complexity. Small question = small answer.

| Level | When | Format | Example |
|---|---|---|---|
| **Tiny** | Simple definition, yes/no | 1-2 sentences, bold key term only | "**Moms** är en skatt som..." |
| **Quick** | Short conceptual question | 1 paragraph (2-4 sentences), bold terms | "**Debet** är vänster, **kredit** är höger..." |
| **Medium** | Concept that needs structure | Intro paragraph + numbered list + bold labels + blockquote tip | "Hur fungerar utdelning?" → 3 numbered points + summary |
| **Big** | System overview or calculation | Intro + `###` headers + table + concrete example + blockquote tip | "Vad är K10?" → headers, table, calculation example |

**The rule:** Never use headers, tables, or numbered lists for a question a sentence can answer. Escalate format only when the content demands it.

**Reference:** See `allmant/kunskap/page.tsx` — scenarios ordered tiny → quick → medium → big to demonstrate the full scale.

### Response Length
- **READ queries:** 2–4 sentences + inline cards/tables. Short.
- **WRITE confirmations:** 1–2 sentences explaining what Scooby found + ConfirmationCard.
- **Post-confirmation:** 1 sentence confirmation + any cascade information.
- **Knowledge questions:** Scaled by complexity (see Format Scaling above).
- **Advisory/optimization:** Tool calls for data → structured comparison (table) → bold recommendation → tip.

### Error Handling
When Scooby can't complete an action (missing data, invalid state), it:
1. Explains what's missing
2. Shows a StatusChecklist card with error items
3. Asks for the specific missing information
4. Does NOT proceed with guesses

---

## Test Page Reference

Each test page is the visual specification for its domain:

| Test Page | Domain | Scenarios |
|---|---|---|
| `bokforing/transaktioner` | Transactions | Visa · Bokför kvitto · Batch |
| `bokforing/fakturor` | Invoices | Visa · Skapa · Registrera betalning · Makulera |
| `bokforing/verifikationer` | Verifications | Visa · Makulera |
| `bokforing/inventarier` | Assets | Visa · Registrera · Kör avskrivning |
| `handelser/handelser` | Events | Vad behöver jag göra? · Månadsavslut · Deadlines |
| `loner/lonekorning` | Payroll | Kör löner (AB) · Kör löner (HB blocker) · Visa beräkning |
| `loner/team` | Team | Lägg till · Visa · Uppdatera |
| `loner/formaner` | Benefits | Friskvårdsbidrag · Visa · Tjänstebil |
| `loner/egenavgifter` | Self-employment tax | Visa · Beräkna (→ walkthrough) |
| `loner/delagaruttag` | Partner withdrawals | Uttag · Visa · Insättning |
| `rapporter/rapporter` | Reports | Resultaträkning · Balanskontroll · Moms · K10 |
| `agare/delagare` | Partners (HB/KB) | Visa · Uppdatera andelar |
| `agare/medlemsregister` | Members (Förening) | Visa · Lägg till |
| `agare/bolagsstamma` | AGM (AB) | Stämmoprotokoll · Utdelningsbeslut |
| `agare/aktiebok` | Share register (AB) | Visa · Aktieöverlåtelse |
| `agare/utdelning` | Dividends (AB) | Beräkna max · Betala ut |
| `allmant/kunskap` | Knowledge questions | Tiny · Quick · Medium · Big (format scaling) |
| `allmant/optimering` | Tax optimization | Lön vs utdelning · Momsregistrering · Skatteminimering |
| `allmant/uppgifter` | Tasks & reminders | Spara påminnelse · Visa uppgifter · Onboarding |

---

## What Connects Here

- `ai-interface.md` — the interaction flow (chat-only mutations, confirmation pattern)
- `walkthrough-overlays.md` — what opens when user clicks a WalkthroughOpenerCard
- `scooby-engine.md` — how Scooby manages context and selects tools
- `tools.md` — the tool definitions that Scooby calls
- Test pages (`src/app/test-ui/ai-streaming/`) — the visual specification
