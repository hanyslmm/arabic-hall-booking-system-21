-- Ensure pgcrypto is available for password hashing
create extension if not exists pgcrypto;

-- Securely update the admin user's password
-- This targets common admin emails and the known admin UUID used in prior migrations
update auth.users
set 
  encrypted_password = crypt('
  ', gen_salt('bf')),
  updated_at = now()
where email in (
  'admin@admin.com',
  'admin@system.local',
  'admin@example.com',
  'admin@local.app'
) or id = '00000000-0000-0000-0000-000000000001';



