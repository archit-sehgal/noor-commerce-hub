import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, User, Search, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Jewelry Box Navigation Link Component
const JewelryBoxLink = ({ name, href, onClick }: { name: string; href: string; onClick?: () => void }) => {
  return (
    <Link to={href} onClick={onClick} className="jewelry-box group relative">
      {/* Floating text that appears above */}
      <span className="float-text">{name}</span>
      
      {/* The ornate box */}
      <div className="relative">
        {/* Lid of the box */}
        <div className="jewelry-box-lid h-4 w-20" />
        
        {/* Base of the box with velvet interior */}
        <div className="jewelry-box-base h-6 w-20 flex items-center justify-center">
          <span className="jewelry-box-content text-[10px]">✧</span>
        </div>
      </div>
    </Link>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isStaff } = useAuth();
  const { data: cart } = useCart();

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const navLinks = [
    { name: "New Arrivals", href: "/new-arrivals" },
    { name: "Collections", href: "/collections" },
    { name: "Kurtis", href: "/category/kurtis" },
    { name: "Sarees", href: "/category/sarees" },
    { name: "Suits", href: "/category/suits" },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-b border-gold/20">
      {/* Top decorative line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 -ml-2 text-gold hover:text-gold-light transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo */}
          <Link 
            to="/" 
            className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-0 lg:translate-x-0 group"
          >
            <div className="flex flex-col items-center">
              <Crown className="h-5 w-5 text-gold mb-1 opacity-60 group-hover:opacity-100 transition-opacity animate-float" />
              <h1 className="font-display text-xl lg:text-2xl font-medium tracking-[0.3em] text-foreground">
                NOOR
              </h1>
              <span className="text-[10px] tracking-[0.4em] text-gold font-accent italic">
                Creations
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Jewelry Box Style */}
          <div className="hidden lg:flex items-center gap-3">
            {navLinks.map((link) => (
              <JewelryBoxLink key={link.name} name={link.name} href={link.href} />
            ))}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex text-foreground/70 hover:text-gold hover:bg-gold/10 transition-all"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-foreground/70 hover:text-gold hover:bg-gold/10">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline text-sm font-medium tracking-wide">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card border-gold/30 shadow-antique">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer font-body tracking-wide text-foreground hover:text-gold">
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  {isStaff && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer font-body tracking-wide text-foreground hover:text-gold">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gold/20" />
                  <DropdownMenuItem 
                    onClick={signOut} 
                    className="cursor-pointer text-destructive hover:text-destructive/80"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="ghost" className="gap-2 text-foreground/70 hover:text-gold hover:bg-gold/10">
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline text-sm font-medium tracking-wide">Sign In</span>
                </Button>
              </Link>
            )}
            
            {/* Cart with antique styling */}
            <Link to="/cart" className="relative group">
              <div className="p-2 border border-gold/30 bg-gradient-to-b from-secondary to-background hover:border-gold/60 transition-all duration-300 group-hover:shadow-gold">
                <ShoppingBag className="h-5 w-5 text-gold" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-maroon text-xs font-medium flex items-center justify-center text-cream border border-gold/50 shadow-md">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            isOpen ? "max-h-[500px] pb-8" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-1 pt-4 border-t border-gold/20">
            {navLinks.map((link, index) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="relative px-4 py-3 text-lg font-display tracking-[0.2em] text-foreground/80 hover:text-gold hover:bg-gold/5 transition-all border-l-2 border-transparent hover:border-gold"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-gold mr-3 text-sm">✧</span>
                {link.name}
              </Link>
            ))}
            
            <div className="mt-4 pt-4 border-t border-gold/20 px-4">
              {user ? (
                <div className="space-y-3">
                  <Link
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 text-lg font-display tracking-wide text-foreground/80 hover:text-gold transition-colors"
                  >
                    <User className="h-5 w-5 text-gold/60" />
                    My Account
                  </Link>
                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-lg font-display tracking-wide text-foreground/80 hover:text-gold transition-colors"
                    >
                      <Crown className="h-5 w-5 text-gold/60" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 text-lg font-display tracking-wide text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-lg font-display tracking-wide text-gold hover:text-gold-light transition-colors"
                >
                  <User className="h-5 w-5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Bottom decorative line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </header>
  );
};

export default Navbar;
