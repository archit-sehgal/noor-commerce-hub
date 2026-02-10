import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
  product_id: string | null;
  isNew?: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
}

interface EditInvoiceDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: () => void;
}

const EditInvoiceDialog = ({
  invoiceId,
  open,
  onOpenChange,
  onInvoiceUpdated,
}: EditInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [removedItems, setRemovedItems] = useState<OrderItem[]>([]);
  const [addedItems, setAddedItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (invoiceId && open) {
      fetchInvoice();
      fetchProducts();
      setRemovedItems([]);
      setAddedItems([]);
      setShowProductSearch(false);
      setProductSearch("");
    }
  }, [invoiceId, open]);

  const fetchInvoice = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      setInvoiceNumber(data.invoice_number);
      setOrderId(data.order_id);
      setDiscountAmount(data.discount_amount || 0);

      // Fetch order items if linked to an order
      if (data.order_id) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", data.order_id);
        setItems(orderItems || []);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({ title: "Error", description: "Failed to fetch invoice details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, price, discount_price, stock_quantity")
      .eq("is_active", true)
      .order("name");
    setProducts(data || []);
  };

  const removeItem = (index: number) => {
    const item = items[index];
    if (!item.isNew) {
      setRemovedItems(prev => [...prev, item]);
    } else {
      setAddedItems(prev => prev.filter(a => a.id !== item.id));
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addProduct = (product: Product) => {
    const unitPrice = product.discount_price || product.price;
    const newItem: OrderItem = {
      id: `new-${Date.now()}-${product.id}`,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: unitPrice,
      total_price: unitPrice,
      size: null,
      color: null,
      product_id: product.id,
      isNew: true,
    };
    setItems(prev => [...prev, newItem]);
    setAddedItems(prev => [...prev, newItem]);
    setProductSearch("");
    setShowProductSearch(false);
  };

  const updateItemQuantity = (index: number, qty: number) => {
    const newQty = Math.max(1, qty);
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: newQty, total_price: item.unit_price * newQty } : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalAmount = subtotal - discountAmount;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  const handleSave = async () => {
    if (!invoiceId) return;
    setSaving(true);
    try {
      // 1. Restore inventory for removed items
      for (const item of removedItems) {
        if (item.product_id) {
          const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
          if (product) {
            await supabase.from("products").update({ stock_quantity: product.stock_quantity + item.quantity }).eq("id", item.product_id);
          }
        }
        await supabase.from("order_items").delete().eq("id", item.id);
      }

      // 2. Deduct inventory for added items
      for (const item of addedItems) {
        if (item.product_id && orderId) {
          const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
          if (product) {
            await supabase.from("products").update({ stock_quantity: product.stock_quantity - item.quantity }).eq("id", item.product_id);
          }
          await supabase.from("order_items").insert({
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
            size: item.size,
            color: item.color,
          });
        }
      }

      // 3. Update existing items
      const originalItems = items.filter(i => !i.isNew);
      for (const item of originalItems) {
        await supabase.from("order_items").update({
          quantity: item.quantity,
          total_price: item.unit_price * item.quantity,
        }).eq("id", item.id);
      }

      // 4. Update invoice totals
      await supabase.from("invoices").update({
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
      }).eq("id", invoiceId);

      // 5. Update linked order totals
      if (orderId) {
        await supabase.from("orders").update({
          subtotal,
          discount_amount: discountAmount,
          total_amount: totalAmount,
        }).eq("id", orderId);
      }

      toast({ title: "Success", description: "Invoice updated with inventory adjustments" });
      onInvoiceUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Invoice — {invoiceNumber}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {!orderId && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                This invoice is not linked to an order. Item editing is only available for order-linked invoices.
              </p>
            )}

            {orderId && (
              <>
                {/* Items Table */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Invoice Items</Label>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Item</th>
                          <th className="p-2 text-center">SKU</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Rate</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} className={`border-t border-border ${item.isNew ? "bg-green-50" : ""}`}>
                            <td className="p-2 font-medium">{item.product_name}</td>
                            <td className="p-2 text-center text-xs font-mono">{item.product_sku || "-"}</td>
                            <td className="p-2 text-center">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                                className="w-16 h-7 text-center mx-auto"
                              />
                            </td>
                            <td className="p-2 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="p-2 text-right font-semibold">{formatCurrency(item.unit_price * item.quantity)}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeItem(index)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {items.length === 0 && (
                          <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No items</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Product */}
                <div>
                  <Button variant="outline" size="sm" onClick={() => setShowProductSearch(!showProductSearch)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                  {showProductSearch && (
                    <div className="mt-2 border border-border rounded-lg p-3 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => addProduct(product)}
                            className="w-full p-2 text-left hover:bg-muted/50 text-sm flex justify-between items-center rounded"
                          >
                            <span>
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{product.sku || ""}</span>
                            </span>
                            <span className="text-primary font-semibold">{formatCurrency(product.discount_price || product.price)}</span>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && <p className="text-sm text-muted-foreground p-2">No products found</p>}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Discount (₹)</span>
                <Input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-28 h-7 text-right"
                />
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {removedItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ⚠️ {removedItems.length} item(s) will be removed and inventory restored.
              </p>
            )}
            {addedItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ✅ {addedItems.length} new item(s) will be added and inventory deducted.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceDialog;
