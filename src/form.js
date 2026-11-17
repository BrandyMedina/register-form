function initForm(doc) {
  const form = doc.getElementById('registration-form');
  const success = doc.getElementById('success-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    success.hidden = false;
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initForm };
} else {
  initForm(document);
}
