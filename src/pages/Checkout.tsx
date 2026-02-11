import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart, useClearCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, CheckCircle, Sparkles } from "lucide-react";
import heroCheckout from "@/assets/hero-checkout.jpg";

interface ShippingForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

const Checkout = () => {
  const { user } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const clearCart = useClearCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  
  const [form, setForm] = useState<ShippingForm>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.discount_price || item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);
  const shipping = subtotal > 2999 ? 0 : 99;
  const total = subtotal + shipping;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NC-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to place an order.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrderNumber = generateOrderNumber();

      // Get or create customer record for this user
      let customerId: string | null = null;
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from("customers")
          .update({
            name: form.fullName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          })
          .eq("id", customerId);
      } else {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: form.fullName,
            email: user.email || null,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          })
          .select("id")
          .single();
        if (newCustomer) customerId = newCustomer.id;
      }

      // Create the order with customer_id
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: newOrderNumber,
          user_id: user.id,
          customer_id: customerId,
          subtotal: subtotal,
          shipping_amount: shipping,
          total_amount: total,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_pincode: form.pincode,
          notes: form.notes,
          status: "pending",
          payment_status: "pending",
          order_source: "online",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with SKU for inventory tracking
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || "Unknown Product",
        product_sku: item.product?.sku || null,
        quantity: item.quantity,
        unit_price: item.product?.discount_price || item.product?.price || 0,
        total_price: (item.product?.discount_price || item.product?.price || 0) * item.quantity,
        size: item.size,
        color: item.color,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Deduct stock for each ordered item
      for (const item of cartItems) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();

          if (product) {
            await supabase
              .from("products")
              .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
              .eq("id", item.product_id);
          }
        }
      }

      // Clear the cart
      await clearCart.mutateAsync();

      setOrderNumber(newOrderNumber);
      setOrderPlaced(true);

      toast({
        title: "Order placed successfully!",
        description: `Your order ${newOrderNumber} has been placed.`,
      });
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Error placing order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero
          title="Checkout"
          subtitle="Complete your royal purchase"
          image={heroCheckout}
          overlay="gradient"
          height="50vh"
        />
        <main className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center">
              <ShoppingBag className="h-16 w-16 text-gold/40 mx-auto mb-4" />
              <h2 className="text-2xl font-display mb-4 tracking-wider">Sign in to checkout</h2>
              <p className="text-muted-foreground mb-8 font-body">
                Please login to proceed with your order.
              </p>
              <Link to="/login">
                <Button className="btn-hero">
                  <span className="mr-2">✧</span>
                  Sign In
                  <span className="ml-2">✧</span>
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero
          title="Order Confirmed"
          subtitle="Thank you for your purchase"
          image={heroCheckout}
          overlay="gradient"
          height="50vh"
        />
        <main className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center">
              <div className="h-20 w-20 border border-emerald/40 bg-emerald/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-light" />
              </div>
              <h2 className="text-3xl font-display mb-4 tracking-wider">Order Placed!</h2>
              <p className="text-muted-foreground mb-2 font-body">
                Thank you for your purchase.
              </p>
              <p className="font-heading text-lg mb-8">
                Order Number: <span className="text-gold font-display">{orderNumber}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/account">
                  <Button variant="outline" className="border-gold/30 hover:bg-gold/10">
                    View Orders
                  </Button>
                </Link>
                <Link to="/">
                  <Button className="bg-maroon hover:bg-maroon-light text-cream border border-gold/40">
                    <span className="mr-2">✧</span>
                    Continue Shopping
                    <span className="ml-2">✧</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero
          title="Checkout"
          subtitle="Complete your royal purchase"
          image={heroCheckout}
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero
          title="Checkout"
          subtitle="Complete your royal purchase"
          image={heroCheckout}
          overlay="gradient"
          height="50vh"
        />
        <main className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center">
              <ShoppingBag className="h-16 w-16 text-gold/40 mx-auto mb-4" />
              <h2 className="text-2xl font-display mb-4 tracking-wider">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8 font-body">
                Add some items to your cart before checking out.
              </p>
              <Link to="/">
                <Button className="btn-hero">
                  <span className="mr-2">✧</span>
                  Continue Shopping
                  <span className="ml-2">✧</span>
                </Button>
              </Link>
            </div>
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
        title="Checkout"
        subtitle="Complete your royal purchase"
        image={heroCheckout}
        overlay="gradient"
        height="50vh"
      />
      <main className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Shipping Form */}
            <div>
              <h2 className="text-xl font-display mb-6 flex items-center gap-3 tracking-wider">
                <span className="h-8 w-8 border border-gold/40 bg-secondary/50 text-gold text-sm flex items-center justify-center font-display">1</span>
                Shipping Details
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="font-display tracking-wider text-xs uppercase">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 border-gold/30"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-display tracking-wider text-xs uppercase">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1 border-gold/30"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="font-display tracking-wider text-xs uppercase">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1 border-gold/30"
                    placeholder="House/Flat No., Building, Street, Area"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="font-display tracking-wider text-xs uppercase">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                      className="mt-1 border-gold/30"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="font-display tracking-wider text-xs uppercase">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleInputChange}
                      required
                      className="mt-1 border-gold/30"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="font-display tracking-wider text-xs uppercase">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleInputChange}
                      required
                      className="mt-1 border-gold/30"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="font-display tracking-wider text-xs uppercase">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    className="mt-1 border-gold/30"
                    placeholder="Any special instructions for delivery"
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.15em] text-sm uppercase shadow-gold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✧</span>
                      Place Order • ₹{total.toLocaleString()}
                      <span className="ml-2">✧</span>
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <h2 className="text-xl font-display mb-6 flex items-center gap-3 tracking-wider">
                <span className="h-8 w-8 border border-gold/40 bg-secondary/50 text-gold text-sm flex items-center justify-center font-display">2</span>
                Order Summary
              </h2>
              <div className="bg-secondary/30 border border-gold/20 p-6 relative">
                {/* Corner ornaments */}
                <div className="absolute top-2 left-2 text-gold/30 text-xs">✧</div>
                <div className="absolute top-2 right-2 text-gold/30 text-xs">✧</div>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-20 overflow-hidden flex-shrink-0 border border-gold/20">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary text-gold/40">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm line-clamp-2">{item.product?.name}</p>
                        {(item.size || item.color) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && " • "}
                            {item.color && `Color: ${item.color}`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-display text-sm text-gold whitespace-nowrap">
                        ₹{((item.product?.discount_price || item.product?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gold/20 pt-4 space-y-3">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-light" : ""}>
                      {shipping === 0 ? "Free" : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping on orders above ₹2,999
                    </p>
                  )}
                  <div className="border-t border-gold/20 pt-3 flex justify-between font-display text-lg">
                    <span>Total</span>
                    <span className="text-gold">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-background border border-gold/20 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-display tracking-wider">
                    <Sparkles className="h-3 w-3 text-gold/60" />
                    Cash on Delivery • Secure Checkout
                    <Sparkles className="h-3 w-3 text-gold/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
