-- Quick Fix for Mobile App Database Issues
-- Run this script in Supabase SQL Editor to fix immediate problems

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  profile_image TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'under_review', 'verified', 'rejected')),
  verification_documents JSONB,
  date_of_birth DATE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns to profiles table if they don't exist
DO $$
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add profile_image column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN profile_image TEXT;
    END IF;
END $$;

-- 3. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Sync existing users to profiles table
INSERT INTO public.profiles (id, email, full_name, phone, phone_number, avatar_url, profile_image, verification_status, created_at, updated_at)
SELECT 
    id, 
    email, 
    full_name, 
    phone_number as phone,
    phone_number,
    avatar_url,
    profile_image,
    verification_status,
    created_at,
    updated_at
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE public.profiles.id = public.users.id
);

-- 6. Create function to sync profiles
CREATE OR REPLACE FUNCTION public.sync_profile_from_users()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, phone_number, avatar_url, profile_image, verification_status, verification_documents, date_of_birth, address, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.full_name,
        NEW.phone_number,
        NEW.phone_number,
        NEW.avatar_url,
        NEW.profile_image,
        NEW.verification_status,
        NEW.verification_documents,
        NEW.date_of_birth,
        NEW.address,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone_number,
        phone_number = EXCLUDED.phone_number,
        avatar_url = EXCLUDED.avatar_url,
        profile_image = EXCLUDED.profile_image,
        verification_status = EXCLUDED.verification_status,
        verification_documents = EXCLUDED.verification_documents,
        date_of_birth = EXCLUDED.date_of_birth,
        address = EXCLUDED.address,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-sync
DROP TRIGGER IF EXISTS sync_profile_trigger ON public.users;
CREATE TRIGGER sync_profile_trigger
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_users();

-- 8. Create function to sync from profiles to users
CREATE OR REPLACE FUNCTION public.sync_user_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users SET
        full_name = NEW.full_name,
        phone_number = COALESCE(NEW.phone, NEW.phone_number),
        avatar_url = COALESCE(NEW.avatar_url, NEW.profile_image),
        profile_image = COALESCE(NEW.profile_image, NEW.avatar_url),
        verification_status = NEW.verification_status,
        verification_documents = NEW.verification_documents,
        date_of_birth = NEW.date_of_birth,
        address = NEW.address,
        updated_at = NEW.updated_at
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for profile updates
DROP TRIGGER IF EXISTS sync_user_trigger ON public.profiles;
CREATE TRIGGER sync_user_trigger
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_from_profile();

COMMIT;
