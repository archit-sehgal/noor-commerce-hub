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
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary mb-4 img-zoom">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="px-3 py-1 text-xs font-medium tracking-wide bg-gold text-primary-foreground">
              NEW
            </span>
          )}
          {hasDiscount && (
            <span className="px-3 py-1 text-xs font-medium tracking-wide bg-destructive text-destructive-foreground">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-9 w-9 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button className="w-full gap-2 bg-primary hover:bg-gold text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.category}
        </p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm lg:text-base hover:text-gold transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="font-medium text-gold">
                ₹{product.discountPrice?.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-medium">₹{product.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
