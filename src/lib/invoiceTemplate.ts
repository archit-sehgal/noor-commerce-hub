export interface InvoiceItem {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber?: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  salesmanName?: string;
  paymentStatus: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function generateInvoiceHTML(data: InvoiceData): string {
  const returnItems = data.items.filter((i) => i.quantity < 0);
  const purchaseItems = data.items.filter((i) => i.quantity > 0);
  const isExchange = returnItems.length > 0 && purchaseItems.length > 0;

  // Parse credit note from notes
  let creditNoteAmount = 0;
  if (data.notes && data.notes.includes("Credit Note: ₹")) {
    const match = data.notes.match(/Credit Note: ₹([\d,]+)/);
    if (match) creditNoteAmount = parseInt(match[1].replace(/,/g, ""));
  }

  // Build items HTML
  let itemsHtml = "";
  let sno = 1;

  if (isExchange) {
    if (returnItems.length > 0) {
      itemsHtml += `<tr><td colspan="7" style="background: #fee; font-weight: 800; font-size: 11px; padding: 6px; border-bottom: 2px solid #c00;">⬇ RETURNED ITEMS</td></tr>`;
      returnItems.forEach((item) => {
        const absQty = Math.abs(item.quantity);
        const gross = item.unit_price * absQty;
        const discPercent = gross > 0 ? Math.round(((gross - Math.abs(item.total_price)) / gross) * 100) : 0;
        itemsHtml += `
          <tr style="color: #c00;">
            <td style="text-align: center;">${sno++}</td>
            <td>${item.product_name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
            <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product_sku || "-"}</td>
            <td style="text-align: center;">${absQty}</td>
            <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
            <td style="text-align: center;">${discPercent > 0 ? discPercent + "%" : "-"}</td>
            <td style="text-align: right;">-${formatCurrency(Math.abs(item.total_price))}</td>
          </tr>`;
      });
    }
    if (purchaseItems.length > 0) {
      itemsHtml += `<tr><td colspan="7" style="background: #efe; font-weight: 800; font-size: 11px; padding: 6px; border-bottom: 2px solid #090;">⬆ PURCHASED ITEMS</td></tr>`;
      purchaseItems.forEach((item) => {
        const gross = item.unit_price * item.quantity;
        const discPercent = gross > 0 ? Math.round(((gross - item.total_price) / gross) * 100) : 0;
        itemsHtml += `
          <tr>
            <td style="text-align: center;">${sno++}</td>
            <td>${item.product_name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
            <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product_sku || "-"}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
            <td style="text-align: center;">${discPercent > 0 ? discPercent + "%" : "-"}</td>
            <td style="text-align: right;">${formatCurrency(item.total_price)}</td>
          </tr>`;
      });
    }
  } else {
    data.items.forEach((item) => {
      const gross = item.unit_price * item.quantity;
      const discPercent = gross > 0 ? Math.round(((gross - item.total_price) / gross) * 100) : 0;
      itemsHtml += `
        <tr>
          <td style="text-align: center;">${sno++}</td>
          <td>${item.product_name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}</td>
          <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.product_sku || "-"}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="text-align: center;">${discPercent > 0 ? discPercent + "%" : "-"}</td>
          <td style="text-align: right;">${formatCurrency(item.total_price)}</td>
        </tr>`;
    });
  }

  // Build totals
  let totalsHtml = "";
  if (isExchange) {
    const returnTotal = returnItems.reduce((s, i) => s + Math.abs(i.total_price), 0);
    const purchaseTotal = purchaseItems.reduce((s, i) => s + i.total_price, 0);
    totalsHtml += `<div>Return Value: -${formatCurrency(returnTotal)}</div>`;
    totalsHtml += `<div>Purchase Value: ${formatCurrency(purchaseTotal)}</div>`;
    if (data.discountAmount > 0) {
      totalsHtml += `<div>Discount: -${formatCurrency(data.discountAmount)}</div>`;
    }
    if (creditNoteAmount > 0) {
      totalsHtml += `<div style="font-size: 16px; color: #b45309; font-weight: 900; margin-top: 8px; padding: 8px; border: 2px solid #b45309; background: #fef3c7;">CREDIT NOTE: ${formatCurrency(creditNoteAmount)}</div>`;
      totalsHtml += `<div style="font-size: 11px; font-style: italic; margin-top: 4px;">This credit note can be used for future purchases</div>`;
    } else {
      totalsHtml += `<div class="total">Balance to Pay: ${formatCurrency(data.totalAmount)}</div>`;
    }
  } else {
    if (data.discountAmount > 0) {
      totalsHtml += `<div>Subtotal: ${formatCurrency(data.subtotal + data.discountAmount)}</div>`;
      totalsHtml += `<div>Discount: -${formatCurrency(data.discountAmount)}</div>`;
    } else {
      totalsHtml += `<div>Subtotal: ${formatCurrency(data.subtotal)}</div>`;
    }
    totalsHtml += `<div class="total">Net Total: ${formatCurrency(data.totalAmount)}</div>`;
  }
  totalsHtml += `<div class="gst-note" style="font-size: 11px; font-style: italic; margin-top: 6px;">Inclusive of all taxes</div>`;

  const logoUrl = `${window.location.origin}/noor-logo-bill.png`;

  return `<html>
<head>
  <title>Invoice - ${data.invoiceNumber}</title>
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
      <p><strong>Invoice No:</strong> ${data.invoiceNumber}</p>
      ${data.orderNumber ? `<p><strong>Order #:</strong> ${data.orderNumber}</p>` : ""}
      <p><strong>Date:</strong> ${data.date}</p>
      ${data.customerName ? `<p><strong>Customer:</strong> ${data.customerName}</p>` : ""}
      ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ""}
      ${data.salesmanName ? `<p><strong>Salesman:</strong> ${data.salesmanName}</p>` : ""}
    </div>
    <div>
      <p><strong>Payment:</strong> ${data.paymentStatus.toUpperCase()}</p>
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
</html>`;
}

export function printInvoiceHTML(html: string) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    const img = printWindow.document.querySelector(".logo-section img") as HTMLImageElement;
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
    // Fallback: download as HTML
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
