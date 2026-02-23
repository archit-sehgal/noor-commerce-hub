import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  orderId: string;
  sendEmail?: boolean;
}

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const generateInvoiceHTML = (order: any, orderItems: any[], customer: any, products: any[]) => {
  // Build a map of product_id -> gst_rate
  const productGstMap: Record<string, number> = {};
  for (const p of products) {
    productGstMap[p.id] = p.gst_rate || 0;
  }

  const itemsHTML = orderItems.map((item, index) => {
    const gross = item.unit_price * item.quantity;
    const discPercent = gross > 0 ? Math.round(((gross - item.total_price) / gross) * 100) : 0;

    return `
    <tr>
      <td style="text-align: center;">${index + 1}</td>
      <td>${item.product_name}${item.size ? ` (${item.size})` : ''}${item.color ? ` - ${item.color}` : ''}</td>
      <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product_sku || '-'}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="text-align: center;">${discPercent > 0 ? discPercent + '%' : '-'}</td>
      <td style="text-align: right;">${formatCurrency(item.total_price)}</td>
    </tr>
  `;
  }).join('');

  const subtotal = order.subtotal;
  const totalDiscount = order.discount_amount || 0;
  const netTotal = order.total_amount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.invoice_number || order.order_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 10px 15px; max-width: 800px; margin: 0 auto; color: #000; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
    .header h1 { color: #000; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 3px; }
    .header p { margin: 2px 0; color: #000; font-weight: 600; font-size: 12px; }
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
    @media print { @page { margin: 0; } body { margin: 0; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>NOOR CREATIONS</h1>
    <p>Moti Bazar Parade Jammu, 180001</p>
    <p>Phone: 6006364546</p>
    <p>GSTIN: 01NXZPS2503D1Z8</p>
    <p style="margin-top: 8px; font-size: 16px; font-weight: 900; letter-spacing: 2px;">TAX INVOICE</p>
  </div>

  <div class="invoice-details">
    <div>
      <p><strong>Invoice No:</strong> ${order.invoice_number || order.order_number}</p>
      <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
      ${customer?.name ? `<p><strong>Customer:</strong> ${customer.name}</p>` : ''}
      ${customer?.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
      ${order.shipping_address ? `<p><strong>Address:</strong> ${order.shipping_address}</p>` : ''}
    </div>
    <div style="text-align: right;">
      <p><strong>Order:</strong> ${order.order_number}</p>
      <p><strong>Payment:</strong> ${order.payment_status.toUpperCase()}</p>
      <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
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
      ${itemsHTML}
    </tbody>
  </table>

   <div class="totals">
    <div>Subtotal: ${formatCurrency(subtotal)}</div>
    ${totalDiscount > 0 ? `<div>Discount: -${formatCurrency(totalDiscount)}</div>` : ''}
    <div class="total">Net Total: ${formatCurrency(netTotal)}</div>
    <div style="font-size: 11px; font-style: italic; margin-top: 6px;">Inclusive of all taxes</div>
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
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Invoice generation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, sendEmail = false }: InvoiceRequest = await req.json();
    console.log("Processing order:", orderId, "sendEmail:", sendEmail);

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      throw new Error("Order not found");
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw new Error("Failed to fetch order items");
    }

    // Fetch products for GST rates
    const productIds = (orderItems || []).map(i => i.product_id).filter(Boolean);
    let products: any[] = [];
    if (productIds.length > 0) {
      const { data: productData } = await supabase
        .from("products")
        .select("id, gst_rate")
        .in("id", productIds);
      products = productData || [];
    }

    // Fetch customer if exists
    let customer = null;
    if (order.customer_id) {
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", order.customer_id)
        .single();
      customer = customerData;
    }

    // Generate invoice number if not exists
    const invoiceNumber = generateInvoiceNumber();

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .single();

    let invoice;
    if (existingInvoice) {
      invoice = existingInvoice;
    } else {
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          order_id: orderId,
          customer_id: order.customer_id,
          invoice_number: invoiceNumber,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount,
          discount_amount: order.discount_amount,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        throw new Error("Failed to create invoice record");
      }
      invoice = newInvoice;
    }

    // Generate HTML invoice
    const invoiceHTML = generateInvoiceHTML(
      { ...order, invoice_number: invoice.invoice_number },
      orderItems || [],
      customer,
      products
    );

    console.log("Invoice generated successfully:", invoice.invoice_number);

    // Send email if requested
    let emailSent = false;
    if (sendEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && customer?.email) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: "Noor Creations <orders@resend.dev>",
            to: [customer.email],
            subject: `Your Invoice #${invoice.invoice_number} from Noor Creations`,
            html: invoiceHTML,
          });
          emailSent = true;
          console.log("Invoice email sent to:", customer.email);
        } catch (emailError: any) {
          console.error("Error sending email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
        },
        html: invoiceHTML,
        emailSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
