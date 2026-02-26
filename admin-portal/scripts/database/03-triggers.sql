-- =============================================================================
-- LINKCAB DATABASE SCHEMA - TRIGERS AND FUNCTIONS
-- =============================================================================
-- This file contains all triggers and stored procedures for automation
-- Run this after 01-schema.sql and 02-policies.sql
-- =============================================================================

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- USER PROFILE SYNC TRIGGERS
-- =============================================================================

-- Function to sync users table to profiles table
CREATE OR REPLACE FUNCTION sync_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update profiles table
  INSERT INTO public.profiles (
    id, email, full_name, phone, phone_number, avatar_url, profile_image,
    verification_status, verification_documents, date_of_birth, address, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, NEW.full_name, NEW.phone_number, NEW.phone_number, 
    NEW.avatar_url, NEW.profile_image, NEW.verification_status, NEW.verification_documents,
    NEW.date_of_birth, NEW.address, NEW.created_at, NEW.updated_at
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

-- Function to sync profiles table to users table
CREATE OR REPLACE FUNCTION sync_profile_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Update users table when profiles is updated
  UPDATE public.users SET
    full_name = NEW.full_name,
    phone_number = COALESCE(NEW.phone, NEW.phone_number),
    avatar_url = COALESCE(NEW.avatar_url, NEW.profile_image),
    profile_image = COALESCE(NEW.profile_image, NEW.avatar_url),
    verification_status = NEW.verification_status,
    verification_documents = NEW.verification_documents,
    date_of_birth = NEW.date_of_birth,
    address = NEW.address,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USER CREATION TRIGGER
-- =============================================================================

-- Function to create user profile automatically after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- Insert into profiles table for mobile app compatibility
  INSERT INTO public.profiles (id, email, full_name, phone, phone_number, avatar_url, profile_image)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NULL,
    NULL,
    NULL,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- AUDIT LOGGING TRIGGERS
-- =============================================================================

-- Function to log changes to users table
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'USER_CREATED'
      WHEN TG_OP = 'UPDATE' THEN 'USER_UPDATED'
      WHEN TG_OP = 'DELETE' THEN 'USER_DELETED'
      ELSE 'USER_CHANGED'
    END,
    'user',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log changes to announcements
CREATE OR REPLACE FUNCTION log_announcement_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'ANNOUNCEMENT_CREATED'
      WHEN TG_OP = 'UPDATE' THEN 'ANNOUNCEMENT_UPDATED'
      WHEN TG_OP = 'DELETE' THEN 'ANNOUNCEMENT_DELETED'
      ELSE 'ANNOUNCEMENT_CHANGED'
    END,
    'announcement',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log changes to disputes
CREATE OR REPLACE FUNCTION log_dispute_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'DISPUTE_CREATED'
      WHEN TG_OP = 'UPDATE' THEN 'DISPUTE_UPDATED'
      WHEN TG_OP = 'DELETE' THEN 'DISPUTE_DELETED'
      ELSE 'DISPUTE_CHANGED'
    END,
    'dispute',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

-- Users table updated_at trigger
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profiles table updated_at trigger
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Announcements table updated_at trigger
CREATE TRIGGER update_announcements_updated_at 
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Requests table updated_at trigger
CREATE TRIGGER update_requests_updated_at 
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disputes table updated_at trigger
CREATE TRIGGER update_disputes_updated_at 
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Security alerts table updated_at trigger
CREATE TRIGGER update_security_alerts_updated_at 
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SYNC TRIGGERS
-- =============================================================================

-- Trigger to sync users to profiles
DROP TRIGGER IF EXISTS on_user_update ON public.users;
CREATE TRIGGER on_user_update
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_profile();

-- Trigger to sync profiles to users
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_to_users();

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- AUDIT TRIGGERS
-- =============================================================================

-- Users table audit trigger
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION log_user_changes();

-- Announcements table audit trigger
CREATE TRIGGER audit_announcements_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION log_announcement_changes();

-- Disputes table audit trigger
CREATE TRIGGER audit_disputes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION log_dispute_changes();

COMMIT;
