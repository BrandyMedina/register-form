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

  function submit({ name = '', email = '' } = {}) {
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
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

  test('success message hides again if a later submit is invalid', () => {
    submit({ name: 'Ana', email: 'ana@example.com' });
    submit({ name: 'Ana', email: '' });
    expect(success().hidden).toBe(true);
  });
});
