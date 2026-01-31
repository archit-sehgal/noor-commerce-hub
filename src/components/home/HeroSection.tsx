import { Link } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-fashion.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 lg:pt-24 rustic-overlay">
      {/* Background Image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Noor Creations - Premium Pakistani Ethnic Wear"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        
        {/* Antique vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-40" />
      </div>

      {/* Decorative Gold Lines */}
      <div className="absolute top-40 left-8 w-px h-40 bg-gradient-to-b from-transparent via-gold/40 to-transparent hidden lg:block" />
      <div className="absolute top-40 left-12 w-px h-32 bg-gradient-to-b from-transparent via-gold/20 to-transparent hidden lg:block" />
      <div className="absolute bottom-40 right-8 w-px h-40 bg-gradient-to-b from-transparent via-gold/40 to-transparent hidden lg:block" />
      <div className="absolute bottom-40 right-12 w-px h-32 bg-gradient-to-b from-transparent via-gold/20 to-transparent hidden lg:block" />

      {/* Floating ornaments */}
      <div className="absolute top-1/4 right-1/4 text-gold/30 animate-float hidden lg:block">
        <Sparkles className="h-8 w-8" />
      </div>
      <div className="absolute bottom-1/3 left-1/3 text-gold/20 animate-float hidden lg:block" style={{ animationDelay: '2s' }}>
        <Crown className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Ornate overline */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <span className="text-gold text-lg">✧</span>
            <div className="w-16 h-px bg-gradient-to-r from-gold/60 to-transparent" />
            <p className="text-overline">Heritage Collection 2024</p>
            <div className="w-16 h-px bg-gradient-to-l from-gold/60 to-transparent" />
            <span className="text-gold text-lg">✧</span>
          </div>
          
          {/* Main Heading */}
          <h1 
            className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium leading-[1.1] mb-4 animate-fade-in tracking-wider"
            style={{ animationDelay: "0.4s" }}
          >
            <span className="text-foreground">Royal</span>
            <br />
            <span className="font-accent italic text-gold text-[0.85em] tracking-normal">
              Elegance
            </span>
          </h1>

          {/* Tagline */}
          <p 
            className="text-lg lg:text-xl text-muted-foreground mb-4 font-accent italic animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            Where Tradition Meets Timeless Beauty
          </p>
          
          {/* Description */}
          <p 
            className="text-base lg:text-lg text-foreground/70 mb-12 max-w-xl leading-relaxed font-body animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            Discover our exquisite collection of handcrafted Pakistani & Punjabi ethnic wear, 
            where centuries of Mughal artistry meet contemporary luxury. Each piece tells a story of heritage, 
            crafted for the modern royalty.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-wrap gap-6 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <Link to="/products" className="btn-hero">
              <span className="mr-2">✧</span>
              Explore Collection
              <span className="ml-2">✧</span>
            </Link>
            <Link to="/new-arrivals" className="btn-hero-outline">
              New Arrivals
            </Link>
          </div>

          {/* Trust indicators */}
          <div 
            className="flex items-center gap-8 mt-16 pt-8 border-t border-gold/20 animate-fade-in"
            style={{ animationDelay: "1s" }}
          >
            <div className="text-center">
              <p className="font-display text-2xl text-gold tracking-wider">15+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Years Legacy</p>
            </div>
            <div className="w-px h-10 bg-gold/30" />
            <div className="text-center">
              <p className="font-display text-2xl text-gold tracking-wider">50K+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Happy Clients</p>
            </div>
            <div className="w-px h-10 bg-gold/30" />
            <div className="text-center">
              <p className="font-display text-2xl text-gold tracking-wider">100%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Authentic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ornate border */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-4 text-gold/40">
            <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold/40" />
            <span className="animate-sparkle">✦</span>
            <span className="animate-sparkle" style={{ animationDelay: '0.5s' }}>✧</span>
            <span className="animate-sparkle" style={{ animationDelay: '1s' }}>✦</span>
            <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
