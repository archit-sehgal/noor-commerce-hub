import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import heroLogin from "@/assets/hero-login.jpg";
import noorLogo from "@/assets/noor-logo.png";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to Noor Creations. You can now start shopping.",
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image Hero */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src={heroLogin} 
          alt="Luxury boutique entrance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <img src={noorLogo} alt="Noor" className="h-24 w-auto object-contain mx-auto mb-4" />
            <h3 className="font-display text-4xl mb-4 tracking-wider text-foreground">
              Join Our Family
            </h3>
            <p className="text-foreground/70 max-w-md font-heading text-lg">
              Create an account to enjoy exclusive offers, track your orders,
              and get early access to new collections.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Sparkles className="h-3 w-3 text-gold/60" />
              <span className="text-gold/60 text-xs font-display tracking-[0.3em]">✧ NOOR CREATIONS ✧</span>
              <Sparkles className="h-3 w-3 text-gold/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link to="/">
              <img src={noorLogo} alt="Noor - A Hand Crafted Heritage" className="h-20 w-auto object-contain mx-auto" />
            </Link>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto mt-4" />
            <h2 className="mt-6 text-2xl font-display text-foreground tracking-wider">
              Create Your Account
            </h2>
            <p className="mt-2 text-muted-foreground font-body">
              Start your journey with exclusive ethnic wear
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="font-display tracking-wider text-xs uppercase">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1 border-gold/30"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="font-display tracking-wider text-xs uppercase">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 border-gold/30"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password" className="font-display tracking-wider text-xs uppercase">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 border-gold/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="font-display tracking-wider text-xs uppercase">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 border-gold/30"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-xs uppercase"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <span className="mr-2">✧</span>
                  Create Account
                  <span className="ml-2">✧</span>
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground font-body">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-display text-gold hover:text-gold-light transition-colors tracking-wider"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
