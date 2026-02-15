-- Add booking app source to rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS booking_app TEXT;

-- Favorite routes for notifications
CREATE TABLE IF NOT EXISTS public.favorite_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite routes" ON public.favorite_routes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create favorite routes" ON public.favorite_routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite routes" ON public.favorite_routes
  FOR DELETE USING (auth.uid() = user_id);
