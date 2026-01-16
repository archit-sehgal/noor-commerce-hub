import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-medium tracking-wide">
              NOOR <span className="text-gold">CREATIONS</span>
            </h2>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Crafting timeless elegance since 2010. Premium ethnic wear for the modern woman.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="h-10 w-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-all duration-300"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-all duration-300"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-gold">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {["New Arrivals", "Collections", "Best Sellers", "Sale"].map((link) => (
                <li key={link}>
                  <Link
                    to="#"
                    className="text-sm text-primary-foreground/70 hover:text-gold transition-colors duration-200"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-gold">
              Customer Care
            </h3>
            <ul className="space-y-3">
              {["Track Order", "Returns & Exchange", "Shipping Info", "Size Guide", "FAQ"].map(
                (link) => (
                  <li key={link}>
                    <Link
                      to="#"
                      className="text-sm text-primary-foreground/70 hover:text-gold transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-gold">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-gold" />
                <span className="text-sm text-primary-foreground/70">
                  123 Fashion Street<br />
                  Mumbai, Maharashtra 400001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold" />
                <span className="text-sm text-primary-foreground/70">
                  +91 98765 43210
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold" />
                <span className="text-sm text-primary-foreground/70">
                  hello@noorcreations.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/50">
            © 2024 Noor Creations. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="#"
              className="text-xs text-primary-foreground/50 hover:text-gold transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-xs text-primary-foreground/50 hover:text-gold transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
