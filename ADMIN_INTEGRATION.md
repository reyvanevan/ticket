# 🔐 Admin Panel Integration Guide

## 📋 Overview
Admin panel sekarang **fully integrated** dengan database MySQL dan n8n email workflow!

### ✨ New Features:
- ✅ **Real-time data** dari database (bukan localStorage)
- ✅ **Auto email** via n8n saat approve order
- ✅ **Verification logging** ke database
- ✅ **Fallback** ke localStorage jika database error

---

## 🗄️ New PHP Endpoints

### 1. `get_orders.php`
**Purpose:** Fetch semua orders dari database untuk admin panel

**Method:** `GET`

**Parameters (optional):**
```
?status=waiting_verification
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "orders": [...],
    "statistics": {
      "total": 10,
      "waiting": 3,
      "verified": 5,
      "revenue": 105000
    }
  }
}
```

### 2. `update_order_status.php`
**Purpose:** Update status order (approve/reject) dan trigger n8n email

**Method:** `POST`

**Payload:**
```json
{
  "orderNumber": "UMB20251125123456",
  "status": "verified",  // or "rejected"
  "adminName": "Admin",
  "rejectionReason": "Bukti transfer tidak valid"  // only for reject
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Order approved successfully",
  "data": {
    "orderNumber": "UMB20251125123456",
    "newStatus": "verified",
    "emailSent": true
  }
}
```

---

## 🔄 Admin Workflow

### **Flow Approve Order:**

```
Admin klik "Approve"
       ↓
[admin.js] Call update_order_status.php
       ↓
[PHP] Update status di database → 'verified'
       ↓
[PHP] Log action ke verification_logs table
       ↓
[PHP] Call send_ticket_email.php internally
       ↓
[send_ticket_email.php] Hit n8n webhook
       ↓
[n8n] Send email SMTP dengan e-ticket
       ↓
[n8n] Return success response
       ↓
[admin.js] Show success message
       ↓
[admin.js] Reload data dari database
```

### **Flow Reject Order:**

```
Admin klik "Reject" → Input reason
       ↓
[admin.js] Call update_order_status.php
       ↓
[PHP] Update status → 'rejected'
       ↓
[PHP] Save rejection reason ke database
       ↓
[admin.js] Show rejection confirmation
```

---

## 📁 Updated Files

### 1. **`get_orders.php`** ✨ NEW
- Fetch all orders from database
- Calculate statistics
- Return formatted JSON

### 2. **`update_order_status.php`** ✨ NEW
- Update order status (verify/reject)
- Log verification action
- Auto-trigger n8n email for approved orders
- Transaction-safe (rollback on error)

### 3. **`js/config.js`** 🔄 UPDATED
Added new endpoints:
```javascript
phpEndpoints: {
  saveOrder: './save_order.php',
  sendEmail: './send_ticket_email.php',
  getOrders: './get_orders.php',           // ← NEW
  updateOrderStatus: './update_order_status.php'  // ← NEW
}
```

### 4. **`js/admin.js`** 🔄 COMPLETE REWRITE
- Fetch orders from database via API
- Async approve/reject with loading states
- Fallback to localStorage if database fails
- Real-time statistics update

---

## 🧪 Testing Admin Panel

### **Step 1: Create Test Order**
1. Buka `ticket-detail.html`
2. Checkout dengan data dummy
3. Upload bukti transfer
4. Status: `waiting_verification`

### **Step 2: Open Admin Panel**
1. Navigate ke `admin.html`
2. Should load orders from database
3. Check statistics cards updated

### **Step 3: Approve Order**
1. Klik **"Approve"** pada order
2. Confirm popup
3. ✅ Expected results:
   - Order status → `verified`
   - Email sent notification
   - Table auto-refresh
   - Statistics updated

### **Step 4: Verify Database**
Check di phpMyAdmin:
```sql
SELECT * FROM orders WHERE order_number = 'UMB20251125123456';
-- Status should be 'verified'

SELECT * FROM verification_logs ORDER BY created_at DESC LIMIT 1;
-- Should show latest approve action
```

### **Step 5: Check Email**
- Email should arrive at buyer's inbox
- Contains ticket number & event details
- Check spam folder if not in inbox

---

## 🔧 Configuration Checklist

### Before Going Live:

- [ ] **Database Schema Imported**
  ```bash
  # Import database_schema.sql di phpMyAdmin
  ```

- [ ] **n8n Webhook URL Updated** (2 places)
  - `js/config.js` line ~81
  - `send_ticket_email.php` line 27

- [ ] **n8n CORS Headers Set**
  - Response node: `Access-Control-Allow-Origin: *`

- [ ] **SMTP Credentials Configured** (n8n)
  - Gmail App Password
  - Port 465 (SSL)

- [ ] **PHP Files Uploaded**
  - `get_orders.php` ✓
  - `update_order_status.php` ✓
  - `save_order.php` ✓
  - `send_ticket_email.php` ✓
  - `db.php` ✓

- [ ] **Test End-to-End Flow**
  - Create order → Upload proof → Approve → Check email

---

## 🐛 Troubleshooting Admin Panel

### Problem 1: "Gagal memuat data"
**Symptoms:** Admin panel shows error on load

**Solutions:**
- ✅ Check `get_orders.php` accessible (visit directly in browser)
- ✅ Verify database connection in `db.php`
- ✅ Check browser console for fetch errors
- ✅ Fallback: Will load from localStorage automatically

### Problem 2: Approve button tidak working
**Symptoms:** Click approve, nothing happens

**Solutions:**
- ✅ Open browser console (F12) → Check error messages
- ✅ Verify `update_order_status.php` accessible
- ✅ Check n8n webhook URL correct
- ✅ Test `send_ticket_email.php` standalone

### Problem 3: Email tidak terkirim saat approve
**Symptoms:** Order approved, but no email sent

**Solutions:**
- ✅ Check n8n workflow **ACTIVE** (not paused)
- ✅ Verify SMTP credentials in n8n
- ✅ Check n8n execution logs for errors
- ✅ Test email manually via n8n "Execute Workflow"

### Problem 4: Database not updating
**Symptoms:** Click approve, but status tidak berubah

**Solutions:**
- ✅ Check `update_order_status.php` for PHP errors (enable error_reporting)
- ✅ Verify database user has UPDATE permissions
- ✅ Check `verification_logs` table exists
- ✅ Review MySQL error logs in cPanel

---

## 📊 Database Queries for Admin

### Get pending verifications:
```sql
SELECT 
  order_number, 
  full_name, 
  email, 
  total,
  created_at 
FROM orders 
WHERE status = 'waiting_verification'
ORDER BY created_at DESC;
```

### Get today's revenue:
```sql
SELECT 
  COUNT(*) as orders_today,
  SUM(total) as revenue_today
FROM orders 
WHERE status = 'verified' 
  AND DATE(created_at) = CURDATE();
```

### Get verification history:
```sql
SELECT 
  v.created_at,
  v.action,
  v.admin_name,
  o.order_number,
  o.full_name,
  o.total
FROM verification_logs v
JOIN orders o ON v.order_id = o.id
ORDER BY v.created_at DESC
LIMIT 20;
```

### Get orders by status:
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(total) as total_amount
FROM orders
GROUP BY status;
```

---

## 🔐 Security Notes

### Admin Authentication (TODO - Future Enhancement):
Currently admin panel is **public** (no login required).

**Recommended improvements:**
1. Add simple PHP session login
2. Protect admin.html with `.htaccess`:
   ```apache
   AuthType Basic
   AuthName "Admin Area"
   AuthUserFile /path/to/.htpasswd
   Require valid-user
   ```
3. Add IP whitelist for admin endpoints
4. Implement JWT token authentication

### Database Security:
- ✅ Use prepared statements (already done)
- ✅ Validate all inputs
- ✅ Don't expose `db.php` in public_html
- ✅ Use environment variables for credentials

---

## 🚀 Next Steps

After admin integration working:

1. **Add Admin Login System**
   - Simple username/password
   - Session management
   - Logout functionality

2. **Enhanced Reporting**
   - Daily sales chart
   - Export orders to CSV
   - Revenue analytics

3. **Real-time Updates**
   - WebSocket for live order updates
   - Push notifications for new orders

4. **Bulk Actions**
   - Approve multiple orders at once
   - Bulk export tickets

5. **Email Templates**
   - Customize email design via n8n
   - Add event logo & branding
   - Multiple email templates (approved/rejected)

---

## 📞 Support

**Need help?**
- Check `INTEGRATION_SETUP.md` for general setup
- Review n8n execution logs
- Check MySQL error logs in cPanel
- Test each endpoint individually

**Good luck with admin panel! 🎉**
