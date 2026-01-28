import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const hasDiscount = product.discountPrice !== null;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;

  const imageUrl = imageError || !product.image || product.image === "/placeholder.svg" 
    ? "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=600&fit=crop" 
    : product.image;

  return (
    <div className="group">
      {/* Image Container */}
      <Link 
        to={`/product/${product.slug}`} 
        className="block relative aspect-[3/4] overflow-hidden bg-secondary mb-4 md:mb-5 rounded-sm"
      >
        <img
          src={imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isOutOfStock ? "opacity-60" : ""}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-500" />
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/40">
            <Badge variant="secondary" className="bg-background text-foreground font-semibold">
              Out of Stock
            </Badge>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 md:top-4 left-3 md:left-4 flex flex-col gap-2">
          {product.isNew && (
            <span className="px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-accent tracking-[0.2em] uppercase bg-charcoal text-cream">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-accent tracking-[0.2em] uppercase bg-burgundy text-cream">
              {discountPercentage}% Off
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 md:top-4 right-3 md:right-4 h-8 w-8 md:h-10 md:w-10 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background rounded-none border border-border"
        >
          <Heart className="h-3 w-3 md:h-4 md:w-4" />
        </Button>

        {/* Quick Add */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <Button className="w-full gap-2 bg-charcoal hover:bg-gold text-cream rounded-none h-10 md:h-12 font-accent tracking-wider text-[10px] md:text-xs uppercase">
              <ShoppingBag className="h-3 w-3 md:h-4 md:w-4" />
              Quick Add
            </Button>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="space-y-1 md:space-y-2 text-center px-1 md:px-2">
        <p className="text-[9px] md:text-[10px] font-accent text-gold uppercase tracking-[0.25em]">
          {product.category}
        </p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-heading text-sm md:text-base lg:text-lg font-medium hover:text-gold transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-2 md:gap-3 pt-1">
          {hasDiscount ? (
            <>
              <span className="font-heading text-base md:text-lg text-gold">
                ₹{product.discountPrice?.toLocaleString()}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-heading text-base md:text-lg">₹{product.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
