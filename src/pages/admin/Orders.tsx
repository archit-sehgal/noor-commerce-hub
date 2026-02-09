import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderDetailDialog from "@/components/admin/OrderDetailDialog";
import EditOrderDialog from "@/components/admin/EditOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, ShoppingCart, Eye, Store, Globe, ChevronDown, ChevronUp, Package, Download, CalendarIcon, X, Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  discount_amount: number | null;
  tax_amount: number | null;
  shipping_amount: number | null;
  created_at: string;
  order_source: string | null;
  needs_alteration: boolean | null;
  alteration_status: string | null;
  notes: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  salesman?: {
    name: string;
  };
  order_items?: OrderItem[];
}

interface ExchangeProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Delete order state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deletePasscode, setDeletePasscode] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Exchange order state
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeStep, setExchangeStep] = useState(1);
  const [exchangeOrderSearch, setExchangeOrderSearch] = useState("");
  const [exchangeOrder, setExchangeOrder] = useState<Order | null>(null);
  const [exchangeSelectedItems, setExchangeSelectedItems] = useState<Set<string>>(new Set());
  const [exchangeNewProducts, setExchangeNewProducts] = useState<{ product: ExchangeProduct; quantity: number }[]>([]);
  const [allProducts, setAllProducts] = useState<ExchangeProduct[]>([]);
  const [exchangeProductSearch, setExchangeProductSearch] = useState("");
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name, email, phone),
          salesman:salesman(name),
          order_items(id, product_name, product_sku, quantity, unit_price, total_price, size, color, product_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: "pending" | "paid" | "failed" | "refunded") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: paymentStatus })
        .eq("id", orderId);

      if (error) throw error;

      await supabase
        .from("invoices")
        .update({ payment_status: paymentStatus })
        .eq("order_id", orderId);

      fetchOrders();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Delete order with inventory restoration
  const handleDeleteOrder = async () => {
    if (deletePasscode !== "2486") {
      toast({ title: "Error", description: "Incorrect passcode", variant: "destructive" });
      return;
    }
    if (!deleteOrderId) return;

    setDeleting(true);
    try {
      const order = orders.find(o => o.id === deleteOrderId);
      if (!order) throw new Error("Order not found");

      // Restore inventory for each item
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();

            if (product) {
              await supabase
                .from("products")
                .update({ stock_quantity: product.stock_quantity + item.quantity })
                .eq("id", item.product_id);
            }
          }
        }
      }

      // Reverse customer stats
      if (order.customer) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("id, total_orders, total_spent")
          .eq("name", order.customer.name)
          .single();

        if (customerData) {
          await supabase
            .from("customers")
            .update({
              total_orders: Math.max(0, (customerData.total_orders || 0) - 1),
              total_spent: Math.max(0, Number(customerData.total_spent || 0) - Number(order.total_amount)),
            })
            .eq("id", customerData.id);
        }
      }

      // Reverse salesman stats
      if (order.salesman) {
        const { data: salesmanData } = await supabase
          .from("salesman")
          .select("id, total_orders, total_sales")
          .eq("name", order.salesman.name)
          .single();

        if (salesmanData) {
          await supabase
            .from("salesman")
            .update({
              total_orders: Math.max(0, (salesmanData.total_orders || 0) - 1),
              total_sales: Math.max(0, Number(salesmanData.total_sales || 0) - Number(order.total_amount)),
            })
            .eq("id", salesmanData.id);
        }
      }

      // Delete stock history for this order
      await supabase.from("stock_history").delete().eq("reference_id", deleteOrderId);
      // Delete invoice
      await supabase.from("invoices").delete().eq("order_id", deleteOrderId);
      // Delete order items
      await supabase.from("order_items").delete().eq("order_id", deleteOrderId);
      // Delete order
      await supabase.from("orders").delete().eq("id", deleteOrderId);

      toast({ title: "Success", description: "Order deleted and inventory restored" });
      setDeleteDialogOpen(false);
      setDeletePasscode("");
      setDeleteOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Exchange order logic
  const openExchangeDialog = () => {
    setExchangeDialogOpen(true);
    setExchangeStep(1);
    setExchangeOrderSearch("");
    setExchangeOrder(null);
    setExchangeSelectedItems(new Set());
    setExchangeNewProducts([]);
    setExchangeProductSearch("");
    fetchAllProducts();
  };

  const fetchAllProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, price, discount_price, stock_quantity")
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .order("name");
    setAllProducts(data || []);
  };

  const selectExchangeOrder = (order: Order) => {
    setExchangeOrder(order);
    if (order.order_items && order.order_items.length === 1) {
      // Auto-select if single item
      setExchangeSelectedItems(new Set([order.order_items[0].id]));
      setExchangeStep(3);
    } else {
      setExchangeStep(2);
    }
  };

  const toggleExchangeItem = (itemId: string) => {
    setExchangeSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectAllExchangeItems = () => {
    if (!exchangeOrder?.order_items) return;
    setExchangeSelectedItems(new Set(exchangeOrder.order_items.map(i => i.id)));
  };

  const addExchangeProduct = (product: ExchangeProduct) => {
    const existing = exchangeNewProducts.find(p => p.product.id === product.id);
    if (existing) {
      setExchangeNewProducts(prev => prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setExchangeNewProducts(prev => [...prev, { product, quantity: 1 }]);
    }
    setExchangeProductSearch("");
  };

  const getExchangeSummary = () => {
    if (!exchangeOrder?.order_items) return { oldTotal: 0, newTotal: 0, difference: 0 };
    const oldTotal = exchangeOrder.order_items
      .filter(i => exchangeSelectedItems.has(i.id))
      .reduce((sum, i) => sum + i.total_price, 0);
    const newTotal = exchangeNewProducts.reduce((sum, p) => sum + (p.product.discount_price || p.product.price) * p.quantity, 0);
    return { oldTotal, newTotal, difference: newTotal - oldTotal };
  };

  const processExchange = async () => {
    if (!exchangeOrder) return;
    setExchanging(true);
    try {
      const selectedItems = exchangeOrder.order_items?.filter(i => exchangeSelectedItems.has(i.id)) || [];

      // 1. Restore inventory for old items
      for (const item of selectedItems) {
        if (item.product_id) {
          const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
          if (product) {
            await supabase.from("products").update({ stock_quantity: product.stock_quantity + item.quantity }).eq("id", item.product_id);
          }
        }
      }

      // 2. Deduct inventory for new items
      for (const { product, quantity } of exchangeNewProducts) {
        const { data: currentProduct } = await supabase.from("products").select("stock_quantity").eq("id", product.id).single();
        if (currentProduct) {
          await supabase.from("products").update({ stock_quantity: currentProduct.stock_quantity - quantity }).eq("id", product.id);
        }
      }

      // 3. Delete old order items
      for (const item of selectedItems) {
        await supabase.from("order_items").delete().eq("id", item.id);
      }

      // 4. Insert new order items
      const newItems = exchangeNewProducts.map(p => ({
        order_id: exchangeOrder.id,
        product_id: p.product.id,
        product_name: p.product.name,
        product_sku: p.product.sku || null,
        quantity: p.quantity,
        unit_price: p.product.discount_price || p.product.price,
        total_price: (p.product.discount_price || p.product.price) * p.quantity,
      }));
      if (newItems.length > 0) {
        await supabase.from("order_items").insert(newItems);
      }

      // 5. Update order totals
      const { oldTotal, newTotal, difference } = getExchangeSummary();
      const newOrderTotal = Number(exchangeOrder.total_amount) + difference;
      const newSubtotal = Number(exchangeOrder.subtotal) + difference;
      
      await supabase.from("orders").update({
        total_amount: Math.max(0, newOrderTotal),
        subtotal: Math.max(0, newSubtotal),
        notes: (exchangeOrder.notes || '') + ` | Exchange: returned ${selectedItems.map(i => i.product_name).join(', ')} → added ${exchangeNewProducts.map(p => p.product.name).join(', ')}`,
      }).eq("id", exchangeOrder.id);

      // Update invoice
      await supabase.from("invoices").update({
        total_amount: Math.max(0, newOrderTotal),
        subtotal: Math.max(0, newSubtotal),
      }).eq("order_id", exchangeOrder.id);

      toast({ title: "Exchange Completed", description: difference > 0 ? `Customer needs to pay ₹${difference.toLocaleString()} more` : difference < 0 ? `Customer gets ₹${Math.abs(difference).toLocaleString()} back` : "Even exchange - no balance" });
      setExchangeDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Exchange error:", error);
      toast({ title: "Error", description: "Exchange failed", variant: "destructive" });
    } finally {
      setExchanging(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Helper to detect payment method from notes
  const getPaymentMethodFromNotes = (notes: string | null) => {
    const n = (notes || '').toLowerCase();
    if (n.includes('- credit')) return 'credit';
    if (n.includes('- double')) return 'double';
    if (n.includes('- card') || n.includes('- card/upi')) return 'card';
    return 'cash';
  };

  // Helper to filter by date only (for stats)
  const filterByDate = (orderList: Order[]) => {
    return orderList.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (dateFrom && dateTo) {
        return isWithinInterval(orderDate, {
          start: startOfDay(dateFrom),
          end: endOfDay(dateTo),
        });
      } else if (dateFrom) {
        return orderDate >= startOfDay(dateFrom);
      } else if (dateTo) {
        return orderDate <= endOfDay(dateTo);
      }
      return true;
    });
  };

  const dateFilteredOrders = filterByDate(orders);
  const onlineOrders = dateFilteredOrders.filter((o) => o.order_source === 'online');
  const posOrders = dateFilteredOrders.filter((o) => o.order_source !== 'online');

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      // Payment method filter (cash/credit from notes)
      let matchesPayment = true;
      if (paymentFilter === "cash") {
        matchesPayment = getPaymentMethodFromNotes(order.notes) === 'cash';
      } else if (paymentFilter === "credit") {
        matchesPayment = getPaymentMethodFromNotes(order.notes) === 'credit';
      } else if (paymentFilter === "card") {
        matchesPayment = getPaymentMethodFromNotes(order.notes) === 'card' || getPaymentMethodFromNotes(order.notes) === 'double';
      } else if (paymentFilter === "paid") {
        matchesPayment = order.payment_status === 'paid';
      } else if (paymentFilter === "pending") {
        matchesPayment = order.payment_status === 'pending';
      }

      // Date filter
      const orderDate = new Date(order.created_at);
      let matchesDate = true;
      if (dateFrom && dateTo) {
        matchesDate = isWithinInterval(orderDate, {
          start: startOfDay(dateFrom),
          end: endOfDay(dateTo),
        });
      } else if (dateFrom) {
        matchesDate = orderDate >= startOfDay(dateFrom);
      } else if (dateTo) {
        matchesDate = orderDate <= endOfDay(dateTo);
      }

      return matchesSearch && matchesStatus && matchesDate && matchesPayment;
    });
  };

  const exportToCSV = () => {
    const filtered = filterOrders(orders);
    if (filtered.length === 0) return;
    const headers = ["Customer Name", "Order ID", "Amount", "Date"];
    const csvRows = [headers.join(",")];
    filtered.forEach((order) => {
      const customerName = order.customer?.name || "Walk-in";
      const orderId = order.order_number;
      const amount = order.total_amount;
      const date = format(new Date(order.created_at), "yyyy-MM-dd HH:mm");
      const escapedName = `"${customerName.replace(/"/g, '""')}"`;
      csvRows.push([escapedName, orderId, amount, date].join(","));
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateRange = dateFrom && dateTo
      ? `_${format(dateFrom, "yyyyMMdd")}-${format(dateTo, "yyyyMMdd")}`
      : dateFrom ? `_from_${format(dateFrom, "yyyyMMdd")}` : dateTo ? `_to_${format(dateTo, "yyyyMMdd")}` : "";
    link.setAttribute("download", `orders${dateRange}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearDateFilters = () => { setDateFrom(undefined); setDateTo(undefined); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-purple-100 text-purple-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => `₹${Number(amount).toLocaleString()}`;

  const OrderRow = ({ order }: { order: Order }) => {
    const isExpanded = expandedOrders.has(order.id);
    const skuList = order.order_items?.map(item => item.product_sku).filter(Boolean).join(", ") || "-";
    
    return (
      <>
        <TableRow className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
          <TableCell>
            <div className="flex items-center gap-2">
              {isExpanded ? <ChevronUp className="h-4 w-4 text-foreground" /> : <ChevronDown className="h-4 w-4 text-foreground" />}
              <span className="font-medium text-sm">{order.order_number}</span>
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <span className="font-mono text-xs text-muted-foreground max-w-[150px] truncate block" title={skuList}>{skuList}</span>
          </TableCell>
          <TableCell>
            <div>
              <p className="text-sm font-medium">{order.customer?.name || "Walk-in"}</p>
              <p className="text-xs text-foreground">{order.customer?.phone || order.customer?.email || "-"}</p>
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell text-sm">{format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
          <TableCell className="hidden md:table-cell text-sm">{order.order_items?.length || 0} items</TableCell>
          <TableCell className="font-bold text-gold">{formatCurrency(order.total_amount)}</TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Select value={order.payment_status} onValueChange={(value: "pending" | "paid" | "failed" | "refunded") => updatePaymentStatus(order.id, value)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusColor(order.payment_status)}`}>{order.payment_status}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Select value={order.status} onValueChange={(value: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled") => updateOrderStatus(order.id, value)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setEditOrderId(order.id); setEditDialogOpen(true); }} title="Edit Order">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedOrderId(order.id); setDetailDialogOpen(true); }} title="View Details">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setDeleteOrderId(order.id); setDeleteDialogOpen(true); }} title="Delete Order" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow className="bg-muted/30">
            <TableCell colSpan={9} className="p-0">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-foreground text-xs">Subtotal</p><p className="font-medium">{formatCurrency(order.subtotal)}</p></div>
                  <div><p className="text-foreground text-xs">Discount</p><p className="font-medium text-green-600">-{formatCurrency(order.discount_amount || 0)}</p></div>
                  <div><p className="text-foreground text-xs">Tax (GST Incl.)</p><p className="font-medium">Included</p></div>
                  <div><p className="text-foreground text-xs">Shipping</p><p className="font-medium">{formatCurrency(order.shipping_amount || 0)}</p></div>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-medium">Product</th>
                          <th className="text-left py-2 px-3 text-xs font-medium">SKU</th>
                          <th className="text-center py-2 px-3 text-xs font-medium">Size/Color</th>
                          <th className="text-center py-2 px-3 text-xs font-medium">Qty</th>
                          <th className="text-right py-2 px-3 text-xs font-medium">Price</th>
                          <th className="text-right py-2 px-3 text-xs font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items.map((item) => (
                          <tr key={item.id} className="border-t border-border/50">
                            <td className="py-2 px-3 font-medium">{item.product_name}</td>
                            <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{item.product_sku || "-"}</td>
                            <td className="py-2 px-3 text-center text-foreground">{[item.size, item.color].filter(Boolean).join(" / ") || "-"}</td>
                            <td className="py-2 px-3 text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {order.salesman && (<div><span className="text-foreground">Salesman:</span><span className="ml-1 font-medium">{order.salesman.name}</span></div>)}
                  {order.needs_alteration && (<Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Alteration: {order.alteration_status}</Badge>)}
                  {order.shipping_address && (<div><span className="text-foreground">Ship to:</span><span className="ml-1">{order.shipping_address}, {order.shipping_city}</span></div>)}
                </div>
                {order.notes && (<div className="text-sm"><span className="text-foreground">Notes:</span><span className="ml-1">{order.notes}</span></div>)}
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  const OrdersTable = ({ orders: orderList, emptyMessage }: { orders: Order[], emptyMessage: string }) => {
    const filtered = filterOrders(orderList);
    if (filtered.length === 0) {
      return (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <Package className="h-12 w-12 text-foreground mx-auto mb-4" />
          <p className="text-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <>
        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {filtered.map((order) => (
            <Collapsible key={order.id} open={expandedOrders.has(order.id)} onOpenChange={() => toggleExpand(order.id)}>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{order.order_number}</p>
                        <p className="text-xs text-foreground">{format(new Date(order.created_at), "MMM dd, HH:mm")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gold">{formatCurrency(order.total_amount)}</span>
                        {expandedOrders.has(order.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{order.customer?.name || "Walk-in"}</span>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusColor(order.payment_status)}`}>{order.payment_status}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border p-4 space-y-3 bg-muted/20">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditOrderId(order.id); setEditDialogOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedOrderId(order.id); setDetailDialogOpen(true); }}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setDeleteOrderId(order.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead className="hidden md:table-cell">SKU(s)</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  // Calculate revenue only from paid orders
  const todayPaidRevenue = orders
    .filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString() && o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const filteredPaidRevenue = dateFilteredOrders
    .filter(o => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <AdminLayout title="Orders">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-foreground">Online Orders</span>
          </div>
          <p className="text-2xl font-display font-bold">{onlineOrders.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-4 w-4 text-green-500" />
            <span className="text-sm text-foreground">Walk-in Orders</span>
          </div>
          <p className="text-2xl font-display font-bold">{posOrders.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-foreground">Pending</span>
          </div>
          <p className="text-2xl font-display font-bold text-yellow-600">
            {dateFilteredOrders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-foreground">
              {dateFrom || dateTo ? "Filtered Revenue (Paid)" : "Today's Revenue (Paid)"}
            </span>
          </div>
          <p className="text-2xl font-display font-bold text-gold">
            {formatCurrency(dateFrom || dateTo ? filteredPaidRevenue : todayPaidRevenue)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Payment filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Payment Pending</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card/UPI</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="icon" onClick={clearDateFilters}><X className="h-4 w-4" /></Button>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <Button onClick={openExchangeDialog} variant="outline" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Exchange Order
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Tabs */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              All Orders <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="online" className="gap-2">
              <Globe className="h-4 w-4" /> Online
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">{onlineOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pos" className="gap-2">
              <Store className="h-4 w-4" /> Walk-in (POS)
              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">{posOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all"><OrdersTable orders={orders} emptyMessage="No orders found" /></TabsContent>
          <TabsContent value="online"><OrdersTable orders={onlineOrders} emptyMessage="No online orders yet" /></TabsContent>
          <TabsContent value="pos"><OrdersTable orders={posOrders} emptyMessage="No walk-in orders yet" /></TabsContent>
        </Tabs>
      )}

      {/* Order Detail Dialog */}
      <OrderDetailDialog orderId={selectedOrderId} open={detailDialogOpen} onOpenChange={setDetailDialogOpen} onOrderUpdated={fetchOrders} />
      <EditOrderDialog orderId={editOrderId} open={editDialogOpen} onOpenChange={setEditDialogOpen} onOrderUpdated={fetchOrders} />

      {/* Delete Order Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) { setDeletePasscode(""); setDeleteOrderId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive">Delete Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the order, restore inventory, and reverse all related stats. Enter passcode to confirm.
          </p>
          <Input
            type="password"
            placeholder="Enter passcode..."
            value={deletePasscode}
            onChange={(e) => setDeletePasscode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDeleteOrder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange Order Dialog */}
      <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" /> Exchange Order
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Select order */}
          {exchangeStep === 1 && (
            <div className="space-y-4">
              <Label>Search order by number or customer name</Label>
              <Input placeholder="Order number or customer..." value={exchangeOrderSearch} onChange={(e) => setExchangeOrderSearch(e.target.value)} />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {orders
                  .filter(o => exchangeOrderSearch && (o.order_number.toLowerCase().includes(exchangeOrderSearch.toLowerCase()) || o.customer?.name?.toLowerCase().includes(exchangeOrderSearch.toLowerCase())))
                  .slice(0, 10)
                  .map(order => (
                    <button key={order.id} onClick={() => selectExchangeOrder(order)} className="w-full p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">{order.order_number}</span>
                        <span className="font-bold text-gold">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.customer?.name || "Walk-in"} • {order.order_items?.length || 0} items</p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Step 2: Select items to exchange */}
          {exchangeStep === 2 && exchangeOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Select articles to exchange</Label>
                <Button variant="link" size="sm" onClick={selectAllExchangeItems}>Select All</Button>
              </div>
              <div className="space-y-2">
                {exchangeOrder.order_items?.map(item => (
                  <label key={item.id} className={cn("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors", exchangeSelectedItems.has(item.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                    <input type="checkbox" checked={exchangeSelectedItems.has(item.id)} onChange={() => toggleExchangeItem(item.id)} className="h-4 w-4 rounded border-border accent-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product_sku || "-"} • Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(item.total_price)}</span>
                  </label>
                ))}
              </div>
              <Button onClick={() => setExchangeStep(3)} disabled={exchangeSelectedItems.size === 0} className="w-full">
                Next — Select Replacement Products
              </Button>
            </div>
          )}

          {/* Step 3: Select new products */}
          {exchangeStep === 3 && (
            <div className="space-y-4">
              <Label>Add replacement products</Label>
              <Input placeholder="Search products..." value={exchangeProductSearch} onChange={(e) => setExchangeProductSearch(e.target.value)} />
              {exchangeProductSearch && (
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(exchangeProductSearch.toLowerCase()) || p.sku?.toLowerCase().includes(exchangeProductSearch.toLowerCase()))
                    .slice(0, 8)
                    .map(product => (
                      <button key={product.id} onClick={() => addExchangeProduct(product)} className="w-full p-2 text-left hover:bg-muted/50 text-sm border-b last:border-0">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">SKU: {product.sku || "-"}</span>
                        <span className="float-right font-medium">{formatCurrency(product.discount_price || product.price)}</span>
                      </button>
                    ))}
                </div>
              )}

              {exchangeNewProducts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">New Products:</p>
                  {exchangeNewProducts.map((p, i) => (
                    <div key={p.product.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.product.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.product.discount_price || p.product.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setExchangeNewProducts(prev => prev.map((x, j) => j === i ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}>-</Button>
                        <span className="w-8 text-center text-sm">{p.quantity}</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setExchangeNewProducts(prev => prev.map((x, j) => j === i ? { ...x, quantity: x.quantity + 1 } : x))}>+</Button>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setExchangeNewProducts(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {exchangeNewProducts.length > 0 && (() => {
                const { oldTotal, newTotal, difference } = getExchangeSummary();
                return (
                  <div className="p-3 bg-muted/30 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between"><span>Returned items value:</span><span>{formatCurrency(oldTotal)}</span></div>
                    <div className="flex justify-between"><span>New items value:</span><span>{formatCurrency(newTotal)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>{difference > 0 ? "Customer Pays:" : difference < 0 ? "Customer Gets Back:" : "Even Exchange"}</span>
                      <span className={difference > 0 ? "text-red-600" : difference < 0 ? "text-green-600" : ""}>{difference !== 0 ? formatCurrency(Math.abs(difference)) : "₹0"}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setExchangeStep(exchangeOrder?.order_items && exchangeOrder.order_items.length > 1 ? 2 : 1)} className="flex-1">Back</Button>
                <Button onClick={processExchange} disabled={exchangeNewProducts.length === 0 || exchanging} className="flex-1">
                  {exchanging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Process Exchange
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
