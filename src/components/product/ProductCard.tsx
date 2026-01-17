import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  image: string;
  category: string;
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const hasDiscount = product.discountPrice !== null;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <div className="group">
      {/* Image Container */}
      <Link 
        to={`/product/${product.id}`} 
        className="block relative aspect-[3/4] overflow-hidden bg-secondary mb-5 img-zoom"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-500" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isNew && (
            <span className="px-3 py-1.5 text-[10px] font-accent tracking-[0.2em] uppercase bg-charcoal text-cream">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="px-3 py-1.5 text-[10px] font-accent tracking-[0.2em] uppercase bg-burgundy text-cream">
              {discountPercentage}% Off
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-10 w-10 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background rounded-none border border-border"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <Button className="w-full gap-2 bg-charcoal hover:bg-gold text-cream rounded-none h-12 font-accent tracking-wider text-xs uppercase">
            <ShoppingBag className="h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-2 text-center px-2">
        <p className="text-[10px] font-accent text-gold uppercase tracking-[0.25em]">
          {product.category}
        </p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-heading text-base lg:text-lg font-medium hover:text-gold transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-3 pt-1">
          {hasDiscount ? (
            <>
              <span className="font-heading text-lg text-gold">
                ₹{product.discountPrice?.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-heading text-lg">₹{product.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
