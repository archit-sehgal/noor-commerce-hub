import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Flame, ArrowRight } from "lucide-react";
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
    <section className="py-12 bg-gradient-to-r from-rose-gold/10 via-gold/5 to-rose-gold/10 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-1/2 h-full bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/4 w-1/2 h-full bg-gradient-to-tl from-rose-gold/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left - Title */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-gold/20 rounded-full animate-bounce">
              <Flame className="h-6 w-6 text-rose-gold" />
            </div>
            <div>
              <p className="text-overline mb-1">Limited Time Only</p>
              <h3 className="font-display text-2xl md:text-3xl">Flash Sale</h3>
            </div>
          </div>

          {/* Center - Timer */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-rose-gold animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="bg-charcoal text-cream px-4 py-2 rounded-lg min-w-[60px] text-center">
                <span className="font-display text-2xl">{formatNumber(timeLeft.hours)}</span>
                <p className="text-[10px] uppercase tracking-wider text-cream/60">Hours</p>
              </div>
              <span className="text-2xl font-bold text-charcoal">:</span>
              <div className="bg-charcoal text-cream px-4 py-2 rounded-lg min-w-[60px] text-center">
                <span className="font-display text-2xl">{formatNumber(timeLeft.minutes)}</span>
                <p className="text-[10px] uppercase tracking-wider text-cream/60">Mins</p>
              </div>
              <span className="text-2xl font-bold text-charcoal">:</span>
              <div className="bg-rose-gold text-cream px-4 py-2 rounded-lg min-w-[60px] text-center animate-pulse">
                <span className="font-display text-2xl">{formatNumber(timeLeft.seconds)}</span>
                <p className="text-[10px] uppercase tracking-wider text-cream/80">Secs</p>
              </div>
            </div>
          </div>

          {/* Right - CTA */}
          <Link to="/products">
            <Button className="bg-charcoal hover:bg-charcoal/90 text-cream group">
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
