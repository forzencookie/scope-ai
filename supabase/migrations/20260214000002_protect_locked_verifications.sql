-- ============================================================================
-- BFL 7 kap: Protect locked-period verifications from deletion
-- Creates a database trigger that prevents DELETE on locked verifications.
-- Locked verifications represent closed periods with 7-year retention.
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_locked_delete() RETURNS trigger AS $$
BEGIN
    IF OLD.is_locked = TRUE THEN
        RAISE EXCEPTION 'Kan inte radera verifikation i en last period (BFL 7 kap)';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_locked_verification_delete
    BEFORE DELETE ON verifications
    FOR EACH ROW EXECUTE FUNCTION prevent_locked_delete();
