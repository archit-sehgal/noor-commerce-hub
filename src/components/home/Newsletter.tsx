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
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-overline mb-4">Stay Connected</p>
          <h2 className="font-display text-4xl lg:text-5xl font-light mb-6">
            Join Our Newsletter
          </h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to receive updates on new arrivals, exclusive offers, 
            and styling tips directly in your inbox.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 bg-secondary border-0 focus-visible:ring-gold"
              required
            />
            <Button type="submit" className="h-12 px-8 bg-primary hover:bg-gold text-primary-foreground">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
