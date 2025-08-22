-- Fix remaining functions with search path issues

-- Fix check_user_is_admin function
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND (p.role = 'admin' OR p.user_role IN ('owner', 'manager'))
  );
$$;

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_user_is_admin();
$$;