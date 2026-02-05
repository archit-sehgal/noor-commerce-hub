-- Create online_store_products table for e-commerce product management
-- Linked to inventory products with customizable fields for online store
CREATE TABLE public.online_store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}'::text[],
  sizes TEXT[] DEFAULT '{}'::text[],
  colors TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id) -- One online listing per inventory product
);

-- Enable RLS
ALTER TABLE public.online_store_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active online store products"
ON public.online_store_products
FOR SELECT
USING ((is_active = true) OR is_staff());

CREATE POLICY "Only admins can insert online store products"
ON public.online_store_products
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update online store products"
ON public.online_store_products
FOR UPDATE
USING (is_admin());

CREATE POLICY "Only admins can delete online store products"
ON public.online_store_products
FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_online_store_products_updated_at
BEFORE UPDATE ON public.online_store_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();