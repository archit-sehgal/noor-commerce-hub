
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year TEXT;
  last_number INT;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Find the last invoice number for this year (new format: NC-YYYY-XXXX)
    SELECT COALESCE(
      MAX(
        CAST(
          SPLIT_PART(invoice_number, '-', 3) AS INT
        )
      ), 3136
    ) INTO last_number
    FROM invoices
    WHERE invoice_number LIKE 'NC-' || current_year || '-%';
    
    -- Also check old format (NC-XXXX-YYYY) for backward compatibility
    IF last_number = 3136 THEN
      SELECT GREATEST(last_number, COALESCE(
        MAX(
          CAST(
            SPLIT_PART(invoice_number, '-', 2) AS INT
          )
        ), 3136
      )) INTO last_number
      FROM invoices
      WHERE invoice_number LIKE 'NC-%-' || current_year
        AND SPLIT_PART(invoice_number, '-', 2) ~ '^\d+$';
    END IF;
    
    NEW.invoice_number := 'NC-' || current_year || '-' || (last_number + 1)::TEXT;
    RETURN NEW;
END;
$function$;
