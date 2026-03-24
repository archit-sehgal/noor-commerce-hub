
-- Merge duplicate customers with same phone number
-- For each phone number with duplicates, keep the most recently updated one
-- and reassign all orders/invoices to it, then delete the duplicates

DO $$
DECLARE
  rec RECORD;
  keeper_id uuid;
  dup_id uuid;
BEGIN
  -- Find all phone numbers that have more than one customer
  FOR rec IN
    SELECT phone
    FROM customers
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  LOOP
    -- Get the keeper: the one with the latest updated_at (or most orders/spending)
    SELECT id INTO keeper_id
    FROM customers
    WHERE phone = rec.phone
    ORDER BY updated_at DESC
    LIMIT 1;

    -- For each duplicate (not the keeper), reassign references and delete
    FOR dup_id IN
      SELECT id FROM customers
      WHERE phone = rec.phone AND id != keeper_id
    LOOP
      -- Reassign orders
      UPDATE orders SET customer_id = keeper_id WHERE customer_id = dup_id;
      -- Reassign invoices
      UPDATE invoices SET customer_id = keeper_id WHERE customer_id = dup_id;
      -- Delete the duplicate
      DELETE FROM customers WHERE id = dup_id;
    END LOOP;

    -- Update the keeper's total_orders and total_spent from actual orders
    UPDATE customers SET
      total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = keeper_id),
      total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = keeper_id),
      last_purchase_date = (SELECT MAX(created_at) FROM orders WHERE customer_id = keeper_id)
    WHERE id = keeper_id;
  END LOOP;
END $$;
