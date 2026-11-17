const THEME_KEY = 'theme';

function readSavedTheme(win) {
  try {
    const saved = win.localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch (e) {
    return null; // storage blocked: just follow the system setting
  }
}

function saveTheme(win, theme) {
  try {
    win.localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // storage blocked: the choice still applies for this visit
  }
}

function systemPrefersDark(win) {
  return typeof win.matchMedia === 'function' &&
    win.matchMedia('(prefers-color-scheme: dark)').matches;
}

// With no saved choice we set no data-theme, so CSS follows the system setting.
function initTheme(doc, win) {
  const root = doc.documentElement;
  const button = doc.getElementById('theme-toggle');

  const saved = readSavedTheme(win);
  if (saved) root.setAttribute('data-theme', saved);

  const isDark = () => {
    const forced = root.getAttribute('data-theme');
    return forced ? forced === 'dark' : systemPrefersDark(win);
  };
  const render = () => button.setAttribute('aria-pressed', String(isDark()));

  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    saveTheme(win, next);
    render();
  });

  render();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initTheme };
} else {
  initTheme(document, window);
}
