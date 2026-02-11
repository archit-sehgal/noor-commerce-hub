import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Sparkles, Phone, Mail } from "lucide-react";
import heroLogin from "@/assets/hero-login.jpg";
import noorLogo from "@/assets/noor-logo.png";

const Login = () => {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithPhone, verifyPhoneOtp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({ title: "Error signing in", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid phone", description: "Please enter a valid phone number with country code (e.g. +91...)", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    const { error } = await signInWithPhone(formattedPhone);

    if (error) {
      toast({ title: "Error sending OTP", description: error.message, variant: "destructive" });
    } else {
      setOtpSent(true);
      setPhone(formattedPhone);
      toast({ title: "OTP Sent!", description: "Please check your phone for the verification code." });
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await verifyPhoneOtp(phone, otp);

    if (error) {
      toast({ title: "Error verifying OTP", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome!", description: "You have successfully signed in." });
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image Hero */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroLogin} alt="Luxury boutique entrance" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-125" />
              <img src={noorLogo} alt="Noor" className="relative h-32 w-auto object-contain mx-auto" />
            </div>
            <h3 className="font-display text-4xl mb-4 tracking-wider text-foreground">Elegance Redefined</h3>
            <p className="text-foreground/70 max-w-md font-heading text-lg">
              Discover our exclusive collection of handcrafted ethnic wear, designed to make every moment special.
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
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-white/8 rounded-full blur-xl scale-150" />
                <img src={noorLogo} alt="Noor - A Hand Crafted Heritage" className="relative h-28 w-auto object-contain mx-auto" />
              </div>
            </Link>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto mt-4" />
            <h2 className="mt-6 text-2xl font-display text-foreground tracking-wider">Welcome Back</h2>
            <p className="mt-2 text-muted-foreground font-body">Sign in to your account to continue shopping</p>
          </div>

          {/* Toggle: Email / Phone */}
          <div className="flex border border-gold/30 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => { setLoginMethod("email"); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-display tracking-wider uppercase transition-colors ${
                loginMethod === "email" ? "bg-maroon text-cream" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-4 w-4" /> Email
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod("phone"); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-display tracking-wider uppercase transition-colors ${
                loginMethod === "phone" ? "bg-maroon text-cream" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-4 w-4" /> Phone OTP
            </button>
          </div>

          {loginMethod === "email" ? (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="font-display tracking-wider text-xs uppercase">Email address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 border-gold/30" placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="password" className="font-display tracking-wider text-xs uppercase">Password</Label>
                  <div className="relative mt-1">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10 border-gold/30" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-xs uppercase" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>) : (<><span className="mr-2">✧</span>Sign In<span className="ml-2">✧</span></>)}
              </Button>
            </form>
          ) : (
            <>
              {!otpSent ? (
                <form className="space-y-6" onSubmit={handleSendOtp}>
                  <div>
                    <Label htmlFor="phone" className="font-display tracking-wider text-xs uppercase">Phone Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 border-gold/30" placeholder="+91 9876543210" />
                    <p className="text-xs text-muted-foreground mt-1">Enter with country code (e.g. +91)</p>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-xs uppercase" disabled={isLoading}>
                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>) : (<><span className="mr-2">✧</span>Send OTP<span className="ml-2">✧</span></>)}
                  </Button>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                  <div>
                    <Label htmlFor="otp" className="font-display tracking-wider text-xs uppercase">Enter OTP</Label>
                    <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="mt-1 border-gold/30 text-center text-lg tracking-[0.5em]" placeholder="------" maxLength={6} />
                    <p className="text-xs text-muted-foreground mt-1">OTP sent to {phone}</p>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-xs uppercase" disabled={isLoading}>
                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>) : (<><span className="mr-2">✧</span>Verify & Sign In<span className="ml-2">✧</span></>)}
                  </Button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-center text-sm text-gold hover:text-gold-light font-display tracking-wider">
                    ← Change Number
                  </button>
                </form>
              )}
            </>
          )}

          <p className="text-center text-sm text-muted-foreground font-body">
            Don't have an account?{" "}
            <Link to="/signup" className="font-display text-gold hover:text-gold-light transition-colors tracking-wider">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
