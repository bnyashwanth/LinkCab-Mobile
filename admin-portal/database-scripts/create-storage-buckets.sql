-- ========================================================
-- LinkCab - Create Storage Buckets
-- This script safely creates the necessary storage buckets
-- for profile avatars and KYC verification documents.
-- ========================================================

-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create the 'verification-documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ========================================================
-- Set up Storage Access Policies
-- (We'll safely drop existing ones before recreating to avoid errors)
-- ========================================================

-- Policies for avatars
DROP POLICY IF EXISTS "Public Access avatars" ON storage.objects;
CREATE POLICY "Public Access avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policies for verification documents
DROP POLICY IF EXISTS "Public Access verification-documents" ON storage.objects;
CREATE POLICY "Public Access verification-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-documents');

DROP POLICY IF EXISTS "Authenticated users can upload verification docs" ON storage.objects;
CREATE POLICY "Authenticated users can upload verification docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own verification docs" ON storage.objects;
CREATE POLICY "Users can update their own verification docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'verification-documents' AND auth.role() = 'authenticated');

-- Success message
-- Run this whole script in your Supabase SQL editor.
