import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeePermissions } from "@/hooks/useEmployeePermissions";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  Menu,
  LogOut,
  Warehouse,
  BarChart3,
  Receipt,
  UserCheck,
  Scissors,
  Truck,
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, signOut, isAdmin, isSalesStaff } = useAuth();
  const { hasPermission } = useEmployeePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin", show: true },
    { name: "Billing (POS)", icon: Receipt, href: "/admin/billing", show: isAdmin || hasPermission("permission_billing") },
    { name: "Alterations", icon: Scissors, href: "/admin/alterations", show: isAdmin || hasPermission("permission_alterations") },
    { name: "Products", icon: Package, href: "/admin/products", show: isAdmin || hasPermission("permission_products") },
    { name: "Categories", icon: Tags, href: "/admin/categories", show: isAdmin || hasPermission("permission_categories") },
    { name: "Orders", icon: ShoppingCart, href: "/admin/orders", show: isAdmin || hasPermission("permission_orders") },
    { name: "Customers", icon: Users, href: "/admin/customers", show: isAdmin || hasPermission("permission_customers") },
    { name: "Salesmen", icon: UserCheck, href: "/admin/salesmen", show: isAdmin || hasPermission("permission_salesmen") },
    { name: "Inventory", icon: Warehouse, href: "/admin/inventory", show: isAdmin || hasPermission("permission_inventory") },
    { name: "Purchases", icon: Truck, href: "/admin/purchases", show: isAdmin || hasPermission("permission_purchases") },
    { name: "Reports", icon: BarChart3, href: "/admin/reports", show: isAdmin || hasPermission("permission_reports") },
    { name: "Invoices", icon: FileText, href: "/admin/invoices", show: isAdmin || hasPermission("permission_invoices") },
    { name: "Settings", icon: Settings, href: "/admin/settings", show: isAdmin || hasPermission("permission_settings") },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-charcoal text-cream transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        <div className="p-4 border-b border-rose-gold/20">
          <Link to="/" className="block">
            <h1
              className={`font-display font-medium tracking-wide ${
                sidebarOpen ? "text-xl" : "text-sm text-center"
              }`}
            >
              {sidebarOpen ? (
                <>
                  NOOR <span className="text-rose-gold">CREATIONS</span>
                </>
              ) : (
                "NC"
              )}
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sidebarItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-rose-gold/10 transition-all duration-200 ${
                  location.pathname === item.href ||
                  location.pathname.startsWith(item.href + "/")
                    ? "bg-rose-gold/20 text-rose-gold"
                    : "text-cream/80 hover:text-cream"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-rose-gold/20">
          <Button
            variant="ghost"
            className="w-full justify-start text-cream hover:bg-rose-gold/10 hover:text-rose-gold"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {sidebarOpen && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm border-b border-rose-gold/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-rose-gold/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-display">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <span className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-rose-gold/20 to-gold/20 text-rose-gold rounded-full border border-rose-gold/20">
              {isAdmin ? "Admin" : isSalesStaff ? "Employee" : "User"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gradient-to-b from-cream to-cream-dark/30">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
