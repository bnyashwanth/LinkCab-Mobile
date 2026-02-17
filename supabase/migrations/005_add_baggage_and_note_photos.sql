-- Add optional ride note photos and creator baggage details
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS note_photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS creator_small_bags INTEGER DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS creator_medium_bags INTEGER DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS creator_large_bags INTEGER DEFAULT 0;

-- Add baggage details to ride requests (set by passenger when requesting)
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS small_bags INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS medium_bags INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS large_bags INTEGER NOT NULL DEFAULT 0;
