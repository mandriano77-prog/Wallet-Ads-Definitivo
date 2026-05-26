/**
 * Pass Emessi — Ads2Wallet page (dark shell only).
 */
(function () {
  'use strict';

  const A2W = window.A2W = window.A2W || {};
  const URL_KEYS = {
    q: 'pass_q',
    campaign: 'pass_campaign',
    status: 'pass_status',
    from: 'pass_from',
    to: 'pass_to',
    page: 'pass_page'
  };

  let passStatusFilter = 'all';
  let passDateFrom = '';
  let passDateTo = '';
  let passFiltersHydrated = false;
  let a2wPassesLastBrand = null;

  function isA2wPassesActive() {
    return typeof isA2wActive === 'function'
      ? isA2wActive()
      : (typeof isA2wDeploy === 'function' && isA2wDeploy() && document.documentElement.classList.contains('a2w-shell'));
  }

  function readPassUrlState() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has(URL_KEYS.q)) passSearchQuery = params.get(URL_KEYS.q) || '';
      if (params.has(URL_KEYS.campaign)) pendingPassCampaignId = params.get(URL_KEYS.campaign) || '';
      if (params.has(URL_KEYS.status)) passStatusFilter = params.get(URL_KEYS.status) || 'all';
      if (params.has(URL_KEYS.from)) passDateFrom = params.get(URL_KEYS.from) || '';
      if (params.has(URL_KEYS.to)) passDateTo = params.get(URL_KEYS.to) || '';
      if (params.has(URL_KEYS.page)) {
        const pg = parseInt(params.get(URL_KEYS.page), 10);
        passPageIndex = Number.isFinite(pg) && pg >= 0 ? pg : 0;
      }
    } catch (_) {}
  }

  function writePassUrlState() {
    if (!isA2wPassesActive()) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const setOrDel = (key, val) => {
        if (val != null && val !== '' && val !== 'all' && !(key === URL_KEYS.page && val === 0)) {
          params.set(key, String(val));
        } else {
          params.delete(key);
        }
      };
      setOrDel(URL_KEYS.q, (passSearchQuery || '').trim());
      const sel = document.getElementById('a2wPassFilterCampaign');
      const campaignVal = sel ? sel.value : (pendingPassCampaignId || '');
      setOrDel(URL_KEYS.campaign, campaignVal);
      setOrDel(URL_KEYS.status, passStatusFilter === 'all' ? '' : passStatusFilter);
      setOrDel(URL_KEYS.from, passDateFrom);
      setOrDel(URL_KEYS.to, passDateTo);
      setOrDel(URL_KEYS.page, passPageIndex > 0 ? passPageIndex : '');
      const qs = params.toString();
      const next = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        history.replaceState(null, '', next);
      }
    } catch (_) {}
  }

  function a2wPersistPassFilters() {
    writePassUrlState();
    if (typeof persistPassFilters === 'function') persistPassFilters();
  }

  function ensureA2wPassesLayout() {
    const section = document.getElementById('passes');
    if (!section || section.dataset.a2wLayout === '1') return;
    section.dataset.a2wLayout = '1';
    section.classList.add('a2w-passes-page');
    section.querySelectorAll('.a2w-passes-legacy-chrome').forEach((el) => {
      el.classList.add('a2w-passes-legacy-chrome');
      el.hidden = true;
    });
    const hint = document.getElementById('passFilterSessionHint');
    if (hint) {
      hint.classList.add('a2w-passes-legacy-chrome');
      hint.hidden = true;
    }
    const diag = document.getElementById('passWalletChannelsDiag');
    if (diag) {
      diag.classList.add('a2w-passes-legacy-chrome');
      diag.hidden = true;
    }
    const headerRow = section.querySelector('h1.page-title')?.parentElement;
    if (headerRow) {
      headerRow.classList.add('a2w-passes-legacy-chrome');
      headerRow.hidden = true;
    }
  }

  function a2wParseDeviceLabel(ua) {
    if (!ua) return '—';
    if (typeof parseUserAgent !== 'function') return '—';
    const raw = parseUserAgent(ua);
    if (!raw || raw === '-') return '—';
    const slash = raw.indexOf(' / ');
    return slash >= 0 ? raw.slice(0, slash) : raw;
  }

  function a2wPassInstalled(p) {
    return !!(p.device_id || passGoogleSaved(p) || passSamsungSaved(p));
  }

  function a2wPassInstallError(p) {
    if (p.status && p.status !== 'active') return true;
    if (p.push_count > 0 && p.last_push_status && p.last_push_status !== 'delivered') return true;
    return false;
  }

  function a2wInstallBadge(p) {
    if (a2wPassInstallError(p) && !a2wPassInstalled(p)) {
      return '<span class="a2w-passes-badge a2w-passes-badge--error">Errore</span>';
    }
    if (a2wPassInstalled(p)) {
      return '<span class="a2w-passes-badge a2w-passes-badge--installed">Installato</span>';
    }
    return '<span class="a2w-passes-badge a2w-passes-badge--not-installed">Non installato</span>';
  }

  function a2wWalletPills(p) {
    const applePush = !!p.push_token;
    const appleInstalled = p.device_source === 'apple' && !!p.device_id;
    const gOk = passGoogleSaved(p);
    const gPending = passGooglePending(p);
    const sOk = passSamsungSaved(p);
    const sPending = passSamsungPending(p);

    let appleClass = 'a2w-passes-wallet-pill--off';
    let appleLabel = 'Apple';
    if (appleInstalled || applePush) {
      appleClass = 'a2w-passes-wallet-pill--apple-ok';
      appleLabel = applePush ? 'Apple · push' : 'Apple';
    } else if (p.device_id && p.device_source === 'apple') {
      appleClass = 'a2w-passes-wallet-pill--apple-ok';
    }

    let googleClass = 'a2w-passes-wallet-pill--off';
    let googleLabel = 'Google';
    if (gOk) {
      googleClass = 'a2w-passes-wallet-pill--google-ok';
      googleLabel = 'Google · salvato';
    } else if (gPending) {
      googleClass = 'a2w-passes-wallet-pill--pending';
      googleLabel = 'Google · in attesa';
    }

    let samsungClass = 'a2w-passes-wallet-pill--off';
    let samsungLabel = 'Samsung';
    if (sOk) {
      samsungClass = 'a2w-passes-wallet-pill--samsung-ok';
      samsungLabel = 'Samsung · salvato';
    } else if (sPending) {
      samsungClass = 'a2w-passes-wallet-pill--pending';
      samsungLabel = 'Samsung · in attesa';
    }

    return (
      '<span class="a2w-passes-wallet-pills">' +
      `<span class="a2w-passes-wallet-pill ${appleClass}">${esc(appleLabel)}</span>` +
      `<span class="a2w-passes-wallet-pill ${googleClass}">${esc(googleLabel)}</span>` +
      `<span class="a2w-passes-wallet-pill ${samsungClass}">${esc(samsungLabel)}</span>` +
      '</span>'
    );
  }

  function a2wPushBadge(p) {
    if (!p.push_token && !passGoogleSaved(p) && !passSamsungSaved(p)) {
      return '<span class="a2w-passes-badge a2w-passes-badge--push-off">Non disponibile</span>';
    }
    if (p.push_count > 0 && p.last_push_status && p.last_push_status !== 'delivered') {
      return '<span class="a2w-passes-badge a2w-passes-badge--push-error">Errore</span>';
    }
    if (p.push_token || p.push_count > 0) {
      return '<span class="a2w-passes-badge a2w-passes-badge--push-on">Attiva</span>';
    }
    return '<span class="a2w-passes-badge a2w-passes-badge--push-off">Non disponibile</span>';
  }

  function a2wApplyClientFilters(passes) {
    let list = passes.slice();
    const q = (passSearchQuery || '').trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const camp = campaignsCache.find((c) => c.id === p.campaign_id);
        const haystack = [
          p.id, p.serial_number, p.device_id, p.status, p.device_source,
          p.referrer_url, p.user_agent, camp?.name
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    if (passStatusFilter === 'installed') {
      list = list.filter((p) => a2wPassInstalled(p));
    } else if (passStatusFilter === 'not_installed') {
      list = list.filter((p) => !a2wPassInstalled(p));
    } else if (passStatusFilter === 'error') {
      list = list.filter((p) => a2wPassInstallError(p));
    }
    if (passDateFrom) {
      const fromTs = new Date(passDateFrom + 'T00:00:00').getTime();
      if (!Number.isNaN(fromTs)) {
        list = list.filter((p) => p.created_at && new Date(p.created_at).getTime() >= fromTs);
      }
    }
    if (passDateTo) {
      const toTs = new Date(passDateTo + 'T23:59:59').getTime();
      if (!Number.isNaN(toTs)) {
        list = list.filter((p) => p.created_at && new Date(p.created_at).getTime() <= toTs);
      }
    }
    return list;
  }

  function a2wComputeKpis(passes, totalBrand) {
    const installed = passes.filter((p) => a2wPassInstalled(p)).length;
    const pushEnabled = passes.filter((p) => !!p.push_token).length;
    const apple = passes.filter((p) => !!p.push_token || (p.device_source === 'apple' && !!p.device_id)).length;
    const google = passes.filter((p) => passGoogleSaved(p) || passGooglePending(p)).length;
    const samsung = passes.filter((p) => passSamsungSaved(p) || passSamsungPending(p)).length;
    return {
      total: totalBrand != null ? totalBrand : passes.length,
      installed,
      pushEnabled,
      apple,
      google,
      samsung
    };
  }

  function a2wRenderSkeleton() {
    const cols = 8;
    let rows = '';
    for (let i = 0; i < 10; i++) {
      rows += '<tr class="a2w-passes-skeleton-row">';
      for (let c = 0; c < cols; c++) {
        rows += '<td><span class="a2w-skeleton-line"></span></td>';
      }
      rows += '</tr>';
    }
    return (
      '<div class="a2w-passes-table-wrap">' +
      '<table class="a2w-passes-table"><thead><tr>' +
      '<th>Data creazione</th><th>Campagna</th><th>Stato installazione</th><th>Wallet</th>' +
      '<th>Push</th><th>Device</th><th>UTM source</th><th></th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>'
    );
  }

  function a2wSyncCampaignSelect() {
    const sel = document.getElementById('a2wPassFilterCampaign');
    if (!sel) return '';
    const remembered = pendingPassCampaignId;
    const currentVal = sel.value || '';
    if (sel.options.length <= 1 && campaignsCache.length) {
      campaignsCache.forEach((c) => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name;
        sel.appendChild(o);
      });
    }
    pendingPassCampaignId = '';
    if (remembered && [...sel.options].some((opt) => opt.value === remembered)) {
      sel.value = remembered;
    } else if (currentVal && [...sel.options].some((opt) => opt.value === currentVal)) {
      sel.value = currentVal;
    }
    return sel.value || '';
  }

  function a2wBuildToolbar() {
    const UI = window.A2W && window.A2W.UI;
    if (!UI || !UI.createToolbar) return null;

    const search = document.createElement('input');
    search.type = 'search';
    search.id = 'a2wPassSearchInput';
    search.placeholder = 'Cerca serial, device, campagna…';
    search.value = passSearchQuery || '';
    search.addEventListener('input', function () {
      passSearchQuery = search.value || '';
      passPageIndex = 0;
      a2wLoadPasses(false);
    });

    const campaignSel = document.createElement('select');
    campaignSel.id = 'a2wPassFilterCampaign';
    campaignSel.innerHTML = '<option value="">Tutte le campagne</option>';
    campaignSel.addEventListener('change', function () {
      passPageIndex = 0;
      a2wLoadPasses(true);
    });

    const statusSel = document.createElement('select');
    statusSel.id = 'a2wPassFilterStatus';
    statusSel.innerHTML =
      '<option value="all">Tutti gli stati</option>' +
      '<option value="installed">Installati</option>' +
      '<option value="not_installed">Non installati</option>' +
      '<option value="error">Errore</option>';
    statusSel.value = passStatusFilter || 'all';
    statusSel.addEventListener('change', function () {
      passStatusFilter = statusSel.value || 'all';
      passPageIndex = 0;
      a2wLoadPasses(false);
    });

    const fromInput = document.createElement('input');
    fromInput.type = 'date';
    fromInput.id = 'a2wPassFilterFrom';
    fromInput.title = 'Data creazione da';
    fromInput.value = passDateFrom || '';
    fromInput.addEventListener('change', function () {
      passDateFrom = fromInput.value || '';
      passPageIndex = 0;
      a2wLoadPasses(false);
    });

    const toInput = document.createElement('input');
    toInput.type = 'date';
    toInput.id = 'a2wPassFilterTo';
    toInput.title = 'Data creazione a';
    toInput.value = passDateTo || '';
    toInput.addEventListener('change', function () {
      passDateTo = toInput.value || '';
      passPageIndex = 0;
      a2wLoadPasses(false);
    });

    const filters = document.createElement('div');
    filters.className = 'a2w-passes-toolbar-filters';
    filters.appendChild(search);
    filters.appendChild(campaignSel);
    filters.appendChild(statusSel);
    filters.appendChild(fromInput);
    filters.appendChild(toInput);

    return UI.createToolbar({ left: [filters], right: [] });
  }

  function a2wBuildPageHeader(exportDisabled) {
    const UI = window.A2W && window.A2W.UI;
    if (!UI || !UI.createPageHeader || !UI.createActionMenu) return null;

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'btn a2w-btn-primary';
    exportBtn.textContent = 'Esporta CSV';
    exportBtn.disabled = !!exportDisabled;
    exportBtn.addEventListener('click', function () {
      if (typeof downloadPassesTableCsv === 'function') downloadPassesTableCsv();
    });

    const headerMenu = UI.createActionMenu({
      label: 'Azioni pagina Pass Emessi',
      items: [
        {
          label: 'Diagnostica wallet',
          onClick: function () {
            a2wOpenWalletDiagModal();
          }
        }
      ]
    });

    return UI.createPageHeader({
      title: 'Pass Emessi',
      description: 'Tutti i pass generati dalle campagne di questo brand.',
      actions: [exportBtn, headerMenu]
    });
  }

  function a2wBuildKpiRow(kpis) {
    const UI = window.A2W && window.A2W.UI;
    if (!UI || !UI.createStatCard) return null;
    const row = document.createElement('div');
    row.className = 'a2w-passes-kpi-row';
    const cards = [
      { label: 'Pass totali', value: kpis.total, tooltip: 'Numero totale di pass generati per questo brand (da server).' },
      { label: 'Installati Wallet', value: kpis.installed, tooltip: 'Pass salvati in almeno un wallet (Apple, Google o Samsung) nella pagina corrente.' },
      { label: 'Push abilitati', value: kpis.pushEnabled, tooltip: 'Pass con token Apple Push (APNs) registrato — notifiche Apple possibili.' },
      { label: 'Apple', value: kpis.apple, tooltip: 'Pass con installazione Apple o token push registrato.' },
      { label: 'Google', value: kpis.google, tooltip: 'Pass con flusso Google Wallet avviato o salvataggio confermato.' },
      { label: 'Samsung', value: kpis.samsung, tooltip: 'Pass con flusso Samsung Wallet avviato o salvataggio confermato.' }
    ];
    cards.forEach((c) => row.appendChild(UI.createStatCard(c)));
    return row;
  }

  function a2wRenderTableRows(filteredPasses) {
    return filteredPasses.map((p) => {
      const camp = campaignsCache.find((c) => c.id === p.campaign_id);
      const utm = p.utm || {};
      const utmSource = utm.utm_source ? esc(String(utm.utm_source)) : '—';
      const campCell = camp
        ? `<button type="button" class="a2w-passes-campaign-link" onclick="typeof editCampaign==='function'&&editCampaign('${p.campaign_id}')">${esc(camp.name)}</button>`
        : '<span style="opacity:0.45">—</span>';
      const deviceLabel = esc(a2wParseDeviceLabel(p.user_agent));
      const actionsHost = 'a2w-pass-actions-' + p.id.replace(/[^a-z0-9]/gi, '');

      window.setTimeout(function mountPassRowMenu() {
        const host = document.getElementById(actionsHost);
        if (!host || host.dataset.mounted === '1') return;
        const UI = window.A2W && window.A2W.UI;
        if (!UI || !UI.createActionMenu) return;
        host.dataset.mounted = '1';
        const canPush = !!(p.push_token || passGoogleSaved(p) || passSamsungSaved(p));
        const items = [
          { label: 'Dettagli', onClick: function () { viewPassDetail(p.id); } },
          {
            label: 'Reinvia push',
            onClick: function () {
              if (canPush) a2wResendPassPush(p.id);
              else if (typeof toast === 'function') toast('Nessun canale wallet attivo per questo pass');
            }
          },
          {
            label: 'Rimuovi pass',
            destructive: true,
            onClick: function () { deletePassInstance(p.id); }
          }
        ];
        host.appendChild(UI.createActionMenu({ label: 'Azioni pass', items: items }));
      }, 0);

      return (
        '<tr>' +
        `<td>${p.created_at ? esc(new Date(p.created_at).toLocaleDateString('it-IT')) : '—'}</td>` +
        `<td>${campCell}</td>` +
        `<td>${a2wInstallBadge(p)}</td>` +
        `<td>${a2wWalletPills(p)}</td>` +
        `<td>${a2wPushBadge(p)}</td>` +
        `<td class="a2w-passes-device">${deviceLabel}</td>` +
        `<td>${utmSource}</td>` +
        `<td><div id="${actionsHost}"></div></td>` +
        '</tr>'
      );
    }).join('');
  }

  function a2wResetPassFilters() {
    passSearchQuery = '';
    passStatusFilter = 'all';
    passDateFrom = '';
    passDateTo = '';
    passPageIndex = 0;
    pendingPassCampaignId = '';
    const search = document.getElementById('a2wPassSearchInput');
    if (search) search.value = '';
    const camp = document.getElementById('a2wPassFilterCampaign');
    if (camp) camp.value = '';
    const st = document.getElementById('a2wPassFilterStatus');
    if (st) st.value = 'all';
    const from = document.getElementById('a2wPassFilterFrom');
    if (from) from.value = '';
    const to = document.getElementById('a2wPassFilterTo');
    if (to) to.value = '';
    a2wLoadPasses(true);
  }

  async function a2wOpenWalletDiagModal() {
    const modal = document.getElementById('passWalletDiagModal');
    const body = document.getElementById('passWalletDiagModalBody');
    if (!modal || !body) return;
    body.innerHTML = '<p style="color:var(--text2);font-size:13px;">Caricamento diagnostica…</p>';
    modal.classList.add('active');
    if (typeof loadPassWalletChannelsDiag === 'function') {
      await loadPassWalletChannelsDiag('passWalletDiagModalBody');
    }
  }

  async function a2wResendPassPush(passId) {
    const pass = (window._lastPassesForExport || []).find((pp) => pp.id === passId);
    if (!pass) {
      if (typeof toast === 'function') toast('Pass non trovato');
      return;
    }
    if (!pass.push_token && !passGoogleSaved(pass) && !passSamsungSaved(pass)) {
      if (typeof toast === 'function') toast('Nessun canale push attivo per questo pass');
      return;
    }
    const ok = typeof appConfirm === 'function'
      ? await appConfirm({
        title: 'Reinvia push',
        message: 'Inviare una notifica di aggiornamento? Se il pass appartiene a una campagna, l\'invio può includere altri pass della stessa campagna.',
        confirmLabel: 'Invia',
        tone: 'default'
      })
      : confirm('Inviare notifica di aggiornamento?');
    if (!ok) return;

    let channel = 'apple';
    if (passGoogleSaved(pass) && !pass.push_token) channel = 'google';
    else if (passSamsungSaved(pass) && !pass.push_token && !passGoogleSaved(pass)) channel = 'samsung';
    else if (pass.push_token && (passGoogleSaved(pass) || passSamsungSaved(pass))) channel = 'all';

    const body = {
      brand_id: brandId,
      title: 'Aggiornamento pass',
      message: 'Il tuo pass è stato aggiornato.',
      update_pass: true,
      channel: channel
    };
    if (pass.campaign_id) body.campaign_id = pass.campaign_id;

    try {
      const res = await fetch(`${API}/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}) },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || res.statusText);
      if (typeof toast === 'function') toast('Notifica inviata');
      a2wLoadPasses(false);
    } catch (e) {
      if (typeof toast === 'function') toast('Errore push: ' + (e.message || e));
      else alert('Errore push: ' + (e.message || e));
    }
  }

  async function a2wLoadPasses(resetPage) {
    if (!brandId) return;
    ensureA2wPassesLayout();
    if (a2wPassesLastBrand !== brandId) {
      passFiltersHydrated = false;
      a2wPassesLastBrand = brandId;
    }
    if (!passFiltersHydrated) {
      if (typeof ensurePassFiltersFromStorage === 'function') ensurePassFiltersFromStorage();
      readPassUrlState();
      passFiltersHydrated = true;
    }
    if (resetPage) passPageIndex = 0;

    const el = document.getElementById('passesContent');
    if (!el) return;

    const shell = document.createElement('div');
    shell.className = 'a2w-passes-shell';
    shell.appendChild(a2wBuildPageHeader(true) || document.createElement('div'));
    const kpiPlaceholder = document.createElement('div');
    shell.appendChild(kpiPlaceholder);
    shell.appendChild(a2wBuildToolbar() || document.createElement('div'));
    const tableHost = document.createElement('div');
    tableHost.className = 'a2w-passes-table-host';
    tableHost.innerHTML = a2wRenderSkeleton();
    shell.appendChild(tableHost);
    el.innerHTML = '';
    el.appendChild(shell);

    try {
      const campaignFilter = a2wSyncCampaignSelect();
      const effectiveLimit = PASSES_PAGE_SIZE + 1;
      const offset = passPageIndex * PASSES_PAGE_SIZE;
      let url = `${API}/passes?brand_id=${brandId}&limit=${effectiveLimit}&offset=${offset}&include_total=1`;
      if (campaignFilter) url += `&campaign_id=${encodeURIComponent(campaignFilter)}`;

      const res = await fetch(url, { headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : {} });
      if (!res.ok) throw new Error('Errore caricamento pass');
      const payload = await res.json();

      let rawPasses;
      if (Array.isArray(payload)) {
        rawPasses = payload;
        passTotalCount = null;
      } else {
        rawPasses = payload.passes || [];
        passTotalCount = typeof payload.total === 'number' ? payload.total : null;
      }

      if (passTotalCount != null) {
        passHasNextPage = (offset + rawPasses.length) < passTotalCount;
      } else {
        passHasNextPage = rawPasses.length > PASSES_PAGE_SIZE;
      }
      const passes = rawPasses.length > PASSES_PAGE_SIZE ? rawPasses.slice(0, PASSES_PAGE_SIZE) : rawPasses;
      const filteredPasses = a2wApplyClientFilters(passes);
      window._lastPassesForExport = filteredPasses;

      const hasClientFilters =
        (passSearchQuery || '').trim() ||
        passStatusFilter !== 'all' ||
        passDateFrom ||
        passDateTo;

      const exportBtn = shell.querySelector('.a2w-btn-primary');
      if (exportBtn) exportBtn.disabled = !filteredPasses.length;

      kpiPlaceholder.replaceWith(a2wBuildKpiRow(a2wComputeKpis(filteredPasses, passTotalCount)) || document.createElement('div'));

      if (!passes.length && !hasClientFilters) {
        const UI = window.A2W && window.A2W.UI;
        tableHost.innerHTML = '';
        if (UI && UI.createEmptyState) {
          tableHost.appendChild(UI.createEmptyState({
            title: 'Nessun pass emesso',
            description: 'I pass compariranno qui dopo la pubblicazione di una campagna o l\'iscrizione da landing.',
            primaryAction: {
              label: 'Crea una campagna',
              onClick: function () {
                if (typeof nav === 'function') nav('campaigns');
              }
            }
          }));
        } else {
          tableHost.innerHTML = '<p>Nessun pass emesso</p>';
        }
        a2wPersistPassFilters();
        return;
      }

      if (!filteredPasses.length) {
        const UI = window.A2W && window.A2W.UI;
        tableHost.innerHTML = '';
        if (UI && UI.createEmptyState) {
          const empty = UI.createEmptyState({
            title: 'Nessun pass corrisponde ai filtri',
            description: 'Prova ad allargare la ricerca o azzera i filtri per vedere tutti i pass.',
            tertiaryAction: {
              label: 'Azzera filtri',
              onClick: a2wResetPassFilters
            }
          });
          tableHost.appendChild(empty);
        } else {
          tableHost.innerHTML = '<p>Nessun pass corrisponde ai filtri. <button type="button" class="btn small sec" onclick="a2wResetPassFilters()">Azzera filtri</button></p>';
        }
        a2wPersistPassFilters();
        return;
      }

      const pageFrom = passes.length ? offset + 1 : 0;
      const pageTo = offset + passes.length;
      const rowsHtml = a2wRenderTableRows(filteredPasses);

      tableHost.innerHTML =
        '<div class="a2w-passes-table-wrap">' +
        '<table class="a2w-passes-table">' +
        '<thead><tr>' +
        '<th>Data creazione</th><th>Campagna</th><th>Stato installazione</th><th>Wallet</th>' +
        '<th>Push</th><th>Device</th><th>UTM source</th><th aria-label="Azioni"></th>' +
        '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' +
        '<div class="a2w-passes-pagination">' +
        '<div>Pagina ' + (passPageIndex + 1) +
        (passTotalCount != null ? ' · ' + pageFrom + '–' + pageTo + ' di ' + passTotalCount + ' pass' : ' · ' + filteredPasses.length + ' risultati') +
        (passHasNextPage ? ' · <strong style="color:var(--a2w-accent)">Altri pass — Successiva</strong>' : '') +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button type="button" class="btn small sec" onclick="a2wGoPrevPassesPage()" ' + (passPageIndex === 0 ? 'disabled' : '') + '>← Precedente</button>' +
        '<button type="button" class="btn small" onclick="a2wGoNextPassesPage()" ' + (!passHasNextPage ? 'disabled' : '') + '>Successiva →</button>' +
        '</div></div>';

      a2wPersistPassFilters();
    } catch (e) {
      console.error('a2wLoadPasses', e);
      const UI = window.A2W && window.A2W.UI;
      tableHost.innerHTML = '';
      if (UI && UI.createErrorState) {
        tableHost.appendChild(UI.createErrorState({
          title: 'Errore caricamento',
          message: e.message || 'Impossibile caricare i pass'
        }));
      } else {
        tableHost.innerHTML = '<p style="color:var(--danger)">' + esc(e.message || 'Errore') + '</p>';
      }
    }
  }

  function a2wGoPrevPassesPage() {
    if (passPageIndex === 0) return;
    passPageIndex -= 1;
    a2wLoadPasses(false);
  }

  function a2wGoNextPassesPage() {
    if (!passHasNextPage) return;
    passPageIndex += 1;
    a2wLoadPasses(false);
  }

  function initA2wPassesEnhancer() {
    if (typeof isA2wDeploy !== 'function' || !isA2wDeploy()) return;
    if (typeof loadPasses !== 'function' || window.__a2wPassesHooked) return;
    window.__a2wPassesHooked = true;
    const original = loadPasses;
    window.loadPasses = async function a2wLoadPassesWrapped(resetPage) {
      if (isA2wPassesActive()) return a2wLoadPasses(resetPage);
      return original.apply(this, arguments);
    };
    ensureA2wPassesLayout();
  }

  window.a2wLoadPasses = a2wLoadPasses;
  window.a2wResetPassFilters = a2wResetPassFilters;
  window.a2wGoPrevPassesPage = a2wGoPrevPassesPage;
  window.a2wGoNextPassesPage = a2wGoNextPassesPage;
  window.a2wOpenWalletDiagModal = a2wOpenWalletDiagModal;
  window.a2wResendPassPush = a2wResendPassPush;
  A2W.initA2wPassesEnhancer = initA2wPassesEnhancer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA2wPassesEnhancer);
  } else {
    initA2wPassesEnhancer();
  }
})();
