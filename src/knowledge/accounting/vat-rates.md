# Swedish VAT Rates (Mervärdesskatt)

**Source:** Mervärdesskattelagen (ML), Skatteverket  
**Verified:** 2024–2026 (no changes planned)

## Standard Rates

| Rate | Category | Examples |
|------|----------|---------|
| 25% | Standard rate — most goods and services | Software, consulting, electronics, clothing, office supplies, phone, hosting, marketing |
| 12% | Food and hospitality | Groceries, restaurant meals, hotel accommodation, takeaway food |
| 6% | Culture and transport | Books, newspapers, cinema, concert tickets, domestic passenger transport (SJ, SL, bus, taxi, domestic flights) |
| 0% | Exempt / Zero-rated | Medical care, dental, financial services, insurance, education, export outside EU |

## VAT Accounts (BAS)

| Account | Name | Use |
|---------|------|-----|
| 2610 | Utgående moms 25% | Output VAT on 25% sales |
| 2620 | Utgående moms 12% | Output VAT on 12% sales |
| 2630 | Utgående moms 6% | Output VAT on 6% sales |
| 2640 | Ingående moms | Input VAT on all purchases |
| 2650 | Redovisningskonto för moms | Net VAT settlement account |

## Ingående moms (Input VAT)

Ingående moms is always posted to account **2640** regardless of the rate on the purchase.  
Account 1640 is used in some setups as a receivable when VAT is expected back from Skatteverket.

## Common Exemptions

- **Försäkringar** (account 6310): VAT exempt — no ingående moms deductible
- **Finansiella tjänster**: VAT exempt
- **Sjukvård / tandvård**: VAT exempt
- **Utbildning**: VAT exempt (when provided by approved institution)
- **Representation**: Input VAT on meals only 50% deductible for income tax, but full VAT deductible on actual business meetings

## EU and Export Rules

- **Försäljning inom EU** (account 3040): Zero-rated, buyer handles VAT in their country (reverse charge for B2B)
- **Försäljning utanför EU** (account 3050): Zero-rated export, no Swedish VAT
- **Inköp från EU** (account 4531): Reverse charge — buyer reports both output and input VAT
- **Inköp från utanför EU** (account 4535): Import VAT handled via Tullverket or reverse charge

## VAT Reporting Periods

- Monthly (if turnover > 40 MSEK/year)
- Quarterly (if turnover 1–40 MSEK/year) — most small businesses
- Yearly (if turnover < 1 MSEK/year, with conditions)

Declaration filed via Skatteverket. Deadline: last day of month following reporting period (quarterly = end of Feb, May, Aug, Nov).
