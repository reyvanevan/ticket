// ============================================
// CONFIGURATION FILE
// UMbandung Festival 2025 Ticketing System
// ============================================

const CONFIG = {
  // Event Information
  event: {
    id: 'umbandung-fest-2025',
    name: 'UMbandung Festival 2025',
    tagline: 'Lentera - Kabinet BEM UM Bandung 2024-2025',
    date: '2025-11-29',
    dateDisplay: 'Jumat, 29 November 2025',
    time: '10:00 WIB',
    location: 'Lapangan Adymic UMbandung',
    locationFull: 'Lapangan Adymic, Universitas Muhammadiyah Bandung',
    image: './assets/umbandung-fest-2025.jpg',
    artists: ['Vierra', 'Marsburn', 'Yeast', 'Weeds'],
    guestStars: ['Talkshow', 'Shakira Pemenang COC'],
    sponsors: ['Marsburn', 'Yeast', 'Weeds', 'Humpro']
  },

  // Ticket Pricing
  pricing: {
    regular: {
      name: 'Regular Ticket',
      price: 20000,
      description: [
        '✓ Akses ke semua area festival',
        '✓ Standing area',
        '✓ E-ticket dengan QR Code'
      ]
    },
    adminFee: 1000,
    maxQuantity: 5,
    currency: 'IDR'
  },

  // Payment Methods (ONLY QRIS)
  payment: {
    // QRIS Information
    qris: {
      enabled: true,
      name: 'QRIS UMbandung Festival',
      nmid: 'ID1025421181005',
      image: './assets/qris-umbandung.jpg',
      description: 'SATU QRIS UNTUK SEMUA - Scan dan bayar via aplikasi penyelenggara di www.aspi-qris.id',
      printedBy: '93600914',
      version: 'v0.0.2025.11.24',
      verificationRequired: true,
      verificationTime: '1x24 jam'
    },
    countdown: 86400 // 24 hours in seconds
  },

  // Contact Information
  contact: {
    email: 'umbandungfest@gmail.com',
    emailSupport: 'umbandungfest@gmail.com',
    whatsapp: '6285726132201',
    whatsappDisplay: '0857-2613-2201',
    instagram: '@umbandungfest',
    address: 'Lapangan Adymic, Universitas Muhammadiyah Bandung'
  },

  // Order Status
  orderStatus: {
    PENDING_PAYMENT: 'pending_payment',
    WAITING_VERIFICATION: 'waiting_verification',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    EXPIRED: 'expired'
  },

  // File Upload Settings
  upload: {
    maxSize: 2, // MB
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
  },

  // Remote Image Upload Provider (proof of payment)
  imageUpload: {
    enabled: true,
    provider: 'imgbb',
    apiKey: '1b585ca152f56b36c580826d1f4cdea1', // NOTE: Consider hiding this key in production.
    endpoint: 'https://api.imgbb.com/1/upload',
    // Fallback: if imgbb fails, we temporarily keep base64 in local storage only (not recommended for production)
    fallbackToBase64: true
  },

  // API Endpoints (untuk future development)
  api: {
    baseUrl: 'https://api.umbandungfest.com', // Ganti dengan domain lo
    // PHP Endpoints (cPanel hosting)
    phpEndpoints: {
      saveOrder: '/save_order.php',        // Absolute path dari root
      sendEmail: '/send_ticket_email.php',
      getOrders: '/get_orders.php',
      updateOrderStatus: '/update_order_status.php',
      generateTickets: '/generate_tickets.php'  // NEW: Generate tickets for order
    },
    // N8N Webhook URL - GANTI DENGAN URL PRODUCTION LO!
    n8nWebhook: 'https://revy.app.n8n.cloud/webhook/new-order', // TODO: Update ini!
    endpoints: {
      createOrder: '/api/orders/create',
      uploadProof: '/api/orders/upload-proof',
      checkStatus: '/api/orders/status',
      getTicket: '/api/tickets/get'
    }
  },

  // Storage Keys
  storage: {
    orderData: 'umb_order_data',
    completeOrderData: 'umb_complete_order',
    ticketData: 'umb_ticket_data',
    orderPrefix: 'order_' // For admin panel to find all orders
  },

  // Messages
  messages: {
    errors: {
      orderNotFound: 'Data pesanan tidak ditemukan. Silakan ulangi proses pemesanan.',
      invalidEmail: 'Format email tidak valid!',
      invalidPhone: 'Nomor WhatsApp harus 9-13 digit angka!',
      incompleteData: 'Mohon lengkapi semua data yang diperlukan!',
      termsNotAgreed: 'Anda harus menyetujui syarat dan ketentuan!',
      fileTooBig: 'Ukuran file maksimal 2MB!',
      invalidFileFormat: 'Format file tidak valid! Gunakan JPG, PNG, atau PDF.',
      uploadFailed: 'Upload gagal! Silakan coba lagi.',
      paymentExpired: 'Waktu pembayaran telah habis. Silakan ulangi proses pemesanan.'
    },
    success: {
      orderCreated: 'Pesanan berhasil dibuat!',
      proofUploaded: 'Bukti transfer berhasil diupload! Menunggu verifikasi admin.',
      paymentVerified: 'Pembayaran Anda telah diverifikasi!',
      textCopied: 'Berhasil disalin!',
      ticketShared: 'E-ticket berhasil dibagikan!'
    },
    info: {
      verificationPending: 'Bukti pembayaran Anda sedang diverifikasi oleh tim kami. Anda akan menerima konfirmasi via email dan WhatsApp dalam 1x24 jam.',
      uploadInstruction: 'Upload bukti transfer Anda dan tunggu verifikasi dari admin.',
      paymentInstruction: 'Transfer sesuai nominal yang tertera dan upload bukti transfer.',
      ticketNotReady: 'Tiket belum bisa digunakan. Tunggu verifikasi admin terlebih dahulu.'
    }
  }
};

// Export configuration (untuk module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
