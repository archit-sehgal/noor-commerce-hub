CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    target_year TEXT;
    last_number INT;
    floor_number INT;
BEGIN
    -- Use 2027 as the active invoice year going forward
    target_year := '2027';
    floor_number := 1309; -- next generated will be 1310

    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(invoice_number, '-', 3) AS INT)
    ), floor_number)
    INTO last_number
    FROM invoices
    WHERE invoice_number LIKE 'NC-' || target_year || '-%'
      AND SPLIT_PART(invoice_number, '-', 3) ~ '^\d+$';

    IF last_number < floor_number THEN
      last_number := floor_number;
    END IF;

    NEW.invoice_number := 'NC-' || target_year || '-' || (last_number + 1)::TEXT;
    RETURN NEW;
END;
$function$;