import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase table, paginating automatically to bypass the 1000-row limit.
 * @param table - Table name
 * @param select - Select columns string
 * @param options - Optional filters, ordering, etc.
 */
export async function fetchAllRows<T = any>(
  table: string,
  select: string,
  options?: {
    filters?: Array<{ column: string; operator: string; value: any }>;
    order?: { column: string; ascending?: boolean };
    eq?: Record<string, any>;
    gt?: Record<string, any>;
    gte?: Record<string, any>;
    lte?: Record<string, any>;
    lt?: Record<string, any>;
    neq?: Record<string, any>;
  }
): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);

    if (options?.eq) {
      for (const [col, val] of Object.entries(options.eq)) {
        query = query.eq(col, val);
      }
    }
    if (options?.gt) {
      for (const [col, val] of Object.entries(options.gt)) {
        query = query.gt(col, val);
      }
    }
    if (options?.gte) {
      for (const [col, val] of Object.entries(options.gte)) {
        query = query.gte(col, val);
      }
    }
    if (options?.lte) {
      for (const [col, val] of Object.entries(options.lte)) {
        query = query.lte(col, val);
      }
    }
    if (options?.lt) {
      for (const [col, val] of Object.entries(options.lt)) {
        query = query.lt(col, val);
      }
    }
    if (options?.neq) {
      for (const [col, val] of Object.entries(options.neq)) {
        query = query.neq(col, val);
      }
    }
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...(data as T[])];
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}
