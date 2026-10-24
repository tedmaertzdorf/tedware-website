(function () {
  'use strict';

  const STORAGE_KEY = 'tedware-language';
  const DEFAULT_LANGUAGE = 'en';

  // Confirmed public support mailbox, managed by Ted Maertzdorf.
  const CONTACT_EMAIL = 'support.tedware@gmail.com';

  const translations = window.TEDWARE_TRANSLATIONS || {};
  const supportedLanguages = Object.keys(translations);

  function readSavedLanguage() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return supportedLanguages.includes(saved) ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function saveLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Language switching still works for the current page when storage is blocked.
    }
  }

  function translateAttributes(element, dictionary) {
    const specifications = element.dataset.i18nAttr.split(',');

    specifications.forEach((specification) => {
      const separator = specification.indexOf(':');
      if (separator === -1) return;

      const attribute = specification.slice(0, separator).trim();
      const key = specification.slice(separator + 1).trim();
      if (attribute && dictionary[key]) {
        element.setAttribute(attribute, dictionary[key]);
      }
    });
  }

  function applyLanguage(language, persist) {
    const selectedLanguage = supportedLanguages.includes(language) ? language : DEFAULT_LANGUAGE;
    const dictionary = translations[selectedLanguage];
    if (!dictionary) return;

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = dictionary[element.dataset.i18n];
      if (typeof value === 'string') element.textContent = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
      translateAttributes(element, dictionary);
    });

    document.documentElement.lang = selectedLanguage;
    document.documentElement.dataset.language = selectedLanguage;

    document.querySelectorAll('[data-lang]').forEach((button) => {
      const isActive = button.dataset.lang === selectedLanguage;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('is-active', isActive);
    });

    if (persist) saveLanguage(selectedLanguage);
  }

  function initialiseLanguage() {
    const initialLanguage = readSavedLanguage() || DEFAULT_LANGUAGE;
    applyLanguage(initialLanguage, false);

    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', () => applyLanguage(button.dataset.lang, true));
    });
  }

  function initialiseContactLinks() {
    const isRealEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT_EMAIL) && !CONTACT_EMAIL.includes('_HERE');

    if (!isRealEmail) return;

    document.querySelectorAll('[data-contact-link]').forEach((link) => {
      link.href = `mailto:${CONTACT_EMAIL}`;
      link.removeAttribute('hidden');
    });

    document.querySelectorAll('[data-contact-placeholder]').forEach((placeholder) => {
      placeholder.hidden = true;
    });
  }

  function initialiseNavigation() {
    const header = document.querySelector('[data-site-header]');
    const toggle = document.querySelector('[data-nav-toggle]');
    const navigation = document.getElementById('primary-navigation');
    if (!header || !toggle || !navigation) return;

    function closeNavigation() {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      header.classList.toggle('nav-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNavigation);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) {
        closeNavigation();
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 760px)').matches) closeNavigation();
    });
  }

  function initialiseHeader() {
    const header = document.querySelector('[data-site-header]');
    if (!header) return;

    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 16);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  function initialiseReveals() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    elements.forEach((element) => observer.observe(element));
  }

  function setCurrentYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('[data-current-year]').forEach((element) => {
      element.textContent = year;
    });
  }

  initialiseLanguage();
  initialiseContactLinks();
  initialiseNavigation();
  initialiseHeader();
  initialiseReveals();
  setCurrentYear();
})();
