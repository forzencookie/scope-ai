# Feature Map & Interconnectivity

This document maps the application **Page-by-Page** and explains how different modules **connect** to one another.

---

## 1. Översikt (Dashboard)
**Route:** `/`

**Purpose:** The cockpit. Gives the CEO immediate situational awareness without needing to dig into ledgers.

**Key Features:**
*   **Action Inbox:** List of urgent tasks (e.g., "Sign AGI", "Categorize 3 Transactions").
*   **Financial Pulse:** Real-time graphs of Cash Flow, Runway, and Profit.
*   **AI Insight:** One-sentence summary of the company's status (e.g., "All good, taxes paid for Q1.").

**Connections:**
*   Aggregates data from **ALL** other modules to generate Alerts.

---

## 2. Händelser (Events/Roadmap)
**Route:** `/handelser`

**Purpose:** The "Timeline" of the company. A mix of past history and future planning.

**Key Features:**
*   **The Roadmap:** A Kanban/List view of major company milestones (e.g., "Hire first dev", "Launch Marketing").
*   **Event Feed:** Chronological log of what happened (e.g., "Payroll ran for Jan", "VAT filed").

**Connections:**
*   **→ Kalender:** Roadmap items with dates sync to the user's external Calendar (WebCal).
*   **→ Bokföring:** Clicking a past event (e.g., "Invoice Paid") links to the Verification.

---

## 3. Bokföring (Accounting)
**Route:** `/bokforing`

**Purpose:** The engine room. Managing the specific transactional data.

### Sub-features:
*   **Transaktioner:** Bank feed. The user categorizes raw bank lines here.
    *   *Effect:* Creates Verifications.
*   **Fakturor (Invoices):** Create and send customer invoices.
    *   *Effect:* Booking an invoice creates an Accounts Receivable (Kundfordringar) entry.
*   **Kvitton (Receipts):** Upload and OCR receipts.
    *   *Effect:* Matches against Bank Transactions.
*   **Verifikationer:** The General Ledger. Read-only view of the double-entry backend.

**Connections:**
*   **← Löner:** Payroll runs automatically appear here as Verifications (Dr Salary Exp / Cr Bank).
*   **→ Rapporter:** All data here feeds directly into P&L and Balance Sheet.

---

## 4. Löner (Payroll)
**Route:** `/loner`

**Purpose:** Paying people and handling taxes (AGI).

**Key Features:**
*   **Run Payroll:** Wizard to generate payslips for a month.
*   **Employee Registry:** Salary details, tax tables, bank accounts.
*   **Vacation/Benefits:** Tracking non-cash compensation (Tjänstebil, Friskvård).

**Connections:**
*   **→ Bokföring:** When payroll is "Locked", it writes Journal Entries to the ledger.
*   **→ Rapporter:** Generates the **AGI** (Arbetsgivardeklaration) data for tax filing.
*   **→ Ägare:** Validates "Löneunderlag" for 3:12 (K10) calculations.

---

## 5. Rapporter (Reports)
**Route:** `/rapporter`

**Purpose:** Compliance and Analysis. "The Output".

**Key Features:**
*   **Resultat & Balans:** Standard financial statements.
*   **Momsrapport:** VAT return calculator (Sales Tax vs Input Tax).
*   **AGI (Employer Declaration):** Monthly tax filing for employees.
*   **Årsredovisning:** The final annual report package.

**Connections:**
*   **← Bokföring:** Source of truth.
*   **← Löner:** Source for AGI.
*   **← Ägare:** Source for Share Capital and Equity data.

---

## 6. Ägare (Ownership/Cap Table)
**Route:** `/agare`

**Purpose:** Managing the equity side of the business (Aktiebolag specific).

**Key Features:**
*   **Aktiebok:** Legal register of who owns shares.
*   **Stämmor (General Meetings):** Generating legal minutes for Annual Meetings.
*   **Utdelning (Dividends):** Calculating **K10 / 3:12** amounts (Low tax dividends vs Salary).

**Connections:**
*   **→ Löner:** The K10 calculator reads Payroll data to see if you qualify for the "Main Rule" (Huvudregeln).
*   **→ Bokföring:** Declaring a dividend creates a Liability (Skuld till aktieägare) and reduces Equity.

---

## 7. Inställningar (Settings)
**Route:** `/installningar`

**Purpose:** Configuration foundation.

**Key Features:**
*   **Company Profile:** Org number, Tax year.
*   **Integrations:** BankID, Skatteverket API, Bank feeds.
*   **AI Preferences:** Tone of voice, proactivity level.

**Connections:**

---

## 8. Infrastructure & User Journey
**Route:** `(auth)/*` and `(marketing)/*`

**Purpose:** Getting the user IN and keeping them subscribing.

### A. Public Website (Marketing)
*   Routes: `/`, `/funktioner`, `/priser`, `/om-oss`
*   **Purpose:** SEO, Conversion, Brand trust.
*   **Key Features:** Pricing toggles, Feature showcases.

### B. Onboarding (The Funnel)
*   Routes: `/register`, `/onboarding`, `/choose-plan`
*   **Purpose:** Data enrichment.
*   **Flow:**
    1.  **Register:** Email/BankID.
    2.  **Company Search:** User inputs "Google" -> We fetch specific "Google AB" data from Bolagsverket API.
    3.  **Plan Selection:** Stripe checkout.
    4.  **Initial Config:** Fiscal year setup.

### C. Billing (Subscription)
*   Routes: `/billing`, `/installningar` (Billing tab)
*   **Purpose:** Getting paid.
*   **Integration:** Stripe Customer Portal.
*   **Features:** Upgrade/Downgrade, Invoice history.

### D. Webhooks (`/api/receiver`)
*   **Purpose:** Listening to the outside world.
*   **Connectors:**
    *   `stripe`: Payment success/failure.
    *   `fortnox`/`bank`: (Future) Bank feeds.
    *   `resend`: Email delivery status.

