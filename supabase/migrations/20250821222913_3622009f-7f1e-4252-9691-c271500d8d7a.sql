-- Add created_by column to bookings table if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;