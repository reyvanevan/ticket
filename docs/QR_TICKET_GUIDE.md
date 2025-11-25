# QR Ticket Implementation Guide

## Overview
Generate e-ticket dengan QR code saat admin approve order. QR di-overlay ke `assets/ticket_template.png` di posisi panel merah (kanan).

## Tech Stack
- **Library:** qrcode.js v1.5.3 (https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js)
- **Method:** Canvas overlay di client-side (browser)
- **Format:** PNG base64 → kirim ke n8n → email attachment

## Flow
```
Admin approve → Generate QR → Overlay ke template → Convert base64 → n8n → Email sent
```

## QR Position (from Gemini AI)
```javascript
const panelStartX = canvas.width * 0.72;  // Panel merah mulai 72%
const panelWidth = canvas.width * 0.28;   // Lebar panel 28%
const qrSize = Math.min(panelWidth * 0.85, canvas.height * 0.55);
const qrX = panelStartX + (panelWidth - qrSize) / 2;
const qrY = canvas.height * 0.20;  // 20% dari atas
```

## Implementation

### 1. Add QRCode CDN to admin.html
```html
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
```

### 2. Add functions to utils.js
```javascript
async function generateTicketQR(ticketCode) {
  return QRCode.toDataURL(ticketCode, {
    width: 300,
    margin: 0,
    errorCorrectionLevel: 'H'
  });
}

async function createTicketWithQR(ticketData) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const template = await loadImage('assets/ticket_template.png');
  canvas.width = template.width;
  canvas.height = template.height;
  ctx.drawImage(template, 0, 0);
  
  const qrDataURL = await generateTicketQR(ticketData.kode_tiket);
  const qrImage = await loadImage(qrDataURL);
  
  // Position calculation
  const panelStartX = canvas.width * 0.72;
  const panelWidth = canvas.width * 0.28;
  const qrSize = Math.min(panelWidth * 0.85, canvas.height * 0.55);
  const qrX = panelStartX + (panelWidth - qrSize) / 2;
  const qrY = canvas.height * 0.20;
  
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  
  return canvas.toDataURL('image/png');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

### 3. Update admin.js - approveOrder()
Add after Step 2 (Get order data):
```javascript
// Step 3: Generate ticket with QR
const ticketImageBase64 = await createTicketWithQR({
  kode_tiket: ticketNumber,
  nama: order.buyer.fullName,
  order_number: orderNumber,
  quantity: order.quantity
});

// Step 4: Send to n8n with ticket image
const emailResponse = await fetch(CONFIG.api.n8nWebhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nama: order.buyer.fullName,
    email: order.buyer.email,
    kode_tiket: ticketNumber,
    order_number: orderNumber,
    quantity: order.quantity,
    total: order.total,
    ticket_image_base64: ticketImageBase64  // NEW
  })
});
```

### 4. Update n8n Workflow
**Send Email Node → Attachments:**
- Add attachment
- Type: Binary data from expression
- Expression: `{{ $json.ticket_image_base64.replace('data:image/png;base64,', '') }}`
- Filename: `ticket-{{ $json.order_number }}.png`

## Testing
1. Admin approve order
2. Check console: QR generated, template loaded
3. Check email: PNG attachment dengan QR code

## Notes
- Template harus accessible: `assets/ticket_template.png`
- QR contains: `kode_tiket` (TIX-ORD-xxx-001)
- Base64 image ~500KB-1MB (depends on template resolution)
- n8n webhook max payload: 16MB (safe)

## Troubleshooting
| Error | Solution |
|-------|----------|
| Canvas tainted by cross-origin | Add CORS headers di server untuk ticket_template.png |
| QRCode is not defined | Load qrcode.js CDN sebelum admin.js |
| Image not loading | Check path: assets/ticket_template.png |
| Email no attachment | Check n8n attachment expression syntax |
