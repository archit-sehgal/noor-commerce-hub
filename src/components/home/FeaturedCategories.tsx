import { Link } from "react-router-dom";
import kurtiImage from "@/assets/category-kurti.jpg";
import sareeImage from "@/assets/category-saree.jpg";
import suitImage from "@/assets/category-suit.jpg";

const categories = [
  {
    name: "Kurtis",
    description: "Casual elegance for everyday",
    image: kurtiImage,
    href: "/category/kurtis",
  },
  {
    name: "Sarees",
    description: "Timeless grace & beauty",
    image: sareeImage,
    href: "/category/sarees",
  },
  {
    name: "Suits",
    description: "Premium festive collection",
    image: suitImage,
    href: "/category/suits",
  },
];

const FeaturedCategories = () => {
  return (
    <section className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-overline mb-4">Our Collections</p>
          <h2 className="font-display text-4xl lg:text-5xl font-light gold-underline inline-block pb-4">
            Shop by Category
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.href}
              className="group relative aspect-[3/4] overflow-hidden img-zoom card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <p className="text-sm text-gold mb-2 font-medium tracking-wide">
                  {category.description}
                </p>
                <h3 className="font-display text-3xl lg:text-4xl text-primary-foreground">
                  {category.name}
                </h3>
                <div className="mt-4 flex items-center gap-2 text-primary-foreground/80 text-sm font-medium tracking-wide group-hover:text-gold transition-colors">
                  <span>Shop Now</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-2 transition-transform"
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
