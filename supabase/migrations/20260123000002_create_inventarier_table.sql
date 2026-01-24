-- ============================================
-- Inventarier Table (Fixed Assets)
-- Stores fixed assets for depreciation tracking
-- ============================================

CREATE TABLE IF NOT EXISTS inventarier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core asset data
    namn TEXT NOT NULL,
    kategori TEXT NOT NULL DEFAULT 'Inventarier',
    beskrivning TEXT,
    
    -- Purchase information
    inkopsdatum DATE NOT NULL,
    inkopspris NUMERIC(12, 2) NOT NULL,
    leverantor TEXT,
    fakturanummer TEXT,
    
    -- Depreciation settings
    livslangd_ar INTEGER NOT NULL DEFAULT 5,
    avskrivningsmetod TEXT DEFAULT 'linear' CHECK (avskrivningsmetod IN ('linear', 'degressiv')),
    restvarde NUMERIC(12, 2) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'såld', 'avskriven', 'skrotad')),
    forsaljningsdatum DATE,
    forsaljningspris NUMERIC(12, 2),
    
    -- Additional data
    serienummer TEXT,
    placering TEXT,
    anteckningar TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventarier ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own inventarier"
    ON inventarier FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventarier"
    ON inventarier FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventarier"
    ON inventarier FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventarier"
    ON inventarier FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_inventarier_user_id ON inventarier(user_id);
CREATE INDEX idx_inventarier_kategori ON inventarier(kategori);
CREATE INDEX idx_inventarier_status ON inventarier(status);

-- Trigger for updated_at
CREATE TRIGGER set_inventarier_updated_at
    BEFORE UPDATE ON inventarier
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RPC function for inventory statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalCount', COALESCE(COUNT(*), 0),
        'totalInkopsvarde', COALESCE(SUM(inkopspris), 0),
        'kategorier', COALESCE(COUNT(DISTINCT kategori), 0)
    )
    INTO result
    FROM inventarier
    WHERE user_id = auth.uid()
      AND status = 'aktiv';
    
    RETURN result;
END;
$$;

-- Comment
COMMENT ON TABLE inventarier IS 'Stores fixed assets for depreciation tracking per user';
