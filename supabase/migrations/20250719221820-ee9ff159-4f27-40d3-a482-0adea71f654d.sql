-- Update the serial number generation function to use only numbers
CREATE OR REPLACE FUNCTION public.generate_student_serial()
RETURNS TEXT AS $$
DECLARE
  new_serial TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_serial := LPAD(counter::TEXT, 4, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE serial_number = new_serial) THEN
      RETURN new_serial;
    END IF;
    
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;