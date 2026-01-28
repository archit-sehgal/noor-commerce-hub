import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";

const NewArrivals = () => {
  const { data: products, isLoading } = useProducts({ limit: 4 });

  if (isLoading) {
    return (
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-overline mb-4">Just Landed</p>
            <h2 className="font-display text-4xl lg:text-5xl font-light">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium tracking-wide text-muted-foreground hover:text-gold transition-colors flex items-center gap-2 group"
          >
            View All
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-8 stagger-children">
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
