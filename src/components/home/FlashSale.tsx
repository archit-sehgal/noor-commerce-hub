import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 5, minutes: 30, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset timer
          hours = 5;
          minutes = 30;
          seconds = 0;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-6 bg-secondary/50 border-y border-gold/20 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-maroon/5 via-transparent to-maroon/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 border border-gold/40 bg-maroon/20">
              <Crown className="h-5 w-5 text-gold animate-pulse" />
            </div>
            <div>
              <p className="text-overline text-[10px] mb-0.5">Limited Time Only</p>
              <h3 className="font-display text-lg md:text-xl tracking-wider">Royal Flash Sale</h3>
            </div>
          </div>

          {/* Center - Timer */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            <div className="flex items-center gap-1.5">
              <div className="bg-background border border-gold/40 text-foreground px-3 py-1.5 min-w-[50px] text-center shadow-antique">
                <span className="font-display text-lg text-gold">{formatNumber(timeLeft.hours)}</span>
                <p className="text-[8px] uppercase tracking-wider text-muted-foreground font-display">Hours</p>
              </div>
              <span className="text-lg font-bold text-gold">:</span>
              <div className="bg-background border border-gold/40 text-foreground px-3 py-1.5 min-w-[50px] text-center shadow-antique">
                <span className="font-display text-lg text-gold">{formatNumber(timeLeft.minutes)}</span>
                <p className="text-[8px] uppercase tracking-wider text-muted-foreground font-display">Mins</p>
              </div>
              <span className="text-lg font-bold text-gold">:</span>
              <div className="bg-maroon border border-gold/40 text-cream px-3 py-1.5 min-w-[50px] text-center glow-pulse">
                <span className="font-display text-lg">{formatNumber(timeLeft.seconds)}</span>
                <p className="text-[8px] uppercase tracking-wider text-cream/80 font-display">Secs</p>
              </div>
            </div>
          </div>

          {/* Right - CTA */}
          <Link to="/products">
            <Button className="bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.15em] text-[10px] uppercase group shadow-gold px-4 py-1.5 h-auto">
              Shop Now
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
