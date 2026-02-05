import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    price: number;
    discount_price: number | null;
    images: string[];
    stock_quantity: number;
  };
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export const useCart = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (cartError) {
        if (cartError.code === "PGRST116") {
          return null;
        }
        throw cartError;
      }

      const { data: items, error: itemsError } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(id, name, slug, sku, price, discount_price, images, stock_quantity)
        `)
        .eq("cart_id", cart.id);

      if (itemsError) throw itemsError;

      return {
        ...cart,
        items: items || [],
      } as Cart;
    },
    enabled: !!user,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
      size,
      color,
    }: {
      productId: string;
      quantity?: number;
      size?: string;
      color?: string;
    }) => {
      if (!user) throw new Error("Please login to add items to cart");

      // Get or create cart
      let { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cartError && cartError.code === "PGRST116") {
        const { data: newCart, error: createError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();

        if (createError) throw createError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart!.id)
        .eq("product_id", productId)
        .eq("size", size || "")
        .eq("color", color || "")
        .single();

      if (existingItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Add new item
        const { error: insertError } = await supabase.from("cart_items").insert({
          cart_id: cart!.id,
          product_id: productId,
          quantity,
          size: size || null,
          color: color || null,
        });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cart) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cart.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
