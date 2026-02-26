-- =============================================================================
-- LINKCAB DATABASE SCHEMA - STORAGE CONFIGURATION
-- =============================================================================
-- This file contains storage bucket configuration and policies
-- Run this after 01-schema.sql, 02-policies.sql, and 03-triggers.sql
-- =============================================================================

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for dispute evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Verification documents policies
DROP POLICY IF EXISTS "Users can upload own verification documents" ON storage.objects;
CREATE POLICY "Users can upload own verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own verification documents" ON storage.objects;
CREATE POLICY "Users can view own verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own verification documents" ON storage.objects;
CREATE POLICY "Users can update own verification documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'verification-documents' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;
CREATE POLICY "Users can delete own verification documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'verification-documents' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Profile images policies
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
CREATE POLICY "Users can upload own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own profile images" ON storage.objects;
CREATE POLICY "Users can view own profile images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Announcement images policies
DROP POLICY IF EXISTS "Users can upload own announcement images" ON storage.objects;
CREATE POLICY "Users can upload own announcement images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'announcement-images' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Everyone can view announcement images" ON storage.objects;
CREATE POLICY "Everyone can view announcement images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'announcement-images' AND 
    auth.role() = 'authenticated'
  );

-- Dispute evidence policies (admin only)
DROP POLICY IF EXISTS "Admins can manage dispute evidence" ON storage.objects;
CREATE POLICY "Admins can manage dispute evidence" ON storage.objects
  FOR ALL USING (
    bucket_id = 'dispute-evidence' AND 
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- STORAGE FUNCTIONS
-- =============================================================================

-- Function to generate unique file paths
CREATE OR REPLACE FUNCTION generate_file_path(bucket_name TEXT, user_id TEXT, file_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN bucket_name || '/' || user_id || '/' || 
         to_hex(gen_random_bytes(8)) || '_' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check file size limits
CREATE OR REPLACE FUNCTION check_file_size_limit(bucket_name TEXT, file_size_bytes BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  max_size BIGINT;
BEGIN
  -- Set different limits for different buckets
  CASE bucket_name
    WHEN 'verification-documents' THEN max_size := 5 * 1024 * 1024; -- 5MB
    WHEN 'profile-images' THEN max_size := 2 * 1024 * 1024; -- 2MB
    WHEN 'announcement-images' THEN max_size := 10 * 1024 * 1024; -- 10MB
    WHEN 'dispute-evidence' THEN max_size := 20 * 1024 * 1024; -- 20MB
    ELSE max_size := 5 * 1024 * 1024; -- Default 5MB
  END CASE;
  
  RETURN file_size_bytes <= max_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file type
CREATE OR REPLACE FUNCTION is_valid_file_type(file_name TEXT, bucket_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  file_ext TEXT;
  allowed_types TEXT[];
BEGIN
  file_ext := lower(substring(file_name from length(file_name) - position('.' in reverse(file_name)) + 1));
  
  -- Define allowed types per bucket
  CASE bucket_name
    WHEN 'verification-documents' THEN 
      allowed_types := ARRAY['jpg', 'jpeg', 'png', 'pdf', 'webp'];
    WHEN 'profile-images' THEN 
      allowed_types := ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif'];
    WHEN 'announcement-images' THEN 
      allowed_types := ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif'];
    WHEN 'dispute-evidence' THEN 
      allowed_types := ARRAY['jpg', 'jpeg', 'png', 'pdf', 'webp', 'mp4', 'mov', 'avi'];
    ELSE 
      allowed_types := ARRAY['jpg', 'jpeg', 'png', 'webp'];
  END CASE;
  
  RETURN file_ext = ANY(allowed_types);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
