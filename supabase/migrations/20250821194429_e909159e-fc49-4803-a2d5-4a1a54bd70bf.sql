-- Remove foreign key constraint that's blocking user creation
-- This will allow direct profile creation without auth.users dependency

-- First, check if the constraint exists and drop it
DO $$
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- Also drop any other potential foreign key constraints on profiles table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
END $$;

-- Ensure the profiles table allows full CRUD operations without constraints
-- Remove any triggers that might interfere
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simple trigger for new auth users (optional)
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create profile if it doesn't exist
  INSERT INTO public.profiles (id, email, full_name, user_role, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'space_manager', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the trigger (optional - for future auth users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_simple();

-- Grant full permissions to authenticated users on profiles table
GRANT ALL ON public.profiles TO authenticated;

-- Update all RLS policies to be more permissive for admins
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create simple, permissive policies
CREATE POLICY "Allow all operations for admins" ON public.profiles
FOR ALL TO authenticated
USING (public.check_user_is_admin())
WITH CHECK (public.check_user_is_admin());

CREATE POLICY "Allow users to view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Allow users to update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());