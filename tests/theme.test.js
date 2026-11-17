const fs = require('fs');
const path = require('path');
const { initTheme } = require('../src/theme');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function mockSystemDark(isDark) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: isDark && query.includes('dark'),
    media: query,
  }));
}

function load({ systemDark = false } = {}) {
  document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
  document.documentElement.removeAttribute('data-theme');
  mockSystemDark(systemDark);
  initTheme(document, window);
  return document.getElementById('theme-toggle');
}

const theme = () => document.documentElement.getAttribute('data-theme');

describe('Story 6: user-selectable theme', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    delete window.matchMedia;
    jest.restoreAllMocks();
  });

  test('toggle button exists and is a non-submitting button', () => {
    const btn = load();
    expect(btn.type).toBe('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  test('first visit follows a light system: no forced theme, not pressed', () => {
    const btn = load({ systemDark: false });
    expect(theme()).toBeNull();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  test('first visit follows a dark system: toggle shows pressed', () => {
    const btn = load({ systemDark: true });
    expect(theme()).toBeNull();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  test('works when matchMedia is unavailable (treated as light)', () => {
    document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
    delete window.matchMedia;
    initTheme(document, window);
    expect(document.getElementById('theme-toggle').getAttribute('aria-pressed')).toBe('false');
  });

  test('clicking on a light system switches to dark and saves it', () => {
    const btn = load({ systemDark: false });
    btn.click();
    expect(theme()).toBe('dark');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('clicking on a dark system switches to light and saves it', () => {
    const btn = load({ systemDark: true });
    btn.click();
    expect(theme()).toBe('light');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('clicking twice returns to the original theme', () => {
    const btn = load({ systemDark: false });
    btn.click();
    btn.click();
    expect(theme()).toBe('light');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  test('a saved choice is restored and overrides the system setting', () => {
    localStorage.setItem('theme', 'light');
    const btn = load({ systemDark: true });
    expect(theme()).toBe('light');
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    localStorage.setItem('theme', 'dark');
    const btn2 = load({ systemDark: false });
    expect(theme()).toBe('dark');
    expect(btn2.getAttribute('aria-pressed')).toBe('true');
  });

  test('an invalid saved value is ignored', () => {
    localStorage.setItem('theme', 'purple');
    load({ systemDark: false });
    expect(theme()).toBeNull();
  });

  test('does not crash when localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const btn = load({ systemDark: false });
    expect(() => btn.click()).not.toThrow();
    expect(theme()).toBe('dark');
  });
});
