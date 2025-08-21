-- Fix admin login and create user accounts
-- This creates admin users in both auth.users and profiles tables

-- Create admin@admin.com user in auth.users
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
  email_change_token_new,
  email_change_token_current,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "System Administrator"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@admin.com',
  encrypted_password = crypt('admin123', gen_salt('bf')),
  updated_at = now();

-- Create marwa@system.local user in auth.users  
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
  email_change_token_new,
  email_change_token_current,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'marwa@system.local',
  crypt('Voda@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Marwa Administrator"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  email = 'marwa@system.local',
  encrypted_password = crypt('Voda@123', gen_salt('bf')),
  updated_at = now();

-- Create corresponding profiles for both users (using correct enum values)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  user_role,
  username,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@admin.com',
  'System Administrator',
  'admin',
  'owner',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@admin.com',
  full_name = 'System Administrator',
  role = 'admin',
  user_role = 'owner',
  username = 'admin',
  updated_at = now();

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  user_role,
  username,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'marwa@system.local',
  'Marwa Administrator', 
  'admin',
  'owner',
  'marwa',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'marwa@system.local',
  full_name = 'Marwa Administrator',
  role = 'admin',
  user_role = 'owner',
  username = 'marwa',
  updated_at = now();