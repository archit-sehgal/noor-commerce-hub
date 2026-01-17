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
    <section className="py-24 lg:py-32 bg-charcoal text-cream relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold" />
            <p className="text-xs font-accent tracking-[0.3em] uppercase text-gold">Stay Connected</p>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-normal mb-6">
            Join Our <span className="italic text-gold">Newsletter</span>
          </h2>
          <p className="text-cream/70 mb-10 font-body leading-relaxed">
            Subscribe to receive updates on new arrivals, exclusive offers, 
            and styling inspirations curated just for you.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 px-6 bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50 rounded-none focus-visible:ring-gold focus-visible:border-gold"
              required
            />
            <Button 
              type="submit" 
              className="h-14 px-10 bg-gold hover:bg-gold-light text-charcoal rounded-none font-accent tracking-wider text-xs uppercase"
            >
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-cream/50 mt-6 font-body">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
