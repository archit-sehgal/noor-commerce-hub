import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Search, Printer, Eye, Loader2, FileText, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditInvoiceDialog from "@/components/admin/EditInvoiceDialog";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string | null;
  customer_id: string | null;
  subtotal: number;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
  payment_status: string;
  created_at: string;
  customer?: { name: string; phone: string | null; email: string | null } | null;
  order?: { order_number: string; status: string } | null;
}

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

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customers(name, phone, email),
          orders(order_number, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvoices(
        data?.map((inv) => ({
          ...inv,
          customer: inv.customers as any,
          order: inv.orders as any,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (!error && data) {
      setOrderItems(data);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.order_id) {
      await fetchOrderItems(invoice.order_id);
    }
    setDialogOpen(true);
  };

  const updatePaymentStatus = async (invoiceId: string, status: "pending" | "paid" | "failed" | "refunded") => {
    try {
      // Find the invoice to get its order_id
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      
      // Update invoice payment status
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ payment_status: status })
        .eq("id", invoiceId);

      if (invoiceError) throw invoiceError;

      // If invoice is linked to an order, update the order's payment status too
      if (invoice?.order_id) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ payment_status: status })
          .eq("id", invoice.order_id);

        if (orderError) {
          console.error("Error updating order payment status:", orderError);
        }
      }

      toast({ title: "Success", description: "Payment status updated" });
      fetchInvoices();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const printInvoice = () => {
    if (!selectedInvoice) return;

    const itemsHtml = orderItems.map(item => {
      const gross = item.unit_price * item.quantity;
      const discPercent = gross > 0 ? Math.round(((gross - item.total_price) / gross) * 100) : 0;
      return `
        <tr>
          <td>${item.product_name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
          <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product_sku || "-"}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="text-align: center;">${discPercent}%</td>
          <td style="text-align: right;">${formatCurrency(item.total_price)}</td>
        </tr>
      `;
    }).join("");

    const logoUrl = `${window.location.origin}/noor-logo-bill.png`;
    const printContent = `
      <html>
        <head>
          <title>Invoice - ${selectedInvoice.invoice_number}</title>
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
            .col-item { width: 26%; }
            .col-sku { width: 15%; }
            .col-qty { width: 8%; }
            .col-price { width: 17%; }
            .col-disc { width: 10%; }
            .col-net { width: 24%; }
            .totals { text-align: right; margin-top: 15px; color: #000; }
            .totals div { margin: 3px 0; font-weight: 600; color: #000; }
            .totals .total { font-size: 22px; color: #000; font-weight: 900; }
            .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; color: #000; font-weight: 500; }
            .gst-note { font-size: 11px; color: #000; font-style: italic; margin-top: 8px; }
            @media print { body { padding: 5px 10px; margin: 0; } @page { margin: 5px 10px; } }
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
              <p><strong>Invoice No:</strong> ${selectedInvoice.invoice_number}</p>
              <p><strong>Order #:</strong> ${selectedInvoice.order?.order_number || "-"}</p>
              <p><strong>Date:</strong> ${new Date(selectedInvoice.created_at).toLocaleDateString("en-IN")}</p>
              ${selectedInvoice.customer ? `<p><strong>Customer:</strong> ${selectedInvoice.customer.name}</p>` : ""}
            </div>
            <div>
              <p><strong>Payment:</strong> ${selectedInvoice.payment_status.toUpperCase()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-item">Item</th>
                <th class="col-sku" style="text-align: center;">SKU</th>
                <th class="col-qty" style="text-align: center;">Qty</th>
                <th class="col-price" style="text-align: right;">Price</th>
                <th class="col-disc" style="text-align: center;">Disc%</th>
                <th class="col-net" style="text-align: right;">Net</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div>Subtotal: ${formatCurrency(selectedInvoice.subtotal)}</div>
            ${(selectedInvoice.discount_amount || 0) > 0 ? `<div>Total Discount: -${formatCurrency(selectedInvoice.discount_amount || 0)}</div>` : ""}
            <div class="total">Total: ${formatCurrency(selectedInvoice.total_amount)}</div>
            <div class="gst-note">* All prices are inclusive of GST</div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      const img = printWindow.document.querySelector('.logo-section img') as HTMLImageElement;
      const doPrint = () => {
        printWindow.print();
        printWindow.close();
      };
      if (img && img.complete) {
        setTimeout(doPrint, 100);
      } else if (img) {
        img.onload = () => setTimeout(doPrint, 100);
        img.onerror = () => setTimeout(doPrint, 100);
      } else {
        setTimeout(doPrint, 100);
      }
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.order?.order_number?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter !== "all") {
      return matchesSearch && inv.payment_status === statusFilter;
    }
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "refunded":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout title="Invoices">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-background rounded-lg p-4 shadow-sm">
          <p className="text-sm text-foreground">Total Invoices</p>
          <p className="text-2xl font-serif font-bold">{invoices.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-green-700">Paid</p>
          <p className="text-2xl font-serif font-bold text-green-700">
            {invoices.filter((i) => i.payment_status === "paid").length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-serif font-bold text-yellow-700">
            {invoices.filter((i) => i.payment_status === "pending").length}
          </p>
        </div>
        <div className="bg-primary/5 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-foreground">Total Revenue</p>
          <p className="text-2xl font-serif font-bold text-primary">
            {formatCurrency(
              invoices
                .filter((i) => i.payment_status === "paid")
                .reduce((sum, i) => sum + i.total_amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
          <Input
            placeholder="Search by invoice #, customer, or order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-foreground mx-auto mb-4" />
          <p className="text-foreground">No invoices found</p>
        </div>
      ) : (
        <div className="bg-background rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>{invoice.order?.order_number || "-"}</TableCell>
                  <TableCell>
                    {invoice.customer?.name || "Walk-in Customer"}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.created_at).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={invoice.payment_status}
                      onValueChange={(value: "pending" | "paid" | "failed" | "refunded") =>
                        updatePaymentStatus(invoice.id, value)
                      }
                    >
                      <SelectTrigger
                        className={`w-28 h-8 text-xs ${getStatusColor(
                          invoice.payment_status
                        )}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditInvoiceId(invoice.id);
                          setEditDialogOpen(true);
                        }}
                        title="Edit Invoice"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invoice View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center justify-between">
              <span>Invoice Details</span>
              <Button variant="outline" size="sm" onClick={printInvoice}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div id="invoice-view-content" className="p-4">
            <div className="header text-center border-b-2 border-primary pb-4 mb-4">
              <h1 className="text-2xl font-serif font-bold text-primary">
                NOOR CREATIONS
              </h1>
              <p className="text-sm text-muted-foreground">
                Premium Ethnic Wear
              </p>
              <p className="text-xs text-muted-foreground">
                Jammu, J&K
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p>
                  <strong className="text-primary">Invoice #:</strong>{" "}
                  {selectedInvoice?.invoice_number}
                </p>
                <p>
                  <strong className="text-primary">Order #:</strong>{" "}
                  {selectedInvoice?.order?.order_number || "-"}
                </p>
                <p>
                  <strong className="text-primary">Date:</strong>{" "}
                  {selectedInvoice &&
                    new Date(selectedInvoice.created_at).toLocaleDateString(
                      "en-IN"
                    )}
                </p>
              </div>
              <div className="text-right">
                {selectedInvoice?.customer ? (
                  <>
                    <p>
                      <strong className="text-primary">Customer:</strong>{" "}
                      {selectedInvoice.customer.name}
                    </p>
                    {selectedInvoice.customer.phone && (
                      <p>{selectedInvoice.customer.phone}</p>
                    )}
                    {selectedInvoice.customer.email && (
                      <p>{selectedInvoice.customer.email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground">Walk-in Customer</p>
                )}
              </div>
            </div>

            {orderItems.length > 0 && (
              <table className="w-full mb-4">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="p-2">
                        <p className="font-medium">{item.product_name}</p>
                        {(item.size || item.color) && (
                          <p className="text-xs text-foreground">
                            {[item.size, item.color].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="space-y-1 text-right">
              <p>
                <span className="text-foreground">Subtotal:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(selectedInvoice?.subtotal || 0)}
                </span>
              </p>
              <p className="text-xs text-foreground italic">
                * All prices are inclusive of GST
              </p>
              {(selectedInvoice?.discount_amount || 0) > 0 && (
                <p>
                  <span className="text-foreground">Discount:</span>{" "}
                  <span className="font-medium text-green-600">
                    -{formatCurrency(selectedInvoice?.discount_amount || 0)}
                  </span>
                </p>
              )}
              <p className="text-xl font-bold text-primary pt-2 border-t border-border">
                <span>Total:</span>{" "}
                {formatCurrency(selectedInvoice?.total_amount || 0)}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
              <p
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  selectedInvoice?.payment_status || ""
                )}`}
              >
                Payment: {selectedInvoice?.payment_status?.toUpperCase()}
              </p>
              <p className="mt-2">Thank you for shopping with us!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <EditInvoiceDialog
        invoiceId={editInvoiceId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onInvoiceUpdated={fetchInvoices}
      />
    </AdminLayout>
  );
};

export default AdminInvoices;
