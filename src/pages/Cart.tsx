import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Crown, Sparkles } from "lucide-react";

const Cart = () => {
  const { user } = useAuth();
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.discount_price || item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 border border-gold/30 flex items-center justify-center bg-secondary/50">
                <ShoppingBag className="h-10 w-10 text-gold/60" />
              </div>
              <h1 className="text-3xl font-display mb-4 tracking-wider">Sign In Required</h1>
              <p className="text-muted-foreground mb-8 font-body">
                Please login to view your royal cart and proceed to checkout.
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 lg:px-8 flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-gold font-display tracking-widest text-sm mt-4">Loading your cart...</p>
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
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 border border-gold/30 flex items-center justify-center bg-secondary/50">
                <ShoppingBag className="h-10 w-10 text-gold/60" />
              </div>
              <h1 className="text-3xl font-display mb-4 tracking-wider">Your Cart is Empty</h1>
              <p className="text-muted-foreground mb-8 font-body">
                Looks like you haven't added any treasures to your cart yet.
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
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Crown className="h-6 w-6 text-gold" />
            <h1 className="text-3xl font-display tracking-wider">Shopping Cart</h1>
            <span className="text-sm text-muted-foreground font-body">({cartItems.length} items)</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-gold/20 bg-secondary/30 relative group"
                >
                  {/* Corner ornaments */}
                  <div className="absolute top-1 left-1 text-gold/30 text-[8px]">✧</div>
                  <div className="absolute top-1 right-1 text-gold/30 text-[8px]">✧</div>
                  
                  {/* Product Image */}
                  <div className="w-24 h-28 md:w-28 md:h-32 overflow-hidden flex-shrink-0 border border-gold/20">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-gold/40">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/product/${item.product?.slug}`}
                        className="font-heading text-lg hover:text-gold transition-colors line-clamp-1"
                      >
                        {item.product?.name}
                      </Link>
                      {(item.size || item.color) && (
                        <p className="text-sm text-muted-foreground mt-1 font-body">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && " • "}
                          {item.color && `Color: ${item.color}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {item.product?.discount_price ? (
                        <>
                          <span className="font-display text-lg text-gold">
                            ₹{item.product.discount_price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{item.product.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-display text-lg text-foreground">
                          ₹{item.product?.price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-2 justify-between">
                    <div className="flex items-center border border-gold/30">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-gold/10"
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            quantity: item.quantity - 1,
                          })
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center font-display">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-gold/10"
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={item.quantity >= (item.product?.stock_quantity || 0)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80 text-xs font-display tracking-wider"
                      onClick={() => removeItem.mutate(item.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-gold/30 bg-secondary/30 p-6 sticky top-28 relative">
                {/* Corner ornaments */}
                <div className="absolute top-2 left-2 text-gold/30 text-xs">✧</div>
                <div className="absolute top-2 right-2 text-gold/30 text-xs">✧</div>
                <div className="absolute bottom-2 left-2 text-gold/30 text-xs">✧</div>
                <div className="absolute bottom-2 right-2 text-gold/30 text-xs">✧</div>
                
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <h2 className="font-display text-lg tracking-wider">Order Summary</h2>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-emerald-light">Free</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  <div className="flex justify-between font-display text-lg">
                    <span>Total</span>
                    <span className="text-gold">₹{subtotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <Link to="/checkout">
                  <Button className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.15em] text-xs uppercase shadow-gold">
                    <span className="mr-2">✧</span>
                    Proceed to Checkout
                    <span className="ml-2">✧</span>
                  </Button>
                </Link>
                
                <Link to="/">
                  <Button variant="link" className="w-full mt-4 text-gold hover:text-gold-light font-display tracking-wider text-xs">
                    Continue Shopping
                  </Button>
                </Link>
                
                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-gold/20 text-center">
                  <p className="text-[10px] text-muted-foreground font-display tracking-wider uppercase">
                    Secure Checkout • Authentic Products
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

export default Cart;
