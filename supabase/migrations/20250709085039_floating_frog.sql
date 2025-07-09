/*
  # Set Owner Permissions for hanyslmm@gmail.com

  1. Updates
    - Set hanyslmm@gmail.com as owner in the system
    - Ensure proper user role permissions

  2. Security
    - Maintains existing RLS policies
    - Grants owner privileges to specified user
*/

-- Update the user hanyslmm@gmail.com to be an owner
UPDATE profiles 
SET user_role = 'owner' 
WHERE email = 'hanyslmm@gmail.com';

-- If the profile doesn't exist, we'll need to handle that case
-- This will be handled by the auth trigger when the user signs up