-- Fix hall occupancy calculation to properly calculate 24 available hours per hall
-- Update the RPC function to calculate based on total available time slots

CREATE OR REPLACE FUNCTION public.get_hall_occupancy_data()
RETURNS TABLE(
  hall_id UUID,
  hall_name TEXT,
  occupied_slots INTEGER,
  available_slots INTEGER,
  occupancy_percentage NUMERIC,
  working_hours_per_day INTEGER,
  working_days_per_week INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH hall_info AS (
    SELECT 
      h.id as hall_id,
      h.name as hall_name,
      -- Each hall has 24 available slots per week (12 for Sat/Mon/Wed pattern + 12 for Sun/Tue/Thu pattern)
      24 as total_available_slots,
      12 as working_hours_per_day,
      2 as working_days_per_week
    FROM public.halls h
  ),
  occupied_time AS (
    SELECT 
      b.hall_id,
      COUNT(*) as occupied_slots
    FROM public.bookings b
    WHERE b.status = 'active'
      AND b.start_date <= CURRENT_DATE
      AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
    GROUP BY b.hall_id
  )
  SELECT 
    hi.hall_id,
    hi.hall_name,
    COALESCE(ot.occupied_slots, 0)::INTEGER as occupied_slots,
    hi.total_available_slots as available_slots,
    CASE 
      WHEN hi.total_available_slots > 0 
      THEN ROUND((COALESCE(ot.occupied_slots, 0)::NUMERIC / hi.total_available_slots) * 100, 2)
      ELSE 0
    END as occupancy_percentage,
    hi.working_hours_per_day,
    hi.working_days_per_week
  FROM hall_info hi
  LEFT JOIN occupied_time ot ON hi.hall_id = ot.hall_id
  ORDER BY hi.hall_name;
END;
$$;