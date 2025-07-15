-- Update orders table to include customer_id and remove total
ALTER TABLE public.orders_qwerty12345
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.users_qwerty12345(id),
DROP COLUMN IF EXISTS total;

-- Update existing RLS policies
DROP POLICY IF EXISTS "Allow public create orders" ON public.orders_qwerty12345;
DROP POLICY IF EXISTS "Allow users to read own orders" ON public.orders_qwerty12345;
DROP POLICY IF EXISTS "Allow admins to read all orders" ON public.orders_qwerty12345;
DROP POLICY IF EXISTS "Allow admins to update orders" ON public.orders_qwerty12345;

-- Create new RLS policies
CREATE POLICY "Allow public create orders" 
ON public.orders_qwerty12345 FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow users to read own orders" 
ON public.orders_qwerty12345 FOR SELECT 
USING (customer_id = auth.uid() OR customer_email = auth.email());

CREATE POLICY "Allow admins to read all orders" 
ON public.orders_qwerty12345 FOR SELECT 
USING (auth.role() IN ('admin', 'main_admin'));

CREATE POLICY "Allow admins to update orders" 
ON public.orders_qwerty12345 FOR UPDATE 
USING (auth.role() IN ('admin', 'main_admin'))
WITH CHECK (auth.role() IN ('admin', 'main_admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS orders_qwerty12345_customer_id_idx 
ON public.orders_qwerty12345(customer_id);