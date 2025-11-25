📋 Dokumentasi Workflow: Order Handler
🎯 Tujuan Workflow

Workflow ini menangani pemesanan tiket UMbandung Festival 2025 secara otomatis. Ketika ada order baru masuk via webhook, sistem akan:

    Menerima data order (nama, email, kode tiket)
    Memecah multiple kode tiket menjadi item terpisah
    Generate QR code untuk setiap tiket
    Menggabungkan semua QR code
    Mengirim email konfirmasi dengan attachment QR code tiket

🔄 Alur Workflow

Webhook → Respond to Webhook → Code in JavaScript1 (Splitter) 
→ HTTP Request (QR Generator) → Code in JavaScript (Merger) 
→ Send email

📦 Detail Setiap Node
1️⃣ Webhook (Trigger)

    Tipe: n8n-nodes-base.webhook v2.1
    Fungsi: Menerima HTTP POST request dari sistem pemesanan tiket
    Konfigurasi:
        Method: POST
        Path: /new-order
        Authentication: None (public endpoint)
        Mode: Response Node (akan dibalas oleh node berikutnya)
    Webhook URL: https://revy.app.n8n.cloud/webhook/new-order
    Input yang Diterima:

    {
      "body": {
        "nama": "Nama Pembeli",
        "email": "email@example.com",
        "kodes": ["TKT-001", "TKT-002"],
        "order_number": "ORD-123",
        "quantity": 2,
        "total": "100000"
      }
    }

2️⃣ Respond to Webhook

    Tipe: n8n-nodes-base.respondToWebhook v1.4
    Fungsi: Memberikan response cepat ke sistem pemanggil bahwa order sudah diterima
    Konfigurasi:
        Response Format: JSON
        Response Body: { "status": "notified" }
        Custom Header: Access-Control-Allow-Origin: * (untuk CORS)
    Tujuan: Agar sistem pemanggil tidak timeout menunggu proses selesai

3️⃣ Code in JavaScript1 (Splitter)

    Tipe: n8n-nodes-base.code v2
    Fungsi: Memecah array kode tiket menjadi item terpisah
    Mode: Run Once for All Items
    Logic:

    // Input: 1 item dengan array kodes: ["TKT-1", "TKT-2"]
    // Output: 2 items terpisah

    const body = $input.item.json.body;
    const codes = body.kodes; // ["TKT-1", "TKT-2"]

    // Loop setiap kode tiket
    for (const code of codes) {
      results.push({
        json: {
          nama: body.nama,
          email: body.email,
          kode_tiket: code  // Satu kode per item
        }
      });
    }

    Input: 1 item dengan multiple kode tiket
    Output: N items (sesuai jumlah tiket yang dibeli)
    Contoh:
        Input: { kodes: ["TKT-1", "TKT-2"] }
        Output:
            Item 1: { kode_tiket: "TKT-1" }
            Item 2: { kode_tiket: "TKT-2" }

4️⃣ HTTP Request (QR Code Generator)

    Tipe: n8n-nodes-base.httpRequest v4.3
    Fungsi: Generate QR code image untuk setiap kode tiket
    Konfigurasi:
        Method: GET
        URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={{ $json.body.kode_tiket }}
        Response Format: File (binary data)
        Output Property: data
    Proses:
        Dijalankan untuk setiap item hasil split
        Menghasilkan file PNG QR code 300x300 pixel
        Data disimpan dalam binary.data
    Output: Binary image file untuk setiap tiket

5️⃣ Code in JavaScript (Merger)

    Tipe: n8n-nodes-base.code v2
    Fungsi: Menggabungkan semua QR code menjadi satu item dengan multiple attachments
    Mode: Run Once for All Items
    Logic:

    // Input: N items, masing-masing punya binary QR code
    // Output: 1 item dengan semua QR code sebagai attachments

    const items = $input.all();
    const newBinary = {};

    items.forEach((item, index) => {
      if (item.binary && item.binary.data) {
        const binaryKey = `attachment_${index}`;
        newBinary[binaryKey] = item.binary.data;
        newBinary[binaryKey].fileName = `Tiket-${index + 1}.png`;
        newBinary[binaryKey].mimeType = 'image/png';
      }
    });

    return [{
      json: {
        email: items[0].json.email,
        nama: items[0].json.nama,
        attachmentList: "attachment_0,attachment_1,..."
      },
      binary: newBinary  // Semua QR code dalam satu object
    }];

    Input: Multiple items dengan binary data
    Output: 1 item dengan multiple binary attachments
    Struktur Binary:

    binary: {
      attachment_0: { fileName: "Tiket-1.png", data: ... },
      attachment_1: { fileName: "Tiket-2.png", data: ... }
    }

6️⃣ Send email

    Tipe: n8n-nodes-base.emailSend v2.1
    Fungsi: Mengirim email konfirmasi dengan e-ticket
    Konfigurasi:
        From: umbandungfest@gmail.com
        To: {{ $('HTTP Request').item.json.body.email }}
        Subject: E-Ticket UMbandung Festival 2025 - {{ $('HTTP Request').item.json.body.kode_tiket }}
        Format: HTML
        Attachments: data (semua binary dari node sebelumnya)
    Isi Email:
        Greeting dengan nama pembeli
        Detail tiket (kode, order number, quantity, total)
        Informasi event (tanggal, waktu, lokasi)
        QR code tiket sebagai attachment
    Credentials: SMTP account (sudah dikonfigurasi)

🔑 Konsep Penting
Splitter Pattern (Code in JavaScript1)

    Mengubah 1 item dengan array → N items terpisah
    Diperlukan agar HTTP Request bisa generate QR code untuk setiap tiket
    n8n akan otomatis loop HTTP Request untuk setiap item

Merger Pattern (Code in JavaScript)

    Mengubah N items → 1 item dengan multiple binary
    Diperlukan agar email bisa attach semua QR code sekaligus
    Menggunakan $input.all() untuk ambil semua items

Binary Data Handling

    QR code disimpan sebagai binary (bukan base64 string)
    Setiap binary punya properties: fileName, mimeType, data
    Email node otomatis detect binary dan jadikan attachment

📊 Flow Data

1. Webhook receives:
   { nama: "John", email: "john@mail.com", kodes: ["A", "B"] }

2. After Splitter:
   Item 1: { nama: "John", email: "john@mail.com", kode_tiket: "A" }
   Item 2: { nama: "John", email: "john@mail.com", kode_tiket: "B" }

3. After HTTP Request:
   Item 1: { ..., binary: { data: <QR_A.png> } }
   Item 2: { ..., binary: { data: <QR_B.png> } }

4. After Merger:
   Item 1: { 
     json: { nama: "John", email: "john@mail.com" },
     binary: { 
       attachment_0: <QR_A.png>,
       attachment_1: <QR_B.png>
     }
   }

5. Email sent with 2 PNG attachments

⚙️ Cara Menggunakan

    Trigger webhook dengan POST request:

    curl -X POST https://revy.app.n8n.cloud/webhook/new-order \
    -H "Content-Type: application/json" \
    -d '{
      "nama": "Budi Santoso",
      "email": "budi@example.com",
      "kodes": ["TKT-001", "TKT-002", "TKT-003"],
      "order_number": "ORD-12345",
      "quantity": 3,
      "total": "150000"
    }'

    Response langsung: { "status": "notified" }

    Email terkirim dengan:
        Subject: E-Ticket UMbandung Festival 2025 - TKT-001
        Attachments: Tiket-1.png, Tiket-2.png, Tiket-3.png

🎯 Kelebihan Workflow Ini

✅ Fast Response: Webhook langsung balas tanpa tunggu proses selesai
✅ Scalable: Bisa handle 1 tiket atau 100 tiket dalam 1 order
✅ Reliable: QR code di-generate dari API external yang stabil
✅ User Friendly: Email HTML dengan detail lengkap
✅ Efficient: Semua QR code dalam 1 email (tidak spam inbox)
🔧 Maintenance Notes

    SMTP Credentials: Pastikan credentials umbandungfest@gmail.com tetap valid
    QR API: Menggunakan free API qrserver.com (ada rate limit)
    Email Template: Tanggal event hardcoded (29 November 2025) - update jika event berubah
    CORS Header: Access-Control-Allow-Origin: * membolehkan semua domain
