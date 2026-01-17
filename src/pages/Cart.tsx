import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";

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
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-md mx-auto text-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-display mb-4">Sign in to view your cart</h1>
              <p className="text-muted-foreground mb-8">
                Please login to add items to your cart and proceed to checkout.
              </p>
              <Link to="/login">
                <Button className="bg-charcoal hover:bg-charcoal/90 text-cream">
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

  if (isLoading) {
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
                Looks like you haven't added any items to your cart yet.
              </p>
              <Link to="/">
                <Button className="bg-charcoal hover:bg-charcoal/90 text-cream">
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
          <h1 className="text-3xl font-display mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-background rounded-lg border"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-cream rounded-md overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product?.slug}`}
                      className="font-medium hover:text-gold transition-colors line-clamp-1"
                    >
                      {item.product?.name}
                    </Link>
                    {(item.size || item.color) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && " • "}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.product?.discount_price ? (
                        <>
                          <span className="font-semibold">
                            ₹{item.product.discount_price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{item.product.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold">
                          ₹{item.product?.price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            quantity: item.quantity - 1,
                          })
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={
                          item.quantity >= (item.product?.stock_quantity || 0)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-cream rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-display mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                </div>
                <Link to="/checkout">
                  <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-cream">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="link" className="w-full mt-2 text-gold">
                    Continue Shopping
                  </Button>
                </Link>
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
