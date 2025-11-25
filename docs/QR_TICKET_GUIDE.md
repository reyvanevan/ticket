# QR Ticket Implementation Guide

## Overview
Generate QR code saat admin approve order. QR code dikirim via email sebagai attachment (PNG image).

## Tech Stack
- **Library:** qrcode.js v1.5.3 (https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js)
- **Method:** Direct QR generation (no template overlay - SIMPLIFIED)
- **Format:** PNG base64 → kirim ke n8n → email attachment

## Flow
```
Admin approve → Generate QR (512x512 PNG) → Convert base64 → n8n → Email sent
```

## Implementation

### 1. QR Code Generation (Simplified)
Function `createTicketWithQR()` now generates **QR code only** (no template image):

```javascript
// Generate 512x512 QR code
const qrImage = await createTicketWithQR({
  kode_tiket: 'TIX-UMB20251125-001',
  nama: 'User Name',
  order_number: 'UMB20251125...',
  quantity: 2
});

// Result: data:image/png;base64,iVBORw0KGgoAAAANS...
```

### 2. QR Code Content
QR contains ticket code only:
```
TIX-UMB20251125123456-001
```

### 3. n8n Workflow
**Send Email Node → Attachments:**
- Expression:
```javascript
{{ 
  [{
    data: $json.ticket_image_base64.split(',')[1],
    filename: `qr-ticket-${$json.order_number}.png`,
    type: 'image/png'
  }]
}}
```

## Testing
1. Admin approve order
2. Check console: `✅ QR Code generated for: TIX-...`
3. Check email: PNG attachment dengan QR code (512x512 px)

## Notes
- QR size: 512x512 pixels (high quality)
- QR contains: ticket code only (TIX-ORD-xxx-001)
- Base64 image ~20-30KB (small, efficient)
- No template needed (simplified implementation)

## Troubleshooting
| Error | Solution |
|-------|----------|
| QRCode is not defined | Load qrcode.js CDN sebelum admin.js |
| Email no attachment | Check n8n attachment expression syntax |
| QR not generated | Check browser console for errors |
