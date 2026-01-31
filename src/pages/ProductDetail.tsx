import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { useSounds } from "@/hooks/useSounds";
import {
  Minus,
  Plus,
  Heart,
  Share2,
  Truck,
  RotateCcw,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Sparkles,
  Award,
} from "lucide-react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug || "");
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const { playAddToCart } = useSounds();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 lg:px-8 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <p className="text-gold font-display tracking-widest text-sm">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 lg:px-8 text-center py-16">
            <Crown className="h-16 w-16 text-gold/40 mx-auto mb-6" />
            <h1 className="text-3xl font-display mb-4 tracking-wider">Product Not Found</h1>
            <p className="text-muted-foreground mb-8 font-body">
              The treasure you seek doesn't exist or has been claimed.
            </p>
            <Link to="/products">
              <Button className="btn-hero">Browse Collection</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const processedImages = product.images?.filter(img => img && img !== "/placeholder.svg") || [];
  const images = processedImages.length > 0 ? processedImages : [FALLBACK_IMAGE];
  const currentImageUrl = imageError ? FALLBACK_IMAGE : images[selectedImage];
  
  const currentPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });
    playAddToCart();
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Ornate Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-gold transition-colors">
              Home
            </Link>
            <span className="text-gold/40">✧</span>
            <Link to="/products" className="text-muted-foreground hover:text-gold transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <span className="text-gold/40">✧</span>
                <Link
                  to={`/category/${product.category.slug}`}
                  className="text-muted-foreground hover:text-gold transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span className="text-gold/40">✧</span>
            <span className="text-gold truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Product Images - Antique Mirror Frame */}
            <div className="space-y-6">
              {/* Main Image with ornate frame */}
              <div className="antique-frame relative">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                  <img
                    src={currentImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                  
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-maroon text-cream px-4 py-2 font-display tracking-widest text-sm border border-gold/40">
                      <span className="text-gold">-{discountPercentage}%</span> OFF
                    </div>
                  )}
                  
                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm p-3 border border-gold/40 hover:bg-gold hover:text-background transition-all"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm p-3 border border-gold/40 hover:bg-gold hover:text-background transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Corner ornaments */}
                <div className="absolute top-2 left-2 text-gold text-xs opacity-60">✧</div>
                <div className="absolute top-2 right-2 text-gold text-xs opacity-60">✧</div>
                <div className="absolute bottom-2 left-2 text-gold text-xs opacity-60">✧</div>
                <div className="absolute bottom-2 right-2 text-gold text-xs opacity-60">✧</div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === index
                          ? "border-gold shadow-gold"
                          : "border-gold/20 hover:border-gold/50"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              {/* Header */}
              <div className="border-b border-gold/20 pb-8">
                {product.category && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gold text-sm">✧</span>
                    <p className="text-xs font-display text-gold uppercase tracking-[0.35em]">
                      {product.category.name}
                    </p>
                  </div>
                )}
                <h1 className="text-3xl lg:text-4xl font-display mb-6 tracking-wider text-foreground">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-display text-gold tracking-wide">
                    ₹{currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Stock status */}
                <div className="flex items-center gap-2 mt-4">
                  {product.stock_quantity > 0 ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                      <span className="text-sm text-emerald-light font-body">
                        {product.stock_quantity < 5 ? `Only ${product.stock_quantity} left` : 'In Stock'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-maroon" />
                      <span className="text-sm text-maroon-light font-body">Out of Stock</span>
                    </>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="text-sm font-display mb-4 block tracking-widest uppercase text-foreground/80">
                    Select Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-3 border text-sm font-display tracking-widest transition-all duration-300 ${
                          selectedSize === size
                            ? "border-gold bg-gold text-background"
                            : "border-gold/30 hover:border-gold text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="text-sm font-display mb-4 block tracking-widest uppercase text-foreground/80">
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-3 border text-sm font-body tracking-wide transition-all duration-300 ${
                          selectedColor === color
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-gold/30 hover:border-gold text-foreground"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-sm font-display mb-4 block tracking-widest uppercase text-foreground/80">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gold/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-12 w-12 rounded-none border-r border-gold/30 hover:bg-gold/10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-center font-display text-lg">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                      className="h-12 w-12 rounded-none border-l border-gold/30 hover:bg-gold/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity} pieces available
                  </span>
                </div>
              </div>

              {/* Add to Cart & Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1 h-14 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-sm uppercase shadow-gold"
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending || product.stock_quantity === 0 || !user}
                >
                  {addToCart.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : product.stock_quantity === 0 ? (
                    "Out of Stock"
                  ) : !user ? (
                    "Login to Purchase"
                  ) : (
                    <>
                      <span className="mr-2">✧</span>
                      Add to Cart
                      <span className="ml-2">✧</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 border-gold/40 hover:bg-gold/10 hover:border-gold"
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 border-gold/40 hover:bg-gold/10 hover:border-gold"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Product Features - Ornate Cards */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gold/20">
                <div className="text-center p-4 border border-gold/20 bg-secondary/30">
                  <Truck className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="font-display text-xs tracking-wider text-foreground">Free Shipping</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Orders above ₹999</p>
                </div>
                <div className="text-center p-4 border border-gold/20 bg-secondary/30">
                  <RotateCcw className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="font-display text-xs tracking-wider text-foreground">Easy Returns</p>
                  <p className="text-[10px] text-muted-foreground mt-1">7 Days Policy</p>
                </div>
                <div className="text-center p-4 border border-gold/20 bg-secondary/30">
                  <Shield className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="font-display text-xs tracking-wider text-foreground">Authentic</p>
                  <p className="text-[10px] text-muted-foreground mt-1">100% Genuine</p>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-6 border-t border-gold/20">
                  <h2 className="font-display text-lg mb-4 tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    Product Description
                  </h2>
                  <p className="text-foreground/70 font-body leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="pt-6 border-t border-gold/20 space-y-3">
                <h2 className="font-display text-lg mb-4 tracking-wider flex items-center gap-2">
                  <Award className="h-4 w-4 text-gold" />
                  Product Details
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.sku && (
                    <div className="flex justify-between py-2 border-b border-gold/10">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="text-foreground font-medium">{product.sku}</span>
                    </div>
                  )}
                  {product.fabric_type && (
                    <div className="flex justify-between py-2 border-b border-gold/10">
                      <span className="text-muted-foreground">Fabric</span>
                      <span className="text-foreground font-medium">{product.fabric_type}</span>
                    </div>
                  )}
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {product.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-3 py-1 text-xs bg-secondary border border-gold/20 text-gold font-display tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
