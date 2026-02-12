-- Add verification-related columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_started' CHECK (verification_status IN ('not_started', 'submitted', 'under_review', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_documents JSONB;
