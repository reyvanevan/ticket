# 🎫 UMbandung Festival 2025 - Integration Setup Guide

## 📋 Overview
Sistem ticketing terintegrasi dengan:
- **Database MySQL** (cPanel hosting)
- **n8n Workflow** (Email automation)
- **Frontend JavaScript** (localStorage + API calls)

---

## 🔧 Setup Steps

### 1️⃣ Database Setup (cPanel MySQL)

#### A. Import Database Schema
1. Login ke **cPanel** → **phpMyAdmin**
2. Pilih database: `if0_40506185_umbfest`
3. Klik tab **"Import"**
4. Upload file: `database_schema.sql`
5. Klik **"Go"** untuk execute

#### B. Verify Tables Created
Pastikan 3 tabel berhasil dibuat:
- ✅ `orders` - Data pesanan tiket
- ✅ `tickets` - Tiket yang di-generate
- ✅ `verification_logs` - Log verifikasi admin

---

### 2️⃣ Configure n8n Webhook URL

#### A. Get Production Webhook URL
1. Login ke **n8n instance** kamu
2. Buka workflow: **"Ticket Email Automation"**
3. Klik node **"Webhook"**
4. Copy **Production URL** (contoh: `https://n8n.yourdomain.com/webhook/abc123def`)

#### B. Update Configuration Files

**File 1: `js/config.js`** (Line ~71)
```javascript
api: {
  // ...
  n8nWebhook: 'https://n8n.yourdomain.com/webhook/abc123def', // 👈 GANTI INI!
  // ...
}
```

**File 2: `send_ticket_email.php`** (Line 27)
```php
$n8n_webhook_url = 'https://n8n.yourdomain.com/webhook/abc123def'; // 👈 GANTI INI!
```

---

### 3️⃣ Upload Files ke Hosting

Upload semua file ke cPanel hosting:

```
/public_html/
├── index.html
├── checkout.html
├── payment.html
├── success.html
├── ticket-detail.html
├── admin.html
├── style.css
├── db.php ✅
├── save_order.php ✅ (NEW)
├── send_ticket_email.php ✅ (NEW)
├── assets/
│   └── umbandung-fest-2025.jpg
└── js/
    ├── config.js ✅ (UPDATED)
    ├── utils.js
    ├── ticket.js ✅ (UPDATED)
    ├── script.js
    ├── countdown.js
    └── admin.js
```

**PENTING:** Pastikan file PHP ada di root folder yang sama dengan `index.html`!

---

### 4️⃣ Test n8n Workflow

#### A. Activate Workflow
1. Di n8n, pastikan workflow **"Ticket Email Automation"** sudah **ACTIVE** (toggle ON)
2. Test manual dengan klik **"Execute Workflow"** → **"Test step"** di node Webhook

#### B. Test Data Sample
```json
{
  "nama": "John Doe",
  "email": "test@example.com",
  "kode_tiket": "UMB20251125123456-001"
}
```

#### C. Verify SMTP Settings
Pastikan node **"Send Email"** sudah configured:
- **SMTP Host:** `smtp.gmail.com`
- **SMTP Port:** `465` (SSL/TLS)
- **Credentials:** App Password (bukan password biasa!)
- **From Email:** Email pengirim yang valid

---

### 5️⃣ Configure CORS (n8n Response Node)

**PENTING:** Tambahkan Response Headers di node **"Respond to Webhook"**:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Ini penting biar frontend JS nggak kena CORS error!

---

## 🧪 Testing Integration

### Test Flow Lengkap:

1. **Buka website:** `https://yourdomain.com/ticket-detail.html`
2. **Pilih jumlah tiket** → Klik "Checkout"
3. **Isi data pembeli:**
   - Nama: Test User
   - Email: your-real-email@gmail.com (pakai email beneran!)
   - WhatsApp: 812345678
   - Nomor ID: 123456789
4. **Pilih QRIS** → Klik "Lanjutkan Pembayaran"
5. **Upload bukti transfer** (gambar/PDF apapun untuk testing)
6. **Klik "Konfirmasi Pembayaran"**

### Expected Results: ✅

1. ✅ Data tersimpan di database MySQL (tabel `orders`)
2. ✅ Email dikirim ke alamat yang diisi (cek inbox/spam)
3. ✅ Redirect ke halaman `success.html`
4. ✅ Status order: `waiting_verification`

---

## 🐛 Troubleshooting

### Problem 1: Email tidak terkirim
**Symptoms:** No email received, n8n error

**Solutions:**
- ✅ Cek apakah n8n workflow **ACTIVE**
- ✅ Verify SMTP credentials (pakai **App Password**, bukan password biasa)
- ✅ Cek spam/junk folder email
- ✅ Test manual di n8n dengan Execute Workflow

### Problem 2: Database error "Connection failed"
**Symptoms:** Console error, data tidak tersimpan

**Solutions:**
- ✅ Verify credentials di `db.php`:
  ```php
  $host = "sql103.infinityfree.com";
  $user = "if0_40506185";
  $pass = "reyvansanusi712";
  $db   = "if0_40506185_umbfest";
  ```
- ✅ Pastikan database exists di cPanel → phpMyAdmin
- ✅ Run `database_schema.sql` kalau tabel belum ada

### Problem 3: CORS Error di Browser Console
**Symptoms:** 
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solutions:**
- ✅ Tambahkan header di n8n Response Node:
  ```
  Access-Control-Allow-Origin: *
  ```
- ✅ Pastikan PHP files (`save_order.php`, `send_ticket_email.php`) punya CORS headers (sudah included di code)

### Problem 4: "Method not allowed" error
**Symptoms:** HTTP 405 error

**Solutions:**
- ✅ Pastikan pakai method **POST** (bukan GET)
- ✅ Check `.htaccess` di hosting tidak block POST requests
- ✅ Verify file PHP executable permission

---

## 📊 Database Queries (Admin Reference)

### Check pending orders:
```sql
SELECT * FROM orders 
WHERE status = 'waiting_verification' 
ORDER BY created_at DESC;
```

### Approve order (manual):
```sql
UPDATE orders 
SET status = 'verified', updated_at = NOW() 
WHERE order_number = 'UMB20251125123456';
```

### Total revenue:
```sql
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_revenue 
FROM orders 
WHERE status = 'verified';
```

---

## 🔐 Security Notes

1. **Jangan commit** file `db.php` ke Git (add to `.gitignore`)
2. **Change default password** di `db.php` setelah setup
3. **Restrict n8n webhook** ke IP tertentu jika memungkinkan
4. **Backup database** secara berkala
5. **Monitor n8n logs** untuk detect spam/abuse

---

## 📞 Support

**Developer Contact:**
- GitHub: [@reyvanevan](https://github.com/reyvanevan/ticket)
- Email: lentera@umbandung.ac.id

**n8n Documentation:**
- [n8n Webhook Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Email Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailsend/)

---

## ✨ Next Steps

Setelah setup selesai:
1. ✅ Test dengan data dummy
2. ✅ Verify email masuk dengan format yang benar
3. ✅ Setup admin panel untuk verifikasi orders (`admin.html`)
4. ✅ Deploy production dan monitor logs
5. ✅ Setup backup automation

**Good luck! 🚀**
