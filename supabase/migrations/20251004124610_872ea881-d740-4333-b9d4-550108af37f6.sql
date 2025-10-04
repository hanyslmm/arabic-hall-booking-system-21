-- Drop existing restrictive policies for subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can view subjects" ON public.subjects;

-- Create new policies allowing managers and space_managers to manage subjects
CREATE POLICY "Admins, managers, and space_managers can manage subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.user_role IN ('owner', 'manager', 'space_manager')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.user_role IN ('owner', 'manager', 'space_manager')
    )
  )
);

-- Allow all authenticated users to view subjects
CREATE POLICY "All authenticated users can view subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);

-- Also update academic_stages table to allow managers and space_managers
DROP POLICY IF EXISTS "Admins can manage academic_stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Users can view academic_stages" ON public.academic_stages;

CREATE POLICY "Admins, managers, and space_managers can manage academic_stages"
ON public.academic_stages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.user_role IN ('owner', 'manager', 'space_manager')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.user_role IN ('owner', 'manager', 'space_manager')
    )
  )
);

CREATE POLICY "All authenticated users can view academic_stages"
ON public.academic_stages
FOR SELECT
TO authenticated
USING (true);