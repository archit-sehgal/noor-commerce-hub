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
  }).format(amount);
};

const generateInvoiceHTML = (order: any, orderItems: any[], customer: any) => {
  const itemsHTML = orderItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.product_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.size || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.color || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.total_price)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.invoice_number || order.order_number}</title>
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 40px; color: #000; background: #faf9f7; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #000; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 800; color: #000; letter-spacing: 2px; }
    .logo span { color: #000; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; margin: 0; color: #000; font-weight: 800; }
    .invoice-title p { color: #000; margin: 5px 0 0; font-weight: 600; }
    .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .details-section { width: 45%; }
    .details-section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #000; margin-bottom: 10px; font-weight: 700; }
    .details-section p { margin: 5px 0; color: #000; line-height: 1.6; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #000; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
    th:last-child, th:nth-child(5), th:nth-child(4) { text-align: right; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
    td { color: #000; font-weight: 600; }
    .totals { text-align: right; margin-top: 20px; }
    .totals p { margin: 8px 0; color: #000; font-weight: 600; }
    .totals .total { font-size: 20px; font-weight: 900; color: #000; border-top: 3px solid #000; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #000; font-size: 14px; font-weight: 500; }
    .footer p { margin: 5px 0; }
    .thank-you { font-style: italic; color: #000; font-size: 18px; margin-bottom: 10px; font-weight: 600; }
    .gst-note { font-size: 11px; font-style: italic; margin-top: 10px; color: #000; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">NOOR - <span>A HAND CRAFTED HERITAGE</span></div>
      <div class="invoice-title">
        <h1>Invoice</h1>
        <p>${order.invoice_number || order.order_number}</p>
      </div>
    </div>
    
    <div class="details">
      <div class="details-section">
        <h3>Bill To</h3>
        <p><strong>${customer?.name || 'Valued Customer'}</strong></p>
        ${order.shipping_address ? `<p>${order.shipping_address}</p>` : ''}
        ${order.shipping_city || order.shipping_state || order.shipping_pincode ? 
          `<p>${[order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(', ')}</p>` : ''}
        ${customer?.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
        ${customer?.email ? `<p>Email: ${customer.email}</p>` : ''}
      </div>
      <div class="details-section" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Date:</strong> ${formatDate(order.created_at)}</p>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status.toUpperCase()}</p>
        <p><strong>Order Status:</strong> ${order.status.toUpperCase()}</p>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Size</th>
          <th>Color</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
    
    <div class="totals">
      <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
      ${order.discount_amount ? `<p><strong>Discount:</strong> -${formatCurrency(order.discount_amount)}</p>` : ''}
      <p><strong>Shipping:</strong> ${order.shipping_amount === 0 ? 'Free' : formatCurrency(order.shipping_amount || 0)}</p>
      <p class="total"><strong>Total:</strong> ${formatCurrency(order.total_amount)}</p>
      <p class="gst-note">* All prices are inclusive of GST</p>
    </div>
    
    <div class="footer">
      <p class="thank-you">Thank you for shopping with us!</p>
      <p>For any queries, please contact us at support@noorcreations.com</p>
      <p>NOOR - A Hand Crafted Heritage | Premium Ethnic Wear</p>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Invoice generation function called");
  
  // Handle CORS preflight
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
      // Create invoice record
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
      customer
    );

    console.log("Invoice generated successfully:", invoice.invoice_number);

    // Send email if requested and RESEND_API_KEY is available
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
      } else {
        console.log("Email not sent: Missing RESEND_API_KEY or customer email");
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
