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
