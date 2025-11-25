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

  // Payment Methods
  payment: {
    methods: {
      qris: {
        enabled: false, // Disabled - hanya transfer bank
        name: 'QRIS',
        description: 'Scan QR code dengan e-wallet',
        icon: 'smartphone'
      },
      transfer: {
        enabled: true,
        name: 'Transfer Bank',
        description: 'BCA, Mandiri, BNI, BRI',
        icon: 'credit-card',
        verificationRequired: true,
        verificationTime: '1x24 jam'
      }
    },
    banks: [
      {
        name: 'Bank BCA',
        accountNumber: '1234567890',
        accountName: 'Panitia UMbandung Festival',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg'
      },
      {
        name: 'Bank Mandiri',
        accountNumber: '0987654321',
        accountName: 'Panitia UMbandung Festival',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg'
      },
      {
        name: 'Bank BNI',
        accountNumber: '1122334455',
        accountName: 'Panitia UMbandung Festival',
        logo: 'https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg'
      }
    ],
    countdown: 86400 // 24 hours in seconds
  },

  // Contact Information
  contact: {
    email: 'info@umbandungfest.com',
    emailSupport: 'lentera@umbandung.ac.id',
    whatsapp: '6281234567890',
    whatsappDisplay: '0812-3456-7890',
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

  // API Endpoints (untuk future development)
  api: {
    baseUrl: 'https://api.umbandungfest.com',
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
    ticketData: 'umb_ticket_data'
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
      paymentInstruction: 'Transfer sesuai nominal yang tertera dan upload bukti transfer.'
    }
  }
};

// Export configuration (untuk module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
