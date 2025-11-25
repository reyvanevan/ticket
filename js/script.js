// Sticky Navbar
window.addEventListener("scroll", function(){
  var navbar = document.querySelector(".navbar");
  navbar.classList.toggle("sticky", this.window.scrollY > 0);
})

// Toggle Menu
const menu = document.querySelector('#menu')
const navLinks = document.querySelector('.nav-links')
const label = document.querySelector('label')

function changeMenu() {

  if (menu.checked) {
    navLinks.classList.replace("menu-open", "close")
  } else {
    navLinks.classList.replace("close", "menu-open")
  }
}

function changeMenuByLink() {
  if (navLinks.getElementsByClassName('menu-open')) {
    navLinks.classList.replace("menu-open", "close")
    menu.checked = false;
  } else {
    menu.checked = true;
  }
}

// ============================================
// BUY TICKET BUTTON HANDLER
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // Get buy ticket button
  const buyTicketBtn = document.getElementById('buyTicketBtn');
  
  if (buyTicketBtn) {
    buyTicketBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get event ID from data attribute
      const eventId = this.getAttribute('data-event-id') || 'umbandung-fest-2025';
      
      // Show loading overlay
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <i data-feather="loader"></i>
          <p>Memuat halaman tiket...</p>
        </div>
      `;
      document.body.appendChild(overlay);
      
      // Replace feather icons in overlay
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
      
      // Redirect after short delay for smooth UX
      setTimeout(() => {
        window.location.href = `ticket-detail.html?event=${eventId}`;
      }, 800);
    });
  }
});