import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeePermissions } from "@/hooks/useEmployeePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NotificationsPanel from "./NotificationsPanel";
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

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, signOut, isAdmin, isSalesStaff } = useAuth();
  const { hasPermission } = useEmployeePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

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

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="block">
          <h1 className="font-display font-medium tracking-wide text-xl">
            NOOR <span className="text-rose-gold">CREATIONS</span>
          </h1>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                location.pathname === item.href ||
                location.pathname.startsWith(item.href + "/")
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/80"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 mb-2 truncate px-2">
          {user?.email}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex admin-theme">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar text-sidebar-foreground transition-all duration-300 hidden md:flex flex-col fixed h-full z-50`}
      >
        {sidebarOpen ? (
          <NavContent />
        ) : (
          <>
            <div className="p-4 border-b border-sidebar-border text-center">
              <Link to="/" className="block">
                <span className="font-display font-medium text-lg">NC</span>
              </Link>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {sidebarItems
                .filter((item) => item.show)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-center p-3 rounded-lg ${
                      location.pathname === item.href ||
                      location.pathname.startsWith(item.href + "/")
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/80"
                    }`}
                    title={item.name}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
            </nav>
            <div className="p-2 border-t border-sidebar-border">
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-sidebar-foreground"
                onClick={handleSignOut}
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-none">
          <div className="h-full flex flex-col">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm border-b border-rose-gold/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Desktop Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg md:text-xl font-display truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationsPanel />
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate max-w-[150px]">
              {user?.email}
            </span>
            <span className="px-2 md:px-3 py-1 md:py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full border border-border whitespace-nowrap">
              {isAdmin ? "Admin" : isSalesStaff ? "Employee" : "User"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
