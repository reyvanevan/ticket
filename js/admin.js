// ============================================
// ADMIN PANEL - Order Management & Verification
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Get all orders from localStorage
  const allOrders = getAllOrders();
  
  // Current filter status
  let currentFilter = 'all';

  // Initialize admin panel
  initializeAdmin();

  // ============================================
  // INITIALIZATION
  // ============================================
  function initializeAdmin() {
    updateStatistics();
    renderOrders(allOrders);
    setupEventListeners();
    
    // Feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  // ============================================
  // GET ALL ORDERS
  // ============================================
  function getAllOrders() {
    const orders = [];
    
    // Loop through localStorage to find all order data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Check if key matches order pattern
      if (key.startsWith('order_')) {
        try {
          const orderData = JSON.parse(localStorage.getItem(key));
          if (orderData && orderData.orderNumber) {
            orders.push({
              ...orderData,
              storageKey: key
            });
          }
        } catch (error) {
          console.error('Error parsing order:', key, error);
        }
      }
    }

    // Sort by creation date (newest first)
    return orders.sort((a, b) => {
      const dateA = new Date(a.orderDate || 0);
      const dateB = new Date(b.orderDate || 0);
      return dateB - dateA;
    });
  }

  // ============================================
  // UPDATE STATISTICS
  // ============================================
  function updateStatistics() {
    const stats = {
      total: 0,
      waiting: 0,
      verified: 0,
      revenue: 0
    };

    allOrders.forEach(order => {
      stats.total++;
      
      if (order.status === CONFIG.orderStatus.WAITING_VERIFICATION) {
        stats.waiting++;
      } else if (order.status === CONFIG.orderStatus.VERIFIED) {
        stats.verified++;
        stats.revenue += order.totalAmount || 0;
      }
    });

    // Update DOM
    document.getElementById('totalOrders').textContent = stats.total;
    document.getElementById('waitingOrders').textContent = stats.waiting;
    document.getElementById('verifiedOrders').textContent = stats.verified;
    document.getElementById('totalRevenue').textContent = formatRupiah(stats.revenue);
  }

  // ============================================
  // RENDER ORDERS TABLE
  // ============================================
  function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');

    // Filter orders based on current filter
    let filteredOrders = orders;
    if (currentFilter !== 'all') {
      filteredOrders = orders.filter(order => order.status === currentFilter);
    }

    // Show empty state if no orders
    if (filteredOrders.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
      return;
    }

    emptyState.style.display = 'none';

    // Render table rows
    tbody.innerHTML = filteredOrders.map(order => {
      const statusClass = getStatusClass(order.status);
      const statusText = getStatusText(order.status);
      const hasProof = order.proofUploaded && order.proofFileUrl;

      return `
        <tr data-order-id="${order.orderNumber}">
          <td><strong>${order.orderNumber}</strong></td>
          <td>${order.buyer.fullName}</td>
          <td>${order.buyer.email}</td>
          <td>${order.buyer.phone}</td>
          <td>${order.quantity}x</td>
          <td>${formatRupiah(order.totalAmount)}</td>
          <td>
            <span class="status-badge status-${statusClass}">${statusText}</span>
          </td>
          <td>
            ${hasProof ? 
              `<img src="${order.proofFileUrl}" alt="Bukti Transfer" class="proof-preview" onclick="showProofModal('${order.proofFileUrl}')">` :
              '<span style="opacity: 0.5;">Belum upload</span>'
            }
          </td>
          <td>
            <div class="action-buttons">
              ${order.status === CONFIG.orderStatus.WAITING_VERIFICATION && hasProof ? `
                <button class="action-btn btn-approve" onclick="approveOrder('${order.orderNumber}')">
                  <i data-feather="check"></i> Approve
                </button>
                <button class="action-btn btn-reject" onclick="rejectOrder('${order.orderNumber}')">
                  <i data-feather="x"></i> Reject
                </button>
              ` : ''}
              <button class="action-btn btn-view" onclick="viewOrderDetails('${order.orderNumber}')">
                <i data-feather="eye"></i> Detail
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Re-initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  function getStatusClass(status) {
    const statusMap = {
      [CONFIG.orderStatus.PENDING_PAYMENT]: 'pending',
      [CONFIG.orderStatus.WAITING_VERIFICATION]: 'waiting',
      [CONFIG.orderStatus.VERIFIED]: 'verified',
      [CONFIG.orderStatus.REJECTED]: 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  function getStatusText(status) {
    const textMap = {
      [CONFIG.orderStatus.PENDING_PAYMENT]: 'Pending Payment',
      [CONFIG.orderStatus.WAITING_VERIFICATION]: 'Waiting Verification',
      [CONFIG.orderStatus.VERIFIED]: 'Verified',
      [CONFIG.orderStatus.REJECTED]: 'Rejected'
    };
    return textMap[status] || status;
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active state
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Update filter and re-render
        currentFilter = this.dataset.status;
        renderOrders(allOrders);
      });
    });

    // Modal close
    const modal = document.getElementById('proofModal');
    const closeModal = document.getElementById('closeModal');
    
    closeModal.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // ============================================
  // GLOBAL FUNCTIONS (for onclick handlers)
  // ============================================
  window.approveOrder = function(orderNumber) {
    if (!confirm(`Approve pesanan ${orderNumber}?\n\nE-ticket akan dikirim ke email pembeli.`)) {
      return;
    }

    // Find order
    const order = allOrders.find(o => o.orderNumber === orderNumber);
    if (!order) {
      showAlert('Pesanan tidak ditemukan!', 'error');
      return;
    }

    // Update status to VERIFIED
    order.status = CONFIG.orderStatus.VERIFIED;
    order.verifiedDate = new Date().toISOString();
    order.verifiedBy = 'Admin'; // In production, use actual admin name

    // Save to localStorage
    localStorage.setItem(order.storageKey, JSON.stringify(order));

    // Also update completeOrderData if it's the current session
    const currentOrderData = getStorageData(CONFIG.storage.completeOrderData);
    if (currentOrderData && currentOrderData.orderNumber === orderNumber) {
      currentOrderData.status = CONFIG.orderStatus.VERIFIED;
      currentOrderData.verifiedDate = order.verifiedDate;
      setStorageData(CONFIG.storage.completeOrderData, currentOrderData);
    }

    // Show success message
    showAlert(`✅ Pesanan ${orderNumber} berhasil diverifikasi!\n\nE-ticket telah dikirim ke ${order.buyer.email}`, 'success');

    // Refresh display
    location.reload();
  };

  window.rejectOrder = function(orderNumber) {
    const reason = prompt(`Reject pesanan ${orderNumber}?\n\nMasukkan alasan penolakan:`);
    
    if (!reason) {
      return; // User cancelled
    }

    // Find order
    const order = allOrders.find(o => o.orderNumber === orderNumber);
    if (!order) {
      showAlert('Pesanan tidak ditemukan!', 'error');
      return;
    }

    // Update status to REJECTED
    order.status = CONFIG.orderStatus.REJECTED;
    order.rejectedDate = new Date().toISOString();
    order.rejectedBy = 'Admin';
    order.rejectionReason = reason;

    // Save to localStorage
    localStorage.setItem(order.storageKey, JSON.stringify(order));

    // Also update completeOrderData if it's the current session
    const currentOrderData = getStorageData(CONFIG.storage.completeOrderData);
    if (currentOrderData && currentOrderData.orderNumber === orderNumber) {
      currentOrderData.status = CONFIG.orderStatus.REJECTED;
      currentOrderData.rejectedDate = order.rejectedDate;
      currentOrderData.rejectionReason = reason;
      setStorageData(CONFIG.storage.completeOrderData, currentOrderData);
    }

    // Show message
    showAlert(`❌ Pesanan ${orderNumber} ditolak.\n\nAlasan: ${reason}`, 'error');

    // Refresh display
    location.reload();
  };

  window.viewOrderDetails = function(orderNumber) {
    const order = allOrders.find(o => o.orderNumber === orderNumber);
    if (!order) {
      showAlert('Pesanan tidak ditemukan!', 'error');
      return;
    }

    // Format order details
    const details = `
📋 DETAIL PESANAN

Order ID: ${order.orderNumber}
Status: ${getStatusText(order.status)}
Tanggal Order: ${new Date(order.orderDate).toLocaleString('id-ID')}

👤 INFORMASI PEMBELI
Nama: ${order.buyer.fullName}
Email: ${order.buyer.email}
WhatsApp: ${order.buyer.phone}
ID Card: ${order.buyer.idNumber}

🎫 DETAIL TIKET
Quantity: ${order.quantity}x
Harga Satuan: ${formatRupiah(order.ticketPrice)}
Biaya Admin: ${formatRupiah(order.adminFee)}
Total: ${formatRupiah(order.totalAmount)}

💳 PEMBAYARAN
Metode: ${order.paymentMethod}
${order.proofUploaded ? `Upload Bukti: ${new Date(order.proofUploadDate).toLocaleString('id-ID')}` : 'Belum upload bukti'}
${order.verifiedDate ? `\n✅ Verified: ${new Date(order.verifiedDate).toLocaleString('id-ID')}` : ''}
${order.rejectedDate ? `\n❌ Rejected: ${new Date(order.rejectedDate).toLocaleString('id-ID')}\nAlasan: ${order.rejectionReason}` : ''}
    `;

    alert(details);
  };

  window.showProofModal = function(imageUrl) {
    const modal = document.getElementById('proofModal');
    const proofImage = document.getElementById('proofImage');
    
    proofImage.src = imageUrl;
    modal.classList.add('active');
  };
});
