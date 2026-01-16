import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import productAnarkali from "@/assets/product-anarkali.jpg";
import productSaree from "@/assets/product-saree.jpg";
import productKurti from "@/assets/product-kurti.jpg";
import productPalazzo from "@/assets/product-palazzo.jpg";

// Sample products data (will be replaced with real data from database)
const newArrivals = [
  {
    id: "1",
    name: "Chanderi Silk Kurti",
    price: 2499,
    discountPrice: 1999,
    image: productKurti,
    category: "Kurtis",
    isNew: true,
  },
  {
    id: "2",
    name: "Banarasi Silk Saree",
    price: 8999,
    discountPrice: null,
    image: productSaree,
    category: "Sarees",
    isNew: true,
  },
  {
    id: "3",
    name: "Embroidered Anarkali",
    price: 5499,
    discountPrice: 4499,
    image: productAnarkali,
    category: "Suits",
    isNew: true,
  },
  {
    id: "4",
    name: "Royal Palazzo Set",
    price: 4299,
    discountPrice: null,
    image: productPalazzo,
    category: "Suits",
    isNew: true,
  },
];

const NewArrivals = () => {
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
            to="/new-arrivals"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 stagger-children">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
