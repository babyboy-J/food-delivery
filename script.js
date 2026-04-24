/* =====================
   SAVEUR — script.js
   ===================== */

// ─── NAVBAR SCROLL EFFECT ───────────────────────────────────────────────────
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});


// ─── HAMBURGER MENU ─────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
const navCta    = document.querySelector('.nav-cta');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.style.display === 'flex';
  navLinks.style.cssText = isOpen
    ? ''
    : 'display:flex; flex-direction:column; position:absolute; top:70px; left:0; right:0; background:var(--cream); padding:20px 30px; gap:20px; border-bottom:1px solid var(--border); z-index:99;';

  navCta.style.display = isOpen ? '' : 'block';
});


// ─── MENU FILTER ────────────────────────────────────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCards  = document.querySelectorAll('.menu-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    menuCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
    });
  });
});


// ─── SHOPPING CART ──────────────────────────────────────────────────────────
let cart = []; // Array of { name, price }

const cartSidebar  = document.getElementById('cartSidebar');
const cartOverlay  = document.getElementById('cartOverlay');
const cartItemsEl  = document.getElementById('cartItems');
const cartTotalEl  = document.getElementById('cartTotal');
const cartCountEl  = document.getElementById('cartCount');
const cartFab      = document.getElementById('cartFab');
const checkoutBtn  = document.getElementById('checkoutBtn');

function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
}

function addToCart(name, price) {
  cart.push({ name, price });
  updateCart();
  animateCartFab();

  // Show a quick toast
  showToast(`"${name}" added to cart!`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function updateCart() {
  // Count badge
  cartCountEl.textContent = cart.length;

  // Render items
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    cartTotalEl.textContent = '';
    checkoutBtn.style.display = 'none';
    return;
  }

  checkoutBtn.style.display = 'block';

  cartItemsEl.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-item-actions">
        <span class="cart-item-price">€${item.price}</span>
        <button class="cart-remove" onclick="removeFromCart(${i})" title="Remove">✕</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotalEl.innerHTML = `<strong>Total: €${total}</strong>`;
}

function checkout() {
  if (cart.length === 0) return;
  alert(`🎉 Order placed! Total: €${cart.reduce((s, i) => s + i.price, 0)}\n\nThank you for dining with Saveur!`);
  cart = [];
  updateCart();
  closeCart();
}

function animateCartFab() {
  cartFab.classList.remove('bounce');
  // Trigger reflow to restart animation
  void cartFab.offsetWidth;
  cartFab.classList.add('bounce');
}


// ─── TOAST NOTIFICATION ─────────────────────────────────────────────────────
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 32px;
    background: var(--charcoal);
    color: #fff;
    padding: 12px 22px;
    border-radius: 50px;
    font-family: var(--font-body);
    font-size: 0.88rem;
    font-weight: 500;
    z-index: 300;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: slideUp 0.3s ease, fadeOut 0.4s ease 2.2s forwards;
  `;

  // Inject animation keyframes if not already done
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        to { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2700);
}


// ─── NEWSLETTER SUBSCRIPTION ────────────────────────────────────────────────
function subscribeNewsletter(event) {
  event.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  const msg   = document.getElementById('newsletterMsg');

  if (!isValidEmail(email)) {
    msg.style.color = '#f08080';
    msg.textContent = '⚠️ Please enter a valid email address.';
    return;
  }

  // Simulate async subscription
  msg.textContent = '⏳ Subscribing...';
  msg.style.color = 'rgba(255,255,255,0.7)';

  setTimeout(() => {
    msg.style.color = 'var(--gold-light)';
    msg.textContent = `✅ You're in, ${email}! Check your inbox for a welcome recipe.`;
    document.getElementById('emailInput').value = '';
  }, 1200);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ─── SCROLL-TRIGGERED FADE-IN ────────────────────────────────────────────────
const observerOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity  = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Elements to animate on scroll
const animatables = document.querySelectorAll(
  '.menu-card, .recipe-card, .stat, .section-header'
);

animatables.forEach((el, i) => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.07}s, transform 0.6s ease ${i * 0.07}s`;
  observer.observe(el);
});


// ─── SMOOTH SCROLL for nav links ────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile nav if open
      navLinks.style.cssText = '';
    }
  });
});


// ─── INIT ───────────────────────────────────────────────────────────────────
updateCart();

fetch("https://food-delivery-2x6y.onrender.com/login", )