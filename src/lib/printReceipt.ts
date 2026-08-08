import { Order, Business, getStaff } from "./store";

export interface ReceiptConfig {
  edahabNumber: string;
  mycashNumber: string;
  yeelNumber: string;
  tplusNumber: string;
  sahalNumber: string;
  contactPhone: string;
  contactAddress: string;
  vatRate: number;
  thankYouMessage: string;
  poweredBy: string;
  qrUssdPrefix: string;
}

const defaultReceiptConfig: ReceiptConfig = {
  edahabNumber: "",
  mycashNumber: "",
  yeelNumber: "",
  tplusNumber: "",
  sahalNumber: "",
  contactPhone: "",
  contactAddress: "",
  vatRate: 2,
  thankYouMessage: "Thank you for visiting us",
  poweredBy: "www.DALABplus.com",
  qrUssdPrefix: "*712",
};

export const getReceiptConfig = (businessId: string): ReceiptConfig => {
  try {
    const stored = localStorage.getItem(`dp_receipt_config_${businessId}`);
    if (stored) return { ...defaultReceiptConfig, ...JSON.parse(stored) };
  } catch {}
  return defaultReceiptConfig;
};

interface PrintReceiptOptions {
  order: Order;
  business: Business;
  servedBy?: string;
  paidAmount?: number;
  mobileProvider?: string;
}

export const printReceipt = ({ order, business, servedBy, paidAmount = 0, mobileProvider }: PrintReceiptOptions) => {
  const config = getReceiptConfig(business.id);
  const receiptNumber = Math.floor(Math.random() * 90000) + 10000;
  const subtotal = order.total;
  const vatAmount = (subtotal * config.vatRate) / 100;
  const totalWithVat = subtotal + vatAmount;
  
  // Generate USSD QR payment - format: *PREFIX*MERCHANT*AMOUNT_WHOLE*DECIMAL#
  const sahalPhone = config.sahalNumber || "525782";
  const ussdPrefix = config.qrUssdPrefix || "*712";
  const [wholePart, decimalPart] = totalWithVat.toFixed(2).split(".");
  const qrData = `tel:${ussdPrefix}*${sahalPhone}*${wholePart}*${decimalPart}#`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  // Build merchant numbers display
  const merchantLines: string[] = [];
  if (config.edahabNumber || config.mycashNumber) {
    const parts = [];
    if (config.edahabNumber) parts.push(`E-Dahab: ${config.edahabNumber}`);
    if (config.mycashNumber) parts.push(`MyCash: ${config.mycashNumber}`);
    merchantLines.push(parts.join(" · "));
  }
  if (config.yeelNumber || config.tplusNumber) {
    const parts = [];
    if (config.yeelNumber) parts.push(`Yeel: ${config.yeelNumber}`);
    if (config.tplusNumber) parts.push(`T-PLUS: ${config.tplusNumber}`);
    merchantLines.push(parts.join(" · "));
  }

  const printWindow = window.open("", "_blank", "width=400,height=700");
  if (!printWindow) return;

  const customerName = (order as any).customerName || "Walking Customer";
  const customerPhone = (order as any).customerPhone || "";
  const tableId = order.tableId;
  const orderDate = new Date(order.createdAt).toLocaleString();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt #${receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          padding: 15px;
          max-width: 280px;
          margin: 0 auto;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #333;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .business-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .merchant-info {
          font-size: 9px;
          color: #444;
        }
        .divider {
          border-top: 1px dashed #333;
          margin: 8px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        .info-label {
          color: #666;
        }
        .bold { font-weight: bold; }
        .items-table {
          width: 100%;
          margin: 10px 0;
        }
        .items-table th {
          text-align: left;
          border-bottom: 1px dashed #333;
          padding: 5px 0;
          font-size: 10px;
        }
        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4) {
          text-align: right;
        }
        .items-table td {
          padding: 4px 0;
          vertical-align: top;
        }
        .items-table td:nth-child(2),
        .items-table td:nth-child(3),
        .items-table td:nth-child(4) {
          text-align: right;
        }
        .item-name {
          max-width: 100px;
          word-wrap: break-word;
        }
        .totals {
          border-top: 1px dashed #333;
          padding-top: 8px;
          margin-top: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        .grand-total {
          font-size: 14px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 8px;
          margin-top: 8px;
        }
        .qr-section {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #333;
        }
        .qr-code {
          width: 120px;
          height: 120px;
          margin: 10px auto;
        }
        .scan-text {
          font-size: 9px;
          color: #666;
          margin-bottom: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #333;
        }
        .thank-you {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .powered-by {
          font-size: 9px;
          color: #888;
        }
        @media print {
          body { padding: 5px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${business.name}</div>
        ${merchantLines.map(line => `<div class="merchant-info">${line}</div>`).join("")}
      </div>

      <div class="info-row">
        <span class="info-label">Phone Number:</span>
        <span>${config.contactPhone || business.phone || "—"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span>${config.contactAddress || business.address || "—"}</span>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span class="info-label">Receipt Number:</span>
        <span class="bold">${receiptNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Served By:</span>
        <span>${servedBy || "Staff"} · SAHAL: ${config.sahalNumber || "—"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer:</span>
        <span>${customerName}</span>
      </div>
      ${customerPhone ? `<div class="info-row"><span class="info-label">Phone:</span><span>${customerPhone}</span></div>` : ""}
      <div class="info-row">
        <span class="info-label">Table:</span>
        <span>${tableId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span>${orderDate}</span>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>No.</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>VAT @ ${config.vatRate}%:</span>
          <span>${vatAmount.toFixed(2)}</span>
        </div>
        ${mobileProvider ? `
          <div class="total-row">
            <span>Mobile Money:</span>
            <span>${mobileProvider}</span>
          </div>
        ` : ""}
        <div class="total-row">
          <span>Paid Amount:</span>
          <span>${paidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
          <span>Total:</span>
          <span>${totalWithVat.toFixed(2)}</span>
        </div>
        ${paidAmount > 0 && paidAmount < totalWithVat ? `
          <div class="total-row" style="color: #c00;">
            <span>Balance Due:</span>
            <span>${(totalWithVat - paidAmount).toFixed(2)}</span>
          </div>
        ` : ""}
      </div>

      <div class="qr-section">
        <div class="scan-text">📱 Scan ku bixi SAHAL - Total: $${totalWithVat.toFixed(2)}</div>
        <img src="${qrUrl}" alt="Payment QR" class="qr-code" />
        <div class="scan-text">Scan-garee si aad u bixiso lacagta</div>
      </div>

      <div class="footer">
        <div class="thank-you">${config.thankYouMessage}</div>
        <div class="powered-by">Powered by ${config.poweredBy}</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

export default printReceipt;
