-- Function to get aggregated account balances for a date range
-- Input: date_from, date_to
-- Output: Table of account (text), balance (numeric)

CREATE OR REPLACE FUNCTION get_account_balances(date_from DATE, date_to DATE)
RETURNS TABLE (
    account TEXT,
    balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r->>'account' as account,
        SUM(
            COALESCE((r->>'credit')::numeric, 0) - 
            COALESCE((r->>'debit')::numeric, 0)
        ) as balance
    FROM 
        verifications v,
        jsonb_array_elements(v.rows) as r
    WHERE 
        v.date >= date_from 
        AND v.date <= date_to
    GROUP BY 
        r->>'account';
END;
$$ LANGUAGE plpgsql;
