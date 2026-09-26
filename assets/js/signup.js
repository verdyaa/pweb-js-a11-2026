/**
 * ==========================================================================
 * DEERA. E-Commerce - Sign Up Page JavaScript (Teammate Task)
 * Praktikum Pemrograman Web - Modul 2
 *
 * SPECIFICATION CHECKLIST:
 * [x] Form Sign Up: Input your name, username, email, password, terms checkbox
 * [x] Password Visibility Toggle: Eye icon button to reveal/hide password
 * [x] Client-Side Validation: Validates required inputs, email format, and password length
 * [x] Terms Agreement Verification: Checks if user agreed to terms
 * [x] Loading State: Shows visual indicator during registration process
 * [x] Account Creation & Persistence: Stores registered user in localStorage
 * [x] Auto Redirect: Directs to login.html with auto-filled credentials upon success
 * ==========================================================================
 */

// ==========================================================================
// [TASK 1] DOM Element Selection
// ==========================================================================
const signupForm = document.getElementById('signupForm');
const nameInput = document.getElementById('nameInput');
const usernameInput = document.getElementById('usernameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const passwordToggleBtn = document.getElementById('passwordToggleBtn');
const termsCheckbox = document.getElementById('termsCheckbox');
const submitSignupBtn = document.getElementById('submitSignupBtn');
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
// [TASK 3] Alert Helpers (Error / Success)
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
  if (!submitSignupBtn) return;
  submitSignupBtn.disabled = isLoading;
  if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
  if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-flex' : 'none';
}

// ==========================================================================
// [TASK 5] Validation Helper Functions
// ==========================================================================
function isValidEmail(email) {
  // RFC 5322 standard email regex pattern
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ==========================================================================
// [TASK 6] Form Submission, Validation & Registration Handling
// ==========================================================================
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const fullName = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const termsAgreed = termsCheckbox ? termsCheckbox.checked : false;

    // 1. Check for empty fields
    if (!fullName) {
      showError('Please enter your full name.');
      if (nameInput) nameInput.focus();
      return;
    }

    if (!username) {
      showError('Please choose a username.');
      if (usernameInput) usernameInput.focus();
      return;
    }

    if (!email) {
      showError('Please enter your email address.');
      if (emailInput) emailInput.focus();
      return;
    }

    // 2. Validate email format
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address (e.g. name@domain.com).');
      if (emailInput) emailInput.focus();
      return;
    }

    // 3. Validate password strength/length
    if (!password || password.length < 6) {
      showError('Password must be at least 6 characters long.');
      if (passwordInput) passwordInput.focus();
      return;
    }

    // 4. Validate terms checkbox
    if (!termsAgreed) {
      showError('You must agree with the Privacy Policy and Terms of Use.');
      if (termsCheckbox) termsCheckbox.focus();
      return;
    }

    // Step: Enter Loading State
    setLoadingState(true);

    try {
      // Simulate API network latency (800ms) for realistic UX and loading demo
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Save newly registered user to localStorage for session continuity
      const registeredUser = {
        name: fullName,
        username: username,
        email: email,
        password: password,
        registeredAt: new Date().toISOString()
      };

      // Store in users list or temporary signup cache
      let existingUsers = [];
      try {
        existingUsers = JSON.parse(localStorage.getItem('deera_registered_users') || '[]');
      } catch (err) {
        existingUsers = [];
      }
      existingUsers.push(registeredUser);
      localStorage.setItem('deera_registered_users', JSON.stringify(existingUsers));

      // Also set prefill info for login page convenience
      localStorage.setItem('prefill_username', username);

      // Display success message
      showSuccess('Account created successfully! Redirecting you to sign in...');

      // Redirect to login page after 1.2 seconds
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);

    } catch (err) {
      console.error('Registration error:', err);
      showError('An error occurred during registration. Please try again.');
    } finally {
      setLoadingState(false);
    }
  });
}
