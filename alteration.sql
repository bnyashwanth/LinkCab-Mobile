-- Add booking app source to rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS booking_app TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS note_photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS creator_small_bags INTEGER DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS creator_medium_bags INTEGER DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS creator_large_bags INTEGER DEFAULT 0;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS small_bags INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS medium_bags INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS large_bags INTEGER NOT NULL DEFAULT 0;

-- Favorite routes for notifications
CREATE TABLE IF NOT EXISTS public.favorite_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can view own favorite routes" ON public.favorite_routes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can create favorite routes" ON public.favorite_routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can delete own favorite routes" ON public.favorite_routes
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket + policies for ride note photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ride-notes',
  'ride-notes',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view ride note photos" ON storage.objects;
CREATE POLICY "Public can view ride note photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ride-notes');

DROP POLICY IF EXISTS "Authenticated can upload own ride note photos" ON storage.objects;
CREATE POLICY "Authenticated can upload own ride note photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ride-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated can update own ride note photos" ON storage.objects;
CREATE POLICY "Authenticated can update own ride note photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ride-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'ride-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated can delete own ride note photos" ON storage.objects;
CREATE POLICY "Authenticated can delete own ride note photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ride-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
