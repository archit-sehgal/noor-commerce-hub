-- Add commission_rate column to salesman table
ALTER TABLE public.salesman 
ADD COLUMN commission_rate numeric DEFAULT 0;