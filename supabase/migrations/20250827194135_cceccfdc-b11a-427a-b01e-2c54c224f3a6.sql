-- Fix search_path for security functions
ALTER FUNCTION public.create_student_account() SET search_path = public;
ALTER FUNCTION public.auto_reset_student_password(uuid) SET search_path = public;
ALTER FUNCTION public.get_student_dashboard_data(uuid) SET search_path = public;
ALTER FUNCTION public.get_teacher_statistics_by_month(uuid, integer, integer) SET search_path = public;
ALTER FUNCTION public.reset_student_password(uuid, text) SET search_path = public;
ALTER FUNCTION public.generate_class_code(uuid, text[], time) SET search_path = public;
ALTER FUNCTION public.get_hall_occupancy_data() SET search_path = public;
ALTER FUNCTION public.get_hall_occupancy_rates() SET search_path = public;