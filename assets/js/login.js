/**
 * ==========================================================================
 * DEERA. E-Commerce - Login Page JavaScript (Teammate Task)
 * Praktikum Pemrograman Web - Modul 2
 *
 * SPECIFICATION CHECKLIST:
 * [x] Form Login: Input username and password
 * [x] API Authentication: Validates credentials via https://dummyjson.com/users
 * [x] Loading State: Shows visual indicator during request
 * [x] Error Handling: Informative error messages using try...catch
 * [x] Session Persistence: Stores firstName & session into localStorage
 * [x] Auto Redirect: Automatically redirects to index.html upon success
 * ==========================================================================
 */

// ==========================================================================
// [TASK 1] DOM Element Selection
// ==========================================================================
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const passwordToggleBtn = document.getElementById('passwordToggleBtn');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const authAlert = document.getElementById('authAlert');
const alertMessage = document.getElementById('alertMessage');

// ==========================================================================
// [TASK 2] Password Visibility Toggle
// ==========================================================================
if (passwordToggleBtn && passwordInput) {
  passwordToggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';

    passwordToggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
}

// ==========================================================================
// [TASK 3] Visual Alert Helpers (Error / Success)
// ==========================================================================
function showError(message) {
  if (!authAlert || !alertMessage) return;
  authAlert.className = 'auth-alert alert-danger';
  authAlert.style.display = 'flex';
  alertMessage.textContent = message;
}

function showSuccess(message) {
  if (!authAlert || !alertMessage) return;
  authAlert.className = 'auth-alert alert-success';
  authAlert.style.display = 'flex';
  alertMessage.textContent = message;
}

function hideAlert() {
  if (authAlert) {
    authAlert.style.display = 'none';
  }
}

// ==========================================================================
// [TASK 4] Loading State Management
// ==========================================================================
function setLoadingState(isLoading) {
  if (!submitLoginBtn) return;
  submitLoginBtn.disabled = isLoading;
  if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
  if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-flex' : 'none';
}

// ==========================================================================
// [TASK 5 & 6] Form Submission, API Authentication & Error Handling
// ==========================================================================
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    // Basic Client-Side Validation
    if (!username || !password) {
      showError('Please enter both your username and password.');
      return;
    }

    // Step 1: Trigger Loading State
    setLoadingState(true);

    try {
      // Step 2: Fetch users from DummyJSON API
      const response = await fetch('https://dummyjson.com/users?limit=100');

      if (!response.ok) {
        throw new Error('Server responded with status ' + response.status + '. Please check your connection.');
      }

      const data = await response.json();
      const users = data.users || [];

      // Step 3: Match user credentials against API data
      const matchedUser = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (!matchedUser) {
        throw new Error('Invalid username or password. Please verify your credentials or click a quick test account below.');
      }

      // Step 4: [TASK 7] Session Persistence to localStorage
      localStorage.setItem('firstName', matchedUser.firstName);
      localStorage.setItem('username', matchedUser.username);
      localStorage.setItem(
        'deera_user',
        JSON.stringify({
          id: matchedUser.id,
          username: matchedUser.username,
          firstName: matchedUser.firstName,
          lastName: matchedUser.lastName,
          email: matchedUser.email,
          image: matchedUser.image || 'https://dummyjson.com/icon/default/128',
          loginTime: new Date().toISOString()
        })
      );

      // Step 5: Show Success Feedback
      showSuccess('Welcome back, ' + matchedUser.firstName + '! Redirecting to product catalog...');

      // Step 6: [TASK 8] Auto-Redirect to Product Catalog (index.html)
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);

    } catch (err) {
      // Error handling with informative feedback
      console.error('Login error:', err);
      showError(err.message || 'An unexpected error occurred during login. Please try again.');
    } finally {
      // Restore Button State
      setLoadingState(false);
    }
  });
}

// ==========================================================================
// [TASK 9] Quick Demo Test Account Filler (Helper for demo grading)
// ==========================================================================
function fillCredentials(user, pass) {
  if (usernameInput) usernameInput.value = user;
  if (passwordInput) passwordInput.value = pass;
  hideAlert();
}

// Global exposure for demo chips onclick
window.fillCredentials = fillCredentials;

// On load: check if already logged in and inform the user
document.addEventListener('DOMContentLoaded', () => {
  const savedFirstName = localStorage.getItem('firstName');
  if (savedFirstName) {
    showSuccess('Currently signed in as ' + savedFirstName + '. You can proceed to the catalog or sign in with another account.');
  }
});
