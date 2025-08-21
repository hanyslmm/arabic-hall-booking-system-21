-- Update admin password to Voda@123 and ensure proper email mapping
UPDATE auth.users 
SET encrypted_password = crypt('Voda@123', gen_salt('bf')),
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Ensure the profile is properly set up
UPDATE public.profiles 
SET email = 'admin@admin.com',
    username = 'admin',
    full_name = 'System Administrator',
    role = 'admin',
    user_role = 'owner',
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001';