/**
 * Ads2Wallet — Template Pass page (grid/list, preview, toolbar).
 * Active only when isA2wDeploy() + a2w-shell (FiloDiretto unchanged).
 */
(function () {
  'use strict';

  const A2W = window.A2W = window.A2W || {};
  A2W.templates = A2W.templates || {
    view: 'grid',
    search: '',
    layoutFilter: '',
    cache: [],
    campaignCounts: {},
    layoutReady: false
  };

  function isA2wTemplatesActive() {
    return typeof isA2wDeploy === 'function' && isA2wDeploy()
      && document.documentElement.classList.contains('a2w-shell');
  }

  function escHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function passTypeLabel(passType) {
    if (typeof formatTemplatePassTypeLabel === 'function') {
      return formatTemplatePassTypeLabel(passType);
    }
    const labels = {
      storeCard: 'Store Card',
      coupon: 'Coupon',
      eventTicket: 'Event Ticket',
      generic: 'Generic',
      boardingPass: 'Boarding Pass',
      employee_pass: 'Pass dipendente'
    };
    return labels[passType] || passType || 'Pass';
  }

  const LAYOUT_FILTER_OPTIONS = [
    { value: '', label: 'Tutti i layout' },
    { value: 'coupon', label: 'Coupon' },
    { value: 'eventTicket', label: 'Event Ticket' },
    { value: 'storeCard', label: 'Store Card' },
    { value: 'generic', label: 'Generic' }
  ];

  const DEFAULT_PASS_COLORS = {
    coupon: { bg: '#FF6B35', fg: '#FFFFFF' },
    storeCard: { bg: '#0D0B1A', fg: '#FFFFFF' },
    eventTicket: { bg: '#2C3E50', fg: '#FFFFFF' },
    generic: { bg: '#1C1C1C', fg: '#FFFFFF' },
    boardingPass: { bg: '#004B87', fg: '#FFFFFF' },
    employee_pass: { bg: '#0D0B1A', fg: '#FFFFFF' }
  };

  function templateColors(t) {
    const style = t.style || {};
    const defaults = DEFAULT_PASS_COLORS[t.pass_type] || DEFAULT_PASS_COLORS.coupon;
    return {
      bg: style.backgroundColor || defaults.bg,
      fg: style.foregroundColor || defaults.fg
    };
  }

  function fieldAt(fields, key) {
    if (!fields || typeof fields !== 'object') return {};
    const arr = fields[key];
    return Array.isArray(arr) && arr.length ? arr[0] : {};
  }

  function walletImageUrl(templateId, imageType) {
    if (typeof API === 'undefined') return '';
    return API + '/templates/' + encodeURIComponent(templateId) + '/wallet-image/' + imageType;
  }

  function hasWalletImage(t, imageType) {
    return !!(t.style && t.style.images && t.style.images[imageType]);
  }

  function buildMiniPreviewHtml(t) {
    const colors = templateColors(t);
    const fields = t.fields || {};
    const header = fieldAt(fields, 'headerFields');
    const secondary = fieldAt(fields, 'secondaryFields');
    const auxiliary = fieldAt(fields, 'auxiliaryFields');
    const passType = t.pass_type || 'coupon';
    const showStrip = passType !== 'generic';
    const stripStyle = hasWalletImage(t, 'strip')
      ? 'background-image:url(' + escHtml(walletImageUrl(t.id, 'strip')) + ')'
      : '';
    const logoHtml = hasWalletImage(t, 'logo')
      ? '<img class="a2w-tpl-preview__logo-img" src="' + escHtml(walletImageUrl(t.id, 'logo')) + '" alt="">'
      : '<span class="a2w-tpl-preview__logo-text">' + escHtml((t.name || 'PASS').slice(0, 14)) + '</span>';
    const headerField = (header.label || header.value)
      ? '<div class="a2w-tpl-preview__hf"><span class="a2w-tpl-preview__fl">' + escHtml(header.label || '') + '</span><span class="a2w-tpl-preview__fv">' + escHtml(header.value || '') + '</span></div>'
      : '';
    const secHtml = (secondary.label || secondary.value)
      ? '<div class="a2w-tpl-preview__field"><span class="a2w-tpl-preview__fl">' + escHtml(secondary.label || '') + '</span><span class="a2w-tpl-preview__fv">' + escHtml(secondary.value || '') + '</span></div>'
      : '';
    const auxHtml = (auxiliary.label || auxiliary.value)
      ? '<div class="a2w-tpl-preview__field"><span class="a2w-tpl-preview__fl">' + escHtml(auxiliary.label || '') + '</span><span class="a2w-tpl-preview__fv">' + escHtml(auxiliary.value || '') + '</span></div>'
      : '';

    return [
      '<div class="a2w-tpl-preview pass-type-' + escHtml(passType) + '" style="--a2w-tpl-bg:' + escHtml(colors.bg) + ';--a2w-tpl-fg:' + escHtml(colors.fg) + '">',
      showStrip ? '<div class="a2w-tpl-preview__strip" style="' + stripStyle + '"></div>' : '',
      '<div class="a2w-tpl-preview__header">',
      '<div class="a2w-tpl-preview__logo">' + logoHtml + '</div>',
      headerField,
      '</div>',
      '<div class="a2w-tpl-preview__body">',
      '<div class="a2w-tpl-preview__row">' + secHtml + auxHtml + '</div>',
      '</div>',
      '</div>'
    ].join('');
  }

  function campaignCountForTemplate(templateId) {
    const counts = A2W.templates.campaignCounts || {};
    if (counts[templateId] != null) return counts[templateId];
    const campaigns = Array.isArray(window.campaignsCache) ? window.campaignsCache : [];
    return campaigns.filter((c) => c.template_id === templateId).length;
  }

  async function ensureCampaignCounts() {
    if (!brandId) return;
    if (Array.isArray(window.campaignsCache) && window.campaignsCache.length) {
      rebuildCampaignCounts();
      return;
    }
    try {
      if (typeof fetchCachedJson === 'function') {
        window.campaignsCache = await fetchCachedJson(API + '/campaigns?brand_id=' + brandId, {
          headers: { ...(typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}) }
        });
      }
      rebuildCampaignCounts();
    } catch (_) {}
  }

  function rebuildCampaignCounts() {
    const counts = {};
    (window.campaignsCache || []).forEach((c) => {
      if (!c.template_id) return;
      counts[c.template_id] = (counts[c.template_id] || 0) + 1;
    });
    A2W.templates.campaignCounts = counts;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return '—';
    }
  }

  function filteredTemplates() {
    const q = (A2W.templates.search || '').trim().toLowerCase();
    const layout = A2W.templates.layoutFilter || '';
    return (A2W.templates.cache || []).filter((t) => {
      if (layout && (t.pass_type || '') !== layout) return false;
      if (!q) return true;
      return String(t.name || '').toLowerCase().includes(q);
    });
  }

  function skeletonMarkup() {
    let cards = '';
    for (let i = 0; i < 3; i++) {
      cards += [
        '<article class="a2w-tpl-card a2w-tpl-card--skeleton">',
        '  <div class="a2w-skeleton a2w-tpl-preview-skeleton"></div>',
        '  <div class="a2w-skeleton a2w-skeleton-line a2w-tpl-title-skeleton"></div>',
        '  <div class="a2w-skeleton a2w-skeleton-line a2w-tpl-badge-skeleton"></div>',
        '</article>'
      ].join('');
    }
    return '<div class="a2w-tpl-grid a2w-tpl-grid--loading">' + cards + '</div>';
  }

  function showTemplatesSkeleton() {
    const el = document.getElementById('templatesList');
    if (el) el.innerHTML = skeletonMarkup();
  }

  function createTemplateActionMenu(t) {
    const UI = A2W.UI;
    if (!UI || typeof UI.createActionMenu !== 'function') return null;
    const items = [
      {
        label: 'Modifica',
        icon: A2W.icons && A2W.icons.edit,
        onClick: function () {
          if (typeof editTemplate === 'function') editTemplate(t.id);
        }
      },
      {
        label: 'Duplica',
        icon: A2W.icons && A2W.icons.copy,
        onClick: function () {
          const dup = (typeof a2wDuplicateTemplateFromId === 'function' && a2wDuplicateTemplateFromId)
            || (A2W && typeof A2W.a2wDuplicateTemplateFromId === 'function' && A2W.a2wDuplicateTemplateFromId);
          if (dup) {
            dup(t.id);
          } else if (typeof editTemplate === 'function') {
            editTemplate(t.id).then(function () {
              const editId = document.getElementById('templateEditId');
              if (editId) editId.value = '';
              const nameInput = document.getElementById('tplName');
              if (nameInput) nameInput.value = (nameInput.value || '') + ' (copia)';
            });
          }
        }
      },
      {
        label: 'Esporta JSON',
        icon: A2W.icons && A2W.icons.download,
        onClick: function () {
          a2wExportTemplateJson(t.id);
        }
      },
      {
        label: 'Elimina',
        icon: A2W.icons && A2W.icons.delete,
        destructive: true,
        onClick: function () {
          if (typeof deleteTemplate === 'function') deleteTemplate(t.id);
        }
      }
    ];
    return UI.createActionMenu({ label: 'Azioni template ' + (t.name || ''), items: items });
  }

  async function a2wExportTemplateJson(templateId) {
    try {
      const res = await fetch(API + '/templates/' + templateId, {
        headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (data.name || 'template').replace(/[^\w\-]+/g, '_') + '.json';
      a.click();
      URL.revokeObjectURL(url);
      if (typeof toast === 'function') toast('Template esportato');
    } catch (err) {
      if (typeof toast === 'function') toast('Export non riuscito: ' + err.message);
    }
  }

  function renderGridCard(t) {
    const count = campaignCountForTemplate(t.id);
    const countLabel = count === 1 ? '1 campagna' : count + ' campagne';
    const menu = createTemplateActionMenu(t);
    const card = document.createElement('article');
    card.className = 'a2w-tpl-card';
    card.dataset.templateId = t.id;
    card.innerHTML = [
      '<button type="button" class="a2w-tpl-card__preview-btn" aria-label="Modifica ' + escHtml(t.name) + '">',
      buildMiniPreviewHtml(t),
      '</button>',
      '<div class="a2w-tpl-card__meta">',
      '  <h3 class="a2w-tpl-card__title">' + escHtml(t.name) + '</h3>',
      '  <div class="a2w-tpl-card__badges">',
      '    <span class="a2w-tpl-badge a2w-tpl-badge--layout">' + escHtml(passTypeLabel(t.pass_type)) + '</span>',
      '    <span class="a2w-tpl-badge a2w-tpl-badge--usage">Usato in ' + escHtml(countLabel) + '</span>',
      '  </div>',
      '</div>',
      '<div class="a2w-tpl-card__footer">',
      '  <button type="button" class="btn a2w-btn-primary a2w-tpl-card__edit">Modifica</button>',
      '  <div class="a2w-tpl-card__menu-host"></div>',
      '</div>'
    ].join('');

    card.querySelector('.a2w-tpl-card__preview-btn').addEventListener('click', function () {
      if (typeof editTemplate === 'function') editTemplate(t.id);
    });
    card.querySelector('.a2w-tpl-card__edit').addEventListener('click', function (e) {
      e.stopPropagation();
      if (typeof editTemplate === 'function') editTemplate(t.id);
    });
    if (menu) {
      card.querySelector('.a2w-tpl-card__menu-host').appendChild(menu);
    }
    return card;
  }

  function renderListRow(t) {
    const count = campaignCountForTemplate(t.id);
    const tr = document.createElement('tr');
    tr.dataset.templateId = t.id;
    tr.innerHTML = [
      '<td class="a2w-tpl-list__thumb"><div class="a2w-tpl-preview a2w-tpl-preview--thumb pass-type-' + escHtml(t.pass_type || 'coupon') + '" style="--a2w-tpl-bg:' + escHtml(templateColors(t).bg) + ';--a2w-tpl-fg:' + escHtml(templateColors(t).fg) + '">',
      hasWalletImage(t, 'strip') ? '<div class="a2w-tpl-preview__strip" style="background-image:url(' + escHtml(walletImageUrl(t.id, 'strip')) + ')"></div>' : '<div class="a2w-tpl-preview__strip"></div>',
      '</div></td>',
      '<td class="a2w-tpl-list__name"><button type="button" class="a2w-tpl-list__name-btn">' + escHtml(t.name) + '</button></td>',
      '<td>' + escHtml(passTypeLabel(t.pass_type)) + '</td>',
      '<td>' + count + '</td>',
      '<td>' + escHtml(formatDate(t.updated_at)) + '</td>',
      '<td class="a2w-tpl-list__actions"></td>'
    ].join('');
    tr.querySelector('.a2w-tpl-list__name-btn').addEventListener('click', function () {
      if (typeof editTemplate === 'function') editTemplate(t.id);
    });
    const menu = createTemplateActionMenu(t);
    if (menu) tr.querySelector('.a2w-tpl-list__actions').appendChild(menu);
    return tr;
  }

  function renderEmpty() {
    const UI = A2W.UI;
    const el = document.getElementById('templatesList');
    if (!el) return;
    el.innerHTML = '';
    if (UI && typeof UI.createEmptyState === 'function') {
      const empty = UI.createEmptyState({
        title: 'Nessun template',
        description: 'Modelli riutilizzabili per generare i pass delle campagne.',
        primaryAction: {
          label: 'Crea il primo template',
          onClick: function () {
            if (typeof openTemplateModal === 'function') openTemplateModal();
          }
        },
        tertiaryAction: {
          label: 'Importa template esempio',
          onClick: function () {
            if (typeof toast === 'function') toast('Import template esempio — in arrivo');
          }
        }
      });
      el.appendChild(empty);
      return;
    }
    el.innerHTML = typeof renderEmptyState === 'function'
      ? renderEmptyState({
        title: 'Nessun template',
        description: 'Modelli riutilizzabili per generare i pass delle campagne.',
        ctaLabel: 'Crea il primo template',
        ctaOnclick: 'openTemplateModal()',
        icon: 'inbox'
      })
      : '<p>Nessun template</p>';
  }

  function renderTemplatesList() {
    const el = document.getElementById('templatesList');
    if (!el) return;
    const items = filteredTemplates();
    const total = (A2W.templates.cache || []).length;

    if (!total) {
      renderEmpty();
      return;
    }

    if (!items.length) {
      el.innerHTML = '<div class="a2w-tpl-filter-empty"><p>Nessun template corrisponde ai filtri.</p><button type="button" class="btn sec small" id="a2wTplClearFilters">Azzera filtri</button></div>';
      document.getElementById('a2wTplClearFilters')?.addEventListener('click', function () {
        A2W.templates.search = '';
        A2W.templates.layoutFilter = '';
        syncToolbarControls();
        renderTemplatesList();
      });
      return;
    }

    el.innerHTML = '';
    if (A2W.templates.view === 'list') {
      const wrap = document.createElement('div');
      wrap.className = 'a2w-tpl-list-wrap';
      wrap.innerHTML = [
        '<table class="a2w-tpl-table">',
        '<thead><tr>',
        '<th></th><th>Nome</th><th>Layout</th><th>Campagne</th><th>Ultima modifica</th><th></th>',
        '</tr></thead><tbody></tbody></table>'
      ].join('');
      const tbody = wrap.querySelector('tbody');
      items.forEach((t) => tbody.appendChild(renderListRow(t)));
      el.appendChild(wrap);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'a2w-tpl-grid';
    items.forEach((t) => grid.appendChild(renderGridCard(t)));
    el.appendChild(grid);
  }

  function syncToolbarControls() {
    const search = document.getElementById('a2wTplSearch');
    const layout = document.getElementById('a2wTplLayoutFilter');
    if (search) search.value = A2W.templates.search || '';
    if (layout) layout.value = A2W.templates.layoutFilter || '';
    document.querySelectorAll('[data-a2w-tpl-view]').forEach((btn) => {
      const active = btn.getAttribute('data-a2w-tpl-view') === A2W.templates.view;
      btn.classList.toggle('a2w-tpl-view-btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function buildToolbar() {
    const UI = A2W.UI;
    if (!UI || typeof UI.createToolbar !== 'function') return null;

    const search = document.createElement('input');
    search.type = 'search';
    search.id = 'a2wTplSearch';
    search.className = 'a2w-tpl-search a2w-ui-toolbar__search';
    search.placeholder = 'Cerca per nome…';
    search.autocomplete = 'off';
    search.addEventListener('input', function () {
      A2W.templates.search = search.value;
      renderTemplatesList();
    });

    const layout = document.createElement('select');
    layout.id = 'a2wTplLayoutFilter';
    layout.className = 'a2w-tpl-layout-filter';
    LAYOUT_FILTER_OPTIONS.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      layout.appendChild(o);
    });
    layout.addEventListener('change', function () {
      A2W.templates.layoutFilter = layout.value;
      renderTemplatesList();
    });

    const viewToggle = document.createElement('div');
    viewToggle.className = 'a2w-tpl-view-toggle';
    viewToggle.setAttribute('role', 'group');
    viewToggle.setAttribute('aria-label', 'Vista elenco');
    [
      { id: 'grid', label: 'Griglia', icon: '▦' },
      { id: 'list', label: 'Lista', icon: '☰' }
    ].forEach((v) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'a2w-tpl-view-btn';
      btn.dataset.a2wTplView = v.id;
      btn.setAttribute('aria-label', v.label);
      btn.setAttribute('title', v.label);
      btn.textContent = v.icon;
      btn.addEventListener('click', function () {
        A2W.templates.view = v.id;
        syncToolbarControls();
        renderTemplatesList();
      });
      viewToggle.appendChild(btn);
    });

    return UI.createToolbar({ left: [search, layout], right: [viewToggle] });
  }

  function ensureTemplatesPageLayout() {
    if (A2W.templates.layoutReady) return;
    const section = document.getElementById('templates');
    if (!section) return;

    const legacyHeader = section.querySelector(':scope > div');
    if (legacyHeader && legacyHeader.querySelector('.page-title')) {
      legacyHeader.classList.add('a2w-tpl-legacy-header');
      legacyHeader.hidden = true;
    }

    const UI = A2W.UI;
    if (UI && typeof UI.createPageHeader === 'function' && !document.getElementById('a2wTemplatesPageHeader')) {
      const primary = document.createElement('button');
      primary.type = 'button';
      primary.className = 'btn a2w-btn-primary';
      primary.textContent = 'Nuovo template';
      primary.addEventListener('click', function () {
        if (typeof openTemplateModal === 'function') openTemplateModal();
      });
      const header = UI.createPageHeader({
        title: 'Template Pass',
        description: 'Modelli riutilizzabili per generare i pass delle campagne.',
        actions: primary
      });
      header.id = 'a2wTemplatesPageHeader';
      section.insertBefore(header, section.firstChild);
    }

    if (!document.getElementById('a2wTemplatesToolbar')) {
      const toolbarHost = document.createElement('div');
      toolbarHost.id = 'a2wTemplatesToolbar';
      const toolbar = buildToolbar();
      if (toolbar) toolbarHost.appendChild(toolbar);
      const list = document.getElementById('templatesList');
      if (list) section.insertBefore(toolbarHost, list);
    }

    const list = document.getElementById('templatesList');
    if (list) {
      list.classList.add('a2w-tpl-list-host');
      list.removeAttribute('style');
    }

    section.classList.add('a2w-templates-section');
    A2W.templates.layoutReady = true;
    syncToolbarControls();
  }

  async function a2wLoadTemplatesPage() {
    if (!isA2wTemplatesActive() || !brandId) return false;
    ensureTemplatesPageLayout();
    showTemplatesSkeleton();
    await ensureCampaignCounts();
    try {
      const templates = await fetchCachedJson(API + '/templates?brand_id=' + brandId, {
        headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}
      });
      A2W.templates.cache = Array.isArray(templates) ? templates : [];
      renderTemplatesList();
      return true;
    } catch (err) {
      const el = document.getElementById('templatesList');
      if (el && A2W.UI && typeof A2W.UI.createErrorState === 'function') {
        el.innerHTML = '';
        el.appendChild(A2W.UI.createErrorState({
          title: 'Impossibile caricare i template',
          message: err.message || 'Riprova tra qualche secondo.',
          onRetry: function () { a2wLoadTemplatesPage(); }
        }));
      } else if (el) {
        el.textContent = 'Errore caricamento template';
      }
      return true;
    }
  }

  function initA2wTemplatesPage() {
    if (typeof isA2wDeploy !== 'function' || !isA2wDeploy()) return;
    if (typeof loadTemplates !== 'function') {
      window.setTimeout(initA2wTemplatesPage, 250);
      return;
    }
    if (A2W.templates.hooked) return;
    A2W.templates.hooked = true;

    const original = loadTemplates;
    window.loadTemplates = async function a2wLoadTemplatesWrapped() {
      if (isA2wTemplatesActive()) {
        const handled = await a2wLoadTemplatesPage();
        if (handled) {
          if (typeof a2wDispatchSidebarEvent === 'function') {
            a2wDispatchSidebarEvent('a2w:actions:templates', {});
          }
          return;
        }
      }
      return original.apply(this, arguments);
    };

    A2W.icons = A2W.icons || {};
    A2W.icons.edit = A2W.icons.edit || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

    ensureTemplatesPageLayout();
  }

  A2W.initA2wTemplatesPage = initA2wTemplatesPage;
  A2W.a2wLoadTemplatesPage = a2wLoadTemplatesPage;
  A2W.a2wExportTemplateJson = a2wExportTemplateJson;
  window.initA2wTemplatesPage = initA2wTemplatesPage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA2wTemplatesPage);
  } else {
    initA2wTemplatesPage();
  }
})();
