# Supabase Schema Audit - ACTUAL STATE

> **Audit Date:** 24 januari 2026  
> **Status:** Issues identified and migration created

## Critical Issues Found

| Issue | Severity | Tables Affected |
|-------|----------|-----------------|
| **Public access policies (data leak!)** | 🔴 CRITICAL | companies, supplierinvoices, verifications, events, financialperiods, monthclosings |
| **user_id as TEXT (should be UUID)** | 🔴 HIGH | agireports, annualclosings, annualreports, assets |
| **Missing RLS policies** | 🔴 HIGH | assets, benefits, employees, incomedeclarations, neappendices, payslips, vatdeclarations |
| **Duplicate/conflicting policies** | 🟡 MEDIUM | boardminutes, companymeetings, customerinvoices, k10declarations |
| **Using {public} role instead of {authenticated}** | 🟡 MEDIUM | Most tables |

## 1. Actual Table Columns (from Supabase)

### Core Tables
| Table | Key Columns | user_id Type | Notes |
|-------|-------------|--------------|-------|
| `profiles` | `id` UUID PK, `role`, `subscription_tier` | N/A (uses `id`) | ✅ Correct |
| `companies` | `id` TEXT PK, `user_id` UUID | UUID | ✅ Has FK to auth.users |
| `accountbalances` | `id` UUID, `account_number`, `balance` NUMERIC | UUID | ✅ Correct |

### Financial Tables
| Table | Key Columns | Notes |
|-------|-------------|-------|
| `transactions` | `id` TEXT PK, `user_id` UUID, `company_id` UUID, `amount_value` DECIMAL(12,2), `status` TEXT, `timestamp` TIMESTAMPTZ | High traffic |
| `receipts` | `id` TEXT PK, `user_id` UUID, `amount` DECIMAL(12,2), `status` TEXT | |
| `verifications` | `id` UUID, needs `user_id`, `rows` JSONB | Missing user_id! |
| `invoices` | `id` TEXT PK, `user_id` UUID, `total_amount` DECIMAL(12,2) | Legacy table |
| `customer_invoices` | `id` UUID PK, `user_id` UUID, `company_id` TEXT refs companies, full customer details | Primary invoice table |
| `supplier_invoices` | `id` UUID PK, `user_id` UUID, `company_id` TEXT | Needs user_id added |

### Payroll Tables
| Table | Key Columns | Notes |
|-------|-------------|-------|
| `employees` | `id` UUID PK, `user_id` UUID (nullable!), `monthly_salary` DECIMAL(12,2), `tax_rate` DECIMAL(4,2) | user_id should be NOT NULL |
| `payslips` | `id` TEXT PK, `employee_id` UUID refs employees, `user_id` UUID, `gross_salary`/`net_salary` DECIMAL(12,2) | |
| `benefits` | `id` UUID, needs `user_id` | Missing! |
| `employee_benefits` | `employee_id`, `benefit_id` | Junction, needs user_id |

### Tax & Compliance Tables
| Table | Key Columns | Notes |
|-------|-------------|-------|
| `tax_reports` | needs `user_id`, `type` TEXT, `period` TEXT | Missing user_id |
| `vat_declarations` | needs `user_id`, `period` TEXT, `amount` DECIMAL | Missing user_id |
| `agi_reports` | needs `user_id`, `period` TEXT | Missing user_id |
| `income_declarations` | needs `user_id`, `year` INT | Missing user_id |
| `k10_declarations` | `user_id` UUID, `shareholder_id` UUID refs shareholders, `fiscal_year` INT | Has user_id ✓ |
| `ne_appendices` | `income_declaration_id` refs income_declarations | Needs user_id |
| `annual_closings` | needs `user_id`, `year` INT | Missing user_id |
| `annual_reports` | needs `user_id`, `year` INT | Missing user_id |

### Corporate Governance Tables
| Table | Key Columns | Notes |
|-------|-------------|-------|
| `shareholders` | `id` UUID, `user_id` UUID, `company_id` TEXT, `shares` INT, `share_percentage` NUMERIC(5,2) | Has user_id ✓ |
| `company_meetings` | `id` UUID, `user_id` UUID, `company_id` TEXT, `meeting_type` TEXT, `meeting_date` DATE | Has user_id ✓ |
| `board_minutes` | `id` UUID, `user_id` UUID, `meeting_id` refs company_meetings | Has user_id ✓ |
| `dividends` | `id` UUID, `user_id` UUID, `meeting_id` refs company_meetings, `shareholder_id` refs shareholders | Has user_id ✓ |
| `partners` | `id` UUID, `user_id` UUID, `company_id` TEXT, for HB/KB | Has user_id ✓ |
| `members` | `id` UUID, `user_id` UUID, `company_id` TEXT, for föreningar | Has user_id ✓ |

### System Tables
| Table | Key Columns | Notes |
|-------|-------------|-------|
| `ai_usage` | `user_id` UUID, `tokens_used` INT, `model_id` TEXT, `period_start`/`period_end` | Has user_id ✓ |
| `ai_logs` / `ai_audit_log` | `user_id` UUID, `tool_name` TEXT, `parameters` JSONB | Needs user_id |
| `security_audit_log` | `user_id` UUID (nullable), `event_type` TEXT | Admin-only view |
| `rate_limits` | `identifier` TEXT PK, `count` INT | System table, no user_id needed |
| `rate_limits_sliding` | `identifier` TEXT PK | System table |
| `categories` | `id` UUID, `name` TEXT, BAS account codes | Global lookup, no user_id |
| `events` | `id` UUID, `user_id` UUID, `company_id` TEXT, `event_type` TEXT | Has user_id ✓ |

---

## 2. Foreign Key Relationships

### Critical FKs to Create/Verify
```
shareholders.company_id -> companies(id) ON DELETE CASCADE
shareholders.user_id -> auth.users(id) ON DELETE CASCADE

company_meetings.company_id -> companies(id) ON DELETE CASCADE
company_meetings.user_id -> auth.users(id) ON DELETE CASCADE

board_minutes.meeting_id -> company_meetings(id) ON DELETE SET NULL
board_minutes.company_id -> companies(id) ON DELETE CASCADE

dividends.meeting_id -> company_meetings(id) ON DELETE SET NULL
dividends.shareholder_id -> shareholders(id) ON DELETE CASCADE

k10_declarations.shareholder_id -> shareholders(id) ON DELETE SET NULL
k10_declarations.company_id -> companies(id) ON DELETE CASCADE

payslips.employee_id -> employees(id) ON DELETE CASCADE

employee_benefits.employee_id -> employees(id) ON DELETE CASCADE
employee_benefits.benefit_id -> benefits(id) ON DELETE CASCADE

ne_appendices.income_declaration_id -> income_declarations(id) ON DELETE CASCADE

customer_invoices.company_id -> companies(id) ON DELETE CASCADE
supplier_invoices.company_id -> companies(id) ON DELETE CASCADE
```

---

## 3. User/Tenant Access Columns

| Table | Access Column | Type | Notes |
|-------|--------------|------|-------|
| `profiles` | `id` | UUID | `id = auth.uid()` (not user_id!) |
| All other tables | `user_id` | UUID | `user_id = auth.uid()` |

**Tenant Model:** Single-user per company (no multi-tenant). Each user owns their data via `user_id`.

---

## 4. Access Rules by Role

| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `authenticated` | Own rows (user_id = auth.uid()) | Own rows | Own rows | Own rows | Standard pattern |
| `anon` | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | Demo mode should NOT use anon |
| `admin` | All rows | All rows | All rows | All rows | Via profiles.role = 'admin' check |
| `service_role` | All | All | All | All | Bypasses RLS |

### Special Cases
| Table | Rule |
|-------|------|
| `categories` | Read-only for all authenticated users (global BAS codes) |
| `security_audit_log` | SELECT only for admins, INSERT for system |
| `ai_usage` | SELECT for own user, INSERT/UPDATE via service_role only |
| `rate_limits`, `rate_limits_sliding` | Service role only |

---

## 5. Query Patterns & Indexes Needed

### High-Traffic Queries
| Query Pattern | Table | Indexes Needed |
|---------------|-------|----------------|
| Get user's transactions | `transactions` | `(user_id, timestamp DESC)` ✓ exists |
| Get transactions by status | `transactions` | `(user_id, status)` |
| Get financial periods | `financial_periods` | `(user_id, start_date)` |
| Get shareholders | `shareholders` | `(user_id, company_id)` ✓ exists |
| Get verifications | `verifications` | `(user_id, date DESC)` - needs user_id first! |
| Get employees | `employees` | `(user_id)` |
| Get payslips by period | `payslips` | `(user_id, period)` |
| Get invoices by status | `customer_invoices` | `(user_id, status, due_date)` |
| Get events | `events` | `(user_id, timestamp DESC)` ✓ exists |

### Missing Indexes to Add
```sql
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX idx_customer_invoices_user_status_due ON customer_invoices(user_id, status, due_date);
CREATE INDEX idx_payslips_user_period ON payslips(user_id, period);
CREATE INDEX idx_employees_user_status ON employees(user_id, status);
```

---

## 6. Expected Cardinality & Growth

| Table | Current Est. | Growth Rate | Partition? |
|-------|--------------|-------------|------------|
| `transactions` | ~1K/user | 50-200/user/month | No (until 1M+) |
| `events` | ~5K/user | 100-500/user/month | Consider yearly |
| `ai_usage` | ~100/user | 10-50/user/month | No |
| `ai_logs` | ~10K total | 1K/month | Consider monthly |
| `security_audit_log` | ~1K total | Variable | Consider yearly |
| `verifications` | ~500/user | 20-50/user/month | No |
| `payslips` | ~50/user/year | 12/employee/year | No |

---

## 7. Retention/Archival Requirements

| Table | Retention | Action |
|-------|-----------|--------|
| `security_audit_log` | 2 years | Archive to cold storage |
| `ai_logs` | 1 year | Delete after 1 year |
| `events` | 2 years | Archive after 2 years |
| `rate_limits` | 24 hours | Auto-cleanup via reset_time |
| All financial data | 7 years | Swedish law (Bokföringslagen) |

---

## 8. Existing Functions & Triggers

| Function | Tables | Update Needed |
|----------|--------|---------------|
| `update_updated_at_column()` | All tables with updated_at | ✓ Generic |
| `handle_new_user()` | auth.users → profiles | ✓ OK |
| `get_or_create_monthly_usage()` | ai_usage | ✓ OK |
| `increment_ai_usage()` | ai_usage | ✓ OK |
| `get_shareholder_stats()` | shareholders | Update table name after rename |
| `get_meeting_stats()` | company_meetings → companymeetings | Update table name |
| `get_agi_stats()` | payslips | ✓ OK (payslips not renamed) |
| `get_invoice_stats()` | customer_invoices → customerinvoices | Update table name |
| `get_payroll_stats()` | payslips | ✓ OK |
| `atomic_rate_limit_check()` | rate_limits | ✓ OK (not renamed) |

---

## 9. Constraint Strictness Recommendations

### NOT NULL Constraints
```sql
-- All tables should have
user_id UUID NOT NULL (except profiles which uses id)

-- Specific tables
transactions.amount_value NOT NULL
transactions.status NOT NULL
employees.monthly_salary NOT NULL DEFAULT 0
employees.tax_rate NOT NULL DEFAULT 0.24
payslips.gross_salary NOT NULL
payslips.employee_id NOT NULL
customer_invoices.invoice_number NOT NULL
customer_invoices.total_amount NOT NULL
```

### CHECK Constraints
```sql
-- Already exist (verify after rename)
transactions.status IN ('Att bokföra', 'Bokförd', 'Saknar underlag', 'Ignorerad')
customer_invoices.status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'credited')
company_meetings.meeting_type IN ('bolagsstamma', 'arsmote', 'extra_stamma', 'styrelsemote')
company_meetings.status IN ('planned', 'called', 'held', 'cancelled')
employees.status IN ('active', 'inactive')
profiles.subscription_tier IN ('free', 'pro', 'enterprise')

-- Add
employees.tax_rate >= 0 AND tax_rate <= 1
payslips.gross_salary >= 0
customer_invoices.total_amount >= 0
dividends.total_amount >= 0
shareholders.shares >= 0
```

---

## 10. Modification Preferences

| Object Type | Auto-Apply? | Notes |
|-------------|-------------|-------|
| Add user_id columns | ✅ Yes | Critical security fix |
| Add indexes | ✅ Yes | Performance only |
| Update RLS policies | ✅ Yes | Security fix |
| Rename tables | ✅ Yes | Already started |
| Add NOT NULL | ⚠️ Review | May fail on existing data |
| Add CHECK constraints | ⚠️ Review | May fail on existing data |
| Drop unused indexes | ⚠️ Review | Confirm unused |
| Update functions | ✅ Yes | Required for renamed tables |

---

## Summary: Priority Actions

1. **CRITICAL:** Add `user_id` to 21 tables (migration created)
2. **CRITICAL:** Fix RLS policies to use `(select auth.uid())` pattern
3. **HIGH:** Remove `OR user_id IS NULL` from all policies (security hole!)
4. **HIGH:** Rename tables (migration created)
5. **MEDIUM:** Add missing indexes for common queries
6. **MEDIUM:** Add NOT NULL and CHECK constraints
7. **LOW:** Update function names for renamed tables
