-- Allow managers and owners to insert settlements on behalf of any user (including hall managers)
CREATE POLICY "Managers can insert settlements for any user"
ON public.daily_settlements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND (p.role = 'admin' OR p.user_role = ANY(ARRAY['owner'::user_role, 'manager'::user_role]))
  )
);