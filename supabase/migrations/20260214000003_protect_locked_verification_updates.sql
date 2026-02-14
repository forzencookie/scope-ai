-- ============================================================================
-- BFL 5 kap 4 section: Prevent modification of locked-period verifications
-- Blocks UPDATE on locked rows except when toggling the is_locked flag itself
-- (which manadsavslut needs to do).
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_locked_update() RETURNS trigger AS $$
BEGIN
    -- Allow toggling is_locked (manadsavslut needs this)
    IF OLD.is_locked = TRUE AND NEW.is_locked = OLD.is_locked THEN
        RAISE EXCEPTION 'Kan inte andra verifikation i en last period (BFL 5:4)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_locked_verification_update
    BEFORE UPDATE ON verifications
    FOR EACH ROW EXECUTE FUNCTION prevent_locked_update();
