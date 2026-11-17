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

// Optional: empty is valid. Otherwise allow digits, spaces, + - ( ) with 7-15 digits.
function validatePhone(value) {
  const phone = value.trim();
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '').length;
  if (!/^[\d\s+\-()]+$/.test(phone) || digits < 7 || digits > 15) {
    return 'Enter a valid phone number';
  }
  return '';
}

function validateAddress(value) {
  const address = value.trim();
  if (!address) return 'Address is required';
  if (address.length < 5) return 'Address must be at least 5 characters';
  return '';
}

function validateCountry(value) {
  const country = value.trim();
  if (!country) return 'Country is required';
  if (country.length < 2) return 'Country must be at least 2 characters';
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

// Field ids in form order, each with its validator. Order decides which field gets focus.
function getFields(doc) {
  const value = (id) => doc.getElementById(id).value;
  return [
    { id: 'name', validate: () => validateName(value('name')) },
    { id: 'email', validate: () => validateEmail(value('email')) },
    { id: 'password', validate: () => validatePassword(value('password')) },
    {
      id: 'confirm-password',
      validate: (errors) => validateConfirmPassword(
        value('password'), value('confirm-password'), errors.password
      ),
    },
    { id: 'phone', validate: () => validatePhone(value('phone')) },
    { id: 'address', validate: () => validateAddress(value('address')) },
    { id: 'country', validate: () => validateCountry(value('country')) },
  ];
}

function updateSummary(doc, fields) {
  const summary = doc.getElementById('error-summary');
  const count = fields.filter((f) => !doc.getElementById(`${f.id}-error`).hidden).length;
  summary.textContent = count ? `Please fix ${count} field${count === 1 ? '' : 's'} below` : '';
  summary.hidden = count === 0;
}

function initForm(doc) {
  const form = doc.getElementById('registration-form');
  const success = doc.getElementById('success-message');
  const another = doc.getElementById('register-another');
  const fields = getFields(doc);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.hidden) return; // already registered: ignore double submit

    const errors = {};
    for (const field of fields) {
      errors[field.id] = field.validate(errors);
      showError(doc, field.id, errors[field.id]);
    }
    updateSummary(doc, fields);

    const firstInvalid = fields.find((f) => errors[f.id]);
    if (firstInvalid) {
      doc.getElementById(firstInvalid.id).focus();
      success.hidden = true;
      return;
    }

    doc.getElementById('password').value = '';
    doc.getElementById('confirm-password').value = '';
    form.hidden = true;
    success.hidden = false;
    another.hidden = false;
  });

  // Typing can clear an existing error but never creates one.
  for (const field of fields) {
    doc.getElementById(field.id).addEventListener('input', () => {
      if (doc.getElementById(`${field.id}-error`).hidden) return;
      showError(doc, field.id, '');
      updateSummary(doc, fields);
    });
  }

  doc.querySelectorAll('button[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = doc.getElementById(button.dataset.toggle);
      setPasswordVisible(input, button, input.type === 'password');
    });
  });

  another.addEventListener('click', () => {
    form.reset();
    for (const field of fields) showError(doc, field.id, '');
    updateSummary(doc, fields);
    doc.querySelectorAll('button[data-toggle]').forEach((button) => {
      setPasswordVisible(doc.getElementById(button.dataset.toggle), button, false);
    });
    success.hidden = true;
    another.hidden = true;
    form.hidden = false;
    doc.getElementById('name').focus();
  });
}

function setPasswordVisible(input, button, visible) {
  input.type = visible ? 'text' : 'password';
  button.textContent = visible ? 'Hide' : 'Show';
  button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${button.dataset.name}`);
  button.setAttribute('aria-pressed', String(visible));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initForm, validateName, validateEmail, validatePassword, validateConfirmPassword,
    validatePhone, validateAddress, validateCountry,
  };
} else {
  initForm(document);
}
