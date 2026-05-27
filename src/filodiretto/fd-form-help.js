/**
 * FD-07 — FiloDiretto: helper contrast + complete placeholders/labels.
 */
(function () {
  'use strict';

  var URL_PLACEHOLDER = 'https://www.esempio.it/pagina';
  var URL_PLACEHOLDER_OPT = 'https://www.esempio.it/pagina (opzionale)';
  var PHONE_PLACEHOLDER = '+39 02 1234 5678';

  function isFiloFormHelpApp() {
    if (document.documentElement.classList.contains('a2w-shell')) return false;
    try {
      if (window.__2WALLET_PRODUCT_LOCK__ === 'hr') return true;
    } catch (_) {}
    return document.documentElement.getAttribute('data-app') === 'filodiretto';
  }

  function fixPlaceholder(el) {
    if (!el || el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    var ph = (el.getAttribute('placeholder') || '').trim();
    if (!ph) return;
    if (ph === 'https://...' || ph === 'https://... (opzionale)') {
      el.setAttribute('placeholder', ph.indexOf('opzionale') >= 0 ? URL_PLACEHOLDER_OPT : URL_PLACEHOLDER);
      return;
    }
    if (ph === '+39 ...') {
      el.setAttribute('placeholder', PHONE_PLACEHOLDER);
    }
  }

  function fixPlaceholdersIn(root) {
    if (!root) return;
    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(fixPlaceholder);
  }

  function ensureSlugHelp() {
    var slugInput = document.getElementById('biSlug');
    if (!slugInput || document.getElementById('fdSlugHelp')) return;
    var row = slugInput.closest('.a2w-bi-slug-row');
    var host = row ? row.parentElement : slugInput.parentElement;
    if (!host) return;
    var help = document.createElement('p');
    help.id = 'fdSlugHelp';
    help.className = 'fd-slug-help fd-helper-text';
    help.textContent = 'Identificatore URL del brand (solo minuscole, numeri e trattini). Es. motor-k → landing /motor-k';
    var err = document.getElementById('biSlugError');
    if (err && err.parentElement === host) host.insertBefore(help, err);
    else host.appendChild(help);
  }

  function fixHrTemplateLabels() {
    var urlLabel = document.querySelector('label[for="hrFixedLinkUrl"]');
    if (urlLabel) urlLabel.textContent = 'URL link fisso';
    var tplUrlInputs = ['tplLink1Url', 'tplLink2Url', 'tplLink3Url', 'hrFixedLinkUrl', 'pushPassLinkUrl', 'pushBackLinkUrl', 'wzLink1Url'];
    tplUrlInputs.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) fixPlaceholder(el);
    });
  }

  function markInlineHelpers(root) {
    if (!root) return;
    root.querySelectorAll('p[style*="color:var(--text2)"], p[style*="color: var(--text2)"]').forEach(function (p) {
      if (p.classList.contains('a2w-bi-field-error')) return;
      p.classList.add('fd-helper-text');
    });
  }

  function applyFormHelpEnhancements() {
    if (!isFiloFormHelpApp()) return;
    fixPlaceholdersIn(document);
    ensureSlugHelp();
    fixHrTemplateLabels();
    markInlineHelpers(document.getElementById('brand-identity'));
    markInlineHelpers(document.getElementById('templateModal'));
    markInlineHelpers(document.getElementById('push'));
    markInlineHelpers(document.getElementById('media-library'));
    markInlineHelpers(document.getElementById('leads'));
  }

  function patchHrAddLinkRow() {
    if (window.__fdHrLinkRowPatched) return;
    window.__fdHrLinkRowPatched = true;
    var orig = window.hrAddLinkRow;
    if (typeof orig !== 'function') return;
    window.hrAddLinkRow = function (containerId, label, url) {
      orig.apply(this, arguments);
      if (!isFiloFormHelpApp()) return;
      var box = document.getElementById(containerId);
      if (!box) return;
      var row = box.querySelector('.hr-link-row:last-child');
      if (!row) return;
      var urlInput = row.querySelector('.hr-row-url');
      if (urlInput) urlInput.setAttribute('placeholder', URL_PLACEHOLDER);
    };
  }

  function patchNavRefresh() {
    if (window.__fdFormHelpNavPatched) return;
    window.__fdFormHelpNavPatched = true;
    var orig = window.nav;
    if (typeof orig !== 'function') return;
    window.nav = function (id) {
      orig.apply(this, arguments);
      if (isFiloFormHelpApp()) {
        window.setTimeout(applyFormHelpEnhancements, 0);
      }
    };
  }

  function patchLoadBrandIdentity() {
    if (window.__fdBiHelpPatched) return;
    window.__fdBiHelpPatched = true;
    var orig = window.loadBrandIdentity;
    if (typeof orig !== 'function') return;
    window.loadBrandIdentity = async function () {
      await orig.apply(this, arguments);
      if (isFiloFormHelpApp()) applyFormHelpEnhancements();
    };
  }

  function patchOpenTemplateModal() {
    if (window.__fdTplHelpPatched) return;
    window.__fdTplHelpPatched = true;
    ['openTemplateModal', 'editTemplate'].forEach(function (name) {
      var orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = async function () {
        await orig.apply(this, arguments);
        if (isFiloFormHelpApp()) applyFormHelpEnhancements();
      };
    });
  }

  function initFdFormHelp() {
    if (!isFiloFormHelpApp()) return;
    patchHrAddLinkRow();
    patchNavRefresh();
    patchLoadBrandIdentity();
    patchOpenTemplateModal();
    applyFormHelpEnhancements();
  }

  window.fdInitFormHelp = initFdFormHelp;
  window.fdApplyFormHelp = applyFormHelpEnhancements;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFdFormHelp);
  } else {
    initFdFormHelp();
  }
})();
