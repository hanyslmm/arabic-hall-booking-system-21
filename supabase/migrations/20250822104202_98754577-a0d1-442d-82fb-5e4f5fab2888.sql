-- Final fix for remaining functions with search path issues

-- Fix handle_new_user_simple function
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if it doesn't exist
  INSERT INTO public.profiles (id, email, full_name, user_role, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'space_manager', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix generate_class_code function
CREATE OR REPLACE FUNCTION public.generate_class_code(p_teacher_id uuid, p_days_of_week text[], p_start_time time without time zone)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  teacher_code TEXT;
  days_code TEXT;
  time_code TEXT;
  am_pm_suffix TEXT;
  result_code TEXT;
BEGIN
  -- Get teacher code
  SELECT COALESCE(t.teacher_code, UPPER(LEFT(t.name, 1))) INTO teacher_code
  FROM public.teachers t WHERE t.id = p_teacher_id;
  
  -- Generate days code based on the most frequent pattern
  CASE 
    WHEN 'saturday' = ANY(p_days_of_week) AND 'monday' = ANY(p_days_of_week) AND 'wednesday' = ANY(p_days_of_week) THEN
      days_code := 'SAT';
    WHEN 'sunday' = ANY(p_days_of_week) AND 'tuesday' = ANY(p_days_of_week) AND 'thursday' = ANY(p_days_of_week) THEN
      days_code := 'SUN';
    WHEN 'monday' = ANY(p_days_of_week) AND 'wednesday' = ANY(p_days_of_week) AND 'friday' = ANY(p_days_of_week) THEN
      days_code := 'MON';
    ELSE
      -- Default to first day
      days_code := UPPER(LEFT(p_days_of_week[1], 3));
  END CASE;
  
  -- Generate time code (extract hour)
  time_code := EXTRACT(HOUR FROM p_start_time)::TEXT;
  
  -- Determine AM/PM suffix
  IF EXTRACT(HOUR FROM p_start_time) >= 12 THEN
    am_pm_suffix := 'PM';
  ELSE
    am_pm_suffix := 'AM';
  END IF;
  
  -- Combine all parts
  result_code := teacher_code || '_' || days_code || '_' || time_code || '_' || am_pm_suffix;
  
  RETURN result_code;
END;
$$;