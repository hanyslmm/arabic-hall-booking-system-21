-- Create daily settlements table for recording daily income and expenses
CREATE TABLE public.daily_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  source_type TEXT NOT NULL, -- 'teacher' or 'other'
  source_id UUID, -- references teachers table when source_type is 'teacher'
  source_name TEXT NOT NULL, -- teacher name or custom source name
  category TEXT, -- for expenses: categories like rent, utilities, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_settlements ENABLE ROW LEVEL SECURITY;

-- Create policies for daily settlements
CREATE POLICY "Hall managers can manage their own settlements" 
ON public.daily_settlements 
FOR ALL 
USING (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('space_manager', 'manager', 'owner')
  )
);

CREATE POLICY "Admins and managers can view all settlements" 
ON public.daily_settlements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR user_role IN ('owner', 'manager'))
  )
);

-- Create index for better performance
CREATE INDEX idx_daily_settlements_date ON public.daily_settlements(settlement_date);
CREATE INDEX idx_daily_settlements_created_by ON public.daily_settlements(created_by);
CREATE INDEX idx_daily_settlements_type ON public.daily_settlements(type);

-- Create function to update timestamps
CREATE TRIGGER update_daily_settlements_updated_at
BEFORE UPDATE ON public.daily_settlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();