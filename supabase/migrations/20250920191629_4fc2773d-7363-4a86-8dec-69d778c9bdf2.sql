-- Create auth users for existing hall manager profiles that don't have auth accounts
-- For hend user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'e1ce4fa0-4c65-4ab5-91ee-a5b7322b9136',
  '00000000-0000-0000-0000-000000000000',
  'hend@admin.com',
  crypt('hend123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  jsonb_build_object('full_name', 'hend gelila'),
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = crypt('hend123', gen_salt('bf')),
  updated_at = now();

-- For tasneem user (generate new UUID if needed)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '0e4e38b5-c3e4-4209-a681-641e7edfc91c',
  '00000000-0000-0000-0000-000000000000',
  'tasneem@admin.com',
  crypt('tasneem123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  jsonb_build_object('full_name', 'tasneem'),
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = crypt('tasneem123', gen_salt('bf')),
  updated_at = now();

-- Update profiles to have proper email addresses
UPDATE public.profiles 
SET email = 'hend@admin.com', full_name = 'hend gelila'
WHERE id = 'e1ce4fa0-4c65-4ab5-91ee-a5b7322b9136';

UPDATE public.profiles 
SET email = 'tasneem@admin.com', full_name = 'tasneem'
WHERE id = '0e4e38b5-c3e4-4209-a681-641e7edfc91c';