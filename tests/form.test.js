const fs = require('fs');
const path = require('path');
const { initForm } = require('../src/form');

function loadPage() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
  initForm(document);
}

describe('Story 1: registration form with name and email', () => {
  beforeEach(loadPage);

  test('renders name and email fields with labels', () => {
    expect(document.querySelector('label[for="name"]').textContent).toMatch(/name/i);
    expect(document.querySelector('label[for="email"]').textContent).toMatch(/email/i);
    expect(document.getElementById('name')).not.toBeNull();
    expect(document.getElementById('email')).not.toBeNull();
  });

  test('success message is hidden initially', () => {
    expect(document.getElementById('success-message').hidden).toBe(true);
  });

  test('submitting the form shows the success message', () => {
    document.getElementById('name').value = 'Ana';
    document.getElementById('email').value = 'ana@example.com';
    document.getElementById('password').value = 'abc12345';
    document.getElementById('confirm-password').value = 'abc12345';
    document.getElementById('address').value = '12 Main Street';
    document.getElementById('country').value = 'Spain';
    document.getElementById('registration-form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    const msg = document.getElementById('success-message');
    expect(msg.hidden).toBe(false);
    expect(msg.textContent).toMatch(/registered/i);
  });

  test('submit does not reload the page (default prevented)', () => {
    const evt = new Event('submit', { cancelable: true });
    document.getElementById('registration-form').dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });
});

describe('Story 2: validation of name and email', () => {
  beforeEach(loadPage);

  function submit({ name = '', email = '', password = 'abc12345', confirm = password } = {}) {
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    document.getElementById('confirm-password').value = confirm;
    document.getElementById('address').value = '12 Main Street';
    document.getElementById('country').value = 'Spain';
    document.getElementById('registration-form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
  }
  const err = (id) => document.getElementById(`${id}-error`);
  const success = () => document.getElementById('success-message');

  test('empty name shows "Name is required"', () => {
    submit({ name: '', email: 'ana@example.com' });
    expect(err('name').hidden).toBe(false);
    expect(err('name').textContent).toBe('Name is required');
    expect(success().hidden).toBe(true);
  });

  test('whitespace-only name counts as empty', () => {
    submit({ name: '   ', email: 'ana@example.com' });
    expect(err('name').textContent).toBe('Name is required');
  });

  test('1-character name shows minimum length error', () => {
    submit({ name: 'A', email: 'ana@example.com' });
    expect(err('name').textContent).toBe('Name must be at least 2 characters');
  });

  test('empty email shows "Email is required"', () => {
    submit({ name: 'Ana', email: '' });
    expect(err('email').hidden).toBe(false);
    expect(err('email').textContent).toBe('Email is required');
    expect(success().hidden).toBe(true);
  });

  test.each(['abc', 'a@b', 'a@b.', '@b.com', 'a b@c.com'])(
    'invalid email "%s" shows format error', (bad) => {
      submit({ name: 'Ana', email: bad });
      expect(err('email').textContent).toBe('Enter a valid email');
      expect(success().hidden).toBe(true);
    });

  test('valid name and email show success and no errors', () => {
    submit({ name: 'Ana', email: 'ana@example.com' });
    expect(success().hidden).toBe(false);
    expect(err('name').hidden).toBe(true);
    expect(err('email').hidden).toBe(true);
  });

  test('invalid fields get aria-invalid and are linked to their error', () => {
    submit({ name: '', email: 'nope' });
    const name = document.getElementById('name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(name.getAttribute('aria-describedby')).toBe('name-error');
    expect(document.getElementById('email').getAttribute('aria-invalid')).toBe('true');
  });

  test('fixing a field and resubmitting clears its error', () => {
    submit({ name: '', email: 'ana@example.com' });
    submit({ name: 'Ana', email: 'ana@example.com' });
    expect(err('name').hidden).toBe(true);
    expect(err('name').textContent).toBe('');
    expect(document.getElementById('name').getAttribute('aria-invalid')).toBe('false');
    expect(success().hidden).toBe(false);
  });

});

describe('Story 3: password and confirm password', () => {
  beforeEach(loadPage);

  function submit({ name = 'Ana', email = 'ana@example.com', password = '', confirm = '' } = {}) {
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    document.getElementById('confirm-password').value = confirm;
    document.getElementById('address').value = '12 Main Street';
    document.getElementById('country').value = 'Spain';
    document.getElementById('registration-form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
  }
  const err = (id) => document.getElementById(`${id}-error`);
  const success = () => document.getElementById('success-message');

  test('renders both password fields as password inputs with labels', () => {
    for (const id of ['password', 'confirm-password']) {
      const input = document.getElementById(id);
      expect(input.type).toBe('password');
      expect(input.getAttribute('autocomplete')).toBe('new-password');
      expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });

  test('empty password shows "Password is required"', () => {
    submit({ password: '', confirm: '' });
    expect(err('password').textContent).toBe('Password is required');
    expect(success().hidden).toBe(true);
  });

  test('short password shows minimum length error', () => {
    submit({ password: 'abc123', confirm: 'abc123' });
    expect(err('password').textContent).toBe('Password must be at least 8 characters');
  });

  test.each(['abcdefgh', '12345678'])(
    'password "%s" without letter+number shows composition error', (pw) => {
      submit({ password: pw, confirm: pw });
      expect(err('password').textContent).toBe('Password must include a letter and a number');
    });

  test('valid password shows no password error', () => {
    submit({ password: 'abc12345', confirm: 'abc12345' });
    expect(err('password').hidden).toBe(true);
    expect(document.getElementById('password').getAttribute('aria-invalid')).toBe('false');
  });

  test('empty confirm shows "Please confirm your password"', () => {
    submit({ password: 'abc12345', confirm: '' });
    expect(err('confirm-password').textContent).toBe('Please confirm your password');
    expect(success().hidden).toBe(true);
  });

  test('mismatch shows "Passwords do not match" when password is valid', () => {
    submit({ password: 'abc12345', confirm: 'abc12346' });
    expect(err('confirm-password').textContent).toBe('Passwords do not match');
    expect(document.getElementById('confirm-password').getAttribute('aria-invalid')).toBe('true');
    expect(success().hidden).toBe(true);
  });

  test('mismatch error is NOT shown when the password itself is invalid', () => {
    submit({ password: 'short', confirm: 'different' });
    expect(err('password').hidden).toBe(false);
    expect(err('confirm-password').hidden).toBe(true);
  });

  test('matching passwords show no confirm error and success appears', () => {
    submit({ password: 'abc12345', confirm: 'abc12345' });
    expect(err('confirm-password').hidden).toBe(true);
    expect(success().hidden).toBe(false);
  });

  test.each(['password', 'confirm-password'])(
    'show/hide toggle for %s switches type and aria-pressed', (id) => {
      const input = document.getElementById(id);
      const btn = document.querySelector(`button[data-toggle="${id}"]`);
      expect(btn.getAttribute('aria-pressed')).toBe('false');
      expect(btn.textContent).toBe('Show');
      btn.click();
      expect(input.type).toBe('text');
      expect(btn.getAttribute('aria-pressed')).toBe('true');
      expect(btn.textContent).toBe('Hide');
      btn.click();
      expect(input.type).toBe('password');
      expect(btn.getAttribute('aria-pressed')).toBe('false');
      expect(btn.textContent).toBe('Show');
    });

  test('toggle buttons do not submit the form', () => {
    expect(document.querySelector('button[data-toggle="password"]').type).toBe('button');
  });
});

describe('Story 4: phone, address and country', () => {
  beforeEach(loadPage);

  function submit({ phone = '', address = '12 Main Street', country = 'Spain' } = {}) {
    document.getElementById('name').value = 'Ana';
    document.getElementById('email').value = 'ana@example.com';
    document.getElementById('password').value = 'abc12345';
    document.getElementById('confirm-password').value = 'abc12345';
    document.getElementById('phone').value = phone;
    document.getElementById('address').value = address;
    document.getElementById('country').value = country;
    document.getElementById('registration-form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
  }
  const err = (id) => document.getElementById(`${id}-error`);
  const success = () => document.getElementById('success-message');

  test('renders fields with the right types, autocomplete and labels', () => {
    const phone = document.getElementById('phone');
    expect(phone.type).toBe('tel');
    expect(phone.getAttribute('autocomplete')).toBe('tel');
    expect(document.querySelector('label[for="phone"]').textContent).toMatch(/optional/i);
    const address = document.getElementById('address');
    expect(address.tagName).toBe('INPUT');
    expect(address.getAttribute('autocomplete')).toBe('street-address');
    const country = document.getElementById('country');
    expect(country.tagName).toBe('INPUT');
    expect(country.getAttribute('autocomplete')).toBe('country-name');
    expect(document.querySelector('label[for="address"]')).not.toBeNull();
    expect(document.querySelector('label[for="country"]')).not.toBeNull();
  });

  test('empty phone is valid and does not block success', () => {
    submit({ phone: '' });
    expect(err('phone').hidden).toBe(true);
    expect(success().hidden).toBe(false);
  });

  test.each(['+1 (555) 123-4567', '5551234', '555-123-4567'])(
    'valid phone "%s" passes', (phone) => {
      submit({ phone });
      expect(err('phone').hidden).toBe(true);
      expect(success().hidden).toBe(false);
    });

  test.each(['abc', '123', '1234567890123456', '555-CALL-NOW'])(
    'invalid phone "%s" shows error', (phone) => {
      submit({ phone });
      expect(err('phone').textContent).toBe('Enter a valid phone number');
      expect(document.getElementById('phone').getAttribute('aria-invalid')).toBe('true');
      expect(success().hidden).toBe(true);
    });

  test.each(['', '    '])('empty/whitespace address "%s" shows required', (address) => {
    submit({ address });
    expect(err('address').textContent).toBe('Address is required');
    expect(success().hidden).toBe(true);
  });

  test('short address shows minimum length error', () => {
    submit({ address: '1 Av' });
    expect(err('address').textContent).toBe('Address must be at least 5 characters');
  });

  test('valid address shows no error', () => {
    submit({ address: '12345' });
    expect(err('address').hidden).toBe(true);
  });

  test('empty country shows required', () => {
    submit({ country: '  ' });
    expect(err('country').textContent).toBe('Country is required');
    expect(success().hidden).toBe(true);
  });

  test('1-character country shows minimum length error', () => {
    submit({ country: 'X' });
    expect(err('country').textContent).toBe('Country must be at least 2 characters');
  });

  test('aria-describedby links invalid fields to their errors', () => {
    submit({ phone: 'abc', address: '', country: '' });
    expect(document.getElementById('phone').getAttribute('aria-describedby')).toBe('phone-error');
    expect(document.getElementById('address').getAttribute('aria-describedby')).toBe('address-error');
    expect(document.getElementById('country').getAttribute('aria-describedby')).toBe('country-error');
  });

  test('all valid shows success with no errors', () => {
    submit({ phone: '+34 600 123 456', address: '12 Main Street', country: 'Spain' });
    expect(success().hidden).toBe(false);
    for (const id of ['phone', 'address', 'country']) expect(err(id).hidden).toBe(true);
  });
});

describe('Story 5: submit experience', () => {
  beforeEach(loadPage);

  const VALID = {
    name: 'Ana', email: 'ana@example.com', password: 'abc12345',
    'confirm-password': 'abc12345', phone: '', address: '12 Main Street', country: 'Spain',
  };
  const form = () => document.getElementById('registration-form');
  const success = () => document.getElementById('success-message');
  const summary = () => document.getElementById('error-summary');
  const err = (id) => document.getElementById(`${id}-error`);

  function fill(values) {
    for (const [id, value] of Object.entries({ ...VALID, ...values })) {
      document.getElementById(id).value = value;
    }
  }
  function submit(values = {}) {
    fill(values);
    form().dispatchEvent(new Event('submit', { cancelable: true }));
  }

  test('summary is hidden initially', () => {
    expect(summary().hidden).toBe(true);
  });

  test('invalid submit focuses the first invalid field in form order', () => {
    submit({ email: 'nope', country: '' });
    expect(document.activeElement.id).toBe('email');
    submit({ country: '' });
    expect(document.activeElement.id).toBe('country');
  });

  test('summary shows the number of invalid fields (plural)', () => {
    submit({ name: 'A', email: 'nope', phone: 'abc' });
    expect(summary().hidden).toBe(false);
    expect(summary().textContent).toBe('Please fix 3 fields below');
  });

  test('summary uses singular for one invalid field', () => {
    submit({ country: 'X' });
    expect(summary().textContent).toBe('Please fix 1 field below');
  });

  test('valid submit hides the summary, hides the form and shows generic success', () => {
    submit({ country: '' });
    submit();
    expect(summary().hidden).toBe(true);
    expect(form().hidden).toBe(true);
    expect(success().hidden).toBe(false);
    expect(success().textContent).toBe('You have been registered successfully.');
    expect(success().textContent).not.toMatch(/Ana/);
  });

  test('password values are cleared after success', () => {
    submit();
    expect(document.getElementById('password').value).toBe('');
    expect(document.getElementById('confirm-password').value).toBe('');
  });

  test('a second submit after success does nothing', () => {
    submit();
    submit({ name: '' });
    expect(success().hidden).toBe(false);
    expect(form().hidden).toBe(true);
    expect(summary().hidden).toBe(true);
  });

  test('"Register another user" shows an empty, clean form again', () => {
    const another = document.getElementById('register-another');
    expect(another.hidden).toBe(true);
    submit();
    expect(another.hidden).toBe(false);
    another.click();
    expect(form().hidden).toBe(false);
    expect(success().hidden).toBe(true);
    expect(another.hidden).toBe(true);
    expect(summary().hidden).toBe(true);
    for (const id of Object.keys(VALID)) {
      expect(document.getElementById(id).value).toBe('');
      expect(document.getElementById(id).getAttribute('aria-invalid')).toBe('false');
      expect(err(id).hidden).toBe(true);
    }
    expect(document.activeElement.id).toBe('name');
  });

  test('reset puts password fields back to hidden mode', () => {
    document.querySelector('button[data-toggle="password"]').click();
    submit();
    document.getElementById('register-another').click();
    const btn = document.querySelector('button[data-toggle="password"]');
    expect(document.getElementById('password').type).toBe('password');
    expect(btn.textContent).toBe('Show');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  test('editing an invalid field clears only that fields error', () => {
    submit({ name: '', email: 'nope' });
    const name = document.getElementById('name');
    name.value = 'Ana';
    name.dispatchEvent(new Event('input'));
    expect(err('name').hidden).toBe(true);
    expect(name.getAttribute('aria-invalid')).toBe('false');
    expect(err('email').hidden).toBe(false);
    expect(summary().textContent).toBe('Please fix 1 field below');
  });

  test('summary hides once the last error is cleared by editing', () => {
    submit({ name: '' });
    const name = document.getElementById('name');
    name.value = 'Ana';
    name.dispatchEvent(new Event('input'));
    expect(summary().hidden).toBe(true);
  });

  test('typing never creates new errors', () => {
    const name = document.getElementById('name');
    name.value = 'A';
    name.dispatchEvent(new Event('input'));
    expect(err('name').hidden).toBe(true);
    expect(summary().hidden).toBe(true);
  });
});
