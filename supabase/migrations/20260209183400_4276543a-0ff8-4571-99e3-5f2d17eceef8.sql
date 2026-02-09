
-- Update invoice number generator to NC-3000-YYYY format with sequential numbering
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
    
    -- Find the last invoice number for this year
    SELECT COALESCE(
      MAX(
        CAST(
          SPLIT_PART(SPLIT_PART(invoice_number, '-', 2), '-', 1) AS INT
        )
      ), 2999
    ) INTO last_number
    FROM invoices
    WHERE invoice_number LIKE 'NC-%-' || current_year;
    
    NEW.invoice_number := 'NC-' || (last_number + 1)::TEXT || '-' || current_year;
    RETURN NEW;
END;
$function$;
