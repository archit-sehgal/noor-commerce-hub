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
  product_id: string | null;
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

    // Fetch GST rates for items
    const productIds = items.map(i => i.product_id).filter(Boolean) as string[];
    let gstMap: Record<string, number> = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, gst_rate")
        .in("id", productIds);
      if (products) {
        for (const p of products) {
          gstMap[p.id] = p.gst_rate || 0;
        }
      }
    }

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    const itemsHTML = items.map(item => {
      const gross = item.unit_price * item.quantity;
      const discPercent = gross > 0 ? Math.round(((gross - item.total_price) / gross) * 100) : 0;
      const gstRate = item.product_id ? (gstMap[item.product_id] || 0) : 0;
      return `
        <tr>
          <td>${item.product_name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
          <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product_sku || "-"}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="text-align: center;">${gstRate > 0 ? gstRate + "%" : "-"}</td>
          <td style="text-align: center;">${discPercent > 0 ? discPercent + "%" : "-"}</td>
          <td style="text-align: right;">${formatCurrency(item.total_price)}</td>
        </tr>
      `;
    }).join("");

    const logoUrl = `${window.location.origin}/noor-logo-bill.png`;
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.order_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 10px 15px; max-width: 800px; margin: 0 auto; color: #000; transform: scale(0.9); transform-origin: top center; }
    .logo-section { text-align: center; margin-bottom: 2px; padding: 0; }
    .logo-section img { max-width: 160px; height: auto; margin: 0 auto; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
    .header h1 { color: #000; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 3px; }
    .header p { margin: 2px 0; color: #000; font-weight: 600; font-size: 12px; }
    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; color: #000; }
    .invoice-details p { color: #000; font-weight: 500; margin: 2px 0; }
    .invoice-details strong { color: #000; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
    th { background: #000; color: white; padding: 6px 3px; text-align: left; font-weight: 700; font-size: 10px; }
    td { padding: 6px 3px; border-bottom: 2px solid #333; color: #000; font-weight: 600; font-size: 10px; word-wrap: break-word; }
    .col-item { width: 28%; }
    .col-sku { width: 14%; }
    .col-qty { width: 8%; }
    .col-price { width: 15%; }
    .col-gst { width: 8%; }
    .col-disc { width: 8%; }
    .col-net { width: 19%; }
    .totals { text-align: right; margin-top: 15px; color: #000; }
    .totals div { margin: 3px 0; font-weight: 600; color: #000; }
    .totals .total { font-size: 22px; color: #000; font-weight: 900; }
    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; color: #000; font-weight: 500; }
    @media print { @page { margin: 0; } body { margin: 0; padding: 0; max-width: 100%; } .logo-section { margin-top: 0 !important; padding-top: 0 !important; } }
  </style>
</head>
<body>
  <div class="logo-section">
    <img src="${logoUrl}" alt="Noor Creations" onerror="this.style.display='none'" />
  </div>
  <div class="header">
    <h1>NOOR CREATIONS</h1>
    <p>Moti Bazar Parade Jammu, 180001</p>
    <p>Phone: 6006364546</p>
    <p>GSTIN: 01NXZPS2503D1Z8</p>
    <p style="margin-top: 8px; font-size: 16px; font-weight: 900; letter-spacing: 2px;">TAX INVOICE</p>
  </div>
  <div class="invoice-details">
    <div>
      <p><strong>Order No:</strong> ${order.order_number}</p>
      <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString("en-IN")}</p>
      ${order.customer?.name ? `<p><strong>Customer:</strong> ${order.customer.name}</p>` : ""}
      ${order.customer?.phone ? `<p><strong>Phone:</strong> ${order.customer.phone}</p>` : ""}
    </div>
    <div style="text-align: right;">
      <p><strong>Payment:</strong> ${order.payment_status?.toUpperCase() || "N/A"}</p>
      <p><strong>Status:</strong> ${order.status?.toUpperCase() || ""}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="col-item">Item</th>
        <th class="col-sku" style="text-align: center;">SKU</th>
        <th class="col-qty" style="text-align: center;">Qty</th>
        <th class="col-price" style="text-align: right;">Price</th>
        <th class="col-gst" style="text-align: center;">GST%</th>
        <th class="col-disc" style="text-align: center;">Disc%</th>
        <th class="col-net" style="text-align: right;">Net</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>
  <div class="totals">
    <div>Subtotal: ${formatCurrency(order.subtotal)}</div>
    ${(order.discount_amount || 0) > 0 ? `<div>Discount: -${formatCurrency(order.discount_amount || 0)}</div>` : ""}
    <div class="total">Net Total: ${formatCurrency(order.total_amount)}</div>
  </div>
  <div class="footer">
    <p>Thank you for shopping with us!</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      const img = printWindow.document.querySelector(".logo-section img") as HTMLImageElement;
      const doPrint = () => { printWindow.print(); printWindow.close(); };
      if (img && img.complete) {
        setTimeout(doPrint, 100);
      } else if (img) {
        img.onload = () => setTimeout(doPrint, 100);
        img.onerror = () => setTimeout(doPrint, 100);
      } else {
        setTimeout(doPrint, 100);
      }
    } else {
      // Fallback: download as HTML
      const blob = new Blob([invoiceHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.order_number}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Invoice printed",
      description: "The invoice print dialog has been opened",
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
                {/* GST inclusive - no separate tax line */}
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
