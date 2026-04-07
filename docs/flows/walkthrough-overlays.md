# Workflow: Walkthrough Overlays

> Full-detail overlays that open when a user clicks a card in chat, or when Scooby presents reports/documents.

## What They Are

Walkthrough overlays are the "full preview" layer of the AI's output. They take over the main content area to show complete, detailed information. The sidebar stays visible.

## Two Triggers

### 1. Card Click (User-Initiated)
Scooby generates a compact preview card inline in chat (verification, invoice, payslip, etc.). User clicks the card → walkthrough overlay opens with the full detailed view.

```
Chat: compact card with key fields
  → User clicks card
  → Main content area shows walkthrough overlay
  → Full detail: all line items, totals, affected accounts
  → Actions: "Godkänn" / "Ändra" / "Gå till [sida]"
  → "Ändra" returns to chat for conversation-based edits
  → "Godkänn" executes the action
  → "Gå till [sida]" navigates to the relevant page with item highlighted
```

### 2. Automatic (Report/Document Rendering)
Some content is naturally a walkthrough — reports, tax declarations, financial statements. When a user asks "Visa resultaträkningen" or "Hur ser balansräkningen ut?", Scooby computes the result (deterministic math, not AI reasoning) and renders it directly as a walkthrough overlay.

These are NOT AI-generated opinions — they're computed outputs rendered in a structured format.

Examples of automatic walkthroughs:
- Resultaträkning (income statement) — account balances → math → rendered table
- Balansräkning (balance sheet) — same pattern
- Momsdeklaration — VAT data aggregated and rendered
- Lönespecifikation — payslip with full breakdown
- Utdelningsbeslut — formal dividend decision document

## Three Response Modes

The AI reads user **intent** to decide how to respond:

| Mode | When | Example |
|------|------|---------|
| **Chat** | Questions, advice, guidance | "Hur fungerar utdelning?" → explain in conversation |
| **Dynamic walkthrough** | Analysis, exploration, operational review | "Hur mycket kan jag dela ut?" → calculation + options |
| **Fixed walkthrough** | Formal reports, legal documents, tax forms | "Skapa utdelningsbeslut" → structured legal document |

Same topic, different intent → different response mode.

## Walkthrough Structure

```
1. Title                    — always first
2. [Blocks]                 — fixed list (reports) or AI-composed (analysis)
3. AI Comment (optional)    — if the AI has analysis to share
4. Actions                  — always last (minimum: "Stäng")
```

## Block Primitives

Walkthroughs are composed from the block rendering system — 23 composable primitives:
- Tables, stat cards, charts, timelines, checklists
- Legal paragraphs, form fields, financial breakdowns
- Confirmation buttons, navigation links

## WalkthroughOpenerCard — The Chat Trigger

When Scooby generates a report, the full walkthrough doesn't open automatically. Instead, a **WalkthroughOpenerCard** appears inline in chat — a compact clickable card with:
- **Icon + color** — deterministic, mapped from `walkthroughType` (see table below)
- **Title** — dynamic, set by Scooby (e.g., "Resultaträkning Q1 2026")
- **Subtitle** — dynamic, key numbers (e.g., "Intäkter 485 000 kr · Resultat 173 000 kr")
- **ChevronRight** — affordance indicating it's clickable

User clicks → walkthrough overlay opens in main content area.

### Deterministic Type Mapping

| `walkthroughType` | Icon | Color | Walkthrough |
|---|---|---|---|
| `resultaträkning` | TrendingUp | Emerald | Income statement |
| `balansräkning` | Scale | Blue | Balance sheet |
| `momsdeklaration` | Receipt | Amber | VAT declaration |
| `k10` | PieChart | Purple | K10 calculation |
| `egenavgifter` | Calculator | Amber | Self-employment tax |
| `agi` | Send | Blue | Employer declaration |
| `inkomstdeklaration` | FileText | Red | Income tax return |
| `årsredovisning` | BookOpen | Indigo | Annual report |
| `lönespecifikation` | Users | Green | Payslip detail |

**Rule:** The icon and color are fixed per type (deterministic plumbing). Only the title and subtitle text are dynamic (stochastic, set by Scooby).

Full component specification: see [`scooby-streaming-ui.md`](scooby-streaming-ui.md).

## What Connects Here

- AI interface generates compact cards in chat → user clicks → walkthrough opens
- `scooby-streaming-ui.md` — component catalog and rendering rules for all chat UI
- Deterministic rule tools compute the data → walkthrough renders it
- Page overlays are the sibling pattern for table row detail views
- "Gå till [sida]" button navigates to information pages
- Test pages (`src/app/test-ui/ai-streaming/`) — visual specification for every scenario
