-- User Memory Table
-- Stores user/company-specific facts for personalization
-- Part of AI Architecture v2

-- Create user_memory table
CREATE TABLE IF NOT EXISTS user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Memory content
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('decision', 'preference', 'pending')),
    
    -- Confidence and lifecycle
    confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    expires_at TIMESTAMPTZ,  -- NULL = never expires
    
    -- Audit trail (never hard-delete)
    superseded_by UUID REFERENCES user_memory(id),
    source_conversation_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient retrieval of active memories (not superseded)
-- Note: expires_at filter happens at query time since NOW() isn't immutable
CREATE INDEX idx_user_memory_active ON user_memory (company_id)
WHERE superseded_by IS NULL;

-- Index for finding superseded chains
CREATE INDEX idx_user_memory_superseded ON user_memory (superseded_by)
WHERE superseded_by IS NOT NULL;

-- Enable RLS
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access memories for companies they belong to
-- Note: companies.id is TEXT, company_members.company_id is UUID, so we cast
CREATE POLICY "Users can view their company memories"
ON user_memory
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT c.id 
        FROM companies c
        WHERE c.user_id = auth.uid()
    )
    OR
    company_id::uuid IN (
        SELECT cm.company_id 
        FROM company_members cm 
        WHERE cm.user_id = auth.uid()
    )
);

-- RLS Policy: Users can insert memories for their companies
CREATE POLICY "Users can create memories for their companies"
ON user_memory
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT c.id 
        FROM companies c
        WHERE c.user_id = auth.uid()
    )
    OR
    company_id::uuid IN (
        SELECT cm.company_id 
        FROM company_members cm 
        WHERE cm.user_id = auth.uid()
    )
);

-- RLS Policy: Users can update memories for their companies
CREATE POLICY "Users can update their company memories"
ON user_memory
FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT c.id 
        FROM companies c
        WHERE c.user_id = auth.uid()
    )
    OR
    company_id::uuid IN (
        SELECT cm.company_id 
        FROM company_members cm 
        WHERE cm.user_id = auth.uid()
    )
);

-- Comment
COMMENT ON TABLE user_memory IS 'User/company-specific memories for AI personalization. Part of AI Architecture v2.';
COMMENT ON COLUMN user_memory.category IS 'decision = past action taken, preference = user preference, pending = considering/planning';
COMMENT ON COLUMN user_memory.superseded_by IS 'If not null, this memory was replaced by another. Never hard-delete for audit trail.';
