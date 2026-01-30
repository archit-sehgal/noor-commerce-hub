import { useEffect, useRef } from "react";

const offers = [
  "🎉 FLAT 30% OFF on First Purchase",
  "✨ Free Shipping on Orders Above ₹999",
  "🔥 Limited Time: Buy 2 Get 1 Free on Kurtis",
  "💝 Extra 10% Off with Code: NOOR10",
  "🛍️ New Collection Just Dropped!",
  "⭐ Premium Quality Guaranteed",
];

const OfferMarquee = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let position = 0;

    const animate = () => {
      position -= 1;
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
    <div className="w-full bg-gradient-to-r from-charcoal via-charcoal-light to-charcoal overflow-hidden py-3">
      <div 
        ref={containerRef}
        className="flex whitespace-nowrap will-change-transform"
        style={{ width: 'max-content' }}
      >
        {[...offers, ...offers, ...offers].map((offer, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-8 px-8 text-sm font-accent text-cream/90 tracking-wider"
          >
            {offer}
            <span className="text-gold">•</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default OfferMarquee;
