import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase query, paginating to bypass the 1000-row limit.
 * Pass a query builder function that returns the base query (without range).
 */
export async function fetchAllPaginated<T = any>(
  buildQuery: () => any
): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...(data as T[])];
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}
