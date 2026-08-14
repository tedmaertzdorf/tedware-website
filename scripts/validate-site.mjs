import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const htmlFiles = ['index.html', 'privacy.html', 'support.html'];
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const sandbox = { window: {} };
vm.runInNewContext(read('js/translations.js'), sandbox, { filename: 'js/translations.js' });
const dictionaries = sandbox.window.TEDWARE_TRANSLATIONS;

if (!dictionaries?.en || !dictionaries?.nl) {
  fail('The translation file must expose complete en and nl dictionaries.');
}

const englishKeys = new Set(Object.keys(dictionaries?.en || {}));
const dutchKeys = new Set(Object.keys(dictionaries?.nl || {}));

for (const key of englishKeys) {
  if (!dutchKeys.has(key)) fail(`Missing Dutch translation: ${key}`);
}
for (const key of dutchKeys) {
  if (!englishKeys.has(key)) fail(`Missing English translation: ${key}`);
}

for (const htmlFile of htmlFiles) {
  const html = read(htmlFile);
  const ids = new Set();
  const idPattern = /\sid="([^"]+)"/g;
  let match;

  while ((match = idPattern.exec(html))) {
    if (ids.has(match[1])) fail(`${htmlFile}: duplicate id #${match[1]}`);
    ids.add(match[1]);
  }

  const textKeyPattern = /\sdata-i18n="([^"]+)"/g;
  while ((match = textKeyPattern.exec(html))) {
    const key = match[1];
    if (!englishKeys.has(key)) fail(`${htmlFile}: unknown text translation key ${key}`);
  }

  const attributeKeyPattern = /\sdata-i18n-attr="([^"]+)"/g;
  while ((match = attributeKeyPattern.exec(html))) {
    for (const specification of match[1].split(',')) {
      const separator = specification.indexOf(':');
      const key = separator === -1 ? '' : specification.slice(separator + 1).trim();
      if (!englishKeys.has(key)) fail(`${htmlFile}: unknown attribute translation key ${key || specification}`);
    }
  }

  const referencePattern = /\s(?:href|src)="([^"]+)"/g;
  while ((match = referencePattern.exec(html))) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) continue;

    const [filePart, fragment] = reference.split('#');
    const targetFile = filePart || htmlFile;
    const resolved = path.resolve(root, path.dirname(htmlFile), targetFile);

    if (!resolved.startsWith(root)) {
      fail(`${htmlFile}: reference leaves the site root: ${reference}`);
      continue;
    }

    if (!fs.existsSync(resolved)) {
      fail(`${htmlFile}: missing local target ${reference}`);
      continue;
    }

    if (fragment && path.extname(resolved).toLowerCase() === '.html') {
      const targetHtml = fs.readFileSync(resolved, 'utf8');
      const escapedFragment = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\sid=["']${escapedFragment}["']`).test(targetHtml)) {
        fail(`${htmlFile}: missing fragment target ${reference}`);
      }
    }
  }

  if (/\b[A-Za-z]:\\/.test(html)) fail(`${htmlFile}: contains an absolute Windows path.`);
  if (!/<html lang="en">/.test(html)) fail(`${htmlFile}: must have an English no-JavaScript default.`);
  if (!/<link rel="canonical" href="https:\/\/tedware\.nl\//.test(html)) fail(`${htmlFile}: missing tedware.nl canonical URL.`);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail(`${htmlFile}: must contain exactly one h1.`);
  if (!/<main id="main">/.test(html) || !/class="skip-link" href="#main"/.test(html)) fail(`${htmlFile}: missing skip-link/main relationship.`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail(`${htmlFile}: missing meta description.`);
  if (!/<meta property="og:title"/.test(html) || !/<meta property="og:description"/.test(html) || !/<meta property="og:url"/.test(html)) {
    fail(`${htmlFile}: incomplete Open Graph metadata.`);
  }
  if (!/data-lang="en"/.test(html) || !/data-lang="nl"/.test(html)) fail(`${htmlFile}: missing EN/NL controls.`);
  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html)) fail(`${htmlFile}: contains an image without alt text.`);
}

try {
  JSON.parse(read('site.webmanifest'));
} catch (error) {
  fail(`site.webmanifest: invalid JSON (${error.message})`);
}

const requiredFiles = [
  'css/styles.css',
  'js/main.js',
  'js/translations.js',
  'assets/icons/favicon.svg',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
  '.nojekyll',
  'README.md'
];

for (const requiredFile of requiredFiles) {
  if (!fs.existsSync(path.join(root, requiredFile))) fail(`Missing required file: ${requiredFile}`);
}

if (read('CNAME').trim() !== 'tedware.nl') fail('CNAME must contain only tedware.nl.');
if (!read('robots.txt').includes('https://tedware.nl/sitemap.xml')) fail('robots.txt does not reference the production sitemap.');

const css = read('css/styles.css');
if (!css.includes(':focus-visible')) fail('styles.css: missing visible keyboard focus treatment.');
if (!css.includes('prefers-reduced-motion: reduce')) fail('styles.css: missing reduced-motion handling.');
if (!css.includes('overflow-x: clip')) fail('styles.css: missing horizontal overflow guard.');

const sitemap = read('sitemap.xml');
for (const htmlFile of htmlFiles) {
  const productionUrl = htmlFile === 'index.html' ? 'https://tedware.nl/' : `https://tedware.nl/${htmlFile}`;
  if (!sitemap.includes(`<loc>${productionUrl}</loc>`)) fail(`sitemap.xml is missing ${productionUrl}`);
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${htmlFiles.length} pages, ${englishKeys.size} translation keys, local links and publication files checked.`);
}
