-- Add alteration fields to orders table
ALTER TABLE public.orders 
ADD COLUMN needs_alteration boolean DEFAULT false,
ADD COLUMN alteration_due_date timestamp with time zone,
ADD COLUMN alteration_status text DEFAULT 'pending' CHECK (alteration_status IN ('pending', 'in_progress', 'ready', 'delivered')),
ADD COLUMN alteration_notes text;

-- Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  notes text,
  is_active boolean DEFAULT true,
  total_purchases numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create purchases table
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  purchase_number text NOT NULL,
  purchase_date timestamp with time zone DEFAULT now() NOT NULL,
  total_amount numeric DEFAULT 0,
  notes text,
  bill_image_url text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create purchase items table
CREATE TABLE public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  sno integer NOT NULL,
  item_name text NOT NULL,
  hsn_code text,
  quantity integer DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all new tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT USING (is_staff());
CREATE POLICY "Staff can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "Staff can update suppliers" ON public.suppliers FOR UPDATE USING (is_staff());
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE USING (is_admin());

-- RLS policies for purchases
CREATE POLICY "Staff can view purchases" ON public.purchases FOR SELECT USING (is_staff());
CREATE POLICY "Staff can insert purchases" ON public.purchases FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "Staff can update purchases" ON public.purchases FOR UPDATE USING (is_staff());
CREATE POLICY "Admins can delete purchases" ON public.purchases FOR DELETE USING (is_admin());

-- RLS policies for purchase_items
CREATE POLICY "Staff can view purchase items" ON public.purchase_items FOR SELECT USING (is_staff());
CREATE POLICY "Staff can insert purchase items" ON public.purchase_items FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "Staff can update purchase items" ON public.purchase_items FOR UPDATE USING (is_staff());
CREATE POLICY "Admins can delete purchase items" ON public.purchase_items FOR DELETE USING (is_admin());

-- Add new permission columns for alterations and purchases
ALTER TABLE public.employee_permissions 
ADD COLUMN permission_alterations boolean DEFAULT true,
ADD COLUMN permission_purchases boolean DEFAULT false;

-- Create storage bucket for purchase bills
INSERT INTO storage.buckets (id, name, public) VALUES ('purchase-bills', 'purchase-bills', false);

-- Storage policies for purchase bills
CREATE POLICY "Staff can view purchase bills" ON storage.objects FOR SELECT USING (bucket_id = 'purchase-bills' AND is_staff());
CREATE POLICY "Staff can upload purchase bills" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'purchase-bills' AND is_staff());
CREATE POLICY "Staff can update purchase bills" ON storage.objects FOR UPDATE USING (bucket_id = 'purchase-bills' AND is_staff());
CREATE POLICY "Admins can delete purchase bills" ON storage.objects FOR DELETE USING (bucket_id = 'purchase-bills' AND is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();