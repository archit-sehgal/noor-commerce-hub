-- Add SKU column to order_items for inventory tracking
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_sku TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.order_items.product_sku IS 'Product SKU/BCN code for inventory tracking';