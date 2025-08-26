-- Create function to reset student password (admin only)
CREATE OR REPLACE FUNCTION reset_student_password(student_auth_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
    -- Only allow admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can reset student passwords';
    END IF;
    
    -- Update the auth user password
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = student_auth_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student account not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;