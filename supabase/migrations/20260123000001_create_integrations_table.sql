-- ============================================
-- Integrations Table
-- Stores user integration connection states
-- ============================================

CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL,
    connected BOOLEAN NOT NULL DEFAULT false,
    connected_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Each user can only have one entry per integration
    UNIQUE(user_id, integration_id)
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integrations"
    ON integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON integrations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
    ON integrations FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_integration_id ON integrations(integration_id);

-- Trigger for updated_at
CREATE TRIGGER set_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE integrations IS 'Stores third-party integration connection states per user';
