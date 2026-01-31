import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { useSounds } from "@/hooks/useSounds";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPrice: number | null;
  image: string;
  category: string;
  isNew?: boolean;
  stockQuantity?: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const { playAddToCart } = useSounds();
  
  const hasDiscount = product.discountPrice !== null;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;

  const imageUrl = imageError || !product.image || product.image === "/placeholder.svg" 
    ? "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=600&fit=crop" 
    : product.image;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isOutOfStock) {
      addToCart.mutate({ productId: product.id, quantity: 1 });
      playAddToCart();
    }
  };

  return (
    <div className="group">
      {/* Antique Mirror Frame Container */}
      <Link 
        to={`/product/${product.slug}`} 
        className="block antique-frame antique-corners relative overflow-hidden mb-4 md:mb-5"
      >
        {/* Inner image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-110 ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
            onError={() => setImageError(true)}
            loading="lazy"
          />
          
          {/* Elegant overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Badge variant="secondary" className="bg-maroon text-cream font-display tracking-widest text-xs px-4 py-2 border border-gold/30">
                Sold Out
              </Badge>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 md:top-4 left-3 md:left-4 flex flex-col gap-2">
            {product.isNew && (
              <span className="flex items-center gap-1 px-3 py-1.5 text-[9px] md:text-[10px] font-display tracking-[0.2em] uppercase bg-emerald text-cream border border-gold/30">
                <Sparkles className="h-3 w-3" />
                New
              </span>
            )}
            {hasDiscount && (
              <span className="px-3 py-1.5 text-[9px] md:text-[10px] font-display tracking-[0.2em] uppercase bg-maroon text-cream border border-gold/30">
                {discountPercentage}% Off
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 md:top-4 right-3 md:right-4 h-9 w-9 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold hover:text-background border border-gold/30"
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Quick Add */}
          {!isOutOfStock && user && (
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <Button 
                onClick={handleQuickAdd}
                disabled={addToCart.isPending}
                className="w-full gap-2 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 h-11 md:h-12 font-display tracking-[0.15em] text-[10px] md:text-xs uppercase shadow-gold"
              >
                <ShoppingBag className="h-4 w-4" />
                Quick Add
              </Button>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-2 md:space-y-3 text-center px-2">
        <p className="text-[9px] md:text-[10px] font-display text-gold uppercase tracking-[0.35em]">
          {product.category}
        </p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-heading text-base md:text-lg lg:text-xl font-medium hover:text-gold transition-colors duration-300 line-clamp-2 text-foreground">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-3 pt-1">
          {hasDiscount ? (
            <>
              <span className="font-display text-lg md:text-xl text-gold tracking-wide">
                ₹{product.discountPrice?.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-display text-lg md:text-xl text-foreground tracking-wide">
              ₹{product.price.toLocaleString()}
            </span>
          )}
        </div>
        
        {/* Decorative line */}
        <div className="flex justify-center pt-2">
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
