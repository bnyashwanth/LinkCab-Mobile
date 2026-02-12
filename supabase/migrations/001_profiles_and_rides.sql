-- Profiles table (required for AuthContext)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rides table (extended schema for create-ride form)
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_latitude DECIMAL NOT NULL,
  pickup_longitude DECIMAL NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_latitude DECIMAL NOT NULL,
  dropoff_longitude DECIMAL NOT NULL,
  dropoff_address TEXT NOT NULL,
  ride_date TEXT,
  ride_time TEXT,
  available_seats INTEGER DEFAULT 1,
  cab_type TEXT DEFAULT 'sedan',
  gender_preference TEXT DEFAULT 'any',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  fare DECIMAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL DEFAULT 'razorpay',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rides
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Users can manage their own rides
CREATE POLICY "Users can view own rides" ON public.rides
  FOR SELECT USING (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE POLICY "Users can create rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Users can update own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = rider_id OR auth.uid() = driver_id);
