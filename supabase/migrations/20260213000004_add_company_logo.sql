-- Add logo_url column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url text;

-- Create company-logos storage bucket (public for direct URL access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload company logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Company logos are publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'company-logos');

-- Allow users to update/delete their own logos
CREATE POLICY "Users can update their company logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their company logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
