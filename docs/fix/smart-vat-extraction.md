# Feature: Split-VAT Bookings

> **Flow:** [`docs/flows/tools.md`](../flows/tools.md)
> **Status:** ⬜ Not started — future feature

## What This Is

A receipt can have multiple VAT rates (e.g., grocery receipt: 12% food + 25% household items). Currently `create_receipt` accepts a single `vatRate` parameter. Scooby already reasons about VAT freely — there's no dropdown or hardcoded picker. The only gap is that the service layer doesn't support split-VAT bookings (multiple ledger rows for one receipt).

## What Needs to Be Built

1. **`create_receipt` schema** — Accept an array of line items with individual VAT rates instead of a single global rate
2. **`receipt-service.ts`** — Support creating multiple ledger rows for one receipt
3. **`ReceiptCard`** — Display VAT breakdown when multiple rates exist
4. **System prompt** — Add guidance for common split-VAT scenarios (grocery, mixed retail, reverse charge for EU/construction)

## What Does NOT Need to Change

- Scooby already decides VAT rates — no OCR dropdown exists, no hardcoded picker
- BAS account mapping already works through Scooby's reasoning
- Single-VAT receipts continue working as-is

## Acceptance Criteria
- [ ] `create_receipt` supports multiple line items with different VAT rates
- [ ] Service creates correct multi-row ledger entries
- [ ] Card displays VAT breakdown
