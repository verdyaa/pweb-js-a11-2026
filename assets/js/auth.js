/**
 * DEERA. E-Commerce - Authentication & Session Management
 * Handles user login against DummyJSON API, session persistence via LocalStorage,
 * navigation bar user status rendering, and logout functionality.
 */

const AUTH_STORAGE_KEY = 'deera_user';
const FIRST_NAME_KEY = 'firstName';

/**
 * Get current logged in user from localStorage
 * @returns {Object|null}
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      // Fallback check for firstName
      const firstName = localStorage.getItem(FIRST_NAME_KEY);
      if (firstName) {
        return { firstName, username: localStorage.getItem('username') || firstName };
      }
      return null;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading user session:', e);
    return null;
  }
}

/**
 * Authenticate user with DummyJSON Users API
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
async function loginUser(username, password) {
  if (!username || !password) {
    throw new Error('Please enter both username and password.');
  }

  try {
    // Fetch users from DummyJSON API
    const response = await fetch('https://dummyjson.com/users?limit=100');
    
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}. Please try again later.`);
    }

    const data = await response.json();
    const users = data.users || [];

    // Authenticate credentials against API response
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (!matchedUser) {
      throw new Error('Invalid username or password. Please check your credentials.');
    }

    // Persist session to LocalStorage (as required in praktikum spec)
    const sessionData = {
      id: matchedUser.id,
      username: matchedUser.username,
      firstName: matchedUser.firstName,
      lastName: matchedUser.lastName,
      email: matchedUser.email,
      image: matchedUser.image || 'https://dummyjson.com/icon/default/128',
      token: `dummy_token_${Date.now()}`
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(FIRST_NAME_KEY, matchedUser.firstName);
    localStorage.setItem('username', matchedUser.username);

    return sessionData;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Auth Guard (Proteksi Halaman)
 * Sesuai spesifikasi praktikum:
 * "Halaman ini tidak boleh dapat diakses jika pengguna belum login (mengecek keberadaan data di Local Storage).
 * Jika belum login, redirect paksa kembali ke login.html."
 */
function checkAuthGuard() {
  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.endsWith('login.html') || path.endsWith('signup.html');
  
  if (isAuthPage) return;

  const firstName = localStorage.getItem(FIRST_NAME_KEY);
  const user = getCurrentUser();

  if (!firstName && !user) {
    // Redirect paksa kembali ke login.html
    window.location.replace('login.html');
  }
}

// Immediately enforce Auth Guard on protected pages
checkAuthGuard();

/**
 * Log out user by clearing LocalStorage session
 * Sesuai spesifikasi praktikum:
 * "Sediakan tombol Logout yang akan menghapus data sesi pengguna dari Local Storage (localStorage.removeItem)
 * dan mengarahkan kembali ke halaman login."
 */
function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(FIRST_NAME_KEY);
  localStorage.removeItem('username');
  
  // Show notification toast if available
  if (typeof showToast === 'function') {
    showToast('You have been logged out.');
  }

  // Redirect to login.html per praktikum requirement
  window.location.href = 'login.html';
}

/**
 * Update Navbar User Status based on LocalStorage session
 * Sesuai spesifikasi praktikum:
 * "Menampilkan ucapan selamat datang beserta nama pengguna yang diambil dari Local Storage (localStorage.getItem)."
 */
function updateNavAuthUI() {
  const authContainer = document.getElementById('navAuthContainer');
  const mobileContainer = document.getElementById('mobileNavAuth');
  const firstName = localStorage.getItem(FIRST_NAME_KEY);
  const user = getCurrentUser();
  const displayName = firstName || (user && user.firstName);

  if (displayName) {
    if (authContainer) {
      // User is logged in: show greeting and user dropdown menu
      authContainer.innerHTML = `
        <div class="user-profile-menu" id="userProfileMenu">
          <button class="user-greeting-btn" id="userGreetingBtn" aria-expanded="false" title="Account Menu">
            <span class="user-avatar-circle">${displayName.charAt(0).toUpperCase()}</span>
            <span class="user-greeting-text">Welcome, ${displayName}</span>
            <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="user-dropdown-card" id="userDropdownCard">
            <div class="user-dropdown-header">
              <strong>${displayName} ${(user && user.lastName) || ''}</strong>
              <span class="user-dropdown-username">@${(user && user.username) || 'user'}</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" style="cursor: default; opacity: 0.9;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>User Profile (${displayName})</span>
            </div>
            <a href="orders.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              My Orders
            </a>
            <a href="index.html#newArrivals" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              Product Catalog
            </a>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item text-danger" id="logoutBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log Out
            </button>
          </div>
        </div>
      `;

      // Dropdown toggle handling
      const trigger = document.getElementById('userGreetingBtn');
      const dropdown = document.getElementById('userDropdownCard');
      const logoutBtn = document.getElementById('logoutBtn');

      if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = dropdown.classList.toggle('active');
          trigger.setAttribute('aria-expanded', isOpen);
        });

        document.addEventListener('click', (e) => {
          if (!authContainer.contains(e.target)) {
            dropdown.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');
          }
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          logoutUser();
        });
      }
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div style="font-size: 14px; font-weight: 600; color: var(--color-primary); padding: 4px 0;">
          Welcome, ${displayName}!
        </div>
        <button type="button" class="btn btn-outline w-100" onclick="logoutUser()">Log Out</button>
      `;
    }
  } else {
    // User is not logged in: show clean user icon linking to login page
    if (authContainer) {
      authContainer.innerHTML = `
        <a href="login.html" class="nav-icon-link" title="Sign In / Log In" aria-label="Sign In">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </a>
      `;
    }
  }
}

// Automatically initialize auth state when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  checkAuthGuard();
  updateNavAuthUI();
});
