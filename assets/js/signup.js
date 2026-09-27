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

if (passwordToggleBtn && passwordInput) {
  passwordToggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';

    passwordToggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
}

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

function setLoadingState(isLoading) {
  if (!submitSignupBtn) return;
  submitSignupBtn.disabled = isLoading;
  if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
  if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-flex' : 'none';
}

function isValidEmail(email) {

  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const fullName = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const termsAgreed = termsCheckbox ? termsCheckbox.checked : false;

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

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address (e.g. name@domain.com).');
      if (emailInput) emailInput.focus();
      return;
    }

    if (!password || password.length < 6) {
      showError('Password must be at least 6 characters long.');
      if (passwordInput) passwordInput.focus();
      return;
    }

    if (!termsAgreed) {
      showError('You must agree with the Privacy Policy and Terms of Use.');
      if (termsCheckbox) termsCheckbox.focus();
      return;
    }

    setLoadingState(true);

    try {

      await new Promise((resolve) => setTimeout(resolve, 800));

      const registeredUser = {
        name: fullName,
        username: username,
        email: email,
        password: password,
        registeredAt: new Date().toISOString()
      };

      let existingUsers = [];
      try {
        existingUsers = JSON.parse(localStorage.getItem('deera_registered_users') || '[]');
      } catch (err) {
        existingUsers = [];
      }
      existingUsers.push(registeredUser);
      localStorage.setItem('deera_registered_users', JSON.stringify(existingUsers));

      localStorage.setItem('prefill_username', username);

      showSuccess('Account created successfully! Redirecting you to sign in...');

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
