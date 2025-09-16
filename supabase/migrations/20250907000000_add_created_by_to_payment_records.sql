-- Add created_by to payment_records and backfill from profiles if possible
ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Ensure RLS keeps working: allow read to all; writes managed by existing admin policies
DO $$ BEGIN
  -- Policy already exists in most environments; this is a no-op migration for reads
  NULL;
END $$;


