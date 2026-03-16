# Workflow: Page Overlays

> Detail views that open when a user clicks a table row on an information page. Replaces all dialogs.

## What They Are

Page overlays are the detail inspection layer for information pages. When a user clicks a table row (a transaction, invoice, verification, employee, etc.), an overlay takes over the main content area showing the full detail of that item.

**No dialogs.** No large modals. No popups. The overlay renders in the same space as the page content, with the sidebar staying visible. Same visual pattern as walkthrough overlays — consistent UX across the entire app.

## The Pattern

```
User is on an information page (e.g., Transaktioner)
  → Sees a table of items
  → Clicks a table row
  → Main content area transitions to the page overlay
  → Overlay shows full detail of that item
  → Read-only — no edit forms, no input fields
  → "Tillbaka" returns to the table
  → "Fråga Scooby" opens chat with this item as context
```

## What the Overlay Shows

Depends on the item type, but follows a consistent structure:

```
1. Header — item type + identifier (e.g., "Verifikation A-2026-0047")
2. Key fields — the important data in a clean layout
3. Related items — linked transactions, receipts, invoices
4. History — timeline of changes (if applicable)
5. Actions — "Tillbaka" + "Fråga Scooby"
```

### Examples by Item Type

**Transaction overlay:**
- Amount, date, counterparty, status
- Linked verification (if booked)
- Linked receipt (if matched)
- "Fråga Scooby" → "Bokför den här transaktionen"

**Invoice overlay:**
- All invoice fields, line items, totals
- Payment status, due date
- Linked verification
- PDF preview

**Verification overlay:**
- All journal entry lines (debit/credit)
- Supporting documents
- Period, sequential number

**Employee overlay:**
- Personal details, employment info
- Salary history, active benefits
- Recent payroll runs

## Settings Overlay

Settings follows the same pattern. Click the settings button → overlay takes over the main content area. Contains:
- Företag (company info)
- Profil (user profile)
- Språk & Region
- Billing (subscription, token balance, receipts)

No settings dialog. Same overlay pattern as everything else.

## Key Difference from Walkthrough Overlays

| | Page Overlay | Walkthrough Overlay |
|---|---|---|
| **Trigger** | Click table row on a page | Click card in chat, or AI renders report |
| **Content** | Real data from DB (read-only) | AI-generated or computed output |
| **Editable** | No — "Fråga Scooby" to modify | Inline-editable cards + "Godkänn" |
| **Actions** | Tillbaka, Fråga Scooby | Godkänn, Ändra, Gå till [sida] |

Both take over the main content area. Both keep the sidebar visible. Same visual language, different purpose.

## What Connects Here

- Information pages contain the tables whose rows trigger page overlays
- "Fråga Scooby" hands off to the AI interface with context
- Walkthrough overlays are the sibling pattern for AI-generated content
- Settings button triggers the settings overlay
