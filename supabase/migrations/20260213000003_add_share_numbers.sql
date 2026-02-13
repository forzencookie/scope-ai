-- Add share number ranges to shareholders table (ABL 5:2 compliance)
-- Swedish Companies Act requires each share to have a unique number

ALTER TABLE shareholders
    ADD COLUMN IF NOT EXISTS share_number_from integer,
    ADD COLUMN IF NOT EXISTS share_number_to integer;

-- Also add share numbers to share_transactions for audit trail
ALTER TABLE share_transactions
    ADD COLUMN IF NOT EXISTS share_number_from integer,
    ADD COLUMN IF NOT EXISTS share_number_to integer;

-- Constraint: share_number_to >= share_number_from when both set
ALTER TABLE shareholders
    ADD CONSTRAINT shareholders_share_numbers_valid
    CHECK (share_number_from IS NULL OR share_number_to IS NULL OR share_number_to >= share_number_from);

ALTER TABLE share_transactions
    ADD CONSTRAINT share_transactions_share_numbers_valid
    CHECK (share_number_from IS NULL OR share_number_to IS NULL OR share_number_to >= share_number_from);

COMMENT ON COLUMN shareholders.share_number_from IS 'First share number in range (ABL 5:2)';
COMMENT ON COLUMN shareholders.share_number_to IS 'Last share number in range (ABL 5:2)';

-- Auto-assign share numbers to existing shareholders who don't have them
-- Simple sequential assignment based on creation order
DO $$
DECLARE
    rec RECORD;
    next_number integer := 1;
BEGIN
    FOR rec IN
        SELECT id, shares_count
        FROM shareholders
        WHERE share_number_from IS NULL AND (shares_count IS NOT NULL AND shares_count > 0)
        ORDER BY created_at ASC
    LOOP
        UPDATE shareholders
        SET share_number_from = next_number,
            share_number_to = next_number + rec.shares_count - 1
        WHERE id = rec.id;

        next_number := next_number + rec.shares_count;
    END LOOP;
END $$;
