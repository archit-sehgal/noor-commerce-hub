import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import { useCategories } from "@/hooks/useCategories";
import { Sparkles, Crown, Star } from "lucide-react";
import heroProducts from "@/assets/hero-products.jpg";
import kurtiImage from "@/assets/category-kurti.jpg";
import sareeImage from "@/assets/category-saree.jpg";
import suitImage from "@/assets/category-suit.jpg";

// Fallback images for categories
const categoryImages: Record<string, string> = {
  kurtis: kurtiImage,
  sarees: sareeImage,
  suits: suitImage,
};

const Collections = () => {
  const { data: categories, isLoading } = useCategories();

  // Static collection for Best Sellers
  const staticCollections = [
    {
      name: "Best Sellers",
      description: "Customer favorites",
      slug: "products?featured=true",
      image: heroProducts,
      isStatic: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <PageHero
        title="Collections"
        subtitle="Explore our curated collections of ethnic elegance"
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
              <Crown className="h-4 w-4 text-gold" />
              <p className="text-overline text-xs">Shop By Category</p>
              <Crown className="h-4 w-4 text-gold" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/50" />
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium tracking-wider">
              Our Collections
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <p className="text-gold/60 font-display tracking-widest text-xs mt-4">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Dynamic Categories */}
              {categories?.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group relative antique-frame"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={category.image_url || categoryImages[category.slug] || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3 w-3 text-gold" />
                        <p className="text-[10px] font-display text-gold tracking-[0.35em] uppercase">
                          Collection
                        </p>
                      </div>
                      <h3 className="font-display text-2xl lg:text-3xl text-foreground mb-3 tracking-wider">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-gold text-sm font-display tracking-[0.2em] uppercase group-hover:text-gold-light transition-colors duration-300">
                        <span>Explore</span>
                        <svg
                          className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300"
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
                      </div>
                    </div>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </div>
                  
                  {/* Corner ornaments */}
                  <div className="absolute top-2 left-2 text-gold/50 text-xs">✧</div>
                  <div className="absolute top-2 right-2 text-gold/50 text-xs">✧</div>
                  <div className="absolute bottom-2 left-2 text-gold/50 text-xs">✧</div>
                  <div className="absolute bottom-2 right-2 text-gold/50 text-xs">✧</div>
                </Link>
              ))}

              {/* Best Sellers Static Collection */}
              {staticCollections.map((collection, index) => (
                <Link
                  key={collection.slug}
                  to={`/${collection.slug}`}
                  className="group relative antique-frame"
                  style={{ animationDelay: `${(categories?.length || 0 + index) * 0.1}s` }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    
                    {/* Best Seller Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-gold/90 text-background px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-display tracking-wider">Featured</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-3 w-3 text-gold" />
                        <p className="text-[10px] font-display text-gold tracking-[0.35em] uppercase">
                          {collection.description}
                        </p>
                      </div>
                      <h3 className="font-display text-2xl lg:text-3xl text-foreground mb-3 tracking-wider">
                        {collection.name}
                      </h3>
                      <div className="flex items-center gap-3 text-gold text-sm font-display tracking-[0.2em] uppercase group-hover:text-gold-light transition-colors duration-300">
                        <span>Shop Now</span>
                        <svg
                          className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300"
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
                      </div>
                    </div>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </div>
                  
                  {/* Corner ornaments */}
                  <div className="absolute top-2 left-2 text-gold/50 text-xs">✧</div>
                  <div className="absolute top-2 right-2 text-gold/50 text-xs">✧</div>
                  <div className="absolute bottom-2 left-2 text-gold/50 text-xs">✧</div>
                  <div className="absolute bottom-2 right-2 text-gold/50 text-xs">✧</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Collections;
