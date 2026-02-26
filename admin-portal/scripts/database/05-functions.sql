-- =============================================================================
-- LINKCAB DATABASE SCHEMA - HELPER FUNCTIONS
-- =============================================================================
-- This file contains additional helper functions and stored procedures
-- Run this after the previous schema files
-- =============================================================================

-- =============================================================================
-- USER AND PROFILE FUNCTIONS
-- =============================================================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_announcements', COALESCE((
      SELECT COUNT(*) FROM public.announcements 
      WHERE user_id = user_id_param
    ), 0),
    'active_announcements', COALESCE((
      SELECT COUNT(*) FROM public.announcements 
      WHERE user_id = user_id_param AND status = 'active'
    ), 0),
    'total_requests_received', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE announcement_id IN (
        SELECT id FROM public.announcements WHERE user_id = user_id_param
      )
    ), 0),
    'total_requests_made', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE requester_id = user_id_param
    ), 0),
    'average_rating', COALESCE((
      SELECT COALESCE(AVG(rating), 0) FROM public.ratings 
      WHERE rated_user_id = user_id_param
    ), 0),
    'total_ratings', COALESCE((
      SELECT COUNT(*) FROM public.ratings 
      WHERE rated_user_id = user_id_param
    ), 0),
    'total_disputes', COALESCE((
      SELECT COUNT(*) FROM public.disputes 
      WHERE reporter_id = user_id_param OR reported_user_id = user_id_param
    ), 0),
    'verification_status', COALESCE((
      SELECT verification_status FROM public.users 
      WHERE id = user_id_param
    ), 'pending')
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user safety score
CREATE OR REPLACE FUNCTION calculate_user_safety_score(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 50; -- Base score
  verification_multiplier NUMERIC := 1.0;
  rating_multiplier NUMERIC := 1.0;
  activity_multiplier NUMERIC := 1.0;
  disputes_penalty INTEGER := 0;
BEGIN
  -- Verification status bonus
  SELECT CASE verification_status
    WHEN 'verified' THEN verification_multiplier := 1.5
    WHEN 'under_review' THEN verification_multiplier := 1.2
    WHEN 'submitted' THEN verification_multiplier := 1.1
    ELSE verification_multiplier := 1.0
  END CASE INTO verification_multiplier
  FROM public.users WHERE id = user_id_param;
  
  -- Rating bonus
  SELECT COALESCE(AVG(rating), 0) INTO rating_multiplier
  FROM public.ratings 
  WHERE rated_user_id = user_id_param;
  
  -- Activity bonus (days since creation)
  SELECT CASE 
    WHEN EXTRACT(DAYS FROM NOW() - created_at) >= 30 THEN activity_multiplier := 1.2
    WHEN EXTRACT(DAYS FROM NOW() - created_at) >= 7 THEN activity_multiplier := 1.1
    ELSE activity_multiplier := 1.0
  END CASE INTO activity_multiplier
  FROM public.users WHERE id = user_id_param;
  
  -- Disputes penalty
  SELECT COUNT(*) * 5 INTO disputes_penalty
  FROM public.disputes 
  WHERE (reporter_id = user_id_param OR reported_user_id = user_id_param)
    AND status = 'resolved';
  
  -- Calculate final score
  score := GREATEST(0, LEAST(100, 
    (50 * verification_multiplier * rating_multiplier * activity_multiplier) - disputes_penalty
  ));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user trust level
CREATE OR REPLACE FUNCTION get_user_trust_level(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  safety_score INTEGER;
BEGIN
  safety_score := calculate_user_safety_score(user_id_param);
  
  RETURN CASE 
    WHEN safety_score >= 80 THEN 'high'
    WHEN safety_score >= 60 THEN 'medium'
    ELSE 'low'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ANNOUNCEMENT FUNCTIONS
-- =============================================================================

-- Function to get announcement statistics
CREATE OR REPLACE FUNCTION get_announcement_stats(announcement_id_param UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE announcement_id = announcement_id_param
    ), 0),
    'accepted_requests', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE announcement_id = announcement_id_param AND status = 'accepted'
    ), 0),
    'rejected_requests', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE announcement_id = announcement_id_param AND status = 'rejected'
    ), 0),
    'pending_requests', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE announcement_id = announcement_id_param AND status = 'pending'
    ), 0),
    'average_rating', COALESCE((
      SELECT COALESCE(AVG(rating), 0) FROM public.ratings 
      WHERE announcement_id = announcement_id_param
    ), 0),
    'total_ratings', COALESCE((
      SELECT COUNT(*) FROM public.ratings 
      WHERE announcement_id = announcement_id_param
    ), 0),
    'total_disputes', COALESCE((
      SELECT COUNT(*) FROM public.disputes 
      WHERE announcement_id = announcement_id_param
    ), 0)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get route statistics
CREATE OR REPLACE FUNCTION get_route_stats(route_param TEXT)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_announcements', COALESCE((
      SELECT COUNT(*) FROM public.announcements 
      WHERE route = route_param
    ), 0),
    'active_announcements', COALESCE((
      SELECT COUNT(*) FROM public.announcements 
      WHERE route = route_param AND status = 'active'
    ), 0),
    'completed_announcements', COALESCE((
      SELECT COUNT(*) FROM public.announcements 
      WHERE route = route_param AND status = 'completed'
    ), 0),
    'average_price', COALESCE((
      SELECT COALESCE(AVG(price_per_person), 0) FROM public.announcements 
      WHERE route = route_param AND price_per_person IS NOT NULL
    ), 0),
    'total_requests', COALESCE((
      SELECT COUNT(*) FROM public.requests 
      WHERE announcement_id IN (
        SELECT id FROM public.announcements WHERE route = route_param
      )
    ), 0),
    'success_rate', CASE 
      WHEN (SELECT COUNT(*) FROM public.announcements WHERE route = route_param) = 0 THEN 0
      ELSE ROUND(
        (SELECT COUNT(*) FROM public.announcements 
         WHERE route = route_param AND status = 'completed')::NUMERIC / 
        (SELECT COUNT(*) FROM public.announcements WHERE route = route_param)::NUMERIC * 100, 2
      )
    END
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SYSTEM HEALTH FUNCTIONS
-- =============================================================================

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_users', COALESCE((SELECT COUNT(*) FROM public.users), 0),
    'verified_users', COALESCE((
      SELECT COUNT(*) FROM public.users 
      WHERE verification_status = 'verified'
    ), 0),
    'pending_kyc', COALESCE((
      SELECT COUNT(*) FROM public.users 
      WHERE kyc_status = 'pending'
    ), 0),
    'total_announcements', COALESCE((SELECT COUNT(*) FROM public.announcements), 0),
    'active_announcements', COALESCE((
      SELECT COUNT(*) FROM public.announcements WHERE status = 'active'
    ), 0),
    'total_requests', COALESCE((SELECT COUNT(*) FROM public.requests), 0),
    'pending_requests', COALESCE((
      SELECT COUNT(*) FROM public.requests WHERE status = 'pending'
    ), 0),
    'total_disputes', COALESCE((SELECT COUNT(*) FROM public.disputes), 0),
    'pending_disputes', COALESCE((
      SELECT COUNT(*) FROM public.disputes WHERE status = 'pending'
    ), 0),
    'total_revenue', COALESCE((
      SELECT COALESCE(SUM(amount), 0) FROM public.transactions 
      WHERE type = 'debit'
    ), 0),
    'active_security_alerts', COALESCE((
      SELECT COUNT(*) FROM public.security_alerts 
      WHERE status = 'pending'
    ), 0),
    'high_risk_users', COALESCE((
      SELECT COUNT(*) FROM public.users 
      WHERE id IN (
        SELECT user_id FROM public.security_alerts 
        WHERE risk_score >= 80
      )
    ), 0)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- NOTIFICATION FUNCTIONS
-- =============================================================================

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  user_id_param UUID,
  type_param TEXT,
  severity_param TEXT,
  title_param TEXT,
  message_param TEXT,
  risk_score_param INTEGER DEFAULT 50,
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    user_id, type, severity, title, message, risk_score, metadata
  ) VALUES (
    user_id_param, type_param, severity_param, title_param, message_param, 
    risk_score_param, metadata_param
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  user_id_param UUID,
  action_param TEXT,
  entity_type_param TEXT,
  entity_id_param UUID DEFAULT NULL,
  old_values_param JSONB DEFAULT '{}'::jsonb,
  new_values_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, old_values, new_values
  ) VALUES (
    user_id_param, action_param, entity_type_param, entity_id_param, 
    old_values_param, new_values_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DATA CLEANUP FUNCTIONS
-- =============================================================================

-- Function to clean up old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS = ROW_COUNT INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up resolved security alerts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.security_alerts 
  WHERE status = 'resolved' 
    AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS = ROW_COUNT INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
