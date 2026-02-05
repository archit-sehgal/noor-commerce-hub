import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnlineStoreProduct {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  category_id: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  product?: {
    id: string;
    sku: string;
    stock_quantity: number;
  };
}

export interface OnlineStoreProductInsert {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  category_id?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  sort_order?: number;
}

export const useOnlineStoreProducts = (options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
  activeOnly?: boolean;
}) => {
  return useQuery({
    queryKey: ["online-store-products", options],
    queryFn: async () => {
      let query = supabase
        .from("online_store_products")
        .select(`
          *,
          category:categories(id, name, slug),
          product:products(id, sku, stock_quantity)
        `)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (options?.activeOnly !== false) {
        query = query.eq("is_active", true);
      }

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
      return data as OnlineStoreProduct[];
    },
  });
};

export const useOnlineStoreProduct = (id: string) => {
  return useQuery({
    queryKey: ["online-store-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("online_store_products")
        .select(`
          *,
          category:categories(id, name, slug),
          product:products(id, sku, stock_quantity)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as OnlineStoreProduct;
    },
    enabled: !!id,
  });
};

export const useCreateOnlineStoreProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: OnlineStoreProductInsert) => {
      const { data, error } = await supabase
        .from("online_store_products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["online-store-products"] });
      toast({
        title: "Product added to store",
        description: "The product is now visible on your online store.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOnlineStoreProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...product
    }: Partial<OnlineStoreProductInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("online_store_products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["online-store-products"] });
      toast({
        title: "Product updated",
        description: "The online store product has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteOnlineStoreProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("online_store_products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["online-store-products"] });
      toast({
        title: "Product removed",
        description: "The product has been removed from the online store.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
