-- Make email optional on profiles
ALTER TABLE public.profiles
  ALTER COLUMN email DROP NOT NULL;

-- No-op comment: phone is already nullable in current schema
-- ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- Ensure existing empty-string emails are normalized to NULL (optional hygiene)
UPDATE public.profiles SET email = NULL WHERE email = '';


