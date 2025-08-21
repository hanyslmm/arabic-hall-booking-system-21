-- Phase 1: Add missing enums
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM ('owner', 'manager', 'teacher', 'receptionist', 'space_manager', 'read_only');
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE IF NOT EXISTS public.payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE IF NOT EXISTS public.attendance_status AS ENUM ('present', 'absent', 'late');

-- Phase 2: Add missing columns to existing tables
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'space_manager',
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS class_code TEXT,
ADD COLUMN IF NOT EXISTS is_custom_fee BOOLEAN DEFAULT false;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS teacher_code TEXT UNIQUE;

-- Phase 3: Create missing tables

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logs table
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

-- Attendance records table
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

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'income', 'expense'
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

-- Phase 5: Create RLS policies

-- Settings policies
CREATE POLICY "All users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Attendance records policies
CREATE POLICY "Admins can manage attendance" ON public.attendance_records FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));
CREATE POLICY "Teachers can manage their students attendance" ON public.attendance_records FOR ALL TO authenticated 
USING (EXISTS (
    SELECT 1 FROM public.student_registrations sr
    JOIN public.bookings b ON b.id = sr.booking_id
    JOIN public.profiles p ON p.teacher_id = b.teacher_id
    WHERE sr.id = student_registration_id AND p.id = auth.uid()
));

-- Transactions policies
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR user_role IN ('owner', 'manager'))));

-- Phase 6: Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('default_booking_duration_minutes', '60', 'Default duration for bookings in minutes'),
('system_name', 'مركز الإدارة التعليمي', 'System display name'),
('currency', 'JOD', 'Default currency'),
('academic_year', '2024-2025', 'Current academic year')
ON CONFLICT (key) DO NOTHING;

-- Phase 7: Create triggers for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 8: Update existing admin users
UPDATE public.profiles 
SET user_role = 'owner', username = 'admin' 
WHERE email IN ('admin@admin.com', 'admin@system.local', 'hanyslmm@gmail.com');