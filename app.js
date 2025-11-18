

// ============================================
// COMPLETE APP.JS - University Notes Platform
// Mobile-friendly, Modals, File Preview, Analytics
// ============================================

const ADMIN_CODE = "sahil12345"; // Change this to your secret admin code

// Global state
let currentUser = null;
let currentBranch = null;
let currentSemester = null;
let currentSection = null;
let currentSubject = null;

// ========== SIDEBAR & UI SETUP ==========
const sidebar = document.getElementById('sidebar');
const mobileBtn = document.getElementById('mobile-menu-btn');
const sidebarToggle = document.getElementById('sidebar-toggle');

if (mobileBtn) mobileBtn.onclick = toggleSidebar;
if (sidebarToggle) sidebarToggle.onclick = toggleSidebar;

function toggleSidebar() {
    sidebar.classList.toggle("open");
    sidebar.classList.toggle("closed");
}

// Close modal on background click
window.onclick = e => {
    if (e.target.classList.contains('modal-bg')) hideModal();
};

// ========== MODAL SYSTEM ==========
function showModal(html, which = "#auth-modal") {
    document.getElementById('modal-bg').classList.add('active');
    document.querySelector(which).innerHTML = html;
    document.querySelector(which).classList.add('active');
}

function hideModal() {
    document.getElementById('modal-bg').classList.remove('active');
    document.querySelectorAll('.modal-content').forEach(m => m.classList.remove('active'));
}

// Admin code verification modal
function requireAdmin(action) {
    showModal(`
    <div>
        <h3>🔒 Admin Code Required</h3>
        <input id="admin-code-input" type="password" placeholder="Enter admin code" autofocus />
        <button onclick="checkAdminAndProceed('${action}')" class="btn-primary">Continue</button>
        <button onclick="hideModal()" class="btn-delete">Cancel</button>
    </div>`, "#admin-modal");
}

function checkAdminAndProceed(action) {
    const val = document.getElementById('admin-code-input').value;
    if (val !== ADMIN_CODE) {
        alert('❌ Incorrect admin code!');
        return;
    }
    hideModal();
    if (typeof window[action] === "function") window[action]();
}

// Auth modals (login/signup)
function showAuthModal(tab = 'login') {
    showModal(`
      <div style="text-align:center">
      <button onclick="hideModal()" style="float:right; border:none; background:transparent; font-size:1.5em; cursor:pointer">×</button>
      <h2>${tab === 'login' ? "Login" : "Sign Up"}</h2>
      <form onsubmit="${tab === 'login' ? 'doLogin(event)' : 'doSignup(event)'}">
        <input id="auth-email" type="email" placeholder="Email" required><br>
        <input id="auth-pass" type="password" placeholder="Password" required><br>
        ${tab === 'signup' ? '<input id="auth-confirm" type="password" placeholder="Confirm Password" required><br>' : ''}
        <button class="btn-primary" type="submit">${tab === 'login' ? "Login" : "Sign Up"}</button>
      </form>
      <div style="margin-top:1em;">
        <a onclick="showAuthModal('${tab === 'login' ? 'signup' : 'login'}')" class="link">
        ${tab === 'login' ? 'Create new account' : 'Already have an
