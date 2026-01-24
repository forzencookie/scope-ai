-- Agent Metrics Table
-- Tracks all agent interactions for analytics and debugging

CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Request info
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Agent routing
    intent TEXT NOT NULL,
    intent_confidence DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    selected_agent TEXT NOT NULL,
    handoffs TEXT[] DEFAULT '{}',
    is_multi_agent BOOLEAN DEFAULT FALSE,
    
    -- Performance (in milliseconds)
    classification_time_ms INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    total_time_ms INTEGER DEFAULT 0,
    
    -- Tool usage
    tools_called TEXT[] DEFAULT '{}',
    tools_succeeded INTEGER DEFAULT 0,
    tools_failed INTEGER DEFAULT 0,
    
    -- Response info
    response_success BOOLEAN DEFAULT TRUE,
    response_length INTEGER DEFAULT 0,
    has_display BOOLEAN DEFAULT FALSE,
    has_confirmation BOOLEAN DEFAULT FALSE,
    has_navigation BOOLEAN DEFAULT FALSE,
    
    -- Model info
    model_id TEXT,
    tokens_estimate INTEGER,
    
    -- Error tracking
    error TEXT,
    error_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Indexes for common queries
    CONSTRAINT valid_intent CHECK (intent IN (
        'RECEIPT', 'INVOICE', 'BOOKKEEPING', 'PAYROLL', 'TAX',
        'REPORTING', 'COMPLIANCE', 'STATISTICS', 'EVENTS', 'SETTINGS',
        'NAVIGATION', 'GENERAL', 'MULTI_DOMAIN'
    )),
    CONSTRAINT valid_agent CHECK (selected_agent IN (
        'orchestrator', 'bokforing', 'receipts', 'invoices', 'loner',
        'skatt', 'rapporter', 'compliance', 'statistik', 'handelser', 'installningar'
    ))
);

-- Indexes for analytics queries
CREATE INDEX idx_agent_metrics_user ON agent_metrics(user_id);
CREATE INDEX idx_agent_metrics_company ON agent_metrics(company_id);
CREATE INDEX idx_agent_metrics_created ON agent_metrics(created_at DESC);
CREATE INDEX idx_agent_metrics_agent ON agent_metrics(selected_agent);
CREATE INDEX idx_agent_metrics_intent ON agent_metrics(intent);
CREATE INDEX idx_agent_metrics_success ON agent_metrics(response_success);

-- RLS Policies
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- Users can read their own metrics
CREATE POLICY "Users can view own metrics"
    ON agent_metrics FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert metrics (from API route)
CREATE POLICY "Service role can insert metrics"
    ON agent_metrics FOR INSERT
    WITH CHECK (TRUE);

-- Comment
COMMENT ON TABLE agent_metrics IS 'Tracks agent system interactions for analytics and debugging';
COMMENT ON COLUMN agent_metrics.intent IS 'Classified intent category of the user request';
COMMENT ON COLUMN agent_metrics.selected_agent IS 'The agent that handled the request';
COMMENT ON COLUMN agent_metrics.handoffs IS 'Array of agents involved in multi-agent workflows';
COMMENT ON COLUMN agent_metrics.total_time_ms IS 'Total request handling time in milliseconds';
