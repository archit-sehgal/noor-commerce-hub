import { Truck, RefreshCw, Shield, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Complimentary Shipping",
    description: "On orders above ₹2,999",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "7-day hassle-free returns",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% encrypted checkout",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "Personalized assistance",
  },
];

const FeatureBanner = () => {
  return (
    <section className="py-16 lg:py-20 border-y border-border bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-full bg-background border border-gold/30 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-heading text-sm lg:text-base font-medium tracking-wide mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureBanner;
