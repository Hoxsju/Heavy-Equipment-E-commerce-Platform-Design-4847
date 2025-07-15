-- Create users table
CREATE TABLE IF NOT EXISTS public.users_qwerty12345 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    email_confirmed BOOLEAN DEFAULT false,
    confirmation_code TEXT,
    confirmation_expires_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.users_qwerty12345 ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public create" ON public.users_qwerty12345
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read own data" ON public.users_qwerty12345
    FOR SELECT USING (auth.uid() = id OR role IN ('admin', 'main_admin'));

CREATE POLICY "Allow users to update own data" ON public.users_qwerty12345
    FOR UPDATE USING (auth.uid() = id OR role IN ('admin', 'main_admin'))
    WITH CHECK (auth.uid() = id OR role IN ('admin', 'main_admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS users_qwerty12345_email_idx ON public.users_qwerty12345 (email);
CREATE INDEX IF NOT EXISTS users_qwerty12345_role_idx ON public.users_qwerty12345 (role);