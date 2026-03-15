# Database Rewrite Plan

## Context

The database layer has accumulated significant debt: 68 tables (20 dead), 33 RPCs (19 dead), 3 duplicate table pairs, mixed naming conventions, 7 database/auth files with 5 different Supabase client patterns, and a 656-line user-scoped-db.ts that's just CRUD wrappers. The app is pre-production, making this the right time to clean up.

**Security issues found:**
- `rate-limiter.ts:233` has `.delete().neq('identifier', '')` — wipes all rate limit records
- 14 files bypass RLS with admin client when user-scoped would work
- AI audit tools read all users' data via admin client
- `audit.ts` uses browser client on server (wrong context)

---

## Phase 1: Consolidate Database Access Layer

**Goal:** 7 files → 3 files. No schema changes. Pure refactor.

### New file structure:
```
src/lib/database/
├── client.ts     ← Supabase client factories (5 functions)
├── auth.ts       ← All auth helpers + getAuthContext()
├── index.ts      ← Barrel re-exports
├── supabase.ts          ← LEGACY (to be deleted after Step 6)
├── supabase-server.ts   ← LEGACY (to be deleted after Step 6)
├── supabase-auth.ts     ← LEGACY (to be deleted after Step 6)
└── user-scoped-db.ts    ← LEGACY (to be deleted after Step 6)
```

### `client.ts` — 5 functions: ✅ DONE
- `createBrowserClient()` — for hooks/components (replaces `getSupabaseClient` + deprecated `supabase` proxy)
- `createServerClient()` — for API routes/server components (replaces `createServerSupabaseClient`)
- `createAdminClient()` — RLS bypass, Stripe webhooks + audit logging only (replaces `getSupabaseAdmin`)
- `createMiddlewareClient()` for middleware.ts
- `isSupabaseConfigured()` utility

### `auth.ts` — merged from 3 files: ✅ DONE
- Client-side: `signIn`, `signUp`, `signOut`, `onAuthStateChange`, `getCurrentUser`, `getSession`, `resetPassword` (from supabase-auth.ts)
- Server-side: `getServerUser`, `requireAuth` (from supabase-server.ts)
- API helpers: `verifyAuth`, `requireApiAuth`, `withAuth`, `ApiResponse` (from api-auth.ts)
- New: `getAuthContext()` — replaces entire user-scoped-db.ts:
  ```ts
  async function getAuthContext() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: m } = await supabase
      .from('company_members').select('company_id').eq('user_id', user.id).single()
    return { supabase, userId: user.id, companyId: m?.company_id ?? null }
  }
  ```

### Migration steps:

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create `client.ts` and `auth.ts` | ✅ Done |
| 2 | Update 38 files: `getSupabaseClient` → `createBrowserClient` (from `client.ts`) | ✅ Done |
| 3 | Update 14 files: `getSupabaseAdmin` → `createAdminClient` (from `client.ts`) | ✅ Done |
| 4 | Update 4 files: `createServerSupabaseClient` → `createServerClient`, `createMiddlewareSupabaseClient` → `createMiddlewareClient` | ✅ Done |
| 5 | Update 23 files: `api-auth` + `supabase-auth` imports → `database/auth` | ✅ Done |
| 6 | Migrate 29 files using `createUserScopedDb` → `getAuthContext()` + direct Supabase queries | ❌ Not started |
| 7 | Delete legacy files: `supabase.ts`, `supabase-server.ts`, `supabase-auth.ts`, `user-scoped-db.ts`, `api-auth.ts` | ❌ Not started |

**`npx tsc --noEmit` passes clean after Steps 1-5.**

### Step 6 — Remaining `createUserScopedDb` consumers (29 files)

The migration pattern:
```ts
// BEFORE
const userDb = await createUserScopedDb()
if (!userDb) return ApiResponse.unauthorized()
const items = await userDb.transactions.list({ limit: 50 })

// AFTER
const ctx = await getAuthContext()
if (!ctx) return ApiResponse.unauthorized()
const { supabase, userId, companyId } = ctx
const { data: items } = await supabase
  .from('transactions').select('*').order('date', { ascending: false }).limit(50)
```

**Batch A — Trivial (10 files):** Only use `.client`, `.userId`, `.companyId` — swap to `getAuthContext()`:
- `src/app/api/receipts/[id]/route.ts`
- `src/app/api/annual-report/route.ts`
- `src/app/api/vat/route.ts`
- `src/app/api/k10/route.ts`
- `src/app/api/income-declaration/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/notices/route.ts`
- `src/app/api/compliance/route.ts`
- `src/app/api/integrations/route.ts`
- `src/app/api/financial-periods/route.ts`

**Batch B — Simple (11 files):** 1-2 accessor calls → inline Supabase queries:
- `src/app/api/invoices/route.ts`
- `src/app/api/invoices/[id]/book/route.ts`
- `src/app/api/invoices/[id]/credit-note/route.ts`
- `src/app/api/invoices/[id]/pay/route.ts`
- `src/app/api/transactions/route.ts`
- `src/app/api/transactions/[id]/route.ts`
- `src/app/api/transactions/[id]/book/route.ts`
- `src/app/api/employees/route.ts`
- `src/app/api/chat/history/route.ts`
- `src/app/api/payroll/payslips/route.ts`
- `src/app/api/payroll/payslips/[id]/route.ts`
- `src/app/api/members/route.ts`
- `src/app/api/partners/route.ts`
- `src/app/api/pending-bookings/route.ts`

**Batch C — Complex (8 files):** 3+ accessor calls or complex orchestration:
- `src/app/api/chat/route.ts`
- `src/app/api/chat/extract-memories/route.ts`
- `src/app/api/chat/history/[id]/route.ts`
- `src/app/api/verifications/route.ts`
- `src/app/api/monthly-review/route.ts`
- `src/app/api/manadsavslut/route.ts`
- `src/app/api/sie/export/route.ts`
- `src/app/api/sie/import/route.ts`
- `src/app/api/onboarding/seed/route.ts`
- `src/app/api/reports/annual-report/route.ts`
- `src/app/api/transactions/import/route.ts`

---

## Phase 2: Fix Security Issues + Rate Limiter

**Status: ❌ Not started**

### 2a: Rewrite rate limiter with Vercel KV
**Why Vercel KV over in-memory**: On Vercel serverless, each request can hit a different function instance with its own empty `Map`. A user could send 100 requests and never get rate-limited. Vercel KV (Upstash Redis) is shared across all instances, ~1-5ms latency, free tier covers 3k req/day.

**Steps:**
1. `npm install @vercel/kv`
2. Create KV store in Vercel Dashboard → Storage → KV
3. Rewrite `src/lib/rate-limiter.ts` (~40 lines total):
   ```ts
   import { kv } from '@vercel/kv'

   export async function checkRateLimit(identifier: string, config = DEFAULT_CONFIG): Promise<RateLimitResult> {
     const key = `rate_limit:${identifier}`
     const count = await kv.incr(key)
     if (count === 1) await kv.expire(key, Math.ceil(config.windowMs / 1000))
     if (count > config.maxRequests) {
       const ttl = await kv.ttl(key)
       return { success: false, remaining: 0, resetTime: Date.now() + ttl * 1000, retryAfter: ttl }
     }
     return { success: true, remaining: config.maxRequests - count, resetTime: Date.now() + config.windowMs }
   }
   ```
4. Remove: `clearRateLimitStore()` (dangerous), `cleanupExpiredEntries()` (Redis TTL handles this), all Supabase imports, all `as any` casts (6 gone), `RateLimitRow` type
5. Keep: `getClientIdentifier()` (IP detection), `RateLimitConfig`, `RateLimitResult`, `DEFAULT_CONFIG`
6. Only caller: `src/app/api/chat/route.ts` — no changes needed, same API

### 2b: Reduce admin client usage (14 → ~4)
- Keep: Stripe webhooks, audit log writes
- Fix: `model-auth.ts` (6 calls) → user-scoped for profile/tier reads
- Fix: `audit.ts`, `resultat-audit.ts` → use user-scoped client
- Fix: `settings-service.ts`, `company-service.ts` → user-scoped
- Fix: `audit.ts` (lib) → uses browser client on server → `createServerClient()`

### Files to modify: ~12

---

## Phase 3: Schema Cleanup (SQL Migration + Types Rewrite)

**Status: ❌ Not started**

### 3a: SQL Migration (`supabase/migrations/YYYYMMDD_schema_cleanup.sql`)

**Drop 20 dead tables:**
```
ailogs, assets, boardminutes, categories, companymeetings,
corporate_documents, customers, dividends, documents,
employeebenefits, formaner_catalog, invoices, monthclosings,
notifications, ratelimits, securityauditlog, share_transactions,
suppliers, tax_reports, ratelimitssliding
```

**Drop 19 dead RPCs:**
```
add_user_credits, book_pending_item_status, check_rate_limit_atomic,
check_rls_status, cleanup_old_rate_limits_sliding, clear_demo_data,
get_agi_stats, get_benefit_stats, get_invoice_stats_v1/v2,
get_meeting_stats/v1/v2, get_payroll_stats, get_shareholder_stats/v1,
get_transaction_stats, is_admin, verify_rls_status, verify_security_setup
```

**Drop 3 duplicates** (keep the actively-queried one):
- Keep `sharetransactions`, drop `share_transactions`
- Keep `taxreports`, drop `tax_reports`
- Drop `monthclosings` (both unused, keep neither)

**Rename ~30 concatenated tables → snake_case:**
| Old | New |
|-----|-----|
| accountbalances | account_balances |
| agireports | agi_reports |
| aiusage | ai_usage |
| annualclosings | annual_closings |
| annualreports | annual_reports |
| bankconnections | bank_connections |
| customerinvoices | customer_invoices |
| financialperiods | financial_periods |
| inboxitems | inbox_items |
| incomedeclarations | income_declarations |
| inventarier | inventarier *(Swedish, keep as-is)* |
| k10declarations | k10_declarations |
| neappendices | ne_appendices |
| payslips | payslips *(already fine)* |
| periodiseringsfonder | periodiseringsfonder *(Swedish, keep)* |
| sharetransactions | share_transactions *(rename to snake)* |
| supplierinvoices | supplier_invoices |
| taxcalendar | tax_calendar |
| taxreports | tax_reports *(rename to snake)* |
| usercredits | user_credits |
| vatdeclarations | vat_declarations |

**Deduplicate columns:**
- `shareholders`: drop `shares_count` (keep `shares`)
- `receipts`: drop `vendor` (keep `supplier`)
- `payslips`: drop `paid_at` (keep `payment_date`)
- `transactions`: drop `occurred_at`, `timestamp`, `booked_at` (keep `date` + `created_at`)

### 3b: Rewrite `src/types/database.ts`
- From scratch, ~48 tables, all snake_case
- Target ~2500 lines (down from 4099)
- Include only 14 active RPCs

### 3c: Delete `src/types/supabase.ts`
- 3790 lines, zero imports anywhere — pure dead code

### 3d: Global find-replace `.from('old_name')` → `.from('new_name')`
- ~200+ occurrences across ~80 files

### Files to modify: 1 migration, 1 types rewrite, 1 delete, ~80 code files

---

## Phase 4: Final Cleanup

**Status: ❌ Not started**

1. Remove `model-auth.ts` `logSecurityEvent()` — wrote to dropped `securityauditlog`
2. Remove any remaining references to dropped tables/RPCs
3. Run `npx tsc --noEmit` — verify zero new errors
4. Run final metrics count (`as any`, `eslint-disable`, etc.)

---

## Verification

1. `npx tsc --noEmit` — zero new type errors after each phase
2. `npm run build` — app builds successfully
3. Test auth flow: login → dashboard → chat
4. Test a CRUD flow: create invoice → verify it appears → delete it
5. Test AI audit tool: run balance sheet audit → verify data returns
6. Check rate limiting still works after Phase 2
7. Final metrics: `as any` < 50, `eslint-disable` < 100, total files in database/ = 3

---

## Risk Mitigation

- **Phase 1 is safest** — pure refactor, no schema changes, can be tested immediately
- **Phase 3 is riskiest** — table renames could break RLS policies, views, triggers. Must check `pg_policies`, `pg_views`, `pg_trigger` before writing migration
- **Do Phase 1 + 2 first**, ship them, THEN do Phase 3 separately
- **Back up database** before running Phase 3 migration
- **Feature branch** for Phase 3 with full testing before merge

---

## Current Metrics (before rewrite)

| Metric | Count |
|--------|-------|
| `as any` | 71 |
| `as unknown as` | 47 |
| `@ts-expect-error` | 4 |
| `eslint-disable` | 137 |
| Database access files | 7 |
| Supabase client patterns | 5 |
| User retrieval patterns | 4 |
| Tables in schema | 68 |
| Tables actually used | 48 |
| RPCs in schema | 33 |
| RPCs actually used | 14 |
| Dead code (tables + RPCs) | 39 |

## Target Metrics (after rewrite)

| Metric | Target |
|--------|--------|
| `as any` | < 30 |
| `eslint-disable` | < 80 |
| Database access files | 3 |
| Supabase client patterns | 3 |
| Tables in schema | ~48 |
| RPCs in schema | ~14 |
| Dead code | 0 |
