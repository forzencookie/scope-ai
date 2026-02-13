# Scope AI — Full Codebase Audit

**Method:** Category-by-category code scan of ~823 TypeScript files, 52+ API routes, 60+ AI tools, and all Supabase migrations. Cross-referenced against FOUNDER_VISION.md, PRODUCTION_ROADMAP.md, and PRODUCTION_WIRING_PLAN.md.

**Purpose:** Ground truth. What's real, what's fake, what's legally dangerous.

---

## EXECUTIVE SUMMARY

| Category | Real % | Key Blocker |
|----------|--------|-------------|
| **Bokföring** | 85% | ~~Invoice booking per-line VAT: FIXED~~; no email sending; no Bankgiro/OCR |
| **Löner** | 75% | ~~Employee tax_rate saved: FIXED~~; full SKV tax tables still needed; ~~benefits don't flow to AGI: FIXED 2026-02-13 Phase B~~ |
| **Rapporter** | 85% | ~~No closing entry engine: FIXED 2026-02-13 Phase C~~; ~~AGI missing individuppgifter: FIXED 2026-02-13 Phase D~~; K2 notes missing |
| **Ägare & Styrning** | 70% | ~~No aktienummer: FIXED 2026-02-13 Phase G~~; ~~dividend account FIXED~~; ~~tax respects gränsbelopp FIXED~~; ~~ABL 17:3 equity check FIXED~~ |
| **Händelser** | 70% | Månadsavslut works under Händelser with row-per-month; Roadmap IS vertical stepper; calendar day-click works |
| **AI Mode** | 75% | ~~Write tools now persist on confirmation: FIXED~~; reads are real; memory still not populated |
| **Cross-cutting** | 70% | CompanyProvider hybrid DB+localStorage; user_memory table exists; ~~no tax_parameters table: FIXED 2026-02-13 Phase A~~; demo files deleted |

**Overall production readiness: ~80%** *(updated 2026-02-13 after Phases A–G fixes)*

The app is significantly more real than the docs suggested. PRODUCTION_WIRING_PLAN Phases 1-4 ARE largely done — the accounting spine (verification_lines, sequential numbering, double-entry) is real. Reports compute from real ledger data. Critical fixes applied: AI write persistence, invoice VAT, dividend account/tax/equity check, employee data persistence, duplicate payroll verification bug.

---

## 1. BOKFÖRING (Bookkeeping) — 75%

### What's REAL (verified in code)

| Feature | Evidence |
|---------|----------|
| **Verification lines table** | Migration `20260206000001` — proper relational table with CHECK constraints (debit XOR credit) |
| **Sequential gap-free numbering** | `get_next_verification_number()` Supabase function, atomic per series/year |
| **Verification series** | A, B, C, D, E series supported |
| **VAT splitting engine** | `src/lib/bookkeeping/vat.ts` — `splitGrossAmount()` handles 25/12/6/0% correctly |
| **Transaction → Verification link** | `verification_id` column exists and is set after booking |
| **Manual verification creation** | `verifikation-dialog.tsx` supports multi-row debit/credit |
| **Server-side pagination** | `transactions.ts` repository has `limit()`, date/amount filters |
| **Status normalization** | `pending`, `booked`, `matched`, `ignored` |
| **Receipt upload + OCR** | Supabase Storage bucket, receipt-service works |
| **Depreciation (straight-line)** | Correct BAS accounts (7832/1229), zero-value guard |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**Invoice booking ignores per-line VAT**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | Booking route now parses `items` JSON, groups by VAT rate (25/12/6/0%), creates correct revenue + output VAT entries per group. Fallback to invoice-level `vat_rate`. |
| **No email sending** | CRITICAL | Resend integration commented out. "Skicka faktura" changes status but sends nothing. |
| **No Bankgiro/Plusgiro on invoices** | CRITICAL | Customer can't pay — no bank details on generated invoices. |
| **No OCR reference generation** | HIGH | Supplier invoices have OCR field, customer invoices don't generate one. |
| **Company info not on invoices** | HIGH | No dynamic company lookup for invoice headers (seller details). |
| **No declining balance depreciation** | MEDIUM | Only straight-line. No räkenskapsenlig 30-regeln option. |
| **Receipt matching too simple** | LOW | Amount-only matching (70% threshold), no date/merchant fuzzing. |

---

## 2. LÖNER (Payroll) — 55%

### What's REAL

| Feature | Evidence |
|---------|----------|
| **Payslips save to DB** | `/api/payroll/payslips` POST → Supabase `payslips` table |
| **Journal entries auto-created** | 7 ledger entries per payslip (7010, 7510, 2710, 2730, 1930, etc.) |
| **Employer contributions** | 31.42% standard; 10.21% for age ≥ 66 (from personnummer) |
| **Vacation pay 12%** | Calculated per Semesterlagen |
| **Employee DB** | Real from Supabase, dynamic count, personnummer field exists |
| **Benefits catalog** | `formaner_catalog` table with 30+ Swedish benefits |
| **Egenavgifter rates** | Correct 2025 Skatteverket rates (28.97% full) |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**Tax = flat 30% default**~~ | ~~CRITICAL~~ **PARTIALLY FIXED 2026-02-12** | Employee API now saves `tax_rate`, `personal_number`, `tax_table`. Stored rate used instead of blind 30% fallback. Duplicate payslip verification bug fixed. Full SKV tax tables still needed. |
| ~~**Benefits don't flow to payslips/AGI**~~ | ~~CRITICAL~~ **FIXED 2026-02-13 Phase B** | Benefits value now flows through payslip generation and is included in AGI individuppgifter. |
| **Partner 3 barrier** | CRITICAL | `withdrawal.ts` — `PARTNER_ACCOUNTS` hardcoded for p-1 and p-2 only. `getPartnerAccounts(index)` exists but isn't used everywhere. |
| **No solvency check on withdrawals** | HIGH | Unlimited partner withdrawals with no equity validation. |
| **AI chat deductions are fake** | MEDIUM | Hardcoded pattern matching for "sjuk", "övertid", "bonus" — not real AI. |
| **Mileage rate hardcoded** | LOW | 2.5 kr/km (25 kr/mil) in `use-team-logic.ts:172`. |
| **Schablonavdrag not auto-applied** | LOW | Egenavgifter expects user to manually deduct 25%. |

---

## 3. RAPPORTER (Reports) — 80%

### What's REAL

| Feature | Evidence |
|---------|----------|
| **P&L from real verification_lines** | `FinancialReportCalculator.calculateIncomeStatementSections()` — accounts 3000-8999 |
| **Sign normalization correct** | Credit/debit properly handled; revenue positive, costs negative |
| **Formal sub-results** | Bruttoresultat, EBITDA, EBIT, Årets resultat |
| **Balance sheet from real data** | Cumulative from verification_lines, accounts 1000-2999 |
| **No fudge factor** | Balance sheet shows raw totals; imbalance visible if exists |
| **Contra-assets handled** | `acc < 2000 ? -b.balance : b.balance` correctly handles 1229 etc. |
| **Momsdeklaration from real VAT accounts** | Accounts 2610-2649, complete SKV 4700 XML export |
| **INK2 complete** | All fields mapped from ledger, SRU export working, dynamic fiscal year |
| **K10 both methods** | Förenklingsregeln + lönebaserat utrymme, dynamic IBB from `useTaxParameters()` |
| **Report constants unused** | `constants.ts` has demo data but NO component imports it |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**No closing entry engine**~~ | ~~CRITICAL~~ **FIXED 2026-02-13 Phase C** | Closing entry engine implemented in `closing-entry-service.ts`. Transfers P&L result to 2099, supports multiple entry types. |
| ~~**AGI missing individuppgifter**~~ | ~~CRITICAL~~ **FIXED 2026-02-13 Phase D** | AGI now includes per-employee KU data with personnummer, individual salary, and tax deductions. |
| **No K2 notes generation** | HIGH | Årsredovisning template exists but notes are manual placeholders. |
| **No board signatures** | HIGH | Underskrifter status hardcoded to "pending", no capture UI. |
| **No pre/post trial balance** | HIGH | Can't distinguish pre-closing from post-closing state. |
| ~~**Tax hardcoded 20.6%**~~ | ~~MEDIUM~~ **FIXED 2026-02-13 Phase A** | Tax rate now reads from centralized `tax_parameters`. |
| **K10 25% max validation missing** | MEDIUM | No cap on dividend vs profit ratio. |
| **No period selection UI** | MEDIUM | Hardcoded to Jan 1 - Dec 31. Processor supports it but UI doesn't expose. |

---

## 4. ÄGARE & STYRNING (Governance) — 40%

### What's REAL

| Feature | Evidence |
|---------|----------|
| **Shareholder DB persistence** | `shareholder-service.ts` (370 lines), real Supabase queries |
| **5 transaction types** | Nyemission, Köp, Gåva, Arv, Split — all create verifications |
| **Share class voting ratio** | A:B = 10:1 correctly implemented |
| **Dividend 3-step workflow** | Plan → Book → Pay with status enforcement |
| **Gränsbelopp from K10** | Dividend logic reads K10 calculation for tax threshold |
| **Meeting lifecycle** | Create → Kallad → Genomförd → Signerat with DB persistence |
| **Firmatecknare derivation** | Correct logic for AB/HB/KB/EF/Förening |
| **Member capital journal entries** | Correct BAS accounts (2083, 3890) for förening |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**No aktienummer (ABL 5:2)**~~ | ~~CRITICAL~~ **FIXED 2026-02-13 Phase G** | `share_number_from`/`share_number_to` auto-assigned sequentially in `shareholder-service.ts`. |
| ~~**Wrong dividend account**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | Changed to 2098 in `use-dividend-logic.ts`, `use-general-meetings.ts`, and `owner-payroll.ts`. |
| ~~**Flat 20% dividend tax**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | Tax now respects gränsbelopp from K10: within = 20% kapitalinkomst, excess = ~32% tjänsteinkomst. Effective blended rate shown. |
| ~~**No distributable equity check**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | ABL 17:3 solvency check added. Computes free equity from accounts 2090-2099. Blocks both planning and booking if insufficient. |
| **Quota value hardcoded 25 kr** | HIGH | `use-aktiebok-logic.ts:182`. Should be aktiekapital ÷ total_shares. |
| **Acquisition price always 0** | HIGH | `use-aktiebok-logic.ts:76`. Needed for capital gains calculations. |
| **Share split doesn't update counts** | HIGH | Creates verification but never multiplies shareholder share counts. |
| **Kallelse sends empty recipients** | CRITICAL | `kallelse.tsx:66` — `recipients: []`. Meeting notices never reach anyone. |
| **saveKallelse doesn't save** | HIGH | Creates updated content but never calls `updateDocument`. Success toast lies. |
| **bookedDecisions = local state** | HIGH | `useState<string[]>([])` — page refresh = double-booking risk. |
| **Digital signatures UI-only** | HIGH | No BankID/Scrive backend. Meetings have no legal validity for signing. |
| **Firmatecknare buttons non-functional** | HIGH | "Redigera", "Visa historik", "Avregistrera" — no onClick handlers. |
| **Partner withdrawals don't create entries** | CRITICAL | HB/KB withdrawals recorded in UI but no journal entries created. |

---

## 5. HÄNDELSER (Events) — 70%

### What's REAL

| Feature | Evidence |
|---------|----------|
| **Månadsavslut under Händelser** | `use-handelser-logic.ts` — default view is `"manadsavslut"`, lives in Händelser tab |
| **12-month grid layout** | `manadsavslut-view.tsx` — row-per-month clickable grid with status indicators |
| **Year switcher** | Available years = current + 2 previous; month navigation with prev/next |
| **Period status from DB** | `financialperiods` table with `status: open/closed`, `reconciliation_checks` JSONB |
| **Checklist with auto + manual items** | `checklist-engine.ts` resolves checks; auto items detect real state |
| **Period locking** | `/api/manadsavslut` PATCH — sets `is_locked: true` on verifications |
| **Calendar day-click dialog** | `day-detail-dialog.tsx` — shows events + personal notes textarea |
| **Day notes persistence** | `saveDayNote()` saves to `financialperiods.reconciliation_checks.dayNotes` |
| **Roadmap = VERTICAL STEPPER** | `roadmap-view.tsx` — `RoadmapStepper` component with vertical line + step icons. NOT cards. |
| **Roadmap DB persistence** | `getRoadmaps()`, `updateStep()`, `deleteRoadmap()` via service layer |
| **Events from real DB** | `useEvents()` hook fetches from API, not hardcoded |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**Lock not enforced in booking API**~~ | ~~HIGH~~ **FIXED 2026-02-13 Phase F** | Booking APIs now check period lock status before allowing new entries. |
| **Calendar deadlines source unclear** | MEDIUM | Events come from DB but unclear if SKV deadlines are dynamically calculated or seeded. |
| **Bolagsåtgärder limited** | MEDIUM | Corporate action wizard exists but only 1 of 6 types enabled. |
| **No Arkiv/Tidslinje removal verified** | LOW | May still exist as routes even though Månadsavslut absorbed their function. |

---

## 6. AI MODE — 45%

### What's REAL

| Feature | Evidence |
|---------|----------|
| **Read tools query real data** | `get_transactions`, `get_customer_invoices`, `get_employees`, `get_payslips` — all call real services |
| **System prompt v2 architecture** | `system-prompt.ts` — instinct-first with scenarios loaded from `ai-conversation-scenarios.md` |
| **Scenarios loaded as few-shot** | `scenarios-loader.ts` loads the 79KB scenario file |
| **Model selection** | `model-selector.ts` — routes Haiku/Sonnet/Sonnet+thinking by complexity |
| **Confirmation flow exists** | `registry.ts` — `confirmationId` generated via `crypto.randomUUID()` |
| **user_memory table** | Migration `20260204190000_create_user_memory_table.sql` exists |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**Write tools don't persist**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | 6 tools updated: `create_invoice` → `/api/invoices` POST, `create_verification` → `verificationService`, `create_transaction` → `/api/transactions`, `run_payroll` → `/api/payroll/payslips`, `register_employee` → `/api/employees`, `register_owner_withdrawal` → `verificationService`. |
| ~~**`run_payroll` doesn't save**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | Now creates real payslips via API for each employee on confirmation. |
| ~~**No confirmation → execution bridge**~~ | ~~CRITICAL~~ **FIXED 2026-02-12** | Registry passes `isConfirmed: true` in `InteractionContext` when confirmation is validated. Each tool checks this flag and persists via API/service. |
| **AGI submit tool = simulation** | HIGH | `payroll.ts:234` comment: "Simulation, but using cleaner logic (no hardcoded totals)" |
| **Memory extraction not implemented** | MEDIUM | `user_memory` table exists but no post-conversation extraction job found. |
| **Demo files deleted** | GOOD | `ai-simulation.ts`, `demo-storage.ts`, `demo-banner.tsx` — all gone. No mock data remnants. |

---

## 7. CROSS-CUTTING & SETTINGS — 60%

### What's REAL

| Feature | Evidence |
|---------|----------|
| **CompanyProvider hybrid persistence** | DB first, localStorage fallback, `saveToDatabase()` with debounce |
| **Onboarding data persists** | Company type, org number, name save to DB. Shareholders seed via `/api/onboarding/seed` |
| **Profile picture upload** | Working via Supabase Storage (built in recent sessions) |
| **Embedded Stripe checkout** | Working (built in recent sessions) |
| **user_credits table** | Migration exists |
| **user_memory table** | Migration exists |
| **Demo files cleaned up** | No `ai-simulation.ts`, `demo-storage.ts`, or mock data files found |

### What's BROKEN

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~**No `tax_parameters` table**~~ | ~~CRITICAL~~ **FIXED 2026-02-13 Phase A** | `tax_parameters` table created and seeded. `useTaxParameters()` hook reads rates dynamically. |
| **No `benefits_catalog` migration** | HIGH | Benefits use static fallback data or AI tool. Catalog table referenced in code but migration may be embedded in alignment migration. |
| ~~**Fiscal year hardcoded to calendar year**~~ | ~~HIGH~~ **FIXED 2026-02-13 Phase E** | Fiscal year selection implemented; reports support custom date ranges. |
| **Some localStorage still used** | MEDIUM | `model-provider.tsx`, `text-mode-provider.tsx` — acceptable for UI preferences. CompanyProvider has proper DB+localStorage hybrid. |
| **No company logo upload** | MEDIUM | Company settings exists but no logo upload field. |
| **Security tab hardcoded** | LOW | 2FA/sessions are visual only — no real implementation. |

---

## PRODUCTION_WIRING_PLAN STATUS — VERIFIED

| Phase | Claimed | Actual |
|-------|---------|--------|
| **Phase 1: Accounting Spine** | DONE | **TRUE** — verification_lines, sequential numbering, journal entries all real |
| **Phase 2: Reports From Real Data** | DONE | **TRUE** — P&L, BS, VAT, INK2 all compute from verification_lines |
| **Phase 3: Cross-Module Symbiosis** | DONE | **MOSTLY TRUE** — Payroll → verifications works. Stat cards partially real. Dividends → verifications works but wrong account. |
| **Phase 4: UI/UX Vision Alignment** | DONE | **PARTIALLY TRUE** — Månadsavslut moved to Händelser ✓, Roadmap is stepper ✓, day-click dialog ✓. But invoice previews, upload simplification, document downloads still pending. |
| **Phase 5: Dynamic Data** | PENDING | **CONFIRMED PENDING** — No tax_parameters table, benefits catalog incomplete, hardcoded rates everywhere. |
| **Phase 6: Founder Vision Gaps** | PARTIAL | **PARTIALLY DONE** — ~~AI write tools FIXED~~. Still pending: email sending, PDF generation, company logo on documents. |

---

## PRIORITY RANKING — WHAT TO FIX FIRST

### Tier 1: Legal Blockers (Can't launch without these)

1. ~~**Fix dividend account 2091 → 2098**~~ — **FIXED 2026-02-12**
2. ~~**Add distributable equity check (ABL 17:3)**~~ — **FIXED 2026-02-12**
3. ~~**Add aktienummer to share register**~~ — ABL 5:2 compliance — **FIXED 2026-02-13 Phase G**
4. **Fix invoice booking per-line VAT** — Currently all invoices book as 25%
5. ~~**Create `tax_parameters` table**~~  — **FIXED 2026-02-13 Phase A**
6. ~~**Replace flat 30% tax with SKV tables**~~ — **PARTIALLY FIXED 2026-02-12** (employee rate saved & used; full SKV tables still needed)

### Tier 2: Core Functionality (App doesn't deliver value without these)

7. **Implement AI write tool persistence** — The #1 value proposition (AI does the work) is currently theater
8. ~~**Add closing entry engine**~~ — **FIXED 2026-02-13 Phase C**
9. ~~**Add AGI individuppgifter**~~ — **FIXED 2026-02-13 Phase D**
10. **Fix kallelse sending** — Populate recipients, actually send emails
11. **Persist bookedDecisions** — Prevent double-booking on page refresh
12. **Add Bankgiro/Plusgiro to invoices** — Customers can't pay without bank details
13. **Fix partner 3 barrier** — Use `getPartnerAccounts(index)` everywhere

### Tier 3: Completeness (Professional product expectations)

14. **Invoice email sending** — Wire Resend integration
15. **Company info on invoices** — Pull from CompanyProvider
16. **OCR reference generation** — Swedish standard for payment matching
17. **Fiscal year support** — `useFiscalYear()` hook replacing hardcoded Jan-Dec
18. **K2 notes + board signatures** — Complete årsredovisning
19. **Company logo upload + on documents** — Professional invoice/payslip appearance
20. **Period lock enforcement in booking API** — Actually reject bookings in locked periods

---

## DOCUMENTS TO CLEAN UP

| Document | Action |
|----------|--------|
| **REMAINING_GAPS.md** | ✅ DELETED 2026-02-13 |
| **ROADMAP.md** | ✅ DELETED 2026-02-13 |
| **ai-memory-architecture.md** | ✅ DELETED 2026-02-13 — superseded by AI_ARCHITECTURE.md |
| **ACCOUNTING_APP_AUDIT.md** | ✅ DELETED 2026-02-13 — superseded by this audit |
| **PRODUCTION_ROADMAP.md** | KEEP — Master reference |
| **PRODUCTION_WIRING_PLAN.md** | KEEP — Phases 1-4 verified, 5-6 pending |
| **FOUNDER_VISION.md** | KEEP — Updated 2026-02-13 with interview insights |
| **ARCHITECTURE.md** | KEEP — Updated 2026-02-13 with coding standards + UX patterns |
| **AI_ARCHITECTURE.md** | KEEP — Current AI design (renamed from ai-architecture-v2.md) |
| **ai-conversation-scenarios.md** | KEEP — Actively loaded into AI prompt at runtime |

---

*Generated from full codebase scan on 2026-02-12. This replaces all previous audit documents as the ground truth.*
