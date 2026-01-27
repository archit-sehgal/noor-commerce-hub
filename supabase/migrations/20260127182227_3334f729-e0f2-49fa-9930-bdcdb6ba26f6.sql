-- Create employee_permissions table for granular access control
CREATE TABLE public.employee_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_billing BOOLEAN DEFAULT true,
    permission_orders BOOLEAN DEFAULT true,
    permission_customers BOOLEAN DEFAULT false,
    permission_inventory BOOLEAN DEFAULT false,
    permission_products BOOLEAN DEFAULT false,
    permission_categories BOOLEAN DEFAULT false,
    permission_reports BOOLEAN DEFAULT false,
    permission_invoices BOOLEAN DEFAULT true,
    permission_salesmen BOOLEAN DEFAULT false,
    permission_settings BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage employee permissions
CREATE POLICY "Admins can view all employee permissions"
ON public.employee_permissions FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert employee permissions"
ON public.employee_permissions FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update employee permissions"
ON public.employee_permissions FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete employee permissions"
ON public.employee_permissions FOR DELETE
USING (public.is_admin());

-- Employees can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.employee_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_permissions_updated_at
    BEFORE UPDATE ON public.employee_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();