// ============================================
// UTILITY FUNCTIONS (MODULAR)
// UMbandung Festival 2025 Ticketing System
// ============================================

/**
 * Format number to Indonesian Rupiah
 * @param {number} number - Amount to format
 * @returns {string} Formatted rupiah string
 */
function formatRupiah(number) {
  return 'Rp ' + number.toLocaleString('id-ID');
}

/**
 * Generate unique order number
 * Format: UMBYYYYMMDDrandom6digits
 * @returns {string} Generated order number
 */
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  
  return `UMB${year}${month}${day}${random}`;
}

/**
 * Generate ticket number from order number
 * Format: OrderNumber-XXX (XXX = ticket sequence)
 * @param {string} orderNumber - Order number
 * @param {number} index - Ticket index (0-based)
 * @returns {string} Generated ticket number
 */
function generateTicketNumber(orderNumber, index) {
  return `${orderNumber}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid or not
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indonesian phone number
 * @param {string} phone - Phone number to validate (without +62)
 * @returns {boolean} Valid or not
 */
function validatePhone(phone) {
  const phoneRegex = /^[0-9]{9,13}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} config - Upload configuration
 * @returns {Object} {valid: boolean, error: string}
 */
function validateFile(file, config) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size (in MB)
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > config.maxSize) {
    return { valid: false, error: `File size exceeds ${config.maxSize}MB` };
  }

  // Check file format
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!config.allowedFormats.includes(file.type) && !config.allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'Invalid file format' };
  }

  return { valid: true, error: null };
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoading(message = 'Memuat...') {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.id = 'loadingOverlay';
  overlay.innerHTML = `
    <div class="loading-spinner">
      <i data-feather="loader"></i>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // Replace feather icons
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Show loading and redirect to URL
 * @param {string} url - URL to redirect
 * @param {number} delay - Delay in milliseconds
 */
function showLoadingAndRedirect(url, delay = 800) {
  showLoading('Memuat halaman...');
  
  setTimeout(() => {
    window.location.href = url;
  }, delay);
}

/**
 * Format date to Indonesian format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateIndonesian(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return dateObj.toLocaleDateString('id-ID', options);
}

/**
 * Calculate order total
 * @param {number} quantity - Number of tickets
 * @param {number} ticketPrice - Price per ticket
 * @param {number} adminFee - Admin fee
 * @returns {Object} {subtotal, adminFee, total}
 */
function calculateOrderTotal(quantity, ticketPrice, adminFee) {
  const subtotal = quantity * ticketPrice;
  const total = subtotal + adminFee;
  
  return {
    subtotal,
    adminFee,
    total
  };
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {Object|null} Parsed data or null
 */
function getStorageData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting storage data:', error);
    return null;
  }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {Object} data - Data to save
 * @returns {boolean} Success status
 */
function setStorageData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving storage data:', error);
    return false;
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
function removeStorageData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing storage data:', error);
  }
}

/**
 * Clear all ticketing data from localStorage
 */
function clearAllTicketingData() {
  if (typeof CONFIG !== 'undefined') {
    Object.values(CONFIG.storage).forEach(key => {
      removeStorageData(key);
    });
  }
}

/**
 * Save order to persistent storage (for admin access)
 * Creates a separate storage entry with order_ prefix
 * @param {Object} orderData - Complete order data
 * @returns {boolean} Success status
 */
function saveOrderToPersistentStorage(orderData) {
  if (!orderData || !orderData.orderNumber) {
    console.error('Invalid order data');
    return false;
  }

  const storageKey = `${CONFIG.storage.orderPrefix}${orderData.orderNumber}`;
  return setStorageData(storageKey, orderData);
}

/**
 * Format countdown time
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time (HH:MM:SS)
 */
function formatCountdownTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Show alert with custom styling
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, info, warning)
 */
function showAlert(message, type = 'info') {
  // For now, use native alert
  // TODO: Create custom modal alert
  alert(message);
}

/**
 * Create WhatsApp share link
 * @param {string} message - Message to share
 * @returns {string} WhatsApp URL
 */
function createWhatsAppLink(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Create WhatsApp message for ticket
 * @param {Object} ticketData - Ticket information
 * @returns {string} Formatted message
 */
function createTicketWhatsAppMessage(ticketData) {
  return `🎫 *E-Ticket UMbandung Festival 2025*\n\n` +
         `Nama: ${ticketData.holderName}\n` +
         `Nomor Tiket: ${ticketData.ticketNumber}\n` +
         `Tanggal: 29 November 2025\n` +
         `Waktu: 10:00 WIB\n` +
         `Lokasi: Lapangan Adymic UMbandung\n\n` +
         `Jangan lupa datang tepat waktu! 🎉`;
}

/**
 * Upload proof image to remote provider (imgbb)
 * Falls back to base64 (local only) if upload fails and fallback enabled.
 * @param {File} file
 * @returns {Promise<{success:boolean,fileUrl:string,fileName:string,uploadedAt:string,provider?:string,deleteUrl?:string}>}
 */
async function simulateFileUpload(file) { // keep function name for existing callers
  const cfg = (typeof CONFIG !== 'undefined') ? CONFIG.imageUpload : null;
  if (!cfg || !cfg.enabled) {
    return base64LocalFallback(file, 'upload-disabled');
  }

  if (cfg.provider === 'local') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // If we have orderNumber in localStorage, send it to link file to order
      const complete = getStorageData(CONFIG.storage.completeOrderData);
      if (complete && complete.orderNumber) {
        formData.append('orderNumber', complete.orderNumber);
      }

      const response = await fetch(cfg.endpoint, {
        method: 'POST',
        body: formData
      });

      const json = await response.json();
      if (!response.ok || json.status !== 'success') {
        throw new Error(json.message || 'Upload failed');
      }

      return {
        success: true,
        fileUrl: json.data.fileUrl,
        fileName: json.data.fileName || file.name,
        uploadedAt: json.data.uploadedAt || new Date().toISOString(),
        provider: 'local'
      };
    } catch (err) {
      console.error('local upload failed:', err.message);
      if (cfg.fallbackToBase64) {
        return base64LocalFallback(file, 'fallback-base64');
      }
      throw err;
    }
  }

  // Unknown provider fallback
  return base64LocalFallback(file, 'unknown-provider');
}

/**
 * Convert file to base64 (local storage only) as fallback
 */
function base64LocalFallback(file, reason) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        success: true,
        fileUrl: reader.result, // data URL
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        provider: 'base64-local',
        fallbackReason: reason
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if order is expired
 * @param {string} orderDate - Order creation date (ISO string)
 * @param {number} expirySeconds - Expiry time in seconds
 * @returns {boolean} Is expired
 */
function isOrderExpired(orderDate, expirySeconds = 86400) {
  const orderTime = new Date(orderDate).getTime();
  const currentTime = new Date().getTime();
  const elapsedSeconds = (currentTime - orderTime) / 1000;
  
  return elapsedSeconds > expirySeconds;
}

// ============================================
// QR CODE & TICKET GENERATION
// ============================================

/**
 * Generate QR code for ticket (FALLBACK - use API if library fails)
 * @param {string} ticketCode - Ticket code
 * @returns {Promise<string>} QR code data URL (base64)
 */
async function generateTicketQR(ticketCode) {
  // Try using QRCode library first
  if (typeof QRCode !== 'undefined') {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(ticketCode, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (err, url) => {
        if (err) {
          console.warn('QRCode library failed, trying API fallback...');
          // Fallback to API
          resolve(generateTicketQRViaAPI(ticketCode));
        } else {
          resolve(url);
        }
      });
    });
  } else {
    // Library not loaded, use API directly
    console.warn('QRCode library not loaded, using API fallback...');
    return generateTicketQRViaAPI(ticketCode);
  }
}

/**
 * Generate QR via external API (FALLBACK)
 * @param {string} ticketCode - Ticket code
 * @returns {Promise<string>} QR code data URL
 */
async function generateTicketQRViaAPI(ticketCode) {
  try {
    // Use Google Charts API (free, no auth needed)
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=512x512&chl=${encodeURIComponent(ticketCode)}&choe=UTF-8`;
    
    // Fetch as blob and convert to base64
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('API fallback also failed:', error);
    throw new Error('QR generation failed (both library and API)');
  }
}

/**
 * Create ticket image with QR code (SIMPLIFIED - QR only, no template)
 * @param {Object} ticketData - Ticket information {kode_tiket, nama, order_number, quantity}
 * @returns {Promise<string>} QR code image data URL (base64)
 */
async function createTicketWithQR(ticketData) {
  try {
    // Simply generate QR code without template overlay
    const qrDataURL = await generateTicketQR(ticketData.kode_tiket);
    
    console.log('✅ QR Code generated for:', ticketData.kode_tiket);
    
    // Return QR code directly (no template needed)
    return qrDataURL;
    
  } catch (error) {
    console.error('Failed to generate QR:', error);
    throw error;
  }
}

// Export utilities (untuk module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatRupiah,
    generateOrderNumber,
    generateTicketNumber,
    copyToClipboard,
    validateEmail,
    validatePhone,
    validateFile,
    showLoading,
    hideLoading,
    showLoadingAndRedirect,
    formatDateIndonesian,
    calculateOrderTotal,
    getStorageData,
    setStorageData,
    removeStorageData,
    clearAllTicketingData,
    formatCountdownTime,
    showAlert,
    createWhatsAppLink,
    createTicketWhatsAppMessage,
    simulateFileUpload,
    isOrderExpired
  };
}
