/**
 * Ads2Wallet — Campagne list page (toolbar, cards, empty state).
 * Active only when isA2wDeploy() + a2w-shell (FiloDiretto safe).
 */
(function (global) {
  'use strict';

  const A2W = global.A2W = global.A2W || {};
  const { esc, createEl, appendChildren } = global.A2W.UI.utils;

  const ROCKET_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 16.5c7.5-7.5 11-11 15-12 1 4-4.5 7.5-12 15"/><path d="m12 12 2 2"/><path d="M9 15 6 18"/><path d="M15 9l3-3"/></svg>';
  const TICKET_SVG = '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4Z"/></svg>';

  const state = {
    q: '',
    status: 'all',
    type: 'all',
    sort: 'recent',
    chromeReady: false
  };

  function isEnabled() {
    return typeof isA2wDeploy === 'function' && isA2wDeploy();
  }

  function getApiBase() {
    return typeof API !== 'undefined' ? API : '/api/v1';
  }

  function fetchAuthHeaders() {
    return typeof global.getAuthHeaders === 'function' ? global.getAuthHeaders() : {};
  }

  function toastMsg(msg) {
    if (typeof toast === 'function') toast(msg);
  }

  function readUrlState() {
    try {
      const p = new URLSearchParams(global.location.search);
      state.q = p.get('camp_q') || '';
      state.status = p.get('camp_status') || 'all';
      state.type = p.get('camp_type') || 'all';
      state.sort = p.get('camp_sort') || 'recent';
    } catch (_) {}
  }

  function writeUrlState() {
    if (!isEnabled()) return;
    try {
      const url = new URL(global.location.href);
      const setOrDel = function (key, val, def) {
        if (val && val !== def) url.searchParams.set(key, val);
        else url.searchParams.delete(key);
      };
      setOrDel('camp_q', state.q.trim(), '');
      setOrDel('camp_status', state.status, 'all');
      setOrDel('camp_type', state.type, 'all');
      setOrDel('camp_sort', state.sort, 'recent');
      global.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (_) {}
  }

  function getCampaignStatus(c) {
    const now = Date.now();
    const end = c.end_date ? new Date(c.end_date).getTime() : null;
    if (end && !Number.isNaN(end) && end < now) return 'ended';
    if (!c.active) {
      const dl = Number(c.total_downloads) || 0;
      const ins = Number(c.total_installs) || 0;
      if (!c.start_date && dl === 0 && ins === 0) return 'draft';
      return 'paused';
    }
    return 'active';
  }

  function getCampaignType(c) {
    const med = String(c.utm_medium || '').toLowerCase();
    const camp = String(c.utm_campaign || '').toLowerCase();
    if (med.includes('event') || camp.includes('event')) return 'event';
    if (med.includes('loyalty') || camp.includes('loyalty') || med.includes('loyal')) return 'loyalty';
    if (med.includes('promo') || camp.includes('promo')) return 'promo';
    return 'promo';
  }

  function statusLabel(status) {
    const map = { active: 'Attiva', paused: 'In pausa', ended: 'Terminata', draft: 'Bozza' };
    return map[status] || status;
  }

  function typeLabel(type) {
    const map = { promo: 'Promo', event: 'Evento', loyalty: 'Loyalty' };
    return map[type] || type;
  }

  function typeIcon(type) {
    const icons = A2W.icons || {};
    if (type === 'event') {
      return icons.instantWin || icons.campaigns || ROCKET_SVG;
    }
    if (type === 'loyalty') {
      return icons.pass || icons.campaigns || ROCKET_SVG;
    }
    return ROCKET_SVG;
  }

  function formatConversion(c) {
    const dl = Number(c.total_downloads) || 0;
    const ins = Number(c.total_installs) || 0;
    if (dl <= 0) return '—';
    return Math.round((ins / dl) * 100) + '%';
  }

  function sortCampaigns(list) {
    const copy = list.slice();
    if (state.sort === 'downloads') {
      copy.sort((a, b) => (Number(b.total_downloads) || 0) - (Number(a.total_downloads) || 0));
    } else if (state.sort === 'az') {
      copy.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'it', { sensitivity: 'base' }));
    } else {
      copy.sort((a, b) => {
        const ta = new Date(a.updated_at || a.created_at || 0).getTime();
        const tb = new Date(b.updated_at || b.created_at || 0).getTime();
        return tb - ta;
      });
    }
    return copy;
  }

  function filterCampaigns(list) {
    const q = state.q.trim().toLowerCase();
    return list.filter((c) => {
      const status = getCampaignStatus(c);
      if (state.status !== 'all' && status !== state.status) return false;
      const type = getCampaignType(c);
      if (state.type !== 'all' && type !== state.type) return false;
      if (q && !String(c.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderSkeleton() {
    const el = document.getElementById('campaignsList');
    if (!el) return;
    let html = '<div class="a2w-campaigns-skeleton-grid">';
    for (let i = 0; i < 3; i++) {
      html += [
        '<div class="a2w-campaigns-skeleton-card a2w-skeleton">',
        '  <div class="a2w-skeleton a2w-campaigns-skeleton-line a2w-campaigns-skeleton-line--title"></div>',
        '  <div class="a2w-skeleton a2w-campaigns-skeleton-line"></div>',
        '  <div class="a2w-skeleton a2w-campaigns-skeleton-line a2w-campaigns-skeleton-line--short"></div>',
        '</div>'
      ].join('');
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function ensureChrome() {
    if (state.chromeReady) return;
    const section = document.getElementById('campaigns');
    const chromeHost = document.getElementById('a2wCampaignsChrome');
    if (!section || !chromeHost) return;

    const legacyHeader = section.querySelector('.a2w-campaigns-legacy-header');
    if (legacyHeader) legacyHeader.hidden = true;

    const primaryBtn = createEl('button', 'btn a2w-btn-primary', { type: 'button' });
    primaryBtn.innerHTML = ROCKET_SVG + ' <span>Nuova campagna</span>';
    primaryBtn.addEventListener('click', function () {
      if (typeof openCampaignModal === 'function') openCampaignModal();
    });

    const header = global.A2W.UI.createPageHeader({
      title: 'Campagne',
      description: 'Crea e gestisci le campagne che generano pass per il tuo brand.',
      actions: primaryBtn
    });

    const search = createEl('input', 'a2w-campaigns-search', {
      type: 'search',
      placeholder: 'Cerca per nome…',
      'aria-label': 'Cerca campagne per nome'
    });
    search.value = state.q;

    const statusSel = buildSelect('Stato', [
      ['all', 'Tutte'],
      ['active', 'Attive'],
      ['paused', 'In pausa'],
      ['ended', 'Terminate'],
      ['draft', 'Bozze']
    ], state.status, 'camp_status');

    const typeSel = buildSelect('Tipo', [
      ['all', 'Tutti i tipi'],
      ['promo', 'Promo'],
      ['event', 'Evento'],
      ['loyalty', 'Loyalty']
    ], state.type, 'camp_type');

    const sortSel = buildSelect('Ordina', [
      ['recent', 'Più recenti'],
      ['downloads', 'Più download'],
      ['az', 'A–Z']
    ], state.sort, 'camp_sort');

    const toolbar = global.A2W.UI.createToolbar({
      left: [search, statusSel, typeSel],
      right: [sortSel]
    });
    toolbar.classList.add('a2w-campaigns-toolbar');

    search.addEventListener('input', function () {
      state.q = search.value;
      writeUrlState();
      renderList(global.campaignsCache || []);
    });

    statusSel.addEventListener('change', function () {
      state.status = statusSel.value;
      writeUrlState();
      renderList(global.campaignsCache || []);
    });

    typeSel.addEventListener('change', function () {
      state.type = typeSel.value;
      writeUrlState();
      renderList(global.campaignsCache || []);
    });

    sortSel.addEventListener('change', function () {
      state.sort = sortSel.value;
      writeUrlState();
      renderList(global.campaignsCache || []);
    });

    chromeHost.innerHTML = '';
    chromeHost.appendChild(header);
    chromeHost.appendChild(toolbar);
    state.chromeReady = true;
  }

  function buildSelect(ariaLabel, options, value, id) {
    const sel = createEl('select', 'a2w-campaigns-select', { id: id, 'aria-label': ariaLabel });
    options.forEach(([val, label]) => {
      sel.appendChild(createEl('option', '', { value: val, text: label }));
    });
    sel.value = value;
    return sel;
  }

  function buildMetaChips(c) {
    const chips = [];
    const icons = A2W.icons || {};
    if (c.utm_source) {
      chips.push(chipHtml(icons.tag, 'src ' + esc(c.utm_source)));
    }
    if (c.utm_medium) {
      chips.push(chipHtml(icons.tag, 'med ' + esc(c.utm_medium)));
    }
    return chips.join('');
  }

  function chipHtml(icon, label) {
    return '<span class="a2w-chip" data-a2w-component="chip"><span class="a2w-chip__icon">' + (icon || '') + '</span><span class="a2w-chip__label">' + label + '</span></span>';
  }

  function buildActionMenu(c) {
    const status = getCampaignStatus(c);
    const isPaused = status === 'paused' || status === 'draft';
    const toggleLabel = c.active ? 'Pausa' : 'Riattiva';
    const toggleIcon = c.active ? (A2W.icons.pause || '') : (A2W.icons.play || '');
    const id = c.id;

    return global.A2W.UI.createActionMenu({
      label: 'Azioni campagna ' + (c.name || ''),
      items: [
        {
          icon: toggleIcon,
          label: toggleLabel,
          onClick: function () {
            if (typeof toggleCampaign === 'function') toggleCampaign(id, !c.active);
          }
        },
        {
          icon: A2W.icons.copy,
          label: 'Duplica',
          onClick: function () {
            if (typeof A2W.duplicateCampaignFromId === 'function') {
              A2W.duplicateCampaignFromId(id);
            }
          }
        },
        {
          icon: A2W.icons.qr,
          label: 'QR code',
          onClick: function () {
            if (typeof showCampaignQR === 'function') showCampaignQR(id);
          }
        },
        {
          icon: A2W.icons.link,
          label: 'Copia link',
          onClick: function () {
            if (typeof copyCampaignDirect === 'function') copyCampaignDirect(id);
          }
        },
        {
          icon: A2W.icons.download,
          label: 'Esporta dati',
          onClick: function () { toastMsg('Esportazione dati: in arrivo'); }
        },
        {
          icon: A2W.icons.tag,
          label: 'Archivia',
          onClick: function () { toastMsg('Archiviazione: in arrivo'); }
        },
        {
          icon: A2W.icons.delete,
          label: 'Elimina',
          destructive: true,
          onClick: function () {
            if (typeof deleteCampaign === 'function') deleteCampaign(id);
          }
        }
      ]
    });
  }

  function renderCard(c) {
    const status = getCampaignStatus(c);
    const type = getCampaignType(c);
    const dl = Number(c.total_downloads) || 0;
    const ins = Number(c.total_installs) || 0;
    const conv = formatConversion(c);
    const metaChips = buildMetaChips(c);

    const card = createEl('div', 'card a2w-campaign-card', {
      'data-campaign-id': c.id,
      'data-a2w-campaign-v2': '1'
    });

    const row = createEl('div', 'a2w-campaign-card__row card-row');
    const iconWrap = createEl('div', 'a2w-campaign-card__icon card-icon');
    iconWrap.innerHTML = typeIcon(type);

    const main = createEl('div', 'a2w-campaign-card__body card-info');
    const titleRow = createEl('div', 'a2w-campaign-card__title-row');
    titleRow.appendChild(createEl('div', 'card-title a2w-campaign-card__title', { text: c.name || '' }));
    titleRow.appendChild(createEl('span', 'a2w-campaign-status a2w-campaign-status--' + status, { text: statusLabel(status) }));
    main.appendChild(titleRow);

    if (c.description) {
      main.appendChild(createEl('div', 'card-desc a2w-campaign-card__desc', { text: c.description }));
    }

    const metrics = createEl('div', 'a2w-campaign-card__metrics');
    metrics.innerHTML = 'Download <strong>' + dl + '</strong> · Install <strong>' + ins + '</strong> · Conversione <strong>' + conv + '</strong>';
    main.appendChild(metrics);

    const typeChip = createEl('span', 'a2w-campaign-type-chip', { text: typeLabel(type) });
    main.appendChild(typeChip);

    if (metaChips) {
      const meta = createEl('div', 'card-meta a2w-chip-row');
      meta.dataset.a2wEnhanced = '1';
      meta.innerHTML = metaChips;
      main.appendChild(meta);
    }

    const actions = createEl('div', 'card-actions a2w-row-actions');
    actions.setAttribute('data-a2w-component', 'campaign-actions');
    const editBtn = createEl('button', 'btn a2w-btn-primary a2w-row-primary-btn', { type: 'button', text: 'Modifica' });
    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (typeof editCampaign === 'function') editCampaign(c.id);
    });
    actions.appendChild(editBtn);
    actions.appendChild(buildActionMenu(c));

    row.appendChild(iconWrap);
    row.appendChild(main);
    row.appendChild(actions);
    card.appendChild(row);

    card.addEventListener('click', function (e) {
      if (e.target.closest('.card-actions, [data-a2w-dropdown-root], button, a')) return;
      // TODO: nav('campaign-detail') + campaignDetailId when detail route exists
      if (typeof editCampaign === 'function') editCampaign(c.id);
    });

    return card;
  }

  function renderEmptyFiltered() {
    const el = document.getElementById('campaignsList');
    if (!el) return;
    el.innerHTML = '';
    el.appendChild(global.A2W.UI.createEmptyState({
      icon: TICKET_SVG,
      title: 'Nessun risultato',
      description: 'Prova a cambiare ricerca o filtri.',
      primaryAction: {
        label: 'Reimposta filtri',
        onClick: function () {
          state.q = '';
          state.status = 'all';
          state.type = 'all';
          state.sort = 'recent';
          writeUrlState();
          const search = document.querySelector('.a2w-campaigns-search');
          if (search) search.value = '';
          ['camp_status', 'camp_type', 'camp_sort'].forEach((id) => {
            const sel = document.getElementById(id);
            if (sel) sel.value = id === 'camp_sort' ? 'recent' : 'all';
          });
          renderList(global.campaignsCache || []);
        }
      }
    }));
  }

  function renderEmptyGlobal() {
    const el = document.getElementById('campaignsList');
    if (!el) return;
    el.innerHTML = '';
    el.appendChild(global.A2W.UI.createEmptyState({
      icon: TICKET_SVG,
      title: 'Nessuna campagna',
      description: 'Crea la prima campagna per generare pass e tracciare download e installazioni.',
      primaryAction: {
        label: 'Crea la prima campagna',
        onClick: function () {
          if (typeof openCampaignModal === 'function') openCampaignModal();
        }
      },
      tertiaryAction: {
        label: 'Importa template esempio',
        onClick: function () { toastMsg('Import template: in arrivo'); }
      }
    }));
  }

  function renderList(cache) {
    const el = document.getElementById('campaignsList');
    if (!el) return;
    const all = Array.isArray(cache) ? cache : [];
    if (!all.length) {
      renderEmptyGlobal();
      return;
    }
    const filtered = filterCampaigns(sortCampaigns(all));
    if (!filtered.length) {
      renderEmptyFiltered();
      return;
    }
    el.innerHTML = '';
    const grid = createEl('div', 'a2w-campaigns-grid');
    filtered.forEach((c) => grid.appendChild(renderCard(c)));
    el.appendChild(grid);
  }

  async function load() {
    if (!isEnabled() || !global.brandId) return;
    readUrlState();
    ensureChrome();
    renderSkeleton();
    try {
      const fetchFn = typeof fetchCachedJson === 'function' ? fetchCachedJson : fetch;
      const data = await fetchFn(getApiBase() + '/campaigns?brand_id=' + global.brandId, {
        headers: { ...fetchAuthHeaders() }
      });
      global.campaignsCache = Array.isArray(data) ? data : (await data.json());
    } catch (e) {
      console.error('loadCampaigns:', e);
      const el = document.getElementById('campaignsList');
      if (el) el.innerHTML = '<p class="a2w-campaigns-error">Errore caricamento campagne.</p>';
      return;
    }
    renderList(global.campaignsCache || []);
  }

  function init() {
    if (!isEnabled()) return;
    readUrlState();
    document.addEventListener('DOMContentLoaded', function () {
      if (global.brandId && document.getElementById('campaigns')?.classList.contains('active')) {
        ensureChrome();
      }
    });
  }

  A2W.campaigns = {
    isEnabled: isEnabled,
    load: load,
    renderList: renderList,
    getCampaignStatus: getCampaignStatus,
    getCampaignType: getCampaignType
  };

  init();
})(typeof window !== 'undefined' ? window : global);
