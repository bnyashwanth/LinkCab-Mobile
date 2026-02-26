-- =============================================================================
-- LINKCAB DATABASE SCHEMA - ROW LEVEL SECURITY POLICIES
-- =============================================================================
-- This file contains all RLS policies for data security and access control
-- Run this after 01-schema.sql
-- =============================================================================

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update all users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- PROFILES TABLE POLICIES (Mobile App Compatibility)
-- =============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- =============================================================================

-- Users can view their own announcements
DROP POLICY IF EXISTS "Users can view own announcements" ON public.announcements;
CREATE POLICY "Users can view own announcements" ON public.announcements
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own announcements
DROP POLICY IF EXISTS "Users can create own announcements" ON public.announcements;
CREATE POLICY "Users can create own announcements" ON public.announcements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own announcements
DROP POLICY IF EXISTS "Users can update own announcements" ON public.announcements;
CREATE POLICY "Users can update own announcements" ON public.announcements
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own announcements
DROP POLICY IF EXISTS "Users can delete own announcements" ON public.announcements;
CREATE POLICY "Users can delete own announcements" ON public.announcements
  FOR DELETE USING (user_id = auth.uid());

-- Everyone can view active announcements (for ride discovery)
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;
CREATE POLICY "Everyone can view active announcements" ON public.announcements
  FOR SELECT USING (status = 'active');

-- Admins can view all announcements
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
CREATE POLICY "Admins can view all announcements" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- REQUESTS TABLE POLICIES
-- =============================================================================

-- Users can view requests they're involved in
DROP POLICY IF EXISTS "Users can view involved requests" ON public.requests;
CREATE POLICY "Users can view involved requests" ON public.requests
  FOR SELECT USING (
    requester_id = auth.uid() OR 
    announcement_id IN (
      SELECT id FROM public.announcements WHERE user_id = auth.uid()
    )
  );

-- Users can create requests
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
CREATE POLICY "Users can create requests" ON public.requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Users can update their own requests
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests
  FOR UPDATE USING (requester_id = auth.uid());

-- Announcement owners can update requests for their announcements
DROP POLICY IF EXISTS "Announcement owners can update requests" ON public.requests;
CREATE POLICY "Announcement owners can update requests" ON public.requests
  FOR UPDATE USING (
    announcement_id IN (
      SELECT id FROM public.announcements WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRANSACTIONS TABLE POLICIES
-- =============================================================================

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own transactions
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- DISPUTES TABLE POLICIES
-- =============================================================================

-- Users can view disputes they're involved in
DROP POLICY IF EXISTS "Users can view involved disputes" ON public.disputes;
CREATE POLICY "Users can view involved disputes" ON public.disputes
  FOR SELECT USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

-- Users can create disputes
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Users can update their own disputes
DROP POLICY IF EXISTS "Users can update own disputes" ON public.disputes;
CREATE POLICY "Users can update own disputes" ON public.disputes
  FOR UPDATE USING (reporter_id = auth.uid());

-- Admins can view all disputes
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- RATINGS TABLE POLICIES
-- =============================================================================

-- Users can view ratings they're involved in
DROP POLICY IF EXISTS "Users can view involved ratings" ON public.ratings;
CREATE POLICY "Users can view involved ratings" ON public.ratings
  FOR SELECT USING (rater_id = auth.uid() OR rated_user_id = auth.uid());

-- Users can create ratings
DROP POLICY IF EXISTS "Users can create ratings" ON public.ratings;
CREATE POLICY "Users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Users can update their own ratings
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE USING (rater_id = auth.uid());

-- =============================================================================
-- AUDIT LOGS TABLE POLICIES
-- =============================================================================

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- SECURITY ALERTS TABLE POLICIES
-- =============================================================================

-- Admins can view all security alerts
DROP POLICY IF EXISTS "Admins can view all security alerts" ON public.security_alerts;
CREATE POLICY "Admins can view all security alerts" ON public.security_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Users can view security alerts about themselves
DROP POLICY IF EXISTS "Users can view own security alerts" ON public.security_alerts;
CREATE POLICY "Users can view own security alerts" ON public.security_alerts
  FOR SELECT USING (user_id = auth.uid());

COMMIT;
