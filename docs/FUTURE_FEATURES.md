# Future Features & Remaining Work

Consolidated from all previous planning docs. Verified against codebase 2026-02-27 — only items confirmed as NOT yet implemented are listed.

---

## Bugs & Code Fixes (Verified still open)

### Dividend Double-Flipping
**File:** `src/hooks/use-dividends.ts:47-64`

`normalizeBalances()` is called but then the raw `accountBalances` array is iterated with `* -1` — double-flipping equity accounts. Aktiekapital and reservfond amounts are wrong. Affects ABL 17:3 solvency check and K10 calculation.

### Cash Balance Classification
**File:** `src/services/company-statistics-service.ts:174`

`accNum.startsWith('19')` treats ALL 19xx as cash. 1960-1999 (receivables, other current assets) are not cash. Restrict to 1910-1959 (bank accounts) and 1900-1909 (kassa). Inflates dashboard cash figure.

### VAT Split — Missing Type Validation
**File:** `src/lib/bookkeeping/entries/simple.ts`

`vatRate` is assumed to be an integer (25, 12, 6) but nothing validates this. If a caller passes 0.25 instead of 25, the split calculation silently produces wrong amounts. Add validation rejecting values < 1.

### SKV Tax Table Fallback
**File:** `src/lib/ai-tools/loner/payroll.ts:165`

If `taxService.lookupTaxDeduction()` returns null, falls back to `rates.marginalTaxRateApprox` (32%). Should surface an error instead of silently using approximate rate. Also: `emp.taxTable || 33` defaults to table 33 if missing.

### Supabase `as any` Casts (50+)
Run `supabase gen types typescript` to regenerate types. Affected: `benefit-service.ts`, `invoice-service.ts`, `pending-booking-service.ts`, and others.

### Error States Missing in Some Hooks
`use-company-statistics.ts` and `use-financial-metrics.ts` don't return explicit `error` field. Silently return defaults on failure.

### Account Classification Duplication
`use-company-statistics.ts` re-implements account prefix logic inline instead of importing `getAccountClass()` from `src/lib/bookkeeping/utils.ts`.

### Period Lock Not Centralized
Lock check in `use-verifications.ts` queries `financialperiods` inline. Should be a shared `periodService.isLocked()` function.

---

## Onboarding & Payments

### Stripe Payments
- `STRIPE_WEBHOOK_SECRET` is empty — webhooks fail silently
- Create `user_credits` table for token tracking
- Replace hardcoded billing history with `stripe.invoices.list()`
- Replace hosted checkout with Stripe Embedded Checkout

---

## Features (Product Work)

### AI Status Reconciliation
Scooby proactively scans app data for stale or inconsistent states when asked "är allt uppdaterat?" or similar. Examples:
- Invoices still marked "skickad" weeks after due date — prompt user "har den här betalats?"
- Transactions without bookkeeping entries
- Receipts not matched to transactions
- Payslips in draft that should have been sent
Requires new AI tool `reconcile_status` that queries across tables and returns a list of items needing attention. User or AI then updates status accordingly.

### AI Memory — Remaining Work
Post-conversation extraction job is implemented. Still missing:
- Per-company memory UI/dashboard (DB supports it)
- Memory compaction (v2 design says not needed yet)
- Pattern detection (temporal/trend analysis)

### Planning System — "Min Plan"
AI-generated task lists. Subtab in Händelser. Plans stored in DB.

### Receipt Smart Matching
- Receipt-transaction matching (date + amount similarity)
- Hash-based duplicate detection
- Receipt image reference on verification

### Bank Integration (Tink)
Low priority. Manual/CSV at launch.

---

## Postponed

### Email Infrastructure (Resend)
Infrastructure stub exists in `src/lib/email.ts`. Postponed until core features are solid.

### Guided App Tour
Post-onboarding interactive walkthrough. Postponed until core features are solid.

---

## QA

Full feature-by-feature QA pass needed across all modules and all company types (AB, EF, HB, KB, Förening).

---

## Implemented (2026-02-27)

- **Onboarding: Company data persistence** — auto-saves via CompanyProvider
- **Onboarding: Profile & preferences** — avatar upload + emoji persistence + theme to DB
- **Onboarding: Image upload component** — UploadDropzone + 3 Supabase buckets
- **Månadsavslut: AI conversations + roadmap progress** — two new sections in monthly review
- **AI Memory: Post-conversation extraction** — analyzes conversation, extracts memories to `user_memory`
- **Invoice: OCR reference numbers (Luhn)** — auto-generated, shown in preview + PDF
- **Invoice: F-skatt as company setting** — `hasFskatt` boolean, conditional on PDF
- **Invoice: Credit note generation** — API endpoint + UI action + bookkeeping entry
- **Företagsstatistik page removed** — stats handled by AI tools via walkthrough

*Verified against codebase 2026-02-27.*
