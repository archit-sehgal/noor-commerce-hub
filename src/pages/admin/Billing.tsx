import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  design_number: string | null;
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
  const queryClient = useQueryClient();
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
  const [alterationNumber, setAlterationNumber] = useState("");
  const [alterationItemIndices, setAlterationItemIndices] = useState<number[]>([]);
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
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, sku, price, discount_price, stock_quantity, sizes, colors, design_number")
          .eq("is_active", true)
          .order("name")
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        allData = allData.concat(data || []);
        if (!data || data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      }

      setProducts(allData);
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
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.design_number?.toLowerCase().includes(searchQuery.toLowerCase())
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
        (p) => p.sku?.toLowerCase() === scannedSku.toLowerCase() ||
               p.design_number?.toLowerCase() === scannedSku.toLowerCase()
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
      updated[existingIndex].quantity += 1;
      setCart(updated);
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

  // Separate returned items (negative qty) and purchased items (positive qty)
  const returnItems = cart.filter(item => item.quantity < 0);
  const purchaseItems = cart.filter(item => item.quantity > 0);
  const hasExchange = returnItems.length > 0 && purchaseItems.length > 0;
  const hasReturnsOnly = returnItems.length > 0 && purchaseItems.length === 0;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * Math.abs(item.quantity), 0);
  const returnTotal = returnItems.reduce((sum, item) => {
    const itemTotal = item.unitPrice * Math.abs(item.quantity);
    return sum + (itemTotal - Math.round((itemTotal * item.discountPercent) / 100));
  }, 0);
  const purchaseTotal = purchaseItems.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    return sum + (itemTotal - Math.round((itemTotal * item.discountPercent) / 100));
  }, 0);
  const discountAmount = cart.reduce((sum, item) => {
    const itemTotal = item.unitPrice * Math.abs(item.quantity);
    return sum + Math.round((itemTotal * item.discountPercent) / 100);
  }, 0);
  const netBalance = purchaseTotal - returnTotal;
  // If negative balance, customer gets a credit note (we don't pay back)
  const creditNoteAmount = netBalance < 0 ? Math.abs(netBalance) : 0;
  const totalAmount = Math.max(0, netBalance);

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
    const isExchange = invoiceData.hasExchange;
    const allItems = invoiceData.items as CartItem[];
    
    // Build items HTML - separate returns and purchases for exchange bills
    let itemsHtml = "";
    let sno = 1;
    
    if (isExchange) {
      // Show returned items first
      const returns = allItems.filter((item: CartItem) => item.quantity < 0);
      const purchases = allItems.filter((item: CartItem) => item.quantity > 0);
      
      if (returns.length > 0) {
        itemsHtml += `<tr><td colspan="7" style="background: #fee; font-weight: 800; font-size: 11px; padding: 6px; border-bottom: 2px solid #c00;">⬇ RETURNED ITEMS</td></tr>`;
        returns.forEach((item: CartItem) => {
          const absQty = Math.abs(item.quantity);
          const itemTotal = item.unitPrice * absQty;
          const itemDiscount = Math.round((itemTotal * item.discountPercent) / 100);
          const itemNet = itemTotal - itemDiscount;
          itemsHtml += `
            <tr style="color: #c00;">
              <td style="text-align: center;">${sno++}</td>
              <td>${item.product.name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
              <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product.sku || "-"}</td>
              <td style="text-align: center;">${absQty}</td>
              <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
              <td style="text-align: center;">${item.discountPercent > 0 ? item.discountPercent + '%' : '-'}</td>
              <td style="text-align: right;">-${formatCurrency(itemNet)}</td>
            </tr>`;
        });
      }
      
      if (purchases.length > 0) {
        itemsHtml += `<tr><td colspan="7" style="background: #efe; font-weight: 800; font-size: 11px; padding: 6px; border-bottom: 2px solid #090;">⬆ PURCHASED ITEMS</td></tr>`;
        purchases.forEach((item: CartItem) => {
          const itemTotal = item.unitPrice * item.quantity;
          const itemDiscount = Math.round((itemTotal * item.discountPercent) / 100);
          const itemNet = itemTotal - itemDiscount;
          itemsHtml += `
            <tr>
              <td style="text-align: center;">${sno++}</td>
              <td>${item.product.name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
              <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product.sku || "-"}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
              <td style="text-align: center;">${item.discountPercent > 0 ? item.discountPercent + '%' : '-'}</td>
              <td style="text-align: right;">${formatCurrency(itemNet)}</td>
            </tr>`;
        });
      }
    } else {
      // Normal bill - no exchange
      allItems.forEach((item: CartItem) => {
        const itemTotal = item.unitPrice * item.quantity;
        const itemDiscount = Math.round((itemTotal * item.discountPercent) / 100);
        const itemNet = itemTotal - itemDiscount;
        itemsHtml += `
          <tr>
            <td style="text-align: center;">${sno++}</td>
            <td>${item.product.name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
            <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product.sku || "-"}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
            <td style="text-align: center;">${item.discountPercent > 0 ? item.discountPercent + '%' : '-'}</td>
            <td style="text-align: right;">${formatCurrency(itemNet)}</td>
          </tr>`;
      });
    }

    // Build totals section
    let totalsHtml = "";
    if (isExchange) {
      totalsHtml += `<div>Return Value: -${formatCurrency(invoiceData.returnTotal)}</div>`;
      totalsHtml += `<div>Purchase Value: ${formatCurrency(invoiceData.purchaseTotal)}</div>`;
      if (invoiceData.discountAmount > 0) {
        totalsHtml += `<div>Discount: -${formatCurrency(invoiceData.discountAmount)}</div>`;
      }
      if (invoiceData.creditNoteAmount > 0) {
        totalsHtml += `<div style="font-size: 16px; color: #b45309; font-weight: 900; margin-top: 8px; padding: 8px; border: 2px solid #b45309; background: #fef3c7;">CREDIT NOTE: ${formatCurrency(invoiceData.creditNoteAmount)}</div>`;
        totalsHtml += `<div style="font-size: 11px; font-style: italic; margin-top: 4px;">This credit note can be used for future purchases</div>`;
      } else {
        totalsHtml += `<div class="total">Balance to Pay: ${formatCurrency(invoiceData.totalAmount)}</div>`;
      }
    } else {
      if (invoiceData.discountAmount > 0) {
        totalsHtml += `<div>Subtotal: ${formatCurrency(invoiceData.purchaseTotal + invoiceData.discountAmount)}</div>`;
        totalsHtml += `<div>Discount: -${formatCurrency(invoiceData.discountAmount)}</div>`;
      }
      totalsHtml += `<div class="total">Net Total: ${formatCurrency(invoiceData.totalAmount)}</div>`;
    }
    totalsHtml += `<div class="gst-note" style="font-size: 11px; font-style: italic; margin-top: 6px;">Inclusive of all taxes</div>`;

    const logoUrl = `${window.location.origin}/noor-logo-bill.png`;
    const printContent = `
      <html>
        <head>
          <title>Invoice - ${invoiceData.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 10px 15px; max-width: 800px; margin: 0 auto; color: #000; transform: scale(0.9); transform-origin: top center; }
            .logo-section { text-align: center; margin-bottom: 2px; padding: 0; }
            .logo-section img { max-width: 160px; height: auto; margin: 0 auto; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header h1 { color: #000; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 3px; }
            .header p { margin: 2px 0; color: #000; font-weight: 600; font-size: 12px; }
            .exchange-badge { display: inline-block; background: #000; color: #fff; padding: 3px 12px; font-size: 10px; font-weight: 800; letter-spacing: 2px; margin-top: 4px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; color: #000; }
            .invoice-details p { color: #000; font-weight: 500; margin: 2px 0; }
            .invoice-details strong { color: #000; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
            th { background: #000; color: white; padding: 6px 3px; text-align: left; font-weight: 700; font-size: 10px; }
            td { padding: 6px 3px; border-bottom: 2px solid #333; color: #000; font-weight: 600; font-size: 10px; word-wrap: break-word; }
            .col-sno { width: 6%; }
            .col-item { width: 30%; }
            .col-sku { width: 14%; }
            .col-qty { width: 8%; }
            .col-price { width: 15%; }
            .col-disc { width: 8%; }
            .col-net { width: 19%; }
            .totals { text-align: right; margin-top: 15px; color: #000; }
            .totals div { margin: 3px 0; font-weight: 600; color: #000; }
            .totals .total { font-size: 22px; color: #000; font-weight: 900; }
            .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; color: #000; font-weight: 500; }
            .gst-note { font-size: 11px; color: #000; font-style: italic; margin-top: 8px; }
            @media print { @page { margin: 0; } body { margin: 0; padding: 0; max-width: 100%; } .logo-section { margin-top: 0 !important; padding-top: 0 !important; } }
          </style>
        </head>
        <body>
          <div class="logo-section">
            <img src="${logoUrl}" alt="Noor Creations" onerror="this.style.display='none'" />
          </div>
          <div class="header">
            <h1>NOOR CREATIONS</h1>
            <p>Moti Bazar Parade Jammu, 180001</p>
            <p>Phone: 6006364546</p>
            <p>GSTIN: 01NXZPS2503D1Z8</p>
            <p style="margin-top: 8px; font-size: 16px; font-weight: 900; letter-spacing: 2px;">${isExchange ? "EXCHANGE INVOICE" : "TAX INVOICE"}</p>
            ${isExchange ? `<span class="exchange-badge">EXCHANGE / RETURN</span>` : ""}
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
              ${isExchange ? `<p><strong>Type:</strong> EXCHANGE</p>` : ""}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-sno" style="text-align: center;">S.No.</th>
                <th class="col-item">Item</th>
                <th class="col-sku" style="text-align: center;">SKU</th>
                <th class="col-qty" style="text-align: center;">Qty</th>
                <th class="col-price" style="text-align: right;">Price</th>
                <th class="col-disc" style="text-align: center;">Disc%</th>
                <th class="col-net" style="text-align: right;">Net</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            ${totalsHtml}
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p style="margin-top: 5px; font-size: 11px;">NOOR CREATIONS | Premium Ethnic Wear | Jammu, J&K</p>
            <p style="margin-top: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
              Follow us on
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              @thenoorcreations
            </p>
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
      const img = printWindow.document.querySelector('.logo-section img') as HTMLImageElement;
      const doPrint = () => {
        printWindow.print();
        printWindow.close();
      };
      if (img && img.complete) {
        setTimeout(doPrint, 100);
      } else if (img) {
        img.onload = () => setTimeout(doPrint, 100);
        img.onerror = () => setTimeout(doPrint, 100);
      } else {
        setTimeout(doPrint, 100);
      }
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

  const buildAlterationNotes = () => {
    const selectedItems = alterationItemIndices.length > 0
      ? cart.filter((_, idx) => alterationItemIndices.includes(idx))
      : cart;
    const itemDetails = selectedItems
      .map((item) => `${item.product.name}${item.product.sku ? ` (SKU: ${item.product.sku})` : ""}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`)
      .join(", ");
    return `Items: ${itemDetails}${alterationNotes ? `\nNotes: ${alterationNotes}` : ""}`;
  };

  const toggleAlterationItem = (index: number) => {
    setAlterationItemIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }

    // Validate no zero-qty items
    const zeroQtyItems = cart.filter(item => item.quantity === 0);
    if (zeroQtyItems.length > 0) {
      toast({
        title: "Error",
        description: "Remove items with 0 quantity",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const startTime = Date.now();

    try {
      const orderNumber = generateOrderNumber();
      const isExchange = returnItems.length > 0;
      const orderNotes = [
        notes,
        `In-store ${isExchange ? "exchange" : "purchase"} - ${paymentMethod}`,
        paymentMethod === "double" ? `(Cash: ₹${cashAmount}, Card/UPI: ₹${cardUpiAmount})` : "",
        paymentMethod === "credit" ? `(Credit: ₹${creditAmount || totalAmount})` : "",
        creditNoteAmount > 0 ? `CREDIT NOTE ISSUED: ₹${creditNoteAmount}` : "",
      ].filter(Boolean).join(" ");

      // Run order creation
      const orderPromise = supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: selectedCustomer?.id || null,
          user_id: null,
          salesman_id: selectedSalesman?.id || null,
          status: needsAlteration ? "processing" : "delivered",
          payment_status: creditNoteAmount > 0 ? "paid" : (paymentMethod === "credit" ? "pending" : "paid"),
          subtotal: purchaseTotal,
          tax_amount: 0,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          notes: orderNotes,
          created_by: user?.id,
          needs_alteration: needsAlteration,
          alteration_due_date: needsAlteration && alterationDueDate ? alterationDueDate : null,
          alteration_status: needsAlteration ? "pending" : null,
          alteration_notes: needsAlteration ? buildAlterationNotes() : null,
          alteration_number: needsAlteration && alterationNumber ? alterationNumber : null,
          order_source: "pos",
        })
        .select()
        .single();

      const { data: order, error: orderError } = await orderPromise;
      if (orderError) throw orderError;

      // Prepare invoice data for printing
      const invoiceData = {
        invoiceNumber: "pending",
        orderNumber,
        customer: selectedCustomer,
        salesman: selectedSalesman,
        items: [...cart],
        returnItems: [...returnItems],
        purchaseItems: [...purchaseItems],
        returnTotal,
        purchaseTotal,
        subtotal,
        discountAmount,
        totalAmount,
        creditNoteAmount,
        netBalance,
        hasExchange: isExchange,
        paymentMethod,
        cashAmount,
        cardUpiAmount,
        creditAmount,
        date: new Date(),
      };

      // Order items - store abs quantity, mark returns with negative total_price
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || null,
        quantity: item.quantity, // negative for returns
        unit_price: item.unitPrice,
        total_price: (() => {
          const absQty = Math.abs(item.quantity);
          const itemTotal = item.unitPrice * absQty;
          const itemDisc = Math.round((itemTotal * item.discountPercent) / 100);
          return item.quantity < 0 ? -(itemTotal - itemDisc) : (itemTotal - itemDisc);
        })(),
        size: item.size,
        color: item.color,
      }));

      // Execute all DB operations in parallel
      const [, invoiceResult] = await Promise.all([
        // Insert order items
        supabase.from("order_items").insert(orderItems),
        // Create invoice (invoice_number auto-generated by trigger)
        supabase.from("invoices").insert({
          invoice_number: "placeholder",
          order_id: order.id,
          customer_id: selectedCustomer?.id || null,
          salesman_id: selectedSalesman?.id || null,
          subtotal: purchaseTotal,
          tax_amount: 0,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          payment_status: creditNoteAmount > 0 ? "paid" : (paymentMethod === "credit" ? "pending" : "paid"),
          notes: creditNoteAmount > 0 ? `Credit Note: ₹${creditNoteAmount}` : notes,
          created_by: user?.id,
        }).select("invoice_number").single(),
        // Update stock for each product
        // Positive qty -> deduct stock, Negative qty -> add back stock
        ...cart.filter(item => item.quantity !== 0).map((item) =>
          supabase
            .from("products")
            .update({ stock_quantity: item.product.stock_quantity - item.quantity })
            .eq("id", item.product.id)
        ),
        // Record stock history
        ...cart.filter(item => item.quantity !== 0).map((item) =>
          supabase.from("stock_history").insert({
            product_id: item.product.id,
            change_type: item.quantity < 0 ? "return" : "sale",
            change_amount: -item.quantity, // positive for returns (stock added back), negative for sales
            previous_quantity: item.product.stock_quantity,
            new_quantity: item.product.stock_quantity - item.quantity,
            notes: `${item.quantity < 0 ? "Return" : "Sale"} - Order ${orderNumber}`,
            reference_id: order.id,
            created_by: user?.id,
          })
        ),
        // Update customer stats (only add positive amount to total_spent)
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
        // Update salesman stats
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

      // Print with real invoice number
      if (invoiceResult?.data?.invoice_number) {
        invoiceData.invoiceNumber = invoiceResult.data.invoice_number;
      }
      printInvoiceDirectly(invoiceData);

      const elapsed = Date.now() - startTime;
      console.log(`Bill generated in ${elapsed}ms`);

      toast({
        title: "Success",
        description: `${isExchange ? "Exchange" : "Bill"} generated in ${elapsed}ms!`,
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });
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
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #000; transform: scale(0.9); transform-origin: top center; }
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
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-6">
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
        <div className="xl:col-span-3 space-y-4">
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
              <div className="grid grid-cols-2 gap-2">
                {cart.map((item, index) => (
                    <div
                    key={index}
                    className={`border rounded-lg p-2 space-y-1 ${
                      item.quantity < 0 ? "border-destructive/50 bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{item.product.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {item.product.sku || "No SKU"} • {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(index)}
                        className="text-destructive h-5 w-5 p-0 shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      {item.product.sizes && item.product.sizes.length > 0 && (
                        <Select
                          value={item.size || ""}
                          onValueChange={(value) =>
                            updateCartItem(index, { size: value })
                          }
                        >
                          <SelectTrigger className="h-6 text-[10px] w-16">
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
                          <SelectTrigger className="h-6 text-[10px] w-18">
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

                      <div className="flex items-center gap-0.5 ml-auto">
                        <input
                          type="text"
                          inputMode="text"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            // Allow typing just "-" without clearing
                            if (raw === "-" || raw === "") {
                              // Temporarily show via native input, don't update cart yet
                              e.target.value = raw;
                              return;
                            }
                            const num = parseInt(raw, 10);
                            if (!isNaN(num)) {
                              updateCartItem(index, { quantity: num });
                            }
                          }}
                          onBlur={(e) => {
                            // If left as "-" or empty, reset to 1
                            const num = parseInt(e.target.value, 10);
                            if (isNaN(num) || num === 0) {
                              updateCartItem(index, { quantity: 1 });
                            }
                          }}
                          className={`w-10 h-6 text-xs font-bold text-center border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring ${
                            item.quantity < 0 ? "border-destructive text-destructive" : "border-border"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Disc:</Label>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          defaultValue={item.discountPercent === 0 ? "" : String(item.discountPercent)}
                          key={`disc-${item.product}-${item.discountPercent === 0 ? "empty" : ""}`}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            e.target.value = val;
                            if (val === "" || val === "." || val.endsWith(".")) {
                              if (val === "" || val === ".") {
                                updateCartItem(index, { discountPercent: 0 });
                              }
                              return;
                            }
                            const num = Math.min(100, Math.max(0, parseFloat(val)));
                            if (!isNaN(num)) {
                              updateCartItem(index, { discountPercent: num });
                            }
                          }}
                          onBlur={(e) => {
                            const num = parseFloat(e.target.value);
                            if (isNaN(num) || num === 0) {
                              e.target.value = "";
                              updateCartItem(index, { discountPercent: 0 });
                            } else {
                              const clamped = Math.min(100, Math.max(0, num));
                              e.target.value = String(clamped);
                              updateCartItem(index, { discountPercent: clamped });
                            }
                          }}
                          className="w-10 h-6 text-xs font-medium text-center border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="0"
                        />
                        <span className="text-xs font-medium text-muted-foreground">%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Net:</Label>
                        {item.quantity < 0 && <span className="text-xs text-destructive font-semibold">RTN</span>}
                        <span className="text-xs text-muted-foreground">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          defaultValue={(() => {
                            const absQty = Math.abs(item.quantity);
                            const itemTotal = item.unitPrice * absQty;
                            const itemDisc = Math.round((itemTotal * item.discountPercent) / 100);
                            return String(itemTotal - itemDisc);
                          })()}
                          key={`net-${item.product}-${item.quantity}-${item.discountPercent}-${item.unitPrice}`}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            e.target.value = val;
                          }}
                          onBlur={(e) => {
                            const desiredNet = parseFloat(e.target.value);
                            const absQty = Math.abs(item.quantity);
                            const itemTotal = item.unitPrice * absQty;
                            if (isNaN(desiredNet) || itemTotal === 0) {
                              return;
                            }
                            const newDiscPercent = Math.max(0, Math.min(100, ((itemTotal - desiredNet) / itemTotal) * 100));
                            const rounded = Math.round(newDiscPercent * 100) / 100;
                            updateCartItem(index, { discountPercent: rounded });
                          }}
                          className="w-16 h-6 text-xs font-semibold text-right border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring px-1"
                        />
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
              {returnTotal > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Return Value</span>
                  <span>-{formatCurrency(returnTotal)}</span>
                </div>
              )}
              {purchaseTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Purchase Value</span>
                  <span>{formatCurrency(purchaseTotal)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {creditNoteAmount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-amber-600">
                  <span>Credit Note Issued</span>
                  <span>{formatCurrency(creditNoteAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>{creditNoteAmount > 0 ? "Credit Note" : (hasExchange ? "Balance to Pay" : "Net Total")}</span>
                <span className={creditNoteAmount > 0 ? "text-amber-600" : "text-primary"}>
                  {creditNoteAmount > 0 ? formatCurrency(creditNoteAmount) : formatCurrency(totalAmount)}
                </span>
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
                      <Label className="text-sm">Alteration Number</Label>
                      <Input
                        value={alterationNumber}
                        onChange={(e) => setAlterationNumber(e.target.value)}
                        placeholder="Enter alteration number (e.g., ALT-001)"
                        className="border-gold/20"
                      />
                    </div>

                    {/* Item Selection for Alteration */}
                    {cart.length > 1 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">Select Items for Alteration</Label>
                          <button
                            type="button"
                            onClick={() => {
                              if (alterationItemIndices.length === cart.length) {
                                setAlterationItemIndices([]);
                              } else {
                                setAlterationItemIndices(cart.map((_, i) => i));
                              }
                            }}
                            className="text-xs text-gold hover:underline"
                          >
                            {alterationItemIndices.length === cart.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                        <div className="border border-gold/10 rounded-lg divide-y divide-gold/10 max-h-32 overflow-y-auto">
                          {cart.map((item, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={alterationItemIndices.includes(idx)}
                                onChange={() => toggleAlterationItem(idx)}
                                className="h-3.5 w-3.5 rounded border-gold accent-gold"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate block">{item.product.name}</span>
                                <span className="text-muted-foreground">
                                  {[item.product.sku && `SKU: ${item.product.sku}`, item.size, item.color].filter(Boolean).join(" • ")}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                        {alterationItemIndices.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">All items will be included if none selected</p>
                        )}
                      </div>
                    )}

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
