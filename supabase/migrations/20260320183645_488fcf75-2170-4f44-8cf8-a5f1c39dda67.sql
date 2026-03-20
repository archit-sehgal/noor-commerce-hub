
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view settings" ON public.app_settings FOR SELECT USING (is_staff());
CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete settings" ON public.app_settings FOR DELETE USING (is_admin());

-- Insert default discount percentage as 15
INSERT INTO public.app_settings (key, value) VALUES ('default_discount_percent', '15');
