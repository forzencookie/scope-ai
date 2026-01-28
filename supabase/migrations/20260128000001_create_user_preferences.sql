-- Create user_preferences table for persisting settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Notifications
    notify_new_invoices BOOLEAN DEFAULT true,
    notify_payment_reminders BOOLEAN DEFAULT true,
    notify_monthly_reports BOOLEAN DEFAULT false,
    notify_important_dates BOOLEAN DEFAULT false,
    notify_mobile BOOLEAN DEFAULT false,
    
    -- Appearance
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    density TEXT DEFAULT 'normal' CHECK (density IN ('compact', 'normal', 'comfortable')),
    compact_sidebar BOOLEAN DEFAULT false,
    
    -- Language
    language TEXT DEFAULT 'sv',
    currency TEXT DEFAULT 'SEK',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    first_day_of_week INTEGER DEFAULT 1 CHECK (first_day_of_week IN (0, 1)),
    text_mode TEXT DEFAULT 'enkel' CHECK (text_mode IN ('enkel', 'avancerad')),
    
    -- Email
    daily_summary BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Accessibility
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    larger_text BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'User settings and preferences for the application';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme: light, dark, or system';
COMMENT ON COLUMN user_preferences.text_mode IS 'Text complexity: enkel (simple) or avancerad (advanced)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();
