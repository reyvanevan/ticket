// ============================================
// ADMIN PANEL - Order Management & Verification
// INTEGRATED WITH DATABASE & N8N
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // State management
  let allOrders = [];
  let currentFilter = 'all';
  let isLoading = false;

  // Initialize admin panel
  initializeAdmin();

  // ============================================
  // INITIALIZATION
  // ============================================
  async function initializeAdmin() {
    showLoadingState();
    
    try {
      await loadOrdersFromDatabase();
      updateStatistics();
      renderOrders(allOrders);
      setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize admin panel:', error);
      showErrorState('Gagal memuat data. Silakan refresh halaman.');
    } finally {
      hideLoadingState();
    }
    
    // Feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  // ============================================
  // LOAD ORDERS FROM DATABASE (via PHP API)
  // ============================================
  async function loadOrdersFromDatabase() {
    try {
      const response = await fetch(CONFIG.api.phpEndpoints.getOrders);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch orders');
      }
      
      allOrders = result.data.orders;
      
      console.log('✅ Loaded orders from database:', allOrders.length);
      
      return allOrders;
      
    } catch (error) {
      console.error('Error loading orders:', error);
      
      // Fallback to localStorage if database fails
      console.warn('⚠️ Falling back to localStorage...');
      allOrders = getAllOrdersFromLocalStorage();
      
      throw error;
    }
  }

  // ============================================
  // FALLBACK: GET ORDERS FROM LOCALSTORAGE
  // ============================================
  function getAllOrdersFromLocalStorage() {
    const orders = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('order_')) {
        try {
          const orderData = JSON.parse(localStorage.getItem(key));
          if (orderData && orderData.orderNumber) {
            orders.push({
              ...orderData,
              storageKey: key,
              total: orderData.total || orderData.totalAmount || 0
            });
          }
        } catch (error) {
          console.error('Error parsing order:', key, error);
        }
      }
    }

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
        stats.revenue += order.total || 0;
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
      const fileUrl = (order.proofFileUrl || '').trim();
      const fileName = (order.proofFileName || '').trim();
      const hasProof = !!(order.proofUploaded && (fileUrl || fileName));
      const hasUsableUrl = !!fileUrl; // only render media when we actually have a URL
      const isImage = hasUsableUrl && (
        fileUrl.startsWith('data:image') ||
        /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(fileUrl)
      );

      return `
        <tr data-order-id="${order.orderNumber}">
          <td><strong>${order.orderNumber}</strong></td>
          <td>${order.buyer.fullName}</td>
          <td>${order.buyer.email}</td>
          <td>${order.buyer.phone}</td>
          <td>${order.quantity}x</td>
          <td>${formatRupiah(order.total)}</td>
          <td>
            <span class="status-badge status-${statusClass}">${statusText}</span>
          </td>
          <td>
            ${hasProof
              ? (
                  hasUsableUrl
                    ? `<a href="${fileUrl}" target="_blank" rel="noopener" class="action-btn btn-view"><i data-feather="external-link"></i> Buka Bukti</a>`
                    : `<span title="${fileName}"><i data-feather="file"></i> ${fileName || 'Bukti tersedia (tanpa URL)'}</span>`
                )
              : '<span style="opacity: 0.5;">Belum upload</span>'
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

  function showLoadingState() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">⏳ Memuat data...</td></tr>';
  }

  function hideLoadingState() {
    // Will be replaced by actual data
  }

  function showErrorState(message) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #f44336;">❌ ${message}</td></tr>`;
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
  // APPROVE ORDER (UPDATE DATABASE + SEND EMAIL FROM CLIENT)
  // ============================================
  window.approveOrder = async function(orderNumber) {
    console.log('🚀 approveOrder() CALLED with orderNumber:', orderNumber);
    console.log('🔧 CONFIG.api.n8nWebhook:', CONFIG.api.n8nWebhook);
    
    if (!confirm(`✅ Approve pesanan ${orderNumber}?\n\nE-ticket akan dikirim otomatis ke email pembeli via n8n.`)) {
      console.log('❌ User cancelled approval');
      return;
    }

    // Show loading
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-feather="loader"></i> Processing...';
    feather.replace();

    try {
      console.log('📝 Step 1: Updating database...');
      
      // Step 1: Update order status in database via PHP
      const response = await fetch(CONFIG.api.phpEndpoints.updateOrderStatus, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          status: 'verified',
          adminName: 'Admin' // TODO: Get from login session
        })
      });

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to approve order');
      }

      // Step 1b: Delete local proof to save storage
      try {
        const delResp = await fetch('/clear_proof.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber })
        });
        const delJson = await delResp.json();
        console.log('🧹 Clear proof:', delJson);
      } catch (delErr) {
        console.warn('⚠️ Failed to clear proof:', delErr);
      }

      // Step 2: Get order data for email
      const order = allOrders.find(o => o.orderNumber === orderNumber);
      if (!order) {
        throw new Error('Order data not found');
      }

      console.log('📝 Step 3: Generating tickets...');
      
      // Step 3: Generate tickets in database
      const ticketsResponse = await fetch(CONFIG.api.phpEndpoints.generateTickets, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderNumber: orderNumber
        })
      });

      const ticketsResult = await ticketsResponse.json();
      
      if (ticketsResult.status !== 'success') {
        throw new Error(ticketsResult.message || 'Failed to generate tickets');
      }

      const ticketNumbers = ticketsResult.data.tickets; // Array of ticket codes
      
      console.log('✅ Generated tickets:', ticketNumbers);
      console.log('📧 Email will be sent to:', order.buyer.email);

      // Step 4: Send email via n8n webhook (multiple QR codes)
      let emailSent = false;
      try {
        // Payload sesuai dokumentasi n8n_workflow.md
        const emailPayload = {
          nama: order.buyer.fullName,
          email: order.buyer.email,
          kodes: ticketNumbers,  // Array of ticket codes untuk multiple QR
          order_number: orderNumber,
          quantity: parseInt(order.quantity) || 1,
          total: parseInt(order.total) || 0
        };

        console.log('📤 Sending to n8n:', {
          webhook: CONFIG.api.n8nWebhook,
          ticketCount: ticketNumbers.length,
          payload: emailPayload
        });
        
        const emailResponse = await fetch(CONFIG.api.n8nWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        console.log('📥 n8n Response Status:', emailResponse.status, emailResponse.statusText);
        
        const responseText = await emailResponse.text();
        console.log('📥 n8n Response Body:', responseText);
        
        if (emailResponse.ok) {
          emailSent = true;
          console.log('✅ Email sent via n8n successfully');
        } else {
          console.error('⚠️ n8n webhook error:', {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            response: responseText
          });
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send email via n8n:', emailError);
        console.error('⚠️ Error stack:', emailError.stack);
        // Don't throw - order is already approved in database
      }

      // Show success message
      const ticketInfo = ticketNumbers.length > 1 ? 
        `\n🎫 ${ticketNumbers.length} tiket telah digenerate` :
        '\n🎫 Tiket telah digenerate';
      const emailInfo = emailSent ? 
        '\n📧 E-ticket telah dikirim ke email pembeli!' : 
        '\n⚠️ Order approved, tapi email gagal dikirim (cek n8n).';
      
      alert(`✅ Pesanan ${orderNumber} berhasil diverifikasi!${ticketInfo}${emailInfo}`);

      // Reload data from database
      await loadOrdersFromDatabase();
      updateStatistics();
      renderOrders(allOrders);

    } catch (error) {
      console.error('Error approving order:', error);
      alert(`❌ Gagal approve order:\n${error.message}`);
      
      // Restore button
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      feather.replace();
    }
  };

  // ============================================
  // REJECT ORDER (UPDATE DATABASE)
  // ============================================
  window.rejectOrder = async function(orderNumber) {
    const reason = prompt(`❌ Reject pesanan ${orderNumber}?\n\nMasukkan alasan penolakan:`);
    
    if (!reason) {
      return; // User cancelled
    }

    // Show loading
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-feather="loader"></i> Processing...';
    feather.replace();

    try {
      // Call PHP API to update status
      const response = await fetch(CONFIG.api.phpEndpoints.updateOrderStatus, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          status: 'rejected',
          adminName: 'Admin',
          rejectionReason: reason
        })
      });

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to reject order');
      }

      // Show message
      alert(`❌ Pesanan ${orderNumber} ditolak.\n\nAlasan: ${reason}`);

      // Reload data
      await loadOrdersFromDatabase();
      updateStatistics();
      renderOrders(allOrders);

    } catch (error) {
      console.error('Error rejecting order:', error);
      alert(`❌ Gagal reject order:\n${error.message}`);
      
      // Restore button
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      feather.replace();
    }
  };

  // ============================================
  // VIEW ORDER DETAILS
  // ============================================
  window.viewOrderDetails = function(orderNumber) {
    const order = allOrders.find(o => o.orderNumber === orderNumber);
    if (!order) {
      alert('❌ Pesanan tidak ditemukan!');
      return;
    }

    // Format order details
    const details = `
📋 DETAIL PESANAN

Order ID: ${order.orderNumber}
Status: ${getStatusText(order.status)}
Tanggal Order: ${new Date(order.orderDate || order.createdAt).toLocaleString('id-ID')}

👤 INFORMASI PEMBELI
Nama: ${order.buyer.fullName}
Email: ${order.buyer.email}
WhatsApp: ${order.buyer.phone}
ID Card: ${order.buyer.idNumber}

🎫 DETAIL TIKET
Quantity: ${order.quantity}x
Harga Satuan: ${formatRupiah(order.ticketPrice)}
Biaya Admin: ${formatRupiah(order.adminFee)}
Total: ${formatRupiah(order.total)}

💳 PEMBAYARAN
Metode: ${order.paymentMethod}
${order.proofUploaded ? `Upload Bukti: ✅ ${order.proofFileName || 'Yes'}` : '❌ Belum upload bukti'}
${order.verifiedDate ? `\n✅ Verified: ${new Date(order.verifiedDate).toLocaleString('id-ID')}` : ''}
${order.rejectedDate ? `\n❌ Rejected: ${new Date(order.rejectedDate).toLocaleString('id-ID')}\nAlasan: ${order.rejectionReason}` : ''}
    `;

    alert(details);
  };

  // ============================================
  // SHOW PROOF MODAL
  // ============================================
  window.showProofModal = function(imageUrl) {
    const modal = document.getElementById('proofModal');
    const proofImage = document.getElementById('proofImage');
    
    proofImage.src = imageUrl;
    modal.classList.add('active');
  };
});
