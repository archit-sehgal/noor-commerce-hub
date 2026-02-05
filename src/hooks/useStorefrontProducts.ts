import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StorefrontProduct {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  images: string[];
  sizes: string[];
  colors: string[];
  is_featured: boolean;
  stock_quantity: number;
  created_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Hook for storefront - fetches from online_store_products with inventory stock
export const useStorefrontProducts = (options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["storefront-products", options],
    queryFn: async () => {
      let query = supabase
        .from("online_store_products")
        .select(`
          id,
          product_id,
          name,
          description,
          price,
          discount_price,
          images,
          sizes,
          colors,
          is_featured,
          created_at,
          category:categories(id, name, slug),
          product:products!inner(id, slug, stock_quantity)
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (options?.featured) {
        query = query.eq("is_featured", true);
      }

      if (options?.categorySlug) {
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", options.categorySlug)
          .single();

        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include stock_quantity at top level
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        slug: item.product?.slug || item.id,
        description: item.description,
        price: item.price,
        discount_price: item.discount_price,
        images: item.images || [],
        sizes: item.sizes || [],
        colors: item.colors || [],
        is_featured: item.is_featured,
        stock_quantity: item.product?.stock_quantity || 0,
        created_at: item.created_at,
        category: item.category,
      })) as StorefrontProduct[];
    },
  });
};

// Hook for single storefront product by slug
export const useStorefrontProduct = (slug: string) => {
  return useQuery({
    queryKey: ["storefront-product", slug],
    queryFn: async () => {
      // First find the product by slug
      const { data: inventoryProduct } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!inventoryProduct) {
        throw new Error("Product not found");
      }

      // Then get the online store product
      const { data, error } = await supabase
        .from("online_store_products")
        .select(`
          id,
          product_id,
          name,
          description,
          price,
          discount_price,
          images,
          sizes,
          colors,
          is_featured,
          category:categories(id, name, slug),
          product:products!inner(id, slug, stock_quantity)
        `)
        .eq("product_id", inventoryProduct.id)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        product_id: data.product_id,
        name: data.name,
        slug: (data.product as any)?.slug || data.id,
        description: data.description,
        price: data.price,
        discount_price: data.discount_price,
        images: data.images || [],
        sizes: data.sizes || [],
        colors: data.colors || [],
        is_featured: data.is_featured,
        stock_quantity: (data.product as any)?.stock_quantity || 0,
        category: data.category,
      } as StorefrontProduct;
    },
    enabled: !!slug,
  });
};
