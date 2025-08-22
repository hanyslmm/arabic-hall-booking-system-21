-- Fix the get_hall_booking_hours RPC to prevent over 100% occupancy
CREATE OR REPLACE FUNCTION get_hall_booking_hours()
RETURNS TABLE (
  hall_id UUID,
  hall_name TEXT,
  total_booked_hours BIGINT,
  total_available_hours INTEGER,
  occupancy_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id as hall_id,
    h.name as hall_name,
    COALESCE(booking_hours.total_hours, 0) as total_booked_hours,
    24 as total_available_hours, -- 12 hours * 2 days (Sat + Sun)
    CASE 
      WHEN COALESCE(booking_hours.total_hours, 0) = 0 THEN 0::NUMERIC
      ELSE LEAST(
        ROUND((COALESCE(booking_hours.total_hours, 0)::NUMERIC / 24) * 100, 1),
        100.0
      )
    END as occupancy_percentage
  FROM halls h
  LEFT JOIN (
    SELECT 
      b.hall_id,
      SUM(
        CASE 
          WHEN b.end_date IS NOT NULL AND b.start_date IS NOT NULL THEN
            GREATEST(1, EXTRACT(DAY FROM (b.end_date - b.start_date)) + 1) * 
            COALESCE(b.weekly_hours, 2) -- Default 2 hours per week if not specified
          ELSE 0
        END
      ) as total_hours
    FROM bookings b
    WHERE b.status != 'cancelled' 
      AND b.end_date >= CURRENT_DATE -- Only active bookings
    GROUP BY b.hall_id
  ) booking_hours ON h.id = booking_hours.hall_id
  ORDER BY h.name;