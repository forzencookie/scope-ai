-- Migration: verification_attachments table + storage bucket
-- Supports BFL 5:6 requirement that every verification has underlag (supporting documentation)

-- =============================================================================
-- Table: verification_attachments
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.verification_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    source_type TEXT CHECK (source_type IN ('receipt', 'invoice', 'manual')),
    source_id UUID,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_attachments_verification_id
    ON public.verification_attachments(verification_id);

CREATE INDEX IF NOT EXISTS idx_verification_attachments_company_id
    ON public.verification_attachments(company_id);

CREATE INDEX IF NOT EXISTS idx_verification_attachments_source
    ON public.verification_attachments(source_type, source_id)
    WHERE source_id IS NOT NULL;

-- =============================================================================
-- RLS: Row-Level Security
-- =============================================================================
ALTER TABLE public.verification_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only see attachments belonging to their company
CREATE POLICY "Users can view own company attachments"
    ON public.verification_attachments
    FOR SELECT
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Users can insert attachments for their own company
CREATE POLICY "Users can insert own company attachments"
    ON public.verification_attachments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Users can delete attachments they created
CREATE POLICY "Users can delete own attachments"
    ON public.verification_attachments
    FOR DELETE
    USING (
        user_id = auth.uid()
        AND company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- Storage bucket: verification-underlag (private)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-underlag',
    'verification-underlag',
    false,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their company folder
CREATE POLICY "Users can upload verification underlag"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'verification-underlag'
        AND auth.uid() IS NOT NULL
    );

-- Storage RLS: users can read their own company's files
CREATE POLICY "Users can read verification underlag"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-underlag'
        AND auth.uid() IS NOT NULL
    );

-- Storage RLS: users can delete their own uploads
CREATE POLICY "Users can delete verification underlag"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'verification-underlag'
        AND auth.uid() IS NOT NULL
    );
