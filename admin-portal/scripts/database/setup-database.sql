-- =============================================================================
-- LINKCAB DATABASE - MASTER SETUP SCRIPT
-- =============================================================================
-- This is the main setup script that runs all individual schema files
-- Run this once to set up the complete LinkCab database
-- =============================================================================

-- =============================================================================
-- EXECUTION ORDER
-- =============================================================================
-- 1. 01-schema.sql      - Core tables (users, profiles, announcements, etc.)
-- 2. 02-policies.sql     - Row Level Security policies
-- 3. 03-triggers.sql     - Auto-sync triggers and functions
-- 4. 04-storage.sql      - Storage buckets and policies
-- 5. 05-functions.sql    - Helper functions and stored procedures
-- 6. 06-sample-data.sql  - Optional sample data for testing
-- =============================================================================

-- =============================================================================
-- RUN ALL SCHEMA FILES
-- =============================================================================

-- Note: In Supabase SQL Editor, you'll need to run each file individually
-- or copy the contents of each file and execute sequentially

-- File 1: Core Schema
\i scripts/database/01-schema.sql

-- File 2: RLS Policies  
\i scripts/database/02-policies.sql

-- File 3: Triggers and Functions
\i scripts/database/03-triggers.sql

-- File 4: Storage Configuration
\i scripts/database/04-storage.sql

-- File 5: Helper Functions
\i scripts/database/05-functions.sql

-- File 6: Sample Data (Optional)
\i scripts/database/06-sample-data.sql

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify all tables were created successfully
DO $$
DECLARE
  table_count INTEGER;
  error_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'profiles', 'announcements', 'requests', 
    'transactions', 'disputes', 'ratings', 'security_alerts', 'audit_logs'
  );
  
  RAISE NOTICE 'LinkCab database setup completed! Created % tables.', table_count;
END;
$$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- The LinkCab database now includes:

-- CORE TABLES:
-- ✓ users - Main user storage (admin portal)
-- ✓ profiles - Mobile app compatibility layer
-- ✓ announcements - Travel trips/rides
-- ✓ requests - Connection requests
-- ✓ transactions - Financial transactions
-- ✓ disputes - User disputes
-- ✓ ratings - User ratings and reviews
-- ✓ security_alerts - Safety monitoring
-- ✓ audit_logs - System audit trail

-- SECURITY:
-- ✓ Row Level Security (RLS) on all tables
-- ✓ User-based access control
-- ✓ Admin role permissions
-- ✓ Mobile app compatibility

-- AUTOMATION:
-- ✓ Auto-sync between users and profiles tables
-- ✓ Automatic profile creation on signup
-- ✓ Updated_at timestamp triggers
-- ✓ Audit logging for important actions
-- ✓ Safety score calculations
-- ✓ Risk assessment functions

-- STORAGE:
-- ✓ Verification documents bucket
-- ✓ Profile images bucket
-- ✓ Announcement images bucket
-- ✓ Dispute evidence bucket
-- ✓ File size and type validation
-- ✓ User-based access control

-- FUNCTIONS:
-- ✓ User statistics and analytics
-- ✓ Safety score calculations
-- ✓ Route statistics
-- ✓ System health metrics
-- ✓ Security alert creation
-- ✓ Audit event logging
-- ✓ Data cleanup functions

-- SAMPLE DATA:
-- ✓ 5 Sample users with different verification statuses
-- ✓ 4 Sample announcements with different routes
-- ✓ Sample requests and transactions
-- ✓ Sample ratings and disputes
-- ✓ Sample security alerts
-- ✓ Sample audit logs

-- =============================================================================
-- NEXT STEPS
-- =============================================================================
-- 1. Test the database by running sample queries
-- 2. Verify mobile app can access profiles table
-- 3. Test admin portal can access users table
-- 4. Verify auto-sync between tables works
-- 5. Test RLS policies are working correctly

-- =============================================================================
-- TROUBLESHOOTING
-- =============================================================================
-- If you encounter issues:
-- 1. Check each file executed successfully
-- 2. Verify triggers were created
-- 3. Check RLS policies are enabled
-- 4. Run individual files if needed

-- =============================================================================
-- MAINTENANCE
-- =============================================================================
-- Regular maintenance tasks:
-- - Run cleanup_old_audit_logs() every 90 days
-- - Run cleanup_old_security_alerts() every 30 days
-- - Monitor storage bucket usage
-- - Review RLS policies regularly

-- =============================================================================
COMMIT;
