import { Star, Quote, Crown } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Delhi",
    rating: 5,
    text: "Absolutely stunning collection! The quality exceeded my expectations. The Pakistani suit I ordered was beautifully crafted with such attention to detail.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    name: "Gurpreet Kaur",
    location: "Ludhiana",
    rating: 5,
    text: "Being from Punjab, I appreciate authentic craftsmanship. Noor Creations delivers exactly that - traditional elegance with modern sensibility. A royal experience!",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    name: "Fatima Khan",
    location: "Mumbai",
    rating: 5,
    text: "The festive collection is gorgeous! Received so many compliments on my Anarkali. The fabric quality and embroidery are premium. True heritage pieces.",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
  },
];

const Testimonials = () => {
  return (
    <section className="py-12 lg:py-16 bg-secondary/30 relative overflow-hidden">
      {/* Decorative corners */}
      <div className="absolute top-6 left-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      <div className="absolute top-6 right-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      <div className="absolute bottom-6 left-6 text-gold/10 text-2xl hidden lg:block">✦</div>
      <div className="absolute bottom-6 right-6 text-gold/10 text-2xl hidden lg:block">✦</div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/50" />
            <Crown className="h-3.5 w-3.5 text-gold" />
            <p className="text-overline text-xs">Royal Reviews</p>
            <Crown className="h-3.5 w-3.5 text-gold" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/50" />
          </div>
          <h2 className="font-display text-2xl lg:text-3xl gold-underline pb-4 tracking-wider">
            What Our Patrons Say
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="border border-gold/20 bg-background p-5 relative group hover:border-gold/40 transition-all duration-500"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Corner ornaments */}
              <div className="absolute top-2 left-2 text-gold/30 text-xs">✧</div>
              <div className="absolute top-2 right-2 text-gold/30 text-xs">✧</div>
              <div className="absolute bottom-2 left-2 text-gold/30 text-xs">✧</div>
              <div className="absolute bottom-2 right-2 text-gold/30 text-xs">✧</div>
              
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 h-8 w-8 text-gold/10 group-hover:text-gold/20 transition-colors" />

              {/* Rating */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground leading-relaxed mb-4 font-accent italic text-sm">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-10 h-10 object-cover border-2 border-gold/30"
                />
                <div>
                  <p className="font-display text-xs tracking-wider">{testimonial.name}</p>
                  <p className="text-xs text-gold font-body">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
