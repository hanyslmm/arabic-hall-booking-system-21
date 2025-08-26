-- Add student login accounts table for student authentication
CREATE TABLE IF NOT EXISTS public.student_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for student accounts
CREATE POLICY "Students can view own account" 
ON public.student_accounts 
FOR SELECT 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage student accounts" 
ON public.student_accounts 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
));

-- Create function to auto-create student account when student is created
CREATE OR REPLACE FUNCTION create_student_account()
RETURNS TRIGGER AS $$
DECLARE
    new_email TEXT;
    new_password TEXT;
    new_user_id UUID;
BEGIN
    -- Create email from serial number
    new_email := COALESCE(NEW.serial_number, 'student_' || NEW.id::text) || '@student.local';
    
    -- Use mobile phone as initial password, fallback to serial number or id
    new_password := COALESCE(NEW.mobile_phone, NEW.serial_number, NEW.id::text);
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create student accounts
DROP TRIGGER IF EXISTS trigger_create_student_account ON public.students;
CREATE TRIGGER trigger_create_student_account
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION create_student_account();

-- Create function to get student dashboard data
CREATE OR REPLACE FUNCTION get_student_dashboard_data(student_auth_id UUID)
RETURNS TABLE (
    student_info JSONB,
    registrations JSONB,
    attendance_summary JSONB,
    qr_code_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Student basic info
        to_jsonb(s.*) as student_info,
        
        -- Current registrations with booking details
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', sr.id,
                    'booking_id', sr.booking_id,
                    'total_fees', sr.total_fees,
                    'paid_amount', sr.paid_amount,
                    'payment_status', sr.payment_status,
                    'registration_date', sr.registration_date,
                    'booking', jsonb_build_object(
                        'class_code', b.class_code,
                        'start_time', b.start_time,
                        'days_of_week', b.days_of_week,
                        'teacher', jsonb_build_object('name', t.name),
                        'hall', jsonb_build_object('name', h.name),
                        'stage', jsonb_build_object('name', ast.name)
                    )
                )
            ) FILTER (WHERE sr.id IS NOT NULL), 
            '[]'::jsonb
        ) as registrations,
        
        -- Attendance summary for current month
        jsonb_build_object(
            'current_month_attendance', COALESCE(
                (SELECT COUNT(*) FROM attendance_records ar 
                 JOIN student_registrations sr2 ON ar.student_registration_id = sr2.id 
                 WHERE sr2.student_id = s.id 
                 AND ar.date >= date_trunc('month', CURRENT_DATE)
                 AND ar.status = 'present'),
                0
            ),
            'total_sessions', COALESCE(
                (SELECT COUNT(*) FROM attendance_records ar 
                 JOIN student_registrations sr2 ON ar.student_registration_id = sr2.id 
                 WHERE sr2.student_id = s.id 
                 AND ar.date >= date_trunc('month', CURRENT_DATE)),
                0
            )
        ) as attendance_summary,
        
        -- QR code data
        jsonb_build_object(
            'qr_data', s.serial_number,
            'student_name', s.name,
            'mobile_phone', s.mobile_phone
        ) as qr_code_data
        
    FROM public.student_accounts sa
    JOIN public.students s ON sa.student_id = s.id
    LEFT JOIN public.student_registrations sr ON sr.student_id = s.id
    LEFT JOIN public.bookings b ON sr.booking_id = b.id
    LEFT JOIN public.teachers t ON b.teacher_id = t.id
    LEFT JOIN public.halls h ON b.hall_id = h.id
    LEFT JOIN public.academic_stages ast ON b.academic_stage_id = ast.id
    WHERE sa.auth_user_id = student_auth_id
    GROUP BY s.id, sa.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;