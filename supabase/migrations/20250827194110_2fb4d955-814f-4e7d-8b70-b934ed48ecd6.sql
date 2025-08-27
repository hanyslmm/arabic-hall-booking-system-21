-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the create_student_account function with proper error handling
DROP FUNCTION IF EXISTS public.create_student_account() CASCADE;

CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    new_email TEXT;
    new_password TEXT;
    new_user_id UUID;
BEGIN
    -- Create email from serial number
    new_email := COALESCE(NEW.serial_number, 'student_' || NEW.id::text) || '@student.local';
    
    -- Use mobile phone as initial password, fallback to serial number or id
    new_password := COALESCE(NEW.mobile_phone, NEW.serial_number, NEW.id::text);
    
    -- Create auth user with proper password hashing
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
        jsonb_build_object('name', NEW.name, 'student_id', NEW.id),
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
        NEW.id,
        new_user_id,
        COALESCE(NEW.serial_number, 'student_' || NEW.id::text)
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If auth user creation fails, continue without creating student account
    RAISE NOTICE 'Failed to create student account for student %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_student_account_trigger ON students;
CREATE TRIGGER create_student_account_trigger
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION create_student_account();

-- Update the auto_reset_student_password function to work properly
DROP FUNCTION IF EXISTS public.auto_reset_student_password(uuid);

CREATE OR REPLACE FUNCTION public.auto_reset_student_password(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Update the auth user password with proper hashing
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
$function$;

-- Fix existing student accounts that might have incorrect passwords
-- Update all existing student auth passwords to match their mobile phones
UPDATE auth.users 
SET encrypted_password = crypt(s.mobile_phone, gen_salt('bf')),
    updated_at = now()
FROM students s
JOIN student_accounts sa ON s.id = sa.student_id
WHERE auth.users.id = sa.auth_user_id
AND s.mobile_phone IS NOT NULL
AND s.mobile_phone != '';