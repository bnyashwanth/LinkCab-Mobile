-- =============================================================================
-- LINKCAB DATABASE SCHEMA - SAMPLE DATA
-- =============================================================================
-- This file contains sample data for development and testing
-- Run this last, after all other schema files
-- =============================================================================

-- =============================================================================
-- SAMPLE USERS
-- =============================================================================

-- Insert sample users (these will be created automatically on signup too)
INSERT INTO public.users (id, email, full_name, phone_number, role, verification_status, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@linkcab.in', 'Admin User', '+919876543210', 'super_admin', 'verified', NOW() - INTERVAL '365 days'),
  ('00000000-0000-0000-0000-000000000002', 'john.doe@example.com', 'John Doe', '+918765432109', 'user', 'verified', NOW() - INTERVAL '180 days'),
  ('00000000-0000-0000-0000-000000000003', 'jane.smith@example.com', 'Jane Smith', '+917654321098', 'user', 'verified', NOW() - INTERVAL '90 days'),
  ('00000000-0000-0000-0000-000000000004', 'mike.wilson@example.com', 'Mike Wilson', '+916543210987', 'user', 'pending', NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000005', 'lisa.chen@example.com', 'Lisa Chen', '+915432109876', 'user', 'under_review', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Profiles will be auto-synced by triggers

-- =============================================================================
-- SAMPLE ANNOUNCEMENTS
-- =============================================================================

INSERT INTO public.announcements (
  user_id, pickup_address, dropoff_address, route, travel_date, travel_time, 
  available_seats, price_per_person, transport_mode, status, created_at
) VALUES
  ('00000000-0000-0000-0000-000000000002', 
   'MG Road, Bangalore', 'Electronic City, Bangalore', 
   'Bangalore - Electronic City', 
   CURRENT_DATE + INTERVAL '1 day', '09:00:00', 3, 150.00, 'cab', 'active', NOW() - INTERVAL '2 hours'),
  
  ('00000000-0000-0000-0000-000000000003', 
   'Koramangala, Bangalore', 'Whitefield, Bangalore', 
   'Bangalore - Whitefield', 
   CURRENT_DATE + INTERVAL '1 day', '08:30:00', 2, 200.00, 'auto', 'active', NOW() - INTERVAL '4 hours'),
  
  ('00000000-0000-0000-0000-000000000002', 
   'Indiranagar, Bangalore', 'Airport Road, Bangalore', 
   'Bangalore - Airport', 
   CURRENT_DATE + INTERVAL '1 day', '06:00 PM', 4, 300.00, 'cab', 'active', NOW() - INTERVAL '6 hours'),
  
  ('00000000-0000-0000-0000-000000000003', 
   'HSR Layout, Bangalore', 'Marathahalli, Bangalore', 
   'Bangalore - Marathahalli', 
   CURRENT_DATE + INTERVAL '2 days', '07:00 PM', 2, 120.00, 'any', 'active', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE REQUESTS
-- =============================================================================

INSERT INTO public.requests (announcement_id, requester_id, status, message, created_at)
VALUES
  ((SELECT id FROM public.announcements WHERE route = 'Bangalore - Electronic City' LIMIT 1), 
   '00000000-0000-0000-0000-000000000003', 'pending', 'Need a ride tomorrow morning', NOW() - INTERVAL '1 hour'),
  
  ((SELECT id FROM public.announcements WHERE route = 'Bangalore - Whitefield' LIMIT 1), 
   '00000000-0000-0000-0000-000000000004', 'accepted', 'Looking forward to the ride!', NOW() - INTERVAL '30 minutes'),
  
  ((SELECT id FROM public.announcements WHERE route = 'Bangalore - Airport' LIMIT 1), 
   '00000000-0000-0000-0000-000000000005', 'pending', 'Is this still available?', NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE TRANSACTIONS
-- =============================================================================

INSERT INTO public.transactions (user_id, type, amount, description, status, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'debit', 1.00, 'Connection fee for Bangalore - Whitefield', 'completed', NOW() - INTERVAL '45 minutes'),
  ('00000000-0000-0000-0000-000000000004', 'debit', 1.00, 'Connection fee for Bangalore - Airport', 'completed', NOW() - INTERVAL '30 minutes'),
  ('00000000-0000-0000-0000-000000000005', 'debit', 1.00, 'Connection fee for Bangalore - Marathahalli', 'pending', NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE RATINGS
-- =============================================================================

INSERT INTO public.ratings (rater_id, rated_user_id, announcement_id, rating, comment, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 
   (SELECT id FROM public.announcements WHERE route = 'Bangalore - Electronic City' LIMIT 1), 
   5, 'Great ride! Very punctual and safe.', NOW() - INTERVAL '2 days'),
  
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 
   (SELECT id FROM public.announcements WHERE route = 'Bangalore - Whitefield' LIMIT 1), 
   4, 'Good experience, driver was friendly.', NOW() - INTERVAL '1 day'),
  
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 
   (SELECT id FROM public.announcements WHERE route = 'Bangalore - Airport' LIMIT 1), 
   3, 'Arrived on time, professional service.', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE DISPUTES
-- =============================================================================

INSERT INTO public.disputes (
  reporter_id, reported_user_id, type, severity, description, status, created_at
) VALUES
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 
   'no_show', 'medium', 'Accepted request but never showed up', 'resolved', NOW() - INTERVAL '1 day'),
  
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 
   'payment_dispute', 'low', 'Disagreement over fare amount', 'pending', NOW() - INTERVAL '12 hours'),
  
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 
   'harassment', 'high', 'Inappropriate behavior during ride', 'investigating', NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE SECURITY ALERTS
-- =============================================================================

INSERT INTO public.security_alerts (
  user_id, type, severity, title, message, risk_score, status, created_at
) VALUES
  ('00000000-0000-0000-0000-000000000005', 'suspicious_activity', 'medium', 
   'High request frequency', 'User sending 50+ requests per hour', 72, 'pending', NOW() - INTERVAL '2 hours'),
  
  ('00000000-0000-0000-0000-000000000004', 'fake_profile', 'high', 
   'Profile verification issues', 'Phone number appears disconnected', 85, 'investigating', NOW() - INTERVAL '4 hours'),
  
  ('00000000-0000-0000-0000-000000000005', 'harassment', 'critical', 
   'Multiple complaints', 'Several users reported inappropriate behavior', 95, 'investigating', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE AUDIT LOGS
-- =============================================================================

INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'USER_CREATED', 'user', 
   '00000000-0000-0000-0000-000000000006', 
   '{"email": "newuser@example.com", "full_name": "New User"}', NOW() - INTERVAL '1 day'),
  
  ('00000000-0000-0000-0000-000000000002', 'ANNOUNCEMENT_CREATED', 'announcement', 
   (SELECT id FROM public.announcements WHERE route = 'Bangalore - Electronic City' LIMIT 1), 
   '{"pickup_address": "MG Road, Bangalore", "status": "active"}', NOW() - INTERVAL '2 hours'),
  
  ('00000000-0000-0000-0000-000000000003', 'DISPUTE_CREATED', 'dispute', 
   (SELECT id FROM public.disputes WHERE type = 'no_show' LIMIT 1), 
   '{"type": "no_show", "severity": "medium"}', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION DOCUMENTS SAMPLE
-- =============================================================================

-- Update some users with verification documents (for testing)
UPDATE public.users SET 
  verification_documents = jsonb_build_object(
    'idDocumentUrl', 'https://example.com/verification-docs/user_2_id.jpg',
    'selfieUrl', 'https://example.com/verification-docs/user_2_selfie.jpg',
    'documentType', 'driving_license',
    'documentNumber', 'DL123456789',
    'uploadedAt', NOW() - INTERVAL '30 days'
  )
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE public.users SET 
  verification_documents = jsonb_build_object(
    'idDocumentUrl', 'https://example.com/verification-docs/user_3_aadhaar.jpg',
    'selfieUrl', 'https://example.com/verification-docs/user_3_selfie.jpg',
    'documentType', 'aadhaar',
    'documentNumber', '123456789012',
    'uploadedAt', NOW() - INTERVAL '15 days'
  )
WHERE id = '00000000-0000-0000-0000-000000000003';

COMMIT;
