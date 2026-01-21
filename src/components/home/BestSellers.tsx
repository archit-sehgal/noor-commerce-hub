import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";

const BestSellers = () => {
  const { data: products, isLoading } = useProducts({ featured: true, limit: 4 });

  if (isLoading) {
    return (
      <section className="py-20 lg:py-32 bg-secondary/30">
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
    <section className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-overline mb-4">Customer Favorites</p>
          <h2 className="font-display text-4xl lg:text-5xl font-light gold-underline inline-block pb-4">
            Best Sellers
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 stagger-children">
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
              }} 
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/products" className="btn-hero-outline">
            Shop All Best Sellers
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
