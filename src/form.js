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

const plural = (n) => (n === 1 ? 'field' : 'fields');

function isRequired(doc, id) {
  return doc.getElementById(id).required;
}

function isEmpty(doc, id) {
  return doc.getElementById(id).value.trim() === '';
}

// "Name (required)" -> "Name"
function labelName(doc, id) {
  return doc.querySelector(`label[for="${id}"]`).textContent.replace(/\s*\(.*\)\s*$/, '');
}

function buildRequiredLine(doc, ids) {
  const line = doc.createElement('p');
  line.className = 'summary-required';
  line.append('Required: ');
  ids.forEach((id, i) => {
    if (i > 0) line.append(', ');
    const link = doc.createElement('a');
    link.href = `#${id}`;
    link.textContent = labelName(doc, id);
    link.addEventListener('click', (event) => {
      event.preventDefault();
      doc.getElementById(id).focus();
    });
    line.append(link);
  });
  return line;
}

// Rebuilds the summary from the errors currently shown: empty required fields are
// listed by name (as links); every other error is only counted.
function updateSummary(doc, fields) {
  const summary = doc.getElementById('error-summary');
  const shown = fields.filter((f) => !doc.getElementById(`${f.id}-error`).hidden);
  const missing = shown.filter((f) => isRequired(doc, f.id) && isEmpty(doc, f.id));
  const otherCount = shown.length - missing.length;

  summary.replaceChildren();
  if (missing.length) summary.append(buildRequiredLine(doc, missing.map((f) => f.id)));
  if (otherCount) {
    const other = doc.createElement('p');
    other.className = 'summary-other';
    other.textContent = missing.length
      ? `Please fix ${otherCount} more ${plural(otherCount)} below`
      : `Please fix ${otherCount} ${plural(otherCount)} below`;
    summary.append(other);
  }
  summary.hidden = shown.length === 0;
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

  const summary = doc.getElementById('error-summary');
  for (const field of fields) {
    const input = doc.getElementById(field.id);

    // Typing can clear an existing error but never creates one. The summary is only
    // refreshed if it is already showing (it appears on submit, not while typing).
    input.addEventListener('input', () => {
      if (doc.getElementById(`${field.id}-error`).hidden) return;
      showError(doc, field.id, '');
      if (!summary.hidden) updateSummary(doc, fields);
    });

    // Leaving an empty required field warns right away. Only the "empty" check runs
    // here; format and length errors still wait for submit.
    input.addEventListener('blur', (event) => {
      if (form.hidden || !isRequired(doc, field.id) || !isEmpty(doc, field.id)) return;
      const toggle = doc.querySelector(`button[data-toggle="${field.id}"]`);
      if (toggle && event.relatedTarget === toggle) return; // heading to its Show button
      showError(doc, field.id, field.validate({}));
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
