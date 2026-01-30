import { Truck, Shield, RotateCcw, Headphones, CreditCard, Award } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "100% protected checkout",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help",
  },
  {
    icon: CreditCard,
    title: "COD Available",
    description: "Pay on delivery",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description: "Handpicked products",
  },
];

const TrustBadges = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-cream-dark">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {badges.map((badge, index) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-rose-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-gold transition-all duration-300">
                <badge.icon className="h-6 w-6 text-gold group-hover:text-rose-gold transition-colors" />
              </div>
              <h4 className="font-accent text-sm font-medium mb-1">{badge.title}</h4>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
