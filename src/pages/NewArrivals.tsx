import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import ProductCard from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import heroProducts from "@/assets/hero-products.jpg";

const NewArrivals = () => {
  const { data: products, isLoading } = useProducts({ limit: 5 });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <PageHero
        title="New Arrivals"
        subtitle="Discover our latest additions to the collection"
        image={heroProducts}
        overlay="gradient"
        height="50vh"
      />

      <main className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/50" />
              <Sparkles className="h-4 w-4 text-gold" />
              <p className="text-overline text-xs">Just Landed</p>
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/50" />
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium tracking-wider">
              Latest Treasures
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <p className="text-gold/60 font-display tracking-widest text-xs mt-4">Loading...</p>
            </div>
          ) : products && products.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-8 text-center font-display tracking-wider">
                Showing our {products.length} newest arrivals
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      price: product.price,
                      discountPrice: product.discount_price || null,
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
              
              {/* CTA */}
              <div className="text-center mt-12">
                <Link to="/products" className="btn-hero-outline text-sm">
                  <span className="mr-2">✧</span>
                  View All Products
                  <span className="ml-2">✧</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4 font-heading">
                No new arrivals at the moment
              </p>
              <Link to="/products" className="btn-hero-outline text-sm">
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewArrivals;
