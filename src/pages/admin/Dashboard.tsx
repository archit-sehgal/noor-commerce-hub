import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Menu,
  LogOut,
  LayoutDashboard,
  Tags,
  FileText,
  Settings,
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
}

const AdminDashboard = () => {
  const { user, signOut, isAdmin, isSalesStaff } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products count
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        // Fetch orders count
        const { count: ordersCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });

        // Fetch customers count
        const { count: customersCount } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true });

        // Fetch total revenue
        const { data: revenueData } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("payment_status", "paid");

        const totalRevenue = revenueData?.reduce(
          (acc, order) => acc + (Number(order.total_amount) || 0),
          0
        ) || 0;

        // Fetch low stock products
        const { count: lowStockCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .lte("stock_quantity", 5);

        // Fetch pending orders
        const { count: pendingCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalCustomers: customersCount || 0,
          totalRevenue,
          lowStockProducts: lowStockCount || 0,
          pendingOrders: pendingCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin", show: true },
    { name: "Products", icon: Package, href: "/admin/products", show: isAdmin },
    { name: "Categories", icon: Tags, href: "/admin/categories", show: isAdmin },
    { name: "Orders", icon: ShoppingCart, href: "/admin/orders", show: true },
    { name: "Customers", icon: Users, href: "/admin/customers", show: true },
    { name: "Invoices", icon: FileText, href: "/admin/invoices", show: true },
    { name: "Settings", icon: Settings, href: "/admin/settings", show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-charcoal text-cream transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-cream/10">
          <Link to="/" className="block">
            <h1
              className={`font-display font-medium tracking-wide ${
                sidebarOpen ? "text-xl" : "text-sm text-center"
              }`}
            >
              {sidebarOpen ? (
                <>
                  NOOR <span className="text-gold">CREATIONS</span>
                </>
              ) : (
                "NC"
              )}
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cream/10 transition-colors ${
                  window.location.pathname === item.href ? "bg-cream/10" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-cream/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-cream hover:bg-cream/10"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {sidebarOpen && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-background border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-display">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <span className="px-2 py-1 text-xs bg-gold/20 text-gold rounded">
              {isAdmin ? "Admin" : isSalesStaff ? "Sales Staff" : "User"}
            </span>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From paid orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active products
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {(stats.lowStockProducts > 0 || stats.pendingOrders > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {stats.lowStockProducts > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-sm font-medium">
                      Low Stock Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {stats.lowStockProducts} product(s) have low stock (≤5
                      items)
                    </p>
                    <Link to="/admin/products?filter=low-stock">
                      <Button variant="link" className="p-0 h-auto mt-2">
                        View Products →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {stats.pendingOrders > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-sm font-medium">
                      Pending Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {stats.pendingOrders} order(s) require attention
                    </p>
                    <Link to="/admin/orders?status=pending">
                      <Button variant="link" className="p-0 h-auto mt-2">
                        View Orders →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {isAdmin && (
                <Link to="/admin/products/new">
                  <Button className="bg-charcoal hover:bg-charcoal/90">
                    <Package className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
              )}
              <Link to="/admin/orders/new">
                <Button variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </Link>
              <Link to="/admin/invoices/new">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              </Link>
              <Link to="/admin/customers/new">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
