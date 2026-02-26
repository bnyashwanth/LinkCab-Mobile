-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- Set up Storage!
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true);

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage#policy-examples for more details.
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update an avatar." on storage.objects
  for update with check (bucket_id = 'avatars');

-- ============================================
-- Rides table
-- ============================================
create table if not exists rides (
  id uuid default gen_random_uuid() primary key,
  rider_id uuid references auth.users not null,
  driver_id uuid references auth.users,
  pickup_latitude double precision not null,
  pickup_longitude double precision not null,
  pickup_address text not null,
  dropoff_latitude double precision not null,
  dropoff_longitude double precision not null,
  dropoff_address text not null,
  status text not null default 'pending',
  fare numeric default 0,
  currency text default 'INR',
  payment_method text default 'razorpay',
  payment_status text default 'pending',
  ride_date text,
  ride_time text,
  available_seats integer default 1,
  cab_type text default 'sedan',
  gender_preference text default 'any',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rides enable row level security;

create policy "Rides are viewable by everyone." on rides
  for select using (true);

create policy "Users can create their own rides." on rides
  for insert with check ((select auth.uid()) = rider_id);

create policy "Users can update their own rides." on rides
  for update using ((select auth.uid()) = rider_id or (select auth.uid()) = driver_id);

-- ============================================
-- Ride Requests table
-- ============================================
create table if not exists ride_requests (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references rides(id) not null,
  passenger_id uuid references auth.users not null,
  status text not null default 'pending',
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table ride_requests enable row level security;

create policy "Ride requests are viewable by involved users." on ride_requests
  for select using (true);

create policy "Users can create ride requests." on ride_requests
  for insert with check ((select auth.uid()) = passenger_id);

create policy "Users can update ride requests." on ride_requests
  for update using (true);
