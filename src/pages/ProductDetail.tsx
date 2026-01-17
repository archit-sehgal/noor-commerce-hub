import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug || "");
  const { user } = useAuth();
  const addToCart = useAddToCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8 flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8 text-center py-16">
            <h1 className="text-2xl font-display mb-4">Product not found</h1>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.svg"];
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
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li className="text-muted-foreground">/</li>
              <li>
                <Link
                  to="/products"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Products
                </Link>
              </li>
              {product.category && (
                <>
                  <li className="text-muted-foreground">/</li>
                  <li>
                    <Link
                      to={`/category/${product.category.slug}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {product.category.name}
                    </Link>
                  </li>
                </>
              )}
              <li className="text-muted-foreground">/</li>
              <li className="text-foreground truncate max-w-[200px]">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[3/4] bg-cream rounded-lg overflow-hidden">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 text-sm font-medium rounded">
                    -{discountPercentage}%
                  </span>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? "border-gold"
                          : "border-transparent"
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
            <div className="space-y-6">
              <div>
                {product.category && (
                  <p className="text-sm text-gold mb-2">{product.category.name}</p>
                )}
                <h1 className="text-2xl lg:text-3xl font-display mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold">
                    ₹{currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md transition-colors ${
                          selectedSize === size
                            ? "border-charcoal bg-charcoal text-cream"
                            : "border-border hover:border-charcoal"
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
                  <label className="text-sm font-medium mb-3 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border rounded-md transition-colors ${
                          selectedColor === color
                            ? "border-charcoal bg-charcoal text-cream"
                            : "border-border hover:border-charcoal"
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
                <label className="text-sm font-medium mb-3 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stock_quantity, q + 1)
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity} available
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-charcoal hover:bg-charcoal/90 text-cream h-12"
                  onClick={handleAddToCart}
                  disabled={
                    addToCart.isPending ||
                    product.stock_quantity === 0 ||
                    !user
                  }
                >
                  {addToCart.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : product.stock_quantity === 0 ? (
                    "Out of Stock"
                  ) : !user ? (
                    "Login to Add to Cart"
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Product Features */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-medium">Free Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      On orders above ₹999
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-medium">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">
                      7 days return policy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-medium">Quality Assured</p>
                    <p className="text-sm text-muted-foreground">
                      100% authentic products
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t pt-6">
                  <h2 className="font-medium mb-3">Product Description</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="border-t pt-6 space-y-2 text-sm">
                {product.sku && (
                  <p>
                    <span className="text-muted-foreground">SKU:</span>{" "}
                    {product.sku}
                  </p>
                )}
                {product.fabric_type && (
                  <p>
                    <span className="text-muted-foreground">Fabric:</span>{" "}
                    {product.fabric_type}
                  </p>
                )}
                {product.tags && product.tags.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Tags:</span>{" "}
                    {product.tags.join(", ")}
                  </p>
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
