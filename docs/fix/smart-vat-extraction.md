# Fix: Smart Receipt Extraction (Dynamic VAT)

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md)
> **Status:** 🔴 Red (Currently Hardcoded)

## The Problem
Receipt extraction is currently "stupid OCR." It expects standard VAT rates (25, 12, 6) and struggles with non-standard scenarios. A "Digital CFO" needs to handle the complexity of the Swedish tax system dynamically.

## The Fix: Moving from Picks to Logic

### 1. Dynamic VAT Identification
- **Old Way:** OCR picks from a dropdown of [25, 12, 6, 0].
- **New Way:** 
    - AI identifies the **Merchant Category** and **Item Descriptions**.
    - AI detects **Mixed VAT** (e.g., a grocery receipt with both 12% food and 25% household items).
    - AI detects **Reverse Charge** (Omvänd skattskyldighet) for construction or EU purchases.
    - AI detects **Tax-Free** items (Insurance, healthcare, postage stamps).

### 2. Intelligent BAS Mapping
- **Old Way:** Basic regex for vendor names.
- **New Way:** AI reasons about the purchase. 
    - *Example:* A receipt from "Circle K". 
        - If amount is 800 SEK → Mapping: 5800 (Travel).
        - If amount is 45 SEK → Mapping: 6071 (Representation/Coffee).
        - If it's a car wash → Mapping: 5613 (Car maintenance).

## Technical Transition
- **Tool:** Update `extract_receipt` schema to return an array of `line_items` with their own VAT rates, rather than a single global rate.
- **Service:** `receipt-service.ts` must support split-VAT bookings (multiple ledger rows for one receipt).
- **UI:** `ReceiptCard` must display the VAT breakdown if multiple rates were found.

## Acceptance Criteria
- [ ] Successful extraction of mixed-VAT receipts.
- [ ] Automatic identification of reverse-charge (EU) invoices.
- [ ] No "NaN" or "Unknown" values when VAT is 0% or non-standard.
