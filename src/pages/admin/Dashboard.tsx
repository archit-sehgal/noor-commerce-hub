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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        const { count: ordersCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });

        const { count: customersCount } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true });

        const { data: revenueData } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("payment_status", "paid");

        const totalRevenue =
          revenueData?.reduce(
            (acc, order) => acc + (Number(order.total_amount) || 0),
            0,
          ) || 0;

        const { count: lowStockCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .lte("stock_quantity", 5);

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
