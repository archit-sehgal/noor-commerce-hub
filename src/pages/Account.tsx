import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Package,
  Heart,
  MapPin,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import heroAccount from "@/assets/hero-account.jpg";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const Account = () => {
  const { user, signOut, isStaff } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError);
        }

        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            address: profileData.address || "",
            city: profileData.city || "",
            state: profileData.state || "",
            pincode: profileData.pincode || "",
          });
        }

        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id, order_number, status, total_amount, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
        }

        if (ordersData) {
          setOrders(ordersData);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald/20 text-emerald-light border border-emerald/30";
      case "shipped":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "processing":
        return "bg-gold/20 text-gold border border-gold/30";
      case "cancelled":
        return "bg-maroon/20 text-maroon-light border border-maroon/30";
      default:
        return "bg-secondary text-muted-foreground border border-gold/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero
          title="My Account"
          subtitle="Manage your royal profile"
          image={heroAccount}
          overlay="gradient"
          height="50vh"
        />
        <main className="py-16">
          <div className="container mx-auto px-4 lg:px-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-gold/60 font-display tracking-widest text-xs mt-4">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero
        title="My Account"
        subtitle="Manage your royal profile"
        image={heroAccount}
        overlay="gradient"
        height="50vh"
      />
      <main className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-muted-foreground font-body">{user?.email}</p>
            </div>
            <div className="flex gap-3">
              {isStaff && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                  className="border-gold/30 hover:bg-gold/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut} className="border-gold/30 hover:bg-gold/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-secondary/50 border border-gold/20">
              <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <MapPin className="h-4 w-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <Heart className="h-4 w-4" />
                Wishlist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-gold/20 bg-secondary/30">
                <CardHeader>
                  <CardTitle className="font-display tracking-wider">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name" className="font-display tracking-wider text-xs uppercase">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({ ...formData, full_name: e.target.value })
                          }
                          className="mt-1 border-gold/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="font-display tracking-wider text-xs uppercase">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="mt-1 border-gold/30"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="font-display tracking-wider text-xs uppercase">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="mt-1 border-gold/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="font-display tracking-wider text-xs uppercase">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="mt-1 border-gold/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="font-display tracking-wider text-xs uppercase">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="mt-1 border-gold/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode" className="font-display tracking-wider text-xs uppercase">Pincode</Label>
                        <Input
                          id="pincode"
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({ ...formData, pincode: e.target.value })
                          }
                          className="mt-1 border-gold/30"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-widest text-xs uppercase"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">✧</span>
                          Save Changes
                          <span className="ml-2">✧</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-gold/20 bg-secondary/30">
                <CardHeader>
                  <CardTitle className="font-display tracking-wider">Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gold/40 mx-auto mb-4" />
                      <p className="text-muted-foreground font-heading">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border border-gold/20 bg-background/50"
                        >
                          <div>
                            <p className="font-display tracking-wider">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-3 py-1 text-xs font-display tracking-wider uppercase ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                            <p className="font-display text-gold mt-1">
                              ₹{Number(order.total_amount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card className="border-gold/20 bg-secondary/30">
                <CardHeader>
                  <CardTitle className="font-display tracking-wider">Saved Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground font-heading">
                    Manage your delivery addresses here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wishlist">
              <Card className="border-gold/20 bg-secondary/30">
                <CardHeader>
                  <CardTitle className="font-display tracking-wider">My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gold/40 mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading">
                      Your wishlist is empty
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
