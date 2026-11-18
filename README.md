# User Registration Form

A frontend-only user registration form built with plain HTML, CSS and JavaScript. It has client-side validation, accessible error messages and a light/dark theme. There is no backend: a valid submit shows a success message and the data is not stored or sent anywhere.

## Features

- Seven fields: name, email, password, confirm password, phone (optional), address and country.
- Validation on submit, with an inline error under each invalid field.
- A warning as soon as the user leaves an empty required field.
- An error summary at the top that lists the empty required fields as links which jump to each field.
- Focus moves to the first invalid field on a failed submit.
- Show/Hide buttons on both password fields.
- A success state with a "Register another user" button that resets the form.
- Responsive layout, keyboard-friendly, with labels, `aria-invalid`, `aria-describedby` and live regions for screen readers.
- Light and dark theme. It follows the system setting by default, and a toggle lets the user choose; the choice is remembered in `localStorage`.

## Getting started

No build step or server is needed. Open `index.html` in a browser.

To run the tests you need [Node.js](https://nodejs.org/):

```bash
npm install
npm test
```

## Validation rules

| Field | Required | Rule |
|---|---|---|
| Name | Yes | At least 2 characters (trimmed). |
| Email | Yes | Valid format, such as `name@domain.tld`. |
| Password | Yes | At least 8 characters, with at least one letter and one number. |
| Confirm password | Yes | Must match the password. The mismatch error only shows when the password itself is valid. |
| Phone | No | If filled: digits, spaces, `+`, `-`, `(` and `)`, with 7 to 15 digits in total. |
| Address | Yes | At least 5 characters (trimmed). |
| Country | Yes | At least 2 characters (trimmed), free text. |

Errors are created on submit. The one exception is leaving an empty required field, which warns immediately. Typing in a field only ever clears its error and never creates one. Native browser validation is turned off on purpose (`novalidate`) so the form can show its own messages.

## Project structure

```
index.html                    Page markup
styles.css                    Styling, responsive layout and light/dark themes
src/form.js                   Validation and form behavior
src/theme.js                  Light/dark theme toggle
tests/form.test.js            Form fields, validation and submit behavior
tests/accessibility.test.js   Page structure, labels, ARIA and stylesheet checks
tests/theme.test.js           Theme toggle behavior
tests/required-warnings.test.js  Blur warnings and the named summary
```

## Testing

Tests use [Jest](https://jestjs.io/) with jsdom. They load `index.html` into a simulated DOM and exercise the real form code.

The CSS tests only check that key rules exist, such as focus styles, dark mode and the 44px touch targets. They do not check how the page looks, so check the visuals in a browser.

## Limitations

- Nothing is saved: submitted data is not stored or sent anywhere, so the passwords are never persisted.
- There is no login, email verification or admin page.
- If a user's saved theme differs from their system setting, the page may briefly flash the other theme on load.
