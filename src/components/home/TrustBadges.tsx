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
    <section className="py-10 bg-background border-y border-gold/20 relative">
      {/* Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 lg:gap-6">
          {badges.map((badge, index) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-10 h-10 border border-gold/30 bg-secondary/50 flex items-center justify-center mb-2 group-hover:border-gold group-hover:shadow-gold transition-all duration-300">
                <badge.icon className="h-4 w-4 text-gold/70 group-hover:text-gold transition-colors" />
              </div>
              <h4 className="font-display text-[10px] tracking-wider mb-0.5 uppercase">{badge.title}</h4>
              <p className="text-[10px] text-muted-foreground font-body hidden md:block">{badge.description}</p>
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
