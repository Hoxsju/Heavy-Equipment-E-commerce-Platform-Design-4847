-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders_qwerty12345 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  notes TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.orders_qwerty12345 ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public create orders" ON public.orders_qwerty12345 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read own orders" ON public.orders_qwerty12345 
  FOR SELECT USING (customer_email = auth.email() OR auth.role() IN ('admin', 'main_admin'));

CREATE POLICY "Allow admins to read all orders" ON public.orders_qwerty12345 
  FOR SELECT USING (auth.role() IN ('admin', 'main_admin'));

CREATE POLICY "Allow admins to update orders" ON public.orders_qwerty12345 
  FOR UPDATE USING (auth.role() IN ('admin', 'main_admin'))
  WITH CHECK (auth.role() IN ('admin', 'main_admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS orders_qwerty12345_customer_email_idx ON public.orders_qwerty12345 (customer_email);
CREATE INDEX IF NOT EXISTS orders_qwerty12345_status_idx ON public.orders_qwerty12345 (status);
CREATE INDEX IF NOT EXISTS orders_qwerty12345_created_at_idx ON public.orders_qwerty12345 (created_at);