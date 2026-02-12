import { Sparkles } from "lucide-react";
import noorLogo from "@/assets/noor-logo.png";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  overlay?: "dark" | "gradient" | "maroon";
  height?: "50vh" | "40vh" | "60vh";
}

const PageHero = ({ 
  title, 
  subtitle, 
  image, 
  overlay = "gradient",
  height = "50vh" 
}: PageHeroProps) => {
  const overlayStyles = {
    dark: "bg-background/70",
    gradient: "bg-gradient-to-b from-background/80 via-background/50 to-background",
    maroon: "bg-gradient-to-b from-maroon/60 via-background/40 to-background",
  };

  return (
    <section 
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${overlayStyles[overlay]}`} />
        
        {/* Decorative overlay pattern */}
        <div className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M30 30l15-15v30H15V15l15 15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content - Added more padding-top for centering */}
      <div className="relative z-10 text-center px-4 pt-16">
        {/* Decorative top element */}
        <div className="flex items-center justify-center mb-3">
          <img src={noorLogo} alt="Noor" className="h-12 w-auto object-contain opacity-80" />
        </div>
        
        {/* Title - Reduced size */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-display tracking-[0.15em] uppercase text-foreground mb-3">
          {title}
        </h1>
        
        {/* Decorative underline */}
        <div className="flex justify-center mb-3">
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>
        
        {/* Subtitle - Reduced size */}
        {subtitle && (
          <p className="text-sm md:text-base font-heading text-white/90 max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
        
        {/* Decorative bottom element */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Sparkles className="h-2.5 w-2.5 text-gold/60" />
          <span className="text-gold/60 text-[10px] font-display tracking-[0.3em]">✧ NOOR ✧</span>
          <Sparkles className="h-2.5 w-2.5 text-gold/60" />
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10" />
      
      {/* Corner ornaments - smaller */}
      <div className="absolute top-6 left-6 text-gold/25 text-xl hidden md:block">❧</div>
      <div className="absolute top-6 right-6 text-gold/25 text-xl hidden md:block transform scale-x-[-1]">❧</div>
      <div className="absolute bottom-6 left-6 text-gold/25 text-xl hidden md:block transform scale-y-[-1]">❧</div>
      <div className="absolute bottom-6 right-6 text-gold/25 text-xl hidden md:block transform scale-[-1]">❧</div>
    </section>
  );
};

export default PageHero;
