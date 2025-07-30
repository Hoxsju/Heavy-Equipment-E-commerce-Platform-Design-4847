-- Add status field to users table
ALTER TABLE public.users_qwerty12345
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));

-- Create index on status field for better query performance
CREATE INDEX IF NOT EXISTS users_qwerty12345_status_idx ON public.users_qwerty12345(status);

-- Update RLS policies to include status checking
DROP POLICY IF EXISTS "Allow users to read own data" ON public.users_qwerty12345;
CREATE POLICY "Allow users to read own data" ON public.users_qwerty12345 
  FOR SELECT USING (auth.uid() = id OR role IN ('admin', 'main_admin'));

-- Ensure only active users can update their data
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users_qwerty12345;
CREATE POLICY "Allow users to update own data" ON public.users_qwerty12345 
  FOR UPDATE USING (
    (auth.uid() = id AND status = 'active') OR 
    role IN ('admin', 'main_admin')
  ) WITH CHECK (
    (auth.uid() = id AND status = 'active') OR 
    role IN ('admin', 'main_admin')
  );

-- Create auth hooks function to check user status during sign in
CREATE OR REPLACE FUNCTION public.check_user_status()
RETURNS trigger AS $$
BEGIN
  -- Check if the user is suspended
  IF EXISTS (
    SELECT 1 FROM public.users_qwerty12345
    WHERE id = auth.uid() AND status = 'suspended'
  ) THEN
    RAISE EXCEPTION 'User account is suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table for sign in
DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;
CREATE TRIGGER on_auth_user_signin
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_status();