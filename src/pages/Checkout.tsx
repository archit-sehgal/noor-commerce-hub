import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart, useClearCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

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

      // Get or update customer record for this user
      let customerId: string | null = null;
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info with latest shipping details
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
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || "Unknown Product",
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
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-display mb-4">Sign in to checkout</h1>
              <p className="text-muted-foreground mb-8">
                Please login to proceed with your order.
              </p>
              <Link to="/login">
                <Button className="bg-charcoal hover:bg-charcoal/90 text-cream rounded-none">
                  Sign In
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
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-display mb-4">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-2">
                Thank you for your purchase.
              </p>
              <p className="font-heading text-lg mb-8">
                Order Number: <span className="text-gold font-semibold">{orderNumber}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/account">
                  <Button variant="outline" className="rounded-none">
                    View Orders
                  </Button>
                </Link>
                <Link to="/">
                  <Button className="bg-charcoal hover:bg-charcoal/90 text-cream rounded-none">
                    Continue Shopping
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
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8 flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-display mb-4">Your cart is empty</h1>
              <p className="text-muted-foreground mb-8">
                Add some items to your cart before checking out.
              </p>
              <Link to="/">
                <Button className="bg-charcoal hover:bg-charcoal/90 text-cream rounded-none">
                  Continue Shopping
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
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-display mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your order</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Shipping Form */}
            <div>
              <h2 className="text-xl font-heading mb-6 flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-charcoal text-cream text-sm flex items-center justify-center">1</span>
                Shipping Details
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded-none"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded-none"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1 rounded-none"
                    placeholder="House/Flat No., Building, Street, Area"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded-none"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded-none"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded-none"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    className="mt-1 rounded-none"
                    placeholder="Any special instructions for delivery"
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-charcoal hover:bg-gold text-cream rounded-none font-accent tracking-wider text-sm uppercase"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order • ₹${total.toLocaleString()}`
                  )}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <h2 className="text-xl font-heading mb-6 flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-charcoal text-cream text-sm flex items-center justify-center">2</span>
                Order Summary
              </h2>
              <div className="bg-secondary/50 p-6 border border-border">
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-20 bg-cream overflow-hidden flex-shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{item.product?.name}</p>
                        {(item.size || item.color) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && " • "}
                            {item.color && `Color: ${item.color}`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm whitespace-nowrap">
                        ₹{((item.product?.discount_price || item.product?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shipping === 0 ? "text-green-600" : ""}>
                      {shipping === 0 ? "Free" : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping on orders above ₹2,999
                    </p>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-gold">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-background border border-gold/20">
                  <p className="text-xs text-muted-foreground text-center">
                    💳 Cash on Delivery available • 🔒 Secure checkout
                  </p>
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
