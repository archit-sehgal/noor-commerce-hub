import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Crown, Sparkles } from "lucide-react";
import heroLogin from "@/assets/hero-login.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
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
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/60" />
              <Crown className="h-6 w-6 text-gold" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/60" />
            </div>
            <h3 className="font-display text-4xl mb-4 tracking-wider text-foreground">
              Elegance Redefined
            </h3>
            <p className="text-foreground/70 max-w-md font-heading text-lg">
              Discover our exclusive collection of handcrafted ethnic wear,
              designed to make every moment special.
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
              <h1 className="font-display text-3xl font-medium tracking-wider">
                NOOR <span className="text-gold">CREATIONS</span>
              </h1>
            </Link>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto mt-4" />
            <h2 className="mt-6 text-2xl font-display text-foreground tracking-wider">
              Welcome Back
            </h2>
            <p className="mt-2 text-muted-foreground font-body">
              Sign in to your account to continue shopping
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-xs uppercase"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <span className="mr-2">✧</span>
                  Sign In
                  <span className="ml-2">✧</span>
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground font-body">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-display text-gold hover:text-gold-light transition-colors tracking-wider"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
