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
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-32 left-8 w-px h-32 bg-gradient-to-b from-transparent via-rose-gold to-transparent opacity-40 hidden lg:block" />
      <div className="absolute bottom-32 right-8 w-px h-32 bg-gradient-to-b from-transparent via-rose-gold to-transparent opacity-40 hidden lg:block" />

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="w-12 h-px bg-rose-gold" />
            <p className="text-overline">New Collection 2024</p>
          </div>
          <h1 
            className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[1.1] mb-8 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Timeless<br />
            <span className="italic font-light text-rose-gold">Elegance</span>
          </h1>
          <p 
            className="text-lg lg:text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed font-body animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            Discover our exquisite collection of handcrafted ethnic wear, 
            where centuries of tradition meet contemporary artistry.
          </p>
          <div 
            className="flex flex-wrap gap-6 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <Link to="/products" className="btn-hero">
              Explore Collection
            </Link>
            <Link to="/new-arrivals" className="btn-hero-outline">
              New Arrivals
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  );
};

export default HeroSection;
