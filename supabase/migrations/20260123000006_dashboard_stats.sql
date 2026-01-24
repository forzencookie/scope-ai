-- Function to get monthly cashflow (Revenue vs Expenses) for a given year
-- Input: year (int)
-- Output: Table of month (text YYYY-MM), revenue (numeric), expenses (numeric), result (numeric)

CREATE OR REPLACE FUNCTION get_monthly_cashflow(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TABLE (
    month TEXT,
    revenue NUMERIC,
    expenses NUMERIC,
    result NUMERIC
) AS $$
DECLARE
    start_date DATE := make_date(p_year, 1, 1);
    end_date DATE := make_date(p_year, 12, 31);
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            TO_CHAR(v.date, 'YYYY-MM') as month_key,
            SUM(CASE WHEN (row_data->>'account')::int BETWEEN 3000 AND 3999 THEN 
                (COALESCE((row_data->>'credit')::numeric, 0) - COALESCE((row_data->>'debit')::numeric, 0))
            ELSE 0 END) as revenue_sum, -- Revenue is Credit - Debit (Positive)
            
            SUM(CASE WHEN (row_data->>'account')::int BETWEEN 4000 AND 8999 THEN 
                (COALESCE((row_data->>'debit')::numeric, 0) - COALESCE((row_data->>'credit')::numeric, 0))
            ELSE 0 END) as expense_sum -- Expense is Debit - Credit (Positive)
        FROM 
            verifications v,
            jsonb_array_elements(v.rows) as row_data
        WHERE 
            v.date >= start_date AND v.date <= end_date
        GROUP BY 
            TO_CHAR(v.date, 'YYYY-MM')
    )
    SELECT 
        md.month_key as month,
        md.revenue_sum as revenue,
        md.expense_sum as expenses,
        (md.revenue_sum - md.expense_sum) as result
    FROM 
        monthly_data md
    ORDER BY 
        month ASC;
END;
$$ LANGUAGE plpgsql;


-- Function to get dashboard counts (Transactions, Invoices)
-- Output: JSON object with counts

CREATE OR REPLACE FUNCTION get_dashboard_counts()
RETURNS JSON AS $$
DECLARE
    result JSON;
    tx_total INTEGER;
    tx_unbooked INTEGER;
    inv_sent INTEGER;
    inv_overdue INTEGER;
    inv_total_mny NUMERIC;
BEGIN
    -- Transaction Counts
    SELECT COUNT(*) INTO tx_total FROM transactions;
    SELECT COUNT(*) INTO tx_unbooked FROM transactions WHERE status = 'Att bokföra';
    
    -- Invoice Counts (Customer Invoices)
    -- Assuming 'invoices' table is for customer invoices as per server-db.ts
    SELECT COUNT(*) INTO inv_sent FROM invoices WHERE status = 'Skickad'; 
    SELECT COUNT(*) INTO inv_overdue FROM invoices WHERE status = 'Förfallen';
    SELECT COALESCE(SUM(total_amount), 0) INTO inv_total_mny FROM invoices WHERE status != 'Makulerad';

    SELECT json_build_object(
        'transactions', json_build_object(
            'total', tx_total,
            'unbooked', tx_unbooked
        ),
        'invoices', json_build_object(
            'sent', inv_sent,
            'overdue', inv_overdue,
            'totalValue', inv_total_mny
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
