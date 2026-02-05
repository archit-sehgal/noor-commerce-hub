import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import AdminThemeClassManager from "@/components/admin/AdminThemeClassManager";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Account from "./pages/Account";
import NewArrivals from "./pages/NewArrivals";
import Collections from "./pages/Collections";

// Admin Pages
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AdminThemeClassManager />
          <ScrollToTop />
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
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin/Staff Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireStaff>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireStaff>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute requireStaff>
                  <AdminCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute requireStaff>
                  <AdminInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute requireStaff>
                  <AdminBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <ProtectedRoute requireStaff>
                  <AdminInvoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/salesmen"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSalesman />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/alterations"
              element={
                <ProtectedRoute requireStaff>
                  <AdminAlterations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/purchases"
              element={
                <ProtectedRoute requireStaff>
                  <AdminPurchases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/online-store"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOnlineStore />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
