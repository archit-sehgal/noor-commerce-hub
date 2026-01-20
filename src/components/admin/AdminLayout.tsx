import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, signOut, isAdmin, isSalesStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin", show: true },
    { name: "Billing (POS)", icon: Receipt, href: "/admin/billing", show: true },
    { name: "Products", icon: Package, href: "/admin/products", show: isAdmin },
    { name: "Categories", icon: Tags, href: "/admin/categories", show: isAdmin },
    { name: "Orders", icon: ShoppingCart, href: "/admin/orders", show: true },
    { name: "Customers", icon: Users, href: "/admin/customers", show: true },
    { name: "Inventory", icon: Warehouse, href: "/admin/inventory", show: true },
    { name: "Reports", icon: BarChart3, href: "/admin/reports", show: isAdmin },
    { name: "Invoices", icon: FileText, href: "/admin/invoices", show: true },
    { name: "Settings", icon: Settings, href: "/admin/settings", show: isAdmin },
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
        } bg-charcoal text-cream transition-all duration-300 flex flex-col fixed h-full z-50`}
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

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cream/10 transition-colors ${
                  location.pathname === item.href ||
                  location.pathname.startsWith(item.href + "/")
                    ? "bg-cream/10"
                    : ""
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-cream/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-cream hover:bg-cream/10"
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
        <header className="bg-background border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-display">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <span className="px-2 py-1 text-xs bg-gold/20 text-gold rounded">
              {isAdmin ? "Admin" : isSalesStaff ? "Sales Staff" : "User"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
