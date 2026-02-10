import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Loader2,
  User,
  ShoppingBag,
  Receipt,
  Barcode,
  UserCheck,
  Scissors,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createOrderNotification } from "@/hooks/useNotifications";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  sizes: string[] | null;
  colors: string[] | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  size: string | null;
  color: string | null;
  unitPrice: number;
  discountPercent: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Salesman {
  id: string;
  name: string;
  phone: string | null;
}

const AdminBilling = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardUpiAmount, setCardUpiAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [needsAlteration, setNeedsAlteration] = useState(false);
  const [alterationDueDate, setAlterationDueDate] = useState("");
  const [alterationNotes, setAlterationNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSalesmen();
  }, []);

  // Focus on barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price, discount_price, stock_quantity, sizes, colors")
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchSalesmen = async () => {
    try {
      const { data, error } = await supabase
        .from("salesman")
        .select("id, name, phone")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setSalesmen(data || []);
    } catch (error) {
      console.error("Error fetching salesmen:", error);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Handle barcode scan
  const handleBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      const scannedSku = barcodeInput.trim();
      const product = products.find(
        (p) => p.sku?.toLowerCase() === scannedSku.toLowerCase()
      );

      if (product) {
        addToCart(product);
        toast({
          title: "Product Added",
          description: `${product.name} added to cart`,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: `No product with SKU: ${scannedSku}`,
          variant: "destructive",
        });
      }

      setBarcodeInput("");
    }
  };

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < product.stock_quantity) {
        updated[existingIndex].quantity += 1;
        setCart(updated);
      } else {
        toast({
          title: "Stock Limit",
          description: "Cannot add more than available stock",
          variant: "destructive",
        });
      }
    } else {
      const unitPrice = product.discount_price || product.price;
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          size: product.sizes?.[0] || null,
          color: product.colors?.[0] || null,
          unitPrice,
          discountPercent: 10,
        },
      ]);
    }
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    const updated = [...cart];
    updated[index] = { ...updated[index], ...updates };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = 0; // All prices are GST inclusive
  const discountAmount = cart.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    return sum + Math.round((itemTotal * item.discountPercent) / 100);
  }, 0);
  const totalAmount = subtotal - discountAmount;

  const createNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
          email: newCustomerEmail.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomers([...customers, data]);
      setSelectedCustomer(data);
      setShowNewCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");

      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    }
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `POS-${dateStr}-${random}`;
  };

  // Fast print function - uses iframe for reliable printing
  const printInvoiceDirectly = useCallback((invoiceData: any) => {
    const itemsHtml = invoiceData.items
      .map(
        (item: CartItem) => {
          const itemTotal = item.unitPrice * item.quantity;
          const itemDiscount = Math.round((itemTotal * item.discountPercent) / 100);
          const itemNet = itemTotal - itemDiscount;
          return `
          <tr>
            <td>${item.product.name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
            <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product.sku || "-"}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
            <td style="text-align: center;">${item.discountPercent}%</td>
            <td style="text-align: right;">${formatCurrency(itemNet)}</td>
          </tr>
        `;
        }
      )
      .join("");

    const printContent = `
      <html>
        <head>
          <title>Invoice - ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 10px; max-width: 800px; margin: 0 auto; color: #000; }
            .logo-section { text-align: center; margin-bottom: 5px; }
            .logo-section img { max-width: 180px; height: auto; margin: 0 auto; filter: contrast(1.5) brightness(0.9); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; }
            .header p { margin: 3px 0; color: #000; font-weight: 600; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; color: #000; }
            .invoice-details p { color: #000; font-weight: 500; margin: 2px 0; }
            .invoice-details strong { color: #000; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { background: #000; color: white; padding: 8px; text-align: left; font-weight: 700; font-size: 13px; }
            td { padding: 8px; border-bottom: 2px solid #333; color: #000; font-weight: 600; font-size: 13px; }
            .totals { text-align: right; margin-top: 15px; color: #000; }
            .totals div { margin: 3px 0; font-weight: 600; color: #000; }
            .totals .total { font-size: 22px; color: #000; font-weight: 900; }
            .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; color: #000; font-weight: 500; }
            .gst-note { font-size: 11px; color: #000; font-style: italic; margin-top: 8px; }
            @media print { body { padding: 10px; margin: 0; } @page { margin: 10px; } }
          </style>
        </head>
        <body>
          <div class="logo-section">
            <img src="/noor-logo-invoice.png" alt="Noor Creations" onerror="this.style.display='none'" />
          </div>
          <div class="header">
            <h1>NOOR - A HAND CRAFTED HERITAGE</h1>
            <p>Tax Invoice</p>
          </div>
          <div class="invoice-details">
            <div>
              <p><strong>Invoice No:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
              ${invoiceData.customer ? `<p><strong>Customer:</strong> ${invoiceData.customer.name}</p>` : ""}
              ${invoiceData.salesman ? `<p><strong>Salesman:</strong> ${invoiceData.salesman.name}</p>` : ""}
            </div>
            <div>
              <p><strong>Payment:</strong> ${invoiceData.paymentMethod.toUpperCase()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">SKU</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: center;">Disc%</th>
                <th style="text-align: right;">Net</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div>Subtotal: ${formatCurrency(invoiceData.subtotal)}</div>
            ${invoiceData.discountAmount > 0 ? `<div>Total Discount: -${formatCurrency(invoiceData.discountAmount)}</div>` : ""}
            <div class="total">Total: ${formatCurrency(invoiceData.totalAmount)}</div>
            <div class="total">Total: ${formatCurrency(invoiceData.totalAmount)}</div>
            <div class="gst-note">* All prices are inclusive of GST</div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `;

    // Try popup first, fallback to iframe
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);
    } else {
      // Fallback: use hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();
        
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        };
      }
    }
  }, []);

  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const startTime = Date.now();

    try {
      const orderNumber = generateOrderNumber();

      // Run order creation and items preparation in parallel
      const orderPromise = supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: selectedCustomer?.id || null,
          user_id: null,
          salesman_id: selectedSalesman?.id || null,
          status: needsAlteration ? "processing" : "delivered",
          payment_status: paymentMethod === "credit" ? "pending" : "paid",
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          notes: notes || `In-store purchase - ${paymentMethod}${paymentMethod === "double" ? ` (Cash: ₹${cashAmount}, Card/UPI: ₹${cardUpiAmount})` : ""}${paymentMethod === "credit" ? ` (Credit: ₹${creditAmount || totalAmount})` : ""}`,
          created_by: user?.id,
          needs_alteration: needsAlteration,
          alteration_due_date: needsAlteration && alterationDueDate ? alterationDueDate : null,
          alteration_status: needsAlteration ? "pending" : null,
          alteration_notes: needsAlteration ? alterationNotes : null,
          order_source: "pos",
        })
        .select()
        .single();

      const { data: order, error: orderError } = await orderPromise;
      if (orderError) throw orderError;

      // Prepare invoice data immediately for printing
      // Invoice number will be generated by DB trigger
      const invoiceNumber = "pending";
      const invoiceData = {
        invoiceNumber,
        orderNumber,
        customer: selectedCustomer,
        salesman: selectedSalesman,
        items: [...cart],
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        cashAmount,
        cardUpiAmount,
        creditAmount,
        date: new Date(),
      };

      // Print after DB operations so we get real invoice number

      // Run remaining operations in parallel
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        size: item.size,
        color: item.color,
      }));

      // Execute all remaining DB operations in parallel
      const [, invoiceResult] = await Promise.all([
        // Insert order items
        supabase.from("order_items").insert(orderItems),
        // Create invoice (invoice_number auto-generated by trigger)
        supabase.from("invoices").insert({
          invoice_number: "placeholder", // Will be overwritten by trigger
          order_id: order.id,
          customer_id: selectedCustomer?.id || null,
          salesman_id: selectedSalesman?.id || null,
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          payment_status: paymentMethod === "credit" ? "pending" : "paid",
          notes: notes,
          created_by: user?.id,
        }).select("invoice_number").single(),
        // Update stock for each product (batch)
        ...cart.map((item) =>
          supabase
            .from("products")
            .update({ stock_quantity: item.product.stock_quantity - item.quantity })
            .eq("id", item.product.id)
        ),
        // Record stock history (batch)
        ...cart.map((item) =>
          supabase.from("stock_history").insert({
            product_id: item.product.id,
            change_type: "sale",
            change_amount: -item.quantity,
            previous_quantity: item.product.stock_quantity,
            new_quantity: item.product.stock_quantity - item.quantity,
            notes: `In-store sale - Order ${orderNumber}`,
            reference_id: order.id,
            created_by: user?.id,
          })
        ),
        // Update customer stats if selected
        selectedCustomer
          ? supabase
              .from("customers")
              .update({
                total_orders: ((selectedCustomer as any).total_orders || 0) + 1,
                total_spent: ((selectedCustomer as any).total_spent || 0) + totalAmount,
                last_purchase_date: new Date().toISOString(),
              })
              .eq("id", selectedCustomer.id)
          : Promise.resolve(),
        // Update salesman stats if selected
        selectedSalesman
          ? (async () => {
              const { data: currentSalesman } = await supabase
                .from("salesman")
                .select("total_sales, total_orders")
                .eq("id", selectedSalesman.id)
                .single();
              if (currentSalesman) {
                await supabase
                  .from("salesman")
                  .update({
                    total_sales: Number(currentSalesman.total_sales || 0) + totalAmount,
                    total_orders: (currentSalesman.total_orders || 0) + 1,
                  })
                  .eq("id", selectedSalesman.id);
              }
            })()
          : Promise.resolve(),
        // Create notification
        createOrderNotification(orderNumber, totalAmount, "pos"),
      ]);

      // Print with real invoice number from DB
      if (invoiceResult?.data?.invoice_number) {
        invoiceData.invoiceNumber = invoiceResult.data.invoice_number;
      }
      printInvoiceDirectly(invoiceData);

      const elapsed = Date.now() - startTime;
      console.log(`Bill generated in ${elapsed}ms`);

      toast({
        title: "Success",
        description: `Bill generated in ${elapsed}ms!`,
      });

      // Navigate to dashboard immediately
      navigate("/admin");
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: "Failed to generate bill",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const printInvoice = () => {
    const printContent = document.getElementById("invoice-print-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${generatedInvoice?.invoiceNumber}</title>
              <style>
                body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #000; }
                .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                .header h1 { color: #000; margin: 0; font-size: 28px; font-weight: 800; }
                .header p { margin: 5px 0; color: #000; font-weight: 600; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-details div { }
                .invoice-details strong { color: #000; font-weight: 800; }
                .invoice-details p { color: #000; font-weight: 500; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #000; color: white; padding: 12px; text-align: left; font-weight: 700; }
                td { padding: 10px; border-bottom: 2px solid #333; color: #000; font-weight: 600; }
                .totals { text-align: right; margin-top: 20px; color: #000; }
                .totals div { margin: 5px 0; font-weight: 600; color: #000; }
                .totals .total { font-size: 24px; color: #000; font-weight: 900; }
                .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; color: #000; font-weight: 500; }
                .salesman-info { margin-top: 10px; font-size: 14px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <AdminLayout title="In-Store Billing">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Products Section */}
        <div className="xl:col-span-2 space-y-4">
          {/* Barcode Scanner Section */}
          <div className="bg-background rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Barcode className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-foreground">
                  Barcode Scanner (SKU)
                </Label>
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or enter SKU and press Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-background rounded-lg p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-background rounded-lg p-4 shadow-sm">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Select Products
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-foreground">{product.sku || "-"}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-primary font-semibold text-sm">
                        {formatCurrency(product.discount_price || product.price)}
                      </span>
                      <span className="text-xs text-foreground">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart & Billing Section */}
        <div className="space-y-4">
          {/* Salesman Selection */}
          <div className="bg-background rounded-lg p-4 shadow-sm">
            <h3 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Salesman
            </h3>

            {selectedSalesman ? (
              <div className="flex items-center justify-between p-3 bg-gold/10 rounded-lg">
                <div>
                  <p className="font-medium">{selectedSalesman.name}</p>
                  <p className="text-sm text-foreground">
                    {selectedSalesman.phone || "No phone"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSalesman(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Select
                value=""
                onValueChange={(value) => {
                  const salesman = salesmen.find((s) => s.id === value);
                  setSelectedSalesman(salesman || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salesman..." />
                </SelectTrigger>
                <SelectContent>
                  {salesmen.map((salesman) => (
                    <SelectItem key={salesman.id} value={salesman.id}>
                      {salesman.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Customer Selection */}
          <div className="bg-background rounded-lg p-4 shadow-sm">
            <h3 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer
            </h3>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-foreground">
                    {selectedCustomer.phone || selectedCustomer.email || "Walk-in"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {customerSearch && filteredCustomers.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
                    {filteredCustomers.slice(0, 5).map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch("");
                        }}
                        className="w-full p-2 text-left hover:bg-muted/50 text-sm"
                      >
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-foreground">
                          {customer.phone || customer.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCustomer(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Customer
                </Button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-background rounded-lg p-4 shadow-sm">
            <h3 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Cart ({cart.length} items)
            </h3>

            {cart.length === 0 ? (
              <p className="text-center text-foreground py-8">
                No items in cart
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-foreground">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(index)}
                        className="text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.product.sizes && item.product.sizes.length > 0 && (
                        <Select
                          value={item.size || ""}
                          onValueChange={(value) =>
                            updateCartItem(index, { size: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-20">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.product.sizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {item.product.colors && item.product.colors.length > 0 && (
                        <Select
                          value={item.color || ""}
                          onValueChange={(value) =>
                            updateCartItem(index, { color: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-24">
                            <SelectValue placeholder="Color" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.product.colors.map((color) => (
                              <SelectItem key={color} value={color}>
                                {color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            updateCartItem(index, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            if (item.quantity < item.product.stock_quantity) {
                              updateCartItem(index, { quantity: item.quantity + 1 });
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs text-muted-foreground">Disc:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discountPercent === 0 ? "" : item.discountPercent}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = val === "" ? 0 : Math.min(100, Math.max(0, Number(val)));
                            updateCartItem(index, { discountPercent: num });
                          }}
                          className="w-14 h-6 text-xs text-right"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <div className="text-right text-sm font-semibold text-primary">
                        {formatCurrency(item.unitPrice * item.quantity - Math.round((item.unitPrice * item.quantity * item.discountPercent) / 100))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Summary */}
          <div className="bg-background rounded-lg p-4 shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                  <span className="text-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-foreground">Subtotal (GST Inclusive)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => {
                  setPaymentMethod(v);
                  setCreditAmount(0);
                  setCashAmount(0);
                  setCardUpiAmount(0);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card_upi">Card / UPI</SelectItem>
                    <SelectItem value="credit">Credit (Pay Later)</SelectItem>
                    <SelectItem value="double">Double (Cash + Card/UPI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "credit" && (
                <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
                  <Label className="text-sm">Amount to Pay Later</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(Number(e.target.value) || 0)}
                      className="h-8 text-right"
                      placeholder="Enter amount..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 whitespace-nowrap"
                      onClick={() => setCreditAmount(totalAmount)}
                    >
                      Full Amount
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Credit: {formatCurrency(creditAmount || totalAmount)} — Payment will show as pending
                  </p>
                </div>
              )}

              {paymentMethod === "double" && (
                <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-sm">Cash Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCashAmount(val);
                        setCardUpiAmount(Math.max(0, totalAmount - val));
                      }}
                      className="h-8 text-right mt-1"
                      placeholder="Cash..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Card / UPI Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      value={cardUpiAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCardUpiAmount(val);
                        setCashAmount(Math.max(0, totalAmount - val));
                      }}
                      className="h-8 text-right mt-1"
                      placeholder="Card/UPI..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatCurrency(cashAmount + cardUpiAmount)} of {formatCurrency(totalAmount)}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              {/* Alteration Section */}
              <div className="border border-gold/20 rounded-lg p-3 space-y-3 bg-cream/30">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="needs-alteration"
                    checked={needsAlteration}
                    onChange={(e) => setNeedsAlteration(e.target.checked)}
                    className="h-4 w-4 rounded border-gold accent-gold"
                  />
                  <Label htmlFor="needs-alteration" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-gold" />
                    Needs Alteration
                  </Label>
                </div>
                
                {needsAlteration && (
                  <div className="space-y-3 pt-2 border-t border-gold/10">
                    <div>
                      <Label className="text-sm">Due Date</Label>
                      <Input
                        type="date"
                        value={alterationDueDate}
                        onChange={(e) => setAlterationDueDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="border-gold/20"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Alteration Notes</Label>
                      <Textarea
                        value={alterationNotes}
                        onChange={(e) => setAlterationNotes(e.target.value)}
                        placeholder="Describe alteration requirements..."
                        rows={2}
                        className="border-gold/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerateBill}
                disabled={cart.length === 0 || submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Receipt className="h-5 w-5 mr-2" />
                )}
                Generate Bill
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <Button onClick={createNewCustomer} className="w-full">
              Add Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center justify-between">
              <span>Invoice Generated</span>
              <Button variant="outline" size="sm" onClick={printInvoice}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div id="invoice-print-content" className="p-4">
            <div className="header text-center border-b-2 border-primary pb-4 mb-4">
              <h1 className="text-2xl font-serif font-bold text-primary">
                NOOR CREATIONS
              </h1>
              <p className="text-sm text-foreground">
                Premium Ethnic Wear
              </p>
              <p className="text-xs text-foreground">
                Jammu, J&K
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p>
                  <strong className="text-primary">Invoice #:</strong>{" "}
                  {generatedInvoice?.invoiceNumber}
                </p>
                <p>
                  <strong className="text-primary">Date:</strong>{" "}
                  {generatedInvoice?.date?.toLocaleDateString("en-IN")}
                </p>
                {generatedInvoice?.salesman && (
                  <p className="salesman-info">
                    <strong className="text-primary">Salesman:</strong>{" "}
                    {generatedInvoice.salesman.name}
                  </p>
                )}
              </div>
              <div className="text-right">
                {generatedInvoice?.customer ? (
                  <>
                    <p>
                      <strong className="text-primary">Customer:</strong>{" "}
                      {generatedInvoice.customer.name}
                    </p>
                    {generatedInvoice.customer.phone && (
                      <p>{generatedInvoice.customer.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground">Walk-in Customer</p>
                )}
              </div>
            </div>

            <table className="w-full mb-4">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {generatedInvoice?.items?.map((item: CartItem, index: number) => (
                  <tr key={index} className="border-b border-border">
                    <td className="p-2">
                      <p className="font-medium">{item.product.name}</p>
                      {(item.size || item.color) && (
                        <p className="text-xs text-foreground">
                          {[item.size, item.color].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-right">
              <p>
                <span className="text-foreground">Subtotal:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(generatedInvoice?.subtotal || 0)}
                </span>
              </p>
              <p className="text-xs text-foreground italic">
                * All prices are inclusive of GST
              </p>
              {generatedInvoice?.discountAmount > 0 && (
                <p>
                  <span className="text-foreground">Discount:</span>{" "}
                  <span className="font-medium text-green-600">
                    -{formatCurrency(generatedInvoice?.discountAmount || 0)}
                  </span>
                </p>
              )}
              <p className="text-xl font-bold text-primary pt-2 border-t border-border">
                <span>Total:</span>{" "}
                {formatCurrency(generatedInvoice?.totalAmount || 0)}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border text-center text-xs text-foreground">
              <p>Payment Method: {generatedInvoice?.paymentMethod?.toUpperCase()}</p>
              {generatedInvoice?.salesman && (
                <p className="mt-1">Served by: {generatedInvoice.salesman.name}</p>
              )}
              <p className="mt-2">Thank you for shopping with us!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBilling;
