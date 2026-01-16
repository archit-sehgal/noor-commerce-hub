import ProductCard from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import productPalazzo from "@/assets/product-palazzo.jpg";
import productSaree from "@/assets/product-saree.jpg";
import productKurti from "@/assets/product-kurti.jpg";
import productAnarkali from "@/assets/product-anarkali.jpg";

// Sample products data
const bestSellers = [
  {
    id: "5",
    name: "Royal Blue Anarkali Set",
    price: 6999,
    discountPrice: 5499,
    image: productPalazzo,
    category: "Suits",
  },
  {
    id: "6",
    name: "Pure Georgette Saree",
    price: 4999,
    discountPrice: null,
    image: productSaree,
    category: "Sarees",
  },
  {
    id: "7",
    name: "Designer Palazzo Set",
    price: 3499,
    discountPrice: 2799,
    image: productKurti,
    category: "Kurtis",
  },
  {
    id: "8",
    name: "Wedding Anarkali",
    price: 15999,
    discountPrice: null,
    image: productAnarkali,
    category: "Suits",
  },
];

const BestSellers = () => {
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
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/best-sellers" className="btn-hero-outline">
            Shop All Best Sellers
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
