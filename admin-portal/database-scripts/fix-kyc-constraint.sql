-- ========================================================
-- LinkCab - Fix KYC Status Constraints
-- This script updates the users table to support the 
-- full eKYC verification lifecycle (submitted, under_review)
-- ========================================================

-- 1. Drop the existing strict KYC check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kyc_status_check;

-- 2. Add the expanded KYC check constraint 
ALTER TABLE users ADD CONSTRAINT users_kyc_status_check 
CHECK (kyc_status IN ('pending', 'submitted', 'under_review', 'verified', 'rejected'));

-- Success message
-- Run this whole script in your Supabase SQL editor.
