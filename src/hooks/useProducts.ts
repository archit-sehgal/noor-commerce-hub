import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  category_id: string | null;
  price: number;
  discount_price: number | null;
  cost_price: number | null;
  stock_quantity: number;
  min_stock_alert: number | null;
  sizes: string[];
  colors: string[];
  fabric_type: string | null;
  tags: string[];
  images: string[];
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProductInsert {
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  category_id?: string;
  price: number;
  discount_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  min_stock_alert?: number;
  sizes?: string[];
  colors?: string[];
  fabric_type?: string;
  tags?: string[];
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export const useProducts = (options?: { 
  categorySlug?: string; 
  featured?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq("is_active", true)
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
      return data as Product[];
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!slug,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product created",
        description: "The product has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...product
    }: Partial<ProductInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
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

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
