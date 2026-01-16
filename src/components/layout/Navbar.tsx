import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "New Arrivals", href: "/new-arrivals" },
    { name: "Collections", href: "/collections" },
    { name: "Kurtis", href: "/category/kurtis" },
    { name: "Sarees", href: "/category/sarees" },
    { name: "Suits", href: "/category/suits" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 -ml-2"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Logo */}
          <Link 
            to="/" 
            className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-0 lg:translate-x-0"
          >
            <h1 className="font-display text-xl lg:text-2xl font-medium tracking-wide">
              NOOR <span className="text-gold">CREATIONS</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="icon" className="hidden lg:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Link to="/account">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-xs font-medium flex items-center justify-center text-primary-foreground">
                  0
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-96 pb-6" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-display tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-lg font-display tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
