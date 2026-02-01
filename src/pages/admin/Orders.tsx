import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderDetailDialog from "@/components/admin/OrderDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, ShoppingCart, Eye, Store, Globe, ChevronDown, ChevronUp, Package, Download, CalendarIcon, X } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
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

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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
          order_items(id, product_name, quantity, unit_price, total_price, size, color)
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

  const onlineOrders = orders.filter((o) => o.order_source === 'online');
  const posOrders = orders.filter((o) => o.order_source !== 'online');

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

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

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const exportToCSV = () => {
    const filtered = filterOrders(orders);
    
    if (filtered.length === 0) {
      return;
    }

    const headers = ["Customer Name", "Order ID", "Amount", "Date"];
    const csvRows = [headers.join(",")];

    filtered.forEach((order) => {
      const customerName = order.customer?.name || "Walk-in";
      const orderId = order.order_number;
      const amount = order.total_amount;
      const date = format(new Date(order.created_at), "yyyy-MM-dd HH:mm");
      
      // Escape values that might contain commas
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
      : dateFrom 
      ? `_from_${format(dateFrom, "yyyyMMdd")}`
      : dateTo
      ? `_to_${format(dateTo, "yyyyMMdd")}`
      : "";
    
    link.setAttribute("download", `orders${dateRange}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

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

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  const OrderRow = ({ order }: { order: Order }) => {
    const isExpanded = expandedOrders.has(order.id);
    
    return (
      <>
        <TableRow className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
          <TableCell>
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground" />
              )}
              <span className="font-medium text-sm">{order.order_number}</span>
            </div>
          </TableCell>
          <TableCell>
            <div>
              <p className="text-sm font-medium">{order.customer?.name || "Walk-in"}</p>
              <p className="text-xs text-foreground">{order.customer?.phone || order.customer?.email || "-"}</p>
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell text-sm">
            {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
          </TableCell>
          <TableCell className="hidden md:table-cell text-sm">
            {order.order_items?.length || 0} items
          </TableCell>
          <TableCell className="font-bold text-gold">
            {formatCurrency(order.total_amount)}
          </TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Select
              value={order.payment_status}
              onValueChange={(value: "pending" | "paid" | "failed" | "refunded") =>
                updatePaymentStatus(order.id, value)
              }
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                  {order.payment_status}
                </span>
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
            <Select
              value={order.status}
              onValueChange={(value: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled") =>
                updateOrderStatus(order.id, value)
              }
            >
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedOrderId(order.id);
                setDetailDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow className="bg-muted/30">
            <TableCell colSpan={8} className="p-0">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-foreground text-xs">Subtotal</p>
                    <p className="font-medium">{formatCurrency(order.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-foreground text-xs">Discount</p>
                    <p className="font-medium text-green-600">-{formatCurrency(order.discount_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-foreground text-xs">Tax</p>
                    <p className="font-medium">{formatCurrency(order.tax_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-foreground text-xs">Shipping</p>
                    <p className="font-medium">{formatCurrency(order.shipping_amount || 0)}</p>
                  </div>
                </div>

                {order.order_items && order.order_items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-medium">Product</th>
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
                            <td className="py-2 px-3 text-center text-foreground">
                              {[item.size, item.color].filter(Boolean).join(" / ") || "-"}
                            </td>
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
                  {order.salesman && (
                    <div>
                      <span className="text-foreground">Salesman:</span>
                      <span className="ml-1 font-medium">{order.salesman.name}</span>
                    </div>
                  )}
                  {order.needs_alteration && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Alteration: {order.alteration_status}
                    </Badge>
                  )}
                  {order.shipping_address && (
                    <div>
                      <span className="text-foreground">Ship to:</span>
                      <span className="ml-1">{order.shipping_address}, {order.shipping_city}</span>
                    </div>
                  )}
                </div>

                {order.notes && (
                  <div className="text-sm">
                    <span className="text-foreground">Notes:</span>
                    <span className="ml-1">{order.notes}</span>
                  </div>
                )}
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
                        <p className="text-xs text-foreground">
                          {format(new Date(order.created_at), "MMM dd, HH:mm")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gold">{formatCurrency(order.total_amount)}</span>
                        {expandedOrders.has(order.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{order.customer?.name || "Walk-in"}</span>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
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
                    <div className="pt-2 border-t flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
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
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-foreground">Today's Revenue</span>
          </div>
          <p className="text-2xl font-display font-bold text-gold">
            {formatCurrency(
              orders
                .filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
                .reduce((sum, o) => sum + Number(o.total_amount), 0)
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
        </div>

        {/* Date Filters & Export */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="icon" onClick={clearDateFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="ml-auto">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
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
              All Orders
              <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="online" className="gap-2">
              <Globe className="h-4 w-4" />
              Online
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">{onlineOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pos" className="gap-2">
              <Store className="h-4 w-4" />
              Walk-in (POS)
              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">{posOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <OrdersTable orders={orders} emptyMessage="No orders found" />
          </TabsContent>
          <TabsContent value="online">
            <OrdersTable orders={onlineOrders} emptyMessage="No online orders yet" />
          </TabsContent>
          <TabsContent value="pos">
            <OrdersTable orders={posOrders} emptyMessage="No walk-in orders yet" />
          </TabsContent>
        </Tabs>
      )}

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        orderId={selectedOrderId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onOrderUpdated={fetchOrders}
      />
    </AdminLayout>
  );
};

export default AdminOrders;
