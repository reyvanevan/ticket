// ============================================
// TICKETING SYSTEM JAVASCRIPT
// UMbandung Festival 2025
// ============================================

// Event data (bisa dikembangkan dengan database/API)
const eventData = {
  'umbandung-fest-2025': {
    name: 'UMbandung Festival 2025',
    date: '2025-11-29',
    time: '10:00 WIB',
    location: 'Lapangan Adymic UMbandung',
    price: 20000,
    adminFee: 1000,
    image: './assets/umbandung-fest-2025.jpg'
  }
};

// ============================================
// TICKET DETAIL PAGE
// ============================================
if (window.location.pathname.includes('ticket-detail.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event') || 'umbandung-fest-2025';
    
    // Ticket quantity controls
    const minusBtn = document.getElementById('minusBtn');
    const plusBtn = document.getElementById('plusBtn');
    const quantityInput = document.getElementById('quantity');
    const ticketQty = document.getElementById('ticketQty');
    const ticketPrice = document.getElementById('ticketPrice');
    const adminFee = document.getElementById('adminFee');
    const totalPrice = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const basePrice = 20000;
    const adminFeeValue = 1000;

    // Update price display
    function updatePrice() {
      const qty = parseInt(quantityInput.value);
      const subtotal = basePrice * qty;
      const total = subtotal + adminFeeValue;

      ticketQty.textContent = qty;
      ticketPrice.textContent = formatRupiah(subtotal);
      adminFee.textContent = formatRupiah(adminFeeValue);
      totalPrice.textContent = formatRupiah(total);
    }

    // Format number to Rupiah
    function formatRupiah(number) {
      return 'Rp ' + number.toLocaleString('id-ID');
    }

    // Decrease quantity
    minusBtn.addEventListener('click', function() {
      let qty = parseInt(quantityInput.value);
      if (qty > 1) {
        quantityInput.value = qty - 1;
        updatePrice();
      }
    });

    // Increase quantity
    plusBtn.addEventListener('click', function() {
      let qty = parseInt(quantityInput.value);
      if (qty < 5) {
        quantityInput.value = qty + 1;
        updatePrice();
      }
    });

    // Initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }

    // Checkout button handler
    checkoutBtn.addEventListener('click', function() {
      const orderData = {
        eventId: eventId,
        eventName: 'UMbandung Festival 2025',
        quantity: parseInt(quantityInput.value),
        ticketPrice: basePrice,
        adminFee: adminFeeValue,
        subtotal: basePrice * parseInt(quantityInput.value),
        total: (basePrice * parseInt(quantityInput.value)) + adminFeeValue
      };

      // Save to localStorage
      localStorage.setItem('orderData', JSON.stringify(orderData));

      // Show loading and redirect
      showLoadingAndRedirect('checkout.html');
    });

    // Initial price update
    updatePrice();
  });
}

// ============================================
// CHECKOUT PAGE
// ============================================
if (window.location.pathname.includes('checkout.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    // Get order data from localStorage
    const orderData = JSON.parse(localStorage.getItem('orderData'));

    if (!orderData) {
      alert('Data pesanan tidak ditemukan. Silakan pilih tiket terlebih dahulu.');
      window.location.href = 'ticket-detail.html';
      return;
    }

    // Update order summary
    document.getElementById('orderQty').textContent = orderData.quantity;
    document.getElementById('orderSubtotal').textContent = formatRupiah(orderData.subtotal);
    document.getElementById('orderAdminFee').textContent = formatRupiah(orderData.adminFee);
    document.getElementById('orderTotal').textContent = formatRupiah(orderData.total);

    // Payment method selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
      option.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
      });
    });

    // Form validation and submission
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Get form data
      const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        idNumber: document.getElementById('idNumber').value,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        agree: document.getElementById('agree').checked
      };

      // Validation
      if (!formData.fullName || !formData.email || !formData.phone || !formData.idNumber) {
        alert('Mohon lengkapi semua data yang diperlukan!');
        return;
      }

      if (!formData.agree) {
        alert('Anda harus menyetujui syarat dan ketentuan!');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Format email tidak valid!');
        return;
      }

      // Validate phone number (8-13 digits)
      const phoneRegex = /^[0-9]{9,13}$/;
      if (!phoneRegex.test(formData.phone)) {
        alert('Nomor WhatsApp harus 9-13 digit angka!');
        return;
      }

      // Combine buyer data with order data
      const completeOrderData = {
        ...orderData,
        buyer: formData,
        orderNumber: generateOrderNumber(),
        orderDate: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));

      // Show loading and redirect to payment
      showLoadingAndRedirect('payment.html');
    });

    // Initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  });
}

// ============================================
// PAYMENT PAGE
// ============================================
if (window.location.pathname.includes('payment.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    // Get complete order data
    const completeOrderData = JSON.parse(localStorage.getItem('completeOrderData'));

    if (!completeOrderData) {
      alert('Data pembayaran tidak ditemukan. Silakan ulangi proses pemesanan.');
      window.location.href = 'ticket-detail.html';
      return;
    }

    // Update buyer information
    document.getElementById('buyerName').textContent = completeOrderData.buyer.fullName;
    document.getElementById('buyerEmail').textContent = completeOrderData.buyer.email;
    document.getElementById('buyerPhone').textContent = '+62' + completeOrderData.buyer.phone;

    // Update order summary
    document.getElementById('summaryQty').textContent = completeOrderData.quantity;
    document.getElementById('summarySubtotal').textContent = formatRupiah(completeOrderData.subtotal);
    document.getElementById('summaryAdminFee').textContent = formatRupiah(completeOrderData.adminFee);
    document.getElementById('summaryTotal').textContent = formatRupiah(completeOrderData.total);
    document.getElementById('transferAmount').textContent = formatRupiah(completeOrderData.total);

    // Update order number
    document.getElementById('orderNumber').textContent = completeOrderData.orderNumber;

    // Show appropriate payment method
    const paymentMethod = completeOrderData.buyer.paymentMethod;
    if (paymentMethod === 'qris') {
      document.getElementById('qrisMethod').style.display = 'block';
      document.getElementById('transferMethod').style.display = 'none';
    } else {
      document.getElementById('qrisMethod').style.display = 'none';
      document.getElementById('transferMethod').style.display = 'block';
    }

    // Payment countdown timer (24 hours)
    startPaymentCountdown();

    // Copy order number button
    const copyOrderBtn = document.getElementById('copyOrderBtn');
    if (copyOrderBtn) {
      copyOrderBtn.addEventListener('click', function() {
        const orderNumber = document.getElementById('orderNumber').textContent;
        copyToClipboard(orderNumber);
        
        // Change button text temporarily
        const btnSpan = this.querySelector('span');
        const originalText = btnSpan.textContent;
        btnSpan.textContent = 'Tersalin!';
        setTimeout(() => {
          btnSpan.textContent = originalText;
        }, 2000);
      });
    }

    // Upload proof file handler
    const uploadBox = document.getElementById('uploadBox');
    const proofFile = document.getElementById('proofFile');
    const submitProofBtn = document.getElementById('submitProofBtn');

    if (uploadBox && proofFile) {
      uploadBox.addEventListener('click', function() {
        proofFile.click();
      });

      proofFile.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          const file = this.files[0];
          const fileSize = file.size / 1024 / 1024; // in MB

          if (fileSize > 2) {
            alert('Ukuran file maksimal 2MB!');
            this.value = '';
            return;
          }

          uploadBox.innerHTML = `
            <i data-feather="check-circle" class="icon"></i>
            <p>${file.name}</p>
            <span>File siap diupload</span>
          `;
          feather.replace();
          submitProofBtn.disabled = false;
        }
      });
    }

    // Submit proof button handler
    if (submitProofBtn) {
      submitProofBtn.addEventListener('click', function() {
        if (!proofFile.files || !proofFile.files[0]) {
          alert('Silakan upload bukti transfer terlebih dahulu!');
          return;
        }

        // Simulate upload process
        this.disabled = true;
        this.innerHTML = '<i data-feather="loader" class="icon"></i><span>Mengupload...</span>';
        feather.replace();

        // Simulate API call
        setTimeout(() => {
          // Save proof upload status
          completeOrderData.proofUploaded = true;
          completeOrderData.proofUploadDate = new Date().toISOString();
          localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));

          // Redirect to success page
          showLoadingAndRedirect('success.html');
        }, 2000);
      });
    }

    // For QRIS, simulate automatic payment detection
    if (paymentMethod === 'qris') {
      // Auto redirect after 10 seconds (simulation)
      setTimeout(() => {
        if (confirm('Pembayaran terdeteksi! Lanjutkan ke halaman konfirmasi?')) {
          completeOrderData.paymentConfirmed = true;
          completeOrderData.paymentDate = new Date().toISOString();
          localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));
          showLoadingAndRedirect('success.html');
        }
      }, 10000);
    }

    // Initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  });
}

// ============================================
// SUCCESS PAGE
// ============================================
if (window.location.pathname.includes('success.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    // Get complete order data
    const completeOrderData = JSON.parse(localStorage.getItem('completeOrderData'));

    if (!completeOrderData) {
      alert('Data tiket tidak ditemukan.');
      window.location.href = 'index.html';
      return;
    }

    // Generate ticket numbers
    const ticketNumbers = [];
    for (let i = 0; i < completeOrderData.quantity; i++) {
      ticketNumbers.push(`${completeOrderData.orderNumber}-${String(i + 1).padStart(3, '0')}`);
    }

    // Update ticket information
    document.getElementById('ticketNumber').textContent = ticketNumbers[0];
    document.getElementById('ticketHolderName').textContent = completeOrderData.buyer.fullName;

    // Download ticket button
    const downloadTicketBtn = document.getElementById('downloadTicketBtn');
    if (downloadTicketBtn) {
      downloadTicketBtn.addEventListener('click', function() {
        alert('Fitur download e-ticket akan segera tersedia!\n\nE-ticket telah dikirim ke email:\n' + completeOrderData.buyer.email);
      });
    }

    // Share ticket button
    const shareTicketBtn = document.getElementById('shareTicketBtn');
    if (shareTicketBtn) {
      shareTicketBtn.addEventListener('click', function() {
        const message = `🎫 *E-Ticket UMbandung Festival 2025*\n\n` +
                       `Nama: ${completeOrderData.buyer.fullName}\n` +
                       `Nomor Tiket: ${ticketNumbers[0]}\n` +
                       `Tanggal: 29 November 2025\n` +
                       `Waktu: 10:00 WIB\n` +
                       `Lokasi: Lapangan Adymic UMbandung\n\n` +
                       `Jangan lupa datang tepat waktu! 🎉`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      });
    }

    // Print ticket button
    const printTicketBtn = document.getElementById('printTicketBtn');
    if (printTicketBtn) {
      printTicketBtn.addEventListener('click', function() {
        window.print();
      });
    }

    // Initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }

    // Clear localStorage after successful order (optional)
    // localStorage.removeItem('orderData');
    // localStorage.removeItem('completeOrderData');
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format number to Rupiah
function formatRupiah(number) {
  return 'Rp ' + number.toLocaleString('id-ID');
}

// Generate order number
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  
  return `UMB${year}${month}${day}${random}`;
}

// Copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  }
}

// Show loading overlay and redirect
function showLoadingAndRedirect(url) {
  // Create loading overlay
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-spinner">
      <i data-feather="loader"></i>
      <p>Memuat halaman...</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // Replace feather icons in overlay
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // Redirect after short delay
  setTimeout(() => {
    window.location.href = url;
  }, 800);
}

// Payment countdown timer
function startPaymentCountdown() {
  const timerElement = document.getElementById('paymentTimer');
  if (!timerElement) return;

  // Set countdown duration (24 hours = 86400 seconds)
  let timeRemaining = 86400;

  const countdownInterval = setInterval(() => {
    timeRemaining--;

    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);
      timerElement.textContent = '00:00:00';
      alert('Waktu pembayaran telah habis. Silakan ulangi proses pemesanan.');
      window.location.href = 'ticket-detail.html';
      return;
    }

    // Calculate hours, minutes, seconds
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    // Format and display
    timerElement.textContent = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// Copy bank account number
function copyText(text) {
  copyToClipboard(text);
  alert('Nomor rekening berhasil disalin!');
}
