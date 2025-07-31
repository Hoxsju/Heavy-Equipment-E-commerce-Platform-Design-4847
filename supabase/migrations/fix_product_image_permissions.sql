-- Fix product image update permissions
-- This migration ensures that product images can be updated properly

-- First, check if the woo_import_products table exists and has the correct structure
ALTER TABLE public.woo_import_products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS if not already enabled
ALTER TABLE public.woo_import_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable public read access" ON public.woo_import_products;
DROP POLICY IF EXISTS "Enable admin insert access" ON public.woo_import_products;
DROP POLICY IF EXISTS "Enable admin update access" ON public.woo_import_products;
DROP POLICY IF EXISTS "Enable admin delete access" ON public.woo_import_products;

-- Create comprehensive policies for product management
-- Allow public read access to all products
CREATE POLICY "Enable public read access" ON public.woo_import_products
  FOR SELECT USING (true);

-- Allow insert access for authenticated users and public (for demo)
CREATE POLICY "Enable insert access" ON public.woo_import_products
  FOR INSERT WITH CHECK (true);

-- Allow update access for authenticated users and public (for demo)
CREATE POLICY "Enable update access" ON public.woo_import_products
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete access for authenticated users and public (for demo)
CREATE POLICY "Enable delete access" ON public.woo_import_products
  FOR DELETE USING (true);

-- Grant necessary permissions to roles
GRANT ALL ON public.woo_import_products TO authenticated;
GRANT ALL ON public.woo_import_products TO anon;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create or update function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_woo_import_products_updated_at ON public.woo_import_products;
CREATE TRIGGER update_woo_import_products_updated_at
    BEFORE UPDATE ON public.woo_import_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_woo_import_products_updated_at ON public.woo_import_products(updated_at);
CREATE INDEX IF NOT EXISTS idx_woo_import_products_status ON public.woo_import_products(status);
CREATE INDEX IF NOT EXISTS idx_woo_import_products_brand ON public.woo_import_products(brand);
CREATE INDEX IF NOT EXISTS idx_woo_import_products_category ON public.woo_import_products(category);

-- Ensure the storage bucket exists and has proper permissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies for product images
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- Allow public read access to storage objects
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product_images');

-- Allow public upload access (for demo purposes)
CREATE POLICY "Public upload access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product_images');

-- Allow public update access (for demo purposes)
CREATE POLICY "Public update access" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product_images');

-- Allow public delete access (for demo purposes)
CREATE POLICY "Public delete access" ON storage.objects
  FOR DELETE USING (bucket_id = 'product_images');