# Database Schema Security Audit

**Generated:** 2026-01-26  
**Source:** Analysis of all 31 migration files in `/supabase/migrations/`

---

## Executive Summary

### 🔴 CRITICAL Security Issues Found

1. **`events` table** - RLS policy allows read access to ALL users (`USING (true)`)
2. **`partners` table** - Policy `FOR ALL USING (true)` - completely public
3. **`members` table** - Policy `FOR ALL USING (true)` - completely public  
4. **`corporate_documents` table** - Policy `FOR ALL USING (true)` - completely public
5. **`shareholders` table (original)** - Policy `FOR ALL USING (true)` before later fix
6. **`roadmap_steps` table** - No `user_id` column, relies on parent join only
7. **`rate_limits_sliding`** - Anon has full CRUD access (intentional for rate limiting but risky)

### 🟡 MEDIUM Issues

8. **Several tables with `OR user_id IS NULL`** - Allows access to orphaned records (fixed in later migrations)
9. **`GRANT ALL TO anon`** on financial tables - transactions, receipts, invoices (fixed later)
10. **`categories`** - Global read access (intentional but verify)

### ✅ Fixed in Later Migrations

The migrations `20260125200000_security_fixes_best_practices.sql` addresses most issues by:
- Removing `OR user_id IS NULL` patterns
- Switching to `(SELECT auth.uid())` for performance
- Adding proper FK constraints
- Revoking anon access

---

## Complete Table Inventory

### Financial Data Tables (HIGH PRIORITY)

---

#### 1. `transactions`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (`UUID REFERENCES auth.users(id)`) |
| **Has company_id** | ✅ Yes (`UUID` / `TEXT`) |
| **RLS Enabled** | ✅ Yes |
| **Final Policy** | `transactions_select/insert/update/delete` - user_id = auth.uid() |

**Columns:**
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `date` TEXT NOT NULL
- `timestamp` TIMESTAMPTZ DEFAULT NOW()
- `amount` TEXT NOT NULL
- `amount_value` DECIMAL(12,2) NOT NULL
- `currency` TEXT DEFAULT 'SEK'
- `status` TEXT NOT NULL DEFAULT 'Att bokföra'
- `category` TEXT
- `icon_name` TEXT DEFAULT 'CreditCard'
- `icon_color` TEXT DEFAULT 'text-gray-500'
- `account` TEXT
- `description` TEXT
- `ai_category` TEXT
- `ai_account` TEXT
- `ai_confidence` INTEGER
- `ai_reasoning` TEXT
- `source` TEXT DEFAULT 'manual'
- `external_id` TEXT
- `voucher_id` TEXT
- `booked_at` TIMESTAMPTZ
- `booked_by` UUID REFERENCES auth.users(id)
- `receipt_id` TEXT
- `attachments` TEXT[]
- `user_id` UUID REFERENCES auth.users(id)
- `company_id` UUID/TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ
- `created_by` TEXT

**Indexes:**
- `idx_transactions_user_id`
- `idx_transactions_company_id`
- `idx_transactions_status`
- `idx_transactions_source`
- `idx_transactions_timestamp`
- `idx_transactions_external_id`
- `idx_transactions_user_status`
- `idx_transactions_user_company`

**Security:** ✅ Properly secured after migration fixes

---

#### 2. `receipts`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |
| **Final Policy** | User-scoped CRUD |

**Columns:**
- `id` TEXT PRIMARY KEY
- `date` TEXT NOT NULL
- `supplier` TEXT
- `amount` DECIMAL(12,2) NOT NULL
- `total_amount` DECIMAL(12,2)
- `category` TEXT
- `status` TEXT DEFAULT 'pending'
- `source` TEXT DEFAULT 'manual'
- `created_by` TEXT
- `image_url` TEXT
- `metadata` JSONB DEFAULT '{}'
- `user_id` UUID REFERENCES auth.users(id)
- `company_id` UUID
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Indexes:** `idx_receipts_user_id`

**⚠️ Initial Issue:** `OR user_id IS NULL` in early policies - **FIXED** in later migration

---

#### 3. `invoices` (Generic invoices table)

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `invoice_number` TEXT
- `customer_name` TEXT
- `amount` DECIMAL(12,2) NOT NULL
- `vat_amount` DECIMAL(12,2)
- `total_amount` DECIMAL(12,2)
- `issue_date` TEXT NOT NULL
- `due_date` TEXT NOT NULL
- `status` TEXT DEFAULT 'draft'
- `source` TEXT DEFAULT 'manual'
- `created_by` TEXT
- `metadata` JSONB DEFAULT '{}'
- `user_id` UUID
- `company_id` UUID
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

---

#### 4. `customerinvoices` (Detailed customer invoices)

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |
| **Final Policy** | Proper user scoping |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `company_id` TEXT NOT NULL REFERENCES companies(id)
- `invoice_number` TEXT NOT NULL
- `invoice_date` DATE NOT NULL
- `due_date` DATE NOT NULL
- `customer_name` TEXT NOT NULL
- `customer_org_number` TEXT
- `customer_email` TEXT
- `customer_address` TEXT
- `subtotal` NUMERIC(15,2) NOT NULL
- `vat_rate` NUMERIC(5,2) DEFAULT 25.00
- `vat_amount` NUMERIC(15,2)
- `total_amount` NUMERIC(15,2) NOT NULL
- `currency` TEXT DEFAULT 'SEK'
- `items` JSONB DEFAULT '[]'
- `status` TEXT DEFAULT 'draft'
- `paid_at` TIMESTAMPTZ
- `paid_amount` NUMERIC(15,2)
- `payment_reference` TEXT
- `reminder_count` INTEGER DEFAULT 0
- `last_reminder_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_customerinvoices_amount_positive` CHECK (total_amount >= 0)
- Status CHECK: draft, sent, viewed, paid, overdue, cancelled, credited

**Indexes:**
- `idx_customerinvoices_user`
- `idx_customerinvoices_status`
- `idx_customerinvoices_user_status_due`
- `idx_customerinvoices_user_number`
- `idx_customerinvoices_user_company`
- `idx_customerinvoices_user_due`

---

#### 5. `supplierinvoices`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `supplier_name` TEXT
- `amount` DECIMAL(15,2)
- `due_date` DATE
- `ocr` TEXT
- `status` TEXT DEFAULT 'pending'
- `user_id` UUID REFERENCES auth.users(id)
- `company_id` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Indexes:** `idx_supplierinvoices_user_id`, `idx_supplierinvoices_user_status`, `idx_supplierinvoices_user_company`

---

#### 6. `payslips`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY (e.g., 'LB-202412-001')
- `employee_id` UUID REFERENCES employees(id)
- `period` TEXT NOT NULL (e.g., 'December 2024')
- `gross_salary` DECIMAL(12,2) NOT NULL
- `tax_deduction` DECIMAL(12,2) NOT NULL
- `net_salary` DECIMAL(12,2) NOT NULL
- `bonuses` DECIMAL(12,2) DEFAULT 0
- `deductions` DECIMAL(12,2) DEFAULT 0
- `status` TEXT NOT NULL DEFAULT 'draft'
- `payment_date` DATE
- `user_id` UUID
- `company_id` UUID
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_payslips_gross_positive` CHECK (gross_salary >= 0)
- `chk_payslips_net_positive` CHECK (net_salary >= 0)

**Indexes:**
- `idx_payslips_employee_id`
- `idx_payslips_user_id`
- `idx_payslips_user_period`
- `idx_payslips_employee`

**Foreign Keys:**
- `payslips_employee_id_fkey` → employees(id)

---

#### 7. `verifications`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `date` DATE
- `description` TEXT
- `rows` JSONB (account entries with debit/credit)
- `user_id` UUID REFERENCES auth.users(id)
- `company_id` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Indexes:** `idx_verifications_user_date`

---

### User Data Tables (HIGH PRIORITY)

---

#### 8. `profiles`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ⚠️ Uses `id` = auth.uid() (PK is user ID) |
| **Has company_id** | ❌ No |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
- `email` TEXT
- `full_name` TEXT
- `avatar_url` TEXT
- `role` user_role (enum: 'user', 'admin', 'owner') DEFAULT 'user'
- `subscription_tier` TEXT DEFAULT 'free' CHECK IN ('free', 'pro', 'enterprise')
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

**Policies:**
- Users can view/update own profile (id = auth.uid())
- Admins can view all profiles

**Indexes:** `profiles_role_idx`, `profiles_subscription_tier_idx`

**Trigger:** `on_auth_user_created` - Auto-creates profile on signup

---

#### 9. `employees`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `name` TEXT NOT NULL
- `role` TEXT
- `email` TEXT
- `monthly_salary` DECIMAL(12,2) NOT NULL DEFAULT 0
- `tax_rate` DECIMAL(4,2) NOT NULL DEFAULT 0.24
- `start_date` DATE
- `status` TEXT NOT NULL DEFAULT 'active'
- `user_id` UUID REFERENCES auth.users(id)
- `company_id` UUID
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_employees_tax_rate` CHECK (tax_rate >= 0 AND tax_rate <= 1)
- `chk_employees_salary_positive` CHECK (monthly_salary >= 0)

**Indexes:**
- `idx_employees_user_id`
- `idx_employees_user_status`

---

#### 10. `shareholders`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (added later) |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `company_id` TEXT NOT NULL REFERENCES companies(id)
- `name` TEXT NOT NULL
- `person_number` TEXT / `ssn_org_nr` TEXT
- `email` TEXT
- `phone` TEXT
- `address` TEXT
- `shares` INTEGER NOT NULL DEFAULT 0
- `share_percentage` NUMERIC(5,2)
- `share_class` TEXT DEFAULT 'A'
- `voting_rights` NUMERIC(5,2)
- `status` TEXT DEFAULT 'active'
- `acquired_date` DATE
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_shareholders_shares_positive` CHECK (shares >= 0)
- `chk_shareholders_percentage` CHECK (share_percentage >= 0 AND share_percentage <= 100)

**Indexes:**
- `idx_shareholders_user`
- `idx_shareholders_company`
- `idx_shareholders_user_company`

**🔴 ORIGINAL ISSUE:** First migration had `FOR ALL USING (true)` - **FIXED** in later migrations

---

### Potential Exploitation Tables (HIGH PRIORITY)

---

#### 11. `ratelimits`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ❌ No (uses identifier) |
| **RLS Enabled** | ✅ Yes |
| **Policy** | Service role only |

**Columns:**
- `identifier` TEXT PRIMARY KEY
- `count` INTEGER NOT NULL DEFAULT 1
- `reset_time` TIMESTAMPTZ NOT NULL
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Policy:** `ratelimits_service_all` - service_role only

**Security:** ✅ Properly restricted to service role

---

#### 12. `ratelimitssliding`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ❌ No (uses identifier) |
| **RLS Enabled** | ✅ Yes |
| **Policy** | ⚠️ Anon has full access |

**Columns:**
- `identifier` TEXT PRIMARY KEY
- `window_data` JSONB NOT NULL DEFAULT '{}'
- `last_access` TIMESTAMPTZ NOT NULL
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Policies:**
- `ratelimitssliding_anon_all` - anon FOR ALL USING (true)
- `ratelimitssliding_service_all` - service_role full access

**⚠️ CONCERN:** Anon can manipulate rate limit entries. This is intentional for rate limiting to work for unauthenticated requests, but could be exploited to clear rate limits.

---

#### 13. `aiusage`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `tokens_used` INTEGER NOT NULL DEFAULT 0
- `requests_count` INTEGER NOT NULL DEFAULT 0
- `model_id` TEXT NOT NULL
- `provider` TEXT NOT NULL
- `period_start` TIMESTAMPTZ NOT NULL
- `period_end` TIMESTAMPTZ NOT NULL
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Unique Constraint:** (user_id, model_id, period_start)

**Policies:**
- Users can view own usage
- Service role manages all

**Indexes:**
- `ai_usage_user_idx`
- `ai_usage_period_idx`
- `ai_usage_model_idx`
- `idx_aiusage_user_period`

**Security:** ✅ Properly secured - users can only read, service role manages

---

#### 14. `securityauditlog`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (nullable for unauthenticated events) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES auth.users(id) ON DELETE SET NULL
- `event_type` TEXT NOT NULL (unauthorized_model_access, rate_limit_exceeded, suspicious_activity, auth_failure, admin_action)
- `requested_resource` TEXT
- `allowed_resource` TEXT
- `user_tier` TEXT
- `ip_address` TEXT
- `user_agent` TEXT
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMPTZ

**Policies:**
- `securityauditlog_admin_select` - Only admins can view
- `securityauditlog_service_insert` - Service role inserts

**Security:** ✅ Properly restricted

---

### Company & Organization Tables

---

#### 15. `companies`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `org_number` TEXT
- `settings` JSONB DEFAULT '{}'
- `subscription_status` TEXT DEFAULT 'trial'
- `subscription_tier` TEXT DEFAULT 'free'
- `subscription_ends_at` TIMESTAMPTZ
- `stripe_customer_id` TEXT
- `stripe_subscription_id` TEXT
- `user_id` UUID REFERENCES auth.users(id)
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_companies_subscription_status` CHECK (trial, active, past_due, cancelled, expired)
- `chk_companies_subscription_tier` CHECK (free, starter, pro, enterprise)

**Indexes:**
- `idx_companies_stripe_customer`
- `idx_companies_subscription_status`

---

#### 16. `companymeetings`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `company_id` TEXT NOT NULL REFERENCES companies(id)
- `title` TEXT NOT NULL
- `meeting_type` TEXT NOT NULL (bolagsstamma, arsmote, extra_stamma, styrelsemote)
- `meeting_date` DATE NOT NULL
- `meeting_time` TIME
- `location` TEXT
- `is_digital` BOOLEAN DEFAULT FALSE
- `meeting_link` TEXT
- `status` TEXT DEFAULT 'planned' (planned, called, held, cancelled)
- `attendees` JSONB DEFAULT '[]'
- `agenda` TEXT
- `minutes` TEXT
- `decisions` JSONB DEFAULT '[]'
- `notice_sent_at` TIMESTAMPTZ
- `deadline_proposals` DATE
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Indexes:**
- `idx_companymeetings_user`
- `idx_companymeetings_company`
- `idx_companymeetings_user_date`
- `idx_companymeetings_user_company`

---

#### 17. `boardminutes`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `company_id` TEXT NOT NULL REFERENCES companies(id)
- `meeting_id` UUID REFERENCES companymeetings(id)
- `title` TEXT NOT NULL
- `protocol_number` TEXT
- `meeting_date` DATE NOT NULL
- `attendees` JSONB DEFAULT '[]'
- `agenda_items` JSONB DEFAULT '[]'
- `decisions` JSONB DEFAULT '[]'
- `notes` TEXT
- `chairman` TEXT
- `secretary` TEXT
- `signed_at` TIMESTAMPTZ
- `status` TEXT DEFAULT 'draft' (draft, pending_signatures, signed, archived)
- `attachments` JSONB DEFAULT '[]'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Foreign Keys:**
- `boardminutes_meeting_id_fkey` → companymeetings(id)
- `boardminutes_company_id_fkey` → companies(id)

---

#### 18. `dividends`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `company_id` TEXT NOT NULL REFERENCES companies(id)
- `fiscal_year` INTEGER NOT NULL
- `decision_date` DATE NOT NULL
- `meeting_id` UUID REFERENCES companymeetings(id)
- `total_amount` NUMERIC(15,2) NOT NULL
- `per_share_amount` NUMERIC(10,4)
- `tax_rate` NUMERIC(5,2) DEFAULT 30.00
- `total_tax` NUMERIC(15,2)
- `net_amount` NUMERIC(15,2)
- `status` TEXT DEFAULT 'planned' (planned, decided, paid, cancelled)
- `payment_date` DATE
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_dividends_amount_positive` CHECK (total_amount >= 0)

---

### Tax & Compliance Tables

---

#### 19. `taxreports`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `type` TEXT NOT NULL
- `status` TEXT DEFAULT 'pending'
- `period_id` TEXT REFERENCES financialperiods(id)
- `data` JSONB DEFAULT '{}'
- `generated_at` TIMESTAMPTZ
- `user_id` UUID REFERENCES auth.users(id)
- `company_id` UUID
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

---

#### 20. `agireports`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `period` TEXT
- `status` TEXT DEFAULT 'draft'
- `total_salary` NUMERIC DEFAULT 0
- `total_tax` NUMERIC DEFAULT 0
- `employer_contributions` NUMERIC DEFAULT 0
- `data` JSONB DEFAULT '{}'
- `user_id` UUID
- `company_id` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- `chk_agireports_status` CHECK (draft, submitted, approved, rejected)
- `chk_agireports_totals_positive` CHECK (totals >= 0)

---

#### 21. `vatdeclarations`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY
- `period` TEXT
- `status` TEXT DEFAULT 'draft'
- `data` JSONB DEFAULT '{}'
- `user_id` UUID
- `company_id` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

---

#### 22. `k10declarations`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `company_id` TEXT NOT NULL REFERENCES companies(id)
- `shareholder_id` UUID REFERENCES shareholders(id)
- `fiscal_year` INTEGER NOT NULL
- `gransbelopp` NUMERIC(15,2)
- `used_gransbelopp` NUMERIC(15,2)
- `saved_gransbelopp` NUMERIC(15,2)
- `omkostnadsbelopp` NUMERIC(15,2)
- `lonebaserat_utrymme` NUMERIC(15,2)
- `status` TEXT DEFAULT 'draft' (draft, submitted, approved)
- `deadline` DATE
- `submitted_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Foreign Keys:**
- `k10declarations_shareholder_id_fkey` → shareholders(id)
- `k10declarations_company_id_fkey` → companies(id)

---

#### 23. `financialperiods`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` TEXT PRIMARY KEY (e.g., '2024-Q1', '2024-M01')
- `name` TEXT NOT NULL
- `type` TEXT DEFAULT 'quarterly' (monthly, quarterly, yearly)
- `start_date` DATE NOT NULL
- `end_date` DATE NOT NULL
- `status` TEXT DEFAULT 'open' (open, closed, submitted)
- `reconciliation_checks` JSONB DEFAULT '{}'
- `locked_at` TIMESTAMPTZ
- `locked_by` UUID
- `user_id` UUID
- `company_id` UUID
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

---

### 🔴 TABLES WITH SECURITY ISSUES

---

#### 24. `events`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ⚠️ Added later via migration |
| **Has company_id** | ⚠️ Added later |
| **RLS Enabled** | ✅ Yes |
| **ISSUE** | 🔴 Original policy: `FOR SELECT USING (true)` |

**Columns:**
- `id` UUID PRIMARY KEY
- `created_at` TIMESTAMPTZ
- `timestamp` TIMESTAMPTZ
- `source` event_source (ai, user, system, document, authority)
- `category` event_category (bokföring, skatt, rapporter, etc.)
- `action` TEXT NOT NULL
- `title` TEXT NOT NULL
- `actor_type` TEXT NOT NULL
- `actor_id` TEXT
- `actor_name` TEXT
- `description` TEXT
- `metadata` JSONB
- `related_to` JSONB
- `status` event_status
- `corporate_action_type` TEXT
- `proof` JSONB
- `hash` TEXT
- `previous_hash` TEXT
- `user_id` UUID (added later)
- `company_id` TEXT (added later)

**🔴 ORIGINAL ISSUE:** 
```sql
CREATE POLICY "Enable read access for all users" ON events FOR SELECT USING (true);
```

**✅ FIXED in later migration** to use proper user scoping

---

#### 25. `partners` (HB/KB)

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ⚠️ Added later |
| **Has company_id** | ⚠️ Added later |
| **RLS Enabled** | ✅ Yes |
| **ISSUE** | 🔴 Original policy: `FOR ALL USING (true)` |

**Original Creation (INSECURE):**
```sql
CREATE POLICY "Allow all access to partners" ON partners FOR ALL USING (true);
```

**✅ FIXED** in migration `20260125000002_add_missing_tables.sql`:
- Added user_id, company_id columns
- Created proper user-scoped policy

---

#### 26. `members` (Association)

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ⚠️ Added later |
| **Has company_id** | ⚠️ Added later |
| **RLS Enabled** | ✅ Yes |
| **ISSUE** | 🔴 Original policy: `FOR ALL USING (true)` |

**Original Creation (INSECURE):**
```sql
CREATE POLICY "Allow all access to members" ON members FOR ALL USING (true);
```

**✅ FIXED** in migration `20260125000002_add_missing_tables.sql`

---

#### 27. `corporate_documents`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ❌ No |
| **Has company_id** | ❌ No |
| **RLS Enabled** | ✅ Yes |
| **ISSUE** | 🔴 Policy: `FOR ALL USING (true)` |

**Columns:**
- `id` UUID PRIMARY KEY
- `type` TEXT NOT NULL (board_minutes, agm, egm, share_register_snapshot)
- `title` TEXT NOT NULL
- `date` DATE NOT NULL
- `content` TEXT
- `status` TEXT DEFAULT 'draft'
- `version` INTEGER DEFAULT 1
- `source` TEXT DEFAULT 'manual'
- `created_by` TEXT
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**🔴 SECURITY ISSUE:** 
- No user_id column
- Policy allows all access
- Not fixed in later migrations

**RECOMMENDATION:** This table needs user_id and proper RLS policies

---

#### 28. `roadmaps` & `roadmap_steps`

| Attribute | Value |
|-----------|-------|
| **roadmaps.user_id** | ✅ Yes (NOT NULL) |
| **roadmap_steps.user_id** | ❌ No - relies on parent FK |
| **RLS Enabled** | ✅ Yes |

**roadmaps Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `description` TEXT
- `status` TEXT DEFAULT 'active' (active, completed, archived)
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**roadmap_steps Columns:**
- `id` UUID PRIMARY KEY
- `roadmap_id` UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `description` TEXT
- `status` TEXT DEFAULT 'pending' (pending, in_progress, completed, skipped)
- `order_index` INTEGER NOT NULL
- `metadata` JSONB
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**roadmap_steps RLS:** Uses EXISTS subquery to check parent ownership
```sql
USING (EXISTS (SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_steps.roadmap_id AND roadmaps.user_id = auth.uid()))
```

**Security:** ✅ Acceptable - child table secured via parent relationship

---

### Supporting Tables

---

#### 29. `categories` (BAS Account Codes)

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ❌ No (global lookup) |
| **RLS Enabled** | ✅ Yes |
| **Policy** | Read-only for authenticated users |

**Columns:**
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `type` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Security:** ✅ Intentionally public read - global reference data

---

#### 30. `integrations`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `service` TEXT / `integration_id` TEXT NOT NULL
- `enabled` BOOLEAN DEFAULT FALSE
- `connected` BOOLEAN DEFAULT FALSE
- `connected_at` TIMESTAMPTZ
- `credentials_encrypted` JSONB
- `settings` JSONB DEFAULT '{}'
- `last_sync_at` TIMESTAMPTZ
- `sync_status` TEXT DEFAULT 'idle'
- `error_message` TEXT
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Unique Constraint:** (user_id, service) or (user_id, integration_id)

---

#### 31. `inventarier` (Fixed Assets)

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes (in later version) |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `company_id` TEXT REFERENCES companies(id)
- `namn`/`name` TEXT NOT NULL
- `kategori`/`category` TEXT NOT NULL DEFAULT 'Inventarier'
- `beskrivning`/`description` TEXT
- `inkopsdatum`/`purchase_date` DATE NOT NULL
- `inkopspris`/`purchase_price` NUMERIC(12,2) / NUMERIC(15,2) NOT NULL
- `leverantor`/`supplier` TEXT
- `fakturanummer`/`invoice_reference` TEXT
- `livslangd_ar`/`useful_life_years` INTEGER DEFAULT 5
- `avskrivningsmetod`/`depreciation_method` TEXT DEFAULT 'linear'
- `restvarde`/`residual_value` NUMERIC DEFAULT 0
- `current_value` NUMERIC(15,2)
- `account_number` TEXT DEFAULT '1220'
- `depreciation_account` TEXT DEFAULT '7832'
- `status` TEXT DEFAULT 'aktiv'/'active'
- `forsaljningsdatum`/`disposal_date` DATE
- `forsaljningspris`/`disposal_value` NUMERIC
- `serienummer`/`serial_number` TEXT
- `placering`/`location` TEXT
- `barcode` TEXT
- `anteckningar` TEXT
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**Check Constraints:**
- Status CHECK: aktiv/active, såld/sold, avskriven/scrapped, skrotad/lost

---

#### 32. `sharetransactions` / `share_transactions`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `company_id` TEXT REFERENCES companies(id)
- `transaction_date` DATE NOT NULL
- `transaction_type` TEXT NOT NULL (issue, transfer, split, redemption, bonus_issue, Nyemission, Överlåtelse, etc.)
- `from_shareholder_id` UUID REFERENCES shareholders(id)
- `to_shareholder_id` UUID REFERENCES shareholders(id)
- `from_name` TEXT
- `to_name` TEXT
- `shares`/`share_count` INTEGER NOT NULL
- `share_class` TEXT DEFAULT 'B'
- `price_per_share` NUMERIC(12,2)
- `total_price`/`total_amount` NUMERIC
- `verification_id` UUID
- `notes` TEXT
- `document_url`/`document_reference` TEXT
- `registration_date` DATE
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

---

#### 33. `agent_metrics`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes (NOT NULL) |
| **Has company_id** | ✅ Yes |
| **RLS Enabled** | ✅ Yes |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `company_id` TEXT REFERENCES companies(id)
- `conversation_id` UUID REFERENCES conversations(id)
- `intent` TEXT NOT NULL (RECEIPT, INVOICE, BOOKKEEPING, PAYROLL, TAX, etc.)
- `intent_confidence` DECIMAL(4,3) DEFAULT 0.5
- `selected_agent` TEXT NOT NULL
- `handoffs` TEXT[] DEFAULT '{}'
- `is_multi_agent` BOOLEAN DEFAULT FALSE
- `classification_time_ms` INTEGER DEFAULT 0
- `execution_time_ms` INTEGER DEFAULT 0
- `total_time_ms` INTEGER DEFAULT 0
- `tools_called` TEXT[] DEFAULT '{}'
- `tools_succeeded` INTEGER DEFAULT 0
- `tools_failed` INTEGER DEFAULT 0
- `response_success` BOOLEAN DEFAULT TRUE
- `response_length` INTEGER DEFAULT 0
- `has_display` BOOLEAN DEFAULT FALSE
- `has_confirmation` BOOLEAN DEFAULT FALSE
- `has_navigation` BOOLEAN DEFAULT FALSE
- `model_id` TEXT
- `tokens_estimate` INTEGER
- `error` TEXT
- `error_agent` TEXT
- `created_at` TIMESTAMPTZ

**Policies:**
- Users can view own metrics
- Service role can insert (no user check on insert)

---

#### 34. `conversations`

| Attribute | Value |
|-----------|-------|
| **Has user_id** | ✅ Yes |
| **RLS Enabled** | ⚠️ Not explicitly enabled in migration |

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES auth.users(id) ON DELETE CASCADE
- `title` TEXT
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**⚠️ POTENTIAL ISSUE:** RLS not explicitly enabled/policies not defined

---

### Additional Tables (From Various Migrations)

---

#### 35-45. Other Tables

| Table | user_id | company_id | RLS | Status |
|-------|---------|------------|-----|--------|
| `incomedeclarations` | ✅ | ✅ | ✅ | OK |
| `neappendices` | ✅ | ✅ | ✅ | OK |
| `annualclosings` | ✅ | ✅ | ✅ | OK |
| `annualreports` | ✅ | ✅ | ✅ | OK |
| `assets` | ✅ | ✅ | ✅ | OK |
| `benefits` | ✅ | ✅ | ✅ | OK |
| `employeebenefits` | ✅ | ✅ | ✅ | OK |
| `inboxitems` | ✅ | ✅ | ✅ | OK |
| `ailogs` | ✅ | ✅ | ✅ | OK |
| `ai_audit_log` | ✅ | ❌ | ✅ | OK |
| `company_members` | ⚠️ Uses user_id directly | ✅ | ✅ | OK |
| `notifications` | ✅ | ❌ | ✅ | OK |
| `documents` | ✅ | ✅ | ✅ | OK |
| `bankconnections` | ✅ | ✅ | ✅ | OK |
| `accountbalances` | ✅ | ✅ | ✅ | OK |
| `taxcalendar` | ✅ | ✅ | ✅ | OK |
| `settings` | ✅ | ✅ (optional) | ✅ | OK |

---

## Security Recommendations

### 🔴 CRITICAL - Fix Immediately

1. **`corporate_documents`** - Add user_id column and proper RLS
   ```sql
   ALTER TABLE corporate_documents ADD COLUMN user_id UUID REFERENCES auth.users(id);
   DROP POLICY "Allow all access to corporate_documents" ON corporate_documents;
   CREATE POLICY "corporate_documents_crud" ON corporate_documents FOR ALL 
     USING (user_id = (SELECT auth.uid())) 
     WITH CHECK (user_id = (SELECT auth.uid()));
   ```

2. **`conversations`** - Add RLS policies
   ```sql
   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "conversations_user" ON conversations FOR ALL
     USING (user_id = (SELECT auth.uid()))
     WITH CHECK (user_id = (SELECT auth.uid()));
   ```

3. **Verify all old policies removed** - Run:
   ```sql
   SELECT * FROM verify_security_setup();
   ```

### 🟡 MEDIUM - Review and Consider

4. **`ratelimitssliding`** anon access - Consider if anon truly needs write access or if this can be restricted to service_role only

5. **Service role policies** with `WITH CHECK (true)` on insert - Ensure API routes properly validate user context before using service role

### ✅ Best Practices Applied

- All major tables have RLS enabled
- Most tables use `(SELECT auth.uid())` pattern for performance
- Foreign key constraints to `auth.users(id)` with `ON DELETE CASCADE`
- Proper indexes on `user_id` columns
- Check constraints on critical fields (amounts, percentages, status enums)
- Revoked anon/public access on sensitive tables

---

## Verification Queries

Run these to verify security:

```sql
-- Check RLS status for all tables
SELECT * FROM verify_security_setup();

-- Check for any policies with 'true' as condition (public access)
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND qual::text LIKE '%true%';

-- Check for tables without user_id
SELECT table_name 
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name 
    AND c.column_name = 'user_id'
  );

-- Check for RLS disabled tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND NOT rowsecurity;
```
