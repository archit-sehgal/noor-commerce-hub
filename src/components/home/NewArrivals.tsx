import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useStorefrontProducts } from "@/hooks/useStorefrontProducts";
import { Loader2, Sparkles } from "lucide-react";

const NewArrivals = () => {
  const { data: products, isLoading } = useStorefrontProducts({ limit: 4 });

  if (isLoading) {
    return (
      <section className="py-20 lg:py-32 bg-background">
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
    <section className="py-12 lg:py-16 bg-background relative">
      {/* Decorative corner ornaments */}
      <div className="absolute top-6 left-6 text-gold/20 text-xl hidden lg:block">✧</div>
      <div className="absolute top-6 right-6 text-gold/20 text-xl hidden lg:block">✧</div>
      
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <p className="text-overline text-xs">Just Landed</p>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium tracking-wider">
              New Arrivals
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-gold to-transparent mt-3" />
          </div>
          <Link
            to="/products"
            className="text-xs font-display tracking-[0.2em] text-gold hover:text-gold-light transition-colors flex items-center gap-2 group uppercase"
          >
            View All
            <svg
              className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 stagger-children">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{
                id: product.id,
                inventoryId: product.product_id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                discountPrice: product.discount_price,
                image: product.images?.[0] || "/placeholder.svg",
                category: product.category?.name || "",
                isNew: true,
                stockQuantity: product.stock_quantity,
                sizes: product.sizes,
                colors: product.colors,
              }} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
