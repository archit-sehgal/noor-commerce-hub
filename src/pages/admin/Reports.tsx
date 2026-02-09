import { useEffect, useState } from "react";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package, ArrowUpRight, Percent, Target, Calendar, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  online: number;
  pos: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  orders: number;
  spent: number;
}

interface CategorySales {
  name: string;
  value: number;
}

const COLORS = ['hsl(38, 75%, 52%)', 'hsl(15, 55%, 60%)', 'hsl(160, 45%, 35%)', 'hsl(220, 35%, 25%)', 'hsl(350, 55%, 45%)'];

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [dateRangeFrom, setDateRangeFrom] = useState<Date | undefined>(undefined);
  const [dateRangeTo, setDateRangeTo] = useState<Date | undefined>(undefined);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    newCustomers: 0,
    onlineRevenue: 0,
    posRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    conversionRate: 0,
    repeatCustomerRate: 0,
    cashRevenue: 0,
    cardUpiRevenue: 0,
    creditRevenue: 0,
  });
  const [previousPeriod, setPreviousPeriod] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [period, customDate, dateRangeFrom, dateRangeTo]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date | null = null;
      
      if (period === "range" && dateRangeFrom) {
        startDate = new Date(dateRangeFrom);
        startDate.setHours(0, 0, 0, 0);
        if (dateRangeTo) {
          endDate = new Date(dateRangeTo);
          endDate.setHours(23, 59, 59, 999);
        }
      } else if (period === "custom" && customDate) {
        startDate = new Date(customDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const daysAgo = parseInt(period);
        startDate = new Date();
        if (daysAgo === 0) {
          startDate.setHours(0, 0, 0, 0);
        } else {
          startDate.setDate(startDate.getDate() - daysAgo);
        }
      }

      const daysAgo = period === "custom" || period === "range" ? 1 : parseInt(period);
      const prevStartDate = new Date();
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo * 2);

      // Fetch orders for the period
      let ordersQuery = supabase
        .from("orders")
        .select("id, total_amount, created_at, customer_id, order_source, status, notes, payment_status")
        .gte("created_at", startDate.toISOString());
      if (endDate) ordersQuery = ordersQuery.lte("created_at", endDate.toISOString());
      const { data: orders } = await ordersQuery;

      // Fetch previous period orders for comparison
      const { data: prevOrders } = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      // Calculate summary - only count paid orders as revenue
      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const onlineRevenue = paidOrders.filter(o => o.order_source === 'online').reduce((sum, o) => sum + Number(o.total_amount), 0);
      const posRevenue = paidOrders.filter(o => o.order_source !== 'online').reduce((sum, o) => sum + Number(o.total_amount), 0);
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

      // Calculate payment method breakdowns from notes
      let cashRevenue = 0;
      let cardUpiRevenue = 0;
      let creditRevenue = 0;
      orders?.forEach((o) => {
        const amount = Number(o.total_amount);
        const notesLower = (o.notes || '').toLowerCase();
        if (notesLower.includes('- double') || notesLower.includes('- double ')) {
          // Double/split payment — parse cash and card amounts from notes
          const cashMatch = notesLower.match(/cash:\s*₹?([\d,]+)/);
          const cardMatch = notesLower.match(/card\/upi:\s*₹?([\d,]+)/);
          cashRevenue += cashMatch ? Number(cashMatch[1].replace(/,/g, '')) : 0;
          cardUpiRevenue += cardMatch ? Number(cardMatch[1].replace(/,/g, '')) : 0;
        } else if (notesLower.includes('- credit')) {
          creditRevenue += amount;
        } else if (notesLower.includes('- card') || notesLower.includes('- card/upi')) {
          cardUpiRevenue += amount;
        } else {
          // Default to cash (includes "- cash" and legacy orders)
          cashRevenue += amount;
        }
      });

      // Fetch new customers
      const { data: newCustomersData } = await supabase
        .from("customers")
        .select("id")
        .gte("created_at", startDate.toISOString());

      // Fetch all customers
      const { data: allCustomers } = await supabase
        .from("customers")
        .select("id, total_orders");

      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("id, stock_quantity, min_stock_alert");

      const lowStockProducts = products?.filter(p => p.stock_quantity <= (p.min_stock_alert || 10)).length || 0;
      
      // Calculate repeat customer rate
      const repeatCustomers = allCustomers?.filter(c => (c.total_orders || 0) > 1).length || 0;
      const repeatCustomerRate = allCustomers && allCustomers.length > 0 ? (repeatCustomers / allCustomers.length) * 100 : 0;

      setPreviousPeriod({
        revenue: prevOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
        orders: prevOrders?.length || 0,
        customers: 0,
      });

      setSummary({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        newCustomers: newCustomersData?.length || 0,
        onlineRevenue,
        posRevenue,
        pendingOrders,
        totalProducts: products?.length || 0,
        lowStockProducts,
        totalCustomers: allCustomers?.length || 0,
        conversionRate: 12.5,
        repeatCustomerRate,
        cashRevenue,
        cardUpiRevenue,
        creditRevenue,
      });

      // Group sales by date with source breakdown
      const salesByDate: Record<string, { revenue: number; orders: number; online: number; pos: number }> = {};
      orders?.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!salesByDate[date]) {
          salesByDate[date] = { revenue: 0, orders: 0, online: 0, pos: 0 };
        }
        const amount = Number(order.total_amount);
        salesByDate[date].revenue += amount;
        salesByDate[date].orders += 1;
        if (order.order_source === 'online') {
          salesByDate[date].online += amount;
        } else {
          salesByDate[date].pos += amount;
        }
      });

      setSalesData(
        Object.entries(salesByDate).map(([date, data]) => ({
          date,
          ...data,
        }))
      );

      // Fetch top products with category
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, total_price, product_id");

      const productStats: Record<string, { quantity: number; revenue: number }> = {};
      orderItems?.forEach((item) => {
        if (!productStats[item.product_name]) {
          productStats[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productStats[item.product_name].quantity += item.quantity;
        productStats[item.product_name].revenue += Number(item.total_price);
      });

      setTopProducts(
        Object.entries(productStats)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );

      // Fetch category-wise sales
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name");

      const { data: productCategories } = await supabase
        .from("products")
        .select("id, category_id");

      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);
      const productCategoryMap = new Map(productCategories?.map(p => [p.id, p.category_id]) || []);

      const categorySalesMap: Record<string, number> = {};
      orderItems?.forEach((item) => {
        const categoryId = productCategoryMap.get(item.product_id || '');
        const categoryName = categoryId ? categoryMap.get(categoryId) : 'Uncategorized';
        if (categoryName) {
          categorySalesMap[categoryName] = (categorySalesMap[categoryName] || 0) + Number(item.total_price);
        }
      });

      setCategorySales(
        Object.entries(categorySalesMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // Fetch top customers
      const { data: customers } = await supabase
        .from("customers")
        .select("name, total_orders, total_spent")
        .order("total_spent", { ascending: false })
        .limit(5);

      setTopCustomers(
        customers?.map((c) => ({
          name: c.name,
          orders: c.total_orders || 0,
          spent: Number(c.total_spent) || 0,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(summary.totalRevenue, previousPeriod.revenue);
  const ordersGrowth = calculateGrowth(summary.totalOrders, previousPeriod.orders);

  const exportToCSV = () => {
    const headers = ["Date", "Revenue", "Orders", "Online Revenue", "POS Revenue"];
    const rows = salesData.map((d) => [d.date, d.revenue, d.orders, d.online, d.pos]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${period}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  if (loading) {
    return (
      <AdminLayout title="Analytics & Reports">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics & Reports">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={period} onValueChange={(v) => {
            setPeriod(v);
            if (v !== "custom") setCustomDate(undefined);
            if (v !== "range") { setDateRangeFrom(undefined); setDateRangeTo(undefined); }
          }}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="custom">Pick a date</SelectItem>
              <SelectItem value="range">Date Range</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !customDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {customDate ? format(customDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={customDate} onSelect={setCustomDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          )}

          {period === "range" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateRangeFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRangeFrom ? format(dateRangeFrom, "MMM dd, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateRangeFrom} onSelect={setDateRangeFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateRangeTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRangeTo ? format(dateRangeTo, "MMM dd, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateRangeTo} onSelect={setDateRangeTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-gold" />
              <div className={`flex items-center text-xs font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-display font-bold">{formatCurrency(summary.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div className={`flex items-center text-xs font-medium ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ordersGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(ordersGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
            <p className="text-2xl font-display font-bold">{summary.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-500" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
            <p className="text-2xl font-display font-bold">{formatCurrency(summary.avgOrderValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+{summary.newCustomers}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">New Customers</p>
            <p className="text-2xl font-display font-bold">{summary.totalCustomers}</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-blue-700 mb-1">Online Revenue</p>
            <p className="text-xl font-display font-bold text-blue-700">{formatCurrency(summary.onlineRevenue)}</p>
            <p className="text-xs text-blue-600 mt-1">
              {summary.totalRevenue > 0 ? ((summary.onlineRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-green-700 mb-1">Walk-in Revenue</p>
            <p className="text-xl font-display font-bold text-green-700">{formatCurrency(summary.posRevenue)}</p>
            <p className="text-xs text-green-600 mt-1">
              {summary.totalRevenue > 0 ? ((summary.posRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50/50 border-yellow-100">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-yellow-700 mb-1">Pending Orders</p>
            <p className="text-xl font-display font-bold text-yellow-700">{summary.pendingOrders}</p>
            <p className="text-xs text-yellow-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-red-700 mb-1">Low Stock Items</p>
            <p className="text-xl font-display font-bold text-red-700">{summary.lowStockProducts}</p>
            <p className="text-xs text-red-600 mt-1">of {summary.totalProducts} products</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 3: Payment Method Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-emerald-700">Cash Payments</p>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl font-display font-bold text-emerald-700">{formatCurrency(summary.cashRevenue)}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {summary.totalRevenue > 0 ? ((summary.cashRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-indigo-700">Card/UPI Payments</p>
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-xl font-display font-bold text-indigo-700">{formatCurrency(summary.cardUpiRevenue)}</p>
            <p className="text-xs text-indigo-600 mt-1">
              {summary.totalRevenue > 0 ? ((summary.cardUpiRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 border-orange-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-orange-700">Credit (Pay Later)</p>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-xl font-display font-bold text-orange-700">{formatCurrency(summary.creditRevenue)}</p>
            <p className="text-xs text-orange-600 mt-1">
              {summary.totalRevenue > 0 ? ((summary.creditRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(38, 75%, 52%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(38, 75%, 52%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(38, 75%, 52%)" fill="url(#colorRevenue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Channel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Revenue by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="online" name="Online" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pos" name="Walk-in" fill="hsl(160, 50%, 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category & Customer Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Sales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {categorySales.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySales}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categorySales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold/10 text-gold text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(product.revenue)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                {topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.name} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-rose-gold/10 text-rose-gold text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(customer.spent)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Daily Orders & Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(38, 75%, 52%)" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(220, 70%, 55%)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(38, 75%, 52%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="hsl(220, 70%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="revenue" fill="hsl(38, 75%, 52%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <Package className="h-6 w-6 text-green-600 mb-2" />
                      <p className="text-2xl font-display font-bold text-green-700">{summary.totalProducts - summary.lowStockProducts}</p>
                      <p className="text-sm text-green-600">In Stock</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <Package className="h-6 w-6 text-red-600 mb-2" />
                      <p className="text-2xl font-display font-bold text-red-700">{summary.lowStockProducts}</p>
                      <p className="text-sm text-red-600">Low Stock</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Stock Health</span>
                      <span className="font-medium">
                        {((summary.totalProducts - summary.lowStockProducts) / summary.totalProducts * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${((summary.totalProducts - summary.lowStockProducts) / summary.totalProducts * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-10 w-10 text-gold mx-auto mb-4" />
                  <p className="text-4xl font-display font-bold">{summary.totalCustomers}</p>
                  <p className="text-muted-foreground">Total Customers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Percent className="h-10 w-10 text-rose-gold mx-auto mb-4" />
                  <p className="text-4xl font-display font-bold">{summary.repeatCustomerRate.toFixed(1)}%</p>
                  <p className="text-muted-foreground">Repeat Customer Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-10 w-10 text-green-500 mx-auto mb-4" />
                  <p className="text-4xl font-display font-bold">{summary.newCustomers}</p>
                  <p className="text-muted-foreground">New This Period</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Top Customers by Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {topCustomers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="spent" name="Total Spent" fill="hsl(15, 55%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminReports;
