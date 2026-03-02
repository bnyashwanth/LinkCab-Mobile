-- ========================================================
-- LinkCab - Fix Signup Triggers
-- This script safely removes any older/conflicting triggers 
-- on auth.users that might be crashing new signups,
-- and reinstalls the correct users trigger.
-- ========================================================

-- 1. Drop the legacy profiles trigger (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- 2. Drop the legacy functions to keep the DB clean
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- 3. Re-create the CORRECT trigger function for 'users'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Ensure the wallet trigger acts correctly 
-- (If it fails, it also rolls back the auth.users insert)
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_wallet_trigger ON public.users;
CREATE TRIGGER create_wallet_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Success message
-- Run this whole script in your Supabase SQL editor.
