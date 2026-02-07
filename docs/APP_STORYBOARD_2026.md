# Professional App Storyboard 2026 (Cinematic Map)

> [!IMPORTANT]
> **Scope of Mapping**: This document serves as a frame-by-frame visual storyboard of the application's functional flow, identifying intended logic vs. actual implementation and critical failures.

### 🏠 Public Pages
-   `/` (Landing page)
-   `/login` (Login page)
-   `/register` (Registration page)
-   `/forgot-password` (Password recovery)
-   `/priser` (Pricing)
-   `/funktioner` (Features)
-   `/om-oss` (About Us)
-   `/kontakt` (Contact)
-   `/villkor` (Terms & Conditions)
-   `/integritetspolicy` (Privacy Policy)
-   `/choose-plan` (Plan selection)
-   `/onboarding` (Onboarding wizard)

### 📊 Dashboard Pages (Main Sections)
-   `/dashboard` (Overview/Main Dashboard)
-   `/dashboard/bokforing` (Accounting & Bookkeeping)
-   `/dashboard/rapporter` (Financial Reports)
-   `/dashboard/loner` (Payroll)
-   `/dashboard/agare` (Owners & Governance)
-   `/dashboard/handelser` (Events / Storage Room)
-   `/dashboard/installningar` (Settings)
-   `/dashboard/foretagsstatistik` (Company Statistics)

### 📂 Nested Tabs (URL with Query Params)
**Bokföring (`/dashboard/bokforing`)**
-   `?tab=transaktioner`
-   `?tab=fakturor`
-   `?tab=kvitton`
-   `?tab=inventarier`
-   `?tab=verifikationer`

**Rapporter (`/dashboard/rapporter`)**
-   `?tab=resultatrakning`
-   `?tab=balansrakning`
-   `?tab=momsdeklaration`
-   `?tab=inkomstdeklaration`
-   `?tab=agi`
-   `?tab=arsredovisning`
-   `?tab=arsbokslut`
-   `?tab=k10`

**Löner (`/dashboard/loner`)**
-   `?tab=lonebesked`
-   `?tab=benefits`
-   `?tab=team`
-   `?tab=egenavgifter`
-   `?tab=delagaruttag`

**Ägare & Styrning (`/dashboard/agare`)**
-   `?tab=aktiebok`
-   `?tab=delagare`
-   `?tab=utdelning`
-   `?tab=medlemsregister`
-   `?tab=bolagsstamma`
-   `?tab=arsmote`
-   `?tab=firmatecknare`

### 🛠 Administrative / Other
-   `/users` (User management)
-   `/auth/checkout` (Checkout flow)

### 📑 Hidden Pages (Dialogs & Wizards without URLs)
These components act as full-screen or focused sub-pages and must be audited for their internal logic and symbiosis.

**Bokföring (Accounting)**
-   `BookingDialog` (`bokforing.tsx`): The main entry point for all bookings.
-   `NyTransaktionDialog` (`ny-transaktion.tsx`): Creating manual bank entries.
-   `LeverantorsfakturaDialog` (`leverantor/index.tsx`): The complex AI-OCR flow for paying bills.
-   `KundfakturaDialog` (`faktura/index.tsx`): The engine for creating outgoing invoices.
-   `VerifikationDetailsDialog`: The immutable record viewer.
-   `BetalningDialog`: Matching invoices to payments.
-   `Månadsavslut` (`month-closing.tsx`): Period locking and reconciliation engine.

**Löner (Payroll)**
-   `PayslipCreateDialog`: The 3-step AI wizard for running payroll.
-   `PayslipDetailsDialog` (`spec.tsx`): The generated payslip viewer (the "Raw Result").
-   `BenefitDetailsDialog` (`forman.tsx`): Managing employee benefits.
-   `NewWithdrawalDialog`: For sole traders/owners taking money out.

**Rapporter (Tax & Reporting Wizards)**
-   `MomsWizardDialog`: Step-by-step VAT filing.
-   `InkomstWizardDialog`: The complex INK2 adjustment flow.
-   `ArsredovisningWizardDialog`: Creating the official Annual Report.
-   `K10WizardDialog`: Calculating the owner's dividend space.
-   `SRUPreviewDialog`: The final file check before Gov submission.

**Ägare & Styrning (Corporate Governance)**
-   `ActionWizard`: AI assistant for complex corporate actions (share issues, etc.).
-   `TransactionDialog` (`Aktiebok`): Recording share transfers.
-   `KallelseDialog`: Creating meeting invitations.
-   `MoteDialog` & `MotionDialog`: Board meeting and proposal management.

**System & Onboarding**
-   `OnboardingWizard`: The entire initial setup engine.
-   `SettingsDialog`: Core company profile and integration controls.
-   `BuyCreditsDialog`: Credit management for AI features.

---

## 📜 The Golden Standard Methodology
The "Golden Standard" for this storyboard is a **Cinematic Functional Mapping** approach. Each page is mapped through:
1.  **Frame-by-Frame TUI Wireframes**: A step-by-step visual storyboard (Unicode/Box-drawing) representing the real user journey.
2.  **Scene Transitions**: Visualizing exactly what happens when a button is clicked or a dialog appears.
3.  **Functional Audit Breakdown**:
    *   **Intended Purpose**: Why does this page exist from an accountant's perspective?
    *   **Actual Workflow**: How does it actually execute in the current code?
    *   **Issues**: Identifying legal, logical, or UX gaps (Critical Failures).

---

## Phase 1: Bokföring (Accounting Audit)

### 1. Transaktioner (`?tab=transaktioner`)

**Frame 1: Overview**
The user lands on the transaction list to review bank events.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  TRANSAKTIONER                                             [+] NY HÄNDELSE   │
│  Hantera dina bokförda transaktioner                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Status ──────────────────────────────────┐  ┌ Översikt ──────────────────────┐
│  (!) 3 PENDING                           │  │ TOTALT: 42 st                  │
│  Du har 3 transaktioner som saknar       │  │ IN:     145,000 kr             │
│  underlag. [VISA PENDING]                │  │ UT:     -32,450 kr             │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Grid ────────────────────────────────────────────────────────────────────────┐
│  LEVERANTÖR      DATUM       BELOPP      STATUS      KONTO                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ICA Supermarket 2024-02-15  -450 kr     [GODKÄND]   1930 Företagskonto      │
│  Apple Services  2024-02-10  -129 kr     [SAKNAS]    1930 Företagskonto      │
│  Skatteverket    2024-02-01  -12,500 kr  [BOKFÖRD]   1630 Skattekonto        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Import Transaction**
User clicks `[+] NY HÄNDELSE`.

```text
┌── NY TRANSAKTION (Dialog) ───────────────────────────────────────────────────┐
│                                                                              │
│  [ Enskild ]   [ Z-Rapport ]   [ Massimport ]                                │
│                                                                              │
│  Beskrivning:  [ _________________ ]                                         │
│  Belopp:       [ 0.00              ] kr                                      │
│  Datum:        [ 2024-02-15        ] [v]                                     │
│  Konto:        [ 1930              ] (Företagskonto)                         │
│                                                                              │
│  [ Avbryt ]                                                  [ Lägg till ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Book Transaction**
User clicks the "Apple Services" row in the grid.

```text
┌── BOKFÖRING (BookingDialog) ─────────────────────────────────────────────────┐
│  Transaktion: Apple Services (-129 kr)                                       │
│                                                                              │
│  [1. Detaljer] > [2. Bokföring] > [3. Bekräfta]                              │
│                                                                              │
│  Kategori: [ Programvara & Data ]  (AI Förslag: 5420)                        │
│  Konto:    [ 5420 Programvaror  ]                                            │
│  Moms:     [ 2641 Ingående moms ]                                            │
│                                                                              │
│  (!) Varning: Momsen måste vara 25% (25.80 kr).                              │
│                                                                              │
│  [ Avbryt ]                                                     [ Bokför ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Audit Verdict:**
*   **Workflow:** The flow from "List" -> "Add" -> "Book" is logical.
*   **Critical Failure:** Frame 3 (BookingDialog) exposes the fundamental flaw. It forces a 1:1 mapping. If "Apple Services" was a mixed purchase (software + hardware with different tax rules), the user cannot split this transaction in this dialog.

### 2. Fakturor (`?tab=fakturor`)

**Frame 1: Overview (The Kanban Board)**
The user enters the Invoices tab to see a visual overview of their cash flow (Accounts Receivable/Payable).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  FAKTUROR                                                  [+] NY FAKTURA [v]│
│  Hantera inkommande och utgående fakturor                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Sammanfattning ──────────────────────────┐  ┌ Filter ────────────────────────┐
│  IN:  120,500 kr                         │  │ [ Alla ] [ In- ] [ Ut- ]       │
│  UT:  -45,200 kr                         │  │                                │
│  (!) 2 FÖRFALLNA                         │  │ [ Välj period...           ]   │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Kanban Board ────────────────────────────────────────────────────────────────┐
│  UTKAST / MOTTAGNA      SKICKADE / ATTEST.      BETALDA                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│ │ #1024 - Kunden  │    │ #1023 - Client X│    │ #1022 - StartUp │            │
│ │ 12,500 kr [IN]  │    │ 5,000 kr [IN]   │    │ 25,000 kr [IN]  │            │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│ ┌─────────────────┐                                                          │
│ │ AWS - Jan Bill  │                                                          │
│ │ 1,200 kr [UT]   │                                                          │
│ └─────────────────┘                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Create Customer Invoice**
User clicks `[+] NY FAKTURA` -> `Kundfaktura`.

```text
┌── SKAPA FAKTURA (InvoiceCreateDialog) ─────────────────────────── [ EXPAND ] ┐
│                                                                              │
│  Kund:      [ Kunden AB         ]   Datum: [ 2024-02-15 ]                    │
│  E-post:    [ kunden@ab.se      ]   Förf:  [ 2024-03-15 ]                    │
│                                                                              │
│  Rader:                                                                      │
│  [ Tjänst: Webbutveckling ]  [ 10 h ]  [ 1,000 kr ]  [ 25% v ]  [ 10,000 kr ] │
│  [ + Lägg till rad ]                                                         │
│                                                                              │
│  Betalningsvillkor: [ 30 dagar v ]                                           │
│  OCR / Referens:    [ 1024       ] <-- (MISSING: Auto-generation logic)      │
│                                                                              │
│  --------------------------------------------------------------------------  │
│  Netto: 10,000 kr    Moms: 2,500 kr    TOTALT: 12,500 kr                     │
│                                                                              │
│  [ Avbryt ]                                                 [ Skapa & skicka]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Process Supplier Invoice (OCR)**
User clicks `[+] NY FAKTURA` -> `Leverantörsfaktura`.

```text
┌── MOTTAG FAKTURA (SupplierInvoiceDialog) ────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐   ┌── AI EXTRAHERING ─────────────────┐ │
│  │                                 │   │ Leverantör: [ AWS EMEA ]          │ │
│  │         [ FAKTURA.PDF ]         │   │ Datum:      [ 2024-02-14 ]        │ │
│  │                                 │   │ OCR:        [ 73910284 ]          │ │
│  │           (Preview)             │   │ Belopp:     [ 1,200 kr ]          │ │
│  │                                 │   │ Moms:       [ 240 kr   ] (20%)    │ │
│  └─────────────────────────────────┘   └───────────────────────────────────┘ │
│                                                                              │
│  Konto: [ 6540 IT-tjänster ]                                                 │
│                                                                              │
│  [ Avbryt ]                                                     [ Godkänn ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To manage the lifecycle of sales and debt.
2.  **Actual Workflow**:
    *   **Customer Side**: Manual data entry for sales. Supports line items and basic VAT calculation.
    *   **Supplier Side**: Heavy reliance on AI OCR to speed up data entry for bills.
3.  **Issues**:
    *   **Invoicing Standards**: The `InvoiceCreateDialog` (Frame 2) lacks a standard Swedish OCR generator (Luhn algorithm). It requires manual input or uses the invoice ID, which can lead to payment matching issues in real banking.
    *   **Symbiosis Gap**: There is no easy "One-click to Book" for a Draft invoice that doesn't also involve "Sending" it. The accounting and the delivery of the invoice are tightly coupled in the code.

### 3. Kvitton (`?tab=kvitton`)

**Frame 1: Overview (The Digital Shoebox)**
The user lands on the receipts page to see all uploaded expenses and their processing status.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  KVITTON LOGG                                              [↑] LADDA UPP     │
│  Ladda upp och hantera dina kvitton                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik ───────────────────────────────┐  ┌ Filter ────────────────────────┐
│  TOTALT: 124 st                          │  │ [ Sök kvitto...            ]   │
│  (!) 8 ATT BOKFÖRA                       │  │                                │
│  [ VISA ATT BOKFÖRA ]                    │  │ [ Alla v ] [ Status v ]        │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Receipts Grid ───────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ [IMAGE]  │  │ [IMAGE]  │  │ [IMAGE]  │  │ [IMAGE]  │  │ [IMAGE]  │        │
│  │ ICA      │  │ OKQ8     │  │ Webhallen│  │ Adobe    │  │ PostNord │        │
│  │ 450 kr   │  │ 850 kr   │  │ 12,500 kr│  │ 249 kr   │  │ 125 kr   │        │
│  │ [GODKÄND]│  │ [PENDING]│  │ [BOKFÖRD]│  │ [MISSING]│  │ [AUTO]   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                              │
│  Visar 1-5 av 124                                        < Föregående  Nästa >│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Upload & OCR (UnderlagDialog)**
User clicks `[↑] LADDA UPP`. The AI starts processing the document immediately.

```text
┌── LADDA UPP UNDERLAG (UnderlagDialog) ───────────────────────────────────────┐
│                                                                              │
│  ┌───────────────────────────────┐     PROSESSAR FIL...                      │
│  │                               │     [||||||||||||--------] 60%            │
│  │       SLÄPP FIL HÄR           │                                           │
│  │             ELLER             │     Extraherar:                           │
│  │       [ VÄLJ FIL ]            │     - Leverantör: OKQ8                    │
│  │                               │     - Datum: 2024-02-14                   │
│  └───────────────────────────────┘     - Belopp: 850 kr                      │
│                                                                              │
│  Typ: [ Kvitto v ]   Beskrivning: [ Tankning firmabil ]                      │
│                                                                              │
│  [ Avbryt ]                                                     [ Spara ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Final Booking (BookingDialog)**
User clicks `Bokför` on the extracted receipt to finalize the ledger entry.

```text
┌── BOKFÖRING (BookingDialog) ─────────────────────────────────────────────────┐
│  Kvitto: OKQ8 (850 kr)                                                       │
│                                                                              │
│  [1. Detaljer] > [2. Bokföring] > [3. Bekräfta]                              │
│                                                                              │
│  Konto:    [ 5800 Resekostnader ]  (AI Förslag)                              │
│  Motkonto: [ 1930 Företagskonto ]                                            │
│  Moms:     [ 2641 Ingående moms ]  -> 170 kr (25%)                           │
│                                                                              │
│  [ Visa kvitto ]                                                [ Bokför ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To act as a digital archive and OCR-driven entry point for physical expenses.
2.  **Actual Workflow**: High-speed capture where the user only needs to verify what the AI "read".
3.  **Issues**:
    *   **Attachment Orphanage**: If a receipt is booked but the transaction is later deleted, the receipt remains "Booked" but points to a non-existent verification.
    *   **Currency Support**: The OCR and Booking logic struggle with multi-currency receipts (e.g., USD receipts for a SEK company), often ignoring the exchange rate logic.

### 4. Inventarier (`?tab=inventarier`)

**Frame 1: Overview (The Asset Register)**
The user views their list of depreciable assets to track value over time.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  TILLGÅNGAR                                 [BOKFÖR AVSKRIVNING] [+] NY SAK  │
│  Datorer, möbler och andra saker du äger.                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Värdeöversikt ───────────────────────────┐
│  TOTALT VÄRDE:      142,000 kr           │
│  AVSKRIVNINGAR/MÅN: 3,500 kr             │
└──────────────────────────────────────────┘

┌ Grid ────────────────────────────────────────────────────────────────────────┐
│  NAMN            INKÖPT      PRIS        RESTVÄRDE   KONTO                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  MacBook Pro M3  2024-01-10  35,000 kr   33,541 kr   1220 Inventarier        │
│  Kontorsstol     2023-11-05  12,000 kr   10,800 kr   1220 Inventarier        │
│  Server Skåp     2023-06-01  45,000 kr   38,250 kr   1220 Inventarier        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Register New Asset**
User clicks `[+] NY SAK` (Ny tillgång).

```text
┌── LÄGG TILL INVENTARIE (Dialog) ─────────────────────────────────────────────┐
│                                                                              │
│  Namn:                 [ Sony A7 III Kamera    ]                             │
│  Inköpspris (ex moms): [ 24000                 ] kr                          │
│  Inköpsdatum:          [ 2024-02-15            ]                             │
│  Livslängd:            [ 5                     ] år                          │
│                                                                              │
│  Beräknad avskrivning: 400 kr / månad                                        │
│                                                                              │
│  [ Avbryt ]                                                     [ Spara ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Run Monthly Depreciation**
User clicks `[BOKFÖR AVSKRIVNING]`.

```text
┌── AUTOMATISK AVSKRIVNING ────────────────────────────────────────────────────┐
│                                                                              │
│  Detta kommer att skapa en verifikation för FEBRUARI 2024.                   │
│                                                                              │
│  MacBook Pro M3:  -583 kr                                                    │
│  Kontorsstol:     -200 kr                                                    │
│  Server Skåp:     -750 kr                                                    │
│  Sony A7 III:     -400 kr                                                    │
│  -----------------------------------                                         │
│  TOTALT:          -1,933 kr (Konto 7832)                                     │
│                                                                              │
│  [ Avbryt ]                                                     [ Bokför ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To automate the complex task of asset depreciation (write-offs).
2.  **Actual Workflow**: Simple registration followed by a "One-Click" monthly action.
3.  **Issues**:
    *   **Negative Value Leak**: The math logic `price / (years * 12)` is applied blindly every time the button is clicked. There is no check to stop depreciating once the asset reaches 0 kr value, potentially creating negative assets.
    *   **Half-Year Rule**: Lacks support for the Swedish tax rule allowing full-year depreciation even if bought late in the year (rare but applicable for specific schemes).

### 5. Verifikationer (`?tab=verifikationer`)

**Frame 1: Overview (The Journal)**
The user enters the verification list to see the formal chronological record of all accounting events.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  VERIFIKATIONER                                           [+] NY VERIFIKATION│
│  Se alla bokförda transaktioner och verifikationer.                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik ───────────────────────────────┐  ┌ Filter ────────────────────────┐
│  TOTALT ANTAL: 245 st                    │  │ [ Sök konto, belopp...     ]   │
│  SENASTE NR:   A24                        │  │                                │
│                                          │  │ [ Alla v ] [ Serie v ]         │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Grid ────────────────────────────────────────────────────────────────────────┐
│  NR       DATUM       BESKRIVNING           BELOPP      STATUS               │
├──────────────────────────────────────────────────────────────────────────────┤
│  A24      2024-02-15  Försäljning #1024     12,500 kr   [BOKFÖRD]            │
│  A23      2024-02-14  Inköp AWS             -1,200 kr   [BOKFÖRD]            │
│  A22      2024-02-12  Månadens avskrivning  -3,500 kr   [BOKFÖRD]            │
│  A21      2024-02-10  Bankavgift            -50 kr      [BOKFÖRD]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - View Details (VerifikationDetailsDialog)**
The user clicks on row `A24` to see the underlying double-entry rows.

```text
┌── VERIFIKATIONSDETALJER (A24) ───────────────────────────────────────────────┐
│  Datum: 2024-02-15    Typ: Kundfaktura    Status: Godkänd                    │
│                                                                              │
│  KONTO    NAMN                     DEBIT           KREDIT                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  1510     Kundfordringar           12,500.00       -                         │
│  3001     Försäljning 25%          -               10,000.00                 │
│  2611     Utgående moms 25%        -                2,500.00                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  TOTALT                            12,500.00       12,500.00                 │
│                                                                              │
│  [ Ladda ner PDF ]                                             [ Stäng ]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Manual Correction (VerifikationDialog)**
User clicks `[+] NY VERIFIKATION` for a manual adjustment.

```text
┌── SKAPA VERIFIKATION ────────────────────────────────────────────────────────┐
│                                                                              │
│  Datum: [ 2024-02-15 ]    Serie: [ A v ]    Beskrivning: [ Felbokning... ]   │
│                                                                              │
│  RADER:                                                                      │
│  [ 1930 v ] [ Företagskonto ]     [ 500.00 ]  [        ]  [ X ]              │
│  [ 2018 v ] [ Övriga insättn ]    [        ]  [ 500.00 ]  [ X ]              │
│  [ + Lägg till rad ]                                                         │
│                                                                              │
│  Balans: 0.00 (OK)                                                           │
│                                                                              │
│  [ Avbryt ]                                                     [ Spara ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide the definitive, unchangeable audit trail of the company's financial life.
2.  **Actual Workflow**: Effectively displays both system-generated and manual entries. The `DetailsDialog` correctly shows the "Single Source" (Invoice/Receipt) linked to the verification.
3.  **Issues**:
    *   **Inconsistency**: Interestingly, this manual entry dialog (Frame 3) **DOES** support multi-row entries, while the `BookingDialog` (used in Transaktioner/Kvitton) does not. This creates a split experience where users can fix complex bookings manually but cannot create them via the primary "smart" workflows.
    *   **Audit Lock**: There is no "Lock" icon on verifications that have been included in a submitted VAT or Annual Report, meaning users might try to edit/delete them illegally.

### 6. Månadsavslut (`month-closing.tsx`)

**Frame 1: Overview (The Timeline)**
The user enters the month-closing dashboard to view the status of the current and past financial periods.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  MÅNADSAVSLUT                                                                │
│  Stäm av, kontrollera och lås perioder.                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Timeline (2024) ─────────────────────────────────────────────────────────────┐
│  [Jan] [Feb] [Mar] [Apr] [Maj] [Jun] [Jul] [Aug] [Sep] [Okt] [Nov] [Dec]     │
│   (X)   (!)   ( )   ( )   ( )   ( )   ( )   ( )   ( )   ( )   ( )   ( )      │
│  LÅST  AKTIV                                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Vald Månad: FEBRUARI 2024 ──────────────────┐  ┌ Avstämningskoll ────────────┐
│  Status: [ ÖPPEN ]                          │  │ [ ] Avstämning Bank (1930)  │
│                                             │  │ [ ] Momsredovisning         │
│  Verifikationer:  42 st                     │  │ [ ] Arbetsgivardeklaration  │
│  Avvikelser:      (!) 3 st                  │  │ [ ] Inget okategoriserat    │
│                                             │  └─────────────────────────────┘
│  [ LÅS PERIOD ]                             │
└─────────────────────────────────────────────┘
```

**Frame 2: Action - Reconciliation Checklist**
The user checks off items in the `Avstämningskoll` (Checklist).

```text
┌── AVSTÄMNINGSKOLL ───────────────────────────────────────────────────────────┐
│                                                                              │
│  [X] Avstämning Bankkonto (1930)                                             │
│      - Kontrollera att bokfört saldo stämmer med kontoutdraget.              │
│                                                                              │
│  [X] Momsredovisning                                                         │
│      - Momsrapport skapad och kontrollerad (Konto 2650).                     │
│                                                                              │
│  [ ] Arbetsgivardeklaration                                                  │
│      - Löner och avgifter bokförda och rapporterade.                         │
│                                                                              │
│  [X] Inget okategoriserat                                                    │
│      - Inga transaktioner på OBS-kontot (Konto 2990).                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Final Lock (Period Locking)**
User clicks `[ LÅS PERIOD ]`.

```text
┌── PERIODEN LÅSES ────────────────────────────────────────────────────────────┐
│                                                                              │
│  Är du säker på att du vill låsa FEBRUARI 2024?                              │
│                                                                              │
│  Låsning innebär:                                                            │
│  - Inga nya verifikationer kan skapas i perioden.                            │
│  - Befintliga verifikationer kan ej ändras.                                  │
│  - Alla avvikelser anses hanterade.                                          │
│                                                                              │
│  [ Avbryt ]                                                  [ Bekräfta ]    │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────V─┘
                                                                ( LOCKED )
```

**Functional Audit:**
1.  **Intended Purpose**: To ensure the integrity of the ledger by preventing changes to periods already reported to authorities.
2.  **Actual Workflow**: Uses a checklist-based approach to guide the user through the reconciliation process before locking the period.
3.  **Issues**:
    *   **Soft Validation**: The code `// disabled={!period.checks.bankReconciled} // Strict mode?` shows that the lock can be applied even if the checklist is incomplete. This allows for legal non-compliance if the user is careless.
    *   **Bank Balance Gap**: The system shows "Avvikelser" (Discrepancies) but doesn't actually provide a comparison tool against an uploaded Bank Statement within this view. It relies on the user's manual "Check".
    *   **Undo Risk**: The `unlockPeriod` function is easily accessible. In a strict accounting system, unlocking a period should require a formal audit log or "Adjustment Verifications" rather than just a simple toggle.

---
**PHASE 1 COMPLETE.**

---

## Phase 2: Rapporter (Financial Reports Audit)

### 1. Resultaträkning (`?tab=resultatrakning`)

**Frame 1: Overview (The Performance View)**
The user enters the report to see how the company is performing over the current fiscal year compared to the previous one.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  RESULTATRÄKNING                                           [ ANALYSERA ]     │
│  Räkenskapsår 2024 • AKTIEBOLAG                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Intäktsöversikt ─────────────────────────────────────────────────────────────┐
│  PERIOD: 2024-01-01 - 2024-12-31                                             │
│                                                                              │
│  [v] RÖRELSEINTÄKTER                           2024            2023          │
│  ├─ 3001 Försäljning 25%                       120,000 kr      105,000 kr    │
│  ├─ 3004 Försäljning 6%                        25,000 kr       20,000 kr     │
│  └─ TOTALA INTÄKTER                            145,000 kr      125,000 kr    │
│                                                                              │
│  [>] KOSTNADER FÖR MATERIAL                    -32,450 kr      -28,000 kr    │
│  [>] ÖVRIGA EXTERNA KOSTNADER                  -15,200 kr      -12,000 kr    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Deep Dive into Accounts**
The user clicks on account `3001 Försäljning 25%` to see what makes up that number.

```text
┌── ANALYS (Action) ───────────────────────────────────────────────────────────┐
│                                                                              │
│  Användare klickar på: "3001 Försäljning 25%"                                │
│                                                                              │
│  Systemet navigerar till:                                                    │
│  URL: /dashboard/bokforing?tab=verifikationer&account=3001                   │
│                                                                              │
└─────────────────────────────────────────┬────────────────────────────────────┘
                                          │
                                          V
┌── RESULTAT (Verifikationer Filtered) ───┐
│  VERIFIKATIONER (Filter: 3001)          │
│                                         │
│  NR    DATUM       BESKRIVNING   BELOPP │
│  A24   2024-02-15  Faktura 1024  10,000 │
│  A18   2024-02-01  Faktura 1023  2,500  │
└─────────────────────────────────────────┘
```

**Frame 3: Action - AI Analysis**
The user clicks `[ ANALYSERA ]` to get an AI-driven explanation of the numbers.

```text
┌── AI CO-PILOT (Chat Dialog) ─────────────────────────────────────────────────┐
│                                                                              │
│  "Jag ser att dina 'Övriga externa kostnader' har ökat med 26% jämfört       │
│  med föregående år. Den största posten är '6540 IT-tjänster'.                │
│                                                                              │
│  Vill du att jag listar alla transaktioner i den kategorin?"                │
│                                                                              │
│  [ Visa detaljer ]    [ Skapa budget-prognos ]                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To calculate the "Bottom Line" (Net Profit/Loss) by subtracting costs from revenue, providing a YoY (Year-over-Year) comparison.
2.  **Actual Workflow**:
    *   **Data Aggregation**: Fetches all account balances from the DB via a Supabase RPC.
    *   **Grouping**: Uses the `FinancialReportCalculator` to bucket accounts based on the first two digits (e.g., 30xx = Revenue, 40xx = Material).
    *   **Drill-down**: Effectively links back to the General Ledger for auditability.
3.  **Issues**:
    *   **Signage Critical Error**: The calculator (`calculator.ts`) uses simple addition `ebitda = totalRevenue + materialItems + ...`. In standard accounting exports, revenue is often negative (Credit) and costs are positive (Debit). If the database returns raw balances without sign-normalization, the report will calculate a completely inverted result.
    *   **Incomplete Subtotals**: Lacks the formal Swedish sub-results like "Resultat efter finansiella poster" or "Bruttoresultat" in the sectional view; it only shows raw categories.
    *   **No Period Select**: The UI is hardcoded to "Current Year vs Previous Year". There is no way for the user to see "Last Quarter" or a custom date range.

### 2. Balansräkning (`?tab=balansrakning`)

**Frame 1: Overview (The Financial Position)**
The user reviews the company's assets vs. its liabilities and equity to judge the current health of the business.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  BALANSRÄKNING                                             [ KÖR KONTROLL ]  │
│  Per 2024-02-15 • AKTIEBOLAG                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Balanskontroll (SectionCard) ────────────────────────────────────────────────┐
│  (V) Kontrollera att balansräkningen stämmer — momsavstämning,               │
│      kundfordringar, avskrivningar och mer.                  [ KÖR KONTROLL ]│
└──────────────────────────────────────────────────────────────────────────────┘

┌ Tillgångar ──────────────────────────────────────────────────────────────────┐
│  [v] OMSÄTTNINGSTILLGÅNGAR                     2024            2023          │
│  ├─ 1930 Företagskonto                         85,400 kr       42,000 kr     │
│  ├─ 1510 Kundfordringar                        12,500 kr       8,000 kr      │
│  └─ TOTALA TILLGÅNGAR                          97,900 kr       50,000 kr     │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Eget Kapital & Skulder ──────────────────────────────────────────────────────┐
│  [v] EGET KAPITAL                              2024            2023          │
│  ├─ 2081 Aktiekapital                          25,000 kr       25,000 kr     │
│  ├─ 2091 Balanserat resultat                   15,000 kr       10,000 kr     │
│  └─ TOTALT EGET KAPITAL                        40,000 kr       35,000 kr     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Deep Scan (Balanskontroll)**
The user clicks `[ KÖR KONTROLL ]`. The AI Assistant opens with a targeted prompt.

```text
┌── AI CO-PILOT (Financial Audit) ─────────────────────────────────────────────┐
│                                                                              │
│  "Jag genomför en balanskontroll för 2024..."                                │
│                                                                              │
│  - Moms (26xx): Stämmer mot omsättningen. OK.                               │
│  - Kundfordringar (1510): 2 fakturor är förfallna. (!)                       │
│  - Bank (1930): Stämmer ej mot senaste månadsavslut (-450 kr). (!)           │
│                                                                              │
│  Vill du att jag skapar en korrigeringsverifikation för bankdiffen?"         │
│                                                                              │
│  [ Visa avvikelser ]    [ Fixa bankdiff ]                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Jump to Account**
The user clicks on account `1510 Kundfordringar`.

```text
┌── NAVIGATION (Action) ───────────────────────────────────────────────────────┐
│                                                                              │
│  Användare klickar på: "1510 Kundfordringar"                                 │
│                                                                              │
│  Systemet navigerar till:                                                    │
│  URL: /dashboard/bokforing?tab=verifikationer&account=1510                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide a point-in-time snapshot of what the company owns and what it owes.
2.  **Actual Workflow**:
    *   **Balance Calculation**: Aggregates accounts 1xxx (Assets) and 2xxx (Equity/Liabilities).
    *   **AI Integration**: The "Balanskontroll" button is a powerful shortcut to an AI-driven reconciliation process.
3.  **Issues**:
    *   **Signage Complexity**: Unlike the Resultaträkning, the Balansräkning must flip signs for assets (normally Debit/Positive) and liabilities (normally Credit/Negative) to show them all as positive numbers in the UI. The current logic `acc < 2000 ? -b.balance : b.balance` is a brittle hardcoding that fails for "Contra-asset" accounts (like 1229 Depreciation) which will show as a negative asset rather than a subtraction.
    *   **Profit Plug**: The report currently does not automatically include "Årets Resultat" (Net Income from P&L) into the Equity section. This means the Balance Sheet will **never** balance (Assets != Equity + Liabilities) until the year is closed and profit is manually moved to account 2099.
    *   **No Balance Verification**: The UI does not show a "Difference" or a warning if `Sum Assets - Sum Equity/Liabilities != 0`.

### 3. Momsdeklaration (`?tab=momsdeklaration`)

**Frame 1: Overview (Tax Authority Compliance)**
The user enters to see upcoming VAT deadlines and file their tax return.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  MOMSDEKLARATION                                             [+] NY PERIOD   │
│  Hantera momsrapporter och skicka till Skatteverket.                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Status & Deadlines ──────────────────────┐  ┌ AI Assistant (SectionCard) ────┐
│  NÄSTA PERIOD:  JAN-MARS 2024            │  (Bot) Låt AI gå igenom dina      │
│  DEADLINE:      12 MAJ                   │  momsfiler för att hitta fel.     │
│  ATT BETALA:    25,400 kr (Prel.)        │  [ STARTA ANALYS ]                │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Perioder ────────────────────────────────────────────────────────────────────┐
│  PERIOD           STATUS        ATT BETALA/FÅ TILLBAKA     DEADLINE          │
├──────────────────────────────────────────────────────────────────────────────┤
│  Jan-Mar 2024     [KOMMANDE]    + 25,400 kr (Betala)       2024-05-12        │
│  Okt-Dec 2023     [INSKICKAD]   - 12,000 kr (Återfås)      2024-02-12        │
│  Jul-Sep 2023     [INSKICKAD]   + 45,000 kr (Betala)       2023-11-12        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Generate Report (MomsWizardDialog)**
The user clicks `[+] NY PERIOD` or selects the upcoming period. The Wizard opens.

```text
┌── MOMSDEKLARATION (Wizard) ──────────────────────────────────────────────────┐
│  Steg 1: Kontrollera Rutor                                                   │
│                                                                              │
│  [05] Momspliktig försäljning 25%:   [ 120,000 ] kr                          │
│  [10] Utgående moms 25%:             [  30,000 ] kr                          │
│  [48] Ingående moms:                 [   4,600 ] kr                          │
│                                                                              │
│  Resultat (Ruta 49): ATT BETALA 25,400 kr                                    │
│                                                                              │
│  (!) Varning: Ruta 05 och 10 stämmer inte exakt (Momsdiff: 0 kr). OK.        │
│                                                                              │
│  [ Avbryt ]                                           [ Nästa: Granska XML ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Submit & Book**
The user confirms the numbers.

```text
┌── BEKRÄFTA & BOKFÖR ─────────────────────────────────────────────────────────┐
│                                                                              │
│  1. Filen 'moms_2024_Q1.xml' laddas ner (för Skatteverket.se).               │
│  2. En verifikation skapas som nollar momskontona:                           │
│     - Debit:  2611 Utgående moms (30,000 kr)                                 │
│     - Kredit: 2641 Ingående moms (4,600 kr)                                  │
│     - Kredit: 2650 Momsredovisningskonto (25,400 kr)                         │
│                                                                              │
│  [ Gå tillbaka ]                                    [ Bokför & Lås Period ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To calculate the VAT liability (Sales Tax - Input Tax) and prepare the official XML file for the Swedish Tax Agency (Skatteverket).
2.  **Actual Workflow**:
    *   **Auto-Calculation**: Fetches balances from VAT codes (26xx) and maps them to "Rutor" (Boxes) like 05, 10, 48.
    *   **Wizard**: Guides the user through validation before booking.
3.  **Issues**:
    *   **Period Confusion**: The `useVatReport` logic often assumes a Calendar Year. It does not natively support "Broken Fiscal Years" (brutet räkenskapsår) which is common for ABs.
    *   **Manual Adjustments**: If the user finds an error in the Wizard (Frame 2), they cannot edit the numbers directly in the "Box". They must close the wizard, go to `Verifikationer`, find the error, fix it, and restart the wizard. A "Quick Fix" adjustment verification inside the wizard is missing.

### 4. Inkomstdeklaration (`?tab=inkomstdeklaration`)

**Frame 1: Overview (The INK2 Summary)**
The user reviews the pre-filled INK2 form fields generated from their bookkeeping.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  INKOMSTDEKLARATION                                    [ SKAPA DEKLARATION ] │
│  Sammanställ INK2-deklaration baserat på bokföringen.                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik ───────────────────────────────┐  ┌ Form Filter ───────────────────┐
│  BESKATTNINGSÅR:  2023                   │  │ [ Visa alla v ]  [ EXPORTERA ] │
│  BOKFÖRT RESULTAT: 124,500 kr            │  │                                │
│  STATUS:          UTKAST                 │  │ [3.x Resultat] [4.x Skatt]     │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ INK2 Sections ───────────────────────────────────────────────────────────────┐
│  [v] RÖRELSEINTÄKTER (3.1)                                                   │
│  ├─ 3.1 Nettoomsättning                        1,245,000 kr                  │
│  └─ TOTALA INTÄKTER                            1,245,000 kr                  │
│                                                                              │
│  [v] RÖRELSEKOSTNADER (3.x)                                                  │
│  ├─ 3.10 Handelsvaror                          -450,000 kr                   │
│  ├─ 3.13 Övriga externa kostnader              -125,000 kr                   │
│  └─ TOTALA KOSTNADER                           -575,000 kr                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Tax Adjustment Wizard (InkomstWizardDialog)**
The user clicks `[ SKAPA DEKLARATION ]` to handle non-deductible items and funds.

```text
┌── INK2 - INKOMSTÅR 2023 (Step 1) ────────────────────────────────────────────┐
│                                                                              │
│  BOKFÖRT RESULTAT: 124,500 kr                                                │
│                                                                              │
│  SKATTEMÄSSIGA JUSTERINGAR:                                                  │
│  Ej avdragsgilla kostnader: [ 12,500      ] kr (Konto 607x)                  │
│                                                                              │
│  Avsättning Periodiseringsfond: [ 31,000  ] kr (Max 25%)                     │
│  Tidigare års underskott:       [ 0       ] kr                               │
│                                                                              │
│  -----------------------------------------------------------                 │
│  SKATTEMÄSSIGT RESULTAT: 106,000 kr                                          │
│  BERÄKNAD SKATT (20,6%):   21,836 kr                                         │
│                                                                              │
│  [ Avbryt ]                                                       [ Granska ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Confirm & Export (SRU)**
The user reviews the final numbers and prepares the digital filing.

```text
┌── BEKRÄFTA INKOMSTDEKLARATION (Step 2) ──────────────────────────────────────┐
│                                                                              │
│  (📄) INK2 - Inkomstår 2023                                                  │
│                                                                              │
│  Resultaträkning beräknad ................... [ OK ]                         │
│  Balansräkning beräknad ..................... [ OK ]                         │
│  Skattemässiga justeringar .................. [ OK ]                         │
│                                                                              │
│  Filen 'ink2_sru.zip' är redo för export.                                    │
│                                                                              │
│  [ Tillbaka ]                                           [ Spara & Exportera ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To convert the accounting profit into a taxable profit by applying Swedish tax adjustments and generate the SRU transfer files.
2.  **Actual Workflow**: Auto-calculates based on BAS account mapping. The wizard allows for manual overrides of tax-specific funds (Periodiseringsfond).
3.  **Issues**:
    *   **The "Silent" Imbalance**: While the wizard shows "Balansräkning stämmer" or "stämmer inte", it doesn't block the user from proceeding with a broken ledger. A tax return with a non-balancing balance sheet is an immediate red flag for authorities.
    *   **Hardcoded Tax**: Corporate tax (20.6%) is hardcoded in the wizard. It should be fetched from a central `tax-parameters` hook to avoid future maintenance errors.
    *   **Account Locking**: Saving the declaration doesn't "Lock" the year's verifications. A user could save the tax return and then change a transaction in February, making the filed return incorrect.

### 5. Arbetsgivardeklaration (AGI) (`?tab=agi`)

**Frame 1: Overview (Payroll Tax Dashboard)**
The user reviews the monthly employer declarations generated from the payroll verifications.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  ARBETSGIVARDEKLARATION                                        [+] NY PERIOD │
│  Hantera AGI-rapporter och skicka till Skatteverket.                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Nästa Period ────────────────────────────┐  ┌ AI Sammanställning ────────────┐
│  PERIOD:    FEBRUARI 2024                │  (Bot) Låt AI granska din         │
│  DEADLINE:  12 MARS                      │  deklaration för avvikelser.      │
│  ATT BETALA: 18,450 kr                   │  [ STARTA GRANSKNING ]            │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Perioder ────────────────────────────────────────────────────────────────────┐
│  PERIOD           STATUS        ATT BETALA           ANSTÄLLDA   DEADLINE    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Februari 2024    [KOMMANDE]    18,450 kr            3 st        2024-03-12  │
│  Januari 2024     [INLÄMNAD]    12,200 kr            2 st        2024-02-12  │
│  December 2023    [INLÄMNAD]    15,800 kr            3 st        2024-01-12  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - XML Generation & Export**
The user selects a period and clicks `Ladda ner XML`.

```text
┌── EXPORTERA AGI (BulkAction) ────────────────────────────────────────────────┐
│                                                                              │
│  Valda perioder: Februari 2024                                               │
│                                                                              │
│  Systemet genererar 'agi-februari-2024.xml':                                 │
│  - Arbetsgivaravgifter: 12,450 kr                                            │
│  - Avdragen skatt:       6,000 kr                                            │
│  - Bruttolön:           45,000 kr                                            │
│                                                                              │
│  [ Avbryt ]                                              [ Ladda ner XML ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - AI Audit (AI-arbetsgivardeklaration)**
The user clicks `[ STARTA GRANSKNING ]`.

```text
┌── AI CO-PILOT (Payroll Audit) ───────────────────────────────────────────────┐
│                                                                              │
│  "Jag ser att Arbetsgivaravgiften (31.42%) inte matchar bruttolönen för      │
│  en anställd född 1958. Skatten ser korrekt ut."                             │
│                                                                              │
│  Problem hittade:                                                            │
│  - Felaktig avgiftssats för senior (Konto 2731).                             │
│                                                                              │
│  Vill du att jag beräknar om och föreslår en rättelse?"                      │
│                                                                              │
│  [ Visa detaljer ]    [ Skapa rättelse ]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To report monthly employee salaries, deducted income tax, and employer social security contributions to Skatteverket.
2.  **Actual Workflow**: Automatically aggregates data from specific BAS accounts (7xxx and 27xx). Generates a standard XML file for manual upload to the tax agency portal.
3.  **Issues**:
    *   **Employee Count Bug**: The logic `if (row.debit > 0) report.employees += 1` inside a loop over verification rows is a **Critical Failure**. If one employee has multiple pay lines (Salary + Bonus + Travel), they are counted multiple times, leading to an incorrect number of employees in the tax return.
    *   **Submission Placeholder**: The "Skicka till Skatteverket" button is just a placeholder ("Kommer snart"), forcing users into a manual XML download/upload workflow.
    *   **Social Security Blindness**: It treats all social security contributions as a single lump sum based on ledger totals. It doesn't verify if the rates (e.g., 31.42% vs 10.21%) are applied correctly per employee's age, which is a common source of tax audit penalties.

### 6. Årsredovisning (`?tab=arsredovisning`)

**Frame 1: Overview (The Official Record)**
The user reviews the components of their annual report before signing and filing with Bolagsverket.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  ÅRSREDOVISNING                                        [ SKAPA ÅRSREDOVISN ] │
│  Sammanställning av räkenskapsåret för Bolagsverket.                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik ───────────────────────────────┐  ┌ Delar av årsredovisningen ─────┐
│  RÄKENSKAPSÅR:  2023                     │  │ [ EXPORTERA XBRL ]             │
│  BOLAGSFORM:    AKTIEBOLAG               │  │                                │
│  STATUS:        UNDER ARBETE             │  │ [1] Förvaltningsberättelse [!] │
└──────────────────────────────────────────┘  │ [2] Resultaträkning      [Klar]│
                                              │ [3] Balansräkning        [Klar]│
                                              │ [4] Noter                [!]   │
                                              └────────────────────────────────┘
```

**Frame 2: Action - Management Report (Wizard Step 2)**
The user clicks `[ SKAPA ÅRSREDOVISN ]` and navigates to the text entry for the Management Report (Förvaltningsberättelse).

```text
┌── FÖRVALTNINGSBERÄTTELSE (Step 2) ───────────────────────────────────────────┐
│                                                                              │
│  Allmänt om verksamheten:                                                    │
│  [ Bolaget bedriver konsultverksamhet inom IT-arkitektur...              ]   │
│                                                                              │
│  Väsentliga händelser under året:                                            │
│  [ Inga väsentliga händelser har inträffat under räkenskapsåret.         ]   │
│                                                                              │
│  Resultatdisposition:                                                        │
│  Årets resultat:    124,500 kr                                               │
│  Utdelning:       [ 50,000      ] kr                                         │
│                                                                              │
│  [ Tillbaka ]                                                     [ Granska ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Final Review & Export**
The user reviews the summary and chooses to export the digital filing format (XBRL).

```text
┌── BEKRÄFTA ÅRSREDOVISNING (Step 3) ──────────────────────────────────────────┐
│                                                                              │
│  (🏢) Årsredovisning 2023 (K2)                                               │
│                                                                              │
│  Resultaträkning ............................ [ Klar ]                       │
│  Balansräkning .............................. [ Klar ]                       │
│  Förvaltningsberättelse ..................... [ Klar ]                       │
│  Noter (auto-genererade) .................... [ Klar ]                       │
│                                                                              │
│  [ ] Jag bekräftar att styrelsen har godkänt handlingarna.                   │
│                                                                              │
│  [ Tillbaka ]                                           [ Spara & Exportera ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To produce a legal annual report according to K2 rules and generate the XBRL file for digital filing with the Companies Registration Office (Bolagsverket).
2.  **Actual Workflow**: Guides the user through a 3-step wizard. It combines automatic financial data with required manual text entries.
3.  **Issues**:
    *   **XBRL Logic Mystery**: The UI has an "Exportera XBRL" button, but the `AnnualReportProcessor` code is missing the complex mapping required to convert BAS accounts into the strict Bolagsverket taxonomy (labels like `netSales`, `operatingProfit`).
    *   **The "Net Book Value" Floor**: Just as in the `Inventarier` page, if depreciation isn't checked here, the annual report might show negative assets if the write-offs exceeded the acquisition cost.
    *   **Signature Gap**: There is no digital signing flow (BankID). It only "marks" them as signed in the DB, but the legal requirement for digital filing (XBRL) requires a specific "Elektronisk underskrift" metadata.

### 7. Årsbokslut (`?tab=arsbokslut`)

**Frame 1: Overview (The Simplified Year-End)**
The user (usually a sole trader/enskild firma) reviews their simplified year-end accounts for the fiscal year.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  ÅRSBOKSLUT                                                    [ EXPORTERA ] │
│  Sammanställning av räkenskaper för enskild firma.                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik ───────────────────────────────┐  ┌ Årsbokslut 2024 ───────────────┐
│  RÄKENSKAPSÅR:  2024                     │  │ [ Visa detaljer ]              │
│  BOLAGSFORM:    ENSKILD FIRMA            │  │ [ Exportera PDF ]              │
│  STATUS:        UNDER ARBETE             │  │ [ Skicka till Bolagsverket ]   │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Intäkter och kostnader ──────────────────────────────────────────────────────┐
│  Försäljning och övriga intäkter               145,000 kr                    │
│  Varor, material och tjänster                  -32,450 kr                    │
│  Övriga externa kostnader                      -15,200 kr                    │
│  --------------------------------------------------------                    │
│  ÅRETS RESULTAT                                 97,350 kr                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Export PDF (The Paper Trail)**
The user clicks `[ Exportera PDF ]` to generate a physical copy of the report.

```text
┌── EXPORTERA PDF ─────────────────────────────────────────────────────────────┐
│                                                                              │
│  Vänta... Förbereder 'arsbokslut-2024.pdf'                                   │
│                                                                              │
│  [||||||||||||||||||||||||||||] 100%                                         │
│                                                                              │
│  (✓) Årsbokslut har laddats ner.                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Final Submission (The Placeholder)**
The user clicks `[ Skicka till Bolagsverket ]`.

```text
┌── KOMMER SNART ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  Integration med Bolagsverket är under utveckling.                           │
│  Just nu måste du ladda ner PDF:en och ladda upp den                         │
│  manuellt på deras portal.                                                   │
│                                                                              │
│  [ OK ]                                                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide a simplified year-end report for small businesses (K1 regulation) that don't require a full `Årsredovisning`.
2.  **Actual Workflow**: Uses raw `accountBalances` to manually calculate buckets like "Fixed Assets", "Cash", and "Equity".
3.  **Issues**:
    *   **Balance Sheet Plug**: The code for `totalEqLiab` includes a hardcoded addition of `+ result`. This is a "Plug" that forces the balance sheet to look like it balances by adding the P&L profit into the liabilities/equity total. If the underlying ledger is out of balance (e.g., a missing row), this report will hide the error.
    *   **Manual Mapping Risk**: Unlike other reports that use a central `Calculator`, this page implements its own account filtering (e.g., `parseInt(a.accountNumber) >= 3000`). If the BAS chart of accounts changes or a new range is used, this report will quietly fail to include those numbers.
    *   **Sole Trader Focus**: The page title says "enskild firma", but the logic is applied even if the company is an AB. It lacks a "Company Type Check" to warn users if they are using the wrong closing format.

### 8. K10 (`?tab=k10`)

**Frame 1: Overview (The Dividend Space)**
The user reviews their available "Gränsbelopp" (the amount they can take out as dividend at a low tax rate of 20%).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  K10 - KVALIFICERADE ANDELAR                                [+] SKAPA BLANKETT│
│  Blankett K10 för fåmansföretag. Beräkna gränsbeloppet.                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (Gränsbelopp) ─────────────────┐  ┌ AI Optimering ─────────────────┐
│  BESKATTNINGSÅR:  2023                   │  (Bot) Analysera löneunderlag och │
│  TOTALT UTRYMME:  245,600 kr             │  maximera ditt gränsbelopp.       │
│  UTDELAT:         50,000 kr              │  [ BERÄKNA GRÄNSBELOPP ]          │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Beräkning av gränsbelopp ────────────────────────────────────────────────────┐
│  METOD            BERÄKNING                         BELOPP                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Förenklingsregeln (2.75 x IBB)                     209,550 kr               │
│  Huvudregeln       (Lönebaserat utrymme)            185,000 kr               │
│                                                                              │
│  VALD REGEL:       Förenklingsregeln                209,550 kr               │
│  SPARAT UTRYMME:   Från tidigare år                 36,050 kr                │
│  TOTALT:                                            245,600 kr               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Detailed Calculation Wizard (K10WizardDialog)**
The user clicks `[+] SKAPA BLANKETT` to verify the underlying data.

```text
┌── K10 - INKOMSTÅR 2023 (Wizard) ─────────────────────────────────────────────┐
│                                                                              │
│  LÖNEBASERAT UTRYMME (Huvudregeln):                                          │
│  Totala löner:   1,200,000 kr                                                │
│  Din lön (7220):   450,000 kr                                                │
│                                                                              │
│  LÖNEKRAV:                                                                   │
│  Krav: 6 IBB + 5% av total lön (501,000 kr)                                  │
│  STATUS: [ EJ UPPFYLLT ]                                                     │
│                                                                              │
│  (!) Du bör ta ut ytterligare 51,000 kr i lön för att använda Huvudregeln.   │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - AI Simulation**
The user clicks `[ BERÄKNA GRÄNSBELOPP ]` to see "What-if" scenarios.

```text
┌── AI CO-PILOT (K10 Optimizer) ───────────────────────────────────────────────┐
│                                                                              │
│  "Om du höjer din lön med 5,000 kr/mån resten av året uppfyller du           │
│  löneregeln. Det skulle öka ditt gränsbelopp från 209k till 600k."           │
│                                                                              │
│  Simulering:                                                                 │
│  - Nuvarande:  20% skatt på 209k                                             │
│  - Optimerat:  20% skatt på 600k                                             │
│                                                                              │
│  [ Uppdatera lönekörning ]    [ Spara simulering ]                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To calculate the maximum dividend amount that can be taxed at 20% (instead of 30-55%) for owners of small private companies (3:12 rules).
2.  **Actual Workflow**: Automatically pulls `shareCapital` for the simplification rule and searches for `7220` (Manager Salary) to check the salary requirement for the main rule.
3.  **Issues**:
    *   **The "Shareholder" Data Gap**: The logic `const agarandel = ... || 100` defaults to 100% if no shareholder data is found. In multi-owner companies, this will incorrectly assign 100% of the company's total schablonbelopp to a single user.
    *   **Salary Account Rigidity**: It only looks for account `7220`. Many companies use `7010` for both owners and staff. This makes the "Lönekrav" calculation fail (showing as not met) even if the owner has taken enough salary.
    *   **Missing Historical Links**: While it has a `K10History` component, it doesn't automatically pull the "Sparat utrymme" from the *real* previous year's tax return unless that return was also created within this app.

---

## Phase 3: Löner (Payroll Audit)

### 1. Lönekörning (Lönebesked) (`?tab=lonebesked`)

**Frame 1: Overview (The Payroll Log)**
The user views all payslips for the current and past periods.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  LÖNEKÖRNING                                               [ NY LÖNEKÖRNING ]│
│  Hantera löner och lönespecifikationer för dina anställda.                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (Februari) ────────────────────┐  ┌ Filter ────────────────────────┐
│  TOTAL BRUTTO:   125,400 kr              │  │ [ Sök anställd...          ]   │
│  NETTO UTBETALT:  95,200 kr              │  │                                │
│  (!) 3 UTKAST                            │  │ [ Status v ] [ Period v ]      │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Grid ────────────────────────────────────────────────────────────────────────┐
│  ANSTÄLLD        PERIOD       BRUTTOLÖN   NETTO       STATUS                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  Anna Andersson  Feb 2024     45,000 kr   34,200 kr   [UTKAST]               │
│  Erik Eriksson   Feb 2024     35,000 kr   26,600 kr   [UTKAST]               │
│  Kalle Karlsson  Jan 2024     40,000 kr   30,400 kr   [UTBETALD]             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Start AI Wizard (Step 1)**
The user clicks `[ NY LÖNEKÖRNING ]` and selects an employee.

```text
┌── VÄLJ ANSTÄLLD (Step 1) ────────────────────────────────────────────────────┐
│                                                                              │
│  [ Sök anställd...         ]                                                 │
│                                                                              │
│  ( ) Anna Andersson   (Utvecklare)                                           │
│  (X) Erik Eriksson    (Designer)                                             │
│  ( ) [ + Lägg till manuellt ]                                                │
│                                                                              │
│  [ Avbryt ]                                                       [ Nästa ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - AI Adjustments (Step 2)**
The user tells the AI about Erik's month.

```text
┌── BERÄTTA OM ERIKS MÅNAD (Step 2) ───────────────────────────────────────────┐
│  (Bot) Hej! Har Erik haft någon frånvaro eller övertid?                      │
│                                                                              │
│  Användare: "Han var sjuk 2 dagar och jobbade 5 timmar övertid"              │
│                                                                              │
│  (Bot) Noterat. Jag har beräknat:                                            │
│  - Karensavdrag (2 dagar): -1,667 kr                                         │
│  - Övertid (5h):           +1,750 kr                                         │
│                                                                              │
│  [ Backa ]                                                        [ Nästa ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 4: Action - Final Review (Step 3)**
The user reviews the calculated totals before generating the payslip.

```text
┌── GRANSKA LÖNEBESKED (Step 3) ───────────────────────────────────────────────┐
│                                                                              │
│  ANSTÄLLD: Erik Eriksson (Februari 2024)                                     │
│                                                                              │
│  BRUTTOLÖN:       35,083 kr                                                  │
│  SKATT (24%):     -8,420 kr   <-- (CRITICAL: Hardcoded 24%)                  │
│  NETTO:           26,663 kr                                                  │
│                                                                              │
│  SPECIFIKATION:                                                              │
│  Grundlön:       35,000 kr                                                   │
│  Sjukavdrag:     -1,667 kr                                                   │
│  Övertid:        +1,750 kr                                                   │
│                                                                              │
│  [ Backa ]                                               [ Skapa & Bokför ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To calculate monthly salaries, deductions, and taxes, and automatically book the resulting liabilities in the ledger.
2.  **Actual Workflow**: Uses a 3-step conversational wizard. Step 2 (AI Chat) is the engine for calculating variable parts like sickness and overtime.
3.  **Issues**:
    *   **Tax Law Violation**: The calculation `const tax = Math.round(finalSalary * 0.24)` is a **Critical Failure**. Swedish income tax depends on the employee's municipality (usually 29-35%) and taxable income level (state tax). A flat 24% will lead to significant tax debt for the employee.
    *   **Fixed Social Security**: Employer contributions are hardcoded at 31.42%. This ignores age-based reductions (e.g., for youth or seniors) and regional support schemes.
    *   **Manual Entry Data Loss**: If a person is added "manually" without being saved as an employee, the system lacks the metadata needed for a compliant AGI (Employer Declaration) filing later.

### 2. Förmåner (Benefits) (`?tab=benefits`)

**Frame 1: Overview (The Benefit Catalog)**
The user lands on the benefits page to see their registered employee perks and available options.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  FÖRMÅNER                                             [+] REGISTRERA FÖRMÅN │
│  Hantera personalförmåner och skattefria avdrag.                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌ KPI ─────────────────────────────────────────────────────────────────────────┐
│  TOTALT KOSTNAD      TÄCKNING             OUTNYTTJAT                         │
│  45,000 kr           85%                  12,000 kr                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Förmånslistan ───────────────────────────────────────────────────────────────┐
│  NAMN                KATEGORI      STATUS        ANSTÄLLDA                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Friskvårdsbidrag    Skattefri     [AKTIV]       12 st                       │
│  Tjänstebil          Skattepliktig [AKTIV]       2 st                        │
│  Lunchförmån         Skattepliktig [PAUSAD]      0 st                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - View & Assign (BenefitDetailsDialog)**
The user clicks on "Friskvårdsbidrag" to assign it to an employee.

```text
┌── FRISKVÅRDSBIDRAG (Skattefri) ──────────────────────────────────────────────┐
│  Beskrivning: Bidrag för motion och friskvård.                              │
│                                                                              │
│  REGISTRERA NY:                        TILLDELADE ANSTÄLLDA:                 │
│  Anställd: [ Anna Andersson v ]        - Anna Andersson (5,000 kr)           │
│  Belopp:   [ 5000           ] kr       - Erik Eriksson  (2,500 kr)           │
│                                                                              │
│  [ Avbryt ]           [ Tilldela ]     [ Stäng ]                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - AI Impact Analysis**
The user checks the tax impact of a taxable benefit.

```text
┌── SKATTEIMPAKT (AI Analysis) ────────────────────────────────────────────────┐
│                                                                              │
│  Förmån: Tjänstebil (Förmånsvärde: 4,500 kr/mån)                             │
│                                                                              │
│  EFFEKT FÖR BOLAGET:                   EFFEKT FÖR ANSTÄLLD:                  │
│  Sociala avgifter: +1,414 kr           Inkomstskatt (32%): +1,440 kr         │
│  Netto kostnad:    +5,914 kr           Netto löneminskning: -1,440 kr        │
│                                                                              │
│  (!) Tips: Vid löneväxling kan bolaget spara 6.22% i sociala avgifter.       │
│                                                                              │
│  [ OK ]                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To manage non-salary compensation (perks), ensure correct tax reporting (förmånsvärde), and automate the addition of these values to the monthly payroll.
2.  **Actual Workflow**: Provides a catalog of standard Swedish benefits. Uses a dialog-based assignment system. Calculates tax impact using approximate rates.
3.  **Issues**:
    *   **Orphaned Benefits**: Assigning a benefit here does not **automatically** inject it into the `PayslipCreateDialog` workflow. The user has to manually mention it to the AI in Step 2 of the payroll wizard, or the system might miss it. There is no hard link between the "Benefit Registry" and the "Payroll Engine".
    *   **Formansvarde Approximation**: The calculation `const employeeTaxRate = 0.32` is a hardcoded average. Just like in the main payroll, this should be municipality-based to be accurate.
    *   **VAT on Benefits**: The system ignores the VAT implications of benefits (e.g., the right to deduct VAT on certain welfare costs vs. others).
    *   **Max Amount Enforcement**: While there is a `getRemainingAllowance` function, the UI doesn't visually block a user from assigning a 10,000 kr "friskvårdsbidrag" (legal limit is 5,000 kr), leading to potential tax violations.

### 3. Personal (Team) (`?tab=team`)

**Frame 1: Overview (The Team Dashboard)**
The user reviews their employees and their current outstanding balances for expenses and mileage.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  TEAM & RAPPORTERING                                         [+] NY ANSTÄLLD │
│  Hantera anställda, utlägg och milersättning.                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Team Grid ───────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐│
│  │ (👤) Anna Andersson   │  │ (👤) Erik Eriksson    │  │ (👤) Kalle Karlsson   ││
│  │ Utvecklare            │  │ Designer              │  │ Säljare               ││
│  │                       │  │                       │  │                       ││
│  │ Skuld: 450 kr         │  │ Skuld: 0 kr           │  │ Skuld: 1,200 kr       ││
│  │ [ RAPPORTERA ]        │  │ [ RAPPORTERA ]        │  │ [ RAPPORTERA ]        ││
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Report Expense (ReportDialog)**
The user clicks `[ RAPPORTERA ]` on Anna to register a new out-of-pocket expense.

```text
┌── NY RAPPORT: Anna Andersson ────────────────────────────────────────────────┐
│                                                                              │
│  Typ: [ Tid ] [ (X) Utlägg ] [ Milersättning ]                               │
│                                                                              │
│  Belopp:      [ 450           ] kr                                           │
│  Beskrivning: [ Inköp fika till kontoret ]                                   │
│                                                                              │
│  -----------------------------------------------------------                 │
│  Detta skapar en skuld till den anställda (Konto 2820).                      │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Add New Employee (AddEmployeeDialog)**
The user clicks `[+] NY ANSTÄLLD`.

```text
┌── LÄGG TILL ANSTÄLLD ────────────────────────────────────────────────────────┐
│                                                                              │
│  Namn:   [ _____________________ ]                                           │
│  Roll:   [ _____________________ ]                                           │
│  E-post: [ _____________________ ]                                           │
│  Lön:    [ 0                     ] kr/mån                                    │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To maintain a directory of staff and provide a simple way to record employee-led financial events (expenses, mileage, time) that impact payroll and the ledger.
2.  **Actual Workflow**: Uses cards for visualization. Reporting triggers an immediate ledger entry for expenses/mileage against account 2820 (Short-term debt to employees).
3.  **Issues**:
    *   **Fragile Matching**: The calculation of balances (`employeeBalances`) relies on a Regex-like search: `v.description.includes(e.name)`. If a user types "Anna A" instead of "Anna Andersson" in a verification description, the balance will not show up on the employee card. There is no structured "EmployeeID" link in the ledger rows.
    *   **Tax-Free Mileage Trap**: Mileage is hardcoded to 25 kr/mil (`dist * 2.5`). While this matches the 2024 tax-free limit, it doesn't account for company-specific higher rates (where the excess should be taxed as salary).
    *   **Account Hardcoding**: Expenses are hardcoded to account `4000` (Goods). If an employee buys a "Bus ticket" (5800) or "Software" (5420), it will be booked incorrectly as "Goods" unless the user manually edits the verification later.

### 4. Egenavgifter (`?tab=egenavgifter`)

**Frame 1: Overview (The Sole Trader Tax Est.)**
The user (enskild firma) reviews their estimated social security contributions based on their current or projected profit.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  EGENAVGIFTER                                                                │
│  Beräkna egenavgifter och sociala avgifter för enskild firma.                │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Inställningar ───────────────────────────┐  ┌ Beräknat Resultat ─────────────┐
│  ESTIMERAT ÅRSRESULTAT:                  │  │ EGENAVGIFTER (28.97%):         │
│  [ 500,000       ] kr                    │  │ 144,850 kr                     │
│                                          │  │                                │
│  ( ) Nedsatta avgifter (Pensionär)       │  │ NETTO EFTER AVGIFTER:          │
│  ( ) Karensdagsreduktion                 │  │ 355,150 kr                     │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Specifikation av avgifter ──────────────────────────────────────────────────┐
│  NAMN                          SATS          BELOPP                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  Ålderspensionsavgift          10.21%        51,050 kr                       │
│  Allmän löneavgift             11.50%        57,500 kr                       │
│  Sjukförsäkringsavgift         3.88%         19,400 kr                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Sync with Ledger**
The system automatically pulls the `realProfit` from the actual bookkeeping.

```text
┌── SYNKRONISERING (Action) ──────────────────────────────────────────────────┐
│                                                                              │
│  Systemet läser från huvudboken:                                             │
│  Intäkter (30xx):  450,000 kr                                                │
│  Kostnader (4xxx-7xxx): -120,000 kr                                          │
│                                                                              │
│  AKTUELLT RESULTAT (YTD): 330,000 kr                                         │
│                                                                              │
│  [ Använd aktuellt resultat ]                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Monthly Trend Analysis**
The user reviews the tax burden per month.

```text
┌── MÅNADSTREND ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  MÅNAD      RESULTAT      EGENAVGIFTER (Est.)                                │
│  Jan        25,000 kr     7,243 kr                                           │
│  Feb        32,000 kr     9,270 kr                                           │
│  Mar        28,000 kr     8,112 kr                                           │
│                                                                              │
│  (!) Tips: Sätt undan ca 30% av din vinst på ett skattekonto varje månad.    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To help sole traders estimate their social security debt (`egenavgifter`) so they can set aside enough money for the final tax bill.
2.  **Actual Workflow**: Simple calculator that applies a flat rate (28.97% or 10%) to a profit figure (manual or YTD).
3.  **Issues**:
    *   **Legal Inaccuracy (Schablonavdrag)**: Swedish tax law allows sole traders to deduct 25% of their profit (*schablonavdrag*) as an estimated cost for the fees before calculating the actual fees. This app applies the 28.97% rate to the **full** profit, resulting in a significantly higher (and incorrect) tax estimation.
    *   **The "Half-Tax" Illusion**: The "Netto efter avgifter" is misleading. It only subtracts social security, not municipal income tax (approx. 30%). A user might believe they have 355k left to spend, when in reality they still owe income tax on the remainder.
    *   **Fixed Rates**: Rates are hardcoded for 2024. If Skatteverket changes the "allmän löneavgift" (common in budget cycles), this calculator becomes a liability.

### 5. Delägaruttag (`?tab=delagaruttag`)

**Frame 1: Overview (The Owner's Account)**
The user (usually a sole trader or AB owner) reviews their personal transactions with the company.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DELÄGARE & UTTAG                                          [+] NY TRANSAKTION│
│  Hantera delägaruttag, insättningar och lån i bolaget.                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (Totalt) ──────────────────────┐  ┌ Regler för uttag (Legal) ──────┐
│  TOTALA UTTAG:     85,400 kr             │  │ (!) Ett förbjudet lån är om    │
│  INSÄTTNINGAR:     12,000 kr             │  │ bolaget lånar ut pengar till   │
│  NETTO UTTAG:      73,400 kr             │  │ en delägare.                   │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Transaktioner ───────────────────────────────────────────────────────────────┐
│  DATUM       DELÄGARE        TYP           BELOPP      BESKRIVNING           │
├──────────────────────────────────────────────────────────────────────────────┤
│  2024-02-15  Anna Andersson  Uttag         5,000 kr    Privat uttag          │
│  2024-02-10  Anna Andersson  Insättning    2,500 kr    Eget utlägg           │
│  2024-01-20  Erik Eriksson   Lön           25,000 kr   Månadslön             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Register Transaction (NewWithdrawalDialog)**
The user clicks `[+] NY TRANSAKTION` to record a new drawing.

```text
┌── REGISTRERA TRANSAKTION ────────────────────────────────────────────────────┐
│                                                                              │
│  Typ:      [ (X) Uttag ] [ Insättning ] [ Lön ]                              │
│  Delägare: [ Anna Andersson v ]                                              │
│  Belopp:   [ 5000           ] kr                                             │
│  Datum:    [ 2024-02-15     ]                                                │
│                                                                              │
│  -----------------------------------------------------------                 │
│  Bokförs automatiskt: Debit 2013 / Kredit 1930.                              │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Financial Tip (Contextual Info)**
The user reads the sidebar info about accounting rules.

```text
┌── BOKFÖRINGSTIPS ────────────────────────────────────────────────────────────┐
│                                                                              │
│  Uttag bokförs mot konto 2013/2023 och insättningar mot 2018/2028.           │
│                                                                              │
│  (!) Kom ihåg: I ett Aktiebolag räknas 'Uttag' oftast som utdelning eller    │
│  lån. Se till att du har fritt eget kapital!                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To track the flow of money between owners and the business entity, ensuring separate records for equity drawings vs. business expenses.
2.  **Actual Workflow**: Automatically generates ledger entries based on the selected type (Withdrawal/Deposit).
3.  **Issues**:
    *   **The "Partner 3" Barrier**: The logic `withdrawalRow.account === '2013' ? 'p-1' : 'p-2'` is a **Critical Failure**. It hardcodes support for only two partners mapped to specific BAS accounts. A 3-owner company will have its data invisible or misattributed in this view.
    *   **Illegal Salary Booking**: The `registerTransaction` function treats 'lön' (salary) as a simple equity withdrawal (Debit 201x, Credit 1930). This is a violation of Swedish accounting standards for ABs, where salaries **must** involve expense accounts (7xxx) and tax withholdings.
    *   **No Solvency Check**: The system allows registering large withdrawals without verifying if the company has "Free Equity" (*fritt eget kapital*). In an AB, withdrawing more than the available profit is an illegal value transfer (*olovlig vinstutdelning*).

---

## Phase 4: Ägare & Styrning (Governance Audit)

### 1. Aktiebok (`?tab=aktiebok`)

**Frame 1: Overview (The Share Register)**
The user reviews the current distribution of shares and total equity votes in the company.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  AKTIEBOK                                                       [ ÅTGÄRDER ] │
│  Digital aktiebok med historik över ägarförändringar.                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (Totalt) ──────────────────────┐  ┌ Ägare (Tab) ───────────────────┐
│  ANTAL AKTIER:     50,000 st             │  │ [ Sök ägare...             ]   │
│  ANTAL RÖSTER:     50,000 st             │  │                                │
│  ANTAL ÄGARE:      3 st                  │  │ [ ÄGARE ] [ TRANSAKTIONER ]    │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Shareholders Grid ───────────────────────────────────────────────────────────┐
│  ÄGARE               ANDEL (%)     ANTAL AKTIER    RÖSTER      TYP           │
├──────────────────────────────────────────────────────────────────────────────┤
│  Anna Andersson      60%           30,000 st       30,000      Person        │
│  Erik Eriksson       30%           15,000 st       15,000      Person        │
│  Invest AB           10%           5,000 st        5,000       Bolag         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Register Share Transfer (TransactionDialog)**
The user clicks `[ ÅTGÄRDER ]` -> `Registrera överlåtelse` to record a stock sale.

```text
┌── REGISTRERA ÖVERLÅTELSE ────────────────────────────────────────────────────┐
│                                                                              │
│  Typ: [ Nyemission ] [ (X) Köp ] [ Gåva ] [ Arv ]                            │
│                                                                              │
│  Från (Säljare): [ Erik Eriksson v ]                                         │
│  Till (Köpare):  [ Invest AB     v ]                                         │
│                                                                              │
│  Antal aktier:   [ 2500            ] st                                      │
│  Pris per aktie: [ 10              ] kr                                      │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Historical Audit (TransactionsGrid)**
The user switches to the `TRANSAKTIONER` tab to see the history.

```text
┌── TRANSAKTIONER ─────────────────────────────────────────────────────────────┐
│                                                                              │
│  DATUM       TYP           FRÅN            TILL            ANTAL     TOTALT  │
│  2024-02-15  Köp           Erik Eriksson   Invest AB       2,500     25,000  │
│  2023-01-01  Nyemission    Bolaget         Anna Andersson  30,000    30,000  │
│                                                                              │
│  (!) Systemet parsar verifikationstexter för att bygga denna lista.          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To maintain a legally compliant share register (*Aktiebok*) as required by the Swedish Companies Act, ensuring all share transfers and issues are recorded and linked to the ledger.
2.  **Actual Workflow**: 
    *   **New Issue**: Generates ledger entries for Share Capital (2081) and Premium Fund (2097).
    *   **Transfers**: Records informational verifications without ledger impact (0 kr).
    *   **Reconstruction**: Uses Regex to scan all historical verifications for specific keywords like "aktier" or "till [namn]" to build the transaction list.
3.  **Issues**:
    *   **Regex Fragility**: The reliance on `NAME_REGEX_TO = /till\s+(.+?)(?:\s*$|\s*från)/i` is a **Critical Failure**. If a user changes the description of a verification manually (e.g., "Emission till Anna per 240215"), the Aktiebok will lose the data or attribute it to "Okänd". The system lacks a structured transaction table for equity.
    *   **Missing Certificate Support**: A legal share register often requires tracking "Share Certificates" (*aktiebrev*). This app tracks counts but not certificate numbers or ranges.
    *   **Hardcoded Quota Value**: The logic uses `const quotaValue = 25`. While 25,000 kr is the standard AB minimum, many companies have different quota values (e.g., 0.50 kr per share). This will lead to incorrect ledger entries for `Aktiekapital`.

### 2. Delägare (`?tab=delagare`)

**Frame 1: Overview (The Partner Register)**
The user (usually in an HB or KB) reviews the list of partners and their current capital balances.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DELÄGARE                                               [ LÄGG TILL DELÄG. ] │
│  Handelsbolag                                                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (Partners) ────────────────────┐  ┌ Delägare Grid ─────────────────┐
│  TOTALT ANTAL:     2 st                  │  │ [ Sök ägare...             ]   │
│  TOTALT KAPITAL:   150,000 kr            │  │                                │
│  UTTAG (YTD):      45,000 kr             │  │ [ GRID VIEW ]                  │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Partners Grid ───────────────────────────────────────────────────────────────┐
│  NAMN                ANDEL (%)     KAPITALKONTO    TYP                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  Anna Andersson      50%           75,000 kr       Komplementär              │
│  Erik Eriksson       50%           75,000 kr       Komplementär              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Add New Partner (AddPartnerDialog)**
The user clicks `[ LÄGG TILL DELÄG. ]` to register a new owner in the partnership.

```text
┌── LÄGG TILL DELÄGARE ────────────────────────────────────────────────────────┐
│                                                                              │
│  Namn:               [ Invest KB           ]                                 │
│  Andel:              [ 10                  ] %                               │
│  Insats:             [ 25000               ] kr                              │
│  Typ:                [ Kommanditdelägare v ]                                 │
│                                                                              │
│  -----------------------------------------------------------                 │
│  (!) Kommanditdelägare har begränsat ansvar för bolagets skulder.            │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Legal Context (LegalInfoCard)**
The user reviews partnership-specific rules in the sidebar.

```text
┌── REGLER FÖR HANDELSBOLAG ───────────────────────────────────────────────────┐
│                                                                              │
│  - Delägarna har obegränsat och solidariskt ansvar för bolagets skulder.     │
│  - Resultatet fördelas mellan delägarna och beskattas personligen.           │
│  - Bolaget är en juridisk person men inte ett eget skattesubjekt.            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To manage ownership in non-corporate entities (Handelsbolag/HB and Kommanditbolag/KB), where capital is tracked per individual partner rather than as a single share pool.
2.  **Actual Workflow**: Automatically maps partners to BAS accounts based on their array index: Partner 0 gets accounts 2010-2018, Partner 1 gets 2020-2028, etc.
3.  **Issues**:
    *   **The "Account Range" Limit**: The logic `getPartnerAccounts(index)` assumes a strict mapping that usually ends after a few partners (e.g., up to partner 9 using 209x). In a partnership with many owners, this logic will overlap with other equity accounts or crash if it runs out of defined BAS ranges.
    *   **Signage Paradox**: The logic `row.credit - row.debit` treats credit as positive. While correct for liability/equity accounts, it fails to display capital subtractions (withdrawals) clearly as a "Negative Balance" in the grid without consistent normalization.
    *   **Missing Result Allocation**: There is no function to "distribute" the annual profit (Årets Resultat) among partners at year-end. This means the individual `capitalkonto` balances will remain stagnant and incorrect in the UI until a manual manual distribution verification is created.

### 3. Utdelning (`?tab=utdelning`)

**Frame 1: Overview (The Dividend Planner)**
The user enters to plan a dividend payout, viewing their historical decisions and available tax space.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  UTDELNING                                               [ PLANERA UTDELN. ] │
│  Planera, besluta och bokför utdelning till aktieägare.                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (2024) ────────────────────────┐  ┌ Gränsbelopp (K10) ─────────────┐
│  BESLUTAD UTDELN:  125,000 kr            │  │ TILLGÄNGLIGT:  245,600 kr      │
│  EST. SKATT (20%): 25,000 kr             │  │                                │
│  NETTO UTBETALT:   100,000 kr            │  │ [ OPTIMERA MED AI ]            │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Utdelningshistorik ──────────────────────────────────────────────────────────┐
│  ÅR       BELOPP        SKATT       NETTO       STATUS                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  2024     125,000 kr    25,000 kr   100,000 kr  [BESLUTAD] -> [ BOKFÖR ]     │
│  2023     80,000 kr     16,000 kr   64,000 kr   [BOKFÖRD]  -> [ BETALA ]     │
│  2022     50,000 kr     10,000 kr   40,000 kr   [UTBETALD]                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Plan Dividend (RegisterDividendDialog)**
The user clicks `[ PLANERA UTDELN. ]`. This creates a draft meeting minute.

```text
┌── PLANERA VINSTUTDELNING ────────────────────────────────────────────────────┐
│                                                                              │
│  Räkenskapsår: [ 2023 v ]                                                    │
│  Belopp:       [ 125000       ] kr                                           │
│                                                                              │
│  -----------------------------------------------------------                 │
│  Detta skapar ett utkast till 'Extra bolagsstämma'.                          │
│  Utdelningen är inte giltig förrän protokollet är signerat.                  │
│                                                                              │
│  [ Avbryt ]                                                       [ Planera ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Settle Liability (PayDividend)**
The user clicks `[ BETALA ]` on a booked dividend.

```text
┌── UTBETALNING AV UTDELNING ──────────────────────────────────────────────────┐
│                                                                              │
│  Utdelning för 2023: 80,000 kr                                               │
│  Mottagare: Anna Andersson (60%), Erik Eriksson (40%)                        │
│                                                                              │
│  Systemet skapar verifikation:                                               │
│  - Debit:  2898 Utdelningsskuld (80,000 kr)                                  │
│  - Kredit: 1930 Bank (80,000 kr)                                             │
│                                                                              │
│  (!) Kom ihåg att betala in vinstskatt (Kupongskatt) till Skatteverket.      │
│                                                                              │
│  [ Avbryt ]                                                  [ Bekräfta ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To manage the formal process of distributing profits to owners, ensuring the legal sequence (Proposal -> Meeting Decision -> Booking -> Payment) is followed and reflected in the ledger.
2.  **Actual Workflow**: Uses a clever document-ledger symbiosis. Planning creates a `meeting_minutes` JSON blob. Signing the meeting changes the status to "Decided".
3.  **Issues**:
    *   **Withholding Tax Gap**: The system calculates "Est. Tax" (20%) but **does not book it**. In a real payout, the company is often responsible for withholding the tax and paying it to Skatteverket (Kupongskatt). The current payout verification only settles the net amount, leaving the tax portion "invisible" in the ledger liabilities.
    *   **Equity Balance Blindness**: Frame 2 allows planning any amount. It doesn't verify if account `2091` (Retained Earnings) actually has enough balance. A user can "Plan" a 1M kr dividend for a company with 10k in profit.
    *   **Single-Step Payout**: The `payDividend` function settles the whole amount to 1930. It doesn't handle the case where owners are paid on different dates or via different bank accounts.

### 4. Medlemsregister (`?tab=medlemsregister`)

**Frame 1: Overview (The Association Registry)**
The user (usually in an association/förening) reviews the list of members, their roles, and whether they have paid their annual fees.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  MEDLEMSREGISTER                                         [+] LÄGG TILL MEDLEM│
│  Hantera medlemmar, medlemsavgifter och roller.                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Statistik (Totalt) ──────────────────────┐  ┌ Filter ────────────────────────┐
│  MEDLEMMAR:        142 st                │  │ [ Sök medlem...            ]   │
│  AKTIVA:           128 st                │  │                                │
│  BETALDA AVGIFTER: 110 st                │  │ [ Alla status v ] [ EXPORTERA ]│
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Members Grid ────────────────────────────────────────────────────────────────┐
│  NAMN & NR           KONTAKT               MEDLEMSKAP      STATUS            │
├──────────────────────────────────────────────────────────────────────────────┤
│  Anna Andersson      anna@mail.se          Ordinarie       [AKTIV]           │
│  #1001               070-123 45 67         (v) Betald                        │
│                                                                              │
│  Erik Eriksson       erik@mail.se          Stödmedlem      [VILANDE]         │
│  #1002               070-987 65 43         (!) Ej betald                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Add Member (AddMemberDialog)**
The user clicks `[+] LÄGG TILL MEDLEM`.

```text
┌── LÄGG TILL MEDLEM ──────────────────────────────────────────────────────────┐
│                                                                              │
│  Namn:   [ _____________________ ]    Typ:   [ Ordinarie v ]                 │
│  E-post: [ _____________________ ]    Roll:  [ Medlem    v ]                 │
│                                                                              │
│  Medlemsnummer: #1003 (Auto)                                                 │
│                                                                              │
│  [ ] Skicka välkomstmejl till medlemmen                                      │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Fee Collection (Register Payment)**
The user clicks `(v) Ej betald` or the dropdown action to record a fee payment.

```text
┌── REGISTRERA MEDLEMSAVGIFT ──────────────────────────────────────────────────┐
│                                                                              │
│  Medlem: Erik Eriksson (#1002)                                               │
│  Period: 2024                                                                │
│                                                                              │
│  Belopp: [ 250            ] kr                                               │
│  Konto:  [ 1930 v ] (Bank)                                                   │
│                                                                              │
│  -----------------------------------------------------------                 │
│  Bokförs automatiskt: Debit 1930 / Kredit 3810 (Medlemsavgifter).            │
│                                                                              │
│  [ Avbryt ]                                                  [ Bekräfta ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To maintain a legally required register of members for non-profit organizations or cooperatives, tracking fee compliance and historical activity.
2.  **Actual Workflow**: Provides a searchable list with status indicators. The "Register Payment" action bridges the gap between administrative membership and bookkeeping.
3.  **Issues**:
    *   **Fee Symbiosis Gap**: The "Registrera betalning" action in the code is currently a UI status toggle. It does not automatically trigger the `addVerification` logic needed to book the revenue (Account 3810) in the ledger.
    *   **Role Mapping**: Member roles (e.g., Ordförande, Sekreterare) are currently hardcoded or mocked in the display. The system lacks a formal "Board Role" registry linked to the `Firmatecknare` (Authorized Signatories) logic.
    *   **Mocked History**: The "Right Sidebar" meant to show membership changes (Join/Leave dates) uses a local state `[]` which is cleared on refresh. There is no persistent audit trail of membership changes in the database.

### 5. Bolagsstämma (`?tab=bolagsstamma`)

**Frame 1: Overview (Möten & Protokoll)**
The user enters to manage corporate governance documents, viewing planned and completed board and general meetings.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  MÖTEN & PROTOKOLL                                             [ (+) NYTT v ]│
│  Bolagsstämmor och styrelsemöten med protokoll och beslut.                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Kommande Möte ───────────────────────────┐  ┌ Statistik ─────────────────────┐
│  (!) Ordinarie bolagsstämma 2024         │  │ PLANERADE:   2 st              │
│  DATUM:  2024-05-15 (Om 42 dagar)        │  │ GENOMFÖRDA:  12 st             │
│  STATUS: PLANERAD                        │  │ BESLUT:      45 st             │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Möteslista ──────────────────────────────────────────────────────────────────┐
│  DATUM       TYP                 ÅR      STATUS            BESLUT            │
├──────────────────────────────────────────────────────────────────────────────┤
│  2024-05-15  Bolagsstämma (Ord)  2024    [PLANERAD]        0 st              │
│  2024-02-15  Styrelsemöte        2024    [SIGNERAT]        3 st              │
│  2023-05-10  Bolagsstämma (Ord)  2023    [GENOMFÖRD]       5 st              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Plan Meeting (PlanMeetingDialog)**
The user clicks `[ (+) NYTT v ]` -> `Planera bolagsstämma`.

```text
┌── PLANERA BOLAGSSTÄMMA ──────────────────────────────────────────────────────┐
│                                                                              │
│  Typ: [ (X) Ordinarie ] [ Extra ]    Datum: [ 2024-05-15 ]                   │
│  År:  [ 2024 ]                       Tid:   [ 10:00      ]                   │
│                                                                              │
│  Plats: [ Kontoret, Stockholm                                            ]   │
│                                                                              │
│  Dagordning:                                                                 │
│  1. Stämmans öppnande                                                        │
│  2. Val av ordförande                                                        │
│  [ + Lägg till punkt ]                                                       │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Book Dividend Decision (MeetingViewDialog)**
The user views a signed protocol and clicks `[ BOKFÖR ]` on a dividend decision.

```text
┌── MÖTESDETALJER: Extra bolagsstämma ─────────────────────────────────────────┐
│  Status: Protokoll signerat                                                  │
│                                                                              │
│  BESLUT:                                                                     │
│  1. Vinstutdelning (125,000 kr) ............................ [ BOKFÖR ]      │
│                                                                              │
│  Systemet skapar verifikation:                                               │
│  - Debit:  2091 Balanserad vinst (125,000 kr)                                │
│  - Kredit: 2898 Utdelningsskuld (125,000 kr)                                 │
│                                                                              │
│  [ Ladda ner protokoll ]                                          [ Stäng ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide a legally sound workflow for corporate decision-making, ensuring meetings are called, held, and recorded, with financial decisions (like dividends) linked directly to the ledger.
2.  **Actual Workflow**: Uses a document-centric approach. Meetings are stored as JSON-content documents. Financial decisions can trigger the `addVerification` logic.
3.  **Issues**:
    *   **Loose Document Structure**: The logic relies on `JSON.parse(doc.content)`. There is no strict schema enforcement for meeting content. If the JSON structure changes or a field is missing (e.g., `decisions` not being an array), the UI components or the `bookDividend` function will crash or fail silently.
    *   **The "Orphaned" Decision Problem**: The `bookedDecisions` state is local: `const [bookedDecisions, setBookedDecisions] = useState<string[]>([])`. This is a **Critical Failure**. If the user refreshes the page, the "BOKFÖR" button will reappear for a decision that has already been booked in the ledger, leading to double-bookings of liabilities.
    *   **Signatory Logic Gap**: While it shows "Protokoll signerat", it doesn't actually verify *who* signed or if the signature meets the legal requirements of the Articles of Association (e.g., majority of board members).

### 6. Årsmöte (`?tab=arsmote`)

**Frame 1: Overview (The Association Annual Hub)**
The user (usually in a non-profit) manages the preparation for the upcoming annual general meeting (AGM).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  ÅRSMÖTE                                         [ NY MOTION ] [ PLANERA ]   │
│  Planera, dokumentera och förvalta föreningens årsmöten.                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Kommande Årsmöte 2024 ───────────────────┐  ┌ Förberedelser ─────────────────┐
│  DATUM:  2024-03-25                      │  │ [X] Bokslut godkänt            │
│  PLATS:  Föreningslokalen                │  │ [X] Dagordning klar            │
│  STATUS: KALLAD                          │  │ [ ] Revisionsberättelse        │
└──────────────────────────────────────────┘  └────────────────────────────────┘

┌ Tidigare Årsmöten ───────────────────────────────────────────────────────────┐
│  ÅR       STATUS            MOTIONER    BESLUT      HANDLINGAR               │
├──────────────────────────────────────────────────────────────────────────────┤
│  2023     [SIGNERAT]        5 st        12 st       [PROTOKOLL] [BOKSLUT]    │
│  2022     [GENOMFÖRD]       2 st        10 st       [PROTOKOLL]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Register Motion (MotionDialog)**
A member or board member submits a proposal for the meeting.

```text
┌── NY MOTION ─────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Titel:       [ Renovering av taket           ]                              │
│  Beskrivning: [ Taket läcker i nordöstra hörnet...                       ]   │
│                                                                              │
│  Inskickad av: [ Erik Eriksson v ]                                           │
│                                                                              │
│  -----------------------------------------------------------                 │
│  Denna motion kommer att inkluderas i möteshandlingarna och                  │
│  dagordningen för Årsmöte 2024.                                              │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Send Notice (SendNoticeDialog)**
The board prepares and sends the official invitation to all active members.

```text
┌── SKICKA KALLELSE ───────────────────────────────────────────────────────────┐
│                                                                              │
│  Möte: Årsmöte 2024 (2024-03-25)                                             │
│  Mottagare: 142 st aktiva medlemmar                                          │
│                                                                              │
│  [ ] Inkludera dagordning                                                    │
│  [ ] Inkludera föregående års protokoll                                      │
│                                                                              │
│  [ Avbryt ]                                              [ Skicka kallelse ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To handle the democratic governance cycle of an association, ensuring members can submit motions, receive legal notices, and access signed protocols.
2.  **Actual Workflow**: Built on top of the generic meeting document system but customized with a "Standard Agenda" (19 points) and motion management.
3.  **Issues**:
    *   **Motion Persistence Gap**: Similar to the dividend decisions, motions are stored in a `JSON.stringify` blob inside a document. If the document `status` is not correctly tracked, a motion might be "lost" during the transition from `Planerad` to `Kallad`.
    *   **The "Notice" Ghost**: The `SendNoticeDialog` only logs "Notice prepared" to the console. It does not actually trigger an email delivery service or generate a PDF kallelse for physical distribution, which is a legal requirement for most associations.
    *   **No Quorum Calculation**: The system tracks `attendeesCount` but doesn't compare it to the `Medlemsregister` to verify if the meeting has reached a quorum (*beslutsförhet*) based on the association's statutes.

### 7. Firmatecknare (`?tab=firmatecknare`)

**Frame 1: Overview (The Signing Rights)**
The user reviews who has the legal right to sign for the company and under what conditions (alone or jointly).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  FIRMATECKNARE                                                   [ LÄGG TILL ]│
│  Firmatecknare baserat på ägarstruktur och styrelse.                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Ensam firmateckning (Card) ──────────────────────────────────────────────────┐
│  (🖋) Anna Andersson                                                          │
│      Styrelsens ordförande             (✓) Aktiv      Från 2023-01-01  [v]   │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Gemensam firmateckning (Card) ───────────────────────────────────────────────┐
│  (🖋) Erik Eriksson                                                           │
│      Styrelseledamot                   (✓) Aktiv      Från 2023-05-15  [v]   │
│  --------------------------------------------------------------------------  │
│  (🖋) Kalle Karlsson                                                          │
│      Styrelseledamot                   (✓) Aktiv      Från 2023-05-15  [v]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Derived Logic (Contextual Tip)**
The user reads about how these rights are calculated.

```text
┌── INFO ──────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  💡 Ändringar av firmatecknare måste registreras hos Bolagsverket.           │
│                                                                              │
│  Systemet härleder dessa rätter från:                                        │
│  - Senaste justerade styrelseprotokoll                                       │
│  - Aktieboken (>50% innehav)                                                 │
│  - Bolagsordningen                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Manual Override (Add Signatory)**
The user attempts to add a special signatory (e.g., a proxy/prokurist).

```text
┌── LÄGG TILL FIRMATECKNARE ───────────────────────────────────────────────────┐
│                                                                              │
│  Namn: [ _____________________ ]                                             │
│  Typ:  [ Ensam v ]                                                           │
│                                                                              │
│  Gäller från: [ 2024-02-15 ]                                                 │
│                                                                              │
│  (!) Denna ändring kräver en 'Ny åtgärd' mot Bolagsverket.                   │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To maintain an accurate record of who can legally bind the company to contracts or payments, ensuring compliance with the Articles of Association and Bolagsverket's records.
2.  **Actual Workflow**: Cleverly derives rights based on other data: AB (Chairperson = Ensam, others = Gemensam), EF (Owner = Ensam).
3.  **Issues**:
    *   **The "Major Shareholder" Fallacy**: The logic `shareholders.filter(s => s.ownershipPercentage >= 50)` grants "Ensam firmateckning" to major shareholders. This is legally incorrect for an AB. Owning 100% of shares does **not** give you the right to sign for the company unless you are also a board member or appointed proxy. This could lead users to sign contracts they aren't legally authorized to sign.
    *   **Meeting Reliance**: It only pulls "Styrelse" data from the latest *signed* board meeting. If a board member resigned but no meeting was recorded in the app, the "Firmatecknare" view will remain dangerously out of date.
    *   **No Proxy Support**: The system lacks support for "Prokura" (commercial proxies) which are common in Swedish business but have different legal constraints than board members.

---

## Phase 5: Statistik, Inställningar & Onboarding (System Audit)

### 1. Företagsstatistik (`/dashboard/foretagsstatistik`)

**Frame 1: Overview (The Financial Dashboard)**
The user lands on the statistics page to get a high-level view of their business health.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  FÖRETAGSSTATISTIK                                                           │
│  [ (o) Översikt ]  [ ( ) Transaktioner ]  [ ( ) Kostnader ]                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌ KPI Overview ────────────────────────────────────────────────────────────────┐
│  OMSÄTTNING (YTD)    RESULTAT (YTD)       SOLIDITET           LIKVIDITET     │
│  1,245,000 kr        +97,350 kr           42%                 125%           │
│  (+12% vs i fjol)    (+5% vs i fjol)      [BRA]               [STARK]        │
└──────────────────────────────────────────────────────────────────────────────┘

┌ Intäkter & Kostnader (Trend) ────────────────────────────────────────────────┐
│  TIDSINTERVALL: [ Senaste 12 mån v ]                                         │
│                                                                              │
│  Belopp (kr)                                                                 │
│  ^                                                                           │
│  |      /\      _                                                            │
│  |     /  \    / \      _   Intäkter                                         │
│  |  __/    \__/   \____/                                                     │
│  |  __      __      ___     Kostnader                                        │
│  |    \____/  \____/   \__                                                   │
│  └───────────────────────────> Månad                                         │
│     Jan  Feb  Mar  Apr  Maj                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Detailed Tooltip (Interactive Chart)**
The user hovers over a data point in the trend chart to see precise numbers.

```text
┌── MÅNADSDETALJER: MARS 2024 ─────────────────────────────────────────────────┐
│                                                                              │
│  Intäkter:   145,000 kr                                                      │
│  Kostnader:  -32,450 kr                                                      │
│  -----------------------------------                                         │
│  RESULTAT:   112,550 kr                                                      │
│                                                                              │
│  (!) Dina kostnader var 15% lägre än genomsnittet för perioden.              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Switch Tab (Kostnadsanalys)**
The user clicks the "Kostnader" tab to see a breakdown of expenses.

```text
┌── KOSTNADSFÖRDELNING ────────────────────────────────────────────────────────┐
│                                                                              │
│  KATEGORI                BELOPP          ANDEL                               │
│  Varuinköp               450,000 kr      [||||||||||          ] 45%          │
│  Personalkostnader       320,000 kr      [|||||||             ] 32%          │
│  Lokalkostnader          120,000 kr      [||                  ] 12%          │
│  Övrigt                  110,000 kr      [||                  ] 11%          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide management with actionable insights and trends based on the raw ledger data, helping them make strategic decisions.
2.  **Actual Workflow**: Aggregates account balances into high-level KPIs and visualizes P&L data over time using Recharts.
3.  **Issues**:
    *   **The "Sign" Trap**: As identified in the `Resultaträkning` audit, if the `useFinancialMetrics` hook doesn't normalize signs (Credit vs Debit) correctly, the trend charts will show inverted results.
    *   **KPI Logic Complexity**: KPIs like "Soliditet" (Equity / Total Assets) require a perfectly balanced ledger to be accurate. If "Årets Resultat" hasn't been moved to Equity, the Solidity metric will be artificially low.
    *   **Lack of Drill-down**: While the charts look good, there is no way to click a "Bar" or "Pie slice" to see the underlying verifications. It's a "Dead-end" view for investigation.

### 2. Inställningar (`/dashboard/settings`)

**Frame 1: Overview (The Navigation Hub)**
The user opens the settings dialog, which acts as a "Full-screen Sidebar" overlaying the dashboard.

```text
┌── INSTÄLLNINGAR ─────────────────────────────────────────────────────────────┐
│                                                                              │
│  [ (👤) Konto               ]   KONTO: Anna Andersson                        │
│  [ (🏢) Företagsinfo (o)    ]   E-post: anna@ab.se                           │
│  [ (🧩) Integrationer       ]                                                │
│  [ (💳) Fakturering         ]   -------------------------------------------  │
│  [ (🔔) Notiser             ]                                                │
│  [ (🖌) Utseende            ]   SÄKERHET:                                    │
│  [ (🌐) Språk & Region      ]   [ Ändra lösenord ] [ Tvåfaktorsautentisering ]│
│  [ (🔒) Säkerhet            ]                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Company Metadata (CompanyTab)**
The user clicks "Företagsinformation" to configure critical accounting parameters.

```text
┌── FÖRETAGSINFORMATION ───────────────────────────────────────────────────────┐
│                                                                              │
│  Bolagsnamn: [ Scope AI AB           ]   Org.nr: [ 556123-4567 ]             │
│                                                                              │
│  BOKFÖRINGSINSTÄLLNINGAR:                                                    │
│  Metod: [ Fakturametoden v ]  (Standard för AB)                              │
│  Moms:  [ Kvartalsvis v    ]                                                 │
│                                                                              │
│  (X) Fåmansföretag (Aktiverar K10-stöd)                                      │
│                                                                              │
│  [ EXPORTERA SIE-FIL ]  <-- (Legal Backup)                                   │
│                                                                              │
│  [ Avbryt ]                                                       [ Spara ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Action - Destruction (Nollställ data)**
The user attempts to reset their account data.

```text
┌── NOLLSTÄLL ALL DATA (Varning) ──────────────────────────────────────────────┐
│                                                                              │
│  (!) Detta kommer permanent radera alla kvitton, transaktioner,              │
│      leverantörsfakturor och chatthistorik.                                  │
│                                                                              │
│  Skriv 'radera' för att bekräfta: [ ________ ]                               │
│                                                                              │
│  [ Avbryt ]                                          [ Jag förstår, radera ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To manage the identity, legal configuration, and external connections of the business entity, while providing data export (SIE) and destruction capabilities.
2.  **Actual Workflow**: Uses a Sidebar + Main Content layout inside a modal. Changes to "Company Info" are synced to the `CompanyProvider` and used globally for tax/report logic.
3.  **Issues**:
    *   **Audit Trail Deficit**: Changing the "Bokföringsmetod" (e.g., from Cash to Invoice) mid-year has catastrophic consequences for the ledger. The UI allows this toggle without any warning that it will invalidate previous VAT reports or require a "re-booking" of the entire year.
    *   **Incomplete SIE Export**: While the button exists, the actual implementation `handleSIEExport` relies on a generic `/api/sie/export` endpoint. Standard SIE4 exports require complex mapping of account plans and verification series which might not be fully implemented in the backend mock.
    *   **Data Destruction Safety**: The "Nollställ data" action correctly uses a text-confirmation gate, but it does **not** offer a "Download backup first" prompt, increasing the risk of accidental legal data loss.

### 3. Onboarding (`/onboarding`)

**Frame 1: Step 1 - Welcome**
The user is greeted with a localized welcome screen highlighting core features.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Scope AI                                               [ Hoppa över för nu ]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [ (o) ] [ ( ) ] [ ( ) ] [ ( ) ] [ ( ) ] [ ( ) ] [ ( ) ] [ ( ) ]             │
│                                                                              │
│                      (🇸🇪) VÄLKOMMEN TILL SCOPE AI                            │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                  │
│  │ (%) Moms       │  │ (🖋) AI-Bokf.   │  │ (🧾) Kvitton   │                  │
│  └────────────────┘  └────────────────┘  └────────────────┘                  │
│                                                                              │
│                                                                 [ FORTSÄTT ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Step 2 - Onboarding Mode**
The user chooses between starting fresh or importing existing data.

```text
┌── NYSTARTAT ELLER BEFINTLIGT? ───────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                          │
│  │ (🖋) NYSTARTAT       │  │ (↑) BEFINTLIGT       │                          │
│  │ Börja från noll      │  │ Importera SIE-fil    │                          │
│  │ [ VÄLJ ]             │  │ [ VÄLJ ]             │                          │
│  └──────────────────────┘  └──────────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 3: Step 3 - Company Type**
The user selects their legal form to tailor the application logic.

```text
┌── VILKEN FÖRETAGSFORM HAR DU? ───────────────────────────────────────────────┐
│                                                                              │
│  (🏢) AKTIEBOLAG (AB)                  (👤) ENSKILD FIRMA (EF)               │
│      [ VÄLJ ]                              [ VÄLJ ]                          │
│                                                                              │
│  (👥) HANDELSBOLAG (HB)                (🤝) FÖRENING / STIFTELSE             │
│      [ VÄLJ ]                              [ VÄLJ ]                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 4: Step 4 - Company Info (External Data)**
The user enters their basic details, with a link to Bolagsverket.

```text
┌── DITT FÖRETAG ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  Organisationsnummer: [ 559123-4567 ]                                        │
│  Företagsnamn:        [ Scope AI AB ]                                        │
│                                                                              │
│  [ HÄMTA FRÅN BOLAGSVERKET (External Link) ]                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 5: Step 5 - Share Structure (AB Only)**
The user configures the share capital and classes.

```text
┌── AKTIEKAPITAL OCH AKTIER ───────────────────────────────────────────────────┐
│                                                                              │
│  Aktiekapital:        [ 25000       ] kr                                     │
│  Antal aktier totalt: [ 500         ] st                                     │
│                                                                              │
│  A-aktier: [ 0   ]    B-aktier: [ 500 ]                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 6: Step 6 - Shareholders (AB Only)**
The user lists the owners.

```text
┌── AKTIEÄGARE ────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐                                         │
│  │ Johan Svensson                  │                                         │
│  │ 500 aktier (100%)          (✓)  │                                         │
│  └─────────────────────────────────┘                                         │
│                                                                              │
│  [ + LÄGG TILL AKTIEÄGARE ]                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 7: Step 7 - Partners (HB/KB Only)**
The user lists the partners and their stakes.

```text
┌── DELÄGARE ──────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐                                         │
│  │ Delägare 1                      │                                         │
│  │ Insats: 50,000 kr (50%)    (✓)  │                                         │
│  └─────────────────────────────────┘                                         │
│                                                                              │
│  [ + LÄGG TILL DELÄGARE ]                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 8: Step 8 - Bank Integration**
The user attempts to connect their bank (Placeholder).

```text
┌── KOPPLA DIN BANK ───────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐                                         │
│  │ (🏦) BANKINTEGRATION KOMMER SNART│                                         │
│  │ Vi arbetar på Open Banking...   │                                         │
│  └─────────────────────────────────┘                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 9: Step 9 - Import History (Existing Only)**
The user uploads their historical SIE data.

```text
┌── IMPORTERA HISTORIK ────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐                                         │
│  │ (↑) SLÄPP DIN SIE-FIL HÄR       │                                         │
│  │ eller klicka för att välja fil  │                                         │
│  └─────────────────────────────────┘                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 10: Step 10 - Document Upload**
The user uploads initial receipts or invoices.

```text
┌── LADDA UPP UNDERLAG ────────────────────────────────────────────────────────┐
│                                                                              │
│  [ (🧾) Ladda upp filer        (✓) ]                                         │
│  [ (@)  Koppla e-post              ]                                         │
│  [ (->) Jag gör det senare         ]                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 11: Step 11 - Team Invitation**
The user invites colleagues or auditors.

```text
┌── BJUD IN DITT TEAM ─────────────────────────────────────────────────────────┐
│                                                                              │
│  E-post: [ email@example.com       ] [ BJUD IN ]                             │
│                                                                              │
│  TILLGÄNGLIGA ROLLER:                                                        │
│  - Admin (Full åtkomst)                                                      │
│  - Bokförare (Kan hantera transaktioner)                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To capture the critical metadata needed for an automated ledger (Org.nr, Company Type, Shareholders) while lowering the barrier to entry.
2.  **Actual Workflow**: A strictly linear 11-step sequence. It uses `switch(step.id)` to toggle component visibility.
3.  **Issues**:
    *   **External Data Manual Step**: Step 4 ("Hämta från Bolagsverket") is just an external link. It does not auto-fill the form, defeating the purpose of "AI Onboarding."
    *   **Bank Dead-end**: Step 8 is purely a placeholder ("Kommer snart"). This means every user completes onboarding without actually connecting their bank, forcing them to find the manual import later.
    *   **Conditional Logic Leak**: While the code has `companyTypes: ["ab"]` in the config, the `OnboardingWizard` simply increments `currentStep` via `handleNext`. If the logic in `renderStepContent` returns `null` for a skipped step, the user sees an empty frame rather than being jumped forward to the next relevant step.

---

## Phase 6: Hidden Systems (Standalone Dialog Audit)

### 1. BetalningDialog (`betalning.tsx`)

**Frame 1: Overview (The External Link)**
The user attempts to pay an invoice or dividend via an integrated bank link (Tink).

```text
┌── BETALA MED TINK ───────────────────────────────────────────────────────────┐
│  (T) Tink | Säker anslutning (🔒)                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VÄLJ DIN BANK:                                                              │
│  [ (🏦) SEB ]  [ (🏦) Swedbank ]  [ (🏦) Nordea ]  [ (🏦) Handelsbanken ]    │
│                                                                              │
│  Belopp: 12,500.00 kr                                                        │
│  Mottagare: Kunden AB                                                        │
│                                                                              │
│  Powered by Tink • Regleras av Finansinspektionen                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - BankID Signing**
The user confirms the payment details and signs with BankID.

```text
┌── BEKRÄFTA BETALNING ────────────────────────────────────────────────────────┐
│                                                                              │
│  (✓) Företagskonto (1234-5678)                                               │
│      Saldo: 54,230.00 kr                                                     │
│                                                                              │
│  ÖVERFÖRING:                                                                 │
│  Mottagare: Kunden AB                                                        │
│  Belopp:    12,500.00 kr                                                     │
│                                                                              │
│  [ SIGNERA MED BANKID ]                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide a secure, PSD2-compliant way to execute payments directly from the app using Open Banking (Tink).
2.  **Actual Workflow**: Multi-step wizard: Select Bank -> Authenticate -> Select Account -> Sign -> Success.
3.  **Issues**:
    *   **Orphaned Payments**: The success callback `onSuccess()` closes the dialog, but there is no explicit ledger link shown in the code that **automatically** matches this outgoing payment verification to the specific `invoiceId` that triggered it. It relies on the user later "Matching" it in the `Transaktioner` tab.
    *   **BankID Timeout**: The "Authenticating" step uses a static `setTimeout`. In real banking, BankID polling is dynamic and can fail due to user rejection, which isn't handled gracefully in the mock steps.

### 2. PayslipDetailsDialog (`spec.tsx`)

**Frame 1: Overview (The Digital Payslip)**
The user or employee views the final generated payslip.

```text
┌── LÖNESPECIFIKATION: ANNA ANDERSSON ─────────────────────────────────────────┐
│  Period: Februari 2024    Status: Godkänd                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  BESKRIVNING                   ANTAL       À-PRIS      BELOPP                │
│  Månadslön                     1.0         45,000      45,000 kr             │
│  Sjukavdrag (Karens)           -1.0        -2,142      -2,142 kr             │
│  --------------------------------------------------------------------------  │
│  BRUTTOLÖN                                             42,858 kr             │
│  Avdragen skatt (24%)                                 -10,286 kr             │
│  --------------------------------------------------------------------------  │
│  NETTO UTBETALT                                        32,572 kr             │
│                                                                              │
│  [ Ladda ner PDF ]                                             [ Stäng ]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To provide a legal record of earnings and tax deductions for the employee.
2.  **Actual Workflow**: Formats raw payslip data into a professional table.
3.  **Issues**:
    *   **Tax Transparency**: Does not show the **Arbetsgivaravgifter** (Employer contributions) on the spec. While not required for the employee, it's standard practice in modern "transparent" payroll apps.
    *   **YTD Totals missing**: Legal payslips usually show Year-to-Date (Ackumulerat) totals for gross salary and tax. This spec only shows the single period.

### 3. ActionWizard (`action-wizard/index.tsx`)

**Frame 1: Overview (The Corporate Assistant)**
The user selects a complex legal action to perform.

```text
┌── NY BOLAGSÅTGÄRD ───────────────────────────────────────────────────────────┐
│  Välj vilken typ av åtgärd du vill genomföra.                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  (🧩) NYEMISSION ............ Öka aktiekapitalet                             │
│  (🖋) STYRELSEÄNDRING ........ Byt ledamöter                                 │
│  (📈) ROADMAP ............... Skapa affärsplan                               │
│                                                                              │
│  [ (o) ] [ ( ) ] [ ( ) ] [ ( ) ]                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Frame 2: Action - Configuration (ConfigureStep)**
The user enters details for a Board Change.

```text
┌── STYRELSEÄNDRING ───────────────────────────────────────────────────────────┐
│                                                                              │
│  Avgående ledamot: [ Erik Eriksson v ]                                       │
│  Ny ledamot:      [ Kalle Karlsson v ]                                       │
│                                                                              │
│  Gäller från:     [ 2024-02-15       ]                                       │
│                                                                              │
│  -----------------------------------------------------------                 │
│  Detta skapar ett styrelseprotokoll för justering.                           │
│                                                                              │
│  [ Backa ]                                                        [ Nästa ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To simplify complex legal events by guiding the user through the required data and automatically generating the necessary board minutes.
2.  **Actual Workflow**: Logic-heavy wizard that maps inputs to `board_meeting_minutes` JSON.
3.  **Issues**:
    *   **The "Roadmap" Dead-end**: The `roadmap` action calls an external `roadmap-service`. If the service fails, the wizard "completes" but no data is actually saved to the company's compliance record.
    *   **Missing Bolagsverket Sync**: For actions like `Nyemission` or `Board Change`, creating the protocol is only 50% of the task. The system should (but doesn't) provide the XML or instructions for filing the change with Bolagsverket.

### 4. BuyCreditsDialog (`buy-credits-dialog.tsx`)

**Frame 1: Overview (The Token Market)**
The user attempts to purchase more AI power.

```text
┌── KÖP EXTRA AI-CREDITS ──────────────────────────────────────────────────────┐
│  (⚡) Fyll på din AI-budget för att fortsätta använda alla modeller.         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [ ( ) ] 50k Tokens ......... 99 kr                                          │
│  [ (X) ] 250k Tokens ........ 399 kr   [ POPULÄR ]                           │
│  [ ( ) ] 1M Tokens .......... 1299 kr  (Spara 20%)                           │
│                                                                              │
│  [ KÖP 250,000 TOKENS ]                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Functional Audit:**
1.  **Intended Purpose**: To handle the commercial aspect of the AI platform (Consumption-based billing).
2.  **Actual Workflow**: Fetches a Stripe checkout URL and redirects the user.
3.  **Issues**:
    *   **Booking Omission**: When a user buys credits, the system **does not** automatically create a bookkeeping verification for the "Software Cost" (Konto 5420). The transaction will eventually appear in the bank feed, but the "Invoice" from Scope AI is not auto-fetched or pre-booked.

---
**AUDIT FINISHED.**
