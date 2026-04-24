/* =====================
   auth.js — Connects frontend to Flask backend
   API base: http://127.0.0.1:5000
   ===================== */

const API = 'http://127.0.0.1:5000/api';

// ─── STATE ──────────────────────────────────────────────────
let currentUser = null;

// ─── DOM REFS ────────────────────────────────────────────────
const authOverlay  = document.getElementById('authOverlay');
const authModal    = document.getElementById('authModal');
const authMsgLogin = document.getElementById('authMsgLogin');
const authMsgReg   = document.getElementById('authMsgReg');
const navAuthArea  = document.getElementById('navAuthArea');

// ─── MODAL OPEN / CLOSE ─────────────────────────────────────
function openAuth(tab = 'login') {
  authOverlay.classList.add('open');
  switchTab(tab);
  clearMessages();
}

function closeAuth() {
  authOverlay.classList.remove('open');
  clearMessages();
}

// Close when clicking outside the modal
authOverlay.addEventListener('click', (e) => {
  if (e.target === authOverlay) closeAuth();
});

// ─── TABS ────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));

  document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');
  clearMessages();
}

// ─── MESSAGES ────────────────────────────────────────────────
function clearMessages() {
  [authMsgLogin, authMsgReg].forEach(el => {
    el.textContent = '';
    el.className = 'auth-msg';
  });
}

function showMsg(el, text, type = 'error') {
  el.textContent = text;
  el.className = `auth-msg ${type}`;
}

// ─── API CALLS ───────────────────────────────────────────────
async function apiPost(endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${API}${endpoint}`, {
    credentials: 'include'
  });
  return res.json();
}

// ─── REGISTER ────────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  showMsg(authMsgReg, '⏳ Creating account...', 'success');

  try {
    const data = await apiPost('/register', { name, email, password });
    if (data.success) {
      currentUser = data.data;
      updateNavbar();
      closeAuth();
      showToast(`🎉 Welcome to Saveur, ${currentUser.name}!`);
    } else {
      showMsg(authMsgReg, `⚠️ ${data.message}`);
    }
  } catch {
    showMsg(authMsgReg, '❌ Could not connect to server. Is Flask running?');
  }
}

// ─── LOGIN ───────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  showMsg(authMsgLogin, '⏳ Signing in...', 'success');

  try {
    const data = await apiPost('/login', { email, password });
    if (data.success) {
      currentUser = data.data;
      updateNavbar();
      closeAuth();
      showToast(`👋 Welcome back, ${currentUser.name}!`);
    } else {
      showMsg(authMsgLogin, `⚠️ ${data.message}`);
    }
  } catch {
    showMsg(authMsgLogin, '❌ Could not connect to server. Is Flask running?');
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────
async function handleLogout() {
  try {
    await apiPost('/logout', {});
  } catch { /* fail silently */ }
  currentUser = null;
  updateNavbar();
  showToast('👋 You have been logged out.');
}

// ─── CHECK SESSION ON LOAD ────────────────────────────────────
async function checkSession() {
  try {
    const data = await apiGet('/user');
    if (data.success && data.data) {
      currentUser = data.data;
      updateNavbar();
    }
  } catch { /* server offline — that's fine */ }
}

// ─── NAVBAR UPDATE ───────────────────────────────────────────
function updateNavbar() {
  if (currentUser) {
    navAuthArea.innerHTML = `
      <div class="nav-user">
        <span class="nav-user-name">👤 ${currentUser.name}</span>
        <button class="nav-logout" onclick="showOrders()">My Orders</button>
        <button class="nav-logout" onclick="handleLogout()">Log out</button>
      </div>
    `;
  } else {
    navAuthArea.innerHTML = `
      <button class="nav-cta" onclick="openAuth('login')">Sign In</button>
    `;
  }
}

// ─── ORDER HISTORY ───────────────────────────────────────────
async function showOrders() {
  try {
    const data = await apiGet('/orders');
    if (!data.success) { showToast('Could not load orders.'); return; }

    const orders = data.data;

    // Reuse auth modal as order history panel
    authOverlay.classList.add('open');
    authModal.innerHTML = `
      <button class="auth-close" onclick="closeAuth()">✕</button>
      <div class="auth-logo">Saveur</div>
      <p class="auth-subtitle">Order History for ${currentUser.name}</p>
      ${orders.length === 0
        ? '<p style="text-align:center;color:#a89a8e;margin-top:20px;">No orders yet. Start adding dishes!</p>'
        : `<div class="order-list">
            ${orders.map(o => `
              <div class="order-item">
                <div class="order-item-header">
                  <span>Order #${o.id}</span>
                  <span>€${o.total}</span>
                </div>
                <div class="order-item-dishes">${o.items.map(i => i.name).join(', ')}</div>
                <div style="font-size:0.78rem;color:#a89a8e;margin-top:6px;">${o.created_at}</div>
              </div>
            `).join('')}
          </div>`
      }
      <button class="btn-primary auth-submit" style="margin-top:24px;" onclick="closeAuth()">Close</button>
    `;
  } catch {
    showToast('❌ Could not connect to server.');
  }
}

// ─── OVERRIDE CHECKOUT to save order to backend ───────────────
// This replaces the checkout() function in script.js
window.checkout = async function () {
  if (cart.length === 0) return;

  if (!currentUser) {
    showToast('Please sign in to place an order!');
    openAuth('login');
    return;
  }

  const total = cart.reduce((s, i) => s + i.price, 0);

  try {
    const data = await apiPost('/orders', { items: cart, total });
    if (data.success) {
      alert(`🎉 Order placed! Total: €${total}\n\nYour order has been saved to your account.`);
      cart = [];
      updateCart();
      closeCart();
    } else {
      showToast(`Order failed: ${data.message}`);
    }
  } catch {
    // Fallback if server is offline
    alert(`🎉 Order placed! Total: €${total}\n\n(Offline mode — not saved to account)`);
    cart = [];
    updateCart();
    closeCart();
  }
};

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Attach form handlers
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
});
