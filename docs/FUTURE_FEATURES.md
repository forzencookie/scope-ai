# Future Features & Remaining Work

Consolidated from all previous planning docs. Verified against codebase 2026-02-27 — only items confirmed as NOT yet implemented are listed.

> **Rule:** After fixing any item in this document, immediately update it here — either move it to the "Implemented" section with a date, or strike it from its current section. This file must always reflect the true state of the codebase.

---

## Bugs & Code Fixes (Verified still open)

### Supabase `as any` Casts (9 remaining, down from 44)
Regenerated `database.ts` and removed 35 casts. Remaining 9 are structural:
- `pending-booking-service.ts` (1) — column names don't match generated types, needs migration to align
- `investments-processor.ts` (5) — dynamic table names + `shareholdings` table doesn't exist in cloud DB
- `benefit-service.ts` (1) — `employee_benefits` table doesn't exist in cloud DB
- `shareholder-service.ts` (1) — join query return type
- `roadmap-service.ts` (1) — type mapping cast

---

## Onboarding & Payments

### Stripe Payments
- `STRIPE_WEBHOOK_SECRET` is empty — deployment config task (not code)

---

## Features (Product Work)

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

## Page-by-Page Audit (2026-02-28)

### Bokföring → Transaktioner

#### Critical Bugs (broken functionality)

1. **No POST handler on `/api/transactions`** — `NewTransactionDialog` posts here to create manual transactions → always returns HTTP 405. Manual transaction creation is completely broken.

2. **AI tools get empty arrays** — All AI tools fetch from `/api/transactions` expecting `data.transactions` but the route returns `{ data: [...] }`. Every AI tool read for transactions returns nothing.

3. **API query params ignored** — `GET /api/transactions` ignores `limit`, `startDate`, `status`, `missingReceipt` params. AI tool filtering is non-functional; always returns 200 items.

4. **Wrong currency locale in service layer** — `mapDbToTransaction` in `services/transactions.ts` formats amounts with `$` (en-US) instead of `kr` (sv-SE). The API route has its own formatter that correctly uses Swedish locale — two conflicting formatters for the same data.

5. **Z-rapport OCR sends no image** — Import route sends only a text prompt to GPT-4o-mini (no `image_url` in messages). OCR cannot work without the image.

6. **Event mismatch** — `NewTransactionDialog` dispatches `transactions-updated` but nothing listens for it. `accounting-page.tsx` only listens for `page-refresh`. Even if POST worked, the list wouldn't refresh.

#### Architecture Issues

7. **Two parallel data paths** — Hooks use `services/transactions.ts` (direct Supabase client); API routes use `user-scoped-db.ts` → repositories. Different formatting logic, different locale/currency, inconsistent results depending on which path is used.

8. **Clicking a row doesn't open booking dialog** — `handleTransactionClick` only toggles selection. BookingDialog can only open via the bulk action toolbar, even for a single transaction. Bad UX.

9. **AI approval hooks unused** — `useTransactionAI` exports `approveAISuggestion`/`rejectAISuggestion`/`bulkApprove` but no UI component consumes them. The AI columns in DB (`ai_account`, `ai_category`, etc.) are never written either.

10. **Period lock bypass** — `useTransactions` hook checks period lock before booking, but the paginated view books via direct `fetch()` to `/api/transactions/[id]/book`, completely bypassing the lock check.

11. **Dead endpoint** — `/api/transactions/processed` exists but no component or hook calls it. Orphaned code.

12. **Duplicate selection state** — `useTransactionSelection` (hook) and `useBulkSelection` (used in `use-transactions-logic.ts`) are two separate selection systems for the same data.

#### Code Quality

13. **Duplicate icon/color mapping** — `services/transactions.ts` and `transaction-processor.ts` both define icon/color mapping with inconsistent icon sets.

14. **N+1 bulk approval** — `bulkApproveAISuggestions` loops individual requests instead of batching.

15. **Unused imports/props** — `useCachedQuery` imported but unused in `accounting-page.tsx`; `subtitle` prop defined on `TransactionsTableProps` but never rendered; `TransactionsEmptyStateProps` type defined but empty state is inlined.

16. **Repository `update()` fakes the result** — Doesn't call `.select()` after update, reconstructs payload as if it were the DB response.

17. **String-based amount filter** — Repository `list()` filters `minAmount` on the string `amount` column instead of numeric `amount_value`. String comparison, not numeric.

18. **Column header mislabel** — Grid shows "Leverantör" (supplier) as header for what is actually the transaction description/name. Not all transactions are from suppliers.

19. **AI suggestion stubs** — `categorize_transaction` and `match_payment_to_invoice` AI tools return hardcoded `{ success: true }` / `{ amount: 0 }` without doing anything.

20. **Fragile AI suggestion parser** — `lib/ai-suggestion.ts` uses regex to parse streamed markdown. Any formatting change breaks it silently (returns `null`).

#### UX Redesign: NewTransactionDialog (founder direction)

The current dialog asks for 9 fields (beskrivning, motpart, org-nr, belopp, datum, momssats, varav moms, konto, verifikationsunderlag) — way too much. A Swedish bank transaction only captures **namn, belopp, datum**. Everything else (moms, konto, org-nr, underlag) belongs to the *bokföring* step, not the transaction itself.

**Current problems:**
- Tab toggle (Manuell/Filuppladdning) inside the dialog is poor UX — should be two separate entry points (buttons) before any dialog opens
- Manual mode has 9 fields when only 3 are relevant to the transaction
- No preview step — submits directly with no confirmation
- Booking dialog doesn't auto-open after creating a transaction
- VAT calculation, account selection, and document ref are bokföring concerns that belong in the BookingDialog, not here

**Intended flow (founder spec):**
1. User clicks either "Manuell" button or "Ladda upp fil" button (two distinct actions, not tabs)
2. **Manual path:** Simple form with only namn + belopp + datum → preview card showing how it will look in the table → confirm → transaction appears in table → BookingDialog auto-opens for that transaction
3. **File upload path:** Separate clean upload flow (drag & drop or file picker)
4. All bokföring-specific fields (moms, konto, motpart org-nr, verifikationsunderlag) move to the BookingDialog where they belong

**Files to change:**
- `src/components/bokforing/dialogs/ny-transaktion.tsx` — strip down to 3 fields + preview step
- `src/components/bokforing/transaktioner/index.tsx` — replace single "add" button with two entry points
- `src/components/bokforing/transaktioner/use-transactions-logic.ts` — add auto-open booking after transaction creation
- Booking dialog should receive the moved fields (moms, konto, etc.) if not already there

---

### Bokföring → Verifikationer

#### Critical Bugs

1. **Page shows transactions, not verifications** — `useVerificationsLogic()` derives its data from `useTransactions()` filtered by status, NOT from the `verifications` table. Real verifications created via AI, chat, or manual entry are stored correctly in the DB but never appear in the grid. The entire page is displaying the wrong data source.

2. **BFL number never shown** — The backend correctly implements gap-free sequential numbering (A1, A2...) with atomic RPC + unique constraint + retry logic, but the grid renders `v.id` (a UUID) in the "Nr" column. The component `Verification` type doesn't even have `series` or `number` fields.

3. **Three incompatible `Verification` types** — Hook type (flat `rows[]`, no series), component type (single-account, derived from transaction), service type (correct double-entry with `entries[]`, `series`, `number`). No shared canonical type.

4. **Legacy POST bypasses BFL compliance** — `/api/verifications` POST has two paths: if `entries`/`rows` exist it uses the proper `verificationService`; otherwise falls through to a bare `userDb.verifications.create()` with no series number, no atomic numbering, no audit trail.

5. **Three hollow AI tools** — `periodize_expense`, `reverse_verification`, and `create_accrual` all show confirmation UIs but execute no write operations. `reverse_verification` has a `mockAmount = 5000` hardcoded.

#### Architecture Issues

6. **`useVerifications()` hook exists but page ignores it** — There's a perfectly good hook that fetches real verifications from `/api/verifications`, but `useVerificationsLogic()` doesn't use it at all. It rebuilds "verifications" from the transactions list instead.

7. **N+1 on GET /api/verifications** — For 200 verifications, makes 200+1 individual DB queries to fetch verification_lines. Should be a single JOIN.

8. **Details dialog can't show double-entry** — `VerifikationDetailsDialog` uses the component `Verification` type (single account, single amount) so it can never show the full debit/credit journal of a real verification.

9. **Mixed naming conventions** — `/api/verifications` (English) vs `/api/verifikationer/auto` (Swedish). Confusing but not broken.

10. **AI preview does full page reload** — `verification-preview.tsx` navigates with `window.location.href` instead of Next.js router on success.

11. **DB function stability** — `get_next_verification_number()` is declared `STABLE` but reads live data and should be `VOLATILE`.

#### Dead Code

12. **`VerifikationDialog`** (`src/components/bokforing/dialogs/verifikation.tsx`) — Old transaction-matching dialog, exported but never imported anywhere. Safe to delete.

13. **`AccountGroupView`** component — Ledger grouped-by-account view, defined but never rendered. Dead code.

14. **`createDialogOpen`** state — Destructured from `useVerificationsLogic()` but unused in `VerifikationerTable` JSX.

#### Code Quality

15. **Feature gate is a no-op** — `verifikationer` feature key is enabled for ALL company types, so the `useFeature('verifikationer')` check always passes.

16. **Download/Approve handlers are toast stubs** — `VerifikationDetailsDialog` onDownload and onApprove only show toasts, no real logic.

17. **Series hardcoded to 'A'** — AI chat tool `createVerificationTool` only creates A-series. B/L series are impossible via chat.

18. **Deprecated repository still callable** — `VerificationsRepository.create()` is marked deprecated but nothing prevents callers from using it via `userDb.verifications.create()`.

#### UX Change: Remove Manual Tab (founder direction)

The `AutoVerifikationDialog` currently has two tabs: **Automatisk** (AI proposals) and **Manuell** (full double-entry form with OCR). The manual tab should be removed entirely. Verification creation should only happen through:
- AI auto-booking (the Automatisk tab, which becomes the only tab — no tab UI needed)
- Chat AI tool (`createVerificationTool`)

**Files to change:**
- `src/components/bokforing/verifikationer/auto-dialog/index.tsx` — remove tab switcher, render only AutoTab content
- `src/components/bokforing/verifikationer/auto-dialog/ManualTab.tsx` — delete file
- Any related state/logic for the manual tab in `use-auto-verifikation.ts`

---

### Bokföring → Fakturor

#### Critical Bugs

1. **Supplier invoice actions broken (405)** — `handleApproveSupplier` and `handleMarkSupplierPaid` send `PUT` to `/api/supplier-invoices/[id]/status`, but the route only exports `POST`. Approve and pay for supplier invoices silently fail.

2. **RLS bypass in paginated hook** — `useInvoicesPaginated` and `invoiceService` use `getSupabaseClient()` (anonymous client), not the user-scoped RLS client. Data isolation is not enforced on reads — any user could theoretically see all invoices.

3. **Multi-VAT booking broken** — `POST /api/invoices/[id]/book` casts `invoice.items` as `InvoiceLineItem[]` but it's stored as `{ lines: [], bankgiro, plusgiro, notes }`. `Array.isArray()` returns false, silently falling to single-VAT path. Multi-rate invoices lose their VAT breakdown on booking.

4. **Invoice number preview is wrong** — Dialog generates `F-0001` locally, server overwrites with `FAK-2026-0001`. Preview always shows wrong number. OCR reference is also computed from the wrong number.

5. **Credit note creates no bookkeeping record** — Journal entry is computed by `createCreditNoteEntry` but only stored in JSONB `items` field, never posted to pending bookings or verifications.

6. **Payment doesn't update invoice status** — `POST /api/invoices/[id]/pay` creates a pending booking but never calls `updateCustomerInvoiceStatus` to mark the invoice as paid. Invoice stays in its previous status.

#### Architecture Issues

7. **Stats are page-scoped, not total** — `InvoicesStats` sums only the current paginated batch. The `invoice-service.ts` has a `getStats()` RPC method but it's never called from the UI, and it's half-broken anyway (`incomingTotal` and `overdueAmount` always return 0).

8. **Five type definitions for Invoice** — `src/types/index.ts`, `src/types/ownership.ts`, `src/services/invoice-service.ts`, `src/components/bokforing/fakturor/types.ts`, and AI tools all define their own shapes. Three different `InvoiceStats` shapes. Two `SupplierInvoice` types with different status unions (4 vs 6 values).

9. **Status casing inconsistency** — Customer statuses are PascalCase (`"Utkast"`, `"Skickad"`, `"Betald"`), supplier statuses are lowercase (`"mottagen"`, `"attesterad"`). Kanban column constants hardcode lowercase strings instead of using the `INVOICE_STATUS_LABELS` constant, and the casing doesn't match (`"Mottagen"` vs `"mottagen"`), causing card mismatches.

10. **Repository layer bypassed** — `user-scoped-db.ts` reimplements invoice DB queries inline instead of using `repositories/invoices.ts`. The repository `create` accepts `Record<string, any>` — untyped.

11. **GET /api/invoices ignores all query params** — No status filter, no pagination params. AI tool `get_overdue_invoices` sends `?status=overdue` but it's silently dropped.

12. **upload-invoice route is broken** — GPT Vision extracts invoice data but the result object fields are all commented out. Creates an empty inbox item, extracted text is discarded.

#### Dead Code / Stubs

13. **"Radera" and "Visa detaljer" menu items** on InvoiceCard have no onClick handlers — non-functional UI.

14. **`send_invoice_reminder` AI tool** — Shows confirmation UI but `sent: false` is hardcoded, no email sent.

15. **`void_invoice` AI tool** — Shows confirmation UI but `voided: false` is hardcoded, no makulering happens.

16. **`invoice-service.ts:getStats()`** — Partially implemented (two fields always 0), never called from UI.

17. **`paid_at`, `reminder_count`, `paid_amount` DB columns** — Schema exists but no code writes to them.

18. **`/api/invoices/processed` and `/api/supplier-invoices/processed` GET endpoints** — Appear unused by UI.

19. **`InvoicesTable` export alias** in `index.tsx` — exported but never imported anywhere.

20. **Legacy `invoices` table** from early migration still exists alongside `customerinvoices`.

#### Code Quality

21. **Duplicate field names in SupplierInvoiceInput** — Both `supplier`/`supplierName` and `ocr`/`ocrNumber` pairs exist for the same data.

22. **Supplier invoice ID format** — Manually generated `SI-{timestamp}-{random}` string while customer invoices use UUID. Inconsistent.

23. **PDF generation fails for AI-created invoices** — `items` array is empty when invoice was created via AI tool (no items sent). Also, when loaded from GET, `items` is the raw JSONB object `{ lines: [...] }` not a flat array, so PDF renders no line items.

24. **`mapRowToSupplierInvoice` conflates OCR and invoice number** — Falls back to `row.ocr || row.id` for `invoiceNumber`. OCR is a payment reference, not a document identifier.

25. **"Skapa & skicka" and "Spara utkast" do the same thing** — Both call the same `handleSubmit`, both save as draft. No email sending exists.

---

### Bokföring → Kvitton

#### Critical Bugs (broken functionality)

1. **Booking route doesn't exist** — `use-receipts-logic.ts` calls `POST /api/receipts/${id}/book` but this route was never created. All receipt booking attempts return 404.

2. **Search is broken** — `receipt-service.ts` queries `merchant` and `description` columns but the DB has `supplier` and no `description` column. Search never matches anything.

3. **Attachments always empty** — Service reads `row.url` but the DB column is `image_url`. `hasAttachment` is always `false`, attachment icons never show.

4. **File URLs are broken** — `uploadReceiptFile()` returns `getPublicUrl()` on a private Supabase Storage bucket. Public URLs don't work on private buckets. Uploaded files are inaccessible. Should use `getReceiptSignedUrl()` which exists but is never called.

5. **Save loses the file URL** — `handleSaveReceipt` sends `attachment` key but the API route reads `imageUrl`. The uploaded file URL is dropped during save.

6. **Transaction linking silently fails** — `linkToTransaction()` writes to `linked_transaction_id` but this column doesn't exist in the DB schema.

7. **Delete is fake** — `handleConfirmDelete` shows a success toast but never calls any delete API. Nothing is deleted.

8. **AI tools are hollow** — `create_receipt` and `match_receipt_to_transaction` show confirmation UI but never persist anything.

#### Architecture Issues

9. **Four separate Receipt type definitions** — `src/types/index.ts`, `receipt-service.ts`, AI tools, and `ReceiptCard.tsx` all define different shapes. `ReceiptCard` uses `vendor` instead of `supplier` and `amount: number` instead of `string`.

10. **Status language mismatch** — TypeScript constants use Swedish (`"Väntar"`, `"Verifierad"`), DB stores English (`'pending'`, `'processed'`), RPC filters on English. Stats are always miscounted because the queries never match what's actually stored.

11. **Duplicate DB columns** — Both `supplier` and `vendor` columns exist in the `receipts` table for the same concept.

12. **Two data access patterns** — Components use `receiptService` (anonymous Supabase client, no RLS), API routes use `createUserScopedDb()` (server-side RLS). Should be consolidated.

13. **`totalAmount` hardcoded to 0** — The "Totalt belopp" stat card always shows 0 kr. The RPC doesn't return a sum and the service hardcodes `0`.

#### UX Issues

14. **Manual entry requires file upload first** — The manual tab only shows form fields after a file is selected. Users can't enter a receipt without uploading a document, which blocks manual-only workflows.

15. **Edit mode never used** — `UnderlagDialog` supports `mode="edit"` but the parent only opens it in "create" or "view" mode.

16. **Save always forces "Verifierad" status** — Both manual and AI save paths override status to `VERIFIED` regardless of user intent.

17. **Errors swallowed** — `_fetchError` from the hook is intentionally ignored. Users never see fetch failures.

#### Dead Code

18. **`updateReceiptStatus()`** in service — defined but never called.

19. **`deleteReceiptFile()`** in upload service — defined but never called. Deleting a receipt leaves orphaned files in storage.

20. **`GET /api/receipts/processed`** — exists but no component calls it (components use the service directly).

21. **`DbReceipt` type commented out** — `src/types/index.ts` comments it out with "Table missing in DB" but the table exists.

#### Features to Remove (founder direction)

- **Receipt-transaction matching** — unnecessary feature. Remove `match_receipt_to_transaction` AI tool, `linkToTransaction()` service method, and any matching UI/logic.
- **Manual entry tab** — receipts should only come in via file upload + AI OCR. Remove the manual tab from `UnderlagDialog` entirely. The dialog becomes upload-only: drop a file → AI extracts data → user reviews/corrects → save.

**Files to change:**
- `src/components/bokforing/dialogs/underlag.tsx` — remove manual tab, make upload+AI the only flow
- `src/services/receipt-service.ts` — remove `linkToTransaction()`
- `src/lib/ai-tools/bokforing/receipts.ts` — remove `match_receipt_to_transaction` tool
- `src/components/bokforing/kvitton/use-receipts-logic.ts` — remove any matching-related logic

#### Future Consideration: Verification Bundles (founder insight)

Receipt-transaction matching at the receipt level is unnecessary for daily bookkeeping. The AI only needs receipt data (supplier, amount, date, VAT) to create a verification. However, for government audits (Skatteverket), the full chain matters: verification + receipt + transaction.

The pending booking system already links verifications to their source via `source_type` + `source_id`. The simpler solution is to enhance the **verification detail view** — when you click a verification, the primary content is the verification itself (series number, date, description, full debit/credit journal entries). Below that, a "Linked items" section shows any connected documents (receipt, transaction, invoice) following existing `source_type`/`source_id` foreign keys. The bundle is supplementary info, not the main content. Could be built into `VerifikationDetailsDialog` once it's wired to real verification data.

---

### Bokföring → Inventarier (moved down for reading order)

See Inventarier section below.

---

## Löner Category

### Löner → Lönekörning (all company types)

#### Critical Bugs

1. **Delete is client-side only** — `handleDelete` removes payslips from local state but never calls a DELETE API. Refreshing the page brings them back. No `DELETE /api/payroll/payslips` endpoint exists.

2. **Stats wrong for senior employees** — `payslips-stats.tsx` computes employer contributions as `totalGross × taxRates.employerContributionRate`, ignoring `employerContributionRateSenior`. If any employee is 66+, the stats card shows incorrect total.

3. **Manual employee save is not transactional** — If "Spara som anställd" is checked, `handleConfirmPayslip` POSTs to `/api/employees` first, then creates payslip. If payslip creation fails after employee save, an orphan employee record is left in DB with no rollback.

#### Architecture Issues

4. **Raw fetch instead of React Query** — `usePayslipsLogic` uses `fetch('/api/payroll/payslips')` and `fetch('/api/employees')` while the rest of the app uses React Query hooks. No caching, no automatic invalidation, no stale-time management. Should use a `usePayslips()` hook wrapping React Query like every other data source.

5. **Three verification paths for salary** — (a) Client-side `handleConfirmPayslip` calls `addVerification()` directly, (b) API route has pending booking path via `createSalaryEntry()` + `pendingBookingService` but is bypassed by `skip_verification: true`, (c) AI tool `run_payroll` correctly uses pending bookings. Three different creation paths for the same operation — should be one canonical path.

6. **Client bypasses pending booking system** — `handleConfirmPayslip` passes `skip_verification: true` to the API, then creates the verification directly from the client via `addVerification()`. This skips the review wizard that every other write operation in the app uses. Salary bookings should go through pending bookings like everything else.

7. **Local `Payslip` type diverges from service** — `use-payslips-logic.ts` defines its own `Payslip` type (7 fields) instead of importing from `payroll-service.ts` (which has a richer type with employer contributions, pension, etc.). Two incompatible types for the same entity.

#### Hollow Features / Stubs

8. **AI chat adjustments are faked** — `StepAdjustments` component simulates AI with `setTimeout` + regex keyword matching ("sjuk" → sick leave, "övertid" → overtime, "bonus" → bonus adjustment). Not connected to the real AI agent or ScopeBrain. Pattern-matching only, no actual intelligence.

9. **Bulk "Send" is a stub** — `BulkActionToolbar` "Skicka lönebesked" shows a toast but no email is sent. No email integration exists.

10. **Bulk "Download PDF" is a stub** — Shows toast, no PDF generation for bulk payslips. Single payslip PDF works (via `downloadElementAsPDF`) but bulk does not.

#### Code Quality

11. **Mapper uses `any`** — Payslip mapping from API response uses `(p: any)` cast with eslint-disable. The API response shape is known and should be typed.

12. **Employee count fetched twice** — Both on mount and again in `handlePayslipCreated`. The second call is intentional (new employee may have been saved), but the mount call duplicates what `payslips-stats` could derive from payslip data.

13. **Errors swallowed** — Employee count fetch failures are silently ignored (`catch { /* ignore */ }`). User never sees fetch errors.

14. **`showAIDialog` state unused** — Returned from `usePayslipsLogic()` hook but needs verification that it's actually consumed by the parent component. Potentially dead state.

15. **PayslipDetailsDialog vacation pay hardcoded** — Shows "Semesterersättning (12%)" with hardcoded percentage. Should read `taxRates.vacationPayRate` from `useAllTaxRates()` for consistency, even though 12% is currently correct.

16. **Period field is free text** — No validation that the period follows YYYY-MM format. Could store arbitrary strings like "mars" or invalid dates.

#### Missing Features

17. **No payslip edit in draft** — Can create and view but never edit a draft payslip. No PUT endpoint exists at `/api/payroll/payslips/[id]`. Payslips should be editable while in `draft` status. Once marked `paid`, they lock (BFL compliance — verification is created and immutable). Corrections after payment = just create a new payslip with the difference amount, no special correction feature needed.

18. **No payslip status workflow** — Payslips have `status` (draft/review/paid) but no UI or API to transition between states. Intended flow: create as `draft` → editable in detail dialog → user or AI switches to `paid` → confirmation warning that verification will be created and payslip becomes locked → verification created → immutable. Status filter exists in the UI but all payslips are created with whatever status the create dialog sets, and no transition logic exists.

### Löner → Förmåner (all company types)

#### Critical Bugs

7. **Assigned benefits never loaded from DB** — `use-benefits-logic.ts` initializes `assignedBenefits` as `[]` and only adds to it via `handleAssign` (local state prepend). There is no fetch of existing assignments on mount. All stats (totalCost, employeesWithBenefits, coverage %) are always 0 on page load. Progress bars always empty. The data is write-only — once you refresh, everything disappears.

8. **`employee_benefits` table schema mismatch** — `lib/formaner.ts::assignBenefit()` writes columns `employee_name, benefit_type, amount, year, month, formansvarde, notes` but the actual DB table `employeebenefits` (renamed from `employee_benefits`) has columns `employee_id (UUID FK), benefit_id (text), company_id, user_id` — completely different schema. Writes will fail or write to a phantom table.

9. **`assign_benefit` AI tool never executes** — The tool's `execute()` function builds an `AIConfirmationRequest` and returns immediately. The import of `assignBenefit` from `lib/formaner` is commented out (`// assignBenefit,`). Even after user confirms, no DB write happens.

10. **Delete button is a no-op** — `EmployeeList` renders a `Trash2` delete button per assignment, but `BenefitDetailsDialog` never passes the `onDelete` prop. Clicking calls `undefined?.()` — silently does nothing.

11. **`get_benefit_stats` RPC returns hardcoded zeros** — The migration explicitly hardcodes `{"totalBenefits":0,"totalValue":0,"employeesWithBenefits":0}` with comment "benefits table structure is unknown". `benefit-service.ts` calls this but gets nothing useful.

#### Architecture Issues

12. **Two parallel, disconnected services** — `benefit-service.ts` (old, UUID-based, queries `benefits` + `employeebenefits` tables) and `lib/formaner.ts` (new, text-name-based, queries `formaner_catalog` + `employee_benefits`). The UI uses `lib/formaner.ts`; the service is exported from `services/index.ts` but never imported by any UI component. They have incompatible `EmployeeBenefit` types.

13. **Three DB tables for "benefits"** — (a) `benefits` — custom per-company catalog (old), (b) `employeebenefits` — old assignment table (UUID FKs, no amount/year), (c) `formaner_catalog` — shared Swedish reference catalog (new, correct). The code tries to write a fourth schema to `employee_benefits` that doesn't match any existing table.

14. **No API routes for benefits** — No `/api/benefits`, `/api/employee-benefits`, or `/api/formaner` routes exist. All DB access goes through direct Supabase client calls in `lib/formaner.ts`, bypassing the API layer pattern used everywhere else.

15. **Employee name is free-text** — All benefit assignment forms use a plain text `<Input>` for employee name instead of a dropdown/autocomplete from the actual employee list. Names are stored as strings, not linked by `employee_id`. No FK integrity.

#### Hardcoded Values

16. **Company type hardcoded to 'AB'** — `listAvailableBenefits('AB')` is hardcoded. EF/HB/KB users see AB-specific benefits. Should read from CompanyProvider.

17. **Demo employee name** — `suggestUnusedBenefits('Demo Anställd', ...)` uses a hardcoded string instead of iterating real employees.

18. **Vehicle förmånsvärde simplified** — `VehicleForm` calculates `nybilspris × 0.09 / 12 × (el? 0.6 : 1)` — a rough approximation. Real Skatteverket calculation uses price brackets and a base amount (prisbasbelopp) lookup table.

19. **Meal rates hardcoded** — `constants.ts` has `lunch=130 kr/dag, kost=260 kr/dag` (2024 rates). Should come from `system_parameters` table for annual updates.

20. **Milersättning hardcoded** — `VehicleForm` uses `25 kr/mil` hardcoded. Should read from `taxRates.mileageRate` like the Team tab does.

21. **AI tool category enum wrong** — `get_available_benefits` declares `enum: ['tax_free', 'taxable', 'deduction']` but actual categories are `'tax_free' | 'taxable' | 'salary_sacrifice'`. Filtering by `'deduction'` matches nothing.

#### Hollow Features / Stubs

22. **"Registrera förmån" button** — The header button calls `document.getElementById('benefits-search')?.focus()` — just focuses the search bar. Not a real registration flow.

23. **Suggestions fetched but not rendered** — `use-benefits-logic.ts` calls `suggestUnusedBenefits()` and stores in `suggestions` state, but the parent `BenefitsTab` component never reads or displays this data.

24. **`getRemainingAllowance()` implemented but unused** — `lib/formaner.ts` has a well-designed two-tier limit lookup (DB `system_parameters` → static catalog fallback), but no UI component calls it. The `EmployeeList` progress bar computes remaining balance from local state instead.

#### Accounting Gaps

25. **No verification created on benefit assignment** — When the company pays for a benefit (e.g. friskvård gym membership), the cost should be booked (e.g. debit 7690 Personalvård / credit 1930 Bank). Currently assigning a benefit only writes to `employee_benefits` — no bookkeeping entry is created for the actual company cost. The `formaner_catalog` has a `bas_account` field per benefit but it's never used for verification creation.

26. **No tax-free limit enforcement** — Friskvård has a 5000 kr/år tax-free limit. If you assign 6000 kr, the excess 1000 kr becomes a taxable benefit (skattepliktig förmån) that must appear on the payslip and increase employer contributions. Currently there's no guard — `getRemainingAllowance()` exists but is never called. Same risk for julgåva (550 kr), jubileumsgåva (1650 kr), minnesgåva (15000 kr).

27. **Vehicle förmånsvärde too simplified for audit** — The formula `nybilspris × 0.09 / 12 × (el? 0.6 : 1)` is a rough approximation. Skatteverket uses price brackets with prisbasbelopp thresholds. Acceptable for MVP but would produce incorrect amounts on AGI declaration for expensive or cheap cars.

#### What Actually Works

- Benefit catalog display (from `formaner_catalog` table with static fallback) — works
- Search and filter across sections — works
- Collapsible sections (Skattefria / Skattepliktiga / Löneväxling) — works
- Specialized forms per benefit type (7 form variants) — render correctly
- `system_parameters` benefit limit seeding (2025/2026 values) — exists and is well-designed
- `run_payroll` AI tool correctly sums taxable `formansvarde` into employer contribution basis — works
- Payroll integration is the most important accounting piece and it's correctly wired: förmånsvärde → added to taxable income → employer contributions calculated on full basis

### Löner → Team & Rapportering (all company types)

#### Critical Bugs

11. **AddEmployeeDialog missing critical fields** — Only collects name, roll, email, salary, kommun. Missing `personal_number` (required for AGI/Skatteverket), `tax_table` + `tax_column` (required for payroll — `run_payroll` AI tool hard-fails if null), `employment_type`, `start_date`. The API route (`POST /api/employees`) supports all these fields but the UI form bypasses it and inserts directly to Supabase.

12. **AddEmployeeDialog bypasses API route** — `useEmployees().addEmployee()` does a direct Supabase `.insert()` instead of using `POST /api/employees`. The API route has richer logic (auto-sets `tax_rate` from `marginalTaxRateApprox`, supports all fields). The AI tool `register_employee` correctly uses the API route. Employees added via UI will have null `tax_table` and `tax_rate`.

13. **`get_employee_balances` RPC missing fields** — The RPC returns `id, name, role, email, salary, status, balance, mileage` but NOT `kommun, tax_rate, personal_number, tax_table`. The `Employee` type declares these fields but they're always `undefined`. Dossier dialog conditional rendering `{employee.tax_rate != null && ...}` never triggers even when the employee has a tax rate in the DB.

14. **Mileage rate silently falls back to 0** — `taxRates?.mileageRate ?? 0` means if DB returns no rates, mileage is booked as 0 kr with no user warning. Creates a silent zero-amount verification.

#### Architecture Issues

15. **Dual balance computation** — `useEmployees()` returns `balance` and `mileage` from the `get_employee_balances` RPC. But `useTeamLogic` ignores those values and recomputes them client-side by scanning ALL verifications with `v.description.includes(emp.name)`. RPC data is fetched, paid for, and discarded. String-matching is fragile — substrings like "Erik" and "Erik Eriksson" will collide.

16. **Expense account hardcoded to 4000** — All employee expense reports debit account 4000 (Inköp av varor). Employee reimbursements (meals, travel, office supplies) should hit 6xxx–7xxx accounts (e.g. 6210 kontorsmaterial, 7690 diverse personalkostnader). Skews income statement under "varuinköp" instead of "övriga kostnader".

17. **Payslip fetch for dossier loads ALL payslips** — `fetch('/api/payroll/payslips')` has no filtering params. Fetches every payslip for the company, then filters client-side by `employee_id`. Expensive for companies with many employees and months of history.

18. **Benefits lookup uses name string, not ID** — `getEmployeeBenefits(emp.name, year)` matches by employee name text, not `employee_id` FK. Name mismatches (case, spaces) or duplicate names will cause misattribution.

#### Hollow Features / Stubs

19. **Time reporting is a complete stub** — Shows toast "Tid har registrerats (Bokförs vid lönekörning)" but persists nothing. `hours` and `desc` are captured in state but never saved. No time-tracking data model, no DB table, no API endpoint.

20. **MoreHorizontal button on EmployeeCard is dead** — Three-dot menu icon is rendered but has no `onClick` handler. Click bubbles to card-level `onViewDossier`.

21. **No employee edit or delete** — `useEmployees()` hook has no update or delete mutations. No way to edit employee details or deactivate an employee from the UI. Dossier dialog has no edit capability — just a "Stäng" button.

#### UX Redesign: Employee Overlay (founder direction)

The current page shows too much on the cards and uses a cramped popup dialog for details. Intended design:

**Cards:** Inbox-style, just the employee name. Maybe a small active/inactive status indicator. Nothing else. Clicking opens the employee overlay.

**Overlay** (momsdeklaration-style — slides in from the right, full height):

- **Header:** Name, roll, anställningsform, personnummer (masked `XXXXXX-1234`), kommun + skattetabell, status badge
- **Activity feed:** One unified chronological list of everything related to this employee — salary payslips, assigned benefits, expense reports, mileage reports. No tabs, just scroll.
- **Running totals:** Total brutto YTD, total employer cost YTD, utläggskuld at the bottom.
- **"Rapportera" button** inside the overlay — you're already looking at the employee, so expense/mileage entry belongs here.

**"Ny anställd" flow:** Must use the API route with all required fields (personnummer, skattetabell, kommun, anställningsform, startdatum). Current form only collects 5 fields and bypasses the API — employees added this way can't run through payroll.

**Remove time reporting entirely.** No data model exists, most Swedish small companies don't track hours unless billing by the hour. Just remove the Tid tab from ReportDialog.

**Files to change:**
- `src/components/loner/team/employee-card.tsx` — simplify to name-only card
- `src/components/loner/team/dialogs.tsx` — replace `EmployeeDossierDialog` with full overlay component (like momsdeklaration), remove Tid tab from ReportDialog, move reporting into the overlay
- `src/components/loner/team/use-team-logic.ts` — remove client-side balance recomputation (use RPC values), add unified activity feed query, remove time reporting logic
- `src/hooks/use-employees.ts` — update RPC or query to include `kommun, tax_rate, personal_number, tax_table`
- `src/components/loner/team/dialogs.tsx` → `AddEmployeeDialog` — add all required fields, route through `POST /api/employees` instead of direct Supabase insert

#### Code Quality

22. **Shared `desc` state across report tabs** — All three report types (Tid/Utlägg/Resor) share one `desc` state variable. Switching tabs does not clear it. User can accidentally submit a mileage report with a time-report description.

23. **No date picker for reports** — All reports are timestamped to today (`new Date().toISOString().split('T')[0]`). No way to submit a retroactive report for a past date.

24. **No receipt attachment for expenses** — Employee expense reports should typically include a receipt/underlag. No file upload exists in the ReportDialog.

25. **Avatar path always 404s** — `EmployeeCard` tries to load `/avatars/{employee.id}.png` which doesn't exist. Always falls back to initials. Harmless but unnecessary network request.

### Löner → Egenavgifter (EF/HB/KB only)

#### Critical Bugs

15. **Calculation is legally wrong** — Swedish tax law (IL 16 kap 29§) requires 25% schablonavdrag before computing egenavgifter. Correct: `profit × 0.75 × 28.97%` = effective 21.73%. Current UI: `profit × 28.97%` directly. Overstates egenavgifter by ~33%. The AI tool `calculate_self_employment_fees` does this correctly — the UI does not.

16. **Wrong BAS account** — Bokför button books to **6310 Försäkringspremier** (external insurance — fire, liability). Egenavgifter should go to **7533 Egenavgifter** (or 75xx range — social/personnel costs). Corrupts income statement structure and NE-bilaga.

17. **2026 rates not seeded** — Migration only seeds egenavgifter rates for 2024/2025. `useAllTaxRates(2026)` returns `null` because `egenavgifter_full` is missing. All calculations show 0, Bokför button disabled. Page is non-functional in 2026.

18. **Component breakdown doesn't sum to total** — 7 individual components sum to ~31.73% but total uses 28.97%. Individual row amounts visibly exceed the "Totalt" footer. The discrepancy comes from the schablonavdrag being baked into the total rate but not the components.

19. **No duplicate booking prevention** — Clicking "Bokför egenavgifter" creates a new verification every time. No check for whether this month was already booked. Can accidentally book the same month multiple times.

20. **`realProfit` has no year filter** — Sums ALL verifications returned by the API (up to 200) regardless of year. `monthlyData` correctly filters by current year but `realProfit` does not. Multi-year data inflates the "bokfört resultat".

21. **Hardcoded fallback rate is wrong** — `use-self-employment-tax.ts` has `rates?.egenavgifterFull ?? 0.2821`. The value 0.2821 is not a real rate (actual is 0.2897).

22. **Karens tooltip is wrong** — Says "0.04–0.17% lägre avgift" but the actual seeded reduction is 0.76%.

#### Architecture Issues

23. **Monthly trend total row mismatch** — 12 monthly rows derive from actual ledger data, but the total row uses the user's typed-in profit estimate. If those differ, the column doesn't add up.

24. **HB/KB partner shares not handled** — Page shows one profit input but HB/KB companies have multiple partners who each pay egenavgifter on their share. No partner-share breakdown exists.

25. **Subtitle says "enskild firma" only** — But the tab is visible for HB/KB too. Should be dynamic per company type.

26. **Books directly via `addVerification`** — Bypasses the pending booking system. Creates a verification immediately without user review in a wizard. Inconsistent with the rest of the app where writes go through pending bookings.

27. **Three inconsistent egenavgifter implementations** — UI calculator (no schablonavdrag), AI tool (correct schablonavdrag), and NE-bilaga (different formula structure). Should be one canonical calculation function.

#### UX Redesign: Move to Rapporter as "Egenavgifter" (founder direction)

The current Egenavgifter tab under Löner is a standalone calculator with wrong math, wrong accounts, and no connection to the NE-bilaga filing. It should be deleted from Löner and rebuilt as a proper report page under Rapporter.

**Delete:** The `egenavgifter` tab from the Löner category entirely.

**Create:** A new "Egenavgifter" tab under Rapporter (where Moms, INK2, AGI, K10 already live). Named "Egenavgifter" because that's what EF owners think about — the NE-bilaga is just the output document.

**Flow (follows existing report wizard pattern):**
1. **Calculate** — Egenavgifter math derived from actual ledger P&L, with correct 25% schablonavdrag (IL 16 kap 29§): `profit × 0.75 × rate`. Toggle for reduced rate (66+) and karens reduction. Monthly trend table as context so user can verify the annual figure.
2. **Review/Adjust** — Same wizard pattern as Momsdeklaration/INK2. User reviews and can adjust figures. Component breakdown visible (7 fee types).
3. **Save** — Save as NE-bilaga to `taxreports` table with `status: 'draft'`.
4. **Booking prompt** — After save, `BookingWizardDialog` pops up offering to create the verification (debit **7533** Egenavgifter / credit **2510** Skatteskulder). User can book now or dismiss and do it later. Add `'egenavgifter'` as a new `PendingBookingSourceType`.

**One canonical calculation function** — The egenavgifter math (schablonavdrag, rate selection, component breakdown) should live in one shared function used by both the report wizard and the AI tool. No more three implementations.

**HB/KB support** — For HB/KB companies, the wizard should show per-partner profit shares (from `usePartners()`) since each bolagsman pays egenavgifter on their share individually.

**Files to change:**
- `src/components/loner/constants.ts` — remove `egenavgifter` tab
- `src/components/loner/egenavgifter/` — delete entire directory
- `src/components/rapporter/constants.ts` — add `egenavgifter` tab (EF/HB/KB only)
- `src/components/rapporter/egenavgifter/` — new directory with index + hook + wizard
- `src/components/rapporter/dialogs/egenavgifter-wizard-dialog.tsx` — new wizard following moms/INK2 pattern
- `src/components/bokforing/booking-wizard/BookingWizardDialog.tsx` — add `'egenavgifter'` source type
- `src/services/pending-booking-service.ts` — add `'egenavgifter'` to `PendingBookingSourceType`
- `src/lib/egenavgifter.ts` or similar — one canonical calculation function
- `src/lib/ai-tools/loner/owner-payroll.ts` — update `calculate_self_employment_fees` to use the shared function

### Löner → Delägaruttag (HB/KB only)

#### Critical Bugs

18. **BAS accounts are completely wrong** — `getPartnerAccounts()` generates 2013/2018/2023/2028 but in the BAS kontoplan, **2013 is Reservfond** (AB restricted equity). HB/KB partner accounts should be in the **2070–2079 range** (2071 for partner 1, 2072 for partner 2, etc.). The AI tool uses 2070 (correct). The UI uses 2013 (wrong). The AI knowledge file says 2013/2017 (a third variant). Three inconsistent account schemes.

19. **Every partner maps to index 0** — `partnerIndex()` uses regex `p-(\d+)` expecting mock IDs like "p-1" but real partners have Supabase UUIDs. Regex never matches, always returns 0. All partners share the same BAS accounts (2010/2013/2018), making per-partner tracking impossible.

20. **Legal info sidebar is for the wrong company type** — Mentions "förbjudet lån" (ABL 21 kap), "utdelning", and "bolagsstämma" — all AB concepts. HB/KB are governed by Handelsbolagslagen. Partners can take unlimited withdrawals, no concept of förbjudet lån to owners, no bolagsstämmor. Legally misleading.

21. **No company type guard** — AB users can access this page and register withdrawals that book against 2013 (Reservfond), corrupting their equity structure. Should be blocked for AB entirely (AB uses dividend flow instead).

22. **Lön type is lost after booking** — `lön` books to the same withdrawal account as `uttag`. When reading back from the ledger, lön entries appear as uttag. The type information is destroyed on booking.

23. **Solvency check uses stale data** — Checks `capitalContribution` (set once at partner creation, never updated) instead of live ledger balance. Also doesn't account for pending bookings already in the queue — user can create multiple pending withdrawals exceeding their capital.

#### Architecture Issues

24. **Two parallel account approaches never reconciled** — (a) UI: index-based `201X` accounts per partner (wrong, collides with BAS). (b) AI tool: single `2070` account for all HB/KB partners (correct BAS but no per-partner differentiation). Correct approach: `2071, 2072, 2073...` sub-accounts per partner within the 2070 group.

25. **Withdrawals derived from ledger, not stored** — No withdrawals table exists. The hook reverse-engineers withdrawals by scanning verifications for partner account matches. This means any metadata (type, approval status) is lost — only amounts and dates survive.

26. **Bokföringstips hardcodes wrong accounts** — Info card text says "Uttag bokförs mot konto 2013/2023 och insättningar mot 2018/2028" — reflects the broken scheme, not BAS standard.

#### Hollow Features / Stubs

27. **"Redigera" and "Makulera" menu items** in WithdrawalsGrid have no handlers — clicking does nothing.

28. **"Att attestera" stat is always 0** — `approved` is hardcoded `true` on every withdrawal, so pending count is always 0.

29. **Solvency error swallowed** — Dialog catches the specific solvency error but shows generic "Något gick fel" instead of the actual error message explaining insufficient capital.

#### Code Quality

30. **`useCompany()` imported but unused** — `new-withdrawal-dialog.tsx` imports company context but never reads `companyType` for any logic or gating.

31. **AI tool `register_owner_withdrawal`** — Company-type-aware account selection (good), but the confirmed path returns `{ success: true, booked: false }` without actually calling `addVerification`. The write never executes.

#### Cross-cutting: AI Tools

20. **`run_payroll` AI tool** — Full preflight + confirmation pattern. Well-implemented. Creates pending booking on confirm. The best-implemented AI write tool in the codebase.

21. **`submit_agi_declaration` AI tool** — Stub that returns `submitted: false`. No actual AGI submission.

22. **`register_owner_withdrawal`** — Company-type-aware account selection (good). But the confirmation path returns `{ success: true, booked: false }` — it creates a verification description but the actual `addVerification` call is missing from the confirmed path.

23. **`optimize_312`** — Read-only calculation tool, correctly implements förenklingsregeln (2.75 × IBB) vs lönebaserat utrymme. Good.

24. **`assign_benefit`** — Calls `assignBenefit()` from formaner lib, which writes to `employee_benefits` table (doesn't exist in cloud DB). Will fail.

#### Critical Bugs

1. **Adding assets fails** — `inventarieService.addInventarie()` generates a non-UUID id (`inv-${Date.now()}-random`) but the DB column is `UUID PRIMARY KEY`. Insert will fail the constraint. Assets cannot be added from the UI.

2. **RPC is broken** — `get_inventory_stats()` queries `current_value` (English column name) and `status = 'active'` (English value) but the table uses `inkopspris` and `'aktiv'` (Swedish). Always returns 0 for everything.

3. **Company statistics broken** — `company-statistics-service.ts` queries `status = 'active'` (English) against Swedish values. Asset count in company stats is always 0.

4. **AI tools are all hollow:**
   - `create_asset` — shows confirmation but never calls `addInventarie()`. Asset not saved.
   - `book_depreciation` — returns fake `verificationId`, never creates a verification.
   - `dispose_asset` — never updates status. Disposal not recorded.

5. **Status never mapped** — Service mapper doesn't read `status` from DB rows. Status is always `undefined` in the UI and AI tools. Status filtering is broken.

#### Architecture Issues

6. **Dead duplicate service** — `asset-service.ts` targets a non-existent English-column schema. Exported from `services/index.ts` but never used. Will throw at runtime if called.

7. **Schema collision** — Two migrations create `inventarier` with different column schemas (Swedish vs English). A third migration patches them together, leaving a hybrid table with both sets of columns.

8. **Stats bypass the RPC** — `InventarierStats` panel computes everything client-side from the full asset list. `getStats()` service method exists but is never called from UI. The RPC is broken anyway (see #2).

9. **`kategorier` mislabeled** — `getStats()` maps `active_items` count to `kategorier`. These are completely different things.

#### UX Issues

10. **No category input in add dialog** — All manually added assets default to `'Inventarier'`. No way to set category.

11. **No edit or delete in UI** — `deleteInventarie` exists in service but not exposed by hook. No update method at all. No row actions in grid.

12. **Bulk selection does nothing** — `useBulkSelection` is wired but no bulk action UI exists.

13. **Double-fetch on mount** — Both `useInventarier` and `useInventarierLogic` trigger `fetchInventarier()`.

14. **Silent error on add** — `handleAddAsset` catches errors but shows no toast.

15. **No residual value in depreciation** — Always depreciates to zero. Swedish tax law allows restvärdesavskrivning (30%/year) but this is not configurable.

16. **Grid hides status** — The `status` field (`aktiv`/`såld`/`avskriven`) exists on the type and in DB but is never rendered. No way to mark an asset as sold or scrapped.

---

## Ägare Category

### Cross-cutting: Split Data Stores

The most critical issue across the entire Ägare category. The UI and the AI tools read from **different database tables** for the same data:

- **UI** uses `useCompliance()` → `corporate_documents` table (shareholders stored as JSON inside compliance docs, meetings stored as doc records)
- **AI tools** use `shareholderService` → `shareholders` table, `boardService` → `boardminutes` + `companymeetings` tables

The user sees one reality in the UI, the AI sees another. Creating a shareholder via the AI doesn't show in the UI. Creating a meeting in the UI doesn't show via AI tools. This must be reconciled — one canonical data source per entity.

### Ägare → Aktiebok (AB only)

#### Critical Bugs

1. **Wrong överkursfond account** — Nyemission premium books to account **2097** which doesn't exist in BAS. Correct account is **2019** (Överkursfond). Every nyemission with a premium creates a wrong accounting entry.

2. **Race condition on new shareholder** — Nyemission to a new person calls `addShareholder` → `refetchShareholders` → `find()` on stale `realShareholders`. The shareholder is found as `undefined`, so `updateShareholder` never fires. New shareholders are created with 0 shares.

3. **Share number ranges not updated on transfer** — Köp/Gåva/Arv only change `shares_count`, not `share_number_from/to`. ABL 5:2 requires tracking which specific aktienummer were transferred. The number chain breaks after any transfer.

4. **`acquisitionDate` shows `created_at`** — Uses DB row insert timestamp instead of the real `acquisition_date` column. The compliance hook's `Shareholder` type doesn't expose `acquisition_date`, so the correct value is inaccessible.

5. **`acquisitionPrice` always 0** — Hardcoded. The DB has `acquisition_price` but the compliance hook doesn't expose it.

6. **UI `addShareholder` skips share number assignment** — Compliance API route does a raw insert, no auto-assignment of aktienummer. `shareholderService.addShareholder()` (used by AI tools) does auto-assign. UI-added shareholders have null share numbers.

7. **`transfer_shares` AI tool is a mock** — Returns hardcoded "Säljande aktieägare" / 500 shares. No DB writes.

8. **No server-side share number uniqueness** — DB has `CHECK (share_number_to >= share_number_from)` but no overlap constraint. Two simultaneous submissions can create overlapping ranges.

#### Architecture Issues

9. **Transactions derived from verification descriptions** — Not read from `share_transactions` or `sharetransactions` tables. Reconstructed via regex matching on description strings ("nyemission", "aktier", "överlåtelse"). Fragile — any verification mentioning "aktier" appears. Share class is hardcoded to 'B' for all parsed transactions.

10. **Four separate Shareholder types** — `ownership.ts`, `use-compliance.ts`, `shareholder-service.ts`, `aktiebok/types.ts (ShareholderDisplay)` — never aligned. Different fields exposed, different naming.

11. **Two unused transaction tables** — `share_transactions` (well-designed with share_class, verification_id, share number columns) and `sharetransactions` (older). Neither is used by the UI. Transaction history is derived from verifications instead.

12. **UI and AI tools use different data paths** — UI uses `useCompliance()` (limited fields). AI tools use `shareholderService` (full fields, but bypasses RLS via raw `getSupabaseClient()`). Adding a shareholder via AI gets correct aktienummer; via UI gets null.

13. **`shares_percentage` vs `share_percentage` column mismatch** — Compliance hook type declares `shares_percentage` but DB column is `share_percentage`. Value is likely always null at runtime.

14. **Dropdown actions are dead UI** — "Visa detaljer", "Redigera", "Ta bort" in ShareholdersGrid have no handlers.

#### ABL Compliance Gaps

15. **ABL 5:2 — aktienummer chain broken** — Transfers don't record which specific share numbers moved. Non-contiguous ranges from multiple issuances are collapsed into a single range per shareholder.

16. **ABL 5:2 — PDF is snapshot only** — Export shows current state, not full transaction history. A proper aktiebok must show the complete history of ownership changes.

17. **Split uses `sourceType: 'equity_issue'`** — Will display as Nyemission in the transaction list. No separate split type in the filter logic.

#### UX Issues

18. **Can't transfer to a new person** — Transfer dialog only shows existing shareholders in dropdown. To sell/give shares to someone new, you'd need to first create them via Nyemission (which doesn't make sense).

19. **Mobile can't register transfers or export** — Dropdown menu only visible on md+ screens. Mobile only shows "Lägg till aktieägare" button.

20. **No empty state in TransactionsGrid** — Shows blank if no transactions.

#### What Works

- SVG donut chart of ownership percentages — correct math
- Vote weighting (A=10, B=1) correctly calculated in the logic hook
- Nyemission accounting structure correct (aktiekapital + överkurs split, aside from wrong account number)
- Transfers correctly create no accounting entry
- Split correctly updates all shareholders proportionally with sequential renumbering
- PDF share register with ABL 5:2 header citation
- Share class badges (A/B) in the grid

### Ägare → Utdelning (AB only)

#### Critical Bugs

7. **Dividend lifecycle broken at step 3** — `bookDividend` creates a pending booking but the status never advances to "booked". The `sourceId` is a synthetic composite string (`${meetingId}-${decisionId}`) that doesn't match any `dividends` table row. The booking wizard's SQL `UPDATE dividends SET status = 'booked' WHERE id = $source_id` updates 0 rows. `updateDocument` is imported but never called, so `d.booked` stays `false` in the compliance JSON. Dividend stays "decided" forever.

8. **Pay step is unnecessary** — `payDividend` (debit 2898 / credit 1930) exists but payment happens outside the app (in the bank). The bank transaction comes in naturally and gets booked via the normal transaction flow. The dividend lifecycle should end at Book. Remove `payDividend` and the "Registrera utbetalning" dropdown action.

9. **Distributable equity calculated wrong** — Hook only scans accounts 2090–2099, missing 2080 (Balanserat resultat) and current-year net income. Orphaned `use-dividends.ts` has the correct ABL 17:3 formula (`total equity - restricted equity + net income`) but is imported nowhere. The two approaches produce different numbers — UI might block a legal dividend or allow an illegal one.

10. **K10 owner salary uses wrong account** — Hook reads account 7220 for `egenLön`, but `OWNER_ACCOUNTS.OWNER_SALARY` constant is 7012. If payroll books to 7012, `klararLonekrav` is always false and everyone defaults to förenklingsregeln, potentially understating gränsbelopp.

11. **K10 missing räntebaserat utrymme** — UI hook calculates `max(schablonbelopp, lönebaserat)` but omits räntebaserat utrymme (acquisitionValue × räntebaserat rate). The AI tool includes it. Two inconsistent K10 calculations.

12. **`registerDividendTool` AI tool is a complete stub** — Returns success, generates a convincing data object, navigates user to Utdelning tab — but writes nothing to DB. User sees no change.

#### Architecture Issues

13. **Distributable equity not shown to user** — Computed and returned from hook but no component displays it. Users only discover the limit via solvency check error toast. Should show "Fritt eget kapital: X kr" on the page.

14. **No per-shareholder distribution** — Dividends booked as a lump sum. ABL 18:4 requires pro-rata distribution (`shareholder.shares / totalShares × dividend`). PDF has a per-shareholder section but it's never populated with data.

15. **No tax withholding entries** — Neither book nor pay pending bookings include a tax posting. For non-operator shareholders, 30% kupongskatt should be withheld (debit 2898 / credit 2510). For fåmansföretag operators this is handled via K10, but the option should exist.

16. **Two `bookDividend` functions** — `useDividendLogic` (creates pending booking, never updates doc) and `useGeneralMeetings` (updates doc, triggered from meetings tab). Neither does both. Need one canonical path.

17. **`use-dividends.ts` is orphaned** — The correct, architecturally sound equity hook is imported nowhere. Should replace the inline equity scan in `use-dividend-logic.ts`.

#### Hardcoded Values

18. **Municipal tax rate at 32%** — `calculateDividendTax()` hardcodes tjänsteinkomst at 32%. Real rates vary 29–35% by municipality, and state tax bracket pushes marginal rate to ~52% for high earners.

19. **Bokförd stat card tax at 20%** — `utdelning-stats.tsx` computes tax as `stats.bokford * 0.2` regardless of split calculation. Inconsistent with the 3:12 split logic used elsewhere.

#### Hollow Features / Stubs

20. **"Visa protokoll" dropdown item** — No handler. Dead UI on every dividend row.

21. **K10 `sparatUtdelningsutrymme` write path missing** — Hook reads saved K10 reports for past `remainingUtrymme` but no code saves new K10 reports with `remainingUtrymme` after a tax year closes.

#### What Works

- Plan step creates compliance document correctly
- ABL 17:3 solvency check runs at both plan and book time
- 3:12 tax split structure correct (20% below gränsbelopp, higher above)
- K10 förenklingsregeln calculation correct (`2.75 × IBB × ägarandel`)
- K10 lönebaserat utrymme with lönekrav check (`6 × IBB` floor, 50% of total payroll)
- DividendCalculator sidebar clearly shows which rule is active
- PDF utdelningsavi preview + download works (minus per-shareholder section)
- Pending booking accounts correct: 2098/2898 for book, 2898/1930 for pay

### Ägare → Möten & Protokoll (AB + Förening)

#### Critical Bugs

11. **No UI to add decisions** — The `decisions` array starts empty at meeting creation and stays empty. There is no form, no "Lägg till beslut" button anywhere in the MeetingViewDialog. The decision display (§-numbered items, voting results, "Bokför utdelning" button) exists but has nothing to show. A meeting system where you can't record meeting outcomes.

12. **"Spara & skapa kallelse" button is dead** — `PlanMeetingDialog` has the button but `onSaveAndCreateKallelse` prop is never passed from `index.tsx`. Clicking does nothing.

13. **"Förbered nu" button has no handler** — `UpcomingAlert` renders a `<Button>` with no `onClick`. Dead UI.

14. **AI tools query wrong tables** — `getBoardMeetingMinutesTool` queries `boardminutes`, `getCompanyMeetingsTool` queries `companymeetings` — but UI writes exclusively to `corporate_documents`. AI tools always return empty results for UI-created meetings. Only `getComplianceDocsTool` reads from the correct table.

15. **`draft_board_minutes` AI tool references `companyService`** — used in the execute function but relies on module-level import hoisting. Fragile and confusing code structure.

16. **Status advancement gap** — "Spara & skicka kallelse" sets DB status to `pending` (kallad) but moves UI stepper to `genomford`. The meeting is shown at protocol step but DB status is still "kallad", not "genomförd". Requires a second manual status change.

#### Architecture Issues

17. **Three separate meeting storage systems** — (a) `corporate_documents` (used by UI), (b) `boardminutes` table (used by boardService + AI tools), (c) `companymeetings` table (used by boardService + AI tools). The UI and AI see completely different meetings.

18. **All meeting data is a JSON blob** — Decisions, attendees, votes, kallelse text all stored as stringified JSON in `content` field. No structured columns, no queryability, no referential integrity.

19. **Arsmote and Bolagsstamma show same data** — Both filter `general_meeting_minutes` from `corporate_documents`. No data-level distinction between AB bolagsstämma and förening årsmöte.

#### Hollow Features / Stubs

20. **"Skicka" buttons should be removed or renamed** — "Spara & skicka kallelse" only saves to DB. Email integration (Resend) is postponed (see top of doc). All "Skicka" buttons across the app should be renamed to just "Spara" or removed until Resend is integrated. Same applies to bulk "Skicka lönebesked" in Löner and any other send buttons.

21. **"Signera" is just a status flip** — No digital signature mechanism. Button sets status to 'signed' in the DB.

22. **AI generation requires manual copy-paste** — "Generera med AI" opens the chat sidebar with a prompt. AI generates text in chat, user must copy-paste into the textarea. No auto-fill.

23. **`sharesRepresented` / `votesRepresented` always 0** — Initialized to 0, never updated anywhere. Meeting cards always show "0 aktier".

24. **`MotionDialog` not rendered anywhere** — Exists as a component but never imported in the meetings page. Orphaned.

25. **`SendNoticeDialog` not rendered anywhere** — Same as MotionDialog. Orphaned.

26. **`registerDividendTool` AI tool** — Returns success object but writes nothing to DB.

#### ABL Compliance Gaps

27. **No distributable equity check before dividend booking** (ABL 17:3) — Dividends can be booked from signed meetings without verifying fritt eget kapital.

28. **No quorum tracking** (ABL 7:39) — No validation that shares represented constitute a quorum.

29. **No justerare in data model** (ABL 7:50) — Protocol must be verified by chairperson + at least one elected person. Field doesn't exist. PDF has one blank signature line.

30. **No röstlängd** (ABL 7:27) — Voting list required at meetings. `sharesRepresented` exists but is always 0.

31. **Kallelse timing not enforced** (ABL 7:18) — 2-week minimum notice shown as info text but not validated. User can send kallelse after deadline.

#### Code Quality

32. **Debug `console.log` statements in production** — `useGeneralMeetings` has multiple `console.log('[useGeneralMeetings]...')` calls.

33. **`corporate_documents` cast as `any`** — API route uses `from('corporate_documents' as any)` indicating type mismatch with generated schema.

#### What Works

- Meeting lifecycle stepper — clean 4-step UX (planerad → kallad → genomförd → signerat)
- Creating both bolagsstämma (ordinarie/extra) and styrelsemöte
- Inline editing of date, time, location, chairperson, secretary
- Pre-filled ABL 14-item standard agenda
- Saving kallelse and protocol text to DB
- PDF generation for both kallelse and protocol (jsPDF, client-side)
- Dividend booking from signed meetings (debit 2098 / credit 2898)
- Meeting countdown and upcoming alert display
- Filter tabs with counts
- `getComplianceDocsTool` AI tool reads from correct table
- `prepareAgmTool` generates correct ABL planning checklist
- `getComplianceDeadlinesTool` calculates AGM deadline correctly (6 months after fiscal year end)

### Ägare → Ägarinfo (EF only)

#### Issues

16. **Read-only, no editing** — Shows company name, org form, registration date, owner name, moms registration from CompanyProvider. No way to edit any field from this tab.

17. **`_ownerName` computed but unused** — Variable prefixed with underscore, never rendered.

18. **Minimal value** — Just displays CompanyProvider data that's already visible in Inställningar. Could be removed or merged.

#### UX Redesign: Owner Activity Page (founder direction)

The current Ägarinfo is a dead info card. It should become the EF equivalent of what Delägare is for HB/KB — an owner page with activity.

**Company type → owner page mapping:**

| Company type | Owners page | Employees page |
|---|---|---|
| EF | Ägarinfo (1 owner, uttag, egenavgifter) | Team (if they hire) |
| HB/KB | Delägare (multiple partners, uttag, insättningar) | Team (if they hire) |
| AB | Aktiebok + Utdelning (shareholders, dividends) | Team (owners usually employees too) |
| Förening | Medlemsregister (members, board) | Team (if they hire staff) |

**Ägarinfo redesign:** One owner card (name only) → click opens overlay showing:
- Owner details (personnummer, F-skatt status, kommun)
- Activity feed: privata uttag (2013), insättningar, egenavgifter bookings, any salary if applicable
- Running totals: total uttag YTD, kapitalkonto balance

Same overlay pattern as the Team employee overlay but for the single EF owner who is not an employee. Shows owner-specific data (uttag, egenavgifter, F-skatt) instead of employee-specific data (payslips, arbetsgivaravgifter, benefits).

**Files to change:**
- `src/components/pages/ownership-page.tsx` — extract inline `EnskildFirmaOwnerInfo` to its own component with overlay
- New component: `src/components/agare/agarinfo/` — owner card + overlay with activity feed
- Wire to verifications for account 2013 (EF privata uttag) activity

### Ägare → Delägare (HB/KB)

#### Critical Bugs

19. **Partner-to-account mapping broken (two different ways):**
    - In `use-partner-management.ts` (this tab): partner index from array position in `created_at DESC` order. Newest partner = index 0. Adding a partner shifts everyone's accounts. No persistent mapping in DB.
    - In `use-owner-withdrawals.ts` (shared with Delägaruttag): `partnerIndex()` regex `p-(\d+)` expects "p-1" format but real IDs are UUIDs. Always returns 0. Every partner maps to same accounts (2010/2013/2018).
    - Result: for any company with 2+ partners, capital balances and withdrawal attribution are wrong.

20. **`EQUITY_ACCOUNTS.RESERVFOND = '2013'` clashes with partner withdrawal account** — 2013 in BAS for HB/KB is correctly a partner withdrawal account, not Reservfond. The `RESERVFOND` constant should be 2085. This affects any code that uses this constant for equity calculations.

21. **`get_partner_stats` RPC doesn't exist** — Both UI ("Uttag i år" stat) and AI tools (`getPartnersTool`) call this RPC. Silently errors, returns 0/empty.

22. **No partner edit or delete** — No PUT/PATCH/DELETE API endpoints. Once added with wrong info, partners cannot be corrected or removed.

#### Architecture Issues

23. **No persistent partner-to-account mapping** — Partner → BAS account assignment is computed at runtime from array position or regex. Should be stored in the DB (e.g. `account_base` column on partners table) to prevent shifts when partners are added/removed.

24. **Profit share hardcoded to ownership %** — `profitSharePercentage = ownershipPercentage` in the add handler. HB/KB bolagsavtal can specify independent ratios. No separate input exists.

25. **Stacked bar breaks with negative balances** — If a partner overdraws kapitalkonto (legal in HB), `Math.max(0, ...)` hides their segment but their negative value remains in `totalCapital`, causing other partners to show >100%.

#### KB Legal Gaps

26. **No komplementär requirement enforced** — KB must have at least one komplementär. No validation.

27. **No kommanditdelägare insats cap** — Kommanditdelägare's liability is legally capped at their registered insats. No tracking or display of this cap.

28. **No ownership percentage validation** — Can add partners totaling >100%. No sum check.

#### Hollow Features / Stubs

29. **Bulk selection not wired** — Checkboxes in PartnersGrid and RecentWithdrawalsGrid track state via `useBulkSelection` but no actions exist.

30. **AI tool `getPartnersTool` always fails** — Calls missing `get_partner_stats` RPC. Returns error.

31. **`joinDate` always defaults to today** — Cannot backdate a partner's entry.

32. **Personnummer accepts any string** — No Swedish format validation (YYYYMMDD-XXXX).

#### What Works

- PartnersGrid with name, masked SSN, type (komplementär/kommanditdelägare for KB), ownership %, insatskapital, kapitalsaldo
- Capital balance from ledger (correct sign convention: `credit - debit` for equity accounts)
- BAS account scheme (2010/2013/2018 per partner) is correct for HB/KB in Swedish BAS standard
- AddPartnerDialog with KB type selector
- Legal info cards (HB vs KB specific)
- RecentWithdrawalsGrid shares data with Delägaruttag tab (consistent view)

### Ägare → Medlemsregister (Förening only)

#### Critical Bugs

21. **RPC column doesn't exist** — `get_member_stats()` references `current_year_fee_paid` column which doesn't exist in schema. Should check `last_paid_year = EXTRACT(YEAR FROM CURRENT_DATE)`. Unpaid fees stats always return 0.

22. **Membership type mismatch across layers** — RPC uses `familj`/`stod`, DB schema only allows `ordinarie`/`stödmedlem`/`hedersmedlem`. Fee calculation hits no matching CASE branch for real members.

23. **Fee amounts out of sync** — Frontend MEMBERSHIP_FEES: 500/200/0 kr. RPC hardcodes: 100/150/50 kr. Two different "truths" for the same data.

#### Hollow Features

24. **All 4 dropdown actions are dead** — "Redigera", "Ändra status", "Registrera betalning", "Avsluta medlemskap" have no handlers. Clicking does nothing.

25. **Role display hardcoded** — Every member with any role displays "It-ansvarig". Not a real role mapping.

26. **Membership changes never tracked** — `useState<MembershipChange[]>([])` initialized empty, never populated. No API endpoint exists for change history.

27. **Export button has no handler** — "Exportera lista" button renders but onClick does nothing.

28. **Bulk selection disconnected** — Checkboxes work for selecting rows, but no bulk actions (delete, export, status change) are available.

29. **Stats don't refresh** — `useMemberStats()` calls RPC only on mount. Adding a member doesn't update the stats cards.

30. **AddMemberDialog hardcodes type** — Membership type always submits as `ordinarie` regardless of what could be selected. No type picker in the form.

#### What Works
- Adding a member with auto-generated member number (sequential 001, 002...)
- Bookkeeping entries on creation (insats → 2083, avgift → 3890, correct accounts)
- Search and status filter
- Grid table with responsive columns

### Ägare → Firmatecknare (all except EF)

#### Issues

31. **History dialog missing from JSX** — `showHistoryDialog` state is set but no `Dialog` component renders for it. "Visa historik" button silently does nothing.

32. **"Redigera" and "Avregistrera" are toast-only** — Show informational toasts but take no action.

33. **"Lägg till" button is misleading** — Fires a toast explaining signatories are derived, not manually added. The button exists but intentionally does nothing actionable. Should either be removed or changed to an info label.

34. **EF `validFrom` hardcoded to '2020-01-01'** — Not derived from company registration date.

35. **AI tool uses different data source** — `boardService.getSignatories()` reads from `shareholders` where `is_board_member = true`. UI derives from `useCompliance()`. Could show different signatories.

36. **Shareholder ≥50% ≠ signing authority (legally wrong)** — AB logic grants "ensam firmateckning" to shareholders with ≥50% ownership. Under Swedish law, owning shares does NOT grant signing authority — must be board member or have prokura. Could mislead users into signing without legal authority.

37. **No prokura support** — No support for commercial proxies (prokurister). Common in Swedish business. System only derives from ownership/board/partners.

38. **Stale board data** — Signatories only update from latest *signed* board meeting. If board member resigns but no new meeting is recorded, signatory list stays wrong indefinitely.

### Ägare → Årsmöte (Förening only)

#### Issues

39. **No document type distinction from Bolagsstämma** — Both Årsmöte and Bolagsstämma filter `general_meeting_minutes` from `corporate_documents`. No `meetingType` field or separate document type. If both existed for a company, they'd show the same list. `GeneralMeeting` type has a `meetingType: 'bolagsstamma' | 'arsmote'` discriminator but it's never set to `'arsmote'` in practice.

40. **MotionDialog `onSubmit` is console.log only** — No persistence. Motions are submitted but never saved. They never appear on meetings.

41. **SendNoticeDialog `onSubmit` is console.log only** — "Skicka kallelse" doesn't send anything. Rename button since email (Resend) is postponed.

42. **Exportera button has no handler** — Dead UI.

43. **Status mapping is lossy** — Document `draft` → `planerad`, `pending` → `kallad`. No way to distinguish "just created" from "notice actually sent". Status never advances automatically.

44. **Preparation checklist partly hardcoded** — "Dagordning klar" always returns `true`. Assumes standard agenda is always complete regardless of actual state.

#### What Works
- Meeting creation saves correctly to `corporate_documents`
- 20-item standard association agenda is legally correct
- NextMeetingCard with prep progress is good UX
- Voting members calculation (aktiv + fee paid) correct
- PDF generation for kallelse
- Search and status filter on grid

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
- **Företagsstatistik page removed** — stats moved into AI tools (NOTE: pages are NOT being removed app-wide. This was a one-off removal of a redundant stats page. See `AI_NATIVE_REDESIGN.md` which is DEPRECATED — the "remove all pages" vision is cancelled.)
- **Cash balance classification fixed** — `isCashAccount()` restricts to 1900-1959 (was all 19xx)
- **SKV tax table fallback removed** — payroll now errors if skattetabell is missing instead of silently using approximate rate
- **Error states added** — `use-company-statistics` and `use-financial-metrics` now return `error` field
- **Account classification deduplicated** — `use-company-statistics` uses `getAccountClass()` from bookkeeping/utils
- **Period lock centralized** — all consumers use `financialperiods` table as single source of truth; `checkPeriodLocked()` shared utility added
- **Dividend double-flipping** — verified NOT a bug (sign convention is consistent)
- **VAT split validation** — verified NOT a bug (TypeScript `SwedishVatRate` union type enforces this)
- **Planning System "Min Plan"** — already implemented (roadmap service, dynamic tasks, AI tools, Händelser views)

- **Tool Search (dynamic tool loading)** — `search_tools` meta-tool + `domain`/`keywords` on all 111 tools + `ScopeBrain` active tool tracking. Reduces tool token overhead from ~88K to ~2K per conversation.
- **Activity Snapshot in system prompt** — Chat route fetches pending transactions + overdue invoices, rendered as ~50 tokens in system prompt so Scooby knows current state without tool calls.
- **Stripe Embedded Checkout** — BuyCreditsDialog routes to `/dashboard/checkout` with embedded Stripe form instead of redirect. `user_credits` table and billing history API already existed.
- **AI Reconcile Status** — `reconcile_status` tool scans 5 tables (transactions, invoices, receipts, payslips, pending_bookings) for stale/inconsistent data with walkthrough output.
- **Supabase type cleanup** — Regenerated `database.ts`, added GRANT migration for 22 tables, removed 35/44 `as any` casts. Fixed `agi_reports` → `agireports` table name bug.

## Implemented (2026-03-06)

- **Phase 4A: Fix Lönekörning** — unified verification path via pending bookings, replaced raw fetch with React Query, added PUT/DELETE endpoints for payslips, added status workflow UI
- **Phase 4B: Fix Förmåner** — fixed data loading from DB, wired assign/delete flows, fixed company type from CompanyProvider, added GET/DELETE API routes
- **Phase 4C: Move Egenavgifter to Rapporter** — canonical `src/lib/egenavgifter.ts` with IL 16:29§ formula, moved tab from Löner to Rapporter, fixed accounts (7533/2510), pending bookings with duplicate prevention, added to BookingWizardDialog
- **Phase 4D: Fix Delägaruttag (HB/KB)** — fixed BAS accounts to 2071+3n range, DB-stored `accountBase` on Partner, AI tool uses partner-specific accounts, AB guard + HB/KB legal text
- **Phase 2A: Fix VAT Calculator + iXML Export** — canonical `vat-boxes.ts` mapping all 33 rutor to BAS accounts, rewrote calculator to use mapping (incl. reverse charge output VAT), fixed wizard to preserve non-form fields, real Skatteverket eSKDUpload DTD 6.0 XML export with official element names, replaced manual wizard with navigateToAI()
- **Phase 2B: Fix AGI + iXML Export** — consolidated two XML generators into one canonical `generateAgiXML()` with Skatteverket eAGI schema (faltkod attributes FK001/FK011/FK012/FK487/FK497), age-based employer contribution rates (under 26 / over 65 → reduced ~10.21%), fixed data model with typed `individualData` + `totalBenefits` + benefits in contribution basis (SFL 2 kap 10§), replaced Table grid with ListCard pattern, added detail dialog with Huvuduppgift + Individuppgift breakdown and XML download
- **Phase 2C: Fix Inkomstdeklaration** — wired periodiseringsfonder from DB (R14/R15 no longer hardcoded 0), wired tax-exempt dividends (näringsbetingade andelar account 8012-8019) to INK2 field 4.5b and SRU code 7753, fixed SRU field codes (överskott/underskott changed from 7670/7770 to correct 8020/8021), replaced wizard CTA with navigateToAI()
- **Phase 2D: Fix Årsredovisning (K2)** — rewrote annual-report-processor.ts with FiscalYearRange support (not hardcoded currentYear-1), added bokslutsdispositioner line, added account ranges 2100-2299 (obeskattade reserver + avsättningar), proper year-end result calculation from P&L instead of silent balance-patching, dynamic deadline from fiscal year end, replaced wizard with navigateToAI(), iXBRL export uses fiscal year range
- **Phase 2E: Fix Årsbokslut (EF/HB/KB)** — replaced wizard with navigateToAI(), company type-specific equity labels (EF single owner, HB per delägare, KB komplementär/kommanditdelägare), removed duplicate PDF export button
- **Phase 2F: Fix K10 (3:12 rules)** — added multi-shareholder support with dropdown selector, per-shareholder gränsbelopp recalculation based on ägarandel, added uppräkning on sparat utdelningsutrymme (statslåneränta + 3%), proportional dividend splitting per shareholder, replaced wizard with navigateToAI()
- **Phase 2G: Financial statements shared fixes** — added SUMMA TILLGÅNGAR and SUMMA EK+SKULDER summary rows to balance sheet sections, added Rörelseresultat (EBIT) and Resultat före skatt subtotal rows to income statement sections, updated empty section templates to match

- **Phase 3A: Fix Transaktioner** — fixed currency locale from en-US to sv-SE in transactions.ts, rewrote ny-transaktion.tsx with mode chooser (Manuell / Ladda upp fil) instead of tab toggle, stripped manual form to 3 fields (beskrivning, belopp, datum), row click now opens booking dialog directly for unbooked transactions
- **Phase 3B: Fix Verifikationer** — added `series` and `number` fields to Verification interface, fixed display to use `verificationNumber` instead of `id`, removed ManualTab from AutoVerifikationDialog (verification creation only via AI auto-booking)
- **Phase 3C: Fix Fakturor** — fixed SupplierInvoice status type from lowercase to PascalCase Swedish ('Mottagen'|'Attesterad'|'Betald'|'Förfallen'|'Tvist'|'Bokförd'), fixed status comparison in use-auto-verifikation.ts to match
- **Phase 3D: Fix Kvitton** — deleted `matchReceiptToTransactionTool` stub AI tool, removed `linkToTransaction()` from receipt-service (column doesn't exist in DB), converted UnderlagDialog to AI-upload-only flow (removed manual tab, upload triggers AI OCR automatically)
- **Phase 3E: Fix Inventarier** — fixed `kategorier` stat mapping (was incorrectly using `active_items`), fixed company-statistics-service asset query status filter from 'active' to 'aktiv' (Swedish). ID generation and AI tools were already correct.

## Implemented (2026-03-07)

- **Phase 5A: Reconcile split data stores** — rewrote `boardService.getBoardMeetingMinutes()` and `getCompanyMeetings()` to read from `corporate_documents` table (canonical source) instead of empty `boardminutes`/`companymeetings` tables. AI tools and UI now see the same meeting data. Status mapping between corporate_documents (draft/pending/signed/archived) and board service types preserved.
- **Phase 5B: Fix Aktiebok** — fixed överkursfond account from 2097 → 2019 (correct BAS), fixed RESERVFOND constant from 2013 → 2085, exposed `acquisition_date` and `acquisition_price` on Shareholder interface in useCompliance, fixed acquisitionDate display (was showing created_at, now uses real acquisition_date), fixed acquisitionPrice (was hardcoded 0, now reads from DB)
- **Phase 5C: Fix Utdelning** — replaced broken inline distributable equity calculation (only scanned 2090-2099) with proper `useDividends()` hook that implements ABL 17:3 correctly (total equity - restricted equity + net income), removed `payDividend` step (payment happens in bank, not app), removed "Registrera utbetalning" dropdown action from dividend table, added "Fritt eget kapital" stat card showing distributable equity (ABL 17:3), fixed Bokförd stat tax display (was hardcoded 20%, now uses calculated tax from K10 split)
- **Phase 5D: Fix Möten & Protokoll** — added "Lägg till beslut" form to StepGenomford in MeetingViewDialog (title, beslut text, type selector with dividend/board election/auditor election/other, conditional amount field for dividends), wired decisions persistence through updateMeeting → corporate_documents content JSON, wired "Spara & skapa kallelse" button (was never passed as prop, now creates meeting + opens view dialog), wired "Förbered nu" button in UpcomingAlert (was dead UI, now opens meeting view), removed debug console.log statements from useGeneralMeetings

*Verified against codebase 2026-03-07.*

## Implemented (2026-03-08)

- **Phase 6A: Build Översikt tab** — restructured Händelser from 4 tabs (Månadsavslut, Kalender, Planering, Aktivitetslogg) to 3 tabs (Översikt, Canvas, Arkiv). Updated `ViewType` to `"oversikt" | "canvas" | "arkiv"`. Översikt renders existing `ManadsavslutView` + new `DeadlinesList` component. DeadlinesList pulls from `taxcalendar` table + computed årsredovisning deadline (7 months after fiscal year end).
- **Phase 6B: Build Arkiv tab** — replaced `DayDetailDialog` popup with inline `ActivityFeed` below calendar. Added `dateFilter` prop to `useActivityLog` hook and `ActivityFeed` component for day-scoped queries. Click a day → activity shows inline. Pre-selects today on load. Added `emptyMessage` prop to ActivityFeed for custom empty states.
- **Phase 6C: Build Canvas tab** — created `CanvasView` component reusing existing `roadmaps` table (`description` column stores markdown). List view shows card grid with title + checkbox progress + date. Detail view renders markdown with interactive checkboxes (toggle updates DB). Simple markdown renderer (headings, checkboxes, blockquotes, lists, paragraphs). Create/delete with confirmation dialog. Trash icon in top-right (discrete, per founder spec).
- **Phase 6 supporting changes** — updated `page-contexts.ts` descriptions and keywords for new tab structure, updated barrel exports in `handelser/index.ts`.
- **Phase 7A: Year slider UI** — created shared `YearSlider` component in `src/components/shared/year-slider.tsx` (ChevronLeft/Right + year label). Wired into `TaxReportLayout` via optional `yearNav` prop. Added to: Inkomstdeklaration (via `useTaxPeriod`), Årsredovisning (new `selectedYear` state), Årsbokslut (new `selectedYear` state), K10 (exposed `setYear`/`availableYears` from hook). Replaced inline year nav in events-page.tsx with `YearSlider`.
- **Phase 7B: Unify event systems** — documented clear architectural separation: `activity_log` = granular audit trail (who did what), `events` = company timeline/calendar (AI, system, authority events). Added comprehensive JSDoc explaining the two systems in `use-activity-log.ts`.
- **Phase 7C: Dead code removal** — deleted 7 files: `ManualTab.tsx`, `verifikation.tsx` (old dialog), `roadmap-detail.tsx`, `asset-service.ts`, `ink2-fields.ts`, `/api/transactions/processed/route.ts`, `/api/invoices/processed/route.ts`. Cleaned barrel exports in `services/index.ts`, `handelser/index.ts`, `bokforing/index.ts`. Removed commented-out import in `inkomstdeklaration-processor.ts`. Kept `/api/receipts/processed` and `/api/supplier-invoices/processed` (have active POST callers).
- **Phase 7D: Expand activity log** — added 5 new entity types: `roadmaps`, `taxreports`, `financialperiods`, `benefits`, `inventarier` with Swedish labels. Updated `activity-feed.tsx` entity link routes.
- **Phase 7E: Type consolidation** — added canonical `CanonicalVerification`, `VerificationEntry`, and `Payslip` types to `src/types/index.ts`. Added JSDoc comments to all 3 layer-specific Verification types pointing to canonical source. Invoice, Receipt, Shareholder already have canonical definitions in `types/index.ts` and `types/ownership.ts`.

---

## Page-by-Page Audit — Rapporter (2026-03-01)

### Rapporter → Resultaträkning

#### Critical Bugs

1. **Hardcoded calendar year — ignores brutet räkenskapsår** — `useFinancialReports` uses `new Date().getFullYear()` with Jan 1–Dec 31 dates. The `fiscalYearEnd` field exists in CompanyProvider but is never read. Companies with broken fiscal years (e.g. July–June) get wrong data.

2. **YoY comparison uses index-based matching** — `mergeComparativeData()` matches previous year items by array index, not account ID. If current year has an account the previous year didn't, every value after it shifts to the wrong row.

#### Improvements Needed

3. **Year slider UI** — Add left/right arrow navigation with fiscal year label in the center (e.g. "2024/2025" for broken years, "2026" for calendar years). Currently locked to current year with no way to browse history.

4. **Missing subtotal rows between sections** — The flat calculator shows Bruttoresultat, EBITDA, EBIT, EBT as intermediate rows, but the sectioned (collapsible) view doesn't render any subtotals between sections. Users lose important P&L context.

5. **No company-type adaptation** — All 5 company types get identical report structure. EF doesn't have aktiekapital; Förening has different equity structure. Report sections should adapt.

6. **Missing SUMMA rows** — No "Summa intäkter" / "Summa kostnader" grand totals before net income.

### Rapporter → Balansräkning

#### Critical Bugs

7. **Same fiscal year + YoY bugs as Resultaträkning** — Shares `useFinancialReports()` hook, inherits all the same issues (#1, #2, #3 above).

8. **Missing account range 2200–2299 (Avsättningar)** — Provisions (e.g. pension avsättningar) are not captured in any section. They silently vanish from the balance sheet.

#### Improvements Needed

9. **Subtitle shows today's ISO date but data is year-end** — Says "Per 2026-03-01" but the RPC fetches up to Dec 31. Should say "Per bokföringsdatum" or match actual query range.

10. **No SUMMA TILLGÅNGAR / SUMMA EK+SKULDER grand totals** — The sectioned view lacks the two summary rows that make a balance sheet readable. Users can't see at a glance if it balances.

11. **No balance check warning** — If assets ≠ equity + liabilities, nothing warns the user. Should show a prominent banner since an unbalanced balance sheet means something is wrong.

12. **No general AI analysis card** — Resultaträkning has both an AI analysis card and the report. Balansräkning only has Balanskontroll but no general "Analysera balansräkningen" option.

#### Founder Notes (Balansräkning)

- **Balanskontroll must be exhaustive and correct** — not limited to 8 checks. It must verify everything needed for a real company's balance sheet to be correct, based on all input from Bokföring. Zero tolerance for wrong or misleading results.
- **Visual balance indicator needed** — show whether assets = equity + liabilities at a glance.
- **Green SectionCard UI should be redesigned** — founder doesn't like the current green card for Balanskontroll. Needs a better UI treatment.
- **Year slider confirmed** — same left/right arrow year navigation as Resultaträkning.

### Rapporter → Momsdeklaration

#### Critical Bugs

13. **VAT calculator has incomplete account mappings** — Boxes 06/07 (12%/6% sales) use reverse calculation from VAT amount (`VAT / rate`) which is mathematically wrong. Boxes 08, 20-24, 30-32, 35-41, 50, 60-62 are completely unhandled.

14. **Wizard dialog zeroes out unmapped fields** — When saving, 20 of 33 rutor are set to 0. If a report had EU trade/import values, they get wiped on save.

15. **XML export not production-ready** — Placeholder Skatteverket namespace, missing declarant info, no digital signature, `generateVatXML()` only exports 7 of 33 fields. Would be rejected by Skatteverket.

16. **Bulk delete is local-state only** — Removes from React state but doesn't persist to DB. Page refresh brings deleted periods back.

17. **No transaction safety on save** — Report and period status updated in separate DB calls. Partial write risk.

18. **Wizard API payload mismatch** — Sends `period_start: baseData.period` (string "Q4 2024") but API expects `period_id` (UUID).

19. **Dual state management** — `vatPeriods` stored in both `useMemo` and `useState` with `useEffect` sync. Edits via `handleUpdateReport` update state copy that gets overwritten on next computation.

20. **Financial periods are read-only** — `/api/financial-periods` only has GET. No way to create periods if DB is empty.

21. **`vatFrequency` from company settings unused** — Company has monthly/quarterly/annually setting but page ignores it.

#### Architecture Changes (Founder Direction)

22. **Remove manual MomsWizardDialog entirely** — Momsdeklaration is too complex for beginners. The wizard has broken logic and incomplete field coverage anyway.

23. **Replace "Ny period" button with AI-driven flow** — Instead of opening wizard, the button should trigger `navigateToAI()` with a moms `PageContext` + `actionTrigger` + `autoSend: true`. The AI generates the momsdeklaration, user just confirms or asks AI to edit. Pattern already exists and works (see Balanskontroll on Balansräkning, and Ägare meeting docs).

24. **XML export must be real and complete** — This is a real accounting app (like Bokio). Skatteverket accepts iXML. All 33 rutor must be exportable with correct namespace, declarant info, and validation.

25. **VAT periods manual for MVP** — Auto-generation based on `vatFrequency` is the right long-term solution, but for MVP keep period creation manual to avoid errors.

#### Founder Notes (Momsdeklaration)

- **AI-driven does NOT mean broken logic is acceptable.** Removing the wizard is a UI change — the AI must have all the correct logic it needs behind it. The VAT calculator, account mappings, XML export, and all 33 rutor must be fully correct. The AI is the delivery mechanism for correct logic, not a workaround for incomplete logic.

### Rapporter → Inkomstdeklaration

#### Critical Bugs

26. **INK3 (Förening), INK4/N3A (HB), INK4/N3B (KB) not implemented** — 3 of 5 company types have zero tax declaration logic. Page shows AB's INK2 fields for all types, which is wrong.

27. **Koncernbidrag, loss carryforward, dividends hardcoded to 0** — Fields 3.19-3.20, 4.4-4.5, 4.14a-c are all zeros. Multi-year loss management and capital gains tracking are missing entirely.

28. **SRU export hardcodes fiscal year** — Uses `new Date().getFullYear() - 1` and assumes calendar year period format `2024P4`. Broken fiscal years get wrong period code.

29. **Status always shows "DRAFT"** — No tracking of whether the declaration has been submitted. Uses `INVOICE_STATUS_LABELS.DRAFT` regardless of actual state.

30. **`ink2-fields.ts` is dead code** — Only ~6 fields defined, not used by the processor.

31. **NE-bilaga periodiseringsfond hardcoded to 0** — R14/R15 always 0 on main page. Only editable inside wizard.

#### Improvements Needed

32. **All company type forms must be implemented** — INK2 (AB), NE-bilaga (EF), INK3 (Förening), INK4/N3A (HB), INK4/N3B (KB). All 5 needed at launch.

33. **Replace manual wizard with AI-driven flow** — Same pattern as Momsdeklaration. "Skapa deklaration" button triggers `navigateToAI()` with actionTrigger. AI generates the declaration, user confirms or asks AI to edit.

#### Founder Notes (Inkomstdeklaration)

- **Everything must be legally sound for Skatteverket.** When a user downloads the SRU file and submits it to the government, it must be valid and complete. No invalid data, no missing fields, no wrong period codes. This is non-negotiable.
- **All 5 company types must have working declarations at launch.** AB, EF, HB, KB, Förening — all need correct forms.
- **Loss carryforward, koncernbidrag, periodiseringsfonder — all must work.** These are standard tax features that real companies depend on.

### Rapporter → AGI (Arbetsgivardeklaration)

#### Critical Bugs

34. **Two duplicate XML generators** — `generateAgiXML()` (simple, used) and `generateAGIXML()` (eAGI schema, unused). Should consolidate to one correct iXML generator.

35. **XML namespace likely wrong** — Uses same placeholder as VAT export. Must match Skatteverket's actual AGI/eAGI schema. Output must be iXML, not plain XML.

36. **`individualData` smuggled via `as any` cast** — Per-employee data is not part of `AGIReport` interface. Accessed via unsafe cast in both hook and grid.

37. **Status always "pending"** — No mechanism to mark a period as submitted. No save/submit flow exists.

38. **Arrow button in grid does nothing** — No onClick handler, no detail view.

39. **Single flat employer contribution rate for all employees** — Sweden has reduced rates for under 26, over 65, and växa-stöd (first employee). Not handled.

40. **Förmånsvärde never calculated** — XML generator supports it but hook never populates it from benefit data.

#### Architecture Changes (Founder Direction)

41. **Remove AI SectionCard** — Redundant since "Ny period" button already triggers AI flow.

42. **Replace data grid with ListCard rows** — Current `<Table>` grid is inconsistent with the rest of Rapporter. Should match Momsdeklaration's `MomsList` pattern: `ListCard` with `ListCardItem` rows showing period, status badge, amount, deadline. Clicking a row opens a detail dialog for that specific AGI.

43. **iXML export required** — Same legal standard as all Skatteverket submissions. Must be valid iXML, not plain XML.

#### Founder Notes (AGI)

- **Consistency matters** — AGI table must look like the Momsdeklaration list rows, not a spreadsheet grid. Same UI pattern across all Rapporter pages.
- **Detail dialog on row click** — Clicking a period should open its full AGI detail (Huvuduppgift + Individuppgift breakdown).

### Rapporter → Årsredovisning

#### Critical Bugs

44. **Fiscal year hardcoded to calendar year minus 1** — `fiscalYear = currentYear - 1` with range `{year}-01-01 – {year}-12-31`. Ignores `fiscalYearEnd` from company settings.

45. **No previous year comparatives** — Swedish årsredovisning legally requires comparison with previous year. XBRL generator has the context structure but no data is passed.

46. **Förvaltningsberättelse and Noter are empty shells** — Preview shows placeholder items with value 0. No actual content generated.

47. **Resultatdisposition hardcoded** — `balanserat = 0` instead of fetching retained earnings from prior year. No dividend validation against ABL distributable equity.

48. **Balance sheet auto-patches mismatches silently** — If assets ≠ equity + liabilities, processor adds difference to equity instead of surfacing the error.

49. **Tax calculated as flat rate** — Doesn't account for periodiseringsfonder, koncernbidrag, or other adjustments that affect actual tax liability.

50. **Deadline hardcoded to "30 jun"** — Correct for calendar year companies only. Broken fiscal year = 7 months after fiscal year end.

51. **No company-type differentiation** — AB and Förening get identical output. Förening has different equity structure and reporting obligations.

52. **Print/Download buttons in preview dialog are stubs** — Do nothing when clicked.

#### Architecture Changes (Founder Direction)

53. **Replace wizard with AI-driven flow** — "Skapa årsredovisning" triggers `navigateToAI()`. AI generates the full report including Förvaltningsberättelse narrative. User confirms or asks AI to edit.

54. **iXBRL export must be production-ready for Bolagsverket** — No mock data, no placeholders. Real company data, legally sound, directly uploadable to Bolagsverket's filing system. Government must be satisfied when it's filed.

55. **K2 is sufficient for MVP** — Target: AB with up to ~10 employees. K3 (larger companies) is postponed.

#### Founder Notes (Årsredovisning)

- **K2 only for now.** Whatever a small AB with ~10 employees needs, we support. Anything beyond that is postponed.
- **Real exports only.** When a user downloads the iXBRL file and files it with Bolagsverket, it must be accepted. No mock data, no placeholder text.

### Rapporter → Årsbokslut

#### Critical Bugs

56. **Fiscal year hardcoded to calendar year minus 1** — Same as Årsredovisning. Ignores `fiscalYearEnd`.

57. **Company type detection is string matching** — `companyTypeName.includes('enskild') ? 'EF' : 'AB'` — falls through to 'AB' for HB and KB. Wrong equity handling for partnerships.

58. **Missing account ranges in balance sheet** — 1400-1499 (Lager/Inventory) not shown. 2100-2399 (Obeskattade reserver, Avsättningar, Långfristiga skulder) not shown. Accounts in these ranges silently vanish.

59. **"Visa detaljer" button does nothing** — No onClick handler, dead UI.

60. **`window.confirm()` for creating closing entries** — Browser native dialog for a critical accounting operation. Should be a proper modal.

61. **Two conflicting export buttons** — Header "Exportera" calls `window.print()`, toolbar "Exportera PDF" uses `downloadElementAsPDF`. Pick one.

62. **Subtitle hardcoded to "enskild firma"** — Page serves EF, HB, and KB but always says "enskild firma".

63. **Sign convention inconsistent** — Some balances flipped with `* -1`, some not. Hard to follow, error-prone.

#### Architecture Changes (Founder Direction)

64. **AI generates → stored in table → booking wizard popup** — "Generera" triggers AI to create the årsbokslut. Result is saved to DB. Then the booking wizard appears for the user to confirm the closing entries (Serie Y verifications). User can book immediately or postpone (book an hour or day later).

65. **Adapt title/subtitle per company type** — Show "Enskild firma" / "Handelsbolag" / "Kommanditbolag" as appropriate. Report logic must also differ: HB shows equity per partner, KB separates komplementär vs kommanditdelägare equity.

#### Founder Notes (Årsbokslut)

- **Generate and book are separate steps.** AI generates the report, it gets stored, then booking wizard appears. User decides when to book — now or later.
- **Booking wizard popup on stored result** — same pattern should work across all report types where accounting entries are created from a report.

### Rapporter → K10

#### Critical Bugs

66. **Only handles the primary (first) shareholder** — `shareholders[0]` used for all calculations. Multiple qualified owners each need their own K10 — currently impossible.

67. **Dividend detection uses only account 2898** — Dividends can also be booked on 2091 (Balanserat resultat) or other equity accounts. Could miss dividends entirely.

68. **Owner salary detection uses only account 7220** — Some companies use 7210 or other 72xx accounts. Could undercount, causing lönekrav to falsely appear unmet.

69. **SRU field codes appear made up** — Uses sequential 100-800 instead of Skatteverket's actual K10 blankett field numbering. SRU export would be rejected.

70. **Lönekrav failure message shows "Minst 0 kr"** — Actual minimum amount not passed to the breakdown component.

71. **No uppräkning on sparat utdelningsutrymme** — Swedish law allows uplift by statslåneräntan + 3 percentage points. Not calculated.

72. **Status always shows DRAFT** — Ignores actual status from database.

#### Architecture Changes (Founder Direction)

73. **Replace wizard with AI-driven flow** — "Skapa blankett" triggers `navigateToAI()`. AI generates K10, user confirms.

74. **Multi-shareholder support via dropdown selector** — Page header gets a shareholder dropdown (e.g. "Johan Svensson ▾"). Selecting a shareholder recalculates the entire page (ägarandel, lönekrav, gränsbelopp) for that person. SRU export generates K10 for the selected shareholder. Dropdown hidden if only one qualified owner.

75. **K10 history table format is fine** — Keep current GridTable layout (multiple numeric columns suit a table better than ListCard).

#### Founder Notes (K10)

- **Each qualified shareholder gets their own K10.** Not just the primary one.
- **Dropdown selector in header** — not arrow navigation (shareholders aren't sequential like years).
- **Equity structure must adapt per company type** across all report pages: EF = single owner equity (no shares), HB = equity split per delägare, KB = komplementär vs kommanditdelägare with different equity accounts.

---

## Page-by-Page Audit — Installningar (2026-03-01)

### Installningar — Overall Architecture

Settings is a modal dialog (not a page) with 10 tabs. Accessed from user avatar dropdown in sidebar.

#### Cross-cutting Issues

76. **Missing critical company fields in Settings UI** — `fiscalYearEnd`, `shareCapital`, `totalShares`, `shareClasses`, `hasFskatt`, `hasEmployees`, `hasMomsRegistration` all exist in CompanyProvider/DB but have no UI in Settings. `fiscalYearEnd` is the root cause of all brutet räkenskapsår bugs across Rapporter.

77. **Shared formData between Account and Company tabs** — Both tabs use the same `formData` state object. Saving in Account also saves company fields and vice versa. These should be independent.

78. **Settings ↔ Onboarding gap** — Onboarding collects share capital, shareholders, partners, theme, avatar, company type, company info. Not all of these are editable in Settings afterward.

### Installningar → Konto (Tab 1)

79. **No email validation** — accepts any string as email.
80. **No password management** — can edit email but can't change password.
81. **No delete account option.**

### Installningar → Företagsinformation (Tab 2)

82. **No fiscal year end field** — must be added. This is the most critical missing setting.
83. **No F-skatt toggle** — legally required on invoices.
84. **No aktiekapital / share structure fields** — K10 needs these. Only settable during onboarding.
85. **No registration date field.**
86. **No hasEmployees / hasMomsRegistration toggles** — exist in DB, no UI.
87. **Fåmansföretag checkbox uses raw HTML `<input>`** instead of app's Checkbox component.
88. **Logo upload error uses `alert()`** instead of toast.
89. **SIE export hardcodes current year** instead of fiscal year.

### Installningar → Integrationer (Tab 3)

90. **Bank, Bankgirot, Swish are all stubs** — "Coming Soon" with no backend.
91. **Calendar URL generated but no actual feed backend.**

### Installningar → Fakturering (Tab 4)

Works well. Stripe integration is complete.

92. **Price "449 kr/månad" is hardcoded** — not dynamic from Stripe.

### Installningar → Notiser (Tab 5)

Toggles persist correctly.

93. **Mobile push toggle exists but no push infrastructure.**
94. **Email notifications toggle but Resend not configured** — emails don't actually send.

### Installningar → Utseende (Tab 6)

95. **Density selector stored but not applied** — no CSS responds to compact/normal/comfortable setting.

### Installningar → Språk & Region (Tab 7)

96. **Currency stored but not used** — app always shows SEK.
97. **Date format stored but not applied** everywhere.
98. **Only Swedish actually works** — EN, NO, DA, FI selectable but no translations exist.
99. **Text mode (enkel/avancerad) partial** — some translations exist, coverage incomplete.

### Installningar → E-post (Tab 8)

100. **Test email sends hardcoded dummy data** — always "Test Testson, 42,000 SEK".
101. **Keyboard shortcuts section doesn't belong here** — should be removed.

### Installningar → Tillgänglighet (Tab 9)

102. **All three toggles are non-functional** — persist to DB but no CSS/JS responds. Reduce motion, high contrast, larger text do nothing.

#### Founder Direction: Keep tab, mark toggles as "Kommer snart" instead of pretending they work.

### Installningar → Säkerhet & Sekretess (Tab 10)

103. **Entirely fake** — 2FA always shows "enabled" (hardcoded), sessions are hardcoded mockups ("MacBook Pro", "iPhone 15 Pro"), privacy toggles don't save.

#### Founder Notes: 2FA is buildable via Supabase Auth MFA (TOTP/authenticator apps). Resend can send backup codes via email but isn't the 2FA provider. For MVP this is nice-to-have, not critical.

### Architecture Changes (Founder Direction — Installningar)

104. **Add fiscal year end field to Company tab** — dropdown or date picker for MM-DD format. This unblocks all brutet räkenskapsår fixes across Rapporter.

105. **Settings must mirror onboarding** — everything collected in onboarding (company type, name, org number, share capital, shareholders reference, profile photo, theme) must be viewable and editable in Settings. Settings is how the app learns new information about the company after onboarding.

106. **Remove keyboard shortcuts from Email tab** — and remove the associated logic.

107. **Stripe billing must show real data** — user should see their actual subscription, usage, and billing history from Settings. Already mostly working.

108. **Accessibility tab: mark as "Kommer snart"** — don't remove, but don't fake functionality. Toggles should be disabled with a note.

109. **Security tab: either implement or remove** — showing fake "2FA enabled" is misleading. If not implementing for MVP, remove the tab entirely or show "Kommer snart".

#### Mock Data / Fake UI (must be removed)

110. **Security tab is 100% static HTML mockup** — 2FA shows green "enabled" (hardcoded, no API), sessions show "MacBook Pro" and "iPhone 15 Pro" in "Stockholm" (hardcoded strings, not from any session API), analytics toggle is `checked` with no state/save, "Manage" button has no onClick. A user would believe they have 2FA protection when they don't. This is actively misleading and must be either implemented or removed.

111. **Accessibility toggles pretend to work** — reduce motion, high contrast, larger text all persist to DB (real API calls) but no CSS/JS actually responds. User toggles "high contrast" and nothing changes. Must either implement or mark as "Kommer snart" with disabled toggles.

#### Founder Notes (Installningar)

- **Zero tolerance for mock data in Settings.** No hardcoded sessions, no fake 2FA status, no toggles that do nothing. If a feature isn't built, don't show it as working. Either implement it, show "Kommer snart", or remove it entirely.

### Sidebar User Dropdown — Mock Data

112. **Org number "556999-1234" is hardcoded** — `user-team-switcher.tsx` line 124 always shows this string. Not read from company data. Every user sees the same fake org number.

113. **Default team name "Mitt Företag" is hardcoded** — `app-sidebar.tsx` line 41. If `getTeams()` API fails or returns empty, this fallback shows. Should read from CompanyProvider.

114. **Two duplicate user dropdown components** — `nav-user.tsx` (old) and `user-team-switcher.tsx` (new, better). The old one always shows "Uppgradera till Pro" regardless of subscription. The new one correctly uses `<TierBadge>` and `useSubscription()`. The old component should be removed.

115. **Dropdown must show real data** — company name from CompanyProvider, org number from CompanyProvider, subscription tier from `useSubscription()`. No fallbacks that look like real data.

---

## Page-by-Page Audit — Händelser (2026-03-01)

### Architecture Change (Founder Direction): Restructure to 3 tabs

**Current:** 4 tabs — Månadsavslut, Kalender, Planering, Aktivitetslogg.
**New:** 3 tabs — **Översikt** (månadsavslut + deadlines), **Canvas** (merges roadmap + AI workspace), **Arkiv** (calendar + inline activity log).

See Phase 6 in Execution Plan for full design with visual mockups.

### Page 1: Översikt (formerly Månadsavslut)

#### Critical Bugs
116. **Hardcoded Jan-Dec calendar year grid** — `manadsavslut-view.tsx` always renders months 1-12 for a calendar year. Companies with brutet räkenskapsår (e.g. July-June) need their fiscal year months displayed, not calendar months. The checklist engine already respects `fiscalYearEnd` but the grid ignores it.

117. **`end_date` hardcoded to day 28** — `use-month-closing.ts:164` upserts `end_date: '...-28'` for all months. March has 31 days, April has 30, etc. Period records have wrong end dates.

118. **Two independent locking mechanisms not synced** — POST `/api/manadsavslut` sets `is_locked: true` on verifications by date range. `useMonthClosing().lockPeriod()` writes `status: 'closed'` to `financialperiods` table. These don't know about each other — locking via one doesn't update the other, leading to inconsistent state.

#### Improvements Needed
119. **Add lock/unlock button** — `lockPeriod()` and `unlockPeriod()` exist in `useMonthClosing()` but no UI calls them. Add "Stäng period" / "Öppna period" button, gated behind checklist being 100% complete. Must sync both locking mechanisms (verification `is_locked` + financialperiods `status`).

#### Architecture Change (Founder Direction): Smart auto-checklist

**Current checklist is manual toggles** — user ticks "Momsdeklaration inlämnad" themselves. No connection to actual document status.

**Redesign:** Checklist items should query real document statuses from the database:
- If quarterly VAT month → auto-check: does a `taxreports` row exist for this quarter with status 'Inskickad'?
- If has employees → auto-check: does an AGI exist for this month? Are payslips generated and marked as paid?
- If fiscal year end month → auto-check: does an årsredovisning/årsbokslut exist?
- Each check reads the actual `status` field on the relevant document (most already have statuses like 'Inskickad', 'Utkast', 'Betald', etc.)

**Benefits:**
- Almost all checks become **auto** instead of manual — the system reads real data
- Forces users to update document statuses (good habit, and the statuses already exist)
- Checklist shrinks/expands dynamically per company type, VAT frequency, and month — the checklist engine (`checklist-engine.ts`) already has this logic, just needs to be wired to document queries instead of manual toggles
- Different organisations file at different dates/quarters/months — the engine already handles this via `isVatMonth()` and `isFiscalYearEndMonth()`

#### Founder Notes (Månadsavslut)
- Revenue/expense grouping (4000-8999 as "expenses") is fine for MVP — a burger stand doesn't care about interest income separation
- No bank API exists so bank reconciliation auto-check is not possible — keep as manual or remove for MVP

### Page 2: Kalender (merging into Månadsavslut dashboard)

#### Existing Functionality to Preserve
- Calendar grid with Monday-start Swedish weekdays, event badges, O(1) lookup via hash map
- Day detail dialog with event list + per-day notes (debounced auto-save)
- This becomes a drill-down from the month grid in the merged dashboard

#### Bugs to Fix
120. **`availableYears` limited to 3 years** — `use-handelser-logic.ts:12` only allows current year ±2. Should be dynamic based on actual event/verification dates.

121. **Day detail dialog navigation locked to current month** — `day-detail-dialog.tsx:107-109` prev/next stops at month boundaries. Should allow crossing into adjacent months.

#### Architecture Issue
122. **Two parallel audit trail systems** — `events` table (used by Kalender via `useEvents()`) and `activity_log` table (used by Aktivitetslogg via `useActivityLog()`) are completely separate data sources tracking overlapping actions. When merging tabs, unify into one system or create clear separation with cross-linking.

123. **`useEvent()` fetches ALL events for single lookup** — `use-events.ts:190` calls `getEvents()` then filters client-side. Should use `.eq('id', id).single()`.

124. **`getEventCountsBySource()` makes 5 separate count queries** — Should be a single RPC or group-by.

### Page 3: Aktivitetslogg (merging into Månadsavslut dashboard)

#### Existing Functionality to Preserve
- Real-time via Supabase `postgres_changes` — new entries prepend automatically
- Rich action icons (16 types), entity deep-links, pagination with "Visa mer"
- This becomes the "recent activity" section within the month detail panel

#### Improvements Needed
125. **Activity log missing entity types** — Only tracks: transactions, invoices, receipts, verifications, payslips, employees, shareholders, companies, profiles. Missing: roadmaps, taxreports, financialperiods, benefits, inventarier.

### Page 4: Planering (Roadmap)

#### Bugs
126. **`onCreateNew` prop explicitly unused** — `roadmap-view.tsx:218` aliases as `_onCreateNew`. Empty state has no create button.

127. **localStorage fallback silently hides DB errors** — `roadmap-service.ts` catches Supabase errors and falls back to localStorage without telling the user. Roadmaps created offline won't sync across devices.

128. **Manual wizard creates 3 hardcoded placeholder steps** — `action-wizard/index.tsx:69-73` always inserts "Planering", "Förberedelser", "Genomförande" regardless of user input. Title and description are saved but steps have zero relation to the goal.

129. **`generate_roadmap_suggestions` is hardcoded templates, not AI** — Keyword-matches against 3 templates ("hire", "start AB", generic). Doesn't use AI to generate steps.

130. **`roadmap-detail.tsx` is dead code** — Exported but never rendered anywhere.

#### Improvements Needed
131. **Step status limited to pending ↔ completed** — Types and step icons support 'in_progress' and 'skipped' but UI only toggles between two states. AI tools can set all 4 statuses but the UI can't.

132. **No roadmap editing** — Can't rename roadmap, edit step titles, add/remove/reorder steps, or change description after creation.

133. **No due dates from wizard** — `RoadmapStep` type supports `due_date` and stepper renders it, but wizard never sets them.

134. **ActionWizard lives in wrong directory** — `@/components/agare/action-wizard` is the ownership section. Roadmap wizard should be in `@/components/handelser` or shared.

#### Architecture Change (Founder Direction): Link plans to source documents

Add a "Skapad från" link on each roadmap card showing which AI conversation or Canvas document generated the plan. The `Roadmap` type already has `metadata` (JSONB) — store `{ source_type: 'canvas' | 'chat', source_id: string }` there and render as a clickable link.

### Page 5: Canvas (NEW — Founder Direction)

**New tab** in Händelser alongside Månadsavslut and Planering.

Canvas is a long-format AI workspace — like a document/scratchpad where the AI can write detailed responses, analyses, examples using real app data, step-by-step breakdowns, etc. Unlike the chat sidebar (quick Q&A), Canvas is for deep work.

**Key characteristics:**
- Temporary/ephemeral — like a conversation, not persistent planning (that's what Planering is for)
- Long-format — the AI can write full documents, not just chat bubbles
- Can reference real company data — "Analysera min kostnadsbild Q1-Q3 med mina faktiska siffror"
- Can link out to Planering — if the AI produces a plan in Canvas, user can save it as a Roadmap

**To be designed and built from scratch.**

### Cross-Cutting Issues (Entire Händelser Page)
135. **Year selector hardcoded to calendar years** — Should show fiscal years for brutet räkenskapsår companies.

#### Founder Notes (Händelser)
- Händelser becomes **3 tabs**: Översikt, Canvas, Arkiv
- Översikt = existing Månadsavslut (month grid + checklist) + a deadlines list below. No major UI change needed.
- Canvas merges with Roadmap — a canvas is a rendered markdown document. AI writes it (plans, analyses), user checks off boxes, AI reads updated state and gives advice. Two views: card grid (list) and full markdown render (detail). Simple CRUD on a text column.
- Arkiv = calendar + inline activity log. Click a day, see what happened. No popup dialog — activity shows inline below the calendar.
- "Min Plan" concept is retired — Canvas covers this
- The "idag" (today) smart feed with transactions/actions is a **post-Tink feature** (end of 2026 at earliest). Without bank API, users upload and book in one session so "unbooked transactions" won't accumulate. For MVP the Översikt is just månadsavslut + deadlines.

---

## Production Readiness Assessment (2026-03-01)

**Overall: ~35-40% production-ready** across the 3 audited categories (Rapporter, Installningar, Händelser).

### Tier 1 — Launch Blockers (must fix or users/government will reject)

These would get the app rejected by Skatteverket, mislead users, or cause legal liability:

- **All government exports are fake** — iXML (VAT, AGI), SRU (Inkomstdeklaration, K10), iXBRL (Årsredovisning) are placeholder structures. None would pass Skatteverket or Bolagsverket validation.
- **Only AB is supported** — EF, HB, KB, Förening are missing across Inkomstdeklaration, Årsbokslut, Årsredovisning. That's 3 of 5 company types with no reports.
- **Fiscal year ignored everywhere** — Every report, hook, and grid hardcodes calendar year. A company with brutet räkenskapsår gets wrong data on every page.
- **Security tab is actively misleading** — Shows 2FA as "enabled" with fake sessions. Users believe they're protected when they're not.
- **Hardcoded company data** — Org number "556999-1234", "Mitt Företag" in sidebar. Every user sees the same fake identity.
- **VAT calculator incomplete** — Boxes 06/07 wrong formula, boxes 08, 20-24, 30-32, 35-41, 50, 60-62 unhandled. A submitted moms declaration would be incorrect.
- **Two locking systems that don't sync** — Period can appear "closed" with unlocked verifications or vice versa.

### Tier 2 — Core Functionality Gaps (app works but features are hollow)

- No lock/unlock button for months (function exists, no UI)
- Checklist is manual toggles disconnected from real data
- Roadmap wizard creates useless placeholder steps
- AI suggestion tool is hardcoded templates not actual AI
- Duplicate user dropdown components
- Activity log missing half the entity types
- Dual event systems (events table + activity_log table)
- No roadmap editing after creation
- YoY comparison uses index-based matching (wrong data)
- Balance sheet missing account range 2200-2299

### Tier 3 — UX/Polish (not blocking but rough)

- Year slider needed (arrows + year in middle)
- Calendar limited to 3 years
- Day dialog can't cross month boundaries
- Tab merging (4 → 3 in Händelser)
- Canvas (new feature, not built)
- Dead code (roadmap-detail.tsx, duplicate components)
- ActionWizard in wrong directory

### By Category

| Category | Production Ready | Blocking Issues | Total Issues |
|---|---|---|---|
| Rapporter | ~25% | Exports, company types, fiscal year, VAT calc | ~95 |
| Installningar | ~50% | Fake security, hardcoded data, missing fields | ~20 |
| Händelser | ~55% | Locking broken, checklist disconnected | ~20 |

---

## Execution Plan

**IMPORTANT: Pages are NOT being removed. The `AI_NATIVE_REDESIGN.md` vision is DEPRECATED. Sidebar stays. Pages stay. AI assists on existing pages via the `navigateToAI()` + `actionTrigger` pattern — AI generates content, user confirms. Pages are the UI, AI is the engine.**

**Dependency graph:** Phase 1 unblocks everything. Phase 2A-2G are independent tracks within Phase 2. Phase 3 depends on Phase 1 only. Phase 4 is independent polish.

---

### Phase 1 — Foundation ✅ COMPLETED (2026-03-01)

**Implemented:** Fiscal year selector in settings, fiscal year consumed in financial reports hook + månadsavslut route, locking sync to financialperiods table, fake data cleanup (org number, security tab, plan badges), all missing company fields in settings UI (F-skatt, moms, anställda, registreringsdatum, aktiekapital, antal aktier), hasFskatt save fix in CompanyProvider.

#### 1.1 Fiscal Year End — make it configurable and consumed

**Why first:** 29 files reference `fiscalYearEnd`. Every report, hook, and grid hardcodes calendar year. One utility function unblocks all of Rapporter.

**Step 1: Add settings UI field**
- `src/components/installningar/tabs/` — add fiscal year end picker (MM-DD dropdown) to Company tab
- `src/services/settings-service.ts` — ensure `fiscalYearEnd` is included in save/load
- Migration: add `fiscal_year_end` column to `companies` table if not already present (check schema)

**Step 2: Create shared fiscal year utility**
- `src/lib/fiscal-year.ts` (new) — one canonical utility:
  - `getFiscalYearRange(fiscalYearEnd: string, referenceDate?: Date): { start: Date, end: Date }`
  - `getFiscalYearLabel(fiscalYearEnd: string, referenceDate?: Date): string` (e.g. "2025/2026" for broken, "2026" for calendar)
  - `getFiscalMonths(fiscalYearEnd: string): number[]` (ordered month indices for grid)
  - `isFiscalYearEnd(month: number, fiscalYearEnd: string): boolean`
- Unit test this utility — it's the foundation for all reports

**Step 3: Wire into consumers (29 files, but most are the same pattern)**
- `src/hooks/use-financial-reports.ts` — replace `new Date().getFullYear()` + Jan 1/Dec 31 with `getFiscalYearRange()`
- `src/hooks/use-month-closing.ts` — use fiscal months for grid, fix `end_date` hardcoded to day 28
- `src/components/handelser/manadsavslut-view.tsx` — render fiscal year months, not calendar Jan-Dec
- `src/components/rapporter/arsbokslut.tsx` — replace `currentYear - 1` with fiscal year
- `src/components/rapporter/arsredovisning.tsx` — same
- `src/components/rapporter/k10/` — same
- `src/services/processors/inkomstdeklaration-sru-processor.ts` — fix period code format
- `src/hooks/use-self-employment-tax.ts` — filter verifications by fiscal year
- `src/components/handelser/use-handelser-logic.ts` — year selector shows fiscal years

#### 1.2 Sync locking mechanisms

**Problem:** POST `/api/manadsavslut` sets `is_locked: true` on verifications. `useMonthClosing().lockPeriod()` writes `status: 'closed'` to `financialperiods`. They don't know about each other.

**Step 1: Choose canonical source** — `financialperiods` table is the right answer (it's the dedicated period table)

**Step 2: Update lock logic**
- `src/hooks/use-month-closing.ts` — `lockPeriod()` should:
  1. Set `financialperiods.status = 'closed'`
  2. Set `is_locked = true` on all verifications within the period date range
  3. Both in a single API call
- `src/app/api/manadsavslut/route.ts` — POST handler should call the same unified lock function, not its own separate path
- `src/lib/bookkeeping/utils.ts` — `checkPeriodLocked()` should only check `financialperiods` (already does this, verify)

**Step 3: Add lock/unlock button to UI**
- `src/components/handelser/manadsavslut-view.tsx` — add "Stäng period" / "Öppna period" button per month card
- Gate behind checklist 100% completion (or allow override with warning)
- `unlockPeriod()` reverses both: `financialperiods.status = 'open'` + `is_locked = false` on verifications

#### 1.3 Remove fake/mock data

**Zero tolerance — each is a quick, independent fix:**

| # | File | What to fix | Action |
|---|------|-------------|--------|
| a | `src/components/layout/user-team-switcher.tsx:124` | Hardcoded org number "556999-1234" | Read from CompanyProvider |
| b | `src/components/layout/app-sidebar.tsx:41` | Hardcoded "Mitt Företag" fallback | Read from CompanyProvider, show loading state if empty |
| c | `src/components/installningar/tabs/` (Security tab) | Fake 2FA "enabled", hardcoded sessions | Replace entire tab with "Kommer snart" message, or remove tab |
| d | `src/components/installningar/tabs/` (Accessibility tab) | Toggles persist but do nothing | Disable toggles, add "Kommer snart" label |
| e | `src/components/layout/nav-user.tsx` | Old duplicate user dropdown, shows "Uppgradera till Pro" always | Delete file, ensure `user-team-switcher.tsx` is the only dropdown |
| f | `src/components/installningar/tabs/` (Email tab) | Keyboard shortcuts section doesn't belong | Remove the shortcuts section |

#### 1.4 Add missing company fields to Settings

**Files:** `src/components/installningar/tabs/` (Company tab — likely `settings-tabs.tsx` or a file inside `tabs/`)

**Fields to add (all exist in DB/CompanyProvider, just no UI):**
- `fiscalYearEnd` — MM-DD picker (from 1.1)
- `hasFskatt` — toggle (required on invoices, PDF generation reads this)
- `shareCapital` / `totalShares` — number inputs (AB only, needed for K10, aktiebok)
- `hasEmployees` — toggle (gates Löner tabs)
- `hasMomsRegistration` — toggle (gates Momsdeklaration)
- `registrationDate` — date picker

**Conditionally show by company type:**
- AB: shareCapital, totalShares, fåmansföretag checkbox (already exists but uses raw HTML)
- EF: F-skatt toggle
- All: fiscalYearEnd, registrationDate, hasEmployees, hasMomsRegistration

---

### Phase 2 — Reports That Work (legal compliance) ✅ DONE (2026-03-06)

Each sub-phase is independent. Can be parallelized.

#### 2A. Fix VAT Calculator + iXML Export (Momsdeklaration) ✅ DONE (2026-03-06)

**Priority: Highest in Phase 2** — VAT is filed monthly/quarterly, most frequent government interaction.

**Step 1: Fix account mappings for all 33 rutor**
- `src/services/vat-service.ts` or `src/services/processors/vat/` — this is where the VAT calculator lives
- Fix boxes 06/07: reverse calculation from VAT amount is wrong, should sum account ranges for 12%/6% sales
- Implement boxes 08, 20-24 (EU acquisitions/services), 30-32 (imports), 35-41 (EU/export sales), 50 (tax to pay/reclaim), 60-62 (corrections)
- Create `src/lib/vat-boxes.ts` (new) — canonical mapping: `{ box: number, accounts: string[], formula: 'sum' | 'reverse_vat' | 'computed', signConvention: 1 | -1 }`
- Test with known correct VAT declarations (use actual Skatteverket examples)

**Step 2: Fix wizard dialog**
- `src/components/rapporter/dialogs/` — wizard should not zero out unmapped fields on save
- Fix API payload: send `period_id` (UUID), not `period_start: "Q4 2024"`

**Step 3: Build real iXML export**
- `src/services/processors/vat/` — replace placeholder XML generator
- Must use Skatteverket's actual namespace and schema
- All 33 rutor must be present in output
- Include declarant info (org number, company name)
- Research: fetch Skatteverket's iXML schema spec for momsdeklaration

**Step 4: Remove manual MomsWizardDialog (founder direction)**
- Replace "Ny period" button with `navigateToAI()` trigger
- AI generates momsdeklaration, user confirms
- Keep the VAT calculator logic — AI calls it, just removes the manual wizard UI

#### 2B. Fix AGI + iXML Export ✅ DONE (2026-03-06)

**Step 1: Consolidate XML generators**
- `src/services/processors/` — merge `generateAgiXML()` and `generateAGIXML()` into one
- Use Skatteverket's actual eAGI iXML schema
- Include per-employee individuppgift (name, personnummer, gross, tax, benefits)

**Step 2: Fix employer contribution rates**
- Handle reduced rates: under 26 (10.21%), over 65 (10.21%), växa-stöd (first employee, 10.21%)
- Read employee age from `personal_number` (first 8 digits = birthdate)

**Step 3: Fix data model**
- `src/components/rapporter/agi/` — add `individualData` to `AGIReport` interface properly (remove `as any` cast)
- Add status tracking (draft → submitted)
- Wire `förmånsvärde` from benefit data into AGI calculation

**Step 4: UI consistency**
- Replace `<Table>` grid with `ListCard` + `ListCardItem` pattern (match Momsdeklaration)
- Add row-click → detail dialog (Huvuduppgift + Individuppgift breakdown)
- Remove redundant AI SectionCard

#### 2C. Fix Inkomstdeklaration (all 5 company types) ✅ DONE (2026-03-06)

**Step 1: Implement missing company type forms**
- `src/components/rapporter/inkomstdeklaration.tsx` — currently only renders INK2 (AB) fields
- `src/components/rapporter/ne-bilaga.tsx` — EF form exists but has gaps (periodiseringsfond R14/R15 hardcoded to 0)
- New: INK3 (Förening) — needs new processor in `src/services/processors/`
- New: INK4/N3A (HB) — partner-level income declaration
- New: INK4/N3B (KB) — separate komplementär/kommanditdelägare handling
- `src/components/rapporter/constants.ts` — already has company type filtering, just needs the actual components

**Step 2: Fix existing INK2/NE**
- Loss carryforward (fields 3.19-3.20, 4.4-4.5) — needs `previousYearLoss` from prior year's saved report
- Koncernbidrag (4.14a-c) — needs company setting or manual input
- Periodiseringsfonder — wire `src/services/processors/periodiseringsfonder-processor.ts`
- Dividends — fetch from actual dividend records, not hardcode 0
- NE-bilaga: fix R14/R15 to read periodiseringsfonder, fix egenavgifter to use correct formula

**Step 3: Fix SRU export**
- `src/services/processors/inkomstdeklaration-sru-processor.ts` — replace made-up field codes with Skatteverket's actual blankett field numbers
- Fix fiscal year period code (use utility from 1.1)
- Ensure each company type exports its own SRU format

**Step 4: Replace wizard with AI-driven flow**
- "Skapa deklaration" button → `navigateToAI()` with company-type-specific actionTrigger

#### 2D. Fix Årsredovisning (K2) ✅ DONE (2026-03-06)

**Step 1: Fix data generation**
- `src/services/processors/annual-report-processor.ts`:
  - Use fiscal year range (utility from 1.1) instead of `currentYear - 1`
  - Fetch previous year comparatives (legally required)
  - Generate real Förvaltningsberättelse content (AI-generated based on company activity)
  - Generate real Noter content (accounting policies, employee count, etc.)
  - Fix Resultatdisposition: fetch balanserat resultat from ledger
  - Remove silent balance-patching (surface the error instead)
  - Calculate tax with periodiseringsfonder/koncernbidrag adjustments

**Step 2: Company type differentiation**
- AB vs Förening have different equity structures and reporting obligations
- EF/HB/KB don't file årsredovisning (they file årsbokslut) — gate this page to AB + Förening only

**Step 3: Build real iXBRL export**
- Research Bolagsverket's iXBRL filing format and taxonomy
- Replace placeholder XBRL generator with production-ready output
- K2 scope only (small AB, ≤10 employees)

**Step 4: Replace wizard with AI-driven flow**
- "Skapa årsredovisning" → `navigateToAI()`, AI generates including narrative sections

#### 2E. Fix Årsbokslut (EF/HB/KB) ✅ DONE (2026-03-06)

**Step 1: Fix data generation**
- `src/components/rapporter/arsbokslut.tsx`:
  - Use fiscal year range (utility from 1.1)
  - Fix company type detection: replace string matching with CompanyProvider `companyType`
  - Add missing account ranges: 1400-1499 (Lager), 2100-2399 (Obeskattade reserver, Avsättningar, Långfristiga skulder)
  - Fix sign convention consistency

**Step 2: Company type differentiation**
- EF: single owner equity
- HB: equity per delägare (per partner split)
- KB: komplementär vs kommanditdelägare equity separation
- Update subtitle per company type (currently hardcoded "enskild firma")

**Step 3: AI-driven flow with booking wizard**
- "Generera" → AI creates the årsbokslut → saved to DB
- BookingWizardDialog pops up for closing entries (Serie Y verifications)
- Replace `window.confirm()` with proper modal
- Resolve duplicate export buttons (pick `downloadElementAsPDF`, remove `window.print()`)

#### 2F. Fix K10 (3:12 rules) ✅ DONE (2026-03-06)

**Step 1: Multi-shareholder support**
- `src/components/rapporter/k10/` — add shareholder dropdown selector in header
- Recalculate entire page per selected shareholder (ägarandel, lönekrav, gränsbelopp)
- SRU export generates K10 for selected shareholder

**Step 2: Fix calculations**
- Dividend detection: scan accounts 2898, 2091, 2098 (not just 2898)
- Owner salary detection: scan 7210-7229 range (not just 7220)
- Add uppräkning on sparat utdelningsutrymme (statslåneräntan + 3%)
- Add räntebaserat utrymme (currently missing, AI tool has it)
- Reconcile UI hook with AI tool `optimize_312` — one canonical calculation function

**Step 3: Fix SRU field codes**
- Replace sequential 100-800 with Skatteverket's actual K10 blankett field numbers
- Fix status tracking (currently always DRAFT)

**Step 4: Replace wizard with AI-driven flow**
- "Skapa blankett" → `navigateToAI()`

#### 2G. Financial statements shared fixes ✅ DONE (2026-03-06)

**YoY comparison** (affects Resultaträkning + Balansräkning):
- `src/hooks/use-financial-reports.ts` — `mergeComparativeData()` must match by account ID, not array index

**Balance sheet completeness:**
- Add account range 2200-2299 (Avsättningar) to balance sheet sections

**Subtotals and grand totals:**
- Resultaträkning: add Summa intäkter, Summa kostnader, subtotals between sections
- Balansräkning: add SUMMA TILLGÅNGAR, SUMMA EK+SKULDER, balance check warning if they differ

---

### Phase 3 — Bokföring Core (write layer that actually works) ✅ DONE (2026-03-07)

#### 3A. Fix Transaktioner

**Step 1: Fix API route**
- `src/app/api/transactions/route.ts`:
  - Add POST handler (currently returns 405)
  - Fix response shape: return `{ transactions: [...] }` not `{ data: [...] }`
  - Implement query params: `limit`, `startDate`, `status`, `missingReceipt`

**Step 2: Fix data paths**
- Consolidate to one data path: API routes via `user-scoped-db.ts` (not direct Supabase client in hooks)
- `src/services/transactions.ts` — fix currency locale (use sv-SE, not en-US)
- Remove duplicate selection systems (`useTransactionSelection` vs `useBulkSelection`)

**Step 3: Fix UX (founder direction)**
- `src/components/bokforing/dialogs/ny-transaktion.tsx` — strip to 3 fields (namn + belopp + datum) + preview step
- `src/components/bokforing/transaktioner/index.tsx` — two separate buttons (Manuell / Ladda upp fil) instead of tab toggle
- Auto-open BookingDialog after transaction creation
- Fix row click to open booking dialog (currently just toggles selection)

**Step 4: Fix period lock bypass**
- Route `/api/transactions/[id]/book` must check period lock before allowing booking

#### 3B. Fix Verifikationer

**Step 1: Wire page to real data**
- `src/components/bokforing/verifikationer/` — `useVerificationsLogic()` must use `useVerifications()` hook (which fetches from `/api/verifications`), not derive from transactions
- Display BFL series number (A1, A2...) instead of UUID in "Nr" column

**Step 2: Canonical Verification type**
- Create one shared type in `src/types/` with `entries[]`, `series`, `number` fields
- Replace the three incompatible types (hook, component, service)

**Step 3: Fix API performance**
- `GET /api/verifications` — single JOIN query instead of N+1 per verification

**Step 4: Remove manual tab (founder direction)**
- `src/components/bokforing/verifikationer/auto-dialog/index.tsx` — remove tab switcher
- Delete `ManualTab.tsx`
- Verification creation only via AI auto-booking or chat tool

#### 3C. Fix Fakturor

**Step 1: Fix broken routes**
- `src/app/api/supplier-invoices/[id]/status/route.ts` — add PUT handler (currently only POST, but UI sends PUT)
- Fix RLS: `useInvoicesPaginated` and `invoiceService` must use user-scoped client, not anonymous

**Step 2: Fix data integrity**
- Multi-VAT booking: fix `invoice.items` parsing (`{ lines: [], ... }` vs `InvoiceLineItem[]`)
- Invoice number: server should return the real number for preview (FAK-2026-0001), not let client generate F-0001
- Credit note: post journal entry to pending bookings (currently computed but never persisted)
- Payment: update invoice status to paid after booking

**Step 3: Fix types**
- Consolidate 5 `Invoice` type definitions into one canonical type
- Fix status casing: pick one convention (PascalCase or lowercase) across customer and supplier

#### 3D. Fix Kvitton

**Step 1: Fix broken paths**
- Create `POST /api/receipts/[id]/book` route (currently 404)
- Fix column names: `supplier` not `merchant`, `image_url` not `url`
- Fix file URLs: use `getReceiptSignedUrl()` instead of `getPublicUrl()` on private bucket
- Fix save: API route must read `imageUrl` key (not `attachment`)

**Step 2: Fix delete**
- `handleConfirmDelete` — call actual delete API, not just show toast

**Step 3: Remove features (founder direction)**
- Delete `match_receipt_to_transaction` AI tool
- Delete `linkToTransaction()` from receipt-service
- Remove manual tab from `UnderlagDialog` — upload+AI OCR only

#### 3E. Fix Inventarier

**Step 1: Fix ID generation**
- `inventarieService.addInventarie()` — use UUID, not `inv-${Date.now()}-random`

**Step 2: Fix RPC**
- `get_inventory_stats()` — use Swedish column names (`inkopspris`, `'aktiv'`)
- `company-statistics-service.ts` — same fix for asset count

**Step 3: Fix AI tools**
- `create_asset` — call `addInventarie()` on confirmation
- `book_depreciation` — create real verification
- `dispose_asset` — update status in DB

---

### Phase 4 — Löner (payroll that works) ✅ DONE (2026-03-06)

#### 4A. Fix Lönekörning

**Step 1: Unify verification path**
- Remove `skip_verification: true` from client-side `handleConfirmPayslip`
- All salary bookings go through pending bookings (like AI tool `run_payroll` already does)
- Remove direct `addVerification()` call from client

**Step 2: Fix data layer**
- Replace raw `fetch()` with React Query hook (`usePayslips()`)
- Import `Payslip` type from `payroll-service.ts` instead of defining locally

**Step 3: Add missing features**
- Add PUT endpoint `/api/payroll/payslips/[id]` for editing draft payslips
- Add status workflow UI: draft → paid (with confirmation warning that verification will be created)
- Add DELETE endpoint for draft payslips

#### 4B. Fix Förmåner

**Step 1: Fix data loading**
- Load assigned benefits from DB on mount (currently starts as empty `[]`)
- Reconcile `employee_benefits` / `employeebenefits` table schema — pick one, migrate

**Step 2: Fix assignment flow**
- `assign_benefit` AI tool — uncomment `assignBenefit` import, execute on confirm
- Delete handler — wire `onDelete` prop in `BenefitDetailsDialog`
- Fix company type: read from CompanyProvider instead of hardcoded 'AB'

**Step 3: Add API layer**
- Create `/api/benefits` route (currently all direct Supabase, bypassing API pattern)

#### 4C. Move Egenavgifter to Rapporter

**Step 1: Create canonical calculation function**
- `src/lib/egenavgifter.ts` (new) — correct formula: `profit × 0.75 × rate` (25% schablonavdrag per IL 16 kap 29§)
- Component breakdown (7 fee types) that sums to the total
- Shared by UI and AI tool

**Step 2: Move tab**
- Remove `egenavgifter` from `src/components/loner/constants.ts`
- Delete `src/components/loner/egenavgifter/`
- Add `egenavgifter` to `src/components/rapporter/constants.ts` (EF/HB/KB only)
- Create `src/components/rapporter/egenavgifter/` with wizard following moms/INK2 pattern

**Step 3: Fix booking**
- Correct account: debit **7533** (Egenavgifter), credit **2510** (Skatteskulder)
- Route through pending bookings, not direct `addVerification()`
- Add `'egenavgifter'` to `PendingBookingSourceType`
- Add duplicate booking prevention per month

**Step 4: Seed 2026 rates**
- Migration: add `egenavgifter_full` rate for 2026 to `tax_rates` table

#### 4D. Fix Delägaruttag (HB/KB)

**Step 1: Fix BAS accounts**
- Change from 2013/2018/2023/2028 scheme to 2071/2072/2073... (BAS standard for HB/KB)
- Store persistent partner-to-account mapping in DB (`account_base` column on partners table)

**Step 2: Fix partner index**
- Replace `p-(\d+)` regex with DB-stored account assignment
- Each partner gets a stable account number regardless of creation order

**Step 3: Fix legal content**
- Replace AB-specific legal info (förbjudet lån, ABL 21 kap) with HB-specific (Handelsbolagslagen)
- Add company type guard: block AB users from this page

---

### Phase 5 — Ägare (ownership layer) ✅ DONE (2026-03-07)

#### 5A. Reconcile split data stores

**The #1 cross-cutting issue in Ägare.** UI uses `corporate_documents`, AI tools use `shareholders`/`boardminutes`/`companymeetings`. Must pick one canonical source per entity.

**Decision:** Use the dedicated tables (`shareholders`, `boardminutes`, `companymeetings`) as canonical — they have proper columns and types. Rewrite `useCompliance()` to read from these tables instead of `corporate_documents`. Migrate existing `corporate_documents` data to the dedicated tables.

#### 5B. Fix Aktiebok

- Fix överkursfond account: 2097 → 2019
- Fix race condition on nyemission (await refetch before find)
- Track aktienummer ranges on transfer (ABL 5:2)
- Expose `acquisition_date` and `acquisition_price` from DB
- Use `share_transactions` table instead of deriving from verification descriptions
- Consolidate 4 Shareholder types into one

#### 5C. Fix Utdelning

- Fix dividend lifecycle: `bookDividend` must update document status + use real `dividends` table ID as sourceId
- Fix distributable equity: include accounts 2080 (Balanserat resultat) + current year net income
- Use orphaned `use-dividends.ts` (has correct ABL 17:3 formula) — replace inline equity scan
- Remove `payDividend` step (payment happens in bank, not app)
- Fix K10 owner salary account detection (scan 7210-7229 range)

#### 5D. Fix Möten & Protokoll

- Add "Lägg till beslut" form to MeetingViewDialog
- Wire "Spara & skapa kallelse" button (currently prop never passed)
- Fix AI tools to query `corporate_documents` (or vice versa after 5A reconciliation)

---

### Phase 6 — Händelser Redesign ✅ DONE (2026-03-08)

**Current:** 4 tabs — Månadsavslut, Kalender, Planering, Aktivitetslogg
**New:** 3 tabs — **Översikt**, **Canvas**, **Arkiv**

#### Tab Design (agreed 2026-03-07)

**Tab 1: Översikt** — "Vad behöver jag göra? Är månaden klar?"

Merges current Månadsavslut into a single dashboard. Keeps the 12-month grid as anchor.

```
┌─────────────────────────────────────────────────────────────┐
│                                                   ◄ 2026 ► │
│                                                             │
│  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐...┌─────┐    │
│  │ Jan ││ Feb ││ Mar ││ Apr ││ Maj ││ Jun │   │ Dec │    │
│  │  ●  ││  ●  ││  ◉  ││  ○  ││  ○  ││  ○  │   │  ○  │    │
│  │ 24  ││ 18  ││     ││     ││     ││     │   │     │    │
│  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘   └─────┘    │
│                                                             │
│  ┌─── Mars 2026 ─────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Verifikationer: 12    Intäkter: +84 200 kr            │ │
│  │  Avvikelser: 0         Kostnader: −52 100 kr           │ │
│  │                        Resultat: +32 100 kr            │ │
│  │                                                        │ │
│  │  Avstämningskoll                        3/5 klara      │ │
│  │  ☑ Alla transaktioner bokförda                         │ │
│  │  ☑ Löner utbetalda & bokförda                          │ │
│  │  ☐ Periodiseringar kontrollerade                       │ │
│  │  ☐ Avstämning bank ↔ bokföring                        │ │
│  │  ☐ Momsrapport kontrollerad                            │ │
│  │                                                        │ │
│  │                    [Öppna fullständig]  [Stäng månad]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ── Kommande deadlines ────────────────────────────────    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🟡  Moms Q1                        om 18 dagar       │ │
│  │  🟡  AGI mars                       om 5 dagar        │ │
│  │  ⚪  Årsredovisning 2025            om 114 dagar      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Components:
- Month grid (existing `ManadsavslutView` — unchanged)
- Month detail panel with summary + checklist (existing — unchanged)
- `DeadlinesList` (new) — simple list pulling from tax report due dates + financial periods

**Tab 2: Canvas** — "Planera och tänk"

Merges Roadmap into Canvas. A canvas is a rendered markdown document that both the user and AI can read/write. The AI writes plans/analyses, the user checks off boxes, the AI reads the updated state and gives advice.

Data model: `canvases` table (id, title, content TEXT as markdown, created_at, updated_at). AI tools: `create_canvas`, `update_canvas`, `get_canvas` — simple CRUD on a text column.

**List view** (default):
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Dina canvas                                  [ + Ny ]     │
│                                                             │
│  ┌───────────────────┐ ┌───────────────────┐               │
│  │ Vinstplan 2026    │ │ Skatteoptimering  │               │
│  │ 4/7 klara         │ │ AI-genererad      │               │
│  │ 3 mars            │ │ 1 mars            │               │
│  └───────────────────┘ └───────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detail view** (click a card → rendered markdown with interactive checkboxes):
```
┌─────────────────────────────────────────────────────────────┐
│  ← Tillbaka                                    🗑   │
│                                                             │
│  Vinstplan 2026                                             │
│  Skapad 3 mars • 4 av 7 klara                              │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  # Vinstplan för Burgarkungen AB                            │
│                                                             │
│  Baserat på din nuvarande omsättning (84 200 kr/mån)       │
│  och kostnadsstruktur. Målet är att öka marginalen          │
│  från 38% till 50% inom 6 månader.                         │
│                                                             │
│  ## Fas 1 — Minska svinn (mars)                            │
│                                                             │
│  ☑ Inventera råvaruförbrukning per vecka                    │
│  ☑ Byt leverantör för bröd (spara ~800 kr/mån)             │
│  ☐ Inför FIFO-system i kylen                               │
│                                                             │
│  ## Fas 2 — Öka snittköp (april)                           │
│                                                             │
│  ☑ Lägg till tillbehörsmeny (+15 kr/order)                  │
│  ☑ Lunchkombo med dryck                                     │
│  ☐ Testa helgfrukost (07-10)                               │
│                                                             │
│  ## Fas 3 — Sänk fasta kostnader (maj)                     │
│                                                             │
│  ☐ Omförhandla hyresavtal                                   │
│  ☐ Byt elavtal till rörligt                                 │
│                                                             │
│  ---                                                        │
│                                                             │
│  > 💡 Nästa steg: Du har klarat Fas 1 och 2 till           │
│  > stor del. Fokusera på FIFO-systemet denna vecka —        │
│  > det minskar svinn med uppskattningsvis 5-10%.            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Flow:
1. User asks AI: "Gör en plan för min burgarstånd"
2. AI creates a canvas row with markdown content (headings, `- [ ]` checkboxes)
3. Canvas tab shows rendered markdown — checkboxes are interactive
4. User checks boxes → updates markdown in DB (`- [ ]` → `- [x]`)
5. User asks AI: "Statusuppdatering" → AI reads canvas, sees progress, gives advice
6. "+ Ny" button either opens blank canvas or triggers AI chat

Delete is a small muted trash icon (Trash2) in the top-right header — consistent with the existing roadmap delete pattern. Not a prominent button.

**Tab 3: Arkiv** — "Vad hände den dagen?"

Calendar grid for browsing history. Click a day → activity log renders inline below (not a dialog popup). Dots on days with activity. Scroll to any month/year.

```
┌─────────────────────────────────────────────────────────────┐
│                                          ◄ Mars 2026 ►      │
│                                                             │
│  Mån    Tis    Ons    Tor    Fre    Lör    Sön              │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐               │
│  │    ││    ││    ││    ││    ││ 1  ││ 2  │               │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘               │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐               │
│  │ 3  ││ 4  ││ 5  ││ 6  ││▐7▐ ││ 8  ││ 9  │               │
│  │    ││ •  ││ •• ││    ││ •••││    ││    │               │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘               │
│  ...                                                        │
│                                                             │
│  ── 7 mars 2026 ───────────────────────────────────────    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  09:14  Verifikation A47 skapad                        │ │
│  │         Inköp kontorsmaterial, 2 450 kr                 │ │
│  │                                                        │ │
│  │  08:30  Faktura #2024-031 markerad betald              │ │
│  │         Kund AB, 12 500 kr                              │ │
│  │                                                        │ │
│  │  08:12  Inloggning                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  (empty day → "Ingen aktivitet denna dag")                  │
└─────────────────────────────────────────────────────────────┘
```

Components:
- Calendar grid (existing `EventsCalendar` — reused)
- Inline activity feed (existing `ActivityFeed` filtered by date — replaces `DayDetailDialog` popup)

#### 6A. Build Översikt tab

**Step 1: Restructure tabs**
- `src/components/pages/events-page.tsx` — change `viewTabs` from 4 tabs to 3: Översikt, Canvas, Arkiv
- `src/components/handelser/use-handelser-logic.ts` — update `ViewType` to `"oversikt" | "canvas" | "arkiv"`
- `src/components/handelser/index.ts` — update exports

**Step 2: Build DeadlinesList component**
- `src/components/handelser/deadlines-list.tsx` (new) — pulls upcoming deadlines from:
  - `taxreports` table (moms, AGI, INK due dates)
  - `financialperiods` table (month closing deadlines)
  - Computed dates (årsredovisning = 7 months after fiscal year end)
- Simple list with colored dots (🟡 = soon, 🔴 = overdue, ⚪ = far away)
- Each item shows: report name, days until deadline

**Step 3: Compose Översikt**
- Render `ManadsavslutView` (existing, unchanged) at top
- Render `DeadlinesList` below it
- Year nav stays in header (existing)

#### 6B. Build Arkiv tab

**Step 1: Inline day detail**
- Replace `DayDetailDialog` (popup) with inline `ActivityFeed` rendered below calendar
- Filter `ActivityFeed` by selected date
- Day click sets selected date state → activity feed updates

**Step 2: Wire calendar to activity log**
- `EventsCalendar` already has `onDayClick` — wire to set selected date
- Show dot indicators on days that have activity entries
- Pre-select today on load

**Step 3: Fix calendar limitations**
- `availableYears` — make dynamic based on actual event dates (currently hardcoded to 3 years)
- Day navigation — allow crossing month boundaries

#### 6C. Build Canvas tab

**Step 1: Data layer**
- Create `canvases` table (id UUID, user_id, company_id, title TEXT, content TEXT, created_at, updated_at)
- Or reuse existing `roadmaps` table — add `content` TEXT column for markdown, keep `steps` for backward compat
- Create `canvas-service.ts` with CRUD operations
- AI tools: `create_canvas`, `update_canvas`, `get_canvas`, `list_canvases`

**Step 2: List view**
- `src/components/handelser/canvas-view.tsx` (new) — card grid showing all canvases
- Each card: title, progress (count `- [x]` vs `- [ ]` in content), last updated date
- "+ Ny" button opens blank canvas or triggers AI via chat

**Step 3: Detail view**
- Markdown renderer with interactive checkboxes (toggle updates `content` column in DB)
- "← Tillbaka" returns to list view
- "🗑" small muted text in top-right header (with confirmation)
- Progress indicator in header ("4 av 7 klara")

**Step 4: AI integration**
- AI chat tool `create_canvas` writes markdown with `- [ ]` checkboxes to DB
- AI chat tool `get_canvas` reads content to give status updates
- AI chat tool `update_canvas` can append/modify canvas content
- Replace existing `generate_roadmap_suggestions` (hardcoded templates) with real AI canvas generation

#### What gets removed
- `"calendar"` tab — absorbed into Arkiv
- `"activity"` tab — absorbed into Arkiv (inline below calendar)
- `"manadsavslut"` tab — absorbed into Översikt (it IS the Översikt)
- `DayDetailDialog` as popup — replaced by inline activity feed in Arkiv

---

### Phase 7 — Polish & Cleanup ✅ DONE (2026-03-08)

#### 7A. Year slider UI ✅
- Created shared `YearSlider` component (`src/components/shared/year-slider.tsx`)
- Added optional `yearNav` prop to `TaxReportLayout`
- Wired into: Inkomstdeklaration, Årsredovisning, Årsbokslut, K10
- Replaced inline year nav in `events-page.tsx`

#### 7B. Unify event systems ✅
- Defined clear separation: `activity_log` = granular audit trail (who did what), `events` = company timeline (AI, system, authority)
- Documented architecture in `use-activity-log.ts` JSDoc

#### 7C. Dead code removal ✅
- Deleted: `ManualTab.tsx`, `verifikation.tsx`, `roadmap-detail.tsx`, `asset-service.ts`, `ink2-fields.ts`, `/api/transactions/processed`, `/api/invoices/processed`
- Cleaned barrel exports in `services/index.ts`, `handelser/index.ts`, `bokforing/index.ts`
- Removed commented-out import in `inkomstdeklaration-processor.ts`
- Kept `/api/receipts/processed` and `/api/supplier-invoices/processed` (have active POST callers)
- `nav-user.tsx` was already deleted in a prior phase

#### 7D. Expand activity log ✅
- Added entity types: `roadmaps`, `taxreports`, `financialperiods`, `benefits`, `inventarier`
- Added Swedish labels and entity link routes in `activity-feed.tsx`

#### 7E. Type consolidation ✅
- Added canonical `CanonicalVerification`, `VerificationEntry`, `Payslip` to `src/types/index.ts`
- Added JSDoc pointers on all 3 layer-specific Verification types → canonical source
- `Invoice`, `Receipt` already canonical in `types/index.ts`; `Shareholder` in `types/ownership.ts`

---

### Execution Priority Summary

| Phase | Effort | Impact | Status |
|-------|--------|--------|--------|
| 1. Foundation | Medium | Unblocks everything | ✅ Done |
| 2. Reports | Large | Legal compliance, launch-blocking | ✅ Done |
| 3. Bokföring Core | Large | Core functionality | ✅ Done |
| 4. Löner | Medium | Feature completeness | ✅ Done |
| 5. Ägare | Medium | Feature completeness | ✅ Done |
| 6. Händelser | Medium | UX improvement | ✅ Done |
| 7. Polish | Small | Quality | ✅ Done |

**Completed:** Phases 1–7 (2026-03-01 through 2026-03-08)

**All phases complete.** The app is at minimum viable launch state.
