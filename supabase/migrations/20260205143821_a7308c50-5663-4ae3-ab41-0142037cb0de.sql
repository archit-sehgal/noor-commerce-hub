-- Add design_number field to products table for P1/DSN mapping
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS design_number text;

-- Create product_imports table to track import history
CREATE TABLE IF NOT EXISTS public.product_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  products_created integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  error_details jsonb DEFAULT '[]'::jsonb,
  imported_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_imports ENABLE ROW LEVEL SECURITY;

-- Only admins can view import history
CREATE POLICY "Admins can view product imports" 
ON public.product_imports 
FOR SELECT 
USING (is_admin());

-- Only admins can insert import records
CREATE POLICY "Admins can insert product imports" 
ON public.product_imports 
FOR INSERT 
WITH CHECK (is_admin());

-- Only admins can delete import records
CREATE POLICY "Admins can delete product imports" 
ON public.product_imports 
FOR DELETE 
USING (is_admin());

-- Update stock_history change_type to include file_upload source
COMMENT ON COLUMN public.stock_history.change_type IS 'Types: manual_adjustment, order_deduction, file_upload, return';