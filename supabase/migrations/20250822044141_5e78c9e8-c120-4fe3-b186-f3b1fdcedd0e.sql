-- Create expenses table for financial management
CREATE TABLE public.expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Admins can manage expenses" 
ON public.expenses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'ADMIN' OR profiles.user_role IN ('owner', 'manager'))
));

-- Create function to calculate actual hall occupancy with real booking data
CREATE OR REPLACE FUNCTION public.get_hall_booking_hours()
RETURNS TABLE(
  hall_id UUID,
  hall_name TEXT,
  total_booked_hours NUMERIC,
  total_available_hours NUMERIC,
  occupancy_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH hall_stats AS (
    SELECT 
      h.id as hall_id,
      h.name as hall_name,
      -- Calculate actual booked hours per week for each hall
      COALESCE(SUM(
        CASE 
          WHEN b.status = 'active' 
          THEN array_length(b.days_of_week, 1) * 1.0 -- 1 hour per slot per day
          ELSE 0
        END
      ), 0) as total_booked_hours,
      -- Available hours: 12 hours/day * 2 days = 24 hours/week (Saturday + Sunday, 9am-9pm)
      24.0 as total_available_hours
    FROM public.halls h
    LEFT JOIN public.bookings b ON h.id = b.hall_id
    GROUP BY h.id, h.name
  )
  SELECT 
    hs.hall_id,
    hs.hall_name,
    hs.total_booked_hours,
    hs.total_available_hours,
    CASE 
      WHEN hs.total_available_hours > 0 
      THEN ROUND((hs.total_booked_hours / hs.total_available_hours) * 100, 1)
      ELSE 0
    END as occupancy_percentage
  FROM hall_stats hs
  ORDER BY hs.hall_name;
END;
$$;

-- Create function to get monthly expenses total
CREATE OR REPLACE FUNCTION public.get_monthly_expenses(p_month INTEGER, p_year INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
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