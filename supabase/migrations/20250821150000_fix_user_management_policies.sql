-- Allow admins (owner or manager) to create new user profiles.
-- This policy is necessary for the 'create-user' Edge Function to work correctly.
CREATE POLICY "Allow admins to create user profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  (get_my_claim('user_role') ->> 0)::text IN ('owner', 'manager')
);

-- Allow admins (owner or manager) to update existing user profiles.
-- This policy is necessary for the 'update-user' Edge Function to work correctly.
CREATE POLICY "Allow admins to update user profiles"
ON public.profiles
FOR UPDATE
USING (
  (get_my_claim('user_role') ->> 0)::text IN ('owner', 'manager')
)
WITH CHECK (
  (get_my_claim('user_role') ->> 0)::text IN ('owner', 'manager')
);
