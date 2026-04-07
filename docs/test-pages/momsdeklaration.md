# Momsdeklaration

Test page: `/test-ui/walkthroughs/momsdeklaration/`

## What it shows

Scooby presents a complete VAT declaration for a quarter. Every VAT field traces back to the specific invoices and purchases in the bookkeeping — the user sees which transactions produced each number.

## UI Components

- **ScoobyPresentation** — header with message + 3 highlights (utgående moms, ingående moms, att betala)
- **WalkthroughRenderer** (block-based) with:
  - Momspliktig försäljning (Ruta 05): annotation (source: kundfakturor konto 3001), financial-table (verifikation, kund, datum, belopp exkl. moms + totals)
  - Utgående moms 25% (Ruta 10): key-value (försäljning, momssats, utgående moms)
  - Ingående moms (Ruta 48): annotation (source: leverantörsfakturor konto 2641), financial-table (verifikation, leverantör, beskrivning, moms + totals)
  - Slutberäkning: key-value (utgående − ingående = att betala)
  - Status-check: försäljning stämd mot konto 3001, ingående moms stämd mot konto 2641, momsavstämning balanserar, klart för inlämning
  - Info-card: inlämningsdatum + betalning
  - Action-bar: Godkänn & skicka, Exportera XML, Stäng

## Expected behavior

When user asks "Gör momsdeklarationen" or "Hur mycket moms ska jag betala?":

1. Scooby determines the reporting period (monthly/quarterly based on company size)
2. Tool aggregates sales by VAT rate from verifikationer (konto 3001–3099)
3. Tool aggregates input VAT from purchases (konto 2641)
4. Tool cross-references with EU sales, reverse charge, etc. if applicable
5. Returns WalkthroughResponse with every transaction visible

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Period (Q1, monthly, etc.) | `companies.vat_period` + current date | Yes |
| Sales invoices (kund, belopp, datum) | `verifications` on konto 3000–3099 + linked invoices | Yes |
| Verifikation numbers (A03, A09, etc.) | `verifications.verification_number` | Yes |
| Customer names | `invoices.customer_name` or `contacts` table | Yes |
| Supplier names | `verifications.description` or `contacts` table | Yes |
| Purchase descriptions | `verifications.description` | Yes |
| Momssatser (25%, 12%, 6%) | Swedish VAT law — rarely changes | Yes |
| Ingående moms per verifikation | `verification_rows` on konto 2641 | Yes |
| Filing deadline | Computed from period + company reporting frequency | Yes |

## What must NEVER be static in production

- **All verifikation data** — from actual bookkeeping entries
- **Invoice/purchase amounts** — from verifikationer
- **Customer/supplier names** — from contacts or verifikation descriptions
- **Period** — from company settings + current date
- **Filing deadline** — computed from period (12th of month after quarter end for kvartalsmoms)

## What CAN be static

- Ruta labels ("Ruta 05", "Ruta 10", "Ruta 48", "Ruta 49")
- VAT rate labels ("25%")
- Info card text (deadline rules)
- Section headings
