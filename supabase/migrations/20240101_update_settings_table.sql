-- Update settings table to include all required columns
ALTER TABLE public.settings_qwerty12345 
ADD COLUMN IF NOT EXISTS website_name TEXT,
ADD COLUMN IF NOT EXISTS website_logo TEXT,
ADD COLUMN IF NOT EXISTS website_slogan TEXT,
ADD COLUMN IF NOT EXISTS footer_description TEXT,
ADD COLUMN IF NOT EXISTS footer_phone TEXT,
ADD COLUMN IF NOT EXISTS footer_email TEXT,
ADD COLUMN IF NOT EXISTS footer_address TEXT;

-- Update RLS policies to allow public read access
DROP POLICY IF EXISTS "Allow read access to all users" ON public.settings_qwerty12345;

-- Allow public read access (no authentication required)
CREATE POLICY "Allow public read access" ON public.settings_qwerty12345 
  FOR SELECT USING (true);

-- Allow insert/update access to all users (for demo purposes)
CREATE POLICY "Allow public write access" ON public.settings_qwerty12345 
  FOR ALL USING (true) 
  WITH CHECK (true);