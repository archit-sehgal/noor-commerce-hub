import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileText,
  Loader2,
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
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showWelcomeLoader, setShowWelcomeLoader] = useState(false);

  // Check for fresh login and show welcome loader until data loads
  useEffect(() => {
    const isFreshLogin = sessionStorage.getItem("freshLogin");
    if (isFreshLogin === "true") {
      setShowWelcomeLoader(true);
      sessionStorage.removeItem("freshLogin");
    }
  }, []);

  // Hide welcome loader once data has loaded
  useEffect(() => {
    if (showWelcomeLoader && !loading) {
      const timer = setTimeout(() => {
        setShowWelcomeLoader(false);
      }, 500); // Small delay for smooth transition
      return () => clearTimeout(timer);
    }
  }, [loading, showWelcomeLoader]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Run all queries in parallel for faster dashboard load
        const [
          productsRes,
          ordersRes,
          customersRes,
          revenueRes,
          lowStockRes,
          pendingRes,
        ] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("customers").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
          supabase.from("products").select("*", { count: "exact", head: true }).lte("stock_quantity", 5),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        const totalRevenue =
          revenueRes.data?.reduce(
            (acc, order) => acc + (Number(order.total_amount) || 0),
            0,
          ) || 0;

        setStats({
          totalProducts: productsRes.count || 0,
          totalOrders: ordersRes.count || 0,
          totalCustomers: customersRes.count || 0,
          totalRevenue,
          lowStockProducts: lowStockRes.count || 0,
          pendingOrders: pendingRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Show welcome loader for first login after logout
  if (showWelcomeLoader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-gold mx-auto" />
          <p className="text-lg text-foreground">Setting things up for you...</p>
        </div>
        {/* Loading line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
          <div className="h-full bg-gold animate-pulse w-full origin-left" 
               style={{ animation: 'loading-line 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`
          @keyframes loading-line {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "…" : `₹${stats.totalRevenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From paid orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? "" : `${stats.pendingOrders} pending`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "…" : stats.totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Active products</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(stats.lowStockProducts > 0 || stats.pendingOrders > 0) && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.lowStockProducts > 0 && (
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <AlertTriangle className="h-5 w-5 text-gold" />
                  <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {stats.lowStockProducts} product(s) have low stock (≤5 items)
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
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <TrendingUp className="h-5 w-5 text-gold" />
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{stats.pendingOrders} order(s) require attention</p>
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
                <Button className="bg-charcoal hover:bg-charcoal/90 text-cream">
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            )}
            <Link to="/admin/billing">
              <Button variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Order (POS)
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Orders
              </Button>
            </Link>
            <Link to="/admin/customers">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Customers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
