const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const passwordToggleBtn = document.getElementById('passwordToggleBtn');
const submitLoginBtn = document.getElementById('submitLoginBtn');
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
  if (!submitLoginBtn) return;
  submitLoginBtn.disabled = isLoading;
  if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
  if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-flex' : 'none';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!username || !password) {
      showError('Please enter both your username and password.');
      return;
    }

    setLoadingState(true);

    try {

      const response = await fetch('https://dummyjson.com/users?limit=0');

      if (!response.ok) {
        throw new Error('Server responded with status ' + response.status + '. Please check your connection.');
      }

      const data = await response.json();
      const users = data.users || [];

      const matchedUser = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (!matchedUser) {
        throw new Error('Invalid username or password. Please verify your credentials or click a quick test account below.');
      }

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

      showSuccess('Welcome back, ' + matchedUser.firstName + '! Redirecting to product catalog...');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);

    } catch (err) {

      console.error('Login error:', err);
      showError(err.message || 'An unexpected error occurred during login. Please try again.');
    } finally {

      setLoadingState(false);
    }
  });
}

function fillCredentials(user, pass) {
  if (usernameInput) usernameInput.value = user;
  if (passwordInput) passwordInput.value = pass;
  hideAlert();
}

window.fillCredentials = fillCredentials;

document.addEventListener('DOMContentLoaded', () => {
  const savedFirstName = localStorage.getItem('firstName');
  if (savedFirstName) {
    showSuccess('Currently signed in as ' + savedFirstName + '. You can proceed to the catalog or sign in with another account.');
  }
});
