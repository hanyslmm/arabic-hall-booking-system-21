-- Phase 1: Create missing enums (handle existing ones with DO blocks)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('owner', 'manager', 'teacher', 'receptionist', 'space_manager', 'read_only');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('ADMIN', 'USER');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
    END IF;
END $$;

-- Phase 2: Add missing columns to existing tables
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'space_manager',
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS class_code TEXT,
ADD COLUMN IF NOT EXISTS is_custom_fee BOOLEAN DEFAULT false;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS teacher_code TEXT;

-- Phase 3: Create missing tables
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_registration_id UUID NOT NULL REFERENCES public.student_registrations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id),
    UNIQUE(student_registration_id, date)
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    student_registration_id UUID REFERENCES public.student_registrations(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phase 4: Enable RLS on all new tables
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Phase 5: Create RLS policies for new tables
CREATE POLICY "settings_select" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_admin_all" ON public.settings FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_admin_all" ON public.notifications FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));

CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "attendance_admin_all" ON public.attendance_records FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));

CREATE POLICY "transactions_admin_all" ON public.transactions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));

-- Phase 6: Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('default_booking_duration_minutes', '60', 'Default duration for bookings in minutes'),
('system_name', 'مركز الإدارة التعليمي', 'System display name'),
('currency', 'JOD', 'Default currency'),
('academic_year', '2024-2025', 'Current academic year')
ON CONFLICT (key) DO NOTHING;

-- Phase 7: Update existing admin users
UPDATE public.profiles 
SET user_role = 'owner', username = 'admin' 
WHERE email IN ('admin@admin.com', 'admin@system.local', 'hanyslmm@gmail.com');