import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import kurtiImage from "@/assets/category-kurti.jpg";
import sareeImage from "@/assets/category-saree.jpg";
import suitImage from "@/assets/category-suit.jpg";

const categories = [
  {
    name: "Kurtis",
    description: "Casual elegance",
    image: kurtiImage,
    href: "/category/kurtis",
  },
  {
    name: "Sarees",
    description: "Timeless grace",
    image: sareeImage,
    href: "/category/sarees",
  },
  {
    name: "Suits",
    description: "Festive grandeur",
    image: suitImage,
    href: "/category/suits",
  },
];

const FeaturedCategories = () => {
  return (
    <section className="py-12 lg:py-20 bg-secondary/30 relative">
      {/* Decorative corners */}
      <div className="absolute top-6 left-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      <div className="absolute top-6 right-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      <div className="absolute bottom-6 left-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      <div className="absolute bottom-6 right-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/50" />
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <p className="text-overline text-xs">Our Collections</p>
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/50" />
          </div>
          <h2 className="font-display text-2xl lg:text-4xl font-medium tracking-wider gold-underline pb-4">
            Shop by Category
          </h2>
        </div>

        {/* Categories Grid - Antique Frame Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.href}
              className="group relative antique-frame"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                  <p className="text-[10px] font-display text-gold tracking-[0.35em] uppercase mb-2">
                    {category.description}
                  </p>
                  <h3 className="font-display text-xl lg:text-2xl text-foreground mb-2 tracking-wider">
                    {category.name}
                  </h3>
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

                {/* Shimmer effect on hover */}
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
      </div>
    </section>
  );
};

export default FeaturedCategories;
