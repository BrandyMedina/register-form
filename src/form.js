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
    showError(doc, 'name', nameError);
    showError(doc, 'email', emailError);

    success.hidden = Boolean(nameError || emailError);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initForm, validateName, validateEmail };
} else {
  initForm(document);
}
