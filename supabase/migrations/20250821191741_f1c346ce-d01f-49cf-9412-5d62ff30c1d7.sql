-- Fix the NULL string values in auth.users that are causing login errors
UPDATE auth.users 
SET 
    email_change = COALESCE(email_change, ''),
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'::jsonb),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{"full_name": "System Administrator"}'::jsonb)
WHERE email = 'admin@admin.com' OR id = '00000000-0000-0000-0000-000000000001';

-- Ensure admin user exists with proper fields
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
    raw_app_meta_data,
    raw_user_meta_data,
    email_change,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@admin.com',
    crypt('Voda@123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "System Administrator"}',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Voda@123', gen_salt('bf')),
    email = 'admin@admin.com',
    email_change = '',
    recovery_token = '',
    confirmation_token = '',
    updated_at = now();