import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Crown } from "lucide-react";

const BestSellers = () => {
  const { data: products, isLoading } = useProducts({ featured: true, limit: 4 });

  if (isLoading) {
    return (
      <section className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-gold/60 font-display tracking-widest text-xs mt-4">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-32 bg-secondary/30 relative">
      {/* Decorative corners */}
      <div className="absolute top-8 left-8 text-gold/15 text-3xl hidden lg:block">✦</div>
      <div className="absolute top-8 right-8 text-gold/15 text-3xl hidden lg:block">✦</div>
      
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/50" />
            <Crown className="h-5 w-5 text-gold" />
            <p className="text-overline">Customer Favorites</p>
            <Crown className="h-5 w-5 text-gold" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/50" />
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-medium gold-underline inline-block pb-4 tracking-wider">
            Best Sellers
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 stagger-children">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                discountPrice: product.discount_price,
                image: product.images?.[0] || "/placeholder.svg",
                category: product.category?.name || "",
                stockQuantity: product.stock_quantity,
              }} 
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/products" className="btn-hero-outline">
            <span className="mr-2">✧</span>
            Shop All Best Sellers
            <span className="ml-2">✧</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
