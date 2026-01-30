-- Add order_source to orders to differentiate between ecommerce and POS orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source text DEFAULT 'pos';

-- Update existing orders with user_id to be 'online' source
UPDATE public.orders SET order_source = 'online' WHERE user_id IS NOT NULL AND order_source = 'pos';

-- Create notifications table for admin alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL DEFAULT 'order',
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only staff can view notifications
CREATE POLICY "Staff can view notifications" ON public.notifications
    FOR SELECT USING (is_staff());

-- Staff can update (mark as read) notifications
CREATE POLICY "Staff can update notifications" ON public.notifications
    FOR UPDATE USING (is_staff());

-- Staff can delete notifications
CREATE POLICY "Staff can delete notifications" ON public.notifications
    FOR DELETE USING (is_staff());

-- Public can insert notifications (for order creation)
CREATE POLICY "Anyone can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;