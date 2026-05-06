-- ============================================================
-- Giseveral – Promote admin users + staff management helpers
-- ============================================================

-- --------------------------------------------------------
-- Promote known admin accounts by email
-- --------------------------------------------------------
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
  'gildopaulocorreia84@gmail.com'
);

-- Fallback: promote via auth.users join (handles cases where
-- profile.email may be null but auth.users.email is set)
UPDATE public.profiles p
SET role = 'admin'
FROM auth.users u
WHERE p.id = u.id
  AND u.email IN (
    'gildopaulocorreia84@gmail.com'
  )
  AND p.role != 'admin';

-- --------------------------------------------------------
-- Helper function: promote a user to admin by email
-- (run as superuser / service_role in dashboard)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.make_admin(target_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET role = 'admin'
  FROM auth.users u
  WHERE p.id = u.id
    AND u.email = target_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found or has no profile', target_email;
  END IF;
END;
$$;

-- --------------------------------------------------------
-- Allow admins to read all profiles (for staff management)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_staff() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "Admin can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- --------------------------------------------------------
-- Ensure handle_new_user trigger preserves email in profile
-- (so future email-based lookups work)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
