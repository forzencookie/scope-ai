# Bokföring — Scope AI

**The bookkeeping module built for Swedish accountants who value precision, speed, and full control.**

Bokföring is the core of Scope AI. It handles the full lifecycle of financial data — from raw bank transactions to verified ledger entries — in a workflow designed around how professional accountants actually work. Every screen, every dialog, every stat card exists because Swedish accounting law (BFL, ÅRL) demands it.

---

## The Five Pillars

### 1. Transaktioner — The Transaction Inbox

The starting point for all bookkeeping. Transaktioner functions as a professional-grade inbox where every payment flowing through the company lands for review.

**Stat cards at a glance:**
- **Antal betalningar** — Total transaction count for the period
- **Pengar in** — Sum of all incoming payments (green)
- **Pengar ut** — Sum of all outgoing payments (red)
- **Allt i ordning** — Booked vs. total ratio, showing immediately whether the books are clean

**How it works:**
- Transactions arrive via bank import or manual entry
- Each transaction carries a status badge: *Att bokföra*, *Bokförd*, *Saknar underlag*, or *Ignorerad*
- The accountant filters by status to focus on what needs attention — no scrolling through hundreds of already-handled items
- A prominent status banner shows how many transactions need review, with a direct link to filter them

**Adding transactions:**
- **Manuell** — Full legal-grade entry form capturing: beskrivning, motpart, org-nr/personnr, belopp (inkl. moms), momssats (25/12/6/0%), auto-calculated momsbelopp, datum, konto, and verifikationsunderlag (document reference). Every field a Swedish auditor would expect to see on a verification is present at the point of entry.
- **Filuppladdning** — Upload any file (PDF, image, CSV, Excel) and the AI analyzes the content regardless of format. One upload zone handles Z-rapporter, bank exports, scanned documents — the AI determines what it is and extracts the data

**Why it matters:**
Accountants spend significant time on transaction categorization and matching. The unified upload flow eliminates the friction of choosing between import modes. The status-based filtering means the accountant always knows exactly what remains to be done before a period close. The manual entry form captures counter-party identification and VAT breakdown at the moment of creation — not as an afterthought during period close — which means the momsdeklaration can auto-populate from transaction data without the accountant reconstructing VAT from memory.

---

### 2. Fakturor — Invoice Management

A complete invoice lifecycle manager with Kanban visualization, covering both customer invoices (kundfakturor) and supplier invoices (leverantörsfakturor).

**Kanban columns reflect real invoice states:**
- *Unified view:* Att hantera → Förfallna → Betalda → Utkast
- *Customer view:* Utkast → Skickade → Förfallna → Betalda
- *Supplier view:* Mottagna → Attesterade → Förfallna → Betalda

**Stat cards:**
- **Att få** — Total outstanding receivables
- **Att betala** — Total outstanding payables
- **Förfallna** — Overdue invoice count with alert styling

**Customer invoice creation (legally complete):**
The creation dialog produces invoices that satisfy Mervärdesskattelagen 11 kap. 8§. It captures: customer name, org-nummer, address, reference person, line items with per-item VAT rates (25/12/6/0%), editable issue date, payment terms, due date, currency, bankgiro, plusgiro, and notes. The company's own information (name, org-nr, moms-nr, address) is pulled automatically from company settings — not hardcoded. Each invoice gets a sequential number (F-0001, F-0002...) at creation. A live invoice preview renders alongside the form in both standard and expanded view, showing exactly what the customer will receive — including the payment section with bank details.

**Supplier invoice creation (audit-ready):**
Captures: supplier name, supplier org-nummer, supplier address, invoice number, OCR number, invoice date, due date, total amount, VAT amount, currency (SEK/EUR/USD/GBP/NOK/DKK), and category. Every field needed to match the supplier's invoice against Bolagsverket records and to claim VAT deductions is present.

**Supplier invoice AI extraction:**
Upload a supplier invoice (PDF, photo) and the AI extracts supplier name, invoice/OCR number, total amount, VAT, due date, and category. The extracted data is presented for review before saving — the accountant always approves before anything is committed.

**Why it matters:**
Cash flow visibility is immediate. The Kanban board gives a real-time picture of receivables and payables without running reports. The AI extraction for supplier invoices eliminates manual data entry for the most repetitive part of accounts payable. The legal completeness of the creation forms means invoices produced by Scope are valid documents from the moment they're created — no missing fields, no "fix it later" problems that surface during audit.

---

### 3. Kvitton — Receipt Management

A dedicated space for receipts and supporting documentation, with two clear upload modes.

**Dual-mode upload:**
- **Manuell** — Upload a file and manually enter supplier, date, amount (incl. moms), VAT breakdown, and category
- **Skanna med AI** — Upload or photograph a receipt, and the AI extracts all fields automatically. Results are shown for review with options to accept, edit, or retry.

**Why it matters:**
Swedish law (BFL 7 kap.) requires supporting documentation for every verification. Kvitton ensures receipts are captured, categorized, and linked to the correct transactions. The AI scanning mode handles the bulk of data entry, while manual mode provides full control when needed — for example, when a receipt is too damaged for OCR or when entering data from a phone conversation.

---

### 4. Inventarier — Asset Register

A straightforward register for company-owned assets (computers, furniture, vehicles) with built-in depreciation support.

**Features:**
- Asset registration with name, purchase price (excl. moms), purchase date, and useful life in years
- Stat cards showing total asset value and category breakdown
- **Bokför avskrivning** button directly in the header — one click to record depreciation entries for all eligible assets
- Consistent UI with table title separator and "Alla tillgångar" section heading, matching the visual pattern across all Bokföring pages

**Why it matters:**
Depreciation is one of the most error-prone areas in small-company accounting. Having the asset register and depreciation booking in the same view eliminates the back-and-forth between inventory lists and journal entries. The accountant sees the asset, its remaining value, and can book the write-down without leaving the page.

---

### 5. Verifikationer — The Ledger

The authoritative record of every booked transaction in the company. This is the audit trail.

**Features:**
- Clean flat table with columns: Nr, Datum, Konto, Beskrivning, Belopp
- Full-text search across all verifications
- Account filtering — click a filter badge to narrow to a specific BAS account
- Detail dialog showing the double-entry debit/credit breakdown for each verification
- Bulk export and print for audit preparation
- Stats showing total verification count, turnover, and missing documentation warnings

**Why it matters:**
When Skatteverket asks for documentation, the accountant opens Verifikationer, filters to the relevant account or period, and exports. Every verification links back to its source transaction, invoice, or receipt. The sequential numbering (A1, A2, A3...) follows BFL requirements for gap-free verification series.

---

## How the Pages Talk to Each Other

The five Bokföring pages are not independent screens. They form a connected data pipeline where every action in one view propagates downstream.

### The Data Flow

```
Transaktioner ──► Verifikationer
     │                  ▲
     │                  │
Fakturor ───────────────┘
     │                  ▲
     │                  │
Kvitton ────────────────┘
     │
Inventarier ──► Verifikationer (via depreciation booking)
```

**Transaction → Verification:** When an accountant books a transaction in Transaktioner (assigns it a category, confirms the debit/credit accounts), a verification is created in Verifikationer automatically. The verification carries the original transaction data, the account assignments, and the link back to the source. The "Allt i ordning" stat card updates in real-time — the accountant can see the booked/unbooked ratio change as they work.

**Invoice → Verification:** When a customer invoice is marked as paid, or a supplier invoice is approved and processed, the corresponding ledger entries flow into Verifikationer. The invoice number becomes the verification's document reference, creating a traceable chain from the original invoice through to the ledger.

**Receipt → Transaction/Verification:** Receipts uploaded in Kvitton serve as the supporting documentation (underlag) required by BFL for every verification. When a receipt is linked to a transaction, the transaction's status changes from "Saknar underlag" to "Bokförd" — which in turn updates the status banner and the "Allt i ordning" card in Transaktioner.

**Asset → Depreciation → Verification:** When the accountant clicks "Bokför avskrivning" in Inventarier, depreciation entries are generated for all eligible assets and posted to Verifikationer. The asset's book value updates, and the expense appears on the income statement through the corresponding BAS accounts (typically 7831/7832 for depreciation, 1229/1249 for accumulated depreciation).

### What This Means in Practice

An accountant working a monthly close doesn't need to jump between disconnected modules:

1. **Start in Transaktioner** — The status banner says "12 transaktioner att granska." Filter to unbooked items. Process them. The "Allt i ordning" card goes from 38/50 to 50/50.
2. **Check Fakturor** — The Kanban board shows 2 supplier invoices in "Mottagna." Open each one, verify the AI-extracted data, approve. They flow to Verifikationer.
3. **Check Kvitton** — 3 receipts scanned but not linked. Match them to their transactions. The "Saknar underlag" count in Transaktioner drops to zero.
4. **Run depreciation in Inventarier** — One click. Depreciation entries appear in Verifikationer.
5. **Open Verifikationer** — Every action from steps 1-4 is reflected. The ledger is complete. Export for the period. Done.

The accountant never enters the same data twice. The system carries information forward from the point of origin to the ledger, and every step is visible and auditable.

---

## Legal Soundness — Built for Swedish Law

This is not a generic bookkeeping tool with a Swedish language pack. Every data field, every workflow, and every validation exists because Swedish law requires it.

### Bokföringslagen (BFL) Compliance

| Requirement | How Scope Handles It |
|---|---|
| **5 kap. 7§ — Verification content** | Every transaction captures: date, counter-party, amount, VAT, account, description, and document reference. All legally required fields are present at the point of entry. |
| **5 kap. 6§ — Sequential numbering** | Verifications use gap-free sequential numbering (A1, A2, A3...). Invoice numbers follow the same principle (F-0001, F-0002...). |
| **7 kap. — Supporting documentation** | Kvitton provides dedicated receipt management. The "Saknar underlag" status in Transaktioner flags any transaction missing its supporting document. |
| **5 kap. 1§ — Accounting obligation** | The entire Bokföring module exists to fulfill this. Every financial event is captured, categorized, and verifiable. |

### Mervärdesskattelagen (ML) Compliance

| Requirement | How Scope Handles It |
|---|---|
| **11 kap. 8§ — Invoice content** | Customer invoices include: sequential number, issue date, seller info (name, org-nr, moms-nr, address), buyer info (name, org-nr, address), line items with quantity/price, VAT per rate, total, payment terms, and bank details. |
| **VAT rate separation** | Every line item carries its own VAT rate (25/12/6/0%). The momsdeklaration can pull directly from this data without manual recalculation. |
| **Supplier VAT deduction** | Supplier invoices capture org-nummer, VAT amount, and full supplier identification — the data needed to claim input VAT deductions. |

### Årsredovisningslagen (ÅRL) Compliance

| Requirement | How Scope Handles It |
|---|---|
| **Asset depreciation** | Inventarier tracks useful life and calculates depreciation per asset. The "Bokför avskrivning" function creates proper BAS-coded entries (7831/1229 etc.). |
| **Complete audit trail** | Verifikationer provides the full ledger with export capability. Every entry links back to its source document. |

### Why Legal Completeness Matters

Traditional accounting software often captures the minimum data at entry and expects the accountant to fill in gaps during period close or annual audit. This creates two problems:

1. **Data loss** — The accountant has to remember or reconstruct counter-party details, VAT breakdowns, and document references weeks or months after the transaction occurred.
2. **Audit risk** — Missing fields on verifications or invoices are findings in a Skatteverket audit. Each finding costs time, credibility, and potentially money.

Scope's approach is different: capture everything at the point of origin. When the accountant enters a transaction manually, the form asks for the counter-party's org-nummer and the VAT breakdown right there. When they create an invoice, the company's legal information is pulled from settings automatically. When they upload a supplier invoice, the AI extracts the supplier's identification details.

The result is that by the time the accountant reaches Verifikationer to review the ledger, every entry is already complete. Period close becomes a verification step, not a data entry marathon.

---

## Real-World Workflow: A Day in the Life

**9:00 — Morning check.** The accountant logs in. Transaktioner shows 8 new bank transactions imported overnight. The "Allt i ordning" card reads 142/150. The status banner says "8 transaktioner att granska."

**9:15 — Transaction processing.** Filter by "Att bokföra." Seven of the eight are routine — office supplies, SaaS subscriptions, a client payment. The AI has already suggested categories. The accountant confirms each one. One transaction is unusual — a large payment to a new supplier. The accountant enters the supplier's org-nummer and marks it for follow-up.

**9:30 — Supplier invoices.** Two PDFs arrived by email. The accountant uploads them in Fakturor. The AI extracts supplier name, org-nummer, amounts, VAT, and due dates. One extraction is perfect. The other missed the OCR number — the accountant corrects it manually and approves. Both invoices appear on the Kanban board under "Mottagna."

**9:45 — Receipts.** Three team members submitted expense receipts via the mobile camera function. The AI scanned them. The accountant reviews the extracted data in Kvitton, links each receipt to its corresponding transaction. The "Saknar underlag" count drops to zero.

**10:00 — Month-end depreciation.** It's the last day of the month. The accountant opens Inventarier, clicks "Bokför avskrivning." Twelve depreciation entries are created for company laptops, office furniture, and the company car. They appear in Verifikationer instantly.

**10:15 — Ledger review.** The accountant opens Verifikationer. All entries from the morning's work are there, sequentially numbered, with full counter-party identification, VAT breakdowns, and document references. They run a quick filter on BAS account 2641 (ingående moms) to verify the VAT totals match expectations. Everything checks out. The accountant exports the period's verifications as a PDF for the archive.

**10:30 — Done.** The monthly bookkeeping that used to take half a day in traditional software took 90 minutes. Every entry is legally complete. Every verification has its supporting document. The momsdeklaration data is ready. The ledger is clean.

---

## Design Principles

**Professional-grade, not consumer-grade.** Every screen is built for someone who processes hundreds of transactions per month. Stat cards show the numbers that matter. Filters work on status badges, not free-text guessing. Bulk actions exist because accountants work in batches.

**AI assists, the accountant decides.** The AI extracts data, suggests categories, and fills forms — but nothing is committed without explicit approval. The accountant reviews, corrects if needed, and confirms. This is a co-pilot model, not an autopilot.

**Minimal API calls, maximum responsiveness.** Stats are cached. Transactions are paginated. No page load fetches everything. The architecture is designed for the accountant who has 47 browser tabs open and needs every one of them to be fast.

**Swedish law compliance by design.** BAS kontoplan structure, sequential verification numbering, VAT rate support (25/12/6/0%), and receipt requirements are not afterthoughts — they are the foundation the entire module is built on.

---

## What This Means for the Accountant

Scope AI's Bokföring module replaces the fragmented workflow of traditional accounting software — where transactions, invoices, receipts, assets, and the ledger live in disconnected screens with different interaction patterns — with a unified, status-driven workspace where data flows forward automatically.

**Time saved:** The connected pipeline means every piece of data is entered once and carried forward. The counter-party org-nummer entered on a transaction is the same org-nummer that appears on the verification. The VAT breakdown on an invoice is the same data that feeds the momsdeklaration. No re-keying, no reconciliation spreadsheets, no "where did that number come from" during audit.

**Errors prevented:** Legal completeness at the point of entry means the accountant can't accidentally create an invoice missing the company's VAT number, or a transaction without a document reference. The form structure itself enforces the data model that Swedish law requires.

**Audit readiness built in:** When Skatteverket contacts the company, the accountant opens Verifikationer, filters by account or period, and exports. Every verification has its supporting document linked. Every invoice has a sequential number. Every transaction has counter-party identification. The audit trail is not something the accountant builds after the fact — it is the natural output of doing the daily work.

**AI that respects the profession:** The AI handles the tedious parts — extracting data from PDFs, suggesting categories, calculating VAT — but the accountant makes every decision. Nothing is booked without confirmation. Nothing is committed without review. The AI is a tool in the accountant's hands, not a replacement for professional judgment.

This is not a prototype. This is the bookkeeping engine for a production Swedish accounting application, built from the ground up for the legal and professional requirements of Swedish accounting.
