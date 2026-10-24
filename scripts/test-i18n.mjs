import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const translationSource = fs.readFileSync(path.join(root, 'js/translations.js'), 'utf8');
const mainSource = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    toggle: (name, force) => {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
    },
    contains: (name) => values.has(name)
  };
}

function createElement(dataset = {}) {
  const attributes = new Map();
  const listeners = new Map();
  return {
    dataset,
    classList: createClassList(),
    textContent: '',
    hidden: false,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => attributes.get(name),
    removeAttribute(name) {
      attributes.delete(name);
      if (name === 'hidden') this.hidden = false;
    },
    addEventListener: (name, callback) => listeners.set(name, callback),
    click: () => listeners.get('click')?.(),
    focus: () => {},
    querySelectorAll: () => []
  };
}

function runScenario({ savedLanguage = null, storageBlocked = false } = {}) {
  const saved = new Map();
  if (savedLanguage) saved.set('tedware-language', savedLanguage);

  const text = createElement({ i18n: 'home.heroTitle' });
  const metadata = createElement({ i18nAttr: 'content:meta.homeDescription' });
  const englishButton = createElement({ lang: 'en' });
  const dutchButton = createElement({ lang: 'nl' });
  const contactLink = createElement({ contactLink: '' });
  contactLink.hidden = true;
  const contactPlaceholder = createElement({ contactPlaceholder: '' });
  const currentYear = createElement({ currentYear: '' });
  const documentElement = { lang: 'en', dataset: {}, classList: createClassList() };

  const elementGroups = new Map([
    ['[data-i18n]', [text]],
    ['[data-i18n-attr]', [metadata]],
    ['[data-lang]', [englishButton, dutchButton]],
    ['[data-contact-link]', [contactLink]],
    ['[data-contact-placeholder]', [contactPlaceholder]],
    ['.reveal', []],
    ['[data-current-year]', [currentYear]]
  ]);

  const document = {
    documentElement,
    querySelectorAll: (selector) => elementGroups.get(selector) || [],
    querySelector: () => null,
    getElementById: () => null,
    addEventListener: () => {}
  };

  const localStorage = {
    getItem: (key) => {
      if (storageBlocked) throw new Error('Storage blocked');
      return saved.get(key) || null;
    },
    setItem: (key, value) => {
      if (storageBlocked) throw new Error('Storage blocked');
      saved.set(key, value);
    }
  };

  const window = {
    localStorage,
    scrollY: 0,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false })
  };

  const sandbox = { window, document };
  vm.runInNewContext(translationSource, sandbox, { filename: 'js/translations.js' });
  vm.runInNewContext(mainSource, sandbox, { filename: 'js/main.js' });

  return { text, metadata, englishButton, dutchButton, contactLink, contactPlaceholder, currentYear, documentElement, saved };
}

const firstVisit = runScenario();
assert(firstVisit.documentElement.lang === 'en', 'First visit must default to English.');
assert(firstVisit.text.textContent === 'Software, apps and games built with care.', 'English content was not applied.');
assert(!firstVisit.saved.has('tedware-language'), 'First visit must not create an unnecessary preference.');
assert(firstVisit.contactLink.hidden === false && firstVisit.contactLink.href === 'mailto:support.tedware@gmail.com', 'The confirmed support mailbox must be available.');

firstVisit.dutchButton.click();
assert(firstVisit.documentElement.lang === 'nl', 'Manual Dutch selection did not update the document language.');
assert(firstVisit.text.textContent === 'Software, apps en games met aandacht ontwikkeld.', 'Dutch content was not applied.');
assert(firstVisit.saved.get('tedware-language') === 'nl', 'Manual language selection was not stored.');
assert(firstVisit.dutchButton.getAttribute('aria-pressed') === 'true', 'Language controls were not synchronised.');

const returningVisit = runScenario({ savedLanguage: 'nl' });
assert(returningVisit.documentElement.lang === 'nl', 'A stored Dutch preference was not restored.');

const blockedStorage = runScenario({ storageBlocked: true });
assert(blockedStorage.documentElement.lang === 'en', 'Blocked storage must fall back to English.');
blockedStorage.dutchButton.click();
assert(blockedStorage.documentElement.lang === 'nl', 'Switching must still work when storage is blocked.');

console.log('i18n tests passed: English default, EN/NL switching, persistence and blocked-storage fallback checked.');
