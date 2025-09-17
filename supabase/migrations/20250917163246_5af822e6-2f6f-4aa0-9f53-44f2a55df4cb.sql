-- Update all student accounts ending with @student.local to have read_only role
UPDATE public.profiles 
SET user_role = 'read_only'
WHERE email LIKE '%@student.local' 
  AND user_role != 'read_only';

-- Ensure these accounts don't have admin-level roles  
UPDATE public.profiles 
SET role = 'user'
WHERE email LIKE '%@student.local' 
  AND role != 'user';