import { useEffect, useRef } from "react";
import { Crown } from "lucide-react";

const offers = [
  "✧ Free Shipping on Orders Above ₹999",
  "✧ Use Code NOOR15 for 15% Off",
  "✧ Handcrafted with Love from Punjab",
  "✧ Authentic Pakistani & Indian Designs",
  "✧ Easy 7-Day Returns",
  "✧ Secure Payment Options",
];

const OfferMarquee = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let position = 0;

    const animate = () => {
      position -= 0.5;
      if (position <= -container.scrollWidth / 2) {
        position = 0;
      }
      container.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full bg-maroon border-b border-gold/30 overflow-hidden relative">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-maroon-dark via-maroon to-maroon-dark opacity-50" />
      
      <div className="relative py-2.5">
        <div 
          ref={containerRef}
          className="flex whitespace-nowrap will-change-transform"
          style={{ width: 'max-content' }}
        >
          {[...offers, ...offers, ...offers].map((offer, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-4 px-8 text-sm font-display tracking-[0.15em] text-cream/90"
            >
              {offer}
              <Crown className="h-3 w-3 text-gold" />
            </span>
          ))}
        </div>
      </div>
      
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-maroon to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-maroon to-transparent z-10" />
    </div>
  );
};

export default OfferMarquee;
