
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_customer_id uuid;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    -- Assign customer role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    -- Create cart for user
    INSERT INTO public.carts (user_id)
    VALUES (NEW.id);
    
    -- Check if a customer with the same email already exists
    SELECT id INTO existing_customer_id
    FROM public.customers
    WHERE email = NEW.email AND user_id IS NULL
    LIMIT 1;
    
    IF existing_customer_id IS NOT NULL THEN
        -- Link existing customer record to this user
        UPDATE public.customers
        SET user_id = NEW.id,
            name = COALESCE(NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ''), name)
        WHERE id = existing_customer_id;
    ELSE
        -- Create new customer record
        INSERT INTO public.customers (user_id, name, email)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
    END IF;
    
    RETURN NEW;
END;
$function$;
