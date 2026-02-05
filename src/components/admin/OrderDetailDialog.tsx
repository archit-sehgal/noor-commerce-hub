import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Pencil,
  Download,
  Package,
  User,
  MapPin,
  Calendar,
  IndianRupee,
  Scissors,
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number | null;
  tax_amount: number | null;
  shipping_amount: number | null;
  total_amount: number;
  created_at: string;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  notes: string | null;
  needs_alteration: boolean | null;
  alteration_status: string | null;
  alteration_due_date: string | null;
  alteration_notes: string | null;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  salesman?: {
    name: string;
  };
}

interface Props {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

const OrderDetailDialog = ({ orderId, open, onOpenChange, onOrderUpdated }: Props) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId && open) {
      fetchOrderDetails();
    }
  }, [orderId, open]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name, email, phone),
          salesman:salesman(name)
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      setOrder(orderData);
      setEditedAmount(orderData?.total_amount?.toString() || "");

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAmount = async () => {
    if (!orderId || !order) return;
    const newAmount = parseFloat(editedAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ total_amount: newAmount })
        .eq("id", orderId);

      if (error) throw error;

      // Also update the linked invoice if exists
      await supabase
        .from("invoices")
        .update({ total_amount: newAmount })
        .eq("order_id", orderId);

      toast({
        title: "Amount updated",
        description: "Order amount has been updated successfully",
      });
      setIsEditing(false);
      setOrder({ ...order, total_amount: newAmount });
      onOrderUpdated?.();
    } catch (error) {
      console.error("Error updating amount:", error);
      toast({
        title: "Error",
        description: "Failed to update order amount",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    // Generate items HTML separately to avoid template literal issues
    const itemsHTML = items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td>${item.product_sku || "-"}</td>
        <td>${item.size || "-"}</td>
        <td>${item.color || "-"}</td>
        <td>${item.quantity}</td>
        <td>₹${Number(item.unit_price).toLocaleString()}</td>
        <td>₹${Number(item.total_price).toLocaleString()}</td>
      </tr>
    `).join("");

    // Generate a simple invoice HTML and download as a file
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.order_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #333; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .info-box { flex: 1; }
    .info-box h3 { margin: 0 0 10px; color: #666; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: 600; }
    .totals { text-align: right; margin-top: 20px; }
    .totals p { margin: 5px 0; }
    .total-amount { font-size: 20px; font-weight: bold; color: #333; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Order: ${order.order_number}</p>
    <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
  </div>
  
  <div class="info-row">
    <div class="info-box">
      <h3>BILL TO</h3>
      <p><strong>${order.customer?.name || "Walk-in Customer"}</strong></p>
      ${order.customer?.email ? `<p>${order.customer.email}</p>` : ""}
      ${order.customer?.phone ? `<p>${order.customer.phone}</p>` : ""}
    </div>
    <div class="info-box">
      <h3>SHIP TO</h3>
      <p>${order.shipping_address || "-"}</p>
      <p>${[order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(", ") || "-"}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>SKU</th>
        <th>Size</th>
        <th>Color</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <p>Subtotal: ₹${Number(order.subtotal).toLocaleString()}</p>
    ${order.discount_amount ? `<p>Discount: -₹${Number(order.discount_amount).toLocaleString()}</p>` : ""}
    ${order.tax_amount ? `<p>Tax: ₹${Number(order.tax_amount).toLocaleString()}</p>` : ""}
    ${order.shipping_amount ? `<p>Shipping: ₹${Number(order.shipping_amount).toLocaleString()}</p>` : ""}
    <p class="total-amount">Total: ₹${Number(order.total_amount).toLocaleString()}</p>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([invoiceHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Invoice downloaded",
      description: "The invoice has been downloaded successfully",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Order Details</DialogTitle>
          <DialogDescription>
            View and manage order information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{order.order_number}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                <Badge className={getPaymentStatusColor(order.payment_status)}>
                  {order.payment_status}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Customer</span>
                </div>
                <p className="font-semibold">{order.customer?.name || "Walk-in Customer"}</p>
                {order.customer?.email && (
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                )}
                {order.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                )}
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Shipping Address</span>
                </div>
                <p className="text-sm">
                  {order.shipping_address || "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[order.shipping_city, order.shipping_state, order.shipping_pincode]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
            </div>

            {/* Alteration Info */}
            {order.needs_alteration && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800">Alteration Required</span>
                  <Badge variant="outline" className="ml-2">
                    {order.alteration_status || "pending"}
                  </Badge>
                </div>
                {order.alteration_due_date && (
                  <p className="text-sm text-amber-700">
                    Due: {new Date(order.alteration_due_date).toLocaleDateString()}
                  </p>
                )}
                {order.alteration_notes && (
                  <p className="text-sm text-amber-600 mt-1">{order.alteration_notes}</p>
                )}
              </div>
            )}

            {/* Order Items */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Order Items</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {item.product_sku || "-"}
                      </TableCell>
                      <TableCell>{item.size || "-"}</TableCell>
                      <TableCell>{item.color || "-"}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ₹{Number(item.unit_price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(item.total_price).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(order.subtotal).toLocaleString()}</span>
                </div>
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                {order.tax_amount && order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{Number(order.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                {order.shipping_amount && order.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>₹{Number(order.shipping_amount).toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(e.target.value)}
                        className="w-32 text-right"
                      />
                      <Button size="sm" onClick={handleSaveAmount} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedAmount(order.total_amount.toString());
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{Number(order.total_amount).toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <Label className="text-muted-foreground">Notes</Label>
                <p className="mt-1">{order.notes}</p>
              </div>
            )}

            {/* Salesman */}
            {order.salesman && (
              <div className="text-sm text-muted-foreground">
                Handled by: <span className="font-medium">{order.salesman.name}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleDownloadInvoice}>
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Order not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
