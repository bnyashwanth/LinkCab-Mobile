-- Run this if rides table already exists - adds columns for create-ride form
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS ride_date TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS ride_time TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS available_seats INTEGER DEFAULT 1;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS cab_type TEXT DEFAULT 'sedan';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'any';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS notes TEXT;
