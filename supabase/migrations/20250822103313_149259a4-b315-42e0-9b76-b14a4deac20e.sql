-- Comprehensive fix for all hall occupancy functions with EXTRACT errors

-- Fix get_hall_booking_hours function
CREATE OR REPLACE FUNCTION public.get_hall_booking_hours()
RETURNS TABLE(
  hall_id uuid,
  hall_name text,
  total_booked_hours bigint,
  total_available_hours integer,
  occupancy_percentage numeric
)
LANGUAGE plpgsql
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
            GREATEST(1, (b.end_date - b.start_date) + 1) * 
            COALESCE(2, 2)
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