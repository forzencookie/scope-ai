# Business Domain Context (Sweden)

Scope AI is an automated accounting & CEO-companion app for Swedish SMBs (Aktiebolag).

## 1. The "Big Three" Features

### A. Bokföring (Accounting)
*   **Regulation:** Must follow *Bokföringslagen* (BFL).
*   **Core Entities:**
    *   `Verifikationer` (Journal Entries): Must match Dr/Cr. Correction prohibited (must reverse).
    *   `Leverantörsfakturor` (Accounts Payable).
    *   `Kundfakturor` (Accounts Receivable).

### B. Löner (Payroll)
*   **Regulation:** AGI (Arbetsgivardeklaration på individnivå) filed monthly to Skatteverket.
*   **Cost Structure:** Gross Salary + Employer Contrib (~31.42%) = Total Cost.
*   **Entities:** Employees, Payslips, Benefits (Förmåner).

### C. Rapporter (Compliance)
*   **Moms (VAT):** Quarterly or Monthly declaration.
*   **Årsredovisning (Annual Report):** K2 rules (simplification for smaller firms).
*   **Inkomstdeklaration 2 (Corporate Tax):** Flat rate 20.6%.

## 2. Distinctive Swedish Rules (Gotchas)
*   **3:12 Rules (K10):** Special tax rules for owners of close companies. Dividends are taxed lower (20%) up to a "Gränsbelopp". *Scope AI must calculate this optimized amount.*
*   **Periodiseringsfond:** Option to defer 25% of profit to lower tax used for 6 years.
*   **Representationsregler:** Strict limits on deducting meals/parties.

## 3. User Personas
*   **The "Solo" Founder:** Knows their trade (Code/Design/Plumbing) but fears Skatteverket. Needs specific, simple guidance.
*   **The "Pro" Founder:** Wants speed. "Just book it."
