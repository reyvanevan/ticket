# 🎫 UMbandung Festival 2025 - Ticketing System

## 🚀 Full-Stack Integrated System

**Tech Stack:**
- Frontend: HTML, CSS, JavaScript (Vanilla)
- Backend: PHP (cPanel Hosting)
- Database: MySQL (cPanel)
- Email Automation: n8n Workflow
- Payment: QRIS

---

## 📂 Project Structure

```
umbfest/
├── index.html              # Landing page
├── ticket-detail.html      # Ticket selection
├── checkout.html           # Buyer information form
├── payment.html            # Payment & proof upload
├── success.html            # E-ticket display
├── admin.html              # Admin panel (order management)
├── style.css               # Main stylesheet
│
├── assets/                 # Images & media
│   └── umbandung-fest-2025.jpg
│
├── js/                     # JavaScript modules
│   ├── config.js           # Configuration & API endpoints
│   ├── utils.js            # Utility functions
│   ├── ticket.js           # Ticketing logic
│   ├── script.js           # General scripts
│   ├── countdown.js        # Countdown timer
│   └── admin.js            # Admin panel logic
│
├── db.php                  # Database connection
├── save_order.php          # Save order to database
├── send_ticket_email.php   # Trigger n8n email webhook
├── get_orders.php          # Fetch orders for admin
├── update_order_status.php # Approve/reject orders
│
├── database_schema.sql     # Database structure
├── INTEGRATION_SETUP.md    # Setup guide
└── ADMIN_INTEGRATION.md    # Admin panel guide
```

---

## 🔧 Setup Instructions

### 1. Database Setup
```bash
# Import di phpMyAdmin
database_schema.sql
```

### 2. Configure n8n Webhook
Update 2 files dengan production URL:
- `js/config.js` (line ~81)
- `send_ticket_email.php` (line 27)

### 3. Upload Files
Upload semua file ke cPanel `public_html/`

### 4. Test Flow
1. Buy ticket → Upload proof
2. Admin approve → Email sent
3. Buyer receives e-ticket

---

## 📖 Documentation

- **[INTEGRATION_SETUP.md](./INTEGRATION_SETUP.md)** - Full setup guide
- **[ADMIN_INTEGRATION.md](./ADMIN_INTEGRATION.md)** - Admin panel guide

---

## ✨ Features

### User Flow:
- ✅ Ticket selection & quantity
- ✅ Buyer information form
- ✅ QRIS payment method
- ✅ Proof upload
- ✅ E-ticket with QR code
- ✅ Email confirmation (n8n)

### Admin Panel:
- ✅ Real-time order dashboard
- ✅ Order statistics
- ✅ Approve/reject orders
- ✅ Auto email on approve
- ✅ Verification logging
- ✅ Proof image preview

---

## 🛠️ Tech Integration

### Database (MySQL)
- Orders table
- Tickets table
- Verification logs

### n8n Workflow (3 Nodes)
1. **Webhook** - Receive order data
2. **Send Email** - SMTP delivery
3. **Response** - CORS headers

### Frontend → Backend Flow
```
[JavaScript] → [PHP API] → [MySQL Database]
                    ↓
              [n8n Webhook] → [Email SMTP]
```

---

## 🔐 Security

- Prepared statements (SQL injection safe)
- CORS headers configured
- Input validation
- File upload validation (2MB, images/PDF only)

---

## 📞 Contact

**Developer:** Reyvan Evan  
**Email:** umbandungfest@gmail.com  
**GitHub:** [@reyvanevan](https://github.com/reyvanevan/ticket)

---

## 📄 License

© 2025 UMbandung Festival - LENTERA Kabinet BEM