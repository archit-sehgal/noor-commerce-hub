import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useStorefrontProduct } from "@/hooks/useStorefrontProducts";
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

// Color name to CSS color mapping
const colorMap: Record<string, string> = {
  // Reds
  "red": "#DC2626",
  "maroon": "#800000",
  "crimson": "#DC143C",
  "burgundy": "#722F37",
  "wine": "#722F37",
  "cherry": "#DE3163",
  "rose": "#FF007F",
  "coral": "#FF7F50",
  "salmon": "#FA8072",
  "rust": "#B7410E",
  // Pinks
  "pink": "#EC4899",
  "hot pink": "#FF69B4",
  "magenta": "#FF00FF",
  "fuchsia": "#FF00FF",
  "blush": "#DE5D83",
  "peach": "#FFCBA4",
  // Oranges
  "orange": "#F97316",
  "tangerine": "#FF9966",
  "burnt orange": "#CC5500",
  "terracotta": "#E2725B",
  // Yellows
  "yellow": "#EAB308",
  "gold": "#FFD700",
  "golden": "#FFD700",
  "mustard": "#FFDB58",
  "cream": "#FFFDD0",
  "beige": "#F5F5DC",
  "ivory": "#FFFFF0",
  "champagne": "#F7E7CE",
  // Greens
  "green": "#22C55E",
  "emerald": "#50C878",
  "olive": "#808000",
  "forest green": "#228B22",
  "mint": "#98FF98",
  "sage": "#9DC183",
  "teal": "#008080",
  "turquoise": "#40E0D0",
  "aqua": "#00FFFF",
  "lime": "#32CD32",
  // Blues
  "blue": "#3B82F6",
  "navy": "#000080",
  "navy blue": "#000080",
  "royal blue": "#4169E1",
  "sky blue": "#87CEEB",
  "baby blue": "#89CFF0",
  "cobalt": "#0047AB",
  "indigo": "#4B0082",
  "powder blue": "#B0E0E6",
  "midnight blue": "#191970",
  "cyan": "#00FFFF",
  // Purples
  "purple": "#A855F7",
  "violet": "#8B5CF6",
  "lavender": "#E6E6FA",
  "lilac": "#C8A2C8",
  "plum": "#DDA0DD",
  "mauve": "#E0B0FF",
  "orchid": "#DA70D6",
  "grape": "#6F2DA8",
  // Browns
  "brown": "#92400E",
  "chocolate": "#7B3F00",
  "coffee": "#6F4E37",
  "tan": "#D2B48C",
  "camel": "#C19A6B",
  "khaki": "#C3B091",
  "taupe": "#483C32",
  "mocha": "#967969",
  "sand": "#C2B280",
  "bronze": "#CD7F32",
  "copper": "#B87333",
  // Neutrals
  "white": "#FFFFFF",
  "off-white": "#FAF9F6",
  "black": "#1a1a1a",
  "grey": "#6B7280",
  "gray": "#6B7280",
  "charcoal": "#36454F",
  "silver": "#C0C0C0",
  "slate": "#708090",
  // Multi/Special
  "multi": "linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D, #95E1D3)",
  "multicolor": "linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D, #95E1D3)",
  "rainbow": "linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)",
};

const getColorStyle = (colorName: string): React.CSSProperties => {
  const normalizedName = colorName.toLowerCase().trim();
  const colorValue = colorMap[normalizedName];
  
  if (colorValue) {
    if (colorValue.includes("gradient")) {
      return { background: colorValue };
    }
    return { backgroundColor: colorValue };
  }
  
  // Try to use the color name directly as CSS color
  return { backgroundColor: colorName.toLowerCase() };
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useStorefrontProduct(slug || "");
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
      productId: product.product_id, // Use inventory product ID for cart
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
              </div>
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

              {/* Color Selection - Color Swatches */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="text-sm font-display mb-4 block tracking-widest uppercase text-foreground/80">
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="relative group flex flex-col items-center gap-2 transition-all duration-300"
                      >
                        <div
                          className={`w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-md ${
                            selectedColor === color
                              ? "border-gold ring-2 ring-gold ring-offset-2 ring-offset-background scale-110"
                              : "border-gold/30 hover:border-gold/60 hover:scale-105"
                          }`}
                          style={getColorStyle(color)}
                        />
                        <span className={`text-xs font-display tracking-wider capitalize ${
                          selectedColor === color ? "text-gold" : "text-muted-foreground"
                        }`}>
                          {color}
                        </span>
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
                <div className="flex items-center">
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
                  {product.category && (
                    <div className="flex justify-between py-2 border-b border-gold/10">
                      <span className="text-muted-foreground">Category</span>
                      <span className="text-foreground font-medium">{product.category.name}</span>
                    </div>
                  )}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gold/10">
                      <span className="text-muted-foreground">Available Sizes</span>
                      <span className="text-foreground font-medium">{product.sizes.join(", ")}</span>
                    </div>
                  )}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gold/10">
                      <span className="text-muted-foreground">Available Colors</span>
                      <span className="text-foreground font-medium">{product.colors.join(", ")}</span>
                    </div>
                  )}
                </div>
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
