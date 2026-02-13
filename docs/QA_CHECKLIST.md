# Scope AI — Comprehensive QA Checklist

**Date:** 2026-02-12
**Purpose:** Feature-by-feature, button-by-button verification of the entire app. Every page, every dialog, every action, every stat card. Nothing skipped.

**How to use:** Go through each section. For every checkbox, test the described action. Mark PASS / FAIL / BROKEN. If broken, note what happens.

---

## LEGEND

- [ ] = Not tested yet
- [PASS] = Works correctly
- [FAIL] = Doesn't work / wrong output
- [BROKEN] = Crashes / error / critical issue
- [SKIP] = Not applicable for current company type

---

## 0. PRE-FLIGHT — Landing & Auth

### 0.1 Landing Page (`/`)

- [ ] Page loads without errors
- [ ] Hero section renders with correct copy
- [ ] "Kom igang" / CTA button navigates to `/choose-plan` or `/register`
- [ ] Features section displays all feature cards
- [ ] Pricing section shows Demo / Pro / Enterprise tiers
- [ ] Demo tier "Kom igang" button works
- [ ] Pro tier "Uppgradera" button navigates to checkout
- [ ] Enterprise tier shows "Kontakta oss"
- [ ] FAQ section accordion items expand/collapse
- [ ] Footer links work (Villkor, Integritetspolicy, Kontakt, Om oss)
- [ ] Page is responsive (mobile, tablet, desktop)

### 0.2 Public Pages

- [ ] `/priser` — Pricing page loads
- [ ] `/funktioner` — Features page loads
- [ ] `/om-oss` — About page loads
- [ ] `/kontakt` — Contact form loads, submit works
- [ ] `/villkor` — Terms page loads
- [ ] `/integritetspolicy` — Privacy policy page loads

### 0.3 Authentication

- [ ] `/login` — Page loads
- [ ] Email/password login works with valid credentials
- [ ] Email/password login shows error with invalid credentials
- [ ] Google OAuth button works
- [ ] Azure OAuth button works
- [ ] `/register` — Page loads
- [ ] Registration with name, company, email, password works
- [ ] Password validation (min 8 chars) shows error for short passwords
- [ ] `/forgot-password` — Page loads, sends reset email

### 0.4 Plan Selection & Checkout

- [ ] `/choose-plan` — Page loads with tier cards
- [ ] Selecting Pro navigates to checkout
- [ ] `/dashboard/checkout?type=subscription&tier=pro` — Stripe embedded checkout renders
- [ ] Payment completes (use Stripe test card `4242 4242 4242 4242`)
- [ ] `/dashboard/checkout/return` — Return page shows success state
- [ ] After payment, user is redirected to onboarding
- [ ] `/dashboard/checkout?type=credits&tokens=5000000` — Credits checkout works

---

## 1. ONBOARDING (`/onboarding`)

### 1.1 Company Setup Step

- [ ] Wizard loads with first step
- [ ] Company name field accepts input and saves
- [ ] Org number field accepts input and validates format
- [ ] Company type selector shows: AB, EF, HB, KB, Forening
- [ ] Selecting AB shows share capital + total shares fields
- [ ] Selecting HB/KB shows partner fields
- [ ] Selecting Forening shows appropriate fields
- [ ] Skip button is present and works (moves to next step)
- [ ] Data persists to database (check via Supabase or reload page)

### 1.2 Shareholder/Partner Seeding

- [ ] AB: Can add shareholders with name, personnummer, share count
- [ ] HB/KB: Can add partners with type (Komplementar/Kommanditdelägare)
- [ ] Data seeds via `/api/onboarding/seed`
- [ ] Skip button works

### 1.3 SIE Import Step

- [ ] SIE file upload dialog appears
- [ ] Can upload a valid .se file
- [ ] Import processes and shows success
- [ ] Imported transactions appear in Transaktioner after onboarding
- [ ] Skip button works

### 1.4 Profile & Preferences Step

- [ ] Profile picture upload works (click area, select file, image appears)
- [ ] Image uploads to Supabase Storage
- [ ] Dark/light mode toggle works
- [ ] Skip button works

### 1.5 Completion

- [ ] Clicking "Slutfor" marks onboarding as complete in `profiles` table
- [ ] Redirects to `/dashboard/handelser`
- [ ] Cannot access onboarding again after completion (or can with proper reset)

---

## 2. SIDEBAR & NAVIGATION

### 2.1 Sidebar Structure

- [ ] Sidebar renders on all dashboard pages
- [ ] Sidebar collapses/expands (if collapsible mode)
- [ ] Mobile sidebar works (hamburger menu or swipe)

### 2.2 Module Sections (Collapsible)

- [ ] **Bokforing** section expands to show sub-items
- [ ] Transaktioner link navigates to `/dashboard/bokforing?tab=transaktioner`
- [ ] Fakturor link navigates to `/dashboard/bokforing?tab=fakturor`
- [ ] Kvitton link navigates to `/dashboard/bokforing?tab=kvitton`
- [ ] Inventarier link navigates to `/dashboard/bokforing?tab=inventarier`
- [ ] Verifikationer link navigates (if feature-gated, only shows for correct company type)
- [ ] **Loner** section expands
- [ ] Lonekörning link works
- [ ] Formaner link works
- [ ] Team & Rapportering link works
- [ ] Egenavgifter link works
- [ ] Delagaruttag link works
- [ ] **Rapporter** section expands
- [ ] All report subtabs are clickable and navigate correctly
- [ ] Tabs hidden based on company type (e.g., K10 only for AB)
- [ ] **Agare & Styrning** section expands
- [ ] All governance subtabs clickable
- [ ] Feature-gated tabs hide for wrong company types

### 2.3 Settings & Bottom Section

- [ ] Händelser link navigates to `/dashboard/handelser`
- [ ] Inställningar opens settings dialog
- [ ] Företagsstatistik link works
- [ ] User team switcher in footer works

### 2.4 AI Mode Toggle

- [ ] Sidebar can switch to AI chat mode
- [ ] AI chat mode shows conversation list
- [ ] Can switch back to navigation mode
- [ ] Collapse state persists in localStorage

---

## 3. BOKFORING (Bookkeeping)

### 3.1 Transaktioner Tab

#### Stat Cards
- [ ] "Antal betalningar" shows correct count from DB
- [ ] "Pengar in" shows correct positive total
- [ ] "Pengar ut" shows correct negative total
- [ ] "Allt i ordning" shows booked vs unbooked ratio
- [ ] Cards update when transactions change

#### Transaction Table
- [ ] Table loads with real transactions from DB (or empty state if none)
- [ ] Pagination works (next/previous page)
- [ ] Server-side pagination confirmed (not loading all data)
- [ ] Search bar filters transactions by description/amount
- [ ] Filter tabs work: Alla, Obesedd, Bokford, etc.
- [ ] Status badges show correctly (pending, booked, matched, ignored)
- [ ] Clicking a transaction row opens detail view or booking dialog

#### New Transaction Dialog ("Ny transaktion" button)
- [ ] Button exists and opens dialog
- [ ] **Manual entry mode:**
  - [ ] Description field accepts input
  - [ ] Counterparty field works
  - [ ] Amount field accepts numeric input
  - [ ] Date picker works
  - [ ] VAT rate selector (25%, 12%, 6%, 0%)
  - [ ] Account selector works
  - [ ] Submit creates transaction in DB
  - [ ] New transaction appears in table
- [ ] **File upload / OCR mode:**
  - [ ] File upload area accepts documents
  - [ ] OCR processes the uploaded document
  - [ ] Extracted data populates form fields
  - [ ] Can submit after OCR extraction

#### Booking Dialog (per-transaction)
- [ ] Opens when clicking "Bokfor" on a transaction
- [ ] Shows transaction details (amount, date, description)
- [ ] Step 1 (Details): Shows transaction info correctly
- [ ] Step 2 (Booking): Debit/credit account selection works
  - [ ] Account dropdown shows BAS accounts
  - [ ] Can search/filter accounts
  - [ ] VAT splitting calculates correctly (25/12/6/0%)
  - [ ] Debit = Credit balance check shown
- [ ] Step 3 (Confirm): Shows summary
- [ ] "Bokfor" button creates verification + verification_lines in DB
- [ ] Transaction status changes to "booked" after booking
- [ ] Verification number assigned (sequential, gap-free)
- [ ] File upload in booking dialog works

#### Rapid Click Stress Test
- [ ] Click "Ny transaktion" rapidly 10 times — only one dialog opens
- [ ] Click "Bokfor" rapidly on same transaction — no double-booking
- [ ] Rapidly switch between filter tabs — no API flood / no stale data
- [ ] Rapidly paginate forward/back — data stays consistent

---

### 3.2 Fakturor Tab

#### Stat Cards
- [ ] Invoice lifecycle stats display (Utkast, Skickade, Betalda, Forfalina)
- [ ] Counts are from real DB data
- [ ] Cards update when invoices change

#### Invoice List/Kanban
- [ ] Invoices load from DB
- [ ] Kanban columns show by status
- [ ] Can click an invoice to view details
- [ ] Search/filter works

#### Create Invoice Dialog ("Ny faktura" button)
- [ ] Button opens invoice creation dialog
- [ ] **Customer Info Section:**
  - [ ] Customer name field
  - [ ] Customer address fields
  - [ ] Customer org number
  - [ ] Customer email
- [ ] **Line Items Section:**
  - [ ] Can add line items
  - [ ] Each line: description, quantity, unit price, VAT rate
  - [ ] Per-line VAT rate selector (25%, 12%, 6%, 0%)
  - [ ] Auto-calculates line total
  - [ ] Can remove line items
  - [ ] Can add multiple lines
- [ ] **Payment Terms Section:**
  - [ ] Due date / payment terms
  - [ ] Bankgiro/Plusgiro fields (CRITICAL — verify they exist)
  - [ ] OCR reference (verify if generated)
- [ ] **Notes Section:**
  - [ ] Free text notes field
- [ ] **Invoice Preview:**
  - [ ] Preview shows formatted invoice
  - [ ] Company info appears on preview (CRITICAL — verify dynamic lookup)
  - [ ] Company logo appears (if uploaded)
- [ ] **Submit:**
  - [ ] "Spara utkast" saves as draft
  - [ ] "Skapa & skicka" — does it actually send email? (KNOWN BROKEN: Resend commented out)
  - [ ] Invoice appears in list after creation

#### Invoice Booking
- [ ] Can book an invoice to verifications
- [ ] **CRITICAL CHECK:** Does booking use per-line VAT rates or hardcoded 25%?
  - Test: Create invoice with one line at 12% VAT, book it, check verification_lines
- [ ] Verification lines created with correct accounts

#### Supplier Invoice Dialog ("Leverantörsfaktura")
- [ ] Can register supplier invoices
- [ ] Document upload and OCR works
- [ ] Vital info extraction from OCR
- [ ] Can book supplier invoices

#### Stress Test
- [ ] Rapidly add/remove line items — totals recalculate correctly
- [ ] Submit invoice while rapidly clicking — no duplicate creation
- [ ] Large number of invoices (50+) — list performance acceptable

---

### 3.3 Kvitton Tab

#### Receipt List
- [ ] Receipts load from DB
- [ ] Table shows receipt details (date, amount, description, status)

#### Upload Receipt
- [ ] **Manual mode** available
- [ ] **OCR mode** available
- [ ] File upload works (image/PDF)
- [ ] OCR extracts amount, date, merchant
- [ ] Receipt saves to Supabase Storage
- [ ] Receipt appears in list after upload

#### Receipt Matching
- [ ] Receipts can be matched to transactions
- [ ] Matching logic works (amount-based 70% threshold)
- [ ] Matched receipt links to transaction

---

### 3.4 Inventarier Tab

#### Asset Table
- [ ] Table loads with assets from DB (or empty state)
- [ ] Table has proper header/title
- [ ] Columns: name, purchase date, purchase price, current value, depreciation

#### Add Asset
- [ ] Can add new asset
- [ ] Fields: name, purchase date, purchase price, useful life, account

#### Depreciation
- [ ] "Bokfor avskrivning" button exists
- [ ] Creates verification with correct BAS accounts (7832 debit, 1229 credit)
- [ ] Zero-value guard works (can't depreciate below 0)
- [ ] Straight-line calculation is correct

---

### 3.5 Verifikationer Tab

#### Verification Table
- [ ] Table loads with real verification data from verification_lines
- [ ] Columns: Nr, Datum, Konto, Beskrivning, Belopp
- [ ] Search bar works
- [ ] Filter capabilities work
- [ ] Flat table layout (not collapsible BAS-account structure)

#### Manual Verification Dialog
- [ ] Can create new manual verification
- [ ] Multi-row debit/credit entry
- [ ] Debit = Credit balance enforced
- [ ] Sequential number assigned automatically
- [ ] Verification series (A, B, C, D, E) selectable

#### Edit Verification
- [ ] Can edit existing verification (not delete)
- [ ] Changes persist to DB

---

## 4. LONER (Payroll)

### 4.1 Lönekörning Tab

#### Stat Cards
- [ ] "Antal anställda" shows correct count from Team data
- [ ] "Total brutto" shows sum from actual payslip data
- [ ] "Skatt att betala" shows sum from payslip tax data
- [ ] Cards update dynamically

#### Payslip Table
- [ ] Shows list of payslips from DB
- [ ] Can view individual payslip details

#### Create Payslip Dialog
- [ ] "Ny lönekörning" button opens dialog
- [ ] Employee selector shows team members from DB
- [ ] If employee not in system, prompts to add to Team
- [ ] **Salary fields:**
  - [ ] Gross salary (bruttolön)
  - [ ] Tax rate — **CRITICAL CHECK:** Is it flat 30% default or from SKV tables?
    - Enter an employee with a known municipality → verify rate
  - [ ] Deductions
  - [ ] Net salary calculation
- [ ] **Employer contributions:**
  - [ ] 31.42% standard rate calculated
  - [ ] 10.21% for age >= 66 (from personnummer)
- [ ] **Vacation pay:** 12% calculated per Semesterlagen
- [ ] **Submit:**
  - [ ] Payslip saves to `payslips` table
  - [ ] 7 journal entries auto-created (7010, 7510, 2710, 2730, 1930, etc.)
  - [ ] Verification created with correct amounts

#### AI Chat Deductions
- [ ] **KNOWN BROKEN:** Check if "sjuk", "övertid", "bonus" deductions are hardcoded pattern matches or real

#### Stress Test
- [ ] Create payslip while rapidly clicking — no double-creation
- [ ] Create payslips for multiple employees in sequence — all save correctly

---

### 4.2 Formaner Tab

#### Benefits Catalog
- [ ] Benefits list loads (from `formaner_catalog` table or static fallback)
- [ ] 30+ Swedish benefit types available
- [ ] **CRITICAL CHECK:** Are benefits from a DB table or hardcoded?

#### Stat Cards
- [ ] "Totalt" — total money spent on benefits
- [ ] "Täckning" — ratio of employees using benefits vs total
- [ ] "Outnyttjad" — remaining potential value

#### Assign Benefits
- [ ] Can assign benefits to employees
- [ ] Förmånsvärde calculated
- [ ] **CRITICAL CHECK:** Does förmånsvärde flow to payslips? (KNOWN BROKEN: it doesn't)
- [ ] **CRITICAL CHECK:** Does förmånsvärde flow to AGI? (KNOWN BROKEN: it doesn't)

---

### 4.3 Team & Rapportering Tab

#### Employee List
- [ ] Employee cards load from DB
- [ ] Card shows: name, role, salary info preview
- [ ] Empty state shows when no employees

#### "Ny anställd" Button
- [ ] Opens AddEmployeeDialog
- [ ] Fields: name, personnummer, role, email, phone, salary
- [ ] Submit saves to `employees` table in Supabase
- [ ] New employee appears in grid after save

#### Employee Card Actions
- [ ] "Rapportera" button opens ReportDialog
- [ ] "Visa dossier" button opens EmployeeDossierDialog

#### ReportDialog
- [ ] Report type selector: utlägg, milersättning, bonus, sjuk, övertid
- [ ] Amount field works
- [ ] KM field works (for mileage)
- [ ] Description field works
- [ ] Hours field works
- [ ] Submit saves report
- [ ] **CRITICAL CHECK:** Mileage rate — is it hardcoded 2.5 kr/km?

#### EmployeeDossierDialog
- [ ] Shows employee full history
- [ ] Salary history (payslips) loads from DB
- [ ] Expenses list shows
- [ ] Benefits list shows
- [ ] Balance and mileage totals display

---

### 4.4 Egenavgifter Tab

#### Self-Employment Contributions
- [ ] Correct 2025 Skatteverket rates displayed (28.97% full)
- [ ] Calculation based on actual income data
- [ ] **CRITICAL CHECK:** Is schablonavdrag 25% auto-applied or manual?
- [ ] Can generate related documents
- [ ] Actions communicate with Verifikationer

---

### 4.5 Delägaruttag Tab

#### Withdrawal List
- [ ] Shows withdrawal history from DB

#### New Withdrawal Dialog
- [ ] "Nytt uttag" button opens dialog
- [ ] Types: uttag (withdrawal), insättning (deposit), lön (salary)
- [ ] Amount field
- [ ] Date field
- [ ] Description field
- [ ] Bank instruction info generated
- [ ] Submit saves withdrawal
- [ ] **CRITICAL CHECK:** Does verification get created? (KNOWN BROKEN for HB/KB: no journal entries)
- [ ] **CRITICAL CHECK:** Partner 3 barrier — can you add partner 3? (`PARTNER_ACCOUNTS` hardcoded for p-1, p-2 only)
- [ ] **CRITICAL CHECK:** Solvency check — is there an equity validation? (KNOWN MISSING)

---

## 5. RAPPORTER (Reports)

### 5.1 Resultaträkning

- [ ] Tab loads
- [ ] P&L computes from real verification_lines (accounts 3000-8999)
- [ ] Sign normalization correct (revenue positive, costs negative)
- [ ] Sub-results display: Bruttoresultat, EBITDA, EBIT, Årets resultat
- [ ] **CRITICAL CHECK:** No hardcoded/demo data — all from real ledger
- [ ] Period selection works (or is it hardcoded Jan 1 - Dec 31?)
- [ ] Export/download works (if available)

### 5.2 Balansräkning

- [ ] Tab loads
- [ ] Balance sheet computes from real verification_lines (accounts 1000-2999)
- [ ] Cumulative calculation correct
- [ ] Contra-assets handled (1229 etc.)
- [ ] Imbalance visible if it exists (no fudge factor)
- [ ] **CRITICAL CHECK:** No hardcoded demo data

### 5.3 Momsdeklaration

- [ ] Tab loads
- [ ] VAT amounts from real accounts 2610-2649
- [ ] Manual entry mode works
- [ ] AI-assisted mode works (clicking AI button triggers agent)
- [ ] MomsWizardDialog opens
  - [ ] Multi-step form (ruta05-ruta48)
  - [ ] Auto-calculates output VAT from bases
  - [ ] Editable form fields
  - [ ] Saves to `/api/reports/moms`
- [ ] SKV 4700 XML export works
- [ ] Downloaded file is valid XML format

### 5.4 Inkomstdeklaration

- [ ] Tab loads
- [ ] INK2 fields mapped from ledger
- [ ] Manual mode works
- [ ] AI-assisted mode works
- [ ] InkomstWizardDialog opens and functions
- [ ] SRU export works
- [ ] Dynamic fiscal year (or hardcoded Jan-Dec?)

### 5.5 AGI

- [ ] Tab loads
- [ ] Summary totals display
- [ ] **CRITICAL CHECK:** Individuppgifter present? (KNOWN MISSING: no per-employee KU data)
- [ ] AGIWizardDialog opens
- [ ] Submit is real or simulation? (KNOWN: simulation)

### 5.6 Årsredovisning

- [ ] Tab loads
- [ ] Template renders
- [ ] ArsredovisningWizardDialog opens
- [ ] **CRITICAL CHECK:** K2 notes — are they real or manual placeholders?
- [ ] **CRITICAL CHECK:** Board signatures — real or hardcoded "pending"?
- [ ] **CRITICAL CHECK:** Tax rate — hardcoded 20.6%? (`annual-report-processor.ts:45`)
- [ ] iXBRL export available? (KNOWN MISSING)

### 5.7 Årsbokslut

- [ ] Tab loads
- [ ] **CRITICAL CHECK:** Closing entry engine — can it transfer P&L result to account 2099? (KNOWN MISSING)
- [ ] **CRITICAL CHECK:** Pre/post trial balance distinction available? (KNOWN MISSING)

### 5.8 K10

- [ ] Tab loads (only for AB company type)
- [ ] K10WizardDialog opens
- [ ] Fields: aktiekapital, omkostnadsbelopp, ägarandel, totalDividends
- [ ] Förenklingsregeln calculation works
- [ ] Lönebaserat utrymme calculation works
- [ ] Dynamic IBB from `useTaxParameters()`
- [ ] Saves to `/api/reports/k10`
- [ ] **CRITICAL CHECK:** 25% max dividend validation exists? (KNOWN MISSING)

---

## 6. AGARE & STYRNING (Governance)

### 6.1 Aktiebok Tab (AB only)

- [ ] Tab loads
- [ ] Share register table shows shareholders from DB
- [ ] 5 transaction types available: Nyemission, Köp, Gåva, Arv, Split
- [ ] Each transaction type creates verification
- [ ] Share class voting ratio A:B = 10:1 works
- [ ] **CRITICAL CHECK:** Aktienummer present? (`shareNumberFrom`/`shareNumberTo`) — KNOWN MISSING (ABL 5:2 violation)
- [ ] **CRITICAL CHECK:** Quota value — hardcoded 25 kr or calculated? (KNOWN: hardcoded)
- [ ] **CRITICAL CHECK:** Acquisition price — always 0? (KNOWN: yes)
- [ ] **CRITICAL CHECK:** Share split — does it update share counts? (KNOWN: creates verification but doesn't multiply counts)
- [ ] Download aktiebok works

### 6.2 Delägare Tab

- [ ] Tab loads
- [ ] Partner/shareholder cards display from DB
- [ ] AddPartnerDialog:
  - [ ] Name field
  - [ ] Personal number field
  - [ ] Partner type (for HB/KB: Komplementär/Kommanditdelägare)
  - [ ] Ownership % field
  - [ ] Capital field
  - [ ] Submit saves to backend

### 6.3 Utdelning Tab (AB only)

- [ ] Tab loads
- [ ] Dividend 3-step workflow: Plan → Book → Pay
- [ ] RegisterDividendDialog opens
  - [ ] Proposed amount field
  - [ ] Income year field
- [ ] Gränsbelopp from K10 is read
- [ ] **CRITICAL CHECK:** Dividend account — uses 2091 or 2098? (KNOWN BROKEN: uses 2091, should be 2098)
- [ ] **CRITICAL CHECK:** Tax rate — flat 20% or progressive? (KNOWN BROKEN: flat 20%, ignores gränsbelopp)
- [ ] **CRITICAL CHECK:** Distributable equity check — does ABL 17:3 solvency test run? (KNOWN MISSING)
- [ ] Status enforcement works (can't skip steps)
- [ ] Booking creates verification with correct accounts

### 6.4 Medlemsregister Tab (Förening only)

- [ ] Tab loads
- [ ] Member list from DB
- [ ] AddMemberDialog:
  - [ ] Name, email, phone, membership type
  - [ ] Membership fee checkbox (account 3890)
  - [ ] Capital contribution checkbox (account 2083)
  - [ ] Submit saves to backend
- [ ] Member capital journal entries created with correct BAS accounts

### 6.5 Möten & Protokoll Tab (Bolagsstämma)

- [ ] Tab loads
- [ ] Meeting list from DB
- [ ] MeetingStats stat cards display correctly
- [ ] UpcomingAlert shows for near-future meetings
- [ ] Filter tabs: Alla, Bolagsstämma, Styrelsemöte
- [ ] Search bar filters meetings

#### "Nytt möte" Dropdown
- [ ] Button opens dropdown
- [ ] "Planera bolagsstämma" option opens PlanMeetingDialog
  - [ ] Date, time, location fields
  - [ ] Meeting type selector
  - [ ] Agenda items
  - [ ] Submit creates meeting in DB
- [ ] "Nytt styrelsemöte" option opens PlanMeetingDialog (board type)
  - [ ] Same fields, different type

#### Meeting View/Edit Dialog
- [ ] Click meeting card → MeetingViewDialog opens
- [ ] Shows meeting details
- [ ] Meeting lifecycle: Create → Kallad → Genomförd → Signerat
- [ ] Can update meeting status
- [ ] **CRITICAL CHECK:** Kallelse sending — recipients populated? (KNOWN BROKEN: `recipients: []`)
- [ ] **CRITICAL CHECK:** `saveKallelse` — does it actually save? (KNOWN BROKEN: never calls `updateDocument`)
- [ ] **CRITICAL CHECK:** Digital signatures — BankID/Scrive backend? (KNOWN: UI-only)
- [ ] **CRITICAL CHECK:** `bookedDecisions` — persisted or local state? (KNOWN BROKEN: `useState` = lost on refresh)
- [ ] Can book dividend decision from meeting

### 6.6 Årsmöte Tab (Förening only)

- [ ] Tab loads
- [ ] Annual meeting functionality similar to Bolagsstämma
- [ ] Meeting creation and management works

### 6.7 Firmatecknare Tab

- [ ] Tab loads
- [ ] Shows authorized signers
- [ ] Firmatecknare derivation logic correct (AB/HB/KB/EF/Förening)
- [ ] **CRITICAL CHECK:** "Redigera" button — has onClick handler? (KNOWN BROKEN: no handler)
- [ ] **CRITICAL CHECK:** "Visa historik" button — has onClick handler? (KNOWN BROKEN: no handler)
- [ ] **CRITICAL CHECK:** "Avregistrera" button — has onClick handler? (KNOWN BROKEN: no handler)

---

## 7. HÄNDELSER (Events)

### 7.1 Månadsavslut View (Default)

- [ ] Default view when entering Händelser
- [ ] 12-month grid layout with row-per-month
- [ ] Year switcher: current year + 2 previous
- [ ] Left/right arrows for year navigation
- [ ] Month rows show status indicators (open/closed)
- [ ] Clicking a month row expands to show checklist
- [ ] Checklist has auto + manual items
- [ ] Auto items detect real state (booked transactions, etc.)
- [ ] Manual items can be checked off
- [ ] Period locking works (`/api/manadsavslut` PATCH)
- [ ] **CRITICAL CHECK:** Lock enforcement — can you still book to a locked period? (KNOWN BROKEN: booking APIs don't check lock)

### 7.2 Kalender View

- [ ] Calendar renders with month view
- [ ] Previous/next month navigation works
- [ ] Events from DB display on correct dates
- [ ] **Day-click dialog:**
  - [ ] Clicking a day opens DayDetailDialog
  - [ ] Shows events for that day
  - [ ] Personal notes textarea
  - [ ] Notes save (debounced 500ms)
  - [ ] Notes persist on reload (saves to `financialperiods.reconciliation_checks.dayNotes`)
  - [ ] Previous/next day navigation works
- [ ] SKV deadlines shown (dynamic or seeded?)

### 7.3 Planering (Roadmap) View

- [ ] Roadmap renders as vertical stepper (not cards)
- [ ] Roadmap data from DB via `getRoadmaps()`
- [ ] "Ny åtgärd" button opens ActionWizard
- [ ] ActionWizard:
  - [ ] RoadmapForm available
  - [ ] Can create new roadmap item
  - [ ] Item saves to DB
  - [ ] Item appears in stepper
- [ ] Can update step status via `updateStep()`
- [ ] Can delete roadmap via `deleteRoadmap()`
- [ ] **NOTE:** This is the ROADMAP, not the "Min Plan" daily/weekly plan (which is MISSING)

### 7.4 Aktivitetslogg View

- [ ] Activity feed loads
- [ ] Shows recent actions from across the app
- [ ] Events from real DB

### 7.5 View Switching

- [ ] Tab buttons: Månadsavslut, Kalender, Planering, Aktivitetslogg
- [ ] Each icon-only tab expands label when active
- [ ] Switching is instant (no full page reload)
- [ ] Year nav only shows for calendar + månadsavslut views

---

## 8. FÖRETAGSSTATISTIK (Statistics)

### 8.1 Översikt

- [ ] Page loads at `/dashboard/foretagsstatistik`
- [ ] Overview stats display
- [ ] Data from real DB or hardcoded?

### 8.2 Kostnadsanalys

- [ ] Cost analysis renders
- [ ] Charts/graphs display
- [ ] Data from real verification_lines or hardcoded?

---

## 9. INSTÄLLNINGAR (Settings)

### 9.1 Settings Dialog

- [ ] Opens from sidebar
- [ ] Tab navigation works within dialog

### 9.2 Konto (Account) Tab

- [ ] Profile picture displays (from Supabase Storage)
- [ ] Can change profile picture
- [ ] Name field editable
- [ ] Email field displays
- [ ] Save changes persists to `profiles` table

### 9.3 Företag (Company) Tab

- [ ] Company name editable
- [ ] Org number editable
- [ ] Company type displayed
- [ ] **CRITICAL CHECK:** Company logo upload — exists? (KNOWN MISSING)
- [ ] Share capital / total shares editable (for AB)
- [ ] Save persists to `companies` table

### 9.4 Språk & Region Tab

- [ ] Language toggle (Easy mode / Standard mode)
- [ ] Effect of mode change visible in UI labels
- [ ] Dark/light mode toggle
- [ ] Settings persist across sessions

### 9.5 Säkerhet (Security) Tab

- [ ] **CRITICAL CHECK:** 2FA settings — real or visual only? (KNOWN: visual only)
- [ ] **CRITICAL CHECK:** Active sessions — real or hardcoded? (KNOWN: visual only)

### 9.6 Fakturering (Billing) Tab

- [ ] Current plan displays (Demo/Pro)
- [ ] Plan price shown
- [ ] "Hantera prenumeration" opens Stripe portal
- [ ] **UsageBar:**
  - [ ] Shows token usage
  - [ ] Shows period end date
  - [ ] Warning when near limit
  - [ ] Message when over limit
- [ ] **Buy Credits Section:**
  - [ ] 3 credit packages displayed
  - [ ] Clicking package navigates to checkout
  - [ ] "Populär" badge on middle package
  - [ ] Savings shown on larger package
- [ ] **Payment Method:**
  - [ ] Shows real card last4 from Stripe
  - [ ] "Redigera" opens Stripe portal
- [ ] **Billing History:**
  - [ ] Loads from `/api/stripe/billing-history`
  - [ ] Shows subscription invoices and credit purchases
  - [ ] Download receipt button works (opens Stripe hosted URL)
  - [ ] View invoice button works

---

## 10. AI MODE

### 10.1 Chat Interface

- [ ] AI chat opens in sidebar
- [ ] Can type a message and send
- [ ] AI responds (not error / not empty)
- [ ] Conversation saves to DB
- [ ] Previous conversations listed and loadable

### 10.2 Read Tools (should work)

- [ ] Ask Scooby: "Visa mina transaktioner" → gets real data from DB
- [ ] Ask: "Hur manga fakturor har jag?" → reads real invoice count
- [ ] Ask: "Vilka anställda har jag?" → reads real employee list
- [ ] Ask: "Visa mina lönebesked" → reads real payslips
- [ ] Ask: "Vad ar mitt resultat?" → reads real P&L data

### 10.3 Write Tools (KNOWN BROKEN — test to confirm)

- [ ] Ask: "Skapa en faktura åt mig" → **Does it persist to DB?**
  - Expected: Creates confirmation overlay → user approves → persists
  - Known issue: Generates fake ID, never calls invoiceService.create()
- [ ] Ask: "Kör löner för [employee]" → **Does it persist?**
  - Known issue: Calculates in memory, never calls payroll API
- [ ] Ask: "Boka denna transaktion" → **Does it persist?**
  - Test the confirmation → execution bridge

### 10.4 Model Selection

- [ ] Simple questions → Haiku model (fast, cheap)
- [ ] Complex questions → Sonnet model
- [ ] Deep analysis → Sonnet+thinking model

### 10.5 Memory

- [ ] **CRITICAL CHECK:** Does Scooby remember things from previous sessions?
  - Known issue: `user_memory` table exists but nothing writes to it
  - Test: Tell Scooby a preference → close chat → reopen → ask about it

### 10.6 Stress Test

- [ ] Send 5 messages rapidly — no lost messages, correct ordering
- [ ] Very long message (1000+ chars) — handles correctly
- [ ] Open AI chat → switch to nav → switch back → conversation preserved

---

## 11. CROSS-CUTTING CONCERNS

### 11.1 Company Type Feature Gating

Test with each company type to verify correct tabs/features show:

#### AB (Aktiebolag)
- [ ] Aktiebok visible
- [ ] Delägare visible
- [ ] Utdelning visible
- [ ] Bolagsstämma visible
- [ ] Firmatecknare visible
- [ ] K10 visible in reports
- [ ] Momsdeklaration visible
- [ ] Inkomstdeklaration visible
- [ ] Årsredovisning visible

#### EF (Enskild Firma)
- [ ] Egenavgifter visible
- [ ] Delägare NOT visible (or adapted)
- [ ] Aktiebok NOT visible
- [ ] Appropriate reports visible

#### HB/KB (Handelsbolag/Kommanditbolag)
- [ ] Delägaruttag visible
- [ ] Partner-specific features work
- [ ] Correct BAS accounts for partner withdrawals

#### Förening
- [ ] Medlemsregister visible
- [ ] Årsmöte visible
- [ ] Member capital accounts (2083, 3890)

### 11.2 Data Persistence

- [ ] Refresh page — all data still there (no localStorage-only state)
- [ ] Log out → log in — data persists
- [ ] Different browser — same data shows

### 11.3 Error Handling

- [ ] Network disconnect — graceful error (not white screen)
- [ ] Invalid API response — error message shown
- [ ] 401 unauthorized — redirects to login
- [ ] Form validation — shows error messages for invalid input

### 11.4 Responsive Design

Test on:
- [ ] Desktop (1440px+)
- [ ] Tablet (768px-1024px)
- [ ] Mobile (375px)
- [ ] Sidebar behavior on mobile
- [ ] Dialog sizing on mobile
- [ ] Table scrolling on mobile

### 11.5 Performance

- [ ] Initial page load < 3 seconds
- [ ] Tab switching < 500ms
- [ ] No unnecessary API calls on page load (check Network tab)
- [ ] No memory leaks (check over 5 minutes of usage)
- [ ] No excessive re-renders (React DevTools profiler)

---

## 12. KNOWN BROKEN ITEMS — VERIFY STATUS

These are items flagged in the codebase audit. Verify they are still broken (or if fixed):

| # | Item | Location | Expected State |
|---|------|----------|----------------|
| 1 | ~~Invoice booking hardcodes 25% VAT~~ | `invoices/[id]/book/route.ts` | **FIXED 2026-02-12** — Now uses per-line VAT from invoice items |
| 2 | ~~Payroll tax = flat 30%~~ | `use-create-payslip-logic.ts` | **PARTIALLY FIXED 2026-02-12** — Employee's stored tax_rate used; API saves tax data; duplicate verification bug fixed. Full SKV tables still needed. |
| 3 | ~~Dividend account 2091 (should be 2098)~~ | Dividend logic | **FIXED 2026-02-12** — All 3 locations changed to 2098 |
| 4 | ~~Flat 20% dividend tax~~ | `use-dividend-logic.ts` | **FIXED 2026-02-12** — Now respects gränsbelopp from K10: within = 20%, excess = ~32% |
| 5 | No aktienummer on shares | Aktiebok | MISSING |
| 6 | ~~No distributable equity check~~ | Dividend flow | **FIXED 2026-02-12** — ABL 17:3 check from accounts 2090-2099, blocks plan+book if insufficient |
| 7 | ~~AI write tools don't persist~~ | All AI write tools | **FIXED 2026-02-12** — 6 tools now persist on confirmation |
| 8 | ~~No confirmation→execution bridge~~ | AI tool registry | **FIXED 2026-02-12** — `isConfirmed` flag in context |
| 9 | Kallelse recipients empty | `kallelse.tsx:66` | BROKEN |
| 10 | saveKallelse doesn't save | Meeting logic | BROKEN |
| 11 | bookedDecisions = local state | Meeting page | BROKEN |
| 12 | Firmatecknare buttons non-functional | Firmatecknare tab | BROKEN |
| 13 | Partner withdrawals no journal entries | HB/KB withdrawal | BROKEN |
| 14 | Quota value hardcoded 25 kr | `use-aktiebok-logic.ts:182` | BROKEN |
| 15 | Share split doesn't update counts | Aktiebok split | BROKEN |
| 16 | Tax hardcoded 20.6% in annual report | `annual-report-processor.ts:45` | BROKEN |
| 17 | No closing entry engine | Årsbokslut | MISSING |
| 18 | No AGI individuppgifter | AGI report | MISSING |
| 19 | No period lock enforcement | Booking APIs | MISSING |
| 20 | AI memory not populated | user_memory table | MISSING |

---

## 13. SYMBIOSIS CHECKS — Does the System Talk to Itself?

These verify that actions in one part of the app correctly update other parts:

- [ ] **Booking a transaction** → appears in Verifikationer
- [ ] **Booking a transaction** → updates Resultaträkning and Balansräkning
- [ ] **Creating a payslip** → creates 7 verification lines
- [ ] **Creating a payslip** → updates "Skatt att betala" in Lönekörning stats
- [ ] **Booking a dividend** → creates verification (uses account 2098 — FIXED 2026-02-12)
- [ ] **Adding an employee in Team** → updates "Antal anställda" in Lönekörning
- [ ] **Importing SIE file** → transactions appear in Transaktioner
- [ ] **Importing SIE file** → reports recalculate from imported data
- [ ] **Locking a period in Månadsavslut** → prevents new bookings in that period (KNOWN BROKEN)
- [ ] **Booking an invoice** → VAT amounts update Momsdeklaration
- [ ] **Partner withdrawal** → creates journal entries (KNOWN BROKEN for HB/KB)
- [ ] **Member fee payment** → creates journal entry in Verifikationer
- [ ] **Benefits assigned** → förmånsvärde flows to payslip (KNOWN BROKEN)
- [ ] **Benefits assigned** → förmånsvärde flows to AGI (KNOWN BROKEN)

---

## 14. RAPID-CLICK / STRESS TEST PROTOCOL

For each critical action, test by clicking 10 times rapidly:

- [ ] "Ny transaktion" button — max 1 dialog opens
- [ ] "Bokför" button on transaction — max 1 booking created
- [ ] "Ny faktura" button — max 1 dialog opens
- [ ] "Skapa & skicka" on invoice — max 1 invoice created
- [ ] "Ny lönekörning" button — max 1 dialog opens
- [ ] "Ny anställd" button — max 1 dialog opens
- [ ] "Nytt möte" button — max 1 dropdown opens
- [ ] Any form submit button — max 1 submission
- [ ] Tab switching (all pages) — no stale data, no API flood
- [ ] Pagination buttons — data consistent, no duplicate loads
- [ ] Year navigation arrows — no out-of-range, no broken state
- [ ] Day clicking in calendar — only 1 dialog opens

---

*This checklist covers ~300+ individual test points across every page, dialog, button, stat card, and API interaction in the app. Update status as you test.*
