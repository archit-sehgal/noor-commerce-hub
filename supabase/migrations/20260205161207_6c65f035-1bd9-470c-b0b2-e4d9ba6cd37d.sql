-- Fix 1: Replace overly permissive notifications INSERT policy with staff-only
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;
CREATE POLICY "Staff can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (is_staff());

-- Fix 2: Replace product-images storage policies to use is_staff() instead of auth.role()
DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects;

CREATE POLICY "Staff can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND is_staff()
);

CREATE POLICY "Staff can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND is_staff()
);

CREATE POLICY "Staff can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND is_staff()
);