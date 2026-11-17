const fs = require('fs');
const path = require('path');
const { initForm } = require('../src/form');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function loadPage() {
  document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
  initForm(document);
}

describe('Story 6: accessibility and page structure', () => {
  beforeEach(loadPage);

  test('page declares language, viewport and a single main and h1', () => {
    expect(html).toMatch(/<html[^>]*lang="en"/);
    expect(html).toMatch(/<meta name="viewport"[^>]*width=device-width/);
    expect(document.querySelectorAll('main')).toHaveLength(1);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
  });

  test('every form field has an associated label', () => {
    const inputs = document.querySelectorAll('#registration-form input');
    expect(inputs.length).toBe(7);
    inputs.forEach((input) => {
      expect(document.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    });
  });

  test('all ids are unique', () => {
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(['name', 'email', 'password', 'confirm-password', 'address', 'country'])(
    'required field %s has required, aria-required and a "(required)" label', (id) => {
      const input = document.getElementById(id);
      expect(input.required).toBe(true);
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(document.querySelector(`label[for="${id}"]`).textContent).toMatch(/\(required\)/i);
    });

  test('phone is not marked required', () => {
    const phone = document.getElementById('phone');
    expect(phone.required).toBe(false);
    expect(phone.hasAttribute('aria-required')).toBe(false);
  });

  test('each Show/Hide toggle has a distinct accessible name naming its field', () => {
    const names = [...document.querySelectorAll('button[data-toggle]')]
      .map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual(['Show password', 'Show confirm password']);
  });

  test('toggle accessible name updates when pressed', () => {
    const btn = document.querySelector('button[data-toggle="confirm-password"]');
    btn.click();
    expect(btn.getAttribute('aria-label')).toBe('Hide confirm password');
    btn.click();
    expect(btn.getAttribute('aria-label')).toBe('Show confirm password');
  });

  test('error and success regions keep their live-region roles', () => {
    expect(document.getElementById('error-summary').getAttribute('role')).toBe('alert');
    expect(document.getElementById('success-message').getAttribute('role')).toBe('status');
  });
});

describe('Story 6: stylesheet', () => {
  const cssPath = path.join(ROOT, 'styles.css');
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  test('index.html links the stylesheet and theme script', () => {
    expect(html).toMatch(/<link[^>]*rel="stylesheet"[^>]*href="styles\.css"/);
    expect(html).toMatch(/<script src="src\/theme\.js">/);
  });

  test('styles.css exists and is not empty', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  test.each([
    ['responsive card width', /max-width/],
    ['touch-friendly inputs', /min-height:\s*44px/],
    ['visible keyboard focus', /:focus-visible/],
    ['invalid field style', /\[aria-invalid="true"\]/],
    ['system dark mode', /prefers-color-scheme:\s*dark/],
    ['forced dark theme', /\[data-theme="dark"\]/],
    ['forced light theme override', /\[data-theme="light"\]/],
  ])('styles.css has %s', (_label, pattern) => {
    expect(css).toMatch(pattern);
  });
});
