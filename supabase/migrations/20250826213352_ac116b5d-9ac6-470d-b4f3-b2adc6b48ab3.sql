-- Create student accounts for all existing students who don't have accounts yet
DO $$
DECLARE
    student_rec RECORD;
    new_email TEXT;
    new_password TEXT;
    new_user_id UUID;
BEGIN
    -- Loop through all students without accounts
    FOR student_rec IN 
        SELECT s.id, s.name, s.serial_number, s.mobile_phone 
        FROM students s 
        LEFT JOIN student_accounts sa ON s.id = sa.student_id 
        WHERE sa.student_id IS NULL
          AND s.serial_number IS NOT NULL 
          AND s.mobile_phone IS NOT NULL
    LOOP
        BEGIN
            -- Create email from serial number
            new_email := student_rec.serial_number || '@student.local';
            new_password := student_rec.mobile_phone;
            
            -- Create auth user
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(),
                'authenticated',
                'authenticated',
                new_email,
                crypt(new_password, gen_salt('bf')),
                now(),
                now(),
                now(),
                '{"provider":"student","providers":["student"]}',
                jsonb_build_object('name', student_rec.name, 'student_id', student_rec.id),
                false,
                '',
                '',
                '',
                ''
            ) RETURNING id INTO new_user_id;
            
            -- Create student account record
            INSERT INTO public.student_accounts (
                student_id,
                auth_user_id,
                username
            ) VALUES (
                student_rec.id,
                new_user_id,
                student_rec.serial_number
            );
            
            RAISE NOTICE 'Created student account for: % (Serial: %)', student_rec.name, student_rec.serial_number;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create student account for %: %', student_rec.name, SQLERRM;
            CONTINUE;
        END;
    END LOOP;
END $$;

-- Create a function for automatic password reset to mobile number
CREATE OR REPLACE FUNCTION public.auto_reset_student_password(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    student_record RECORD;
    new_password TEXT;
BEGIN
    -- Only allow admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only admins can reset student passwords');
    END IF;
    
    -- Get student details
    SELECT s.serial_number, s.mobile_phone, s.name, sa.auth_user_id
    INTO student_record
    FROM students s
    JOIN student_accounts sa ON s.id = sa.student_id
    WHERE s.id = p_student_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student account not found');
    END IF;
    
    IF student_record.mobile_phone IS NULL OR student_record.mobile_phone = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student mobile phone not available');
    END IF;
    
    -- Use mobile phone as new password
    new_password := student_record.mobile_phone;
    
    -- Update the auth user password
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = student_record.auth_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auth user not found');
    END IF;
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Password reset successfully',
        'username', student_record.serial_number,
        'student_name', student_record.name
    );
END;
$$;