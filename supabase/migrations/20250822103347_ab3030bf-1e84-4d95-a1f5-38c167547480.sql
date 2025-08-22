-- Fix security warnings by setting proper search paths for functions

-- Fix get_hall_booking_hours function with security definer and search path
CREATE OR REPLACE FUNCTION public.get_hall_booking_hours()
RETURNS TABLE(
  hall_id uuid,
  hall_name text,
  total_booked_hours bigint,
  total_available_hours integer,
  occupancy_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id as hall_id,
    h.name as hall_name,
    COALESCE(booking_hours.total_hours, 0) as total_booked_hours,
    24 as total_available_hours,
    CASE 
      WHEN COALESCE(booking_hours.total_hours, 0) = 0 THEN 0::NUMERIC
      ELSE LEAST(
        ROUND((COALESCE(booking_hours.total_hours, 0)::NUMERIC / 24) * 100, 1),
        100.0
      )
    END as occupancy_percentage
  FROM public.halls h
  LEFT JOIN (
    SELECT 
      b.hall_id,
      SUM(
        CASE 
          WHEN b.end_date IS NOT NULL AND b.start_date IS NOT NULL THEN
            GREATEST(1, (b.end_date - b.start_date) + 1) * 2
          ELSE 0
        END
      ) as total_hours
    FROM public.bookings b
    WHERE b.status != 'cancelled' 
      AND b.end_date >= CURRENT_DATE
    GROUP BY b.hall_id
  ) booking_hours ON h.id = booking_hours.hall_id
  ORDER BY h.name;
END;
$$;

-- Fix get_teacher_statistics_by_month function
CREATE OR REPLACE FUNCTION public.get_teacher_statistics_by_month(
    p_teacher_id uuid,
    p_month integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE::date)::integer,
    p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE::date)::integer
)
RETURNS TABLE(
    total_students bigint,
    total_classes bigint,
    total_earnings numeric,
    monthly_earnings numeric,
    pending_payments bigint,
    attendance_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT sr.student_id)::bigint as total_students,
    COUNT(DISTINCT b.id)::bigint as total_classes,
    COALESCE(SUM(sr.total_fees), 0)::numeric as total_earnings,
    COALESCE(SUM(CASE 
      WHEN EXTRACT(MONTH FROM sr.registration_date::date) = p_month 
       AND EXTRACT(YEAR FROM sr.registration_date::date) = p_year 
      THEN sr.total_fees 
      ELSE 0 
    END), 0)::numeric as monthly_earnings,
    COUNT(CASE WHEN sr.payment_status = 'pending' THEN 1 END)::bigint as pending_payments,
    COALESCE(AVG(CASE WHEN ar.status = 'present' THEN 100.0 ELSE 0.0 END), 0)::numeric as attendance_rate
  FROM public.bookings b
  LEFT JOIN public.student_registrations sr ON b.id = sr.booking_id
  LEFT JOIN public.attendance_records ar ON sr.id = ar.student_registration_id
  WHERE b.teacher_id = p_teacher_id
    AND b.status = 'active';
END;
$$;

-- Fix get_hall_occupancy_rates function
CREATE OR REPLACE FUNCTION public.get_hall_occupancy_rates()
RETURNS TABLE(
  hall_id uuid,
  name text,
  occupancy_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH hall_operating_hours AS (
    SELECT 
      h.id,
      h.name,
      CASE 
        WHEN h.operating_start_time IS NOT NULL AND h.operating_end_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (h.operating_end_time - h.operating_start_time)) / 3600
        ELSE 8
      END as daily_operating_hours
    FROM public.halls h
  ),
  today_bookings AS (
    SELECT 
      b.hall_id,
      COUNT(*) as booking_count
    FROM public.bookings b
    WHERE b.status = 'active'
      AND b.start_date <= CURRENT_DATE::date
      AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE::date)
      AND ARRAY[
        CASE EXTRACT(DOW FROM CURRENT_DATE::date)
          WHEN 0 THEN 'sunday'
          WHEN 1 THEN 'monday'
          WHEN 2 THEN 'tuesday'
          WHEN 3 THEN 'wednesday'
          WHEN 4 THEN 'thursday'
          WHEN 5 THEN 'friday'
          WHEN 6 THEN 'saturday'
        END
      ] && b.days_of_week
    GROUP BY b.hall_id
  )
  SELECT 
    hoh.id as hall_id,
    hoh.name,
    CASE 
      WHEN hoh.daily_operating_hours > 0 
      THEN ROUND((COALESCE(tb.booking_count, 0)::numeric / hoh.daily_operating_hours) * 100, 2)
      ELSE 0
    END as occupancy_percentage
  FROM hall_operating_hours hoh
  LEFT JOIN today_bookings tb ON hoh.id = tb.hall_id
  ORDER BY hoh.name;
END;
$$;

-- Fix get_monthly_expenses function
CREATE OR REPLACE FUNCTION public.get_monthly_expenses(p_month integer, p_year integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  total_expenses NUMERIC;
BEGIN
  start_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
  end_date := start_date + INTERVAL '1 month';
  
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM public.expenses
  WHERE date >= start_date AND date < end_date;
  
  RETURN total_expenses;
END;
$$;