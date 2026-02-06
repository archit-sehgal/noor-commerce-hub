import { Link } from "react-router-dom";
import { Sparkles, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import noorLogo from "@/assets/noor-logo.png";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-gold/20 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      
      {/* Ornamental pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img 
                src={noorLogo} 
                alt="Noor - A Hand Crafted Heritage" 
                className="h-24 w-auto object-contain"
              />
            </Link>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
              Where tradition meets timeless beauty. Handcrafted Pakistani & Punjabi ethnic wear 
              for the modern royalty.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 border border-gold/30 text-gold/60 hover:text-gold hover:border-gold hover:bg-gold/10 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 border border-gold/30 text-gold/60 hover:text-gold hover:border-gold hover:bg-gold/10 transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 border border-gold/30 text-gold/60 hover:text-gold hover:border-gold hover:bg-gold/10 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-sm tracking-[0.3em] mb-6 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gold" />
              SHOP
            </h3>
            <ul className="space-y-3">
              {["New Arrivals", "Collections", "Kurtis", "Sarees", "Suits", "Lehengas"].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/category/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm font-body flex items-center gap-2"
                  >
                    <span className="text-gold/40 text-xs">✧</span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-display text-sm tracking-[0.3em] mb-6 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gold" />
              HELP
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Track Order", href: "/track-order" },
                { name: "Shipping Policy", href: "/shipping" },
                { name: "Returns & Exchange", href: "/returns" },
                { name: "Size Guide", href: "/size-guide" },
                { name: "FAQs", href: "/faqs" },
                { name: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm font-body flex items-center gap-2"
                  >
                    <span className="text-gold/40 text-xs">✧</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-sm tracking-[0.3em] mb-6 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gold" />
              CONTACT
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground font-body">
                  123 Fashion Street, Ludhiana<br />Punjab, India - 141001
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gold flex-shrink-0" />
                <a href="tel:+919876543210" className="text-muted-foreground hover:text-gold transition-colors font-body">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gold flex-shrink-0" />
                <a href="mailto:hello@noorcreations.com" className="text-muted-foreground hover:text-gold transition-colors font-body">
                  hello@noorcreations.com
                </a>
              </li>
            </ul>
            
            {/* Store timings */}
            <div className="mt-6 p-4 border border-gold/20 bg-secondary/30">
              <p className="text-xs font-display tracking-wider text-gold mb-2">STORE HOURS</p>
              <p className="text-sm text-muted-foreground font-body">
                Mon - Sat: 10:00 AM - 8:00 PM<br />
                Sunday: 11:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-12 border-t border-gold/20">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-display text-lg tracking-[0.2em] mb-3">JOIN THE ROYAL COURT</h3>
            <p className="text-muted-foreground text-sm mb-6 font-body">
              Subscribe for exclusive offers, new arrivals, and style inspiration.
            </p>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-secondary border border-gold/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold text-sm font-body"
              />
              <button className="px-8 py-3 bg-maroon text-cream border border-gold/40 font-display text-xs tracking-widest hover:bg-maroon-light transition-all">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gold/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} Noor - A Hand Crafted Heritage. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground font-body">
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <span className="text-gold/30">|</span>
            <Link to="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
            <span className="text-gold/30">|</span>
            <Link to="/refund" className="hover:text-gold transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="h-1 bg-gradient-to-r from-maroon via-gold to-maroon" />
    </footer>
  );
};

export default Footer;
