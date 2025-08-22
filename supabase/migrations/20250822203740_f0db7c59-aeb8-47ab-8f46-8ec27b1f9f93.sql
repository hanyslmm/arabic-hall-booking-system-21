-- Update student registrations to calculate payment status based on payment records
-- This will fix the issue where all payment statuses show as pending

-- First, create a function to update payment status based on payment records
CREATE OR REPLACE FUNCTION update_registration_payment_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update payment statuses based on actual payment records
  UPDATE student_registrations 
  SET payment_status = CASE 
    WHEN COALESCE(paid_amount, 0) >= COALESCE(total_fees, 0) AND COALESCE(total_fees, 0) > 0 THEN 'paid'
    WHEN COALESCE(paid_amount, 0) > 0 AND COALESCE(paid_amount, 0) < COALESCE(total_fees, 0) THEN 'partial'
    ELSE 'pending'
  END
  WHERE student_registrations.id IS NOT NULL;
  
  -- Also update based on payment records table if exists
  UPDATE student_registrations sr
  SET payment_status = CASE 
    WHEN total_paid.amount >= COALESCE(sr.total_fees, 0) AND COALESCE(sr.total_fees, 0) > 0 THEN 'paid'
    WHEN total_paid.amount > 0 AND total_paid.amount < COALESCE(sr.total_fees, 0) THEN 'partial'
    ELSE 'pending'
  END
  FROM (
    SELECT 
      pr.student_registration_id,
      COALESCE(SUM(pr.amount), 0) as amount
    FROM payment_records pr
    GROUP BY pr.student_registration_id
  ) as total_paid
  WHERE sr.id = total_paid.student_registration_id;
END;
$$;

-- Run the function to update existing records
SELECT update_registration_payment_status();