import { Truck, RefreshCw, Shield, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team",
  },
];

const FeatureBanner = () => {
  return (
    <section className="py-12 border-y border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-medium text-sm lg:text-base">{feature.title}</h3>
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
