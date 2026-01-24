-- =============================================================================
-- OPTIMIZATION: RPC Functions for Dashboard Stats
-- Run this in your Supabase SQL Editor to enable server-side aggregations.
-- =============================================================================

-- 1. Transaction Stats
create or replace function get_transaction_stats()
returns jsonb
language plpgsql
security invoker -- Respects RLS policies automatically
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'income', coalesce(sum(case when amount > 0 then amount else 0 end), 0),
    'expenses', abs(coalesce(sum(case when amount < 0 then amount else 0 end), 0)),
    'pending', count(*) filter (where status in ('to_record', 'missing_documentation')),
    'totalCount', count(*)
  )
  into result
  from transactions;

  return result;
end;
$$;

-- 2. Invoice Stats (Consolidates Customer + Supplier)
create or replace function get_invoice_stats()
returns jsonb
language plpgsql
security invoker
as $$
declare
  incoming_total numeric;
  outgoing_total numeric;
  customer_overdue_count bigint;
  supplier_overdue_count bigint;
  customer_overdue_amount numeric;
  supplier_overdue_amount numeric;
  paid_amount numeric;
begin
  -- Incoming (Unpaid Customer Invoices)
  select coalesce(sum(total_amount), 0) into incoming_total
  from customer_invoices
  where status != 'betald';

  -- Outgoing (Unpaid Supplier Invoices)
  select coalesce(sum(total_amount), 0) into outgoing_total
  from supplier_invoices
  where status != 'betald';

  -- Overdue Customer
  select count(*), coalesce(sum(total_amount), 0)
  into customer_overdue_count, customer_overdue_amount
  from customer_invoices
  where status = 'Förfallen'; -- Matches INVOICE_STATUS_LABELS.OVERDUE

  -- Overdue Supplier
  select count(*), coalesce(sum(total_amount), 0)
  into supplier_overdue_count, supplier_overdue_amount
  from supplier_invoices
  where status = 'förfallen'; -- Matches explicit string in service

  -- Paid (Customer only typically for "revenue" stats, or both? Original logic used customer paid)
  select coalesce(sum(total_amount), 0) into paid_amount
  from customer_invoices
  where status = 'betald';

  return jsonb_build_object(
    'incomingTotal', incoming_total,
    'outgoingTotal', outgoing_total,
    'overdueCount', customer_overdue_count + supplier_overdue_count,
    'overdueAmount', customer_overdue_amount + supplier_overdue_amount,
    'paidAmount', paid_amount
  );
end;
$$;

-- 3. Receipt Stats
create or replace function get_receipt_stats()
returns jsonb
language plpgsql
security invoker
as $$
declare
  result jsonb;
begin
  -- Matched: verified, processed
  -- Unmatched: pending, processing, review_needed
  select jsonb_build_object(
    'total', count(*),
    'matchedCount', count(*) filter (where status in ('verified', 'processed')),
    'unmatchedCount', count(*) filter (where status in ('pending', 'processing', 'review_needed')),
    'totalAmount', coalesce(sum(amount), 0)
  )
  into result
  from receipts;

  return result;
end;
$$;

-- 4. Inventory Stats
create or replace function get_inventory_stats()
returns jsonb
language plpgsql
security invoker
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'totalCount', count(*),
    'totalInkopsvarde', coalesce(sum(inkopspris), 0),
    'kategorier', count(distinct kategori)
  )
  into result
  from inventarier;

  return result;
end;
$$;
