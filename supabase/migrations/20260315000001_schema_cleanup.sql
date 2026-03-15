-- =============================================================================
-- Phase 3: Schema Cleanup — Rename tables, drop dead tables/RPCs
-- =============================================================================
-- Pre-launch cleanup. No data migration needed (no production data exists).
-- If running against a database with data, back up first.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Drop dead tables (20 tables, zero code references)
-- =============================================================================

DROP TABLE IF EXISTS ailogs CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS boardminutes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS companymeetings CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS dividends CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS employeebenefits CASCADE;
DROP TABLE IF EXISTS formaner_catalog CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;          -- duplicate of customerinvoices
DROP TABLE IF EXISTS monthclosings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ratelimits CASCADE;
DROP TABLE IF EXISTS ratelimitssliding CASCADE;
DROP TABLE IF EXISTS securityauditlog CASCADE;
DROP TABLE IF EXISTS share_transactions CASCADE; -- duplicate of sharetransactions
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS tax_reports CASCADE;        -- duplicate of taxreports

-- =============================================================================
-- 2. Rename concatenated table names → snake_case
-- =============================================================================

ALTER TABLE IF EXISTS accountbalances    RENAME TO account_balances;
ALTER TABLE IF EXISTS agireports         RENAME TO agi_reports;
ALTER TABLE IF EXISTS aiusage            RENAME TO ai_usage;
ALTER TABLE IF EXISTS annualclosings     RENAME TO annual_closings;
ALTER TABLE IF EXISTS annualreports      RENAME TO annual_reports;
ALTER TABLE IF EXISTS bankconnections    RENAME TO bank_connections;
ALTER TABLE IF EXISTS customerinvoices   RENAME TO customer_invoices;
ALTER TABLE IF EXISTS financialperiods   RENAME TO financial_periods;
ALTER TABLE IF EXISTS inboxitems         RENAME TO inbox_items;
ALTER TABLE IF EXISTS incomedeclarations RENAME TO income_declarations;
ALTER TABLE IF EXISTS neappendices       RENAME TO ne_appendices;
ALTER TABLE IF EXISTS sharetransactions  RENAME TO share_transactions;
ALTER TABLE IF EXISTS supplierinvoices   RENAME TO supplier_invoices;
ALTER TABLE IF EXISTS taxcalendar        RENAME TO tax_calendar;
ALTER TABLE IF EXISTS taxreports         RENAME TO tax_reports;
ALTER TABLE IF EXISTS usercredits        RENAME TO user_credits;
ALTER TABLE IF EXISTS vatdeclarations    RENAME TO vat_declarations;

-- =============================================================================
-- 3. Drop dead RPCs (19 functions, zero code references)
-- =============================================================================

DROP FUNCTION IF EXISTS check_rate_limit_atomic CASCADE;
DROP FUNCTION IF EXISTS check_rls_status CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_rate_limits_sliding CASCADE;
DROP FUNCTION IF EXISTS clear_demo_data CASCADE;
DROP FUNCTION IF EXISTS get_invoice_stats_v1 CASCADE;
DROP FUNCTION IF EXISTS get_invoice_stats_v2 CASCADE;
DROP FUNCTION IF EXISTS get_meeting_stats CASCADE;
DROP FUNCTION IF EXISTS get_meeting_stats_v1 CASCADE;
DROP FUNCTION IF EXISTS get_meeting_stats_v2 CASCADE;
DROP FUNCTION IF EXISTS get_or_create_monthly_usage CASCADE;
DROP FUNCTION IF EXISTS get_shareholder_stats CASCADE;
DROP FUNCTION IF EXISTS get_shareholder_stats_v1 CASCADE;
DROP FUNCTION IF EXISTS get_transaction_stats CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS verify_rls_status CASCADE;
DROP FUNCTION IF EXISTS verify_security_setup CASCADE;

-- =============================================================================
-- 4. Deduplicate columns
-- =============================================================================

-- shareholders: drop shares_count (keep shares)
ALTER TABLE IF EXISTS shareholders DROP COLUMN IF EXISTS shares_count;

-- receipts: drop vendor (keep supplier)
ALTER TABLE IF EXISTS receipts DROP COLUMN IF EXISTS vendor;

-- payslips: drop paid_at (keep payment_date)
ALTER TABLE IF EXISTS payslips DROP COLUMN IF EXISTS paid_at;

-- transactions: drop redundant timestamp columns (keep date + created_at)
ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS occurred_at;
ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS "timestamp";
ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS booked_at;

COMMIT;
