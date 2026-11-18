const fs = require('fs');
const path = require('path');
const { initForm } = require('../src/form');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function loadPage() {
  document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
  initForm(document);
}

const VALID = {
  name: 'Ana', email: 'ana@example.com', password: 'abc12345',
  'confirm-password': 'abc12345', phone: '', address: '12 Main Street', country: 'Spain',
};
const form = () => document.getElementById('registration-form');
const summary = () => document.getElementById('error-summary');
const err = (id) => document.getElementById(`${id}-error`);
const field = (id) => document.getElementById(id);
const requiredLine = () => summary().querySelector('.summary-required');
const otherLine = () => summary().querySelector('.summary-other');

function submit(values = {}) {
  for (const [id, value] of Object.entries({ ...VALID, ...values })) field(id).value = value;
  form().dispatchEvent(new Event('submit', { cancelable: true }));
}
function blur(id, relatedTarget = null) {
  field(id).dispatchEvent(new FocusEvent('blur', { relatedTarget }));
}
function type(id, value) {
  field(id).value = value;
  field(id).dispatchEvent(new Event('input'));
}

describe('Story 7 part A: warn when leaving an empty required field', () => {
  beforeEach(loadPage);

  test.each([
    ['name', 'Name is required'],
    ['email', 'Email is required'],
    ['password', 'Password is required'],
    ['confirm-password', 'Please confirm your password'],
    ['address', 'Address is required'],
    ['country', 'Country is required'],
  ])('blur on empty %s shows "%s"', (id, message) => {
    blur(id);
    expect(err(id).hidden).toBe(false);
    expect(err(id).textContent).toBe(message);
    expect(field(id).getAttribute('aria-invalid')).toBe('true');
    expect(field(id).getAttribute('aria-describedby')).toBe(`${id}-error`);
  });

  test('whitespace-only name counts as empty on blur', () => {
    field('name').value = '   ';
    blur('name');
    expect(err('name').textContent).toBe('Name is required');
  });

  test('blur on a filled field shows nothing', () => {
    field('name').value = 'Ana';
    blur('name');
    expect(err('name').hidden).toBe(true);
  });

  test('blur on empty optional phone shows nothing', () => {
    blur('phone');
    expect(err('phone').hidden).toBe(true);
  });

  test('blur with a format problem shows no error until submit', () => {
    field('email').value = 'abc';
    blur('email');
    expect(err('email').hidden).toBe(true);
    submit({ email: 'abc' });
    expect(err('email').textContent).toBe('Enter a valid email');
  });

  test('blur with a too-short value shows no error until submit', () => {
    field('name').value = 'A';
    blur('name');
    expect(err('name').hidden).toBe(true);
  });

  test('typing in the field clears the blur warning', () => {
    blur('name');
    type('name', 'A');
    expect(err('name').hidden).toBe(true);
    expect(field('name').getAttribute('aria-invalid')).toBe('false');
  });

  test('blur warning does not show the top summary', () => {
    blur('name');
    expect(summary().hidden).toBe(true);
  });

  test('typing after a blur warning does not make the summary appear', () => {
    blur('name');
    type('name', 'Ana');
    expect(summary().hidden).toBe(true);
  });

  test('moving from the password field to its own Show button does not warn', () => {
    const toggle = document.querySelector('button[data-toggle="password"]');
    blur('password', toggle);
    expect(err('password').hidden).toBe(true);
  });

  test('blur does nothing once the form has been submitted successfully', () => {
    submit();
    field('name').value = '';
    blur('name');
    expect(err('name').hidden).toBe(true);
  });
});

describe('Story 7 part B: the summary names the empty required fields', () => {
  beforeEach(loadPage);

  test('lists empty required fields by label name, in form order', () => {
    submit({ country: '', name: '', email: '' });
    expect(summary().hidden).toBe(false);
    expect(requiredLine().textContent).toBe('Required: Name, Email, Country');
    expect(otherLine()).toBeNull();
  });

  test('uses the plain label name without "(required)"', () => {
    submit({ 'confirm-password': '' });
    expect(requiredLine().textContent).toBe('Required: Confirm password');
  });

  test('each name is a link that focuses its field', () => {
    submit({ name: '', country: '' });
    const links = [...requiredLine().querySelectorAll('a')];
    expect(links.map((a) => a.textContent)).toEqual(['Name', 'Country']);
    links[1].click();
    expect(document.activeElement.id).toBe('country');
    links[0].click();
    expect(document.activeElement.id).toBe('name');
  });

  test('links point to their fields for non-JS fallbacks', () => {
    submit({ name: '' });
    expect(requiredLine().querySelector('a').getAttribute('href')).toBe('#name');
  });

  test('a mix of empty and invalid fields shows both lines', () => {
    submit({ name: '', email: 'nope', phone: 'abc' });
    expect(requiredLine().textContent).toBe('Required: Name');
    expect(otherLine().textContent).toBe('Please fix 2 more fields below');
  });

  test('mix with a single other error uses singular wording', () => {
    submit({ name: '', email: 'nope' });
    expect(otherLine().textContent).toBe('Please fix 1 more field below');
  });

  test('only non-empty errors keep the Story 5 wording', () => {
    submit({ email: 'nope' });
    expect(requiredLine()).toBeNull();
    expect(summary().textContent).toBe('Please fix 1 field below');
  });

  test('mismatched confirm password is an "other" error, not a required one', () => {
    submit({ 'confirm-password': 'different1' });
    expect(requiredLine()).toBeNull();
    expect(summary().textContent).toBe('Please fix 1 field below');
  });

  test('typing in a listed field removes it from the summary', () => {
    submit({ name: '', country: '' });
    type('name', 'Ana');
    expect(requiredLine().textContent).toBe('Required: Country');
  });

  test('summary hides when the last listed field is fixed', () => {
    submit({ name: '' });
    type('name', 'Ana');
    expect(summary().hidden).toBe(true);
  });

  test('summary shows blur warnings together with submit errors', () => {
    blur('name');
    submit({ name: '', country: '' });
    expect(requiredLine().textContent).toBe('Required: Name, Country');
  });

  test('"Register another user" leaves no summary behind', () => {
    submit({ name: '' });
    submit();
    document.getElementById('register-another').click();
    expect(summary().hidden).toBe(true);
    expect(summary().textContent).toBe('');
  });
});
