-- ============================================================================
-- BFL 5 kap 7 section: Atomic gap-free verification numbering
-- Adds UNIQUE constraint on (series, number, fiscal_year, user_id)
-- to prevent duplicate verification numbers from race conditions.
-- ============================================================================

-- First, detect and fix any existing duplicate (series, number, fiscal_year, user_id) rows.
-- We keep the earliest-created row and bump duplicates to the next available number.
DO $$
DECLARE
    dup RECORD;
    next_num INTEGER;
BEGIN
    FOR dup IN
        SELECT id, series, number, fiscal_year, user_id, created_at,
               ROW_NUMBER() OVER (
                   PARTITION BY series, number, fiscal_year, user_id
                   ORDER BY created_at ASC
               ) AS rn
        FROM verifications
        WHERE series IS NOT NULL
          AND number IS NOT NULL
          AND fiscal_year IS NOT NULL
          AND user_id IS NOT NULL
    LOOP
        IF dup.rn > 1 THEN
            -- Find the next available number for this series/year/user
            SELECT COALESCE(MAX(v.number), 0) + 1
            INTO next_num
            FROM verifications v
            WHERE v.series = dup.series
              AND v.fiscal_year = dup.fiscal_year
              AND v.user_id = dup.user_id;

            UPDATE verifications
            SET number = next_num
            WHERE id = dup.id;
        END IF;
    END LOOP;
END;
$$;

-- Now add the unique constraint
ALTER TABLE verifications
    ADD CONSTRAINT uq_verification_number
    UNIQUE (series, number, fiscal_year, user_id);
