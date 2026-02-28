-- Base schema alterations tracked for app parity
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS booking_app TEXT;
