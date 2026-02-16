import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import AdminThemeClassManager from "@/components/admin/AdminThemeClassManager";
import { Loader2 } from "lucide-react";

// Lightweight loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-gold" />
  </div>
);

// Lazy-loaded pages - ecommerce
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Account = lazy(() => import("./pages/Account"));
const NewArrivals = lazy(() => import("./pages/NewArrivals"));
const Collections = lazy(() => import("./pages/Collections"));

// Admin pages - eagerly loaded to avoid spinners when switching sections
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminInventory from "./pages/admin/Inventory";
import AdminReports from "./pages/admin/Reports";
import AdminBilling from "./pages/admin/Billing";
import AdminInvoices from "./pages/admin/Invoices";
import AdminSalesman from "./pages/admin/Salesman";
import AdminSettings from "./pages/admin/Settings";
import AdminAlterations from "./pages/admin/Alterations";
import AdminPurchases from "./pages/admin/Purchases";
import AdminOnlineStore from "./pages/admin/OnlineStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min stale time - reduces refetches
      gcTime: 1000 * 60 * 10, // 10 min cache retention
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Single retry instead of default 3
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AdminThemeClassManager />
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/products" element={<Products />} />
              <Route path="/category/:slug" element={<Products />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/collections" element={<Collections />} />

              {/* Protected Customer Routes */}
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

              {/* Protected Admin/Staff Routes */}
              <Route path="/admin" element={<ProtectedRoute requireStaff><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/products/new" element={<ProtectedRoute requireAdmin><AdminProductForm /></ProtectedRoute>} />
              <Route path="/admin/products/:id/edit" element={<ProtectedRoute requireAdmin><AdminProductForm /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requireStaff><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute requireStaff><AdminCustomers /></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute requireStaff><AdminInventory /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/billing" element={<ProtectedRoute requireStaff><AdminBilling /></ProtectedRoute>} />
              <Route path="/admin/invoices" element={<ProtectedRoute requireStaff><AdminInvoices /></ProtectedRoute>} />
              <Route path="/admin/salesmen" element={<ProtectedRoute requireAdmin><AdminSalesman /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/alterations" element={<ProtectedRoute requireStaff><AdminAlterations /></ProtectedRoute>} />
              <Route path="/admin/purchases" element={<ProtectedRoute requireStaff><AdminPurchases /></ProtectedRoute>} />
              <Route path="/admin/online-store" element={<ProtectedRoute requireAdmin><AdminOnlineStore /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
