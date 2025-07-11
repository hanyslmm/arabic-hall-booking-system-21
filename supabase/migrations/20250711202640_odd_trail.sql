-- Create sc_manager admin account
-- This migration creates a new admin account with username sc_manager and password Voda@123

/*
  # Create sc_manager Admin Account

  1. New Admin User
    - Creates sc_manager@system.local user in auth.users
    - Password: Voda@123
    - Email confirmed automatically
    
  2. Admin Profile
    - Creates profile with owner role and ADMIN privileges
    - Full name: Science Club Manager
    
  3. Authentication Function Update
    - Updates authenticate_admin function to support sc_manager username
*/

-- Create sc_manager user account with credentials
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'sc_manager@system.local',
  crypt('Voda@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create sc_manager profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  user_role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'sc_manager@system.local',
  'Science Club Manager',
  'ADMIN',
  'owner',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  user_role = 'owner',
  full_name = 'Science Club Manager';

-- Update admin authentication function to support sc_manager
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role text,
  user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if credentials match admin account
  IF p_username = 'admin' AND p_password = 'Voda@123' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.user_role::text
    FROM public.profiles p
    WHERE p.id = '00000000-0000-0000-0000-000000000001';
  END IF;
  
  -- Check if credentials match sc_manager account
  IF p_username = 'sc_manager' AND p_password = 'Voda@123' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.user_role::text
    FROM public.profiles p
    WHERE p.id = '00000000-0000-0000-0000-000000000002';
  END IF;
  
  RETURN;
END;
$$;