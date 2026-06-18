/**
 * Ads2Wallet — setup checklist controller (welcome dashboard for new brands).
 */
(function () {
  'use strict';

  const A2W = window.A2W = window.A2W || {};
  A2W.setupChecklist = A2W.setupChecklist || {
    loaded: false,
    isNewBrand: false,
    ctx: null
  };

  const STEP_DEFS = [
    {
      id: 'identity',
      label: 'Configura identità brand',
      description: 'Nome, slug, logo e contatti pubblici del brand.',
      section: 'brand-identity',
      action: null,
      actionLabel: 'Apri identità',
      done: function (ctx) { return !!ctx.brandIdentityComplete; }
    },
    {
      id: 'template',
      label: 'Crea un template pass',
      description: 'Definisci design e campi del pass Wallet.',
      section: 'templates',
      action: null,
      actionLabel: 'Vai ai template',
      done: function (ctx) { return ctx.templateCount > 0; }
    },
    {
      id: 'landing',
      label: 'Pubblica una landing page',
      description: 'Crea una campagna con pagina pubblica e link al pass.',
      section: null,
      action: 'openCampaignModal',
      actionLabel: 'Crea landing',
      done: function (ctx) { return ctx.campaignCount > 0; }
    },
    {
      id: 'contacts',
      label: 'Raccogli i primi contatti',
      description: 'Iscrizioni da landing o aggiunta manuale in rubrica.',
      section: 'leads',
      action: null,
      actionLabel: 'Apri contatti',
      done: function (ctx) { return ctx.contactCount > 0; }
    }
  ];

  function isA2wSetupChecklistEnabled() {
    if (typeof window.isA2wDeploy === 'function' && !window.isA2wDeploy()) return false;
    if (!document.documentElement.classList.contains('a2w-shell')) return false;
    if (document.documentElement.getAttribute('data-shell') !== 'dark') return false;
    if (typeof window.isHrDashboard === 'function' && window.isHrDashboard()) return false;
    return true;
  }

  function getBrandId() {
    try {
      if (window.brandId) return String(window.brandId);
    } catch (_) {}
    const sel = document.getElementById('brandSelector');
    if (sel && sel.value) return String(sel.value);
    return null;
  }

  function authHeaders() {
    if (typeof window.getAuthHeaders === 'function') return window.getAuthHeaders();
    return {};
  }

  function brandIdentityComplete(brand) {
    if (!brand || !brand.name || !brand.slug) return false;
    const c = brand.config || {};
    if (c.brand_identity_last_saved_at) return true;
    const assets = c.brand_identity_assets || {};
    if (assets.logo || assets.wallet_icon) return true;
    const support = c.support || {};
    if (c.homepage || c.tagline || support.email || support.phone) return true;
    if (brand.dpo_email || brand.hr_email) return true;
    return false;
  }

  function fetchJsonFresh(url) {
    return fetch(url, { headers: authHeaders() }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    });
  }

  async function fetchSetupContext(bid) {
    const api = typeof window.API === 'string' ? window.API : '/api/v1';
    const results = await Promise.all([
      fetchJsonFresh(api + '/analytics/' + encodeURIComponent(bid)).catch(function () { return {}; }),
      (typeof window.fetchBrandById === 'function'
        ? window.fetchBrandById(bid)
        : fetchJsonFresh(api + '/brands/' + encodeURIComponent(bid))).catch(function () { return null; }),
      fetchJsonFresh(api + '/templates?brand_id=' + encodeURIComponent(bid)).catch(function () { return []; }),
      fetchJsonFresh(api + '/brands/' + encodeURIComponent(bid) + '/leads').catch(function () { return { leads: [] }; }),
      fetchJsonFresh(api + '/campaigns?brand_id=' + encodeURIComponent(bid)).catch(function () { return []; })
    ]);

    const analytics = results[0] || {};
    const brand = results[1];
    const templates = Array.isArray(results[2]) ? results[2] : [];
    const leadsPayload = results[3] || {};
    const campaigns = Array.isArray(results[4]) ? results[4] : [];
    const leads = Array.isArray(leadsPayload.leads) ? leadsPayload.leads : [];

    return {
      passCount: Number(analytics.totalPasses || 0),
      contactCount: leads.length,
      campaignCount: campaigns.length,
      templateCount: templates.length,
      brandIdentityComplete: brandIdentityComplete(brand)
    };
  }

  function buildSteps(ctx) {
    return STEP_DEFS.map(function (def) {
      return {
        id: def.id,
        label: def.label,
        description: def.description,
        done: def.done(ctx),
        actionLabel: def.actionLabel,
        section: def.section,
        action: def.action
      };
    });
  }

  function handleStepClick(stepId) {
    const def = STEP_DEFS.find(function (s) { return s.id === stepId; });
    if (!def) return;
    if (def.action === 'openCampaignModal' && typeof window.openCampaignModal === 'function') {
      window.openCampaignModal();
      return;
    }
    if (def.section && typeof window.nav === 'function') window.nav(def.section);
  }

  function ensureMount() {
    const welcome = document.getElementById('welcome');
    if (!welcome) return null;
    let root = document.getElementById('a2wSetupChecklistRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'a2wSetupChecklistRoot';
      root.className = 'a2w-setup-checklist-root';
      const lead = welcome.querySelector('.page-lead');
      if (lead && lead.parentNode) lead.parentNode.insertBefore(root, lead.nextSibling);
      else welcome.appendChild(root);
    }
    return root;
  }

  function setWelcomeSetupMode(active) {
    const welcome = document.getElementById('welcome');
    if (!welcome) return;
    welcome.classList.toggle('a2w-welcome--setup', !!active);
  }

  function renderChecklist(root, ctx) {
    if (!root || !A2W.UI || typeof A2W.UI.createSetupChecklist !== 'function') return;
    const steps = buildSteps(ctx);
    const doneCount = steps.filter(function (s) { return s.done; }).length;
    root.innerHTML = '';
    root.hidden = false;
    root.appendChild(A2W.UI.createSetupChecklist({
      title: 'Setup guidato',
      intro: 'Completa questi passaggi per pubblicare il tuo primo pass Wallet e iniziare a raccogliere contatti.',
      progressLabel: doneCount + ' di ' + steps.length + ' completati',
      steps: steps,
      onStepClick: handleStepClick
    }));
    setWelcomeSetupMode(true);
  }

  function hideChecklist(root) {
    if (root) {
      root.hidden = true;
      root.innerHTML = '';
    }
    setWelcomeSetupMode(false);
  }

  async function refreshA2wSetupState(bid) {
    const state = A2W.setupChecklist;
    if (!isA2wSetupChecklistEnabled() || !bid) {
      state.loaded = true;
      state.isNewBrand = false;
      state.ctx = null;
      return state;
    }
    try {
      state.ctx = await fetchSetupContext(bid);
      state.isNewBrand = state.ctx.passCount === 0
        && state.ctx.contactCount === 0
        && state.ctx.campaignCount === 0;
    } catch (_) {
      state.ctx = null;
      state.isNewBrand = false;
    }
    state.loaded = true;
    return state;
  }

  function isA2wSetupHome() {
    return isA2wSetupChecklistEnabled()
      && !!getBrandId()
      && !!A2W.setupChecklist.isNewBrand;
  }

  var loadInflight = null;

  async function loadA2wSetupChecklist() {
    if (!isA2wSetupChecklistEnabled()) {
      hideChecklist(ensureMount());
      return;
    }
    if (loadInflight) return loadInflight;

    loadInflight = (async function () {
      const root = ensureMount();
      const bid = getBrandId();
      if (!root || !bid) {
        hideChecklist(root);
        A2W.setupChecklist.isNewBrand = false;
        A2W.setupChecklist.loaded = true;
        return;
      }

      await refreshA2wSetupState(bid);
      if (!A2W.setupChecklist.isNewBrand) {
        hideChecklist(root);
        return;
      }
      renderChecklist(root, A2W.setupChecklist.ctx || {});
    })().finally(function () {
      loadInflight = null;
    });

    return loadInflight;
  }

  window.refreshA2wSetupState = refreshA2wSetupState;
  window.loadA2wSetupChecklist = loadA2wSetupChecklist;
  window.isA2wSetupHome = isA2wSetupHome;
  A2W.refreshA2wSetupState = refreshA2wSetupState;
  A2W.loadA2wSetupChecklist = loadA2wSetupChecklist;
  A2W.isA2wSetupHome = isA2wSetupHome;
})();
