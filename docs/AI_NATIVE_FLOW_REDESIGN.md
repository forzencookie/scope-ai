# AI-Native Flow Redesign — Launch Readiness Plan

**Date:** 2026-03-09
**Status:** Draft — Founder Review Required

---

## 1. The Core Idea

Scope AI is ChatGPT/Claude/Gemini with Swedish accounting tools. That's it. If this were ChatGPT and it had 60+ accounting tools, you would just **chat all day**. The AI would generate reports, book transactions, run payroll, file taxes — all through conversation. You'd never navigate to a "Resultaträkning page" because the AI would just render it when you ask.

The current app has 33+ sub-tabs that all look like "stat cards → table header → table." It looks finished, but the flow is wrong. Users navigate *away* from the AI to do manual tasks, then navigate *back* to ask for help. That's backwards.

**The shift:**
- **Now:** Pages are where you work. AI assists.
- **Target:** AI is where you work. Pages are reference views.

---

## 2. The Diagnosis

The biggest problem is that you built two apps. There's "the pages app" — 33 tabs with stat cards, tables, dialogs, forms — and there's "the Scooby app" — the chat with 60+ tools. They share a database but they don't share a workflow. A user can create an invoice through `InvoiceCreateDialog` and Scooby has no idea it happened. Or they can ask Scooby to create one, and the overlay shows the result on top of a page they're about to leave anyway.

The overlay is a dead end. I traced the whole flow: user clicks "Analysera" on a page → `useNavigateToAIChat()` dispatches `AI_CHAT_EVENT` → `ChatProvider` catches it → sends to API → stream comes back → `useStreamParser` parses the `W:` blocks → `AIDialogProvider` sets status → `AIOverlay` renders on top of the page. The user sees a beautiful walkthrough. They close it. They're back on the page. The conversation that generated it is in `/dashboard` history but they never see it. They can't say "now change the period" because they're not in chat mode. It's a popup, not a workflow.

You have 10 dialogs that duplicate 10 AI tools. `PayslipCreateDialog` is a 3-step wizard that does what `run_payroll` does. `InvoiceCreateDialog` is a multi-field form that does what `create_invoice` does. `MomsWizardDialog`, `K10WizardDialog`, `BookingDialog` — all of these have AI tool equivalents that already work. You're maintaining two parallel paths to do the same thing, and neither path knows about the other.

14 of your tabs are stat cards + table. I went through every single one. Transaktioner, Kvitton, Inventarier, Verifikationer, Lönekörning, Förmåner, Delägaruttag, Delägare, Medlemsregister, Momsdeklaration, AGI, Inkomstdeklaration — all the same layout. Some of these don't even need to be pages. Resultaträkning is literally "fetch account balances, render table." That's a walkthrough, not a page. Same for Balansräkning, K10, Egenavgifter, AGI. These are things you ask the AI to show you.

The cross-module wiring has real bugs. Three specific ones:
- `POST /api/invoices/[id]/credit-note` creates the invoice record but **never calls** `pendingBookingService.createPendingBooking()`. The `createCreditNoteEntry()` function exists in `src/lib/bookkeeping/` — it's just not wired up.
- `shareholderService.transferShares()` updates the aktiebok but creates **zero GL entries**. If someone buys shares for money, that cash movement never hits the ledger.
- After `run_payroll` completes, vacation accrual is *suggested in a toast* but not posted. The user has to manually create a 12% semesterlöneskuld entry.

Scooby has amnesia. Every conversation starts from zero. The system prompt is well-crafted — core instincts, scenarios, company context — but there's no memory layer. The founder specifically asked for "You always book office supplies to 6110" and "You prefer to do bokföring on Mondays." That doesn't exist. There's no `scooby_memory` table, no pattern extraction, nothing persisted between sessions.

The planning system is a skeleton. `create_roadmap` and `update_roadmap_step` exist as AI tools, and there's a Canvas tab in Händelser that's just a markdown viewer for AI-generated content (its empty state literally says "Be AI att skapa innehåll via chatten"). The founder's "Min Plan" — an AI-generated daily/weekly checklist based on company type and momsperiod — doesn't exist. Plans should be AI walkthroughs with a confirmation gate: accept → saves to `roadmaps` table and appears on Översikt; decline → stays as a chat message, no DB write.

The frustrating part is: **the hard stuff is done.** The atomic booking RPC is production-grade. The double-entry engine is correct. The 23 block types in the walkthrough renderer are solid. The AI tools actually write to the database with proper confirmation flows. BFL-compliant verification numbering works. Period locking works.

The gap is the *flow between these things*. The plumbing exists but it's not connected into one coherent path where the AI is the primary interface and the pages are just reference views. That's what this redesign document is about.

---

## 3. What's Actually Wrong (Technical Detail)

### 3.1 The Overlay Flow (Traced)

The exact code path when a user clicks "Analysera" on a page:

```
Page → useNavigateToAIChat() → dispatches CustomEvent("open-ai-chat")
  → ChatProvider catches event → startNewConversation() + sendMessage()
  → POST /api/chat → ScopeBrain agent streams response
  → useStreamParser accumulates: T: (text), W: (walkthrough blocks), D: (structured data)
  → dispatchCompletionEvents() emits "ai-dialog-walkthrough-blocks"
  → AIDialogProvider listens → sets status="walkthrough-blocks"
  → AIOverlay renders WalkthroughRenderer on top of current page
  → User closes overlay → back on the page, conversation lost in /dashboard history
```

### 3.2 Duplicate Dialog ↔ Tool Pairs

| Dialog (manual path) | AI Tool (chat path) | Both write to same DB |
|---|---|---|
| `PayslipCreateDialog` | `run_payroll` | Yes |
| `InvoiceCreateDialog` | `create_invoice` | Yes |
| `SupplierInvoiceDialog` | `create_receipt` | Yes |
| `BookingDialog` | `create_verification` | Yes |
| `MomsWizardDialog` | `submit_vat_declaration` | Yes |
| `K10WizardDialog` | `optimize_312` | Yes |
| `NewWithdrawalDialog` | `register_owner_withdrawal` | Yes |
| `RegisterDividendDialog` | Dividend tools | Yes |

Neither path notifies the other when it writes.

### 3.3 Cross-Module Bugs

| Flow | What's broken | Fix |
|---|---|---|
| Credit note | `POST /api/invoices/[id]/credit-note` creates record, never calls `pendingBookingService` | Wire up `createCreditNoteEntry()` from `src/lib/bookkeeping/` |
| Share transfer | `shareholderService.transferShares()` updates aktiebok, no GL entry | Create pending booking when `pricePerShare > 0` |
| Dividend payment | Decisions stored as JSON in compliance docs, no payment tracking | Create `dividends` table + payment endpoint |
| Vacation accrual | Suggested in toast after payroll, not auto-posted | Auto-create pending booking for 12% semesterlöneskuld |
| Month-close | Checklist is manual, no auto-generated accruals | Offer standard accrual generation on period lock |

---

## 4. The New Architecture

### 4.1 Three Modes

The app has exactly three ways a user interacts with information:

1. **Chat Mode** (`/dashboard`) — The primary interface. Where you DO things. Ask Scooby to book, create, analyze, report. This is the default state. Like ChatGPT's main screen. Every session starts here.

2. **Reference Pages** (`/dashboard/<category>`) — Where you SEE things. Browse transaction lists, check invoice status, review the ledger. Read-heavy, action-light. Like ChatGPT's "Projects" or "Memory" — ancillary views, not the main workflow. Each page has a unique UI suited to its data type.

3. **Walkthroughs** — Where you SEE things the AI GENERATED. Rich structured output rendered inline in chat using the block system (23 block types already built). Reports, tax forms, meeting minutes, calculations — all walkthroughs. No separate pages needed. Can also appear in a side panel for large documents (like Claude's artifacts).

### 4.2 The Command Button Pattern

Every action button on a reference page becomes a **command button** — it doesn't open a dialog, it redirects to chat with a premade prompt.

**Current flow:** User clicks "Ny faktura" on the Fakturor page → `InvoiceCreateDialog` opens → user fills 8 fields manually → clicks "Skapa" → invoice saved. The AI was never involved.

**New flow:** User clicks "Ny faktura" → navigates to `/dashboard` (chat mode) with context prefilled → Scooby asks clarifying questions in natural language → calls `create_invoice` tool → confirmation card shows preview → user confirms → done. The user stays in chat and can keep iterating ("Ändra betalningsvillkor till 45 dagar").

This already works mechanically — `useNavigateToAIChat()` + `AI_CHAT_EVENT` + `actionTrigger` chips exist. The wiring just needs to replace dialog triggers.

**For simple actions** (categorize transaction, mark invoice as paid), keep the inline action. Not everything needs a conversation. The rule: **if it takes more than 2 fields, route to Scooby.**

### 4.3 The Overlay Fix

**Kill the floating overlay.** Instead:

1. When user is on a reference page and triggers an AI action → **navigate to `/dashboard`** (chat mode) with full context
2. Scooby renders the response as a walkthrough **inline in the conversation**
3. Complex outputs (full reports, PDFs, documents) open as a **side panel** alongside chat (like Claude's artifacts)
4. User can keep chatting about the output: "Ändra momsperioden till Q2" or "Exportera som PDF"

The `AIOverlay` component becomes the **side panel**, not a floating modal. It persists alongside the chat and responds to chat context.

---

## 5. Category Consolidation

### 5.1 Current: 5 Categories, 33+ Tabs

```
Händelser (4 views)
  ├── Översikt (månadsavslut)
  ├── Canvas
  └── Arkiv

Bokföring (5 tabs)
  ├── Transaktioner
  ├── Fakturor
  ├── Kvitton
  ├── Inventarier
  └── Verifikationer

Löner (4 tabs)
  ├── Lönekörning
  ├── Förmåner
  ├── Team
  └── Delägaruttag

Rapporter (9 tabs)
  ├── Resultaträkning
  ├── Balansräkning
  ├── Momsdeklaration
  ├── Inkomstdeklaration
  ├── AGI
  ├── Årsredovisning
  ├── Årsbokslut
  ├── K10
  └── Egenavgifter

Ägare (8 tabs)
  ├── Aktiebok
  ├── Delägare
  ├── Utdelning
  ├── Ägarinfo
  ├── Medlemsregister
  ├── Möten & Protokoll
  ├── Årsmöte
  └── Firmatecknare
```

### 5.2 New: 5 Categories, ~10 Tabs (Company-Type Adaptive)

All 5 categories stay — they're mental models, not just navigation. What changes is the pages *within* each category. Most get condensed. Some adapt per company type (`CompanyType` in `src/lib/company-types.ts`).

```
Händelser (2 views — down from 3, Canvas deleted)
  ├── Översikt                     ← calendar + daily activity feed + deadlines + active plans (was "Arkiv")
  └── Arkiv                        ← månadsavslut 12-month grid with period closing checklists (was "Översikt")

Bokföring (3 tabs — down from 5)
  ├── Transaktioner                ← merged with Kvitton (receipts = evidence on transactions)
  ├── Fakturor                     ← kept (kanban lifecycle view is essential)
  └── Huvudbok                     ← renamed from Verifikationer (cleaner name)

Löner (2 tabs — down from 4)
  ├── Löneöversikt                 ← payslip list + run history
  └── Team                         ← employees + partners roster

Rapporter (0 tabs — hub page)
  └── (no sub-tabs)                ← single page: recently generated reports + quick-generate buttons
                                      all 9 former report tabs become AI walkthroughs

Ägare (1-2 tabs — adaptive per company type, down from 8)
  └── See company type matrix below
```

**Total: 5 categories, 9-11 tabs depending on company type** (down from 33+)

### 5.2.1 Ägare: Company Type Matrix

The Ägare category adapts its tabs based on the company type. This is already handled by `hasFeature()` gating in `ownership-page.tsx` — we just reduce what's available.

| Company Type | Tab 1 | Tab 2 | Walkthroughs (via Scooby) |
|---|---|---|---|
| **AB** (Aktiebolag) | Aktiebok & Styrning (aktiebok + firmatecknare merged) | Möten & Beslut (stämma + styrelseprotokoll) | Utdelning, K10 |
| **EF** (Enskild Firma) | Ägarinfo (single card, no tabs) | — | — |
| **HB** (Handelsbolag) | Delägare (partners + firmatecknare merged) | — | Delägaruttag |
| **KB** (Kommanditbolag) | Delägare (partners + firmatecknare merged) | — | Delägaruttag |
| **Förening** (Ideell Förening) | Medlemsregister | Möten & Beslut (stämma + årsmöte + styrelseprotokoll) | — |

**Key decisions:**
- **EF** gets one card, not tabs. The `EnskildFirmaOwnerInfo` component already handles this.
- **HB/KB** have no formal meetings (bolagsstämma/årsmöte), so only 1 tab. Firmatecknare merges into the Delägare view as a section.
- **Förening** keeps Medlemsregister as a proper tab (it's a legal register per stadgar). Årsmöte merges into Möten & Beslut.
- **AB** gets 2 tabs: the share register (legally required per ABL) and the meeting archive.

### 5.2.2 Löner: Company Type Matrix

| Company Type | Tab 1 | Tab 2 | Walkthroughs (via Scooby) |
|---|---|---|---|
| **AB** | Löneöversikt | Team | AGI, K10 |
| **EF** | Löneöversikt | Team | Egenavgifter, AGI |
| **HB/KB** | Löneöversikt | Team | Delägaruttag, Egenavgifter, AGI |
| **Förening** | Löneöversikt | Team | AGI |

**Key decisions:**
- All types keep 2 tabs (Löneöversikt + Team). Even EF may have employees.
- **Delägaruttag** (HB/KB) becomes a walkthrough — it's a simple form (amount + date + partner). Partners ask Scooby "Registrera uttag 50 000 kr".
- **Egenavgifter** (EF, HB, KB) becomes a walkthrough — it's a calculation, perfect for AI.
- **AGI** becomes a walkthrough for all types — it's a generated report.
- **K10** (AB only) becomes a walkthrough — it's a complex calculation with 3:12 rules.

### 5.2.3 Rapporter: Company Type Matrix

All report types become AI walkthroughs. The Rapporter hub page shows:
1. A grid of recently generated reports (cards with title, date, "Visa" button)
2. Quick-generate action buttons filtered by company type

| Company Type | Available Report Walkthroughs |
|---|---|
| **AB** | Resultaträkning, Balansräkning, Momsdeklaration, Inkomstdeklaration (INK2), Årsredovisning (K2/K3) |
| **EF** | Resultaträkning, Balansräkning, Momsdeklaration, Inkomstdeklaration (NE), Årsbokslut (förenklat) |
| **HB/KB** | Resultaträkning, Balansräkning, Momsdeklaration, Inkomstdeklaration (N3A/N3B), Årsbokslut (förenklat) |
| **Förening** | Resultaträkning, Balansräkning, Momsdeklaration, Inkomstdeklaration (förenklad), Årsredovisning |

Note: AB uses `arsredovisning` (formal annual report), EF/HB/KB use `arsbokslut` (simplified). Förening uses `arsredovisning`. This is already handled by the `CompanyTypeInfo.arsbokslutVariant` field.

### 5.3 What Became Walkthroughs (AI-Generated on Demand)

These pages no longer exist as dedicated tabs. Users ask Scooby and get a walkthrough:

**From Rapporter (all 9 tabs eliminated):**

| Former Tab | Trigger | How It Works | Company Types |
|---|---|---|---|
| **Resultaträkning** | "Visa resultaträkningen" | Walkthrough with `financial-table` blocks | All |
| **Balansräkning** | "Visa balansräkningen" | Walkthrough with balance check | All |
| **Momsdeklaration** | "Gör momsdeklarationen för Q1" | Walkthrough with `stat-cards` + `form-fields` | All |
| **Inkomstdeklaration** | "Hjälp mig med inkomstdeklarationen" | Multi-step conversation (variant per type) | All |
| **AGI** | "Skapa arbetsgivardeklaration" | Walkthrough with employee breakdown | All (if employees) |
| **Årsredovisning** | "Skapa årsredovisningen" | Document preview in side panel | AB, Förening |
| **Årsbokslut** | "Stäng räkenskapsåret" | Multi-step conversation + confirmation | EF, HB, KB |
| **K10** | "Beräkna gränsbeloppet" | Walkthrough with `comparison` block | AB only |
| **Egenavgifter** | "Beräkna egenavgifter" | Walkthrough with breakdown | EF, HB, KB |

**From Bokföring (2 tabs eliminated):**

| Former Tab | Trigger | How It Works |
|---|---|---|
| **Kvitton** | — (merged into Transaktioner) | Receipts appear as thumbnails/attachments on transactions |
| **Inventarier** | "Visa mina inventarier" / "Registrera inventarie" | Walkthrough or conversation |

**From Löner (2 tabs eliminated):**

| Former Tab | Trigger | How It Works | Company Types |
|---|---|---|---|
| **Förmåner** | "Visa förmåner" / "Tilldela förmån" | Walkthrough with `entity-rows` | All |
| **Delägaruttag** | "Registrera uttag" | Conversation with confirmation | HB, KB |

**From Ägare (4-6 tabs eliminated depending on type):**

| Former Tab | Trigger | How It Works | Company Types |
|---|---|---|---|
| **Utdelning** | "Planera utdelning" | Walkthrough with calculator + 3:12 rules | AB |
| **Ägarinfo** | "Visa bolagsinformation" | Simple walkthrough | HB, KB, Förening (EF keeps as card) |
| **Firmatecknare** | — (merged into Tab 1) | Section within Aktiebok/Delägare view | AB, HB, KB, Förening |
| **Årsmöte** | — (merged into Möten & Beslut) | Combined meeting view | Förening |

**From Händelser (1 tab eliminated):**

| Former Tab | Trigger | How It Works |
|---|---|---|
| **Canvas** | "Gör en plan för att [mål]" | Walkthrough with checklist/timeline blocks. Accept → saves to `roadmaps` table, appears on Översikt. Decline → stays as chat message only. |

**Total: 22 tabs eliminated**, replaced by AI walkthroughs or merged into surviving tabs.

### 5.4 Dead Code Inventory

The consolidation produces dead code that MUST be cleaned up. Do not leave unused components, imports, or lazy loaders in the codebase.

#### 5.4.1 Page Tab Components to DELETE

These tab content components are no longer rendered anywhere:

**From `src/components/rapporter/` (all 9):**
- `ResultatrakningContent` (and its `CollapsibleTableSection` usage)
- `BalansrakningContent`
- `MomsdeklarationContent`
- `InkomstdeklarationContent`
- `AGIContent`
- `ArsredovisningContent`
- `ArsbokslutContent`
- `K10Content`
- `EgenavgifterContent`

**From `src/components/bokforing/`:**
- `ReceiptsTable` / `LazyReceiptsTable` (kvitton merged into transaktioner)
- `InventarierTable` / `LazyInventarierTable` (becomes walkthrough)

**From `src/components/loner/`:**
- `BenefitsTab` / `LazyBenefitsTab` (becomes walkthrough)
- `DelagaruttagTab` / `LazyDelagaruttag` (becomes walkthrough)

**From `src/components/handelser/`:**
- `CanvasView` / `canvas-view.tsx` (plans become AI walkthroughs, saved plans show on Översikt)

**From `src/components/agare/` (or ownership sub-components):**
- `UtdelningTab` / `LazyUtdelning` (becomes walkthrough)
- `ArsmoteTab` / `LazyArsmote` (merged into Möten & Beslut)
- `FirmatecknareTab` / `LazyFirmatecknare` (merged into parent tab)
- `AgarinfoTab` (becomes walkthrough for non-EF; EF keeps `EnskildFirmaOwnerInfo`)

#### 5.4.2 Dialogs to DELETE

These dialogs are replaced by AI chat commands (Section 7.2):

| Dialog | Replacement | Notes |
|---|---|---|
| `MomsWizardDialog` | Quick Action → Scooby walkthrough | Report, not a form |
| `K10WizardDialog` | Quick Action → Scooby walkthrough | Calculator, better as AI |
| `InkomstWizardDialog` | Quick Action → Scooby conversation | Multi-step, needs AI guidance |
| `ArsredovisningWizardDialog` | Quick Action → Scooby side panel | Document generation |
| `NewWithdrawalDialog` | Quick Action → Scooby conversation | Simple form, but benefits from context |
| `RegisterDividendDialog` | Quick Action → Scooby walkthrough | Needs 3:12 calculation |

#### 5.4.3 Dialogs to KEEP

| Dialog | Why |
|---|---|
| `BookingDialog` | Complex multi-step double-entry — some users prefer the form |
| `NewTransactionDialog` | Quick 3-field form, faster than conversation |
| `PayslipCreateDialog` | For now — will become command button in Phase 1 |
| `InvoiceCreateDialog` | For now — will become command button in Phase 1 |
| `MonthReviewDialog` | Månadsavslut checklist — unique workflow |
| `VerifikationDetailsDialog` | Read-only detail view for ledger |
| `SupplierInvoiceDialog` | OCR upload flow — may stay as quick uploader |

#### 5.4.4 Lazy Loaders to DELETE

Every `createLazyComponent()` wrapper for a deleted tab component. These are typically defined at the top of the page component files (e.g., `reports-page.tsx`, `ownership-page.tsx`).

#### 5.4.5 Tab Definitions to UPDATE

The `allTabs` / `viewTabs` arrays in each page component must be updated to reflect the new tab structure:
- `events-page.tsx` → reduce from 3 views to 2 (Översikt + Arkiv), delete Canvas, swap component assignments
- `reports-page.tsx` → delete entire allTabs array (no tabs, becomes hub)
- `ownership-page.tsx` → reduce from 8 tabs to 1-2 per company type
- `payroll-page.tsx` → reduce from 4 tabs to 2
- `accounting-page.tsx` → reduce from 5 tabs to 3

#### 5.4.6 Feature Keys to REVIEW

Some `FeatureKey` values in `company-types.ts` may become unused after consolidation. Review and clean up:
- `kvitton` → merged into `transaktioner` (feature key may still be needed for AI tool gating)
- `inventarier` → becomes walkthrough (feature key still needed for AI tool gating)
- `arsmote` → merged into `bolagsstamma` (can potentially unify these keys)
- Individual report keys (`resultatrakning`, `balansrakning`, etc.) → still needed for AI walkthrough gating

**Rule: Feature keys that gate AI tools should stay. Feature keys that only gated UI tabs can be removed if no tool references them.**

### 5.5 The Empty State Becomes the Entry Point

When a reference page has no data yet, it should display a friendly empty state with a clear message and a command button that routes the user to Scooby in chat mode. Purpose: guide new users from "I have no data" to "let me create something with the AI." No blank tables or loading states — just an invitation to start.

---

## 6. Reference Page UI Overhaul

### 6.1 Kill the Uniform Layout

Not every page needs stat cards + table. Each surviving page should have a UI pattern suited to its specific data type and purpose. The implementation should deliver something visually distinctive and polished — these descriptions define the *purpose and constraints*, not the pixel-level layout.

**Transaktioner** → **Inbox pattern.** Purpose: triage unhandled transactions, scan handled ones. Unhandled items float to top with clear "action needed" state. Handled items below. Receipts (kvitton) appear as thumbnail attachments on their linked transactions. No stat cards — the count of unhandled items IS the stat. "Bokför" action is either inline (obvious categorization) or a command button to Scooby (ambiguous). Filter and search always available. OCR upload for new receipts.

**Fakturor** → **Kanban (keep as-is).** Purpose: visualize invoice lifecycle. Lifecycle columns (Utkast → Skickad → Betald → Förfallen) are essential. Already works well. No changes needed.

**Huvudbok** → **Inline-expansion ledger.** Purpose: browse the legal ledger of verifications. Each verification shows as a row with number, date, description, and total. Click to expand and see the debit/credit rows underneath — no separate details dialog needed. Sequential numbering visible at a glance (BFL compliance). Searchable. The most recent verification at top.

**Anställda / Team** → **Card grid (keep as-is).** Purpose: browse employee/partner roster. Card per person with drill-down to dossier. Already works well.

**Aktiebok & Styrning (AB)** → **Registry + timeline.** Purpose: show the share register and corporate governance in one view. Top section: shareholder cards showing name, share count, ownership %, role (VD/ordförande), and firmatecknare badge. Bottom section: event timeline of corporate actions (emissions, transfers, dividends, meetings). Command buttons at bottom for actions that route to Scooby (planera utdelning, överföra aktier, etc.).

**Händelser — Översikt** (new default tab, was "Arkiv") → **Calendar + activity dashboard.** Purpose: "what needs my attention today." Calendar with day-by-day activity feed (from old Arkiv), plus a Deadlines section (upcoming filing/payment deadlines), plus a "Dina planer" section showing active plan cards with progress bars (from deleted Canvas). Plan cards show title, X/Y steps done, last updated. Click a plan card → opens it as a walkthrough in chat.

**Händelser — Arkiv** (was "Översikt/Månadsavslut") → **Keep as-is.** Purpose: period closing workflow. The 12-month grid with checklists is unique and essential. Best UI in the app. Renamed to "Arkiv" because it's a historical status board of what's closed/open per month — archival by nature.

**Rapporter** → **Hub page (no tabs).** Purpose: a launch pad for generating reports + an archive of previously generated ones. Two sections: (1) quick-generate buttons for each report type, filtered by company type — tap one to navigate to chat where Scooby generates the report as a walkthrough with file export. (2) List of previously generated report snapshots with date, type, and "Visa" button to re-render. Needs a `generated_reports` table (or Supabase storage) to persist snapshots. No stat cards, no sub-tabs.

**Ägare (EF)** → **Single info card.** Purpose: show basic owner/company info. EF has no shares, no board, no meetings. The `EnskildFirmaOwnerInfo` component already handles this. No tabs needed — just the owner card with key details (org.nr, F-skatt, momsperiod, SNI) plus command buttons to Scooby for EF-specific actions (beräkna egenavgifter, visa NE-bilaga).

**Ägare (HB/KB)** → **Partner registry.** Purpose: show partners with profit-sharing percentages and firmatecknare status. No aktiebok (HB/KB have no shares — they have "andelar"). Partner cards with role (komplementär/kommanditdelägare for KB), vinstandel %, and firmatecknare badge. Event timeline below showing partnership events (vinstfördelning, bolagsavtal updates). Command buttons for partner actions (registrera uttag, beräkna egenavgifter). Single tab — no need for two.

**Ägare (Förening) — Tab 1: Medlemsregister.** Purpose: browsable legal member register (required per stadgar). Searchable list with name, status (aktiv/vilande/avslutad), role (ordförande/kassör/ledamot), and membership start date. Bulk actions for member management. Tab 2 is Möten & Beslut (same concept as AB but with årsmöte terminology instead of bolagsstämma).

### 6.2 Design Principles

1. **No stat cards unless the stat is actionable.** "3 att hantera" is actionable (click to handle). "Totalt: 245 st" is not — remove it.
2. **Inline expansion over dialogs.** Click a row to expand details in place. Don't open a modal.
3. **Unhandled items float to top.** Every list should separate "needs attention" from "handled."
4. **AI insights between sections.** If Scooby notices something ("Du har 2 förfallna fakturor"), show it as a subtle info card at the top of the page.
5. **Command buttons, not form dialogs.** Complex creation flows route to Scooby.

---

## 7. AI Flow: What Needs Fixing

### 7.1 Kill the Floating Overlay → Side Panel

**Current:** `AIOverlay` renders as a full-screen overlay on top of pages via `AnimatePresence`. When closed, output is lost (only in chat history).

**Fix:** Convert `AIOverlay` into a persistent side panel that:
- Lives alongside chat (like Claude's artifacts)
- Persists while the user continues chatting
- Can be dismissed or pinned
- Supports editing requests ("Ändra momsperioden")
- Only appears when there's a walkthrough/document to show

**Implementation:** The `WalkthroughRenderer` already handles 23 block types. Move it from overlay to a split-view panel next to the chat. When Scooby generates a walkthrough, the main area splits: chat on left, walkthrough on right.

### 7.2 Page Actions → Chat Commands

Every dialog that duplicates an AI tool should be replaced with a command button:

| Dialog | Replacement | AI Tool |
|---|---|---|
| `PayslipCreateDialog` | "Kör lönerna för [månad]" | `run_payroll` |
| `InvoiceCreateDialog` | "Skapa faktura till [kund]" | `create_invoice` |
| `SupplierInvoiceDialog` | "Registrera leverantörsfaktura" | OCR + `create_receipt` |
| `BookingDialog` (complex) | "Bokför [transaktion]" | `create_verification` |
| `MomsWizardDialog` | "Gör momsdeklarationen" | `submit_vat_declaration` |
| `K10WizardDialog` | "Beräkna K10" | `optimize_312` |
| `NewWithdrawalDialog` | "Registrera uttag" | `register_owner_withdrawal` |
| `RegisterDividendDialog` | "Planera utdelning" | Dividend tools |

**Keep as dialogs** (too simple for a conversation):
- `NewTransactionDialog` (3 fields)
- Quick inline actions (mark paid, categorize, delete)
- Settings dialogs

### 7.3 Context Injection When Navigating to Chat

When a command button sends the user to chat, it should carry rich context — not just a text prompt:

```typescript
// Current (too simple)
navigateToAI({
  pageName: "Fakturor",
  initialPrompt: "Skapa en ny kundfaktura",
  autoSend: false
})

// Better (rich context)
navigateToAI({
  pageName: "Fakturor",
  initialPrompt: "Skapa en ny kundfaktura",
  autoSend: false,
  sourceData: {
    // Pass relevant data so Scooby can pre-fill
    recentCustomers: ["Acme AB", "Kunden AB"],
    lastInvoiceNumber: 1024,
    defaultVatRate: 25,
    defaultPaymentTerms: 30
  },
  returnTo: "/dashboard/bokforing?tab=fakturor" // Where to go after completion
})
```

After Scooby completes the action, offer a "Tillbaka till Fakturor" button that navigates back with the new item highlighted.

### 7.4 Cross-Module Cascade Fixes

These are actual code bugs that break the "connected system" promise:

1. **Credit notes must create bookkeeping entries.** `POST /api/invoices/[id]/credit-note` creates the invoice record but doesn't call `pendingBookingService.createPendingBooking()`. Fix: add `createCreditNoteEntry()` call (the function exists in `src/lib/bookkeeping/`).

2. **Share transfers must create GL entries when money changes hands.** `shareholderService.transferShares()` updates aktiebok but posts nothing to the ledger. Fix: if `pricePerShare > 0`, create a pending booking with cash/equity entries.

3. **Dividend payments need a proper table and flow.** Currently stored as JSON in compliance documents. Fix: create `dividends` table, `POST /api/dividends/[id]/pay` endpoint, withholding tax posting (debit 2750, credit 2898).

4. **Vacation accrual must auto-post after payroll.** The AI tool `run_payroll` suggests it but doesn't create it. Fix: after payroll confirmation, automatically create a pending booking for 12% semesterlöneskuld.

5. **Month-close should auto-generate routine accruals.** The månadsavslut checklist is manual. Fix: when user clicks "Lås period", Scooby offers to auto-generate standard accruals (prepaid expenses, accrued liabilities).

### 7.5 Scooby Memory System

**Minimum viable memory:**

```typescript
// Per-company memory stored in Supabase
interface ScoobyMemory {
  company_id: string
  patterns: {
    key: string           // "booking_preference_office_supplies"
    value: string         // "Always uses 6110"
    confidence: number    // 0-1, increases with repetition
    last_seen: string     // ISO date
  }[]
  preferences: {
    key: string           // "communication_style"
    value: string         // "expert, skip basics"
  }[]
}
```

**How it works:**
1. After each conversation, extract patterns (Scooby does this via a post-conversation summarization tool)
2. Store in Supabase with company scope
3. Inject into system prompt when relevant (via `buildSystemPrompt()`)
4. Patterns decay if not seen for 90 days

**Priority patterns to learn:**
- Preferred accounts for common expenses
- Communication style (beginner vs expert)
- Company-specific workflows (momsperiod, fiscal year, payroll schedule)
- Frequently asked questions and their answers

---

## 8. Implementation Roadmap

Five phases. Each phase is independently shippable — users get value at every step. Total: 5 categories, 9-10 tabs (varies by company type), 22+ walkthroughs, 20+ Quick Actions, 8+ inline card types.

### Phase 1: Core Flow Unification (Week 1-2)

**Goal:** AI becomes the primary way to DO things. Side panel replaces overlay. Command buttons replace wizard dialogs.

- [ ] Convert `AIOverlay` from floating modal to persistent side panel (alongside chat, like Claude artifacts)
- [ ] Side panel: persists while chatting, supports "Ändra..." edits, can be pinned or dismissed
- [x] Replace wizard dialogs with command buttons → chat: `MomsWizardDialog`, `K10WizardDialog`, `InkomstWizardDialog`, `ArsredovisningWizardDialog`, `NewWithdrawalDialog`, `RegisterDividendDialog` *(deleted 2026-03-10, replaced with navigateToAI())*
- [ ] Replace `PayslipCreateDialog` and `InvoiceCreateDialog` with command buttons → chat
- [ ] Add `returnTo` in `PageContext` so users navigate back after AI action with item highlighted
- [x] Keep simple dialogs (≤3 fields): `NewTransactionDialog`, inline actions (mark paid, categorize), `VerifikationDetailsDialog` *(already kept, no changes needed)*
- [x] Build `QuickActionsMenu` component — ⚡ button + `/` trigger in chat input, searchable dropdown *(built 2026-03-10)*
- [x] Create `quick-actions.ts` config with ~20 actions, filtered by company type + feature flags *(22 actions, 5 categories)*
- [x] `useQuickActions()` hook with fuzzy search (matches Swedish + English) *(built 2026-03-10)*
- [x] Build Scooby markdown memory — `scooby_memory` text column in Supabase + `read_memory` / `update_memory` tools *(already existed: user_memory table + query_memories + add_memory tools)*
- [x] Inject memory into system prompt on every request (~500-1000 tokens) *(wired 2026-03-10: route.ts → userMemoryService → context.sharedMemory.userMemories → formatUserMemory())*

### Phase 2: Category Consolidation (Week 2-3)

**Goal:** Reduce from 33+ tabs to 9-11 (company-type adaptive). All 5 categories stay.

**Händelser (3 → 2 views):**
- [x] Delete Canvas tab and `CanvasView` component — plans become AI walkthroughs *(deleted 2026-03-10)*
- [x] Swap tab content: Översikt = old Arkiv content (calendar + daily activity feed), Arkiv = old Översikt content (månadsavslut grid)
- [x] Move Deadlines section from old Översikt to new Översikt
- [x] Add "Dina planer" section to new Översikt — active plan cards from `roadmaps` table with progress bars
- [x] Update `events-page.tsx` viewTabs array (2 tabs: Översikt + Arkiv)

**Bokföring (5 → 3 tabs):**
- [x] Merge Kvitton into Transaktioner (receipts as thumbnail attachments on transactions)
- [x] Rename Verifikationer to Huvudbok
- [x] Convert Inventarier to AI walkthrough
- [x] Update `accounting-page.tsx` allTabs array *(3 tabs: transaktioner, fakturor, verifikationer/huvudbok)*

**Rapporter (9 → 0 tabs, becomes hub):**
- [x] Build Rapporter Hub page: generate buttons (filtered by company type) + saved reports archive
- [ ] Create `generated_reports` table in Supabase for report snapshots
- [x] Convert all 9 report tabs to AI walkthroughs (Resultaträkning, Balansräkning, Moms, INK, AGI, Årsredovisning, Årsbokslut, K10, Egenavgifter)
- [x] Delete all tab content components from `src/components/rapporter/` *(report content components kept for walkthrough rendering, but tab rendering removed)*
- [x] Delete `reports-page.tsx` allTabs array (no sub-tabs) *(hub page with no tabs)*

**Löner (4 → 2 tabs):**
- [x] Convert Förmåner to AI walkthrough
- [x] Convert Delägaruttag to AI walkthrough (HB/KB only)
- [x] Keep Löneöversikt + Team
- [x] Update `payroll-page.tsx` allTabs array *(2 tabs: lonebesked, team)*

**Ägare (8 → 1-2 tabs, company-type adaptive):**
- [x] AB: Aktiebok & Styrning (shares + firmatecknare merged) + Möten & Beslut (stämma + protokoll)
- [x] EF: Ägarinfo single card (no tabs)
- [x] HB/KB: Delägare (partners + firmatecknare merged)
- [x] Förening: Medlemsregister + Möten & Beslut (stämma + årsmöte + protokoll)
- [x] Convert Utdelning, Firmatecknare, standalone Ägarinfo to walkthroughs/merges
- [x] Update `ownership-page.tsx` allTabs array per company type *(tabsByCompanyType map)*

**Cleanup:**
- [x] Delete ~15 dead tab components (see Section 5.4.1) *(lazy loaders cleaned 2026-03-10)*
- [x] Delete ~6 wizard dialogs (see Section 5.4.2) *(7 wizard files deleted 2026-03-10)*
- [x] Delete lazy loaders for deleted components *(15 lazy loaders removed from lazy-loader.tsx 2026-03-10)*
- [x] Update sidebar navigation to reflect new structure
- [x] Update page nav badges on empty chat state

### Phase 3: UI Overhaul + Inline Cards (Week 3-4)

**Goal:** Each surviving page gets a unique UI. Tool results render as inline cards in chat.

**Page UIs:**
- [x] Transaktioner: inbox pattern (unhandled float to top, receipts as attachments, OCR upload)
- [x] Fakturor: keep kanban (already good)
- [x] Huvudbok: inline-expansion ledger (click row to see debit/credit, no details dialog)
- [x] Team: keep card grid (already good)
- [x] Aktiebok & Styrning (AB): shareholder cards + corporate event timeline + firmatecknare badges
- [ ] Delägare (HB/KB): partner cards with vinstandel % + firmatecknare badges (Partially done: merged with Aktiebok logic)
- [ ] Medlemsregister (Förening): searchable member list with roles + status
- [x] Rapporter Hub: generate buttons + report archive list
- [x] Händelser tab swap: Översikt = calendar + activity + deadlines + plans (old Arkiv content + new), Arkiv = månadsavslut grid (old Översikt content)
- [x] Build "Dina planer" section on Översikt — active plan cards from `roadmaps` table with progress bars
- [x] Empty states on all pages: friendly message + command button to Scooby
- [ ] AI insight cards at top of pages when Scooby notices something

**Inline Result Cards:**
- [x] Build `CardShell.tsx` — shared styling (border, status badge, action bar)
- [x] Build 8 card components: `InvoiceCard`, `VerificationCard`, `PayrollCard`, `ReceiptCard`, `ReportCard`, `VATCard`, `DividendCard`, `TransactionCard`
- [x] Add `inline_card` to `MessageDisplay` union in `chat-types.ts`
- [x] Wire `D:{"type":"inline_card",...}` streaming protocol
- [x] Render cards in `MessageBubble` after text content
- [x] Card actions: command buttons dispatch to `handleSend()`, navigation links use `router.push()` with item highlighting

**Dynamic Empty-State Suggestions:**
- [x] Build `GET /api/dashboard/suggestions` endpoint *(built client-side: time-aware suggestions in SuggestionChips component, no API needed)*
- [x] Build `useDashboardSuggestions()` hook (fetch on mount, cache 5 min) *(built as useMemo in SuggestionChips — time-based + defaults)*
- [x] Build `SuggestionChips` component with priority coloring (red/orange/blue/grey) *(built 2026-03-10)*
- [x] Replace static category badges in MainContentArea empty state *(SuggestionChips above smaller page nav badges)*

### Phase 4: Cross-Module Fixes + Search (Week 4-5)

**Goal:** The system behaves as one connected application. Users can find anything.

**Cascade Fixes:**
- [x] Credit note → bookkeeping entry: wire `createCreditNoteEntry()` into `POST /api/invoices/[id]/credit-note` *(already wired — existed before Phase 4)*
- [x] Share transfer → GL entry: create pending booking when `pricePerShare > 0` *(2026-03-10: auto-creates verification 1310↔1930)*
- [x] Dividends: create `dividends` table + `POST /api/dividends/[id]/pay` + withholding tax posting (debit 2750, credit 2898) *(2026-03-10: register_dividend tool now creates 2098→2898 + kupongskatt 2898→2750)*
- [x] Vacation accrual: auto-create 12% semesterlöneskuld pending booking after `run_payroll` *(2026-03-10: auto-creates verification 7090↔2920)*
- [ ] Month-close: offer auto-generated routine accruals when user clicks "Lås period"
- [ ] Ensure every AI write tool cascades to all related modules

**Search:**
- [x] Build `SearchDialog` component (Cmd+K trigger) — searches across transactions, invoices, verifications, employees, conversations *(2026-03-10: rewritten with useSearch hook)*
- [x] Unified search index or parallel queries across entity types *(2026-03-10: GET /api/search with Promise.allSettled)*
- [x] Results grouped by category with click-to-navigate *(2026-03-10: grouped by entity type with icons)*

### Phase 5: Filing Gaps + Intelligence (Week 5-7)

**Goal:** All 5 company types can complete yearly declarations. Scooby gets smarter over time.

**Filing Gaps (Priority Order):**
- [ ] Wire iXBRL generator into årsredovisning walkthrough with download button (AB, Förening)
- [ ] Build NE-bilaga SRU generator for EF (field code mapping from resultaträkning)
- [ ] Build INK4 + INK4R + INK4S + INK4DU SRU generator for HB/KB
- [ ] Build N3A per-partner SRU generator for HB/KB (physical person partners)
- [ ] Make Inkomstdeklaration walkthrough company-type-aware (INK2 vs NE vs INK4)

**Scooby Intelligence:**
- [ ] Post-conversation summary via GPT-5 Nano (2-3 lines, stored on conversation)
- [ ] Background weekly pattern extraction from summaries → memory updates
- [ ] Memory condensation when exceeding 200 lines
- [ ] "Scooby remembers" subtle indicator in chat when memory is used
- [ ] Context window management: auto-clear old tool results, keep summaries

---

## 9. Quick Reference — What Stays, What Goes

This is the concise decision table. For the full company-type breakdown, see Section 5.2. For dead code cleanup details, see Section 5.4.

### Pages That STAY (Reference Views)

| Page | Company Types | Why |
|---|---|---|
| Transaktioner (with kvitton merged) | All | Inbox — triage unhandled transactions |
| Fakturor | All | Kanban — invoice lifecycle visualization |
| Huvudbok | All | Legal ledger — BFL-required browsable register |
| Löneöversikt | All | Payslip history + run overview |
| Team | All | Employee/partner roster |
| Översikt (Händelser) | All | Calendar + daily activity + deadlines + active plans |
| Arkiv (Händelser) | All | Månadsavslut 12-month grid — period closing workflow |
| Rapporter (hub, no sub-tabs) | All | Launch pad for AI-generated reports + archive of saved ones |
| Aktiebok & Styrning | AB | Share register + firmatecknare — ABL compliance |
| Möten & Beslut | AB, Förening | Meeting protocols — legal paper trail |
| Ägarinfo (single card) | EF | Basic owner/company info |
| Delägare | HB, KB | Partner registry + firmatecknare |
| Medlemsregister | Förening | Legal member register — required per stadgar |

### Pages That GO (Become AI Walkthroughs)

| Former Page | Why It Goes |
|---|---|
| Canvas | Plans are AI walkthroughs — accept saves to DB, decline = no write. Saved plans show on Översikt. |
| All 9 Rapporter tabs | Reports are generated artifacts, not browsable data |
| Inventarier | Simple registry — AI manages it via conversation |
| Förmåner | Configuration — AI assigns benefits |
| Delägaruttag | Simple form (amount + date + partner) — AI conversation |
| Utdelning | Calculator with 3:12 rules — AI walkthrough |
| Firmatecknare | Merged into parent tab (Aktiebok/Delägare) |
| Årsmöte | Merged into Möten & Beslut |
| Ägarinfo (non-EF) | Walkthrough or section within company profile |

### Dialogs That GO → Chat Commands

| Dialog | Replacement |
|---|---|
| `MomsWizardDialog` | ⚡ "Gör momsen" |
| `K10WizardDialog` | ⚡ "Beräkna K10" |
| `InkomstWizardDialog` | ⚡ "Gör inkomstdeklarationen" |
| `ArsredovisningWizardDialog` | ⚡ "Skapa årsredovisningen" |
| `NewWithdrawalDialog` | ⚡ "Registrera uttag" |
| `RegisterDividendDialog` | ⚡ "Planera utdelning" |
| `PayslipCreateDialog` | ⚡ "Kör lönerna" |
| `InvoiceCreateDialog` | ⚡ "Skapa faktura" |

### Dialogs That STAY

| Dialog | Why |
|---|---|
| `NewTransactionDialog` | Quick 3-field form, faster than conversation |
| `BookingDialog` | Complex double-entry — some users prefer the form |
| `SupplierInvoiceDialog` | OCR upload flow — may stay as quick uploader |
| `MonthReviewDialog` | Månadsavslut checklist — unique workflow |
| `VerifikationDetailsDialog` | Read-only detail view |
| Inline actions (mark paid, categorize, delete) | One-click, no conversation needed |
| Settings dialogs | Configuration, not workflow |

---

## 10. The End State

User opens Scope AI. They see Scooby's greeting and a chat input. They type:

> "Kör lönerna för mars"

Scooby responds with a walkthrough: employee breakdown, tax calculations, total cost. Side panel shows the payslip preview. User confirms. Done.

> "Hur ser resultaträkningen ut?"

Scooby renders a financial-table walkthrough inline. Highlights that costs are up 12%. Offers: "Vill du att jag gräver djupare i kostnadsökningen?"

> "Visa mina obehandlade transaktioner"

Scooby shows a quick entity-rows walkthrough with the 3 pending transactions. Or user clicks the "Bokföring" badge and goes to the reference page to scan the inbox.

> "Stäng februari"

Scooby checks: all transactions booked, no discrepancies, VAT filed. Shows a status-check walkthrough. "Allt ser bra ut. Vill du låsa perioden?" User confirms. Done.

The pages exist for browsing. The AI exists for doing. They connect through command buttons and context injection. Scooby remembers your patterns and gets better over time.

That's the app the founder described.

---

## 11. Making the AI Smarter — Context Engineering

### 11.1 The Problem: Context Window Bloat

The current Scooby architecture loads everything upfront:

```
System prompt (instincts):        ~500 tokens
Scenarios (few-shot examples):  ~10,000 tokens
Company context:                 ~2,000 tokens
Tool definitions (60+ tools):  ~40,000 tokens (60 × ~600 tokens each)
─────────────────────────────────────────────
TOTAL before user speaks:       ~52,000 tokens
```

On a 200K context window, that's 25% burned before the conversation starts. As the conversation grows, tool definitions + scenarios crowd out the actual work. This is **context rot** — the model's attention dilutes across too many tokens, and accuracy drops.

Anthropic's own testing shows: with 50+ tools loaded upfront, Opus 4 scores **49% accuracy**. With Tool Search (loading tools on demand), it jumps to **74%**. Opus 4.5 goes from 79.5% to 88.1%. Less in context = better performance.

### 11.2 Three Patterns from Anthropic (Official)

#### Pattern 1: Tool Search Tool (defer_loading)

Instead of loading all 60+ tools, load 5-8 core tools + a `search_tools` meta-tool. Everything else is marked `defer_loading: true` and discovered on demand.

**Always loaded (~3,000 tokens):**
- `search_tools` — finds other tools by keyword/regex
- `get_company_info` — Scooby always needs company context
- `create_verification` — the most common write action
- `navigate_to_page` — for page navigation
- `get_knowledge` — for accounting rules reference

**Deferred (~37,000 tokens saved):**
- All 30+ bokforing tools (loaded when user asks about accounting)
- All 10+ loner tools (loaded when user asks about payroll)
- All skatt tools (loaded when user asks about tax)
- All parter tools (loaded when user asks about ownership)
- All planning tools (loaded when user asks about roadmap)

When user says "kör lönerna", Scooby calls `search_tools("payroll löner")`, finds `run_payroll`, loads its definition, and uses it. **3-5 tools loaded per query instead of 60+.**

**Result: 85% reduction in tool token overhead.**

Source: [Advanced Tool Use — Anthropic](https://www.anthropic.com/engineering/advanced-tool-use)

#### Pattern 2: Programmatic Tool Calling

For multi-step workflows, instead of Scooby doing 19 sequential tool calls (each adding results to context), it writes Python code that orchestrates the calls. Intermediate results stay in the code execution environment — only the final summary enters context.

**Example — "Visa alla förfallna fakturor och matcha mot transaktioner":**

Current: 19+ inference passes, all 50 transactions + 15 invoices in context.

With programmatic calling:
```python
invoices = await get_invoices(status="overdue")
transactions = await get_transactions(month=3)
matches = []
for inv in invoices:
    for tx in transactions:
        if abs(tx.amount) == inv.total and fuzzy_match(tx.name, inv.customer):
            matches.append({"invoice": inv.id, "transaction": tx.id, "amount": inv.total})
return {"matched": len(matches), "unmatched": len(invoices) - len(matches), "details": matches}
```

Scooby sees the 3-line summary. Not the 65 raw records.

**Result: 37% token reduction on complex tasks, eliminates 19+ inference passes.**

Source: [Advanced Tool Use — Anthropic](https://www.anthropic.com/engineering/advanced-tool-use)

#### Pattern 3: Agent Skills (Progressive Disclosure)

The scenarios file (~10K tokens) and accounting knowledge don't need to live in the system prompt. They become **Skills** — folders with tiered content that loads progressively.

```
skills/
├── bokforing/
│   ├── SKILL.md              ← Level 2: "How to handle bookkeeping" (~500 tokens)
│   ├── scenarios.md           ← Level 3: Detailed examples (loaded on demand)
│   └── bas-kontoplan.md       ← Level 3: Account reference (loaded on demand)
├── loner/
│   ├── SKILL.md              ← Level 2: "How to handle payroll"
│   └── tax-tables.md         ← Level 3: SKV tables (loaded on demand)
├── skatt/
│   ├── SKILL.md              ← Level 2: "How to handle tax"
│   └── k10-rules.md          ← Level 3: 3:12 rules (loaded on demand)
└── agare/
    ├── SKILL.md              ← Level 2: "How to handle governance"
    └── abl-rules.md          ← Level 3: ABL compliance (loaded on demand)
```

**Level 1 (always loaded):** Just skill names + one-line descriptions (~200 tokens)
**Level 2 (loaded when triggered):** Full SKILL.md with domain instructions (~500-1000 tokens)
**Level 3 (loaded on demand):** Reference files like tax tables, account plans (~2-5K tokens)

**Result: System prompt goes from 52K to ~5K tokens. 90% reduction.**

Source: [Agent Skills — Anthropic](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills)

### 11.3 Target Architecture

```
System prompt (slim instincts):     ~500 tokens
Skill metadata (names only):        ~200 tokens
Company context (slim):           ~1,500 tokens
Core tools (5-8 always loaded):  ~3,000 tokens
search_tools meta-tool:             ~200 tokens
─────────────────────────────────────────────
TOTAL before user speaks:         ~5,400 tokens  (down from 52K)
```

Then on demand per query:
- Tool Search loads 3-5 relevant tools: ~2,000 tokens
- Skill loads relevant instructions: ~1,000 tokens
- Programmatic calling keeps intermediate results out

### 11.4 Prompt Philosophy

From the official Claude 4.6 docs:

> "If your prompts were designed to reduce undertriggering on tools, these models may now overtrigger. The fix is to **dial back any aggressive language**. Where you might have said 'CRITICAL: You MUST use this tool when...', you can use more normal prompting like 'Use this tool when...'"

> "**Prefer general instructions over prescriptive steps.** A prompt like 'think thoroughly' often produces better reasoning than a hand-written step-by-step plan."

From context engineering:

> "Find the **smallest possible set of high-signal tokens** that maximize the likelihood of some desired outcome."

**What this means for Scooby's system prompt:**
- The core instincts (~500 tokens) are good — keep them but soften the language
- The scenarios (~10K tokens) should become a Skill, not inline in system prompt
- Tool descriptions should be keyword-rich but brief — the model knows accounting
- Stop over-specifying. The model is trained on millions of accounting conversations. Give it tools and context, not a script.

### 11.5 Tool Design Best Practices (From Anthropic)

**Consolidate related operations:**
Instead of `get_transactions`, `get_invoices`, `get_receipts` as separate read tools, consider a unified `query_accounting_data(type, filters)` that handles all read queries. Fewer tools = less confusion for the model.

**Return high-signal responses:**
Don't return raw database rows with UUIDs and timestamps. Return semantic data: names, amounts, status labels. Truncate at 25K tokens and guide toward targeted searches.

**Expose a ResponseFormat parameter:**
Let Scooby request `"concise"` (just summaries) or `"detailed"` (full records with IDs for chaining). Concise for exploration, detailed for action.

**Actionable error messages:**
Instead of `{ error: "INVALID_ACCOUNT" }`, return `{ error: "Account 9999 not found. Did you mean 6110 (Kontorsmaterial) or 6100 (Övriga försäljningskostnader)? Use get_accounts to search." }`

**Use tool examples for ambiguous cases:**
Add 1-3 `input_examples` showing realistic usage. Anthropic saw accuracy go from 72% to 90% with examples on ambiguous tools.

Source: [Writing Effective Tools for AI Agents — Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents)
Source: [Claude 4.6 Best Practices — Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

### 11.6 Memory Tool

Anthropic's official memory implementation (`memory_20250818`) is a file-based persistent memory system. The AI gets a tool with 4 operations: `view`, `create`, `str_replace`, `delete`. It reads/writes to a markdown file that persists across sessions. The AI decides what to remember and how to organize it.

**How it works:**
- The memory file is always included in the system prompt (or loaded on demand)
- The AI writes memories semantically organized by topic, not chronologically
- Memories are condensed — only stable patterns, not session-specific details
- The AI can update or remove outdated memories

**What to remember:** User preferences, recurring patterns, company-specific rules, corrections, workflow habits.
**What NOT to remember:** Session-specific context, temporary state, unverified conclusions.

**For Scope AI:**
A `scooby_memory` table (or markdown file per company) where Scooby stores:
- "Företaget bokför kontorsmaterial på 6110"
- "Användaren föredrar korta sammanfattningar"
- "Momsperiod: kvartal, nästa deadline 12 maj"
- "Delägare: Anna 60%, Erik 40%"

The memory file stays under ~200 lines (truncated beyond that). Scooby reads it at conversation start and updates it when learning something new.

Source: [Anthropic Memory Tool](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/built-in-tools#memory)

### 11.7 Think Tool

A structured reasoning pause between tool calls. The AI gets a `think` tool that takes a single `thought` parameter. It doesn't execute anything — it just gives the model space to reason before acting.

**Why it matters:**
- In complex multi-step tasks (like month-close), the model needs to plan which tools to call and in what order
- Without a think step, models tend to rush into the first tool call and lose track of the bigger picture
- Anthropic measured **54% improvement** in complex policy environments with the think tool

**For Scope AI:**
Add `think` as a lightweight tool (~50 tokens in the tool list). Scooby uses it before complex operations:
```
think("User wants to close March. I need to: 1. Check all pending bookings, 2. Run vacation accrual, 3. Verify sequential numbering, 4. Lock the period. Let me start with pending bookings.")
```

Source: [Extended Thinking — Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)

### 11.8 Structured Outputs

JSON schema constraints on tool parameters with `strict: true`. The model literally cannot produce invalid tool input — the output is grammar-constrained at the token generation level.

**Why it matters:**
- Eliminates "hallucinated parameter" errors (e.g., passing `account: "expenses"` instead of `account: 6110`)
- No need for client-side validation or retry loops
- Works with OpenAI too (`response_format: { type: "json_schema", schema: ... }`)

**For Scope AI:**
All 60+ tools should use strict schemas. Especially critical for:
- Account numbers (enum of valid BAS accounts)
- Date formats (ISO 8601 pattern)
- Amount fields (number, not string)
- Status enums ("draft" | "sent" | "paid", not freeform)

Source: [Structured Outputs — OpenAI](https://platform.openai.com/docs/guides/structured-outputs)

### 11.9 Context Editing (Auto-Clear Old Tool Results)

As context approaches the limit, automatically clear old tool results while keeping the conversation flow. The model sees "Tool result cleared — summary: found 47 overdue invoices totaling 234,000 SEK" instead of the full 47-row JSON.

**How it works:**
- Track context window usage
- When approaching threshold (e.g., 80%), replace old tool results with one-line summaries
- Keep the most recent 2-3 tool results intact
- Conversation text stays — only raw tool data gets cleared

**For Scope AI:**
The streaming parser already tracks message history. Add a context budget check before each API call. If approaching limit, summarize old tool results in the message array before sending.

Source: [Context Window Management — Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/context-windows)

### 11.10 Code Execution with MCP (Model Context Protocol)

MCP lets AI models discover and use tools through a filesystem-based protocol. Instead of hardcoding 60+ tools in the system prompt, tools are served by MCP servers that the model queries on demand.

**Why it matters:**
- Tools live outside the context window until needed
- New tools can be added without changing the system prompt
- Tool servers can be shared across different AI providers (OpenAI, Anthropic, etc.)
- Combined with code execution: the AI writes code that calls MCP tools, and only the result enters context

**For Scope AI (future):**
This is the end-state architecture. Each domain (bokföring, löner, skatt, ägare) becomes an MCP server. Scooby discovers tools via the Tool Search pattern (11.1) and calls them via programmatic execution (11.2). Current priority is lower — implement Tool Search and Skills first.

Source: [Model Context Protocol — Anthropic](https://modelcontextprotocol.io/)

### 11.11 Hooks (Pre/PostToolUse Callbacks)

Shell commands that execute in response to tool events, running outside the AI context window (zero token cost). Can replace confirmation flows for trusted operations.

**How it works:**
- `PreToolUse` hook runs before a tool executes — can block, modify, or auto-approve
- `PostToolUse` hook runs after — can log, notify, or trigger follow-up actions
- Hooks are defined in config, not in the system prompt — invisible to the AI

**For Scope AI:**
The current 2-stage confirmation flow (preflight → user confirms → execute) adds a full round-trip per tool call. For trusted, low-risk operations (read queries, report generation), hooks could auto-approve. For destructive operations (book transaction, delete invoice), the hook shows a native confirmation dialog.

This reduces the "confirmation fatigue" where users click approve on every single query.

### 11.12 Tool Consolidation

Merge related tools into fewer, more powerful tools with a `type` or `action` parameter. Fewer tools = less confusion for the model, less context window usage.

**Current state:** 60+ individual tools
**Target:** ~20-25 consolidated tools

| Before | After |
|--------|-------|
| `get_transactions`, `get_invoices`, `get_receipts`, `get_verifications` | `query_data(type: "transactions" \| "invoices" \| ...)` |
| `create_invoice`, `void_invoice`, `send_invoice`, `create_credit_note` | `manage_invoice(action: "create" \| "void" \| "send" \| "credit")` |
| `get_balance_sheet`, `get_income_statement`, `get_trial_balance` | `get_report(type: "balance" \| "income" \| "trial")` |
| `create_employee`, `update_employee`, `run_payroll` | `manage_payroll(action: "add_employee" \| "update" \| "run")` |

**Rule of thumb:** If 3+ tools share the same domain and return similar data shapes, consolidate them.

Source: [Writing Effective Tools — Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents)

### 11.13 Subagent Pattern

Delegate focused subtasks to fresh-context subagents. Only the summary returns to the main conversation — intermediate tool calls and raw data stay in the subagent's context.

**How it works:**
1. Main agent receives complex request ("Gör månadsavslut för mars")
2. Main agent spawns subagent: "Check all pending bookings for March and return a summary"
3. Subagent makes 5-10 tool calls, processes data, returns: "47 pending items: 12 auto-bookable, 35 need review. Total: 234,000 SEK"
4. Main agent sees only the summary, plans next step

**Why it matters:**
- Each subagent gets a fresh context window — no accumulated noise
- Complex operations that would eat 50K+ tokens in one context now use 5K in the main context
- Subagents can run in parallel (e.g., check bookings + check accruals + check numbering simultaneously)

**For Scope AI:**
Month-close is the perfect candidate. Instead of Scooby making 20+ tool calls in one conversation:
```
Main:    "Stäng mars"
  → Sub1: Check pending bookings → "12 items ready"
  → Sub2: Run accrual check → "Semester: 45,200 SEK to accrue"
  → Sub3: Verify numbering → "Gap-free A1-A347"
Main:    "Allt ser bra ut. Ska jag låsa perioden och bokföra upplupna kostnader?"
```

Source: [Multi-Agent Orchestration — Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/agentic-systems)
Source: [Context Engineering — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

---

## 12. Model Migration — GPT-4o → GPT-5 Family

### 12.1 Why We're Migrating

OpenAI sunset GPT-4o from ChatGPT on **February 13, 2026**. API deprecation is in progress. The GPT-4o and GPT-4o-mini models we currently use will be fully retired. The replacement is the GPT-5 family, which is both more capable and cheaper.

### 12.2 Pricing Comparison (per 1M tokens)

| Model | Input | Output | Role |
|-------|-------|--------|------|
| **GPT-5 Nano** | $0.05 | $0.40 | Simple queries, routing, classification |
| **GPT-5 Mini** | $0.25 | $2.00 | Tool calling, medium complexity |
| **GPT-5 / 5.1** | $1.25 | $10.00 | Complex reasoning, multi-step tasks |
| **GPT-5.2** | $1.75 | $14.00 | Frontier — strongest model |
| | | | |
| *Claude Haiku 4.5* | *$1.00* | *$5.00* | *Reference — 4x more than GPT-5 Mini* |
| *Claude Sonnet 4.6* | *$3.00* | *$15.00* | *Reference — 2.4x more than GPT-5.1* |

**Decision: Stay on OpenAI.** GPT-5 Mini at $0.25/$2.00 is cheaper than Claude Haiku at $1/$5. GPT-5.1 at $1.25/$10 is cheaper than Sonnet at $3/$15. Claude's memory tool is nice but trivial to build ourselves (it's just a markdown file + a tool).

### 12.3 New 3-Tier Model Routing

```
Old:  GPT-4o-mini (simple) → GPT-4o (complex)
New:  GPT-5 Nano (simple)  → GPT-5 Mini (medium) → GPT-5.1 (complex)
```

| Tier | Model | When | ~% of Traffic |
|------|-------|------|---------------|
| **Nano** | `gpt-5-nano` | Greeting, classification, simple Q&A, memory updates | 50% |
| **Mini** | `gpt-5-mini` | Tool calling (1-3 tools), standard bookkeeping, invoice creation | 40% |
| **Full** | `gpt-5.1` | Multi-step reasoning, month-close, complex analysis, walkthrough generation | 10% |

**Estimated cost savings: 60-70%** compared to old GPT-4o setup.

### 12.4 Migration Checklist

- [ ] Update `selectModel()` in `src/lib/agents/scope-brain/` to route across 3 tiers
- [ ] Replace `gpt-4o-mini` references with `gpt-5-nano`
- [ ] Replace `gpt-4o` references with `gpt-5-mini` (default) and `gpt-5.1` (complex)
- [ ] Update `DEFAULT_MODEL_ID` in `src/lib/ai/models.ts`
- [ ] Test tool calling accuracy with GPT-5 Mini (should be equal or better than 4o)
- [ ] Update the GET handler in `src/app/api/chat/route.ts` (currently says "GPT-4o")
- [ ] Add GPT-5 Nano's 90% cached input discount ($0.005/M) — system prompt + tools are identical every request

### 12.5 Cost Projection

At ~1000 requests/day (70% Nano, 25% Mini, 5% Full), ~1000 output tokens avg:

| Tier | Requests/day | Output cost/day | Monthly |
|------|-------------|-----------------|---------|
| Nano (700 req × 500 tok) | 700 | $0.14 | $4.20 |
| Mini (250 req × 1500 tok) | 250 | $0.75 | $22.50 |
| Full (50 req × 3000 tok) | 50 | $1.50 | $45.00 |
| **Total** | **1000** | **$2.39** | **~$72/mo** |

Compare to old GPT-4o setup: ~$200/mo for the same traffic. **64% reduction.**

---

## 13. AI Memory — Implementation Plan

### 13.1 Core Insight

Memory is just a tool. A markdown file that the AI reads at conversation start and writes to when it learns something new. That's how ChatGPT does it, how Claude does it, and how every production memory system works under the hood. No vector database, no graph store, no embeddings needed for Phase 1.

### 13.2 How The Big Players Do It

**ChatGPT (OpenAI):** A list of short facts extracted from conversations. Injected into every prompt as bullet points. User can view/delete individual memories. No RAG, no vector DB — just text.

**Claude (Anthropic):** Memory tool writes to a markdown file organized by topic. AI decides what to store. File included in system prompt, capped at ~200 lines.

**Mem0 (open source):** Hybrid storage — vector DB + graph DB. Automatic extraction. Claims 26% better quality than OpenAI. But requires additional infrastructure (Qdrant + Neo4j). Overkill for now.

**Letta/MemGPT:** Three-tier self-editing memory (core/archival/recall). Agent explicitly manages its own memory via tool calls. Powerful but complex.

**Zep:** Temporal knowledge graph — facts have valid_at/invalid_at dates. Good for accounting (things change over time). Also overkill for Phase 1.

### 13.3 Scope AI Memory Architecture

**Phase 1 — Simple Markdown Memory (build now):**

Add a `scooby_memory` text column to the company table in Supabase. Give Scooby two tools:

```
read_memory()   → returns the markdown memory file
update_memory(section, content)  → AI rewrites a specific section
```

Memory injected into system prompt on every request (~500-1000 tokens). At GPT-5 Nano rates, that's $0.00003 per request — essentially free.

**What the memory file looks like:**
```markdown
# Företagsprofil
- AB, momsperiod: kvartal
- Bransch: IT-konsulting
- Delägare: Anna 60%, Erik 40%

# Bokföringspreferenser
- Kontorsmaterial → 6110
- Representation → 6071
- Hyra: Fastighets AB 15,000 kr/mån → 5010

# Återkommande mönster
- Telia 899 kr/mån → 6212
- Lönedag: 25:e varje månad
- Föredrar att bokföra på måndagar

# Tonfall
- Korta svar, inte långa förklaringar
- Svenska med engelska facktermer ok
```

**Phase 2 — Conversation Summaries (build later):**
When a conversation ends, ask GPT-5 Nano to summarize it in 2-3 lines. Store on conversation record. Use summaries when loading old chats or when user asks "vad pratade vi om förra veckan?"

**Phase 3 — Automatic Pattern Extraction (build much later):**
Background job runs weekly: "Review the last 20 conversation summaries. Extract any new stable patterns or preferences. Update the memory file." Uses GPT-5 Nano — costs fractions of a cent.

### 13.4 Memory Condensation Strategy

When memory exceeds 200 lines (~2000 tokens), trigger condensation:
1. Send full memory to GPT-5 Nano with prompt: "Condense this memory file. Keep the most important facts. Remove redundancy. Target: under 150 lines."
2. Replace the memory file with the condensed version
3. Cost: ~$0.001 per condensation

### 13.5 Memory Tool Design

```typescript
// Tool: scooby_memory
{
  name: "scooby_memory",
  description: "Read or update Scooby's persistent memory for this company",
  parameters: {
    action: "read" | "update" | "delete_section",
    section: string,      // e.g. "Bokföringspreferenser"
    content: string,      // new content for the section (update only)
  }
}
```

The AI decides what to remember. No automatic extraction needed in Phase 1 — Scooby simply writes when it learns something useful.

Sources:
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [GPT-5 Nano Pricing](https://gptbreeze.io/blog/gpt-5-nano-pricing-guide/)
- [GPT-5.2 Model](https://platform.openai.com/docs/models/gpt-5.2)
- [Retiring GPT-4o — OpenAI](https://openai.com/index/retiring-gpt-4o-and-older-models/)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Mem0 Docs](https://docs.mem0.ai/open-source/features/graph-memory)
- [Letta Memory Management](https://docs.letta.com/advanced/memory-management/)
- [ChatGPT Memory Reverse Engineered](https://manthanguptaa.in/posts/chatgpt_memory/)
- [Zep Temporal Knowledge Graph](https://arxiv.org/abs/2501.13956)

---

## 14. Quick Actions Menu (/ Commands as GUI)

### 14.1 The Concept

Every great AI wrapper has a way to trigger pre-made actions without typing from scratch. Claude Code has `/commands`, ChatGPT has `@mentions` and GPT actions, Raycast has its command palette. Scope AI needs the same — but as a visual GUI element since we're a web app, not a CLI.

The **⚡ Quick Actions** button lives in the chat input toolbar. Tap it (or type `/`) and a searchable dropdown appears with categorized actions.

### 14.2 UI & Interaction

The ⚡ button in the chat toolbar (next to 📎 and @) opens a dropdown menu above the input. The dropdown shows categorized actions, each with an icon, label, and one-line description.

**Categories:** Vanliga (common actions), Rapporter (report generation), Period & Avslut (closing workflows), Bolag (corporate actions), Löner (payroll actions). Categories and individual actions are filtered by company type and feature flags — an EF user never sees "Planera utdelning" or "Beräkna K10".

**Fuzzy search:** As the user types after `/`, the list filters in real-time. Matches both Swedish and English terms — `/payroll` finds "Kör löner", `/invoice` finds "Ny faktura". Works like VS Code's command palette or Raycast.

### 14.4 Behavior

| Trigger | What happens |
|---------|-------------|
| Tap ⚡ button | Opens Quick Actions dropdown |
| Type `/` in empty input | Opens Quick Actions dropdown |
| Select a quick action | Pre-fills chat input with the command prompt |
| Select + press Enter | Auto-sends the command to Scooby |
| Press Escape | Closes dropdown, returns to normal input |

**Simple actions** (resultaträkning, momssaldo) auto-send immediately — no reason to edit the prompt.

**Complex actions** (ny faktura, kör löner) pre-fill the input so the user can add context: `/ny faktura` → "Skapa en ny faktura till Acme AB för konsulttjänster i mars, 80 timmar á 950 kr"

### 14.5 Data Model

```typescript
interface QuickAction {
  id: string
  icon: string                    // emoji or Lucide icon name
  label: string                   // "Ny faktura"
  description: string             // "Skapa en kundfaktura med AI-hjälp"
  category: 'vanliga' | 'rapporter' | 'period' | 'bolag' | 'löner'
  prompt: string                  // "Skapa en ny kundfaktura"
  autoSend: boolean               // true = send immediately, false = prefill
  keywords: string[]              // ["faktura", "invoice", "kund", "skapa"]
  requiredFeature?: string        // feature gate (e.g. 'lonebesked')
  companyTypes?: CompanyType[]    // AB only, HB/KB only, etc.
}
```

Actions are filtered by company type and feature flags — an EF (sole proprietor) never sees "Planera utdelning" or "Delägaruttag".

### 14.6 Implementation

- **Component:** `QuickActionsMenu` — dropdown rendered above chat input
- **Hook:** `useQuickActions()` — returns filtered actions based on company type + fuzzy search
- **Trigger:** `⚡` button in chat toolbar + `/` keystroke listener on input
- **State:** Controlled by ChatProvider (open/close, selected action, search query)
- **Registration:** Quick actions defined in a central `quick-actions.ts` config file, similar to how AI tools are registered

---

## 15. Dynamic Empty-State Suggestions

### 15.1 The Problem

The current empty chat state shows 5 static category badges:

```
[ Händelser ]  [ Bokföring ]  [ Löner ]  [ Rapporter ]  [ Ägare ]
```

These navigate to category pages — they don't help the user DO anything. They reinforce the "two apps" problem by sending users away from the AI.

### 15.2 The Fix: Contextual Action Chips

Replace static badges with **dynamic, context-aware suggestion chips** that Scooby generates based on what it knows about the company's current state. These are computed server-side on dashboard load using a lightweight query (same activity snapshot the chat API already runs).

### 15.3 Behavior

The empty chat state shows a row of suggestion chips below the chat input (replacing the current static category badges). Two states:

**When there are pending items:** The greeting adapts and chips show urgent/actionable items. Examples: "3 att bokföra", "Moms — deadline 12 mar", "2 obetalda fakturor", "Februari ej stängd". Tapping a chip sends a pre-made prompt to Scooby.

**When everything is handled (calm state):** The greeting reflects the calm ("Allt ser bra ut!") and chips show useful exploration actions like "Resultaträkning", "Analysera Q1", "Ny faktura". Below the dynamic chips, the 5 static category navigation badges remain as a secondary row for users who want to browse reference pages.

### 15.4 Chip Types

| Chip Type | Source | Example | Tap Action |
|-----------|--------|---------|------------|
| **Pending items** | `pending_transactions` count | "🧾 3 att bokföra" | Sends "Visa mina obehandlade transaktioner" |
| **Overdue invoices** | `overdue_invoices` count | "📄 2 obetalda" | Sends "Visa förfallna fakturor" |
| **Upcoming deadline** | `compliance_deadlines` | "📋 Moms — 12 mar" | Sends "Hjälp mig med momsdeklarationen" |
| **Open period** | `unclosed_periods` | "🔒 Feb ej stängd" | Sends "Stäng februari" |
| **Payroll due** | `payroll_schedule` + memory | "💰 Löner mars" | Sends "Kör lönerna för mars" |
| **Calm-state fallback** | Static / recent patterns | "📊 Resultaträkn." | Sends "Visa resultaträkningen" |

### 15.5 Priority Logic

Show max 5 chips. Priority order:

1. **Red — Action required:** Overdue invoices, unclosed periods past deadline
2. **Orange — Due soon:** Upcoming deadlines within 7 days, pending transactions
3. **Blue — Routine:** Payroll if near pay date, VAT if near declaration period
4. **Grey — Calm fallback:** Common reports, "Ny faktura", "Analysera ekonomin"

If there are 3+ red/orange items, only show those (don't dilute urgency with grey suggestions). If everything is calm, show helpful exploration suggestions.

### 15.6 Data Source

The activity snapshot query already runs on dashboard load (see `route.ts` lines ~180-200). Extend it to also return:

```typescript
interface DashboardSuggestions {
  pendingTransactions: number
  overdueInvoices: number
  nextDeadline: { type: string, date: string, label: string } | null
  unclosedPeriods: string[]          // ["2026-02"]
  payrollDue: boolean                // based on pay date in memory
  recentActions: string[]            // last 3 action types for personalization
}
```

This adds ~2 fast DB queries to the existing snapshot. Negligible cost.

### 15.7 Implementation

- **API:** `GET /api/dashboard/suggestions` — returns `DashboardSuggestions`
- **Hook:** `useDashboardSuggestions()` — fetches on mount, caches for 5 min
- **Component:** `SuggestionChips` — renders prioritized chips with tap handlers
- **Integration:** Replace the static category badges in `MainContentArea` empty state

---

## 16. Inline Tool Result Cards

### 16.1 The Problem

When Scooby completes an action (creates an invoice, runs payroll, books a transaction), the result currently appears as either:
- Plain text in the chat ("Fakturan är skapad!")
- A walkthrough overlay that disappears when dismissed
- A `D:` structured data block that renders in the overlay

None of these feel like a **tangible artifact** the user created. In ChatGPT, when you generate an image or code, it appears inline as a card you can interact with. In Claude, artifacts persist in a side panel. Scope AI needs the same: **inline result cards that live in the chat stream as proof of what was done.**

### 16.2 Purpose & Direction

When Scooby completes a tool action, the result renders as a **compact, interactive card** inline in the chat message. Each card type shows the essential fields for that entity, a status badge, and action buttons.

**Design principles for cards:**
- Compact by default — show the key info at a glance (entity type, identifier, main amount, status)
- Action buttons at the bottom — each button either triggers a follow-up Scooby command or navigates to a reference page
- Consistent shell across all card types (border, header with icon + title + status badge, content area, action bar) but unique content per type
- Cards should feel like tangible artifacts — "I created this thing" — not just text responses

**Examples of what cards should convey (not prescriptive layouts):**
- **InvoiceCard:** Invoice number, customer, amount (with VAT breakdown), due date, status (utkast/skickad/betald). Actions: Skicka, Redigera, Visa faktura →
- **PayrollCard:** Month, employee count, gross total, employer contributions, total cost, per-employee breakdown (collapsible if many). Actions: Visa lönebesked, Visa verifikation →
- **VerificationCard:** Verification number, date, description, debit/credit rows with account numbers and amounts. Actions: Visa i huvudbok →
- **VATCard:** Period, key box values (utgående/ingående/att betala), status. Actions: Ladda ner XML, Markera skickad
- **ReportCard:** Report type, period, 2-3 key metrics. Actions: Exportera PDF, Visa detaljer

### 16.3 Card Types

| Card Type | Trigger | Key Fields | Actions |
|-----------|---------|------------|---------|
| **InvoiceCard** | `create_invoice` result | #, customer, amount, due, status | Skicka, Redigera, Visa |
| **VerificationCard** | `create_verification` result | #, date, description, debit/credit rows | Visa i huvudbok |
| **PayrollCard** | `run_payroll` result | month, employee breakdown, totals | Visa lönebesked, Visa verifikation |
| **ReceiptCard** | `create_receipt` / OCR result | vendor, amount, category, thumbnail | Bokför, Visa kvitto |
| **ReportCard** | `get_report` result | report type, period, key metrics | Exportera PDF, Visa detaljer |
| **VATCard** | `submit_vat_declaration` result | period, amount, status | Visa deklaration, Skicka till SKV |
| **DividendCard** | Dividend calculation result | total, per share, tax, net | Registrera beslut |
| **TransactionCard** | `categorize_transaction` result | date, description, amount, account | Visa transaktion |

### 16.4 Behavior

1. **Persistent:** Cards stay in the chat history forever. Scroll back to see what you did.
2. **Interactive:** Action buttons on cards trigger follow-up commands (e.g., "Skicka" on invoice card sends `send_invoice`).
3. **Linkable:** "Visa → " buttons navigate to the reference page with the item highlighted.
4. **Collapsible:** Long cards (payroll with 10 employees) can collapse to a summary row with "Visa mer" toggle.
5. **Updatable:** If the user says "Ändra beloppet till 60 000", Scooby updates the invoice AND re-renders the card with the new data.

### 16.5 Streaming Integration

Cards are delivered via the existing `D:` protocol with a new `inline_card` display type:

```typescript
// In the stream response
D:{"type":"inline_card","cardType":"InvoiceCard","data":{
  "id":"inv_1025",
  "number":1025,
  "customer":"Acme AB",
  "amount":50000,
  "vat":10000,
  "dueDate":"2026-04-08",
  "status":"draft"
},"actions":[
  {"label":"Skicka","icon":"send","command":"Skicka faktura #1025 till kunden"},
  {"label":"Redigera","icon":"edit","command":"Redigera faktura #1025"},
  {"label":"Visa faktura","icon":"eye","href":"/dashboard/bokforing?tab=fakturor&id=inv_1025"}
]}
```

The `MessageDisplay` union type in `chat-types.ts` already supports multiple display types. Add `inline_card` as a new variant that renders inside the chat message bubble (not in an overlay).

### 16.6 Implementation

- **Components:** One React component per card type in `src/components/chat/cards/`
  - `InvoiceCard.tsx`, `VerificationCard.tsx`, `PayrollCard.tsx`, etc.
  - Shared `CardShell.tsx` for consistent styling (border, status badge, action bar)
- **Renderer:** `InlineCardRenderer` — switch on `cardType`, render the right component
- **Integration:** In `MessageBubble`, after text content, render any `inline_card` displays
- **Actions:** Card action buttons dispatch to ChatProvider's `handleSend()` with prefilled prompt, or use `router.push()` for navigation links

---

## 17. Filing Reality Check — What's Real vs What's Misplaced

### 17.1 The Problem

Some features were built without fully mapping what each company type actually files, where they file it, and whether it's a real submission or just an internal calculation. This section is the ground truth.

### 17.2 Skatteverket Digital APIs (Available Now)

| API / Service | Format | Status | Agreement Required |
|---|---|---|---|
| **Momsdeklaration API** | XML (eSKDUpload DTD 6.0) | Production | Yes — formal agreement with Skatteverket |
| **AGI API** (Arbetsgivardeklaration) | XML | Production | Yes — formal agreement |
| **Filöverföring** (SRU upload) | SRU files (ISO-8859-1) | Production | No — open e-tjänst with BankID login |
| **Bolagsverket Årsredovisning API** | iXBRL (se-cd taxonomy) | Production | Yes — formal agreement |

**Our current state:** We generate all correct file formats (SRU, XML, iXBRL) but have NO live API integration. Users must download files and upload manually to Skatteverket's Filöverföring or Bolagsverket's e-tjänst. This is fine for launch — Fortnox started the same way. API integration is a business development milestone, not a code blocker.

### 17.3 AB (Aktiebolag) — What They Actually File

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | Monthly / Quarterly | ✅ Real — all 33 VAT boxes from verifications, reverse charge, XML export |
| **AGI** | Skatteverket | XML | Monthly | ✅ Real — from payslip data, age-based rates, XML export |
| **INK2** (corporate tax return) | Skatteverket | SRU | Yearly | ✅ Real — all fields mapped from ledger, SRU generator |
| **Årsredovisning** (K2/K3) | Bolagsverket | iXBRL | Yearly | ⚠️ Generator exists (`xbrl-generator.ts`) but NOT wired into UI |
| **K10** | Skatteverket (owner's personal INK1) | SRU | Yearly | ✅ Real — full 3:12 logic, gränsbelopp, sparat utrymme, SRU export |

**Important:** K10 is NOT a company filing. It's an attachment to the owner's personal income tax return (INK1). The company data feeds into the calculation, but the actual submission is personal. In the app, it should be framed as "Hjälp ägaren beräkna K10" — not as a company report.

**Important:** Årsredovisning becomes mandatory digital (iXBRL) for all AB from fiscal years starting after 2025-12-31. Our iXBRL generator exists but needs to be wired into the årsredovisning walkthrough with a download button. This is a priority.

### 17.4 EF (Enskild Firma) — What They Actually File

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | Monthly / Quarterly / Yearly | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly (if has employees) | ✅ Real |
| **NE-bilaga** (personal tax attachment) | Skatteverket | SRU | Yearly | ❌ **MISSING — SRU generator handles INK2 + K10 but not NE** |
| **Årsbokslut** (förenklat) | NOWHERE — kept in records | — | Yearly | ✅ Generation exists |
| **Egenavgifter** | NOWHERE — auto-calculated by Skatteverket | — | — | ✅ Calculator exists |

**Key findings:**
- **NE-bilaga is a gap.** This is the most important yearly filing for EF users and we don't generate it. Must be built as a walkthrough with SRU export. The NE form maps business income/expenses from the resultaträkning into Skatteverket's field codes.
- **Årsbokslut is never submitted.** EF users make it and keep it in their records. No "submit" button needed. The generation logic exists — just needs to be a walkthrough with a "Spara som PDF" button.
- **Egenavgifter is NOT a filing.** It's a calculation: `profit × 0.75 × 28.97%`. Skatteverket calculates it automatically from the NE-bilaga. Having a dedicated page was overkill. Correct placement: instant Scooby calculation (2-second inline card).

### 17.5 HB/KB (Handelsbolag / Kommanditbolag) — What They Actually File

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | Monthly / Quarterly | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly (if has employees) | ✅ Real |
| **INK4** (company-level declaration) | Skatteverket | SRU | Yearly | ❌ **MISSING — we only have INK2 (for AB), not INK4** |
| **INK4R** (räkenskapsschema) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **INK4S** (skattemässiga justeringar) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **INK4DU** (delägaruppgifter) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **N3A** (per-partner, physical persons) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **N3B** (per-partner, legal entities) | Skatteverket | SRU | Yearly | ❌ **MISSING** |
| **Årsbokslut** (förenklat) | NOWHERE (unless ALL partners are legal entities → then Bolagsverket) | — | Yearly | ✅ Generation exists |

**Key findings:**
- **INK4 is a significant gap.** HB/KB users currently see an "Inkomstdeklaration" page that likely renders INK2 logic, which is wrong for their company type. INK4 has different field codes and includes a mandatory delägaruppgifter section (INK4DU) that specifies how profit is distributed among partners.
- **N3A/N3B per-partner declarations are missing.** Each partner needs their own form attached to their personal tax return. The form includes kapitalunderlag for räntefördelning, expansionsfond, and spärrade underskott — all specific to partnerships.
- **Egenavgifter applies here too** — each partner pays egenavgifter on their share of profit. Same calculator as EF, but per-partner.

### 17.6 Förening (Ideell Förening) — What They Actually File

| Filing | Submitted To | Format | Frequency | Our Status |
|---|---|---|---|---|
| **Momsdeklaration** | Skatteverket | XML | If VAT registered | ✅ Real |
| **AGI** | Skatteverket | XML | Monthly (if has employees) | ✅ Real |
| **INK2 or INK3** | Skatteverket | SRU | Yearly (if taxable) | ⚠️ INK2 exists, INK3 does not |
| **Årsredovisning** | Bolagsverket | iXBRL | Yearly (ekonomisk förening only) | ⚠️ Generator exists, not wired |

**Key findings:**
- Many ideell föreningar are **exempt from tax** and don't need to file INK at all. We should check for this.
- Ekonomisk förening files årsredovisning to Bolagsverket (same as AB). Ideell förening does NOT file to Bolagsverket.
- INK3 is a simpler version of INK2 for certain entities. Low priority to build — most föreningar use INK2.

### 17.7 What's Misplaced in the Current App

| Feature | Current Placement | Problem | Correct Placement |
|---|---|---|---|
| **Egenavgifter** | Dedicated report tab (9th of 9 tabs) | NOT a filing. Just `profit × 0.75 × 28.97%`. SKV calculates it automatically. | Instant Scooby calculation — inline card, 2 seconds |
| **K10** | Report tab under Rapporter | NOT a company filing. It's the owner's personal INK1 attachment. | Scooby walkthrough — "Beräkna K10 för [ägare]". Still uses same calculator. |
| **Årsbokslut** (EF/HB/KB) | Report tab | Never submitted anywhere. Kept in records. No "submit" button needed. | Scooby walkthrough — generate + "Spara som PDF" |
| **Årsredovisning** | Report tab | Correct concept, but iXBRL export disconnected. | Scooby walkthrough — generate + "Ladda ner iXBRL" + "Ladda ner PDF" |
| **Inkomstdeklaration** | Single report tab | Shows same UI regardless of company type, but the actual form differs wildly (INK2 vs NE vs INK4 vs INK3). | Company-type-aware walkthrough that generates the correct form variant |

### 17.8 Summary: What We Have vs What We Need

**Legend:** ✅ = production-ready, ⚠️ = exists but needs work, ❌ = missing

| Capability | AB | EF | HB/KB | Förening |
|---|---|---|---|---|
| Momsdeklaration + XML | ✅ | ✅ | ✅ | ✅ |
| AGI + XML | ✅ | ✅ | ✅ | ✅ |
| Resultaträkning | ✅ | ✅ | ✅ | ✅ |
| Balansräkning | ✅ | ✅ | ✅ | ✅ |
| INK2 + SRU | ✅ | N/A | N/A | ⚠️ (some use INK2, some INK3) |
| NE-bilaga + SRU | N/A | ❌ **GAP** | N/A | N/A |
| INK4 + SRU | N/A | N/A | ❌ **GAP** | N/A |
| N3A/N3B + SRU | N/A | N/A | ❌ **GAP** | N/A |
| K10 + SRU | ✅ | N/A | N/A | N/A |
| Egenavgifter calculator | N/A | ✅ | ✅ | N/A |
| Årsredovisning | ⚠️ iXBRL disconnected | N/A | N/A | ⚠️ iXBRL disconnected |
| Årsbokslut | N/A | ✅ | ✅ | N/A |
| Scooby memory | ⚠️ basic tools exist | ⚠️ | ⚠️ | ⚠️ |
| Skatteverket API integration | ❌ (manual upload) | ❌ | ❌ | ❌ |
| Bolagsverket API integration | ❌ (manual upload) | N/A | N/A | ❌ |

**Critical gaps to fill before HB/KB/EF users can do yearly declarations:**
1. NE-bilaga SRU generator (EF)
2. INK4 + INK4R + INK4S + INK4DU SRU generator (HB/KB)
3. N3A per-partner SRU generator (HB/KB physical person partners)
4. Wire iXBRL generator into årsredovisning walkthrough (AB, Förening)

Sources:
- [Skatteverket — Inkomstdeklaration 2 e-tjänst](https://skatteverket.se/foretag/etjansterochblanketter/allaetjanster/tjanster/inkomstdeklaration2.4.58a1634211f85df4dce800012276.html)
- [Skatteverket — Egenavgifter](https://www.skatteverket.se/foretag/drivaforetag/foretagsformer/enskildnaringsverksamhet/egenavgifterochsarskildloneskatt.4.361dc8c15312eff6fd1f678.html)
- [Skatteverket — Deklarera handelsbolag](https://skatteverket.se/foretag/inkomstdeklaration/deklareraatetthandelsbolag.4.309a41aa1672ad0c837988b.html)
- [Skatteverket — API Momsdeklaration villkor](https://www7.skatteverket.se/portal-wapi/open/apier-och-oppna-data/utvecklarportalen/v1/getFile/allmanna-villkor-momsdeklaration)
- [Skatteverket — API AGI inlämning](https://www.skatteverket.se/apierochoppnadata/detharerbjudervi/apier/arbetsgivardeklarationinlamningviaapi/begartillgangtilldriftsatttjanstarbetsgivardeklarationinlamning.4.8bcb26d16a5646a148f3a.html)
- [Bolagsverket — Digital inlämning teknisk guide](https://bolagsverket.se/omoss/utvecklingavdigitalatjanster/digitalinlamningavarsredovisning/tekniskdokumentationfordigitalinlamningavarsredovisning.2267.html)
- [Wolters Kluwer — 2026 obligatorisk digital inlämning](https://www.wolterskluwer.com/sv-se/news/2026-foreslas-obligatorisk-digital-inlamning)
- [Skatteverket — K10 blankett](https://www.skatteverket.se/privat/etjansterochblanketter/blanketterbroschyrer/blanketter/info/2110.4.39f16f103821c58f680006280.html)
- [Skatteverket — NE-bilaga](https://skatteverket.se/foretag/inkomstdeklaration/deklareraenskildnaringsverksamhet.4.133ff59513d6f9ee2ebf00.html)
- [Redovisningsdatum — N3A appendix](https://www.redovisningsdatum.se/p/n3a-bilaga-till-inkomstdeklaration-1?_locale=en)
- [Bokio — Deklaration i HB/KB](https://www.bokio.se/hjalp/bokslut/arsredovisning-och-deklaration/deklaration-i-handelsbolag-kommanditbolag-och-ekonomisk-forening/)

---

## 18. Side Panel Behavior

### 18.1 When It Appears

The side panel replaces the floating `AIOverlay`. It renders alongside the chat when Scooby generates a walkthrough or document that benefits from persistent display. Not every tool result opens a side panel — most results render as inline cards (Section 16). The side panel is for **large, structured outputs** that the user wants to reference while continuing to chat.

**Opens side panel:**
- Årsredovisning (multi-page document preview)
- Full Resultaträkning / Balansräkning (scrollable financial tables)
- Momsdeklaration (form with 33 boxes)
- Inkomstdeklaration (multi-section form)
- Any walkthrough with 5+ blocks

**Stays inline (no side panel):**
- Simple calculations (egenavgifter, momssaldo)
- Entity creation results (invoice, verification, payslip)
- Short summaries and status checks

### 18.2 Layout

When the side panel is open, the main content area splits: chat on the left (~50%), walkthrough on the right (~50%). On smaller screens, the side panel takes the full width with a back-to-chat button.

### 18.3 Interaction

- **Persistent:** Stays open while user continues chatting. "Ändra momsperioden till Q2" updates the panel in place.
- **Pinnable:** User can pin to prevent auto-close when navigating.
- **Dismissible:** X button or Escape to close. Content remains in chat history.
- **Export:** Side panel includes export buttons (PDF, XML, SRU, iXBRL) relevant to the content type.

---

## 19. Search

### 19.1 Purpose

Global search across all entities in the app. Triggered by `Cmd+K` (macOS) or the "Sök" button in the sidebar. Opens a dialog with a single input field and categorized results below.

### 19.2 What's Searchable

| Category | What | Fields Searched |
|---|---|---|
| Transaktioner | Bank transactions | description, amount, counterpart name |
| Fakturor | Customer + supplier invoices | invoice number, customer/supplier name, amount |
| Verifikationer | Bookkeeping entries | verification number, description, account names |
| Anställda | Team members | name, personnummer (masked), role |
| Konversationer | Chat history | message content, conversation title |

### 19.3 Behavior

- Results appear grouped by category as the user types (debounced 200ms)
- Each result shows: entity type icon, primary identifier, key detail, date
- Click a result → navigate to the reference page with item highlighted, or open conversation
- If no results match, show "Fråga Scooby" chip that sends the query as a chat message
- Recent searches remembered (localStorage, last 5)

### 19.4 Implementation

- **Component:** `SearchDialog` in `src/components/layout/search-dialog.tsx` (file already exists)
- **Trigger:** `Cmd+K` global listener + sidebar "Sök" button
- **Backend:** Parallel queries to existing Supabase tables with text search, or a unified `GET /api/search?q=` endpoint
- **No separate search index needed** — Supabase full-text search with `tsvector` columns on key tables is sufficient at current scale

---

## 20. Onboarding Flow

### 20.1 First-Time User Experience

When a user creates an account and has no company connected yet, the app should guide them through setup via Scooby — not a traditional form wizard. This reinforces the AI-first pattern from the very first interaction.

### 20.2 Flow

1. User signs up → lands on `/dashboard` → sees Scooby's greeting
2. Scooby's greeting for new users: "Välkommen! Jag är Scooby, din AI-bokförare. Ska vi sätta upp ditt företag?"
3. Scooby asks for org.nr → calls Bolagsverket/allabolag lookup → auto-fills company name, type, address, SNI
4. Confirms details with the user → creates company record
5. Asks about momsperiod, räkenskapsår, bankuppkoppling
6. Suggests first actions based on company type: "Du har ett AB — vill du börja med att lägga in aktieägarna?"
7. Dynamic suggestion chips update to reflect the new company's state

### 20.3 Why This Works

- No separate onboarding page or wizard to build/maintain
- Scooby learns the company while setting it up (first memory entries)
- Reinforces that "you do everything by talking to Scooby"
- If the user types something else first, that's fine — onboarding happens naturally whenever they're ready

---

## 21. Final Summary — Before vs After

### 21.1 The Numbers

| Metric | Before | After |
|---|---|---|
| **Categories** | 5 | 5 (same — mental models stay) |
| **Tabs / pages** | 33+ | 9-10 (varies by company type) |
| **Unique UI patterns** | 1 (stat cards + table everywhere) | 7 (inbox, kanban, ledger, hub, cards+timeline, card grid, single card) |
| **Form dialogs** | ~15 | ~7 (keep simple ones, kill wizard dialogs) |
| **Reports as pages** | 9 | 0 (all AI walkthroughs) |
| **AI walkthroughs** | ~5 (floating overlay, disconnected) | 22+ (inline in chat with result cards, incl. plans) |
| **Quick Actions** | 0 | 20+ (searchable ⚡ menu, filtered by company type) |
| **Inline result cards** | 0 | 8+ card types (invoice, verification, payroll, receipt, report, VAT, dividend, transaction) |
| **Dead code to clean** | — | ~16 tab components (incl. CanvasView), ~6 wizard dialogs, lazy loaders, unused imports |
| **Scooby memory** | Basic query/add tools | Markdown-file memory per company, read at start, updated on learn |
| **Global search** | 0 | Cmd+K dialog across all entities |
| **Side panel** | Floating overlay (disconnected) | Persistent split-view alongside chat |
| **Onboarding** | Manual company setup | Conversational setup via Scooby |

### 21.2 Per Company Type: What the User Sees

**AB user:**
- **Chat:** Scooby + ⚡ Quick Actions (Ny faktura, Kör löner, Resultaträkning, Moms, K10, Årsredovisning, Planera utdelning...)
- **Händelser (2):** Översikt (calendar + plans), Arkiv (månadsavslut)
- **Bokföring (3):** Transaktioner (inbox), Fakturor (kanban), Huvudbok (ledger)
- **Löner (2):** Löneöversikt, Team
- **Rapporter (hub):** Generate buttons + saved reports archive
- **Ägare (2):** Aktiebok & Styrning, Möten & Beslut
- **Total pages: 10**

**EF user:**
- **Chat:** Scooby + ⚡ Quick Actions (Ny faktura, Registrera kvitto, Moms, NE-bilaga, Egenavgifter, Årsbokslut...)
- **Händelser (2):** Översikt (calendar + plans), Arkiv (månadsavslut)
- **Bokföring (3):** Transaktioner (inbox), Fakturor (kanban), Huvudbok (ledger)
- **Löner (2):** Löneöversikt, Team
- **Rapporter (hub):** Generate buttons + saved reports archive
- **Ägare (1):** Ägarinfo (single card)
- **Total pages: 9**

**HB/KB user:**
- **Chat:** Scooby + ⚡ Quick Actions (Ny faktura, Registrera uttag, Moms, INK4, Egenavgifter, Årsbokslut...)
- **Händelser (2):** Översikt (calendar + plans), Arkiv (månadsavslut)
- **Bokföring (3):** Transaktioner (inbox), Fakturor (kanban), Huvudbok (ledger)
- **Löner (2):** Löneöversikt, Team
- **Rapporter (hub):** Generate buttons + saved reports archive
- **Ägare (1):** Delägare (partner cards + timeline)
- **Total pages: 9**

**Förening user:**
- **Chat:** Scooby + ⚡ Quick Actions (Ny faktura, Moms, AGI, Årsredovisning, Förbered årsmöte...)
- **Händelser (2):** Översikt (calendar + plans), Arkiv (månadsavslut)
- **Bokföring (3):** Transaktioner (inbox), Fakturor (kanban), Huvudbok (ledger)
- **Löner (2):** Löneöversikt, Team
- **Rapporter (hub):** Generate buttons + saved reports archive
- **Ägare (2):** Medlemsregister, Möten & Beslut
- **Total pages: 10**

### 21.3 Gaps to Fill (Priority Order)

| # | Gap | Impact | Effort |
|---|---|---|---|
| 1 | **Wire iXBRL generator into årsredovisning walkthrough** | AB + Förening can't do digital Bolagsverket filing (mandatory from 2026) | Medium — generator exists, needs UI wiring |
| 2 | **Build NE-bilaga SRU generator** | EF users can't do their yearly declaration | Medium — similar to INK2 but different field codes |
| 3 | **Build INK4 + INK4DU SRU generator** | HB/KB companies can't do yearly declaration | High — new form with partner distribution logic |
| 4 | **Build N3A SRU generator** | HB/KB partners can't do their personal declarations | High — complex partnership tax rules |
| 5 | **Scooby markdown memory** | All users — Scooby doesn't learn across sessions | Low — simple tool + Supabase column |
| 6 | **Quick Actions menu** | All users — no fast-action discovery | Low-Medium — UI component + config file |
| 7 | **Inline result cards** | All users — tool results feel ephemeral | Medium — 8 card components + streaming integration |
| 8 | **Reports Hub page** | All users — replaces 9 tabs | Low — simple page with generate buttons + list |
| 9 | **Skatteverket API integration** | All users — eliminates manual file upload | High — requires formal agreements + OAuth |

### 21.4 What NOT to Do

1. **Don't delete the calculation/generator logic.** Resultaträkning, Balansräkning, Momsdeklaration, K10, Egenavgifter, AGI, INK2 — all the services, processors, and generators stay. Only the page-tab UI layer changes.
2. **Don't build Skatteverket API integration yet.** Manual file upload is fine for launch. API integration requires formal business agreements with the authorities.
3. **Don't over-engineer the memory system.** Phase 1 is a markdown text column in Supabase + two tools. No vector DB, no graph, no embeddings. ChatGPT's memory is literally the same thing.
4. **Don't build INK3 for Förening yet.** Most föreningar use INK2. INK3 is a niche variant — add it later if users request it.

## 22. AI SDK Migration (OpenAI Assistants & Vercel AI)

### 22.1 The Current State
Currently, the app relies on passing arrays of messages manually and uses a rudimentary custom implementation for Scooby's memory (`Scooby markdown memory`). This requires custom logic to handle token limits, message truncation, and context persistence across sessions.

### 22.2 The Target Architecture
To reach true production readiness and simplify maintenance, we must adopt industry-standard SDKs that handle memory and streaming natively.

1. **OpenAI Assistants API (Node SDK):**
   - **Threads:** Replace manual message arrays. A `Thread` is created once per user session and its ID is saved in Supabase. All future messages are appended to this thread.
   - **Native Memory:** OpenAI automatically manages context persistence and truncation within the thread. The "Scooby markdown memory" requirement can be heavily simplified or entirely replaced by the Assistant's native instruction updates and thread history.
   - **Built-in Tools:** Utilize native tools like `File Search` (for RAG over receipts/documents) and `Code Interpreter` (for generating financial charts/CSVs) instead of building custom vector databases or sandboxes.

2. **Vercel AI SDK (`ai` and `@ai-sdk/openai`):**
   - **`useChat` Hook:** Replace custom React state and streaming logic in `src/components/layout/ai-chat-panel.tsx`. The Vercel AI SDK handles letter-by-letter streaming, loading states, and error recovery out-of-the-box.
   - **Generative UI:** Transition from custom `W:` and `D:` string parsing to true Generative UI. The AI can call a tool that returns a React component (like `<InvoiceCard />`), rendering it directly inline without complex regex parsing.

### 22.3 Implementation Steps
1. Add `ai` and `@ai-sdk/openai` to `package.json`.
2. Update `/api/chat/route.ts` to use Vercel AI SDK's `streamText` or Assistants API integration.
3. Update `Supabase` schema to store `openai_thread_id` per user/company.
4. Refactor `ChatProvider` to utilize `useChat` from the Vercel AI SDK.
5. Map existing custom tools (e.g., `create_invoice`, `run_payroll`) to Vercel AI SDK's `tool` definitions, allowing them to return the new Inline Result Cards directly.

