-- Create salesman table
CREATE TABLE public.salesman (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text,
    email text,
    is_active boolean DEFAULT true,
    total_sales numeric DEFAULT 0,
    total_orders integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salesman ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view salesman" ON public.salesman
FOR SELECT USING (is_staff());

CREATE POLICY "Admins can insert salesman" ON public.salesman
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update salesman" ON public.salesman
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete salesman" ON public.salesman
FOR DELETE USING (is_admin());

-- Add salesman_id to orders table
ALTER TABLE public.orders ADD COLUMN salesman_id uuid REFERENCES public.salesman(id);

-- Add salesman_id to invoices table
ALTER TABLE public.invoices ADD COLUMN salesman_id uuid REFERENCES public.salesman(id);

-- Create trigger for updated_at
CREATE TRIGGER update_salesman_updated_at
BEFORE UPDATE ON public.salesman
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();