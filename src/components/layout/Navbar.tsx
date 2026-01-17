import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, User, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isStaff } = useAuth();

  const navLinks = [
    { name: "New Arrivals", href: "/new-arrivals" },
    { name: "Collections", href: "/collections" },
    { name: "Kurtis", href: "/category/kurtis" },
    { name: "Sarees", href: "/category/sarees" },
    { name: "Suits", href: "/category/suits" },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";

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
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline text-sm font-medium">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  {isStaff && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="ghost" className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline text-sm font-medium">Sign In</span>
                </Button>
              </Link>
            )}
            
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
              {user ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    className="block text-lg font-display tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    My Account ({displayName})
                  </Link>
                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block text-lg font-display tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="text-lg font-display tracking-wide text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-display tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
