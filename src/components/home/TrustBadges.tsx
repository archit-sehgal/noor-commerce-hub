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
    <section className="py-16 bg-background border-y border-gold/20 relative">
      {/* Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {badges.map((badge, index) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 border border-gold/30 bg-secondary/50 flex items-center justify-center mb-4 group-hover:border-gold group-hover:shadow-gold transition-all duration-300">
                <badge.icon className="h-6 w-6 text-gold/70 group-hover:text-gold transition-colors" />
              </div>
              <h4 className="font-display text-xs tracking-wider mb-1 uppercase">{badge.title}</h4>
              <p className="text-xs text-muted-foreground font-body">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  );
};

export default TrustBadges;
