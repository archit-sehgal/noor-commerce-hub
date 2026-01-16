import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-fashion.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 lg:pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Noor Creations - Premium Ethnic Wear"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <p className="text-overline mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            New Collection 2024
          </p>
          <h1 
            className="font-display text-5xl md:text-6xl lg:text-7xl font-light leading-tight mb-6 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Elegance<br />
            <span className="italic">Redefined</span>
          </h1>
          <p 
            className="text-lg text-muted-foreground mb-10 max-w-md animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            Discover our exquisite collection of handcrafted ethnic wear, 
            where tradition meets contemporary design.
          </p>
          <div 
            className="flex flex-wrap gap-4 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <Link to="/collections" className="btn-hero">
              Explore Collection
            </Link>
            <Link to="/new-arrivals" className="btn-hero-outline">
              New Arrivals
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-foreground/50" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
