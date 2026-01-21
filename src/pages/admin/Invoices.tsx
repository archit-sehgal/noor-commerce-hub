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
import { Search, Printer, Eye, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    const printContent = document.getElementById("invoice-view-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${selectedInvoice?.invoice_number}</title>
              <style>
                body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 20px; margin-bottom: 20px; }
                .header h1 { color: #8B4513; margin: 0; font-size: 28px; }
                .header p { margin: 5px 0; color: #666; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #8B4513; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                .totals { text-align: right; margin-top: 20px; }
                .totals div { margin: 5px 0; }
                .totals .total { font-size: 24px; color: #8B4513; font-weight: bold; }
                .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
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
          <p className="text-sm text-muted-foreground">Total Invoices</p>
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
          <p className="text-sm text-muted-foreground">Total Revenue</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No invoices found</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
                VASTRA ELEGANCE
              </h1>
              <p className="text-sm text-muted-foreground">
                Premium Ethnic Fashion
              </p>
              <p className="text-xs text-muted-foreground">
                123 Fashion Street, Mumbai - 400001
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
                  <p className="text-muted-foreground">Walk-in Customer</p>
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
                          <p className="text-xs text-muted-foreground">
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
                <span className="text-muted-foreground">Subtotal:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(selectedInvoice?.subtotal || 0)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Tax:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(selectedInvoice?.tax_amount || 0)}
                </span>
              </p>
              {(selectedInvoice?.discount_amount || 0) > 0 && (
                <p>
                  <span className="text-muted-foreground">Discount:</span>{" "}
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
    </AdminLayout>
  );
};

export default AdminInvoices;
