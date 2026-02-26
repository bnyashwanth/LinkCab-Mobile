-- LinkCab Admin Portal Database Schema
-- Run this script in your Supabase SQL Editor to set up the required tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  phone TEXT, -- Alias for phone_number for compatibility
  date_of_birth DATE,
  address TEXT,
  profile_image TEXT,
  avatar_url TEXT, -- Alias for profile_image for compatibility
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'under_review', 'verified', 'rejected')),
  verification_documents JSONB,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'under_review', 'verified', 'rejected')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (for mobile app compatibility - aliases to users table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  phone_number TEXT, -- Alias for phone
  avatar_url TEXT,
  profile_image TEXT, -- Alias for avatar_url
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'under_review', 'verified', 'rejected')),
  verification_documents JSONB,
  date_of_birth DATE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view to sync profiles with users table
CREATE OR REPLACE VIEW public.profiles_sync AS
SELECT 
  id,
  email,
  full_name,
  phone_number as phone,
  phone_number,
  avatar_url,
  profile_image,
  verification_status,
  verification_documents,
  date_of_birth,
  address,
  created_at,
  updated_at
FROM public.users;

-- Trigger to keep profiles table in sync with users table
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

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_to_users();

-- Function to sync users to profiles
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

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_user_update ON public.users;
CREATE TRIGGER on_user_update
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_profile();

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  route TEXT NOT NULL,
  travel_date DATE NOT NULL,
  travel_time TIME NOT NULL,
  available_seats INTEGER NOT NULL DEFAULT 1,
  requested_seats INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'suspended')),
  price_per_person DECIMAL(10,2),
  transport_mode TEXT DEFAULT 'any' CHECK (transport_mode IN ('cab', 'auto', 'bus', 'train', 'any')),
  preferences TEXT[],
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  duplicate_count INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 0,
  connection_requests INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table (connection requests)
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, requester_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('harassment', 'no_show', 'payment_dispute', 'unsafe_behavior', 'emergency')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, COALESCE(announcement_id, request_id::text))
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fake_profile', 'suspicious_activity', 'harassment', 'spam', 'unsafe_behavior')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'false_positive')),
  risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON public.announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_travel_date ON public.announcements(travel_date);
CREATE INDEX IF NOT EXISTS idx_announcements_route ON public.announcements(route);
CREATE INDEX IF NOT EXISTS idx_announcements_risk_level ON public.announcements(risk_level);

CREATE INDEX IF NOT EXISTS idx_requests_announcement_id ON public.requests(announcement_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON public.requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_disputes_reporter_id ON public.disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_reported_user_id ON public.disputes(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_type ON public.disputes(type);

CREATE INDEX IF NOT EXISTS idx_ratings_rated_user_id ON public.ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON public.ratings(rating);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Profiles table policies (for mobile app compatibility)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Announcements table policies
CREATE POLICY "Users can view own announcements" ON public.announcements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own announcements" ON public.announcements
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own announcements" ON public.announcements
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all announcements" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Requests table policies
CREATE POLICY "Users can view own requests" ON public.requests
  FOR SELECT USING (requester_id = auth.uid() OR announcement_id IN (
    SELECT id FROM public.announcements WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create requests" ON public.requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own requests" ON public.requests
  FOR UPDATE USING (requester_id = auth.uid());

-- Transactions table policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Disputes table policies
CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Ratings table policies
CREATE POLICY "Users can view ratings" ON public.ratings
  FOR SELECT USING (rater_id = auth.uid() OR rated_user_id = auth.uid());

CREATE POLICY "Users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Audit logs table policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Security alerts table policies
CREATE POLICY "Admins can view all security alerts" ON public.security_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_alerts_updated_at BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification documents
CREATE POLICY "Users can upload own verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND 
    auth.role() = 'authenticated' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Sample data for testing (optional)
-- Uncomment to insert sample data for development

-- INSERT INTO public.users (id, email, full_name, role, verification_status) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'admin@linkcab.in', 'Admin User', 'super_admin', 'verified'),
-- ('00000000-0000-0000-0000-000000000002', 'john.doe@example.com', 'John Doe', 'user', 'verified'),
-- ('00000000-0000-0000-0000-000000000003', 'jane.smith@example.com', 'Jane Smith', 'user', 'pending')
-- ON CONFLICT (id) DO NOTHING;

COMMIT;
