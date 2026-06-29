CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON public.stock_history USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders USING btree (payment_status);