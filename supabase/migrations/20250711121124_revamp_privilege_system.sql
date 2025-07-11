-- Revamp the privilege system with simplified roles
-- This migration simplifies the privilege system and fixes circular dependencies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view halls" ON public.halls;
DROP POLICY IF EXISTS "Managers can create halls" ON public.halls;
DROP POLICY IF EXISTS "Managers can update halls" ON public.halls;
DROP POLICY IF EXISTS "Managers can delete halls" ON public.halls;
DROP POLICY IF EXISTS "All authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers can create teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers can delete teachers" ON public.teachers;
DROP POLICY IF EXISTS "All authenticated users can view academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Managers can create academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Managers can update academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Managers can delete academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "All authenticated users can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "All authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Managers can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Managers can delete all bookings" ON public.bookings;

-- Update the user_role enum to include read_only
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'read_only';

-- Update all existing users to have full privileges (owner role)
-- This ensures backward compatibility and fixes current issues
UPDATE public.profiles 
SET 
  user_role = 'owner',
  role = 'ADMIN'
WHERE user_role IS NOT NULL;

-- Create a simple function to check if user has admin privileges
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id 
    AND (user_role IN ('owner', 'manager') OR role = 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has read privileges
CREATE OR REPLACE FUNCTION public.can_read(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id 
    AND user_role IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Simplified RLS Policies for halls
CREATE POLICY "All users can view halls" ON public.halls
  FOR SELECT TO authenticated 
  USING (public.can_read(auth.uid()));

CREATE POLICY "Admins can manage halls" ON public.halls
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Simplified RLS Policies for teachers
CREATE POLICY "All users can view teachers" ON public.teachers
  FOR SELECT TO authenticated 
  USING (public.can_read(auth.uid()));

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Simplified RLS Policies for academic_stages
CREATE POLICY "All users can view academic stages" ON public.academic_stages
  FOR SELECT TO authenticated 
  USING (public.can_read(auth.uid()));

CREATE POLICY "Admins can manage academic stages" ON public.academic_stages
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Simplified RLS Policies for bookings
CREATE POLICY "All users can view bookings" ON public.bookings
  FOR SELECT TO authenticated 
  USING (public.can_read(auth.uid()));

CREATE POLICY "All users can create bookings" ON public.bookings
  FOR INSERT TO authenticated 
  WITH CHECK (public.can_read(auth.uid()));

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE TO authenticated 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own bookings" ON public.bookings
  FOR DELETE TO authenticated 
  USING (created_by = auth.uid());

-- Create a function to grant admin privileges to a user
CREATE OR REPLACE FUNCTION public.grant_admin_privileges(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record public.profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Check if user exists
  SELECT * INTO user_record FROM public.profiles WHERE email = user_email;
  
  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'message', 'User not found with email: ' || user_email
    );
    RETURN result;
  END IF;

  -- Update user privileges
  UPDATE public.profiles 
  SET 
    user_role = 'owner',
    role = 'ADMIN',
    updated_at = NOW()
  WHERE email = user_email;

  result := json_build_object(
    'success', true,
    'message', 'User ' || user_email || ' has been granted admin privileges',
    'user_id', user_record.id
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to grant read-only privileges to a user
CREATE OR REPLACE FUNCTION public.grant_readonly_privileges(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record public.profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Check if user exists
  SELECT * INTO user_record FROM public.profiles WHERE email = user_email;
  
  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'message', 'User not found with email: ' || user_email
    );
    RETURN result;
  END IF;

  -- Update user privileges
  UPDATE public.profiles 
  SET 
    user_role = 'read_only',
    role = 'USER',
    updated_at = NOW()
  WHERE email = user_email;

  result := json_build_object(
    'success', true,
    'message', 'User ' || user_email || ' has been granted read-only privileges',
    'user_id', user_record.id
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_readonly_privileges(TEXT) TO authenticated;
