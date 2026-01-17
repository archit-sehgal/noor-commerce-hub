import { Link } from "react-router-dom";
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
    <section className="py-24 lg:py-40 bg-gradient-cream">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold" />
            <p className="text-overline">Our Collections</p>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <h2 className="font-display text-4xl lg:text-6xl font-normal gold-underline pb-6">
            Shop by Category
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.href}
              className="group relative aspect-[3/4] overflow-hidden img-zoom card-hover"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                <p className="text-xs font-accent text-gold tracking-[0.3em] uppercase mb-3">
                  {category.description}
                </p>
                <h3 className="font-display text-3xl lg:text-4xl text-cream mb-4">
                  {category.name}
                </h3>
                <div className="flex items-center gap-3 text-cream/80 text-sm font-accent tracking-wider uppercase group-hover:text-gold transition-colors duration-300">
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

              {/* Decorative border */}
              <div className="absolute inset-4 border border-cream/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
