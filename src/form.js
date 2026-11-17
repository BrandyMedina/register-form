const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(value) {
  const name = value.trim();
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  return '';
}

function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Email is required';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email';
  return '';
}

function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include a letter and a number';
  }
  return '';
}

// The mismatch error only applies once the password itself is valid.
function validateConfirmPassword(password, confirm, passwordError) {
  if (!confirm) return 'Please confirm your password';
  if (!passwordError && confirm !== password) return 'Passwords do not match';
  return '';
}

function showError(doc, id, message) {
  const input = doc.getElementById(id);
  const error = doc.getElementById(`${id}-error`);
  error.textContent = message;
  error.hidden = !message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) input.setAttribute('aria-describedby', error.id);
  else input.removeAttribute('aria-describedby');
}

function initForm(doc) {
  const form = doc.getElementById('registration-form');
  const success = doc.getElementById('success-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameError = validateName(doc.getElementById('name').value);
    const emailError = validateEmail(doc.getElementById('email').value);
    const password = doc.getElementById('password').value;
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(
      password,
      doc.getElementById('confirm-password').value,
      passwordError
    );

    showError(doc, 'name', nameError);
    showError(doc, 'email', emailError);
    showError(doc, 'password', passwordError);
    showError(doc, 'confirm-password', confirmError);

    success.hidden = Boolean(nameError || emailError || passwordError || confirmError);
  });

  doc.querySelectorAll('button[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = doc.getElementById(button.dataset.toggle);
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(reveal));
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initForm, validateName, validateEmail, validatePassword, validateConfirmPassword,
  };
} else {
  initForm(document);
}
