import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Sparkles } from "lucide-react";

const NewArrivals = () => {
  const { data: products, isLoading } = useProducts({ limit: 4 });

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
    <section className="py-20 lg:py-32 bg-background relative">
      {/* Decorative corner ornaments */}
      <div className="absolute top-8 left-8 text-gold/20 text-2xl hidden lg:block">✧</div>
      <div className="absolute top-8 right-8 text-gold/20 text-2xl hidden lg:block">✧</div>
      
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-4 w-4 text-gold" />
              <p className="text-overline">Just Landed</p>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-medium tracking-wider">
              New Arrivals
            </h2>
            <div className="w-20 h-px bg-gradient-to-r from-gold to-transparent mt-4" />
          </div>
          <Link
            to="/products"
            className="text-sm font-display tracking-[0.2em] text-gold hover:text-gold-light transition-colors flex items-center gap-3 group uppercase"
          >
            View All
            <svg
              className="w-4 h-4 transform group-hover:translate-x-2 transition-transform"
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
                isNew: true,
                stockQuantity: product.stock_quantity,
              }} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
