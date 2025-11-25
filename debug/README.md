# 🧪 Debug Tools - UMbandung Festival Ticketing System

Folder ini berisi tools untuk debugging dan testing sistem ticketing.

## 📁 File List

### 1. `test_generate_tickets.html`
**Test endpoint:** `/generate_tickets.php`

**Fungsi:**
- Test generate ticket entries di database
- Validasi ticket format: `UMBFEST-YYYYMMDDHHMMSS-001`
- Check duplicate prevention
- Test multiple quantity

**Cara Pakai:**
1. Buka file di browser
2. Masukkan Order Number (contoh: `UMB20251126071259`)
3. Klik "Generate Tickets"
4. Lihat response: berapa tiket ter-generate

**Expected Result:**
```json
{
  "status": "success",
  "message": "Tickets generated successfully",
  "data": {
    "tickets": [
      "UMBFEST-20251126071259-001",
      "UMBFEST-20251126071259-002"
    ],
    "quantity": 2
  }
}
```

---

### 2. `test_scan_ticket.html`
**Test endpoint:** `/api-scan.php`

**Fungsi:**
- Simulasi scan QR code
- Test validasi tiket (valid/used/not found)
- Check database update (checked_in status)

**Cara Pakai:**
1. Buka file di browser
2. Masukkan Ticket Code (contoh: `UMBFEST-20251126071259-001`)
3. Klik "Scan Ticket"
4. Lihat response: valid atau reject

**Test Scenarios:**
- ✅ **Valid Ticket:** First scan → success
- ❌ **Already Used:** Second scan → reject with timestamp
- ❌ **Not Found:** Invalid code → not found error

**Expected Result (Valid):**
```json
{
  "status": "success",
  "message": "✅ TIKET VALID! Silakan Masuk.",
  "data": {
    "ticket_number": "UMBFEST-20251126071259-001",
    "nama": "Reyvanevan",
    "order_number": "UMB20251126071259"
  }
}
```

**Expected Result (Already Used):**
```json
{
  "status": "error",
  "message": "TIKET SUDAH DIPAKAI!\nDigunakan pada: 26 Nov 2025 12:30"
}
```

---

### 3. `test_n8n.html` (Updated di root folder)
**Test endpoint:** n8n webhook `/new-order`

**Fungsi:**
- Test complete flow admin approve → n8n
- Test multiple ticket generation
- Test email dengan multiple QR attachments

**Cara Pakai:**
1. Buka file di browser
2. Adjust quantity (1-5 tiket)
3. Klik "Kirim ke n8n"
4. Check email: berapa QR code attachment yang masuk

**Payload Format:**
```json
{
  "nama": "Reyvanevan Test",
  "email": "reyvan.evann@gmail.com",
  "kodes": [
    "UMBFEST-20251126071259-001",
    "UMBFEST-20251126071259-002"
  ],
  "order_number": "UMB20251126071259",
  "quantity": 2,
  "total": 42000
}
```

---

## 🔄 Complete Testing Flow

### **Scenario 1: Happy Path (1 Tiket)**
```
1. test_generate_tickets.html
   → Order: UMB20251126071259
   → Result: 1 ticket generated (UMBFEST-20251126071259-001)

2. test_n8n.html (updated)
   → Quantity: 1
   → Result: Email dengan 1 QR code attachment

3. test_scan_ticket.html
   → Code: UMBFEST-20251126071259-001
   → Result: ✅ TIKET VALID

4. test_scan_ticket.html (scan lagi)
   → Code: UMBFEST-20251126071259-001
   → Result: ❌ TIKET SUDAH DIPAKAI
```

---

### **Scenario 2: Multiple Tickets (3 Tiket)**
```
1. test_generate_tickets.html
   → Order: UMB20251126080000
   → Result: 3 tickets generated

2. test_n8n.html
   → Quantity: 3
   → Kodes: [...-001, ...-002, ...-003]
   → Result: Email dengan 3 QR code attachments

3. test_scan_ticket.html
   → Scan ticket 1: ✅ VALID
   → Scan ticket 2: ✅ VALID
   → Scan ticket 3: ✅ VALID
   → Scan ticket 1 lagi: ❌ SUDAH DIPAKAI
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Order not found"
**Cause:** Order belum ada di database
**Solution:** 
- Buat order dulu via frontend
- Atau manual INSERT ke database

### Issue 2: "CORS Error"
**Cause:** Browser block cross-origin request
**Solution:**
- Check PHP headers (Access-Control-Allow-Origin: *)
- Test pakai localhost atau domain yang sama

### Issue 3: "Tickets already generated"
**Cause:** Generate 2x untuk order yang sama
**Solution:**
- Ini expected behavior (prevention duplicate)
- API akan return existing tickets

### Issue 4: n8n webhook timeout
**Cause:** n8n workflow offline atau URL salah
**Solution:**
- Check n8n dashboard: workflow activated?
- Verify webhook URL di test file

---

## 📊 Database Queries (Manual Check)

```sql
-- Check generated tickets
SELECT * FROM tickets WHERE order_id = (
  SELECT id FROM orders WHERE order_number = 'UMB20251126071259'
);

-- Check ticket scan status
SELECT 
  t.ticket_number,
  t.checked_in,
  t.checked_in_at,
  o.order_number,
  o.full_name
FROM tickets t
JOIN orders o ON t.order_id = o.id
WHERE t.ticket_number = 'UMBFEST-20251126071259-001';

-- Check all scanned tickets today
SELECT * FROM tickets 
WHERE checked_in = 1 
AND DATE(checked_in_at) = CURDATE()
ORDER BY checked_in_at DESC;
```

---

## 🚀 Production Checklist

Before going live:
- ✅ Test generate tickets (1, 2, 5 quantity)
- ✅ Test n8n webhook dengan berbagai quantity
- ✅ Check email: semua QR code masuk?
- ✅ Test scan: valid ticket accepted
- ✅ Test scan duplicate: rejected properly
- ✅ Test scan invalid code: proper error message
- ✅ Database backup ready

---

**Happy Debugging! 🐛🔧**
