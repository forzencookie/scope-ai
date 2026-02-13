# Walkthrough Overlay Designs

Document-style AI overlays for presenting data, analysis, and decisions. The AI has three response modes:

**Mode A — Chat:** Answer in conversation. No overlay. For questions, advice, and guidance.
**Mode B — Fixed walkthrough:** Standardized document layout. For formal reports, legal documents, tax forms.
**Mode C — Dynamic walkthrough:** AI freely composes blocks. For analysis, exploration, and operational review.

**The AI reads intent, not just topic.** The same domain (e.g., utdelning) produces different responses:

- "Hur fungerar utdelning?" → **Chat** — explain in conversation
- "Hur mycket kan jag dela ut?" → **Dynamic walkthrough** — calculation + advice + options
- "Skapa utdelningsbeslut" → **Fixed walkthrough** — formal legal document

Users often start with chat and escalate to walkthroughs as the conversation progresses. The AI guides this naturally.

**Walkthrough skeleton** (modes B and C):

```
1. title                    ← always first
2. [blocks]                 ← fixed list (mode B) or AI's choice (mode C)
3. ai-comment (optional)    ← if the AI has analysis to share
4. actions                  ← always last (at minimum: Stäng)
```

---

## Architecture

### How it works

1. User makes a request ("Visa personalkostnader", "Hur gick Q4?", "Skapa utdelningsbeslut")
2. The AI determines what **data** it needs and calls the relevant **data-fetching tools**
3. The AI receives raw data back from those tools
4. The AI **freely composes** blocks from the block library, guided by:
   - The user's specific question (narrow → fewer blocks; broad → more blocks)
   - The domain context (legal → formal blocks; personal → warm blocks)
   - The data itself (problems → callouts first; clean data → minimal commentary)
5. The AI returns structured JSON conforming to the **output schema**
6. The walkthrough overlay renderer maps each block to a React component
7. User interacts (approves, edits, closes) — actions dispatch events back to the AI

### Key difference from static tools

There are no "walkthrough_kostnadsanalys" or "walkthrough_resultatrakning" tools with fixed layouts. Instead:

- **Data tools** fetch raw data (expenses, KPIs, transactions, payroll, etc.)
- **The AI** decides which blocks to use, how many, and in what order
- **Domain guidance** (below) gives the AI hints about tone and preferred block types per domain — but the AI can deviate when the user's question calls for it

### Available company context

Every walkthrough has access to:

```json
{
  "company": {
    "name": "string",
    "orgNumber": "string",
    "type": "AB | EF | HB | BRF | Förening",
    "fiscalYear": "string (e.g. 2025-01-01 to 2025-12-31)",
    "vatRegistered": "boolean",
    "employeeCount": "number",
    "shareholderCount": "number"
  },
  "user": {
    "name": "string",
    "role": "owner | admin | accountant | employee",
    "shareholderId": "string | null"
  },
  "currentPage": "string (route path)",
  "currentDate": "string (ISO date)"
}
```

### Output schema

The renderer expects this exact shape. The AI selects from these block types freely.

```typescript
interface WalkthroughOutput {
  blocks: WalkthroughBlock[];
}

type WalkthroughBlock =
  | { type: "title"; text: string; subtitle?: string; date?: string }
  | { type: "letter"; text: string }
  | { type: "ai-comment"; text: string }
  | { type: "divider" }
  | {
      type: "stat-cards";
      cards: Array<{
        label: string;
        value: string;
        change?: string;
        changeDirection?: "up" | "down" | "neutral";
        icon?: string;
        tooltip?: string;
      }>;
    }
  | {
      type: "chart";
      variant: "area" | "bar" | "pie" | "donut";
      title?: string;
      height?: number;
      data: Array<Record<string, string | number>>;
      series: Array<{ key: string; label: string; color?: string }>;
      xAxis?: string;
      yAxis?: string;
      annotations?: Array<{ label: string; value: number }>;
    }
  | {
      type: "ranked-list";
      heading?: string;
      items: Array<{
        label: string;
        value: string;
        percentage?: number;
        icon?: string;
        color?: string;
        sublabel?: string;
      }>;
    }
  | {
      type: "timeline";
      days: Array<{
        date: string;
        label: string;
        empty?: boolean;
        items?: Array<{
          text: string;
          detail?: string;
          status?: "pass" | "warning" | "fail";
          category?: string;
          choice?: {
            question: string;
            options: Array<{ label: string; value: string }>;
          };
        }>;
      }>;
    }
  | {
      type: "embedded-document";
      title?: string;
      style?: "default" | "dashed" | "double-rule";
      sections: Array<{
        heading?: string;
        rows: Array<{ label: string; value: string; editable?: boolean }>;
      }>;
      footer?: string;
    }
  | {
      type: "financial-table";
      columns: string[];
      rows: Array<{
        label: string;
        values: string[];
        bold?: boolean;
        indent?: number;
        annotation?: string;
      }>;
      footnotes?: Array<{ id: string; text: string }>;
    }
  | {
      type: "status-grid";
      items: Array<{
        heading: string;
        status: "pass" | "warning" | "fail";
        description: string;
        details?: string;
      }>;
    }
  | {
      type: "numbered-notes";
      heading?: string;
      notes: Array<{
        text: string;
        choice?: {
          question: string;
          options: Array<{ label: string; value: string }>;
        };
      }>;
    }
  | {
      type: "person-slips";
      people: Array<{
        name: string;
        subtitle?: string;
        rows: Array<{ label: string; value: string }>;
        bar?: { value: number; max: number };
        note?: string;
        callout?: {
          variant: "info" | "warning" | "danger";
          text: string;
          actions?: Array<{ label: string; value: string }>;
        };
      }>;
    }
  | {
      type: "photo-grid";
      items: Array<{
        thumbnail: string;
        title: string;
        details: string;
        status: "pass" | "warning" | "fail";
        choice?: {
          question: string;
          options: Array<{ label: string; value: string }>;
        };
        tip?: string;
        action?: { label: string; value: string };
      }>;
    }
  | {
      type: "checklist";
      steps: Array<{
        label: string;
        status: "done" | "active" | "locked";
        description: string;
        result?: string;
        blockedBy?: string;
        action?: { label: string; value: string };
      }>;
    }
  | {
      type: "progress-sections";
      sections: Array<{
        title: string;
        description: string;
        status: "done" | "warning" | "pending";
        statusNote?: string;
        link?: string;
      }>;
    }
  | {
      type: "calculation";
      sections: Array<{
        heading: string;
        rows: Array<{ label: string; value: string; highlight?: boolean }>;
        result?: { label: string; value: string };
      }>;
    }
  | {
      type: "register-table";
      columns: string[];
      rows: string[][];
      truncated?: { showing: number; total: number };
      summary?: Array<{ label: string; value: string }>;
    }
  | {
      type: "running-balance";
      entries: Array<{
        date: string;
        description: string;
        amount: string;
        balance: string;
      }>;
    }
  | {
      type: "callout";
      title?: string;
      content: string;
      variant: "info" | "warning" | "danger";
      actions?: Array<{ label: string; value: string }>;
    }
  | {
      type: "choice";
      question: string;
      options: Array<{ label: string; value: string; description?: string }>;
    }
  | {
      type: "deadlines";
      items: Array<{
        date: string;
        label: string;
        detail?: string;
        daysLeft?: number;
        link?: string;
      }>;
    }
  | {
      type: "form-fields";
      sections: Array<{
        heading: string;
        fields: Array<{
          code: string;
          label: string;
          value: string;
          highlighted?: boolean;
        }>;
      }>;
    }
  | {
      type: "legal-paragraphs";
      paragraphs: Array<{
        number: string;
        heading: string;
        text: string;
        action?: { label: string; value: string };
      }>;
    }
  | {
      type: "actions";
      buttons: Array<{
        label: string;
        variant: "default" | "outline";
        value: string;
      }>;
    }
  | {
      type: "collapsed-group";
      label: string;
      count?: number;
      defaultOpen?: boolean;
      children: WalkthroughBlock[];
    }
  | {
      type: "inline-choice";
      question?: string;
      options: Array<{ label: string; value: string }>;
    }
  | {
      type: "annotation";
      text: string;
      variant: "muted" | "warning" | "success" | "error";
    }
  | {
      type: "columns";
      columns: WalkthroughBlock[][];
      gap?: "sm" | "md" | "lg";
    }
  | {
      type: "metric";
      label: string;
      value: string;
      change?: string;
      trend?: "up" | "down" | "neutral";
    };
```

### Master Composition Prompt

This is the single prompt the AI uses for ALL walkthroughs. Domain guidance (below) adds context, but this prompt governs.

```
You are composing a walkthrough overlay — a document-style full-screen overlay that presents
data, analysis, or a decision to the user. You have access to the full block library.

THE SKELETON (fixed):
1. First block is ALWAYS `title` with relevant text and subtitle.
2. Middle blocks — see LAYOUT MODE below.
3. If you have analysis or commentary, use ONE `ai-comment` block (not multiple).
4. Last block is ALWAYS `actions`. Minimum: [{ "Stäng", "outline" }].
   Add action buttons ONLY if the user can take a meaningful action (approve, export, send, etc.).

STEP 0 — DETERMINE RESPONSE MODE:
Before composing ANY walkthrough, determine the user's intent:

A) CHAT RESPONSE (no walkthrough):
   The user is asking a question, seeking advice, or having a conversation.
   → Respond in chat text. Use data tools to fetch numbers if needed, but present
     the answer as a normal chat message. NO walkthrough overlay.
   Examples:
   - "Hur fungerar utdelning?" → explain in chat
   - "Tjena, jag vill ta ut utdelning men vet inte hur mycket" → advise in chat,
     fetch data to give specific numbers, THEN offer: "Vill du att jag visar en beräkning?"
   - "Vad är skillnaden mellan K10 och K12?" → explain in chat
   - "Borde jag ta lön eller utdelning?" → advise in chat with their specific numbers

B) WALKTHROUGH — FIXED LAYOUT:
   The user wants to SEE or CREATE a specific formal document/report.
   → Use the domain's fixed block list exactly. No deviation.
   Triggered by:
   - Button presses (the button sends a specific prompt)
   - Direct commands: "visa balansräkningen", "skapa utdelningsbeslut", "öppna momsdeklarationen"
   - The verb is "visa", "skapa", "öppna", "generera", "skriv ut"

C) WALKTHROUGH — DYNAMIC LAYOUT:
   The user wants to explore data, see an analysis, or get a visual overview.
   → Freely compose blocks from the library based on the question.
   Triggered by:
   - Exploratory questions: "hur gick Q4?", "visa personalkostnader"
   - Broad analysis: "hur mår företaget?", "vad hände förra veckan?"
   - Operational review: "kontera transaktionerna", "kör lön"

THE KEY RULE: Intent determines layout, not domain.
A user can ask about utdelning in THREE different ways:
- "Hur fungerar utdelning?" → CHAT (mode A)
- "Skapa utdelningsbeslut" → FIXED walkthrough (mode B)
- "Hur mycket kan jag dela ut och vad blir skatten?" → DYNAMIC walkthrough (mode C)
  with calculation + ai-comment + choice blocks

Same domain, three different responses. The AI must read the intent correctly.

WHEN IN DOUBT: Start with chat (mode A). If the answer would benefit from structured
visual blocks (tables, charts, calculations), offer to show a walkthrough. Never force
a walkthrough when the user just wants to talk.

CONVERSATION FLOW — ESCALATION PATTERN:
Many users start with casual questions and work toward a decision:
1. User: "tjena, jag vill ta ut utdelning men vet inte hur mycket"
   → AI responds in CHAT with advice, fetches their data, gives specific recommendation
2. User: "ok visa mig beräkningen"
   → AI shows DYNAMIC walkthrough with calculation + breakdown
3. User: "perfekt, skapa beslutet"
   → AI shows FIXED walkthrough with formal legal decision document

The AI should guide this escalation naturally — never jump to step 3 when the user is at step 1.

---

LAYOUT MODES (for walkthroughs only — mode B and C):

Each domain has a `layout` field: `fixed` or `dynamic`.

- `layout: fixed` — Used when the user triggers mode B (formal document).
  The domain guidance specifies EXACTLY which blocks to use, in what order.
  You MUST follow that block list. Do not add, remove, or reorder blocks.
  You fill in the data, but the structure is predetermined.

- `layout: dynamic` — Used when the user triggers mode C (exploration/analysis),
  OR when a fixed-layout domain is accessed conversationally (mode C override).
  The domain guidance lists "preferred blocks" as hints, but you may deviate.

IMPORTANT: Even domains marked `layout: fixed` can produce DYNAMIC walkthroughs
when the user's intent is exploratory. "Hjälp mig förstå min balansräkning" is NOT
the same as "visa balansräkningen". The first gets a dynamic walkthrough with
ai-comment explaining each section. The second gets the fixed standard format.

If mode B (fixed), skip STEP 1 and STEP 2 below — go straight to the domain's block list.
If mode C (dynamic), proceed with STEP 1 and STEP 2.

HOW TO PICK BLOCKS (mode C — dynamic):

STEP 1 — UNDERSTAND THE QUESTION:
- Is it narrow ("visa personalkostnader") → use 2-4 blocks, tightly focused.
- Is it broad ("hur mår företaget?") → use 5-8 blocks, multiple perspectives.
- Is it an action ("godkänn transaktionerna") → use relevant blocks + decision points.
- Is it exploratory ("vad hände förra veckan?") → use timeline + summary blocks.
- Is it guidance ("hur mycket bör jag ta ut?") → use calculation + ai-comment + choice.

STEP 2 — PICK BLOCKS FOR THE DATA:
- Numbers over time → `chart` (area or bar)
- Distribution / breakdown → `chart` (pie or donut) + `ranked-list`
- KPI snapshot → `stat-cards`
- Per-person data → `person-slips`
- Sequential process → `checklist`
- Legal document → `embedded-document` + `legal-paragraphs`
- Verification / audit → `financial-table` + `numbered-notes`
- Tax form → `form-fields`
- Problems found → `callout` (variant=warning or danger) FIRST, before other content
- User needs to decide → `choice` inline
- AI giving advice → `ai-comment` with recommendation
- Comparing options → `calculation` side-by-side sections

STEP 3 — DETERMINE CREATIVITY LEVEL:
- Mode B (fixed) → use the domain's creativity level as-is
- Mode C (dynamic) → creativity is AT LEAST medium, even for legal/tax domains,
  because the user is asking for guidance, not a formal document
- Legal domain documents (aktiebok, protokoll, utdelningsbeslut) → creativity: 0 in mode B only
- Tax/financial (moms, INK2, resultaträkning) → creativity: low in mode B, medium in mode C
- Operational (transaktioner, kvitton, löner) → creativity: medium
- Personal/analytical (händelser, statistik, förmåner) → creativity: high

STEP 4 — VALIDATE:
- Max 12 blocks total.
- Does every number add up? Check arithmetic.
- Are problems surfaced FIRST (before clean data)?
- Swedish number format: "1 245 000" (space thousands, comma decimals).
- No greeting/letter for creativity 0 or low.
- Does the title accurately describe what the user asked for (not the full page)?

SIZE LIMITS PER BLOCK:
- `stat-cards`: max 6 cards
- `chart`: max 1 chart per walkthrough (keep focused). Height max 300px.
- `ranked-list`: max 10 items
- `timeline`: max 7 days
- `register-table`: max 10 visible rows, truncate beyond
- `person-slips`: max 8 people
- `photo-grid`: max 6 items
- `checklist`: no limit (sequential processes need all steps)
- `callout`: max 3 per walkthrough

PRIORITY ORDERING:
- Errors/failures before warnings before successes
- Urgent deadlines before distant ones
- Items needing user action before informational items
- Current period before historical data

EMPTY STATE: If data fetch returns zero results:
{
  "blocks": [
    { "type": "title", "text": "[relevant title]" },
    { "type": "callout", "variant": "info", "content": "[Why empty + what user can do]" },
    { "type": "actions", "buttons": [{ "label": "Stäng", "variant": "outline", "value": "close" }] }
  ]
}

FETCH FAILURE: If a database query fails:
{
  "blocks": [
    { "type": "title", "text": "[relevant title]" },
    { "type": "callout", "variant": "danger", "content": "Kunde inte hämta data. Försök igen om en stund." },
    { "type": "actions", "buttons": [{ "label": "Försök igen", "variant": "default", "value": "retry" }, { "label": "Stäng", "variant": "outline", "value": "close" }] }
  ]
}
```

### Block Component Library

| Block Type          | Description                                    | Max per walkthrough         | When to use                                         |
| ------------------- | ---------------------------------------------- | --------------------------- | --------------------------------------------------- |
| `title`             | Document title with optional subtitle/date     | 1 (required)                | Always first block                                  |
| `letter`            | AI speaking directly to user, prose paragraph  | 1                           | Greetings, context-setting (creativity medium-high) |
| `ai-comment`        | Muted box with "AI-kommentar" label            | 1                           | Analysis, observations, recommendations             |
| `divider`           | Horizontal rule                                | No limit                    | Between major sections                              |
| `stat-cards`        | Row of KPI cards with value + change indicator | 1 (max 6 cards)             | Financial health, key metrics snapshot              |
| `chart`             | Recharts-rendered area/bar/pie/donut chart     | 1                           | Trends, distributions, comparisons over time        |
| `ranked-list`       | Ordered items with progress bars + percentages | 1 (max 10 items)            | Expense categories, top customers, cost breakdown   |
| `timeline`          | Day-by-day or date-grouped entries             | 1 (max 7 days)              | Activity feeds, transaction history                 |
| `embedded-document` | Bordered document-within-document              | Max 3                       | Invoices, forms, certificates, register cards       |
| `financial-table`   | Multi-column numbers with alignment            | Max 2                       | P&L, verification entries, reconciliation           |
| `status-grid`       | 2-col grid with pass/warning/fail items        | 1 (max 12 items)            | Audit results, validation checks                    |
| `numbered-notes`    | Numbered reviewer annotations                  | 1 (max 8 notes)             | Auditor observations, review comments               |
| `person-slips`      | Per-person bordered cards                      | 1 (max 8 people)            | Pay slips, shareholder profiles, employee entries   |
| `photo-grid`        | Side-by-side image + extraction result         | 1 (max 6 items)             | Receipt scanning                                    |
| `checklist`         | Sequential steps with locked/active/done       | 1 (no item limit)           | Multi-step processes (årsbokslut)                   |
| `progress-sections` | Clickable sections with completion status      | 1 (max 8 sections)          | Multi-document packages (årsredovisning)            |
| `calculation`       | Show-your-work arithmetic                      | Max 4 sections              | Tax calculations, fee breakdowns                    |
| `register-table`    | Dense tabular data                             | Max 2 (max 10 rows each)    | Payroll tables, member lists                        |
| `running-balance`   | Transaction log with running total             | 1 (max 15 entries)          | Intercompany accounts                               |
| `callout`           | Highlighted box for alerts/recommendations     | Max 3                       | Warnings, recommendations, stats                    |
| `choice`            | Inline decision point with buttons             | Max 4 options per           | User input needed mid-document                      |
| `deadlines`         | List of upcoming dates with links              | 1 (max 6 items)             | Upcoming obligations                                |
| `form-fields`       | Government form style with labeled boxes       | Max 4 sections              | Tax forms (moms, INK2)                              |
| `legal-paragraphs`  | Numbered paragraphs (§) with formal language   | 1 (no item limit)           | Meeting minutes, resolutions                        |
| `actions`           | Footer buttons                                 | 1 (max 3 buttons, required) | Always last block                                   |
| `collapsed-group`   | Expand/collapse wrapper for child blocks       | No limit                    | Hide matched transactions, optional details         |
| `inline-choice`     | Inline pill buttons for quick choices          | Max 3                       | Quick selections within any context                 |
| `annotation`        | Small colored note/badge                       | No limit                    | Inline status labels, footnotes, tags               |
| `columns`           | Side-by-side wrapper for 2-3 block groups      | Max 2                       | Comparing two periods, parallel summaries           |
| `metric`            | Single number+label, lighter than stat-cards   | Max 6                       | Individual KPIs, headline numbers                   |

### Data-Fetching Tools

These tools provide raw data to the AI. They do NOT dictate layout — the AI decides how to present the data.

| Tool                         | Returns                                                  | Domain    |
| ---------------------------- | -------------------------------------------------------- | --------- |
| `fetch_transactions`         | Transactions for a period, with classification status    | Bokföring |
| `fetch_invoices`             | Invoice list with status (paid/overdue/draft)            | Bokföring |
| `fetch_receipts`             | Receipt OCR results with match status                    | Bokföring |
| `fetch_assets`               | Asset register with depreciation schedules               | Bokföring |
| `fetch_verifications`        | Journal entries with balance check                       | Bokföring |
| `fetch_month_closing`        | Month-end reconciliation step status                     | Bokföring |
| `fetch_income_statement`     | P&L data with comparison period                          | Rapporter |
| `fetch_balance_sheet`        | Balance sheet audit results                              | Rapporter |
| `fetch_vat_declaration`      | VAT calculation per rate + reconciliation                | Rapporter |
| `fetch_income_tax`           | INK2 data: result, adjustments, tax                      | Rapporter |
| `fetch_employer_declaration` | AGI: per-employee tax + contributions                    | Rapporter |
| `fetch_annual_report_status` | Section completion status                                | Rapporter |
| `fetch_year_end_closing`     | Step-by-step closing progress                            | Rapporter |
| `fetch_k10`                  | Gränsbelopp calculation per shareholder                  | Rapporter |
| `fetch_payroll`              | Per-employee pay breakdown                               | Löner     |
| `fetch_benefits`             | Benefit types with usage + tax rules                     | Löner     |
| `fetch_team_overview`        | Employee register + leave + KPIs                         | Löner     |
| `fetch_owner_contributions`  | Egenavgifter breakdown per component                     | Löner     |
| `fetch_owner_withdrawals`    | Intercompany account transactions                        | Löner     |
| `fetch_share_register`       | Aktiebok: shares, owners, history                        | Ägare     |
| `fetch_shareholders`         | Ownership overview + K10 status                          | Ägare     |
| `fetch_dividend`             | Dividend calculation + prudence rule                     | Ägare     |
| `fetch_member_registry`      | Member list + summary                                    | Ägare     |
| `fetch_meeting_data`         | Meeting minutes / protocol data                          | Ägare     |
| `fetch_meeting_invitation`   | Årsmöte invitation data                                  | Ägare     |
| `fetch_signatories`          | Board + signatory registration                           | Ägare     |
| `fetch_events`               | Activity events for a period                             | Händelser |
| `fetch_financial_kpis`       | Soliditet, kassalikviditet, skuldsättning, vinstmarginal | Statistik |
| `fetch_revenue_expenses`     | Monthly revenue + expense trend data                     | Statistik |
| `fetch_transaction_status`   | Transaction/invoice status distribution                  | Statistik |
| `fetch_expense_breakdown`    | Expense categories with amounts + percentages            | Statistik |

### Domain Guidance

These are **hints** for the AI, not fixed layouts. The AI should prefer these patterns but can deviate when the user's question calls for something different.

**When the AI uses a data tool, it should consider the domain guidance to inform block selection — but always adapt to the specific question.**

---

#### Bokforing: Transaktioner

**Trigger keywords:** "kontera", "bokför transaktioner", "klassificera", "okonterade", "banktransaktioner", "matcha"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_transactions`

**When to trigger walkthrough (vs chat):**

- User asks to classify, categorize, or book multiple transactions
- AI finished auto-classifying and needs approval
- User uploads bank file (CSV/OFX) or bank sync imports new data
- DON'T trigger: question about ONE specific transaction, general "hur bokför man X?" knowledge questions

**Preferred blocks:** `timeline` (grouped by day, uncertain items first), `callout` (for zero-confidence items), `choice` (inline account selection)

**Domain-specific rules:**

- Collapse already-matched transactions (show count, not details)
- Zero-confidence items go FIRST, then low-confidence, then matched
- Group by date; skip day labels if all same day
- Each transaction: date, description, amount, suggested account, confidence indicator
- Swedish number format: "1 245,00 kr"

**Example composition** (AI may deviate based on question):

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Konteringsförslag",
      "subtitle": "Januari 2026 · 12 transaktioner"
    },
    {
      "type": "callout",
      "variant": "warning",
      "content": "3 transaktioner kunde inte matchas automatiskt."
    },
    {
      "type": "timeline",
      "days": [
        {
          "date": "2026-01-15",
          "label": "Onsdag 15 jan",
          "items": [
            {
              "text": "Spotify AB — 169,00 kr",
              "detail": "→ 6993 Övriga externa tjänster",
              "status": "warning",
              "choice": {
                "question": "Konto?",
                "options": [
                  { "label": "6993", "value": "6993" },
                  { "label": "Annat", "value": "other" }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "type": "ai-comment",
      "text": "9 av 12 transaktioner matchades automatiskt med >95% säkerhet."
    },
    {
      "type": "actions",
      "buttons": [
        {
          "label": "Godkänn alla",
          "variant": "default",
          "value": "approve_all"
        },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Bokforing: Fakturor

**Trigger keywords:** "faktura", "skicka faktura", "förfallna", "obetald", "fakturastatus", "kreditnota"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_invoices`

**When to trigger walkthrough (vs chat):**

- User asks to create/send a batch of invoices or review invoice status
- AI detects overdue invoices and wants to alert user
- User asks "vilka fakturor är obetalda?"
- DON'T trigger: user asks about ONE specific invoice, wants to edit an existing invoice

**Preferred blocks:** `embedded-document` (invoice preview), `status-grid` (overdue/paid/draft overview), `callout` (overdue alerts first)

**Domain-specific rules:**

- Overdue invoices surfaced FIRST with red callout
- Invoice preview uses `embedded-document` with double-rule border
- Legal requirement: fakturanummer, org.nr, moms specified separately
- Amounts: "12 500,00 kr exkl. moms" / "15 625,00 kr inkl. moms"

**Example composition:**

```json
{
  "blocks": [
    { "type": "title", "text": "Fakturastatus", "subtitle": "Januari 2026" },
    {
      "type": "callout",
      "variant": "danger",
      "content": "2 fakturor förfallna (totalt 45 000 kr)"
    },
    {
      "type": "status-grid",
      "items": [
        {
          "heading": "Faktura #1042 — Acme AB",
          "status": "fail",
          "description": "45 000 kr · Förföll 2026-01-10"
        },
        {
          "heading": "Faktura #1048 — Beta AB",
          "status": "pass",
          "description": "12 500 kr · Betald 2026-01-20"
        }
      ]
    },
    {
      "type": "actions",
      "buttons": [
        {
          "label": "Skicka påminnelse",
          "variant": "default",
          "value": "send_reminder"
        },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Bokforing: Kvitton

**Trigger keywords:** "kvitto", "kvitton", "skanna", "ladda upp kvitto", "matchning", "utlägg"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_receipts`

**When to trigger walkthrough (vs chat):**

- User uploads one or more receipts for OCR scanning
- AI finished scanning and presents extraction results for approval
- User asks "vilka kvitton saknar matchning?"
- DON'T trigger: user asks general question about receipt rules

**Preferred blocks:** `photo-grid` (receipt thumbnails + extracted data), `callout` (low-confidence extractions)

**Domain-specific rules:**

- Each receipt: thumbnail, vendor, amount, date, suggested account, confidence
- Low-confidence extractions get inline `choice` for account selection
- Group receipts: needs-review first, then matched
- Show original OCR text vs extracted values when confidence < 80%

**Example composition:**

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Kvittoskanning",
      "subtitle": "4 kvitton uppladdade"
    },
    {
      "type": "photo-grid",
      "items": [
        {
          "thumbnail": "/receipts/r1.jpg",
          "title": "Clas Ohlson",
          "details": "349,00 kr · 2026-01-22",
          "status": "pass"
        },
        {
          "thumbnail": "/receipts/r2.jpg",
          "title": "Oklart",
          "details": "1 200,00 kr · Datum saknas",
          "status": "warning",
          "choice": {
            "question": "Butik?",
            "options": [
              { "label": "IKEA", "value": "ikea" },
              { "label": "Annat", "value": "other" }
            ]
          }
        }
      ]
    },
    {
      "type": "actions",
      "buttons": [
        { "label": "Godkänn alla", "variant": "default", "value": "approve" },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Bokforing: Inventarier

**Trigger keywords:** "inventarier", "tillgångar", "anläggningstillgångar", "avskrivning", "avskrivningsplan"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_assets`

**When to trigger walkthrough (vs chat):**

- User asks to see the asset register or depreciation schedule
- User registers a new asset
- DON'T trigger: general question about depreciation rules

**Fixed blocks (in order):** `register-table` (asset list), `calculation` (depreciation schedule), `callout` (fully depreciated alerts)

**Domain-specific rules:**

- Assets sorted by category, then acquisition date
- Show: name, acquisition date, acquisition value, book value, annual depreciation, method
- Fully depreciated assets flagged with callout
- Depreciation methods: linear (most common) or declining balance

**Example composition:**

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Anläggningstillgångar",
      "subtitle": "Mitt Företag AB · Bokfört värde 245 000 kr"
    },
    {
      "type": "register-table",
      "columns": [
        "Tillgång",
        "Anskaffat",
        "Anskaff.värde",
        "Bokfört värde",
        "Avskr/år"
      ],
      "rows": [
        ["MacBook Pro", "2024-03-15", "24 990 kr", "16 660 kr", "8 330 kr"]
      ]
    },
    {
      "type": "calculation",
      "sections": [
        {
          "heading": "Avskrivning 2026",
          "rows": [
            { "label": "Ingående värde", "value": "245 000 kr" },
            { "label": "Årets avskrivning", "value": "−48 200 kr" },
            {
              "label": "Utgående värde",
              "value": "196 800 kr",
              "highlight": true
            }
          ]
        }
      ]
    },
    {
      "type": "actions",
      "buttons": [{ "label": "Stäng", "variant": "outline", "value": "close" }]
    }
  ]
}
```

---

#### Bokforing: Verifikationer

**Trigger keywords:** "verifikation", "verifikat", "bokföringsorder", "manuell bokning", "journal"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_verifications`

**When to trigger walkthrough (vs chat):**

- User creates or reviews a verification/journal entry
- AI presents a booking proposal for approval
- Audit check on verification series
- DON'T trigger: user asks "vad är en verifikation?" knowledge question

**Fixed blocks (in order):** `financial-table` (debit/credit entries), `numbered-notes` (audit observations), `status-grid` (balance check)

**Domain-specific rules:**

- Debit and credit MUST balance — show balance check prominently
- Verification number, date, description required
- Each row: account number, account name, debit, credit
- Sum row always shown, always bold
- If imbalanced: red callout FIRST

**Example composition:**

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Verifikation #V2026-0042",
      "subtitle": "2026-01-15 · Hyra januari"
    },
    {
      "type": "financial-table",
      "columns": ["Konto", "Namn", "Debet", "Kredit"],
      "rows": [
        { "label": "5010", "values": ["Lokalhyra", "15 000,00", "—"] },
        { "label": "1930", "values": ["Företagskonto", "—", "15 000,00"] },
        {
          "label": "Summa",
          "values": ["", "15 000,00", "15 000,00"],
          "bold": true
        }
      ]
    },
    {
      "type": "status-grid",
      "items": [
        {
          "heading": "Balanscheck",
          "status": "pass",
          "description": "Debet = Kredit ✓"
        }
      ]
    },
    {
      "type": "actions",
      "buttons": [
        { "label": "Bokför", "variant": "default", "value": "book" },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Bokforing: Manadsavslut

**Trigger keywords:** "månadsavslut", "stänga månaden", "periodavslut", "avstämning"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_month_closing`

**When to trigger walkthrough (vs chat):**

- User asks to close a month or review month-end status
- User asks "vad återstår för att stänga januari?"
- DON'T trigger: general question about what month-end closing means

**Fixed blocks (in order):** `title`, `checklist` (reconciliation steps), `callout` (blockers if any), `actions`

**Domain-specific rules:**

- Sequential steps: Bankavstämning → Kundfordringar → Leverantörsskulder → Periodiseringar → Momsavstämning → Lås period
- Each step: done / active / locked (dependencies)
- Cannot lock period until all steps done
- Show discrepancies per step (e.g., bank balance diff)
- Final lock is irreversible — require confirmation

**Example composition:**

```json
{
  "blocks": [
    { "type": "title", "text": "Månadsavslut", "subtitle": "Januari 2026" },
    {
      "type": "checklist",
      "steps": [
        {
          "label": "Bankavstämning",
          "status": "done",
          "description": "Saldo stämt: 245 320,00 kr",
          "result": "✓ Ingen differens"
        },
        {
          "label": "Kundfordringar",
          "status": "done",
          "description": "12 fakturor, alla matchade"
        },
        {
          "label": "Leverantörsskulder",
          "status": "active",
          "description": "3 fakturor saknar verifikation"
        },
        {
          "label": "Periodiseringar",
          "status": "locked",
          "description": "Förutbetalda kostnader, upplupna intäkter",
          "blockedBy": "Leverantörsskulder"
        },
        {
          "label": "Momsavstämning",
          "status": "locked",
          "description": "Avstäm bokförd moms mot momsrapport",
          "blockedBy": "Periodiseringar"
        },
        {
          "label": "Lås period",
          "status": "locked",
          "description": "Låser januari 2026 permanent",
          "blockedBy": "Momsavstämning"
        }
      ]
    },
    {
      "type": "callout",
      "variant": "warning",
      "content": "3 leverantörsfakturor saknar verifikation. Åtgärda innan du kan fortsätta."
    },
    {
      "type": "actions",
      "buttons": [
        { "label": "Åtgärda", "variant": "default", "value": "fix_issues" },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Rapporter: Resultatrakning

**Trigger keywords:** "resultaträkning", "resultat", "P&L", "vinst", "förlust", "intäkter och kostnader"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_income_statement`

**When to trigger walkthrough (vs chat):**

- User asks to see the income statement / P&L
- User asks "hur gick det förra kvartalet/månaden?"
- DON'T trigger: user asks about a specific account balance

**Fixed blocks (in order):** `financial-table` (the P&L itself), `stat-cards` (key metrics), `chart` (trend), `numbered-notes` (auditor observations)

**Domain-specific rules:**

- Standard Swedish format: Rörelseintäkter → Rörelsekostnader → Rörelseresultat → Finansiella poster → Resultat efter finansiella poster → Skatt → Årets resultat
- Comparison column (previous period) always shown
- Negative numbers: "−15 000" (not parentheses)
- Result rows in bold
- If loss: red callout first

**Example composition:**

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Resultaträkning",
      "subtitle": "Jan–Dec 2025 · Mitt Företag AB"
    },
    {
      "type": "stat-cards",
      "cards": [
        {
          "label": "Omsättning",
          "value": "2 450 000 kr",
          "change": "+12%",
          "changeDirection": "up"
        },
        {
          "label": "Rörelseresultat",
          "value": "385 000 kr",
          "change": "+8%",
          "changeDirection": "up"
        },
        { "label": "Årets resultat", "value": "298 000 kr" }
      ]
    },
    {
      "type": "financial-table",
      "columns": ["", "2025", "2024"],
      "rows": [
        { "label": "Nettoomsättning", "values": ["2 450 000", "2 185 000"] },
        { "label": "Rörelsekostnader", "values": ["−2 065 000", "−1 830 000"] },
        {
          "label": "Rörelseresultat",
          "values": ["385 000", "355 000"],
          "bold": true
        },
        {
          "label": "Årets resultat",
          "values": ["298 000", "271 000"],
          "bold": true
        }
      ]
    },
    {
      "type": "actions",
      "buttons": [
        {
          "label": "Exportera PDF",
          "variant": "default",
          "value": "export_pdf"
        },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Rapporter: Balansrakning

**Trigger keywords:** "balansräkning", "balans", "tillgångar och skulder", "eget kapital"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_balance_sheet`

**When to trigger walkthrough (vs chat):**

- User asks to see the balance sheet
- Audit review of the balance sheet
- DON'T trigger: question about a specific balance sheet line

**Fixed blocks (in order):** `financial-table` (balance sheet), `status-grid` (audit checks), `numbered-notes` (observations)

**Domain-specific rules:**

- Swedish format: Tillgångar (Anläggningstillgångar + Omsättningstillgångar) = Eget kapital + Skulder
- Balance MUST balance — if not, red callout first
- Comparison column always shown

---

#### Rapporter: Momsdeklaration

**Trigger keywords:** "moms", "momsdeklaration", "mervärdesskatt", "momsrapport", "moms att betala"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_vat_declaration`

**When to trigger walkthrough (vs chat):**

- User asks to review or submit VAT declaration
- VAT period deadline approaching
- DON'T trigger: general question about VAT rates

**Fixed blocks (in order):** `form-fields` (SKV 4700 format), `calculation` (VAT per rate), `callout` (discrepancies), `deadlines` (filing deadline)

**Domain-specific rules:**

- SKV 4700 form field codes (05–49) must be correct
- Show calculation: utgående moms − ingående moms = moms att betala/återfå
- Reconciliation: compare declared vs booked amounts
- If discrepancy > 100 kr: warning callout
- Filing deadline shown prominently

**Example composition:**

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Momsdeklaration",
      "subtitle": "Period: Oktober–December 2025"
    },
    {
      "type": "deadlines",
      "items": [
        { "date": "2026-02-12", "label": "Sista inlämningsdag", "daysLeft": 12 }
      ]
    },
    {
      "type": "form-fields",
      "sections": [
        {
          "heading": "Momspliktig försäljning",
          "fields": [
            {
              "code": "05",
              "label": "Momspliktig försäljning exkl. moms",
              "value": "500 000 kr"
            },
            {
              "code": "10",
              "label": "Utgående moms 25%",
              "value": "125 000 kr"
            }
          ]
        },
        {
          "heading": "Moms att betala",
          "fields": [
            {
              "code": "49",
              "label": "Moms att betala",
              "value": "64 185 kr",
              "highlighted": true
            }
          ]
        }
      ]
    },
    {
      "type": "actions",
      "buttons": [
        { "label": "Skicka in", "variant": "default", "value": "submit" },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

---

#### Rapporter: Inkomstdeklaration

**Trigger keywords:** "inkomstdeklaration", "INK2", "deklaration", "bolagsskatt", "inkomstskatt"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_income_tax`

**When to trigger walkthrough (vs chat):**

- User asks to review or prepare the income tax return
- Tax filing deadline approaching
- DON'T trigger: general tax knowledge questions

**Fixed blocks (in order):** `form-fields` (INK2 format), `calculation` (tax computation), `callout` (issues), `deadlines`

**Domain-specific rules:**

- INK2 field codes must be accurate
- Show: bokfört resultat → skattemässiga justeringar → beskattningsbart resultat → skatt
- Corporate tax rate: 20.6%
- Non-deductible expenses clearly listed
- Filing deadline: July 1 (AB) or May 2 (EF)

---

#### Rapporter: AGI

**Trigger keywords:** "AGI", "arbetsgivardeklaration", "arbetsgivaravgifter", "individuppgifter"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_employer_declaration`

**When to trigger walkthrough (vs chat):**

- User asks to review or submit AGI for a month
- Payroll has been run and AGI needs filing
- DON'T trigger: general question about employer contributions

**Fixed blocks (in order):** `register-table` (per-employee breakdown), `calculation` (totals), `deadlines` (filing date)

**Domain-specific rules:**

- Per employee: bruttolön, skatteavdrag, arbetsgivaravgifter
- Sum row with totals
- Filing deadline: 12th of following month
- If corrections needed vs previous submission: callout

---

#### Rapporter: Arsredovisning

**Trigger keywords:** "årsredovisning", "annual report", "K2", "K3"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_annual_report_status`

**When to trigger walkthrough (vs chat):**

- User asks about annual report preparation status
- Filing deadline approaching
- DON'T trigger: general question about K2 vs K3

**Fixed blocks (in order):** `progress-sections` (section completion status), `deadlines` (filing deadline), `callout` (missing sections)

**Domain-specific rules:**

- Sections: Förvaltningsberättelse, Resultaträkning, Balansräkning, Noter, Underskrifter
- Each section: done / warning (needs review) / pending
- Must be filed within 7 months of fiscal year end
- Must be approved at annual general meeting first

---

#### Rapporter: Arsbokslut

**Trigger keywords:** "årsbokslut", "bokslut", "stänga böckerna", "bokslutsprocess"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_year_end_closing`

**When to trigger walkthrough (vs chat):**

- User asks to start or review year-end closing
- User asks "vad återstår i bokslutet?"
- DON'T trigger: general question about year-end process

**Fixed blocks (in order):** `checklist` (sequential steps with locked/active/done), `callout` (blockers)

**Domain-specific rules:**

- Steps in order: Avstämningar → Periodiseringar → Avskrivningar → Skatt → Resultatdisposition → Låsning
- Each step: status + what's needed + who's responsible
- Steps with dependencies: later steps locked until prerequisites done
- Final step (lock period) is irreversible — require explicit confirmation

---

#### Rapporter: K10

**Trigger keywords:** "K10", "gränsbelopp", "3:12", "kvalificerade andelar", "utdelningsutrymme"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_k10`

**When to trigger walkthrough (vs chat):**

- User asks about K10 / gränsbelopp calculation
- Shareholder asks "hur mycket kan jag ta ut i utdelning?"
- DON'T trigger: general question about 3:12 rules

**Fixed blocks (in order):** `calculation` (gränsbelopp step-by-step), `person-slips` (per-shareholder), `callout` (if lönebaserat utrymme applies)

**Domain-specific rules:**

- Show calculation: omkostnadsbelopp × schablonränta = schablonbelopp
- Lönebaserat utrymme if applicable (>4% ownership + löneuttagskrav met)
- Per-shareholder result if multiple owners
- IBB (inkomstbasbelopp) for current year must be correct
- Sparat utdelningsutrymme carried forward

---

#### Loner: Lonekorning

**Trigger keywords:** "lönekörning", "kör lön", "lön", "lönespec", "lönebesked"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_payroll`

**When to trigger walkthrough (vs chat):**

- User asks to run payroll or review payroll results
- Monthly payroll due
- DON'T trigger: question about one employee's salary

**Preferred blocks:** `person-slips` (per-employee pay breakdown), `calculation` (employer cost totals), `callout` (issues)

**Domain-specific rules:**

- Per employee: bruttolön, skatteavdrag, nettolön, arbetsgivaravgift
- Benefits (förmåner) shown separately with taxable value
- Sum row: total employer cost
- If first payroll run: info callout about what happens next (AGI, payment)

---

#### Loner: Formaner

**Trigger keywords:** "förmåner", "personalförmåner", "friskvård", "tjänstebil", "förmånsvärde"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_benefits`

**When to trigger walkthrough (vs chat):**

- User asks about available benefits or benefit costs
- User wants to add/remove a benefit
- DON'T trigger: general question about benefit taxation rules

**Preferred blocks:** `register-table` (benefit overview), `calculation` (tax impact), `callout` (tax-free limits)

**Domain-specific rules:**

- Each benefit: type, value, taxable amount, tax-free threshold
- Friskvårdsbidrag: max 5 000 kr tax-free (2026)
- Tjänstebil: show förmånsvärde calculation
- Benefits affecting AGI must be flagged

---

#### Loner: Team & Rapportering

**Trigger keywords:** "personal", "anställda", "team", "sjukfrånvaro", "semester", "personalliggare"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_team_overview`

**When to trigger walkthrough (vs chat):**

- User asks for team overview, headcount, or absence stats
- User asks "vilka är anställda?" or "hur ser frånvaron ut?"
- DON'T trigger: question about one specific employee

**Preferred blocks:** `register-table` (employee list), `stat-cards` (headcount, absence rate), `chart` (absence trend)

**Domain-specific rules:**

- Personal data: only show what's necessary (name, role, start date, status)
- Personnummer masked: YYMMDD-XXXX
- Absence shown as percentage, not raw days
- Active/on leave/terminated status clearly indicated

---

#### Loner: Egenavgifter

**Trigger keywords:** "egenavgifter", "enskild firma avgifter", "egenföretagare avgifter"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_owner_contributions`

**When to trigger walkthrough (vs chat):**

- User (EF/HB owner) asks about egenavgifter breakdown
- Tax planning for self-employed
- DON'T trigger: AB owners (they pay arbetsgivaravgifter instead)

**Fixed blocks (in order):** `calculation` (component breakdown), `callout` (if company type mismatch)

**Domain-specific rules:**

- Only applies to EF/HB — if AB, show callout explaining arbetsgivaravgifter instead
- Components: sjukförsäkringsavgift, föräldraförsäkringsavgift, ålderspensionsavgift, etc.
- Total rate ~28.97% (2026) — verify current year
- Show: nettointäkt × rate = avgift

---

#### Loner: Delagaruttag

**Trigger keywords:** "delägaruttag", "egna uttag", "avräkningskonto", "privata uttag"
**Creativity:** low
**Layout:** fixed
**Data tools:** `fetch_owner_withdrawals`

**When to trigger walkthrough (vs chat):**

- User asks about owner withdrawal balance or history
- User wants to register a new withdrawal
- DON'T trigger: general question about owner transactions

**Fixed blocks (in order):** `running-balance` (transaction log), `callout` (if overdrawn), `stat-cards` (current balance)

**Domain-specific rules:**

- Running balance: each transaction with date, description, amount, running total
- Negative balance (owner owes company): red callout
- Distinguish between: lön, utdelning, lån, privata uttag
- If loan > 0.5 IBB: callout about beneficial loan rules

---

#### Agare: Aktiebok

**Trigger keywords:** "aktiebok", "aktier", "aktieägare", "aktiekapital", "aktiebrev"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_share_register`

**When to trigger walkthrough (vs chat):**

- User asks to see the share register
- User registers a share transfer
- DON'T trigger: general question about shares

**Fixed blocks (in order):** `embedded-document` (formal register), `register-table` (share distribution), `callout` (irregularities)

**Domain-specific rules:**

- Legal document — exact format required by ABL 5 kap
- Required fields: aktienummer (serie), ägare, antal, andel (%)
- Total shares must match bolagsordningen
- No AI personality — this is a legal register

---

#### Agare: Delagare

**Trigger keywords:** "delägare", "ägare", "ägarfördelning", "ägaröversikt"
**Creativity:** low
**Layout:** dynamic
**Data tools:** `fetch_shareholders`

**When to trigger walkthrough (vs chat):**

- User asks for ownership overview
- User asks about a specific owner's situation (K10, utdelning)
- DON'T trigger: question about share transfer process

**Preferred blocks:** `person-slips` (per-owner profile), `stat-cards` (total shares, capital), `chart` (ownership pie)

**Domain-specific rules:**

- Per owner: name, personnummer (masked), shares, ownership %, K10 status
- Show total aktiekapital and kvotvärde
- If qualified shares (3:12): flag with K10 link
- Ownership changes in last 12 months: timeline
- Adapts to question: "visa ägarfördelning" → pie chart + stats; "vad är Annas K10?" → focused person-slip + calculation

---

#### Agare: Utdelning

**Trigger keywords:** "utdelning", "utdelningsbeslut", "vinstutdelning", "aktieutdelning"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_dividend`

**When to trigger walkthrough (vs chat):**

- User asks to create dividend decision or review dividend capacity
- User asks "hur mycket kan vi dela ut?"
- DON'T trigger: general question about dividend taxation

**Fixed blocks (in order):** `calculation` (max dividend + prudence rule), `embedded-document` (formal decision), `legal-paragraphs` (resolution text), `callout` (if exceeds limit)

**Domain-specific rules:**

- Legal format: ABL 18 kap requirements
- Prudence rule (försiktighetsregeln): fritt eget kapital - restricted reserves
- Beloppsspärr: eget kapital ≥ aktiekapital after dividend
- Show per-shareholder amount based on ownership %
- If proposed > max: danger callout, prevent approval
- K10 gränsbelopp reference for tax optimization

---

#### Agare: Medlemsregister

**Trigger keywords:** "medlemsregister", "medlemmar", "medlemslista", "förening"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_member_registry`

**When to trigger walkthrough (vs chat):**

- User asks to see or manage member list (BRF/Förening)
- User registers new member
- DON'T trigger: AB/EF companies (they have aktiebok instead)

**Fixed blocks (in order):** `register-table` (member list), `stat-cards` (member count, fees collected)

**Domain-specific rules:**

- Only for BRF/Förening — if AB, redirect to aktiebok
- Fields: name, member number, join date, status (active/passive/resigned)
- Personnummer masked
- Annual fee status shown

---

#### Agare: Bolagsstamma

**Trigger keywords:** "bolagsstämma", "årsstämma", "stämma", "stämmoprotokoll", "kallelse"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_meeting_data`

**When to trigger walkthrough (vs chat):**

- User asks to create meeting minutes or agenda
- User asks about upcoming/past general meetings
- DON'T trigger: board meetings (different process), general question about meeting rules

**Fixed blocks (in order):** `legal-paragraphs` (protocol sections), `embedded-document` (formal minutes), `checklist` (meeting preparation), `deadlines` (statutory deadlines)

**Domain-specific rules:**

- ABL requirements for protocol: §1 Öppnande, §2 Val av ordförande, §3 Dagordning, etc.
- Kallelse deadlines: earliest 6 weeks, latest 4 weeks (AB) / per stadgar (BRF)
- Mandatory agenda items for årsstämma: fastställa BR/RR, resultatdisposition, ansvarsfrihet
- All text in formal Swedish — no casual language

---

#### Agare: Arsmote

**Trigger keywords:** "årsmöte", "föreningsmöte", "kallelse årsmöte", "dagordning"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_meeting_invitation`

**When to trigger walkthrough (vs chat):**

- User asks to create annual meeting invitation/agenda (BRF/Förening)
- Meeting preparation
- DON'T trigger: AB companies (they have bolagsstämma), general questions

**Fixed blocks (in order):** `legal-paragraphs` (agenda), `embedded-document` (invitation), `deadlines` (notice deadlines)

**Domain-specific rules:**

- Per stadgar, not ABL
- Standard agenda: mötets öppnande, val av ordförande, dagordning, verksamhetsberättelse, revisionsberättelse, ansvarsfrihet, val av styrelse, motioner, avslutning
- Kallelse deadline per stadgar (typically 2-4 weeks)
- All formal Swedish

---

#### Agare: Firmatecknare

**Trigger keywords:** "firmatecknare", "firmateckning", "styrelse", "behörig företrädare", "registreringsbevis"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_signatories`

**When to trigger walkthrough (vs chat):**

- User asks who can sign for the company
- User needs to update signatory registration
- DON'T trigger: general question about board responsibilities

**Fixed blocks (in order):** `embedded-document` (registration certificate style), `register-table` (board members), `callout` (vacant positions)

**Domain-specific rules:**

- Legal register format — like Bolagsverket registreringsbevis
- Show: board members, suppleants, authorized signatories
- Firmateckningsregel: "Styrelsen tecknar firman" or specific persons
- Personnummer masked
- Vacant positions explicitly shown, never omitted

---

#### Handelser: Sammanfattning (variant A)

**Trigger keywords:** "vad hände", "sammanfatta", "aktivitet", "förra veckan", "senaste dagarna"
**Creativity:** medium
**Layout:** dynamic
**Data tools:** `fetch_events`

**When to trigger walkthrough (vs chat):**

- User asks for a summary of recent activity
- DON'T trigger: user asks for a specific report

**Preferred blocks:** `letter` (warm greeting), `timeline` (day-by-day), `callout` (financial pulse), `deadlines` (upcoming)

**Domain-specific rules:**

- Greet user by name — this is the most personal walkthrough
- Day-by-day timeline, empty days shown as "— tyst dag —"
- Financial pulse: revenue, costs, tax, net for period
- Max 7 days; longer periods get weekly highlights

---

#### Handelser: Plan (variant B)

**Trigger keywords:** "hjälp mig", "hur gör jag", "skapa en plan", "steg för steg", "guide"
**Creativity:** high
**Layout:** dynamic
**Data tools:** `fetch_events` (for context), plus domain-specific tools as needed

**When to trigger walkthrough (vs chat):**

- User asks for a step-by-step plan for a business goal
- DON'T trigger: user asks for a specific report

**Preferred blocks:** `letter` (brief context), `checklist` (narrative steps with WHY), `callout` (timeline estimate)

**Domain-specific rules:**

- Each step must explain WHAT + WHY, not bare checklist items
- Adapt to company type (AB vs EF vs BRF)
- Mark steps Scope can automate
- Max 8 steps; complex goals split into phases
- Legal requirements must be accurate

---

#### Handelser: Paminnelse (variant C)

**Trigger keywords:** "påminn mig", "deadline", "kom ihåg", "förfaller"
**Creativity:** 0
**Layout:** fixed
**Data tools:** `fetch_events`

**When to trigger walkthrough (vs chat):**

- User asks to set a reminder or check deadlines
- DON'T trigger: user asks for a summary

**Fixed blocks (in order):** `callout` (reminder details), `choice` (timing + channel selection)

**Domain-specific rules:**

- Minimal form: subject, date, amount (if applicable), days remaining
- Reminder timing options: 1 week, 3 days, same day, custom
- Channel: in-app or email
- No narrative, no journal — just the form

---

#### Statistik: Foretagsstatistik

**Trigger keywords:** "statistik", "KPI", "nyckeltal", "hur mår företaget", "ekonomisk översikt", "kostnader", "trender"
**Creativity:** high
**Layout:** dynamic
**Data tools:** `fetch_financial_kpis`, `fetch_revenue_expenses`, `fetch_transaction_status`, `fetch_expense_breakdown`

**When to trigger walkthrough (vs chat):**

- User asks broad questions about company health/performance
- User asks to see specific KPIs or expense analysis
- User asks "hur gick det?" without specifying a report
- DON'T trigger: user asks for a specific formal report (resultaträkning, balansräkning)

**Preferred blocks:** `stat-cards` (KPIs), `chart` (trends/distributions), `ranked-list` (expense categories), `ai-comment` (analysis)

**Domain-specific rules:**

- This is the most analytical/exploratory domain — AI has most freedom
- Narrow question ("visa personalkostnader") → focused: just relevant chart + ranked-list
- Broad question ("hur mår företaget?") → comprehensive: KPIs + trend + breakdown + analysis
- KPIs: soliditet, kassalikviditet, skuldsättningsgrad, vinstmarginal
- Charts use same Recharts library as the Företagsstatistik page
- Percentage changes: compare to previous period, show direction arrows

**Example composition** (broad question):

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Ekonomisk översikt",
      "subtitle": "Q4 2025 · Mitt Företag AB"
    },
    {
      "type": "stat-cards",
      "cards": [
        {
          "label": "Omsättning",
          "value": "2,4 Mkr",
          "change": "+12%",
          "changeDirection": "up"
        },
        {
          "label": "Vinstmarginal",
          "value": "15,3%",
          "change": "+2,1pp",
          "changeDirection": "up"
        },
        {
          "label": "Kassalikviditet",
          "value": "1,8x",
          "change": "−0,2",
          "changeDirection": "down"
        },
        {
          "label": "Soliditet",
          "value": "42%",
          "change": "+3pp",
          "changeDirection": "up"
        }
      ]
    },
    {
      "type": "chart",
      "variant": "area",
      "title": "Intäkter & kostnader (12 mån)",
      "data": [{ "month": "Jan", "revenue": 195000, "expenses": 165000 }],
      "series": [
        { "key": "revenue", "label": "Intäkter", "color": "#22c55e" },
        { "key": "expenses", "label": "Kostnader", "color": "#ef4444" }
      ],
      "xAxis": "month"
    },
    {
      "type": "ranked-list",
      "heading": "Största kostnadsposter",
      "items": [
        { "label": "Personal", "value": "890 000 kr", "percentage": 43 },
        { "label": "Lokalkostnader", "value": "360 000 kr", "percentage": 17 },
        { "label": "Övriga externa", "value": "245 000 kr", "percentage": 12 }
      ]
    },
    {
      "type": "ai-comment",
      "text": "Omsättningen växer stadigt men kassalikviditeten har sjunkit 2 kvartal i rad. Värt att bevaka — kan bero på längre betaltider från kunder."
    },
    {
      "type": "actions",
      "buttons": [
        {
          "label": "Visa detaljer",
          "variant": "default",
          "value": "drill_down"
        },
        { "label": "Stäng", "variant": "outline", "value": "close" }
      ]
    }
  ]
}
```

**Example composition** (narrow question — "visa personalkostnader"):

```json
{
  "blocks": [
    {
      "type": "title",
      "text": "Personalkostnader",
      "subtitle": "2025 · Mitt Företag AB"
    },
    {
      "type": "chart",
      "variant": "pie",
      "title": "Fördelning",
      "data": [
        { "category": "Löner", "value": 650000 },
        { "category": "Arbetsgivaravgifter", "value": 204000 },
        { "category": "Pensioner", "value": 36000 }
      ],
      "series": [{ "key": "value", "label": "Belopp" }]
    },
    {
      "type": "ranked-list",
      "heading": "Personalkostnader per typ",
      "items": [
        { "label": "Löner", "value": "650 000 kr", "percentage": 73 },
        {
          "label": "Arbetsgivaravgifter",
          "value": "204 000 kr",
          "percentage": 23
        },
        { "label": "Pensioner", "value": "36 000 kr", "percentage": 4 }
      ]
    },
    {
      "type": "actions",
      "buttons": [{ "label": "Stäng", "variant": "outline", "value": "close" }]
    }
  ]
}
```

## Bokföring

### 1. Transaktioner — "Kontoutdrag med anteckningar"

Bank statement your accountant marked up. Vertical timeline, collapsed OK items, only surfaces what needs attention.

```
Konteringsförslag                           x
Januari 2026 · 12 nya transaktioner

---

  15 jan  | Swish 4 500 kr
          3010 Forsaljning
          Matchad mot faktura #1042

  16 jan  | Klarna 12 300 kr
          3010 Forsaljning · 3 ordrar
          ---
          Order #221   4 100 kr
          Order #222   3 900 kr
          Order #223   4 300 kr

  18 jan  | Spotify 149 kr           <- granska
          Osaker kategori
          [ Reklam ]  [ Programvara ]

  21 jan  | Okand insattning 25 000 kr
          +---------------------------+
          | Beskrivning saknas.       |
          | Ange konto och notera     |
          | underlag.                 |
          |          [ Valj konto ]   |
          +---------------------------+

          ...  8 transaktioner dolda (alla OK)

---

  Summering
  ---------
  Konterade direkt     9
  Behover granskning   2
  Saknar underlag      1

[ Godkann konterade ]                [ Stang ]
```

### 2. Fakturor — "Brev med bifogat dokument"

Cover letter stapled to an invoice. The AI writes a short note, then the actual invoice sits below as an embedded document.

```
                                            x

  Hej,

  Faktura #1048 till Acme AB ar klar.
  Jag har kontrollerat momsen och
  betalningsvillkoren -- allt stammer
  forutom att OCR-nummer saknas.

  Du kan lagga till det nedan innan
  du skickar.

  / AI-assistenten

---

  + - - - - - - - - - - - - - - - - - - +
  |                                      |
  |  FAKTURA #1048                       |
  |                                      |
  |  Mitt Foretag AB -> Acme AB          |
  |  Datum: 2026-01-31                   |
  |  Forfallodag: 2026-02-28             |
  |                                      |
  |  Konsulttjanster         40 000 kr   |
  |  Reseersattning           5 000 kr   |
  |                         ----------   |
  |  Netto                   45 000 kr   |
  |  Moms 25%                11 250 kr   |
  |  Att betala              56 250 kr   |
  |                                      |
  |  OCR: _______________  <- fyll i     |
  |                                      |
  + - - - - - - - - - - - - - - - - - - +

[ Skicka ]   [ Ladda ner PDF ]       [ Stang ]
```

### 3. Kvitton — "Fotoalbum med noteringar"

Flipping through photos with sticky notes. Side-by-side: image left, extraction right.

```
Kvittotolkning                              x
5 kvitton · 2026-01-31

---

  +--------+   Bauhaus
  |        |   2 349 kr · Kort ****4821
  |  foto  |   -> Matchad: Transaktion #3891
  |        |   Konto 5410 Forbrukningsmaterial
  +--------+   OK

  +--------+   Shell Vastra Hamnen
  |        |   987 kr · Kort ****4821
  |  foto  |   -> Matchad: Transaktion #3895
  |        |   Konto 5611 Drivmedel
  +--------+   OK

  +--------+   Handskrivet kvitto
  |        |   ~ 450 kr (osakert)
  |  foto  |
  |        |   Jag kan lasa "450" men
  +--------+   handstilen ar svartolkad.
               Stammer beloppet?

               [ Ja, 450 kr ]  [ Nej, andra ]

  +--------+   Olasligt
  |  ####  |
  |  ####  |   Kvittot ar for suddigt.
  |  ####  |   Ta ett nytt foto med battre
  +--------+   belysning.

               [ Ladda upp nytt ]

---

[ Spara matchade (3 st) ]            [ Stang ]
```

### 4. Inventarier — "Anlaggningsblad"

The actual asset register card you'd keep in a binder. Formal, structured, single-item focus.

```
                                            x

  +---------------------------------------+
  |  A N L A G G N I N G S B L A D       |
  |                                       |
  |  Benamning     MacBook Pro 16"        |
  |  Inv.nr        INV-2026-003           |
  |  Kategori      IT-utrustning          |
  |  Plats         Kontor Stockholm       |
  |                                       |
  |  Inkopsdatum   2026-01-15             |
  |  Leverantor    Apple Store            |
  |  Faktura       #1039                  |
  |  Anskaffning   32 900 kr              |
  |                                       |
  +---------------------------------------+
  |  A V S K R I V N I N G               |
  |                                       |
  |  Metod         Linjar                 |
  |  Tid           3 ar                   |
  |  Restvarde     0 kr                   |
  |                                       |
  |  Ar      Avskrivning   Bokfort varde  |
  |  2026      10 967 kr     21 933 kr    |
  |  2027      10 967 kr     10 966 kr    |
  |  2028      10 966 kr          0 kr    |
  |                                       |
  +---------------------------------------+
  |  B O K F O R I N G                   |
  |                                       |
  |  Debet  1250 Datorer      32 900 kr   |
  |  Kredit 1930 Bank         32 900 kr   |
  +---------------------------------------+

  Andra nyttjandeperiod?
  [ 3 ar ]  [ 5 ar ]  [ Anpassad ]

[ Registrera inventarie ]            [ Stang ]
```

### 5. Verifikationer — "Revisorsanteckning"

Auditor's working paper. Terse, technical, monospace numbers. The AI acts as a reviewer leaving notes.

```
Granskning VER A #147                       x
2026-01-31

===

  1930  Bank                    -12 300,00
  4010  Varuinkop                 9 840,00
  2641  Ingaende moms 25%         2 460,00
                                ----------
  Differens                          0,00 OK

  Underlag: faktura_1039.pdf OK

===

  Granskningsnoteringar

  1. Moms: 9 840 x 25% = 2 460 OK
     Korrekt avdragsgill ingaende moms.

  2. Period: Verifikationen avser januari
     men bokfors 31 jan -- nara stangning.
     Overvag om den tillhor februari.
     |
     +- [ Behall januari ]  [ Flytta -> feb ]

  3. Motpart: Bauhaus AB (556xxx-xxxx)
     Tidigare leverantor, inga anmarkningar.

===

[ Bokfor ]                           [ Stang ]
```

---

## Rapporter

### 6. Resultatrakning — "Finansiell rapport med kommentarer i marginalen"

A printed P&L where someone wrote notes in the margins.

```
Resultatrakning                             x
Januari – December 2025

---

                                    2025         2024

  Nettoomsattning          1 245 000    1 102 000   ^ 13%
  Ovriga intakter             18 000       12 000

                            ----------  ----------
  Summa intakter           1 263 000    1 114 000


  Ravaror & fornodenheter   -412 000     -389 000
  Ovriga externa kostn.     -198 000     -165 000   <- se not 1
  Personalkostnader         -385 000     -362 000
  Avskrivningar              -43 000      -38 000

                            ----------  ----------
  Rorelseresultat            225 000      160 000   ^ 41%


  Ranteintakter                1 200        2 100
  Rantekostnader              -8 400       -9 600

                            ----------  ----------
  Resultat fore skatt        217 800      152 500


  Skatt (20,6%)              -44 867      -31 415

                            ----------  ----------
  Arets resultat             172 933      121 085   OK
  =================================================


  + Not 1 -----------------------------------------+
  | Ovriga externa kostnader okade med 20%         |
  | -- framst driven av nya programvarulicenser    |
  | (Figma, Vercel). Inget ovanligt givet          |
  | tillvaxten.                                    |
  +------------------------------------------------+

  Marginalanalys
  --------------
  Bruttomarginal      66,9%  (64,7% fg ar)
  Rorelsemarginal     17,8%  (14,4% fg ar)
  Vinstmarginal       13,7%  (10,9% fg ar)

  Alla marginaler forbattrades. Kostnaderna
  vaxte langsammare an intakterna.

[ Exportera PDF ]  [ Jamfor period ]  [ Stang ]
```

### 7. Balansrakning — Already built (audit-style)

Existing walkthrough with pass/warning/fail grid. No changes needed.

### 8. Momsdeklaration — "Skatteblanketten"

The actual Skatteverket form, filled in. Familiar to anyone who's filed VAT.

```
                                            x

  +---------------------------------------+
  |  MOMSDEKLARATION                      |
  |  Period: Oktober – December 2025      |
  |  Org.nr: 559XXX-XXXX                 |
  +---------------------------------------+
  |                                       |
  |  A. Momspliktig forsaljning           |
  |                                       |
  |  05  Momspl. fors. exkl. moms        |
  |      +------------------+             |
  |      |       412 500 kr |             |
  |      +------------------+             |
  |                                       |
  |  06  Momspl. uttag exkl. moms        |
  |      +------------------+             |
  |      |            0  kr |             |
  |      +------------------+             |
  |                                       |
  |  B. Utgaende moms                     |
  |                                       |
  |  10  Utg. moms 25%      103 125 kr   |
  |  11  Utg. moms 12%            0 kr   |
  |  12  Utg. moms 6%             0 kr   |
  |                                       |
  |  C. Ingaende moms                     |
  |                                       |
  |  48  Ing. moms att dra av  38 940 kr  |
  |                                       |
  |  D. Moms att betala                   |
  |                                       |
  |  49  +------------------+             |
  |      |    64 185 kr     |  <- betala  |
  |      +------------------+             |
  |                                       |
  +---------------------------------------+

  Kontrollberakning
  -----------------
  412 500 x 25% = 103 125         OK
  103 125 - 38 940 = 64 185       OK
  Stammer med bokforing            OK

  Betalningsdatum: 2026-02-12

[ Skicka till Skatteverket ]  [ Ladda ner ]  [ Stang ]
```

### 9. Inkomstdeklaration — "Deklarationsbilagan"

Tax advisor's summary letter attached to the declaration.

```
Inkomstdeklaration INK2                     x
Rakenskapsar 2025

---

  Har ar ett sammandrag av din
  inkomstdeklaration. Alla belopp ar
  hamtade fran bokforingen.

  + Resultat ----------------------------------+
  |                                            |
  |  Bokfort resultat        217 800 kr        |
  |                                            |
  |  Skattmassiga justeringar                  |
  |    + Ej avdragsgilla       4 200 kr        |
  |      Representation 2 100                  |
  |      Boter 2 100                           |
  |    - Outnyttjat underskott     0 kr        |
  |                          ----------        |
  |  Skattemassigt resultat  222 000 kr        |
  |                                            |
  |  Bolagsskatt 20,6%       45 732 kr         |
  +--------------------------------------------+

  + Justeringslogg ----------------------------+
  |                                            |
  |  2 poster justerades:                      |
  |                                            |
  |  1. Representation 3 450 kr                |
  |     Avdragsgillt: 1 350 kr                 |
  |     Ej avdragsgillt: 2 100 kr              |
  |     (Over gransen 150 kr/person)           |
  |                                            |
  |  2. Parkeringsboter 2 100 kr               |
  |     Aldrig avdragsgilla                    |
  +--------------------------------------------+

  Skillnad mot foregaende ar
  --------------------------
  Skatt 2025:  45 732 kr
  Skatt 2024:  31 415 kr  (+46%)

  Okningen beror pa hogre vinst,
  inga nya regler paverkar.

[ Granska INK2 ]  [ Exportera SRU ]  [ Stang ]
```

### 10. AGI — "Lonespecifikation i tabellform"

Payroll summary report. Pure tables, minimal decoration.

```
Arbetsgivardeklaration                      x
December 2025

---

  Individuppgifter

  Namn              Bruttolon    Skatt     Avg.grund
  ----------------  ---------   -------   ----------
  Anna Svensson      42 000     12 936      42 000
  Erik Johansson     38 500     11 088      38 500
  Ali Hassan         35 000      9 450      35 000
  ----------------  ---------   -------   ----------
  Totalt            115 500     33 474     115 500


  Arbetsgivaravgifter

  Avgiftsunderlag              115 500 kr
  Avgift 31,42%                 36 290 kr


  Summering SKV
  -------------
  Avdragen skatt               33 474 kr
  Arbetsgivaravgifter          36 290 kr
  ------------------------------------
  Att betala                   69 764 kr
  Senast: 2026-01-12


  Avstamning mot bokforing
  ------------------------
  Konto 2710 (pers.skatt)    33 474 OK
  Konto 2730 (arb.avg)       36 290 OK
  Differens:                      0

[ Skicka AGI ]  [ Ladda ner XML ]    [ Stang ]
```

### 11. Arsredovisning — "Inlamningschecklista"

Multi-document package. The walkthrough is a table of contents with progress.

```
Arsredovisning 2025                         x
Rakenskapsar 2025-01-01 – 2025-12-31

---

  Arsredovisningen bestar av foljande
  delar. Klicka for att forhandsgranska.

  ===

  1. Forvaltningsberattelse
     Verksamhetens art, resultat-
     disposition, vasentliga handelser.
     -------------------------[ Visa -> ] OK

  2. Resultatrakning
     Intakter, kostnader, arets resultat.
     -------------------------[ Visa -> ] OK

  3. Balansrakning
     Tillgangar, skulder, eget kapital.
     -------------------------[ Visa -> ] OK

  4. Noter
     Redovisningsprinciper, personal,
     skatt, skulder.
     -------------------------[ Visa -> ] !!
     Not 5 (skulder) saknar specifikation.

  5. Underskrifter
     Alla styrelseledamoter ska signera.
     -------------------------[ Visa -> ] o
     Vantar pa 2 av 3 signaturer.

  ===

  3 av 5 delar klara.

[ Forhandsgranska allt ]  [ Skicka till BV ]  [ Stang ]
```

### 12. Arsbokslut — "Steg-for-steg instruktion"

Sequential checklist. Each step unlocks the next.

```
Arsbokslut 2025                             x

---

  Bokslutet genomfors i ordning.
  Steg som ar klara kan inte angras.

  * Steg 1 -- Stam av bankkonton        OK
    Alla 3 bankkonton avstamda.
    Differens: 0 kr

  * Steg 2 -- Periodiseringar           OK
    2 forutbetalda kostnader bokforda.
    1 upplupen intakt bokford.

  * Steg 3 -- Avskrivningar             OK
    Arets avskrivningar: 43 000 kr
    Bokfort pa konto 7832.

  > Steg 4 -- Skatteberakning        pagar
    +----------------------------------+
    | Beraknad skatt: 45 732 kr        |
    | Konto 2510 Skatteskuld           |
    |                                  |
    | [ Godkann och bokfor ]           |
    +----------------------------------+

  o Steg 5 -- Resultatdisposition
    Vantar pa steg 4.

  o Steg 6 -- Las perioden
    Vantar pa steg 5.

---

  4 av 6 steg slutforda.

                                     [ Stang ]
```

### 13. K10 — "Berakningsbilaga"

Tax calculation worksheet. Show your work.

```
K10 -- Kvalificerade andelar               x
Inkomstar 2025 · Anna Svensson

---

  Berakning av gransbeloppet

  Forenklingsregeln
  -----------------
  Schablonbelopp (2,75 x IBB)    209 550 kr
  Din agarandel                        60%
  ----------------------------------------
  Ditt gransbelopp               125 730 kr


  Huvudregeln (jamforelse)
  ------------------------
  Loneunderlag                   892 000 kr
  50% av loner                   446 000 kr
  Din andel (60%)                267 600 kr
  + Sparat utdelningsutrymme      34 200 kr
  ----------------------------------------
  Gransbelopp via huvudregeln    301 800 kr

                    +-----------------------+
                    |  Huvudregeln ger      |
                    |  301 800 kr           |
                    |  -- 176 070 kr mer    |
                    |  an forenkling.       |
                    |                       |
                    |  Rekommendation:      |
                    |  Anvand huvudregeln   |
                    +-----------------------+

  Utdelning & beskattning
  -----------------------
  Planerad utdelning         200 000 kr
  Inom gransbelopp           200 000 kr -> 20% skatt
  Over gransbelopp                 0 kr -> tjanst
  ----------------------------------------
  Skatt pa utdelning          40 000 kr


  Historik
  --------
  2023   Grans: 187 550   Utd: 150 000   Sparat: 37 550
  2024   Grans: 195 250   Utd: 198 600   Sparat:      0
  2025   Grans: 301 800   Utd: 200 000   Sparat: 101 800

[ Fyll i K10 ]  [ Exportera SRU ]        [ Stang ]
```

---

## Loner

### 14. Lonekorning — "Lonekuvert"

Opening a pay envelope. Each employee gets a compact slip you flip through.

```
Lonekorning December 2025                   x
3 anstallda · Utbetalning 2025-12-25

---

  + Anna Svensson ---------------------------------+
  |                                                |
  |  Grundlon                   42 000             |
  |  Friskvardsbidrag            + 500             |
  |                            --------            |
  |  Brutto                     42 500             |
  |                                                |
  |  Skatt 30,8%               -13 090             |
  |                            --------            |
  |  Netto                      29 410 kr          |
  |                                                |
  |  Semesterdagar: 2,08 intjanade                 |
  +------------------------------------------------+

  + Erik Johansson --------------------------------+
  |                                                |
  |  Grundlon                   38 500             |
  |  OB-tillagg 12 tim          + 1 800            |
  |                            --------            |
  |  Brutto                     40 300             |
  |                                                |
  |  Skatt 28,8%               -11 606             |
  |                            --------            |
  |  Netto                      28 694 kr          |
  |                                                |
  |  OB beraknat: 12h x 150 kr                    |
  +------------------------------------------------+

  + Ali Hassan ------------------------------------+
  |  ...                                           |
  +------------------------------------------------+


  Sammanstallning
  ===============
  Bruttoloner            120 800 kr
  Arbetsgivaravgifter     37 955 kr  (31,42%)
  Avdragen skatt          34 146 kr
  -----------------------------------------
  Total kostnad          158 755 kr
  Utbetalning             83 654 kr

  Bokforing:
  2710 Personalskatt      34 146 kr
  2730 Arb.avgifter       37 955 kr
  1930 Bank              -83 654 kr
  7010 Loner            -120 800 kr

  Differens: 0 kr OK

[ Godkann & betala ]  [ Andra ]      [ Stang ]
```

### 15. Formaner — "Personalhandbok-utdrag"

A page from the employee handbook. Grouped by benefit type, not by person.

```
Formansoversikt                             x
2025

---

  Registrerade formaner i bolaget och
  deras skattemassiga behandling.


  Friskvardsbidrag                   aktiv
  ----------------
  Belopp: 5 000 kr/ar per anstalld
  Utnyttjat: 3 av 3 anstallda

  Anna Svensson     5 000 kr   fullt
  Erik Johansson    3 200 kr   kvar: 1 800
  Ali Hassan        5 000 kr   fullt

  Skattefritt upp till 5 000 kr. OK
  Ingen formansbeskattning kravs.


  Mobiltelefon                       aktiv
  ------------
  Marknadsvarde: 350 kr/man
  Tilldelad: Anna Svensson

  +--------------------------------------+
  |  Formansvarde per manad:    350 kr   |
  |  Arligt:                  4 200 kr   |
  |  Arb.avg pa forman:      1 320 kr   |
  |                                      |
  |  Bokfors via lonekorning             |
  |  automatiskt.                        |
  +--------------------------------------+


  Tjanstebil                      ej aktiv
  ----------
  Inga registrerade tjanstebilar.
  [ Lagg till tjanstebil ]


  Sammanfattning 2025
  --------------------
  Skattefria formaner       13 200 kr
  Skattepliktiga formaner    4 200 kr
  Arb.avg pa formaner        1 320 kr

[ Exportera ]                        [ Stang ]
```

### 16. Team & Rapportering — "Personalliggare"

The staff register binder. One row per person, dense but scannable.

```
Personalrapport                             x
Q4 2025

---

  Anna Svensson
  Ekonomichef · Tillsvidare sedan 2021-03
  ------------------------------------------
  Lon: 42 000/man    Semester: 25 dagar
  Uttagna: 18         Kvar: 7
  Sjukdagar Q4: 2     Komptid: 0 h
  Nasta lonerevision: 2026-04

  Erik Johansson
  Utvecklare · Tillsvidare sedan 2022-09
  ------------------------------------------
  Lon: 38 500/man    Semester: 25 dagar
  Uttagna: 20         Kvar: 5
  Sjukdagar Q4: 0     Komptid: 8 h
  Nasta lonerevision: 2026-04

  Ali Hassan
  Saljare · Provanstallning sedan 2025-08
  ------------------------------------------
  Lon: 35 000/man    Semester: 25 dagar
  Uttagna: 3          Kvar: 22
  Sjukdagar Q4: 1     Komptid: 0 h

  +------------------------------------------+
  |  Provanstallning loper ut 2026-02-08     |
  |  Beslut kravs inom 14 dagar.             |
  |                                          |
  |  [ Forlang -> tillsvidare ]              |
  |  [ Avsluta anstallning ]                 |
  +------------------------------------------+


  Nyckeltal Q4
  ------------
  Snittlon              38 500 kr
  Sjukfranvaro           1,1%
  Personalomsattning     0%

[ Exportera rapport ]                [ Stang ]
```

### 17. Egenavgifter — "Skattsedel"

Your own tax slip. Personal, direct, just the numbers.

```
Egenavgifter 2025                           x
Anna Svensson · Delagare 60%

---

  Du betalar egenavgifter pa din
  forvarvsinkomst fran bolaget.

  Underlag
  --------
  Lon fran bolaget           504 000 kr
  Formaner                     4 200 kr
  ----------------------------------------
  Avgiftsunderlag            508 200 kr

  Berakning
  ---------
  Sjukforsakringsavgift  3,55%    18 041
  Foraldraforsakring     2,60%    13 213
  Alderspensionsavgift  10,21%    51 887
  Efterlevandepension    0,60%     3 049
  Arbetsmarknadsavgift   2,64%    13 416
  Arbetsskadeavgift      0,20%     1 016
  Allman loneavgift      11,62%    59 053
  ----------------------------------------
  Summa egenavgifter    31,42%   159 675 kr

  Per manad: ~13 306 kr
  Per kvartal: ~39 919 kr

  +--------------------------------------+
  |  Jamfort med 2024:                   |
  |  Avgiftsunderlaget okade 8%.         |
  |  Procentsatsen ar oforandrad.        |
  +--------------------------------------+

  Nasta inbetalning
  -----------------
  Belopp: 39 919 kr
  Datum: 2026-02-12
  OCR: 123456789012

[ Betala nu ]  [ Ladda ner underlag ]  [ Stang ]
```

### 18. Delagaruttag — "Kontoutdrag delagare"

Personal bank statement between you and the company. Running balance.

```
Delagaruttag 2025                           x
Anna Svensson

---

  Ditt avrakningskonto mot bolaget.

  Datum      Beskrivning             Belopp     Saldo
  ---------  --------------------  ----------  --------
  2025-01-15  Lan till bolaget     +50 000    +50 000
  2025-03-01  Aterbetalning        -20 000    +30 000
  2025-06-15  Privat utlagg          +4 200   +34 200
  2025-09-01  Aterbetalning        -34 200         0
  2025-11-10  Uttag ur bolaget     -15 000    -15 000
  ---------  --------------------  ----------  --------
                                   Saldo:     -15 000

  +----------------------------------------------+
  |  Du har en skuld till bolaget                |
  |  pa 15 000 kr.                               |
  |                                              |
  |  Om skulden kvarstar vid arsskiftet          |
  |  kan den beskattas som fortackt              |
  |  utdelning (20% skatt = 3 000 kr).           |
  |                                              |
  |  Rekommendation:                             |
  |  Aterbetala fore 2025-12-31 eller            |
  |  kvittas mot utdelning.                      |
  |                                              |
  |  [ Aterbetala ]  [ Kvitta mot utd. ]         |
  +----------------------------------------------+

  Skattemassig sammanfattning
  ---------------------------
  Uttag totalt 2025         15 000 kr
  Insattningar totalt       54 200 kr
  Ranta pa lan (SLR+1%)       612 kr

[ Exportera ]                        [ Stang ]
```

---

## Agare & Styrning

### 19. Aktiebok — "Aktiebrev"

Formal share certificate register. Stiff, legal language, notarized document feel.

```
Aktiebok                                    x
Mitt Foretag AB · 559XXX-XXXX
Upprettad 2026-01-31

===

  Aktiekapital: 50 000 kr
  Antal aktier: 1 000 st
  Kvotvarde: 50,00 kr/aktie

===

  AGARE                AKTIER    ANDEL
  -----------------    ------    -----
  Anna Svensson        600       60%
    Serie A #1-600
    Forvarvade 2021-03-15

  Erik Johansson       400       40%
    Serie A #601-1000
    Forvarvade 2022-09-01

===

  Historik

  2021-03-15  Bolagsbildning
              Anna Svensson tecknar 1 000
              aktier a 50 kr.

  2022-09-01  Overlatelse
              Anna Svensson -> Erik Johansson
              400 aktier (#601-1000)
              Kopeskilling: 40 000 kr

===

  Denna aktiebok ar upprettad i enlighet
  med ABL 5 kap. och fors digitalt av
  Scope AI.

[ Exportera PDF ]  [ Registrera andring ]  [ Stang ]
```

### 20. Delagare — "Bolagsbeskrivning"

Ownership section of a company prospectus. Who owns what, and what it means.

```
Agaroversikt                                x
2026-01-31

---

  Anna Svensson                        60%
  ========================--------------

  Roll: VD, styrelseledamot
  Aktier: 600 st (Serie A #1-600)
  Insats: 30 000 kr
  Marknadsvarde (est.): 180 000 kr

  K10-status: Kvalificerade andelar
  Gransbelopp 2025: 301 800 kr
  Sparat utrymme: 101 800 kr


  Erik Johansson                       40%
  ================----------------------

  Roll: Styrelseledamot
  Aktier: 400 st (Serie A #601-1000)
  Insats: 40 000 kr
  Marknadsvarde (est.): 120 000 kr

  K10-status: Kvalificerade andelar
  Gransbelopp 2025: 201 200 kr
  Sparat utrymme: 67 900 kr


  +--------------------------------------+
  |  Totalt eget kapital: 522 000 kr     |
  |  Substansvarde/aktie: 522 kr         |
  |  vs kvotvarde: 50 kr                 |
  +--------------------------------------+

[ Redigera agare ]                   [ Stang ]
```

### 21. Utdelning — "Utdelningsprotokoll"

Formal resolution document from a shareholder meeting. Third-person legal language.

```
                                            x

  BESLUT OM VINSTUTDELNING

  Vid ordinarie bolagsstamma i
  Mitt Foretag AB, 559XXX-XXXX,
  den 2026-04-15 beslutades:

---

  Att dela ut 200 000 kr av fritt
  eget kapital, motsvarande 200 kr
  per aktie.

  Fordelning
  ----------
  Anna Svensson     600 aktier   120 000 kr
  Erik Johansson    400 aktier    80 000 kr
                                 ----------
  Totalt                         200 000 kr

  Utbetalningsdag: 2026-04-20

---

  Forsiktighetsregeln

  Fritt eget kapital fore utd.   472 000 kr
  Foreslagen utdelning          -200 000 kr
  Kvar efter utdelning           272 000 kr

  Bolaget har tillrackligt fritt
  eget kapital. Utdelningen aventyrar
  inte bolagets fortlevnad.          OK

---

  Skattekonsekvens

  Anna Svensson
    Inom gransbelopp     120 000 kr -> 20%
    Skatt                 24 000 kr

  Erik Johansson
    Inom gransbelopp      80 000 kr -> 20%
    Skatt                 16 000 kr

---

  Bokforing vid utbetalning:
  Debet  2098 Utdelning       200 000 kr
  Kredit 1930 Bank            200 000 kr

[ Godkann beslut ]  [ Andra belopp ]  [ Stang ]
```

### 22. Medlemsregister — "Matrikel"

Club membership directory. Simple, no-nonsense.

```
Medlemsregister                             x
Bostadsrattsforeningen Ekbacken
2026-01-31 · 24 medlemmar

---

  Nr   Namn                Lgh    Sedan
  ---  ------------------  -----  ----------
  001  Andersson, Maria    3A     2018-06
  002  Berg, Johan         1B     2019-02
  003  Cederqvist, Lisa    4C     2020-11
  004  Dahl, Fredrik       2A     2021-03
  ...
  024  Oberg, Sven         5B     2025-09

  --- visar 4 av 24, rulla for alla ---


  Sammanfattning
  --------------
  Totalt antal medlemmar        24
  Nya 2025                       3
  Avslutade 2025                 1
  Avgift/manad              2 450 kr (snitt)
  Obetalda avgifter              0 kr


  Senaste andringar
  -----------------
  2025-09-15  Oberg, Sven tillagd (lgh 5B)
  2025-06-01  Holm, Per borttagen (flyttat)
  2025-03-10  Avgiftshojning +150 kr/man

[ Exportera ]  [ Lagg till medlem ]  [ Stang ]
```

### 23. Bolagsstamma — "Motesprotokoll"

Actual meeting minutes with paragraph numbers and formal language.

```
                                            x

  PROTOKOLL

  fort vid ordinarie bolagsstamma i
  Mitt Foretag AB (559XXX-XXXX)
  den 15 april 2026, kl. 14:00
  Plats: Storgatan 12, Stockholm

---

  Narvarande aktieagare:
  Anna Svensson       600 aktier (60%)
  Erik Johansson      400 aktier (40%)

  Stamman ar beslutfor.

---

  $ 1  Val av ordforande
       Anna Svensson valdes.

  $ 2  Val av justerare
       Erik Johansson valdes.

  $ 3  Dagordningens godkannande
       Dagordningen godkandes.

  $ 4  Framlaggande av arsredovisning
       Arsredovisningen for 2025
       presenterades och lades
       till handlingarna.

  $ 5  Resultatdisposition
       Stamman beslutade i enlighet
       med styrelsens forslag:

       Utdelning     200 000 kr
       Balanseras     272 000 kr

  $ 6  Ansvarsfrihet
       Styrelsen beviljades
       ansvarsfrihet for 2025.       [ Rosta ]

  $ 7  Val av styrelse
       Omval: Anna Svensson,
       Erik Johansson.
       Mandatperiod: 1 ar.

  $ 8  Avslutning
       Ordforanden avslutade stamman.

---

  Att godkanna:
  [x] Dagordning
  [x] Resultatdisposition
  [ ] Ansvarsfrihet -- vantar pa rost
  [x] Styrelsevals

[ Signera protokoll ]                [ Stang ]
```

### 24. Arsmote — "Kallelse & dagordning"

Meeting invitation you'd mail out, with an RSVP.

```
Kallelse till arsmote                       x
Bostadsrattsforeningen Ekbacken

---

  Medlemmarna i Brf Ekbacken kallas
  harmed till ordinarie arsmote.

  Datum:   Torsdagen den 20 mars 2026
  Tid:     18:30
  Plats:   Foreningslokalen, Ekvagen 4

---

  DAGORDNING

   1. Motets oppnande
   2. Val av motesordforande
   3. Val av sekreterare
   4. Val av justerare
   5. Godkannande av dagordning
   6. Fraga om kallelse skett i behorig
      ordning
   7. Foredragning av arsredovisning
   8. Beslut om resultatdisposition
   9. Beslut om ansvarsfrihet
  10. Beslut om arvoden
  11. Val av styrelse
  12. Val av revisor
  13. Ovriga fragor
  14. Motets avslutande

---

  Bilagor

  + Arsredovisning 2025 --------[ Visa -> ]
  + Budget 2026 -----------------[ Visa -> ]
  + Valberedningens forslag -----[ Visa -> ]

---

  Kallelsen ska skickas senast
  2026-02-20 (4 veckor fore motet).

  Skickas till 24 medlemmar via:
  [x] E-post
  [ ] Brev (3 saknar e-post)

[ Skicka kallelse ]  [ Redigera ]    [ Stang ]
```

### 25. Firmatecknare — "Registreringsbevis"

Excerpt from Bolagsverket's records. Dry, official, factual.

```
Firmateckning                               x
Mitt Foretag AB · 559XXX-XXXX

===

  Enligt registrering hos Bolagsverket:

  Styrelsen tecknar firman.

  Av styrelsen bemyndigad firmatecknare:
  Anna Svensson -- ensam

===

  Styrelse

  Ledamot     Anna Svensson      (ordf.)
              Personnr: 850101-XXXX
              Invald: 2021-03-15

  Ledamot     Erik Johansson
              Personnr: 900515-XXXX
              Invald: 2022-09-01

  Suppleant   -- vakant --

===

  Senaste andringsanmalan
  -----------------------
  2022-09-15  Erik Johansson tillagd
              som styrelseledamot.
              Reg.bevis nr: 2022-48291

  +--------------------------------------+
  |  Suppleantplats ar vakant.           |
  |  Det finns inget lagkrav for         |
  |  sma bolag, men det rekommenderas.   |
  |                                      |
  |  [ Registrera suppleant ]            |
  +--------------------------------------+

  Nasta arsstamma: 2026-04-15
  Mandatperioden loper ut efter stamman.

[ Hamta registreringsbevis ]  [ Andra ]  [ Stang ]
```

---

## Variation Principles

| Page                | Document feel                       | Key trait                                  |
| ------------------- | ----------------------------------- | ------------------------------------------ |
| Transaktioner       | Bank statement with annotations     | Timeline, collapse OK items                |
| Fakturor            | Cover letter + attached invoice     | Warm tone, document-in-document            |
| Kvitton             | Photo album with sticky notes       | Visual, per-item stories                   |
| Inventarier         | Asset register card                 | Single formal document                     |
| Verifikationer      | Auditor's working paper             | Terse, numbered notes                      |
| Resultatrakning     | Financial statement + margin notes  | Two-column numbers, footnotes              |
| Balansrakning       | Audit report                        | Status grid (existing)                     |
| Momsdeklaration     | Government form filled in           | Form fields in boxes                       |
| Inkomstdeklaration  | Tax advisor letter                  | Summary blocks + adjustment log            |
| AGI                 | Payroll printout                    | Tables, minimal decoration                 |
| Arsredovisning      | Table of contents / package tracker | Clickable sections, progress               |
| Arsbokslut          | Sequential checklist                | Linear steps, unlock next                  |
| K10                 | Calculation worksheet               | Show-your-work arithmetic                  |
| Lonekorning         | Pay envelopes                       | Per-person slips, employer reconciliation  |
| Formaner            | Employee handbook excerpt           | Grouped by benefit type, tax rules inline  |
| Team & Rapportering | Staff register                      | Dense per-person entries, KPIs             |
| Egenavgifter        | Personal tax slip                   | Every component spelled out                |
| Delagaruttag        | Personal ledger / bank statement    | Running balance, tax warnings              |
| Aktiebok            | Share certificate register          | Legal, notarial log, formal borders        |
| Delagare            | Company prospectus                  | Ownership bars, K10 context per person     |
| Utdelning           | Shareholder resolution              | Third-person legal language, prudence rule |
| Medlemsregister     | Club directory / matrikel           | Numbered list, change log                  |
| Bolagsstamma        | Meeting minutes (paragraphs)        | Formal, decision checkboxes at bottom      |
| Arsmote             | Meeting invitation letter           | Dagordning list, attachments, send options |
| Firmatecknare       | Registration certificate            | Official registry data, advisory callout   |

---

### Open-Ended Composition Guidance

Beyond the fixed/dynamic walkthrough flows above, the AI should adapt its block composition based on the user's **intent type** within each domain. The three common intent types are:

#### Intent: Browse / Overview
The user wants to see a list or overview of items. Pattern: `heading → info-card (if warnings) → data-table → prose`

Examples:
- "visa transaktioner oktober" → heading + data-table + prose summary
- "visa kundfakturor" → heading + info-card (overdue warning) + data-table
- "vilka kvitton saknas?" → heading + data-table (missing) + prose

#### Intent: Summary / Analysis
The user wants to understand trends or get a high-level picture. Pattern: `heading → metric/stat-cards → chart → prose`

Examples:
- "hur gick oktober?" → heading + stat-cards + chart + prose analysis
- "hur mår företaget?" → heading + metric cards + chart + ranked-list + prose
- "visa personalkostnader" → heading + stat-cards + chart (trend) + ranked-list + prose

#### Intent: Single Item
The user asks about one specific item. Pattern: Mode A (chat text), no walkthrough unless complex.

Examples:
- "vad är transaktion #3891?" → chat response with key-value details
- "visa faktura 2024-001" → document-preview block or chat

#### Intent: Action Flow
The user wants to perform an action on multiple items. Pattern: existing timeline/checklist-based layouts.

Examples:
- "kontera januari" → timeline with choices per transaction
- "kör lön" → checklist with steps

### Prose-Between-Blocks Pattern

When composing dynamic walkthroughs, **weave `prose` blocks between data blocks** for narrative flow. Don't save all commentary for a single ai-comment at the end.

Good pattern:
```
heading → stat-cards → prose (interpret the numbers) → chart → prose (explain trend) → action-bar
```

Bad pattern:
```
heading → stat-cards → chart → ranked-list → ai-comment (wall of text at the end)
```

The prose blocks should be short (1-2 sentences) and directly reference the data block above them. This creates a guided reading experience.
