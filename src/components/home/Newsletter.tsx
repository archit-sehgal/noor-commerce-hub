import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-charcoal text-cream relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-10 h-px bg-gradient-to-r from-transparent to-gold" />
            <p className="text-[10px] font-accent tracking-[0.3em] uppercase text-gold">Stay Connected</p>
            <div className="w-10 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <h2 className="font-display text-2xl lg:text-3xl font-normal mb-4">
            Join Our <span className="italic text-gold">Newsletter</span>
          </h2>
          <p className="text-cream/70 mb-6 font-body text-sm leading-relaxed">
            Subscribe to receive updates on new arrivals, exclusive offers, 
            and styling inspirations curated just for you.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-4 bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50 rounded-none focus-visible:ring-gold focus-visible:border-gold text-sm"
              required
            />
            <Button 
              type="submit" 
              className="h-11 px-8 bg-gold hover:bg-gold-light text-charcoal rounded-none font-accent tracking-wider text-[10px] uppercase"
            >
              Subscribe
            </Button>
          </form>
          <p className="text-[10px] text-cream/50 mt-4 font-body">
            By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
