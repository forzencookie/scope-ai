-- Function to get employees with calculated balances
-- Output: Table of employee details + balance (2820) + mileage (7330)

CREATE OR REPLACE FUNCTION get_employee_balances()
RETURNS TABLE (
    id UUID,
    name TEXT,
    role TEXT,
    email TEXT,
    salary DECIMAL,
    status TEXT,
    balance NUMERIC,
    mileage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.role,
        e.email,
        e.monthly_salary as salary,
        e.status,
        -- Calculate Balance (Account 2820: Credit - Debit)
        COALESCE((
            SELECT SUM(
                COALESCE((r->>'credit')::numeric, 0) - COALESCE((r->>'debit')::numeric, 0)
            )
            FROM verifications v, jsonb_array_elements(v.rows) r
            WHERE 
                (r->>'account' = '2820') AND
                (v.description ILIKE '%' || e.name || '%' OR r->>'description' ILIKE '%' || e.name || '%')
        ), 0) as balance,
        
        -- Calculate Mileage (Account 7330: Debit)
        COALESCE((
            SELECT SUM(COALESCE((r->>'debit')::numeric, 0))
            FROM verifications v, jsonb_array_elements(v.rows) r
            WHERE 
                (r->>'account' = '7330') AND
                (v.description ILIKE '%' || e.name || '%' OR r->>'description' ILIKE '%' || e.name || '%')
        ), 0) as mileage
    FROM 
        employees e
    ORDER BY 
        e.name ASC;
END;
$$ LANGUAGE plpgsql;
