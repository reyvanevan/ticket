// ============================================
// TICKETING SYSTEM JAVASCRIPT (MODULAR)
// UMbandung Festival 2025
// ============================================

// Import dependencies
// NOTE: config.js and utils.js harus diload sebelum file ini

// Check if dependencies loaded
if (typeof CONFIG === 'undefined') {
  console.error('CONFIG not loaded! Please include config.js before ticket.js');
}
if (typeof formatRupiah === 'undefined') {
  console.error('Utils not loaded! Please include utils.js before ticket.js');
}

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

    // Get pricing from config
    const basePrice = CONFIG.pricing.regular.price;
    const adminFeeValue = CONFIG.pricing.adminFee;
    const maxQty = CONFIG.pricing.maxQuantity;

    // Update price display
    function updatePrice() {
      const qty = parseInt(quantityInput.value);
      const orderTotal = calculateOrderTotal(qty, basePrice, adminFeeValue);

      ticketQty.textContent = qty;
      ticketPrice.textContent = formatRupiah(orderTotal.subtotal);
      adminFee.textContent = formatRupiah(orderTotal.adminFee);
      totalPrice.textContent = formatRupiah(orderTotal.total);
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
      if (qty < maxQty) {
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
      const qty = parseInt(quantityInput.value);
      const orderTotal = calculateOrderTotal(qty, basePrice, adminFeeValue);
      
      const orderData = {
        eventId: eventId,
        eventInfo: CONFIG.event,
        quantity: qty,
        ticketPrice: basePrice,
        adminFee: adminFeeValue,
        subtotal: orderTotal.subtotal,
        total: orderTotal.total,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage using config key
      setStorageData(CONFIG.storage.orderData, orderData);

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
    // Get order data from localStorage using config key
    const orderData = getStorageData(CONFIG.storage.orderData);

    if (!orderData) {
      showAlert(CONFIG.messages.errors.orderNotFound, 'error');
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
        paymentMethod: 'qris', // Force QRIS as only payment method
        agree: document.getElementById('agree').checked
      };

      // Validation
      if (!formData.fullName || !formData.email || !formData.phone || !formData.idNumber) {
        showAlert(CONFIG.messages.errors.incompleteData, 'error');
        return;
      }

      if (!formData.agree) {
        showAlert(CONFIG.messages.errors.termsNotAgreed, 'error');
        return;
      }

      // Validate email format
      if (!validateEmail(formData.email)) {
        showAlert(CONFIG.messages.errors.invalidEmail, 'error');
        return;
      }

      // Validate phone number
      if (!validatePhone(formData.phone)) {
        showAlert(CONFIG.messages.errors.invalidPhone, 'error');
        return;
      }

      // Combine buyer data with order data
      const completeOrderData = {
        ...orderData,
        buyer: formData,
        orderNumber: generateOrderNumber(),
        orderDate: new Date().toISOString(),
        status: CONFIG.orderStatus.PENDING_PAYMENT,
        paymentMethod: formData.paymentMethod
      };

      // Save to localStorage using config key
      setStorageData(CONFIG.storage.completeOrderData, completeOrderData);

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
    // Get complete order data using config key
    const completeOrderData = getStorageData(CONFIG.storage.completeOrderData);

    if (!completeOrderData) {
      showAlert(CONFIG.messages.errors.orderNotFound, 'error');
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
    
    // Update QRIS amount display
    const qrisAmountEl = document.getElementById('qrisAmount');
    if (qrisAmountEl) {
      qrisAmountEl.textContent = formatRupiah(completeOrderData.total);
    }

    // Update order number
    document.getElementById('orderNumber').textContent = completeOrderData.orderNumber;

    // Show QRIS payment method only (Transfer removed)
    document.getElementById('qrisMethod').style.display = 'block';
    const transferMethod = document.getElementById('transferMethod');
    if (transferMethod) {
      transferMethod.style.display = 'none';
    }

    // Payment countdown timer (24 hours)
    startPaymentCountdown();

    // Copy order number button
    const copyOrderBtn = document.getElementById('copyOrderBtn');
    if (copyOrderBtn) {
      copyOrderBtn.addEventListener('click', async function() {
        const orderNumber = document.getElementById('orderNumber').textContent;
        const success = await copyToClipboard(orderNumber);
        
        if (success) {
          // Change button text temporarily
          const btnSpan = this.querySelector('span');
          const originalText = btnSpan.textContent;
          btnSpan.textContent = 'Tersalin!';
          setTimeout(() => {
            btnSpan.textContent = originalText;
          }, 2000);
        }
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
          
          // Validate file using utility function
          const validation = validateFile(file, CONFIG.upload);
          
          if (!validation.valid) {
            showAlert(
              validation.error === 'File size exceeds 2MB' 
                ? CONFIG.messages.errors.fileTooBig 
                : CONFIG.messages.errors.invalidFileFormat,
              'error'
            );
            this.value = '';
            return;
          }

          uploadBox.innerHTML = `
            <i data-feather="check-circle" class="icon"></i>
            <p>${file.name}</p>
            <span>File siap diupload (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          `;
          feather.replace();
          submitProofBtn.disabled = false;
        }
      });
    }

    // Submit proof button handler dengan sistem verifikasi admin
    if (submitProofBtn) {
      submitProofBtn.addEventListener('click', async function() {
        if (!proofFile.files || !proofFile.files[0]) {
          showAlert('Silakan upload bukti transfer terlebih dahulu!', 'error');
          return;
        }

        const file = proofFile.files[0];
        
        // Disable button and show loading
        this.disabled = true;
        this.innerHTML = '<i data-feather="loader" class="icon"></i><span>Mengupload...</span>';
        feather.replace();

        try {
          // Simulate file upload (in production, this would be API call)
          const uploadResult = await simulateFileUpload(file);
          
          if (uploadResult.success) {
            // Update order status: PENDING_PAYMENT → WAITING_VERIFICATION
            completeOrderData.status = CONFIG.orderStatus.WAITING_VERIFICATION;
            completeOrderData.proofUploaded = true;
            completeOrderData.proofFileName = uploadResult.fileName;
            completeOrderData.proofUploadDate = uploadResult.uploadedAt;
            completeOrderData.proofFileUrl = uploadResult.fileUrl;
            
            // Save updated order data to session storage
            setStorageData(CONFIG.storage.completeOrderData, completeOrderData);

            // IMPORTANT: Save to persistent storage for admin access
            saveOrderToPersistentStorage(completeOrderData);

            // Show success message
            showAlert(CONFIG.messages.success.proofUploaded, 'success');
            
            // Redirect to waiting verification page
            setTimeout(() => {
              showLoadingAndRedirect('success.html');
            }, 1500);
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          showAlert(CONFIG.messages.errors.uploadFailed, 'error');
          
          // Re-enable button
          this.disabled = false;
          this.innerHTML = '<i data-feather="check"></i><span>Konfirmasi Pembayaran</span>';
          feather.replace();
        }
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
// SUCCESS PAGE (E-Ticket Display)
// ============================================
if (window.location.pathname.includes('success.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    // Get complete order data using utility function
    const completeOrderData = getStorageData(CONFIG.storage.completeOrderData);

    if (!completeOrderData) {
      showAlert('Data tiket tidak ditemukan.', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }

    // Check order status: should be VERIFIED or WAITING_VERIFICATION
    const isVerified = completeOrderData.status === CONFIG.orderStatus.VERIFIED;
    const isWaiting = completeOrderData.status === CONFIG.orderStatus.WAITING_VERIFICATION;

    // If not verified yet, show waiting message
    if (isWaiting) {
      // Display verification pending status
      const verificationAlert = document.createElement('div');
      verificationAlert.className = 'alert alert-info';
      verificationAlert.innerHTML = `
        <i data-feather="clock"></i>
        <div>
          <strong>Menunggu Verifikasi Admin</strong>
          <p>${CONFIG.messages.info.verificationPending}</p>
        </div>
      `;
      
      const ticketSection = document.querySelector('.ticket-section');
      if (ticketSection) {
        ticketSection.insertBefore(verificationAlert, ticketSection.firstChild);
      }
    }

    // Generate ticket numbers using utility function
    const ticketNumbers = generateTicketNumber(
      completeOrderData.orderNumber, 
      completeOrderData.quantity
    );

    // Update ticket information from CONFIG
    document.getElementById('ticketNumber').textContent = ticketNumbers[0];
    document.getElementById('ticketHolderName').textContent = completeOrderData.buyer.fullName;

    // Download ticket button
    const downloadTicketBtn = document.getElementById('downloadTicketBtn');
    if (downloadTicketBtn) {
      downloadTicketBtn.addEventListener('click', function() {
        if (!isVerified) {
          showAlert(CONFIG.messages.info.ticketNotReady, 'info');
          return;
        }
        
        // TODO: Implement actual PDF download
        showAlert(
          `Fitur download e-ticket akan segera tersedia!\n\nE-ticket telah dikirim ke email:\n${completeOrderData.buyer.email}`,
          'info'
        );
      });
    }

    // Share ticket button via WhatsApp
    const shareTicketBtn = document.getElementById('shareTicketBtn');
    if (shareTicketBtn) {
      shareTicketBtn.addEventListener('click', function() {
        if (!isVerified) {
          showAlert(CONFIG.messages.info.ticketNotReady, 'info');
          return;
        }

        // Create WhatsApp message using utility function
        const message = createTicketWhatsAppMessage({
          eventName: CONFIG.event.name,
          holderName: completeOrderData.buyer.fullName,
          ticketNumber: ticketNumbers[0],
          date: CONFIG.event.date,
          time: CONFIG.event.time,
          location: CONFIG.event.location
        });
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      });
    }

    // Print ticket button
    const printTicketBtn = document.getElementById('printTicketBtn');
    if (printTicketBtn) {
      printTicketBtn.addEventListener('click', function() {
        if (!isVerified) {
          showAlert(CONFIG.messages.info.ticketNotReady, 'info');
          return;
        }
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
// LEGACY UTILITY FUNCTIONS (For backward compatibility)
// TODO: Remove after all code migrated to utils.js
// ============================================

// Copy bank account number with alert
function copyText(text) {
  copyToClipboard(text);
  showAlert('Nomor rekening berhasil disalin!', 'success');
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
      showAlert('Waktu pembayaran telah habis. Silakan ulangi proses pemesanan.', 'error');
      setTimeout(() => {
        window.location.href = 'ticket-detail.html';
      }, 2000);
      return;
    }

    // Format and display using utility function
    timerElement.textContent = formatCountdownTime(timeRemaining);
  }, 1000);
}
