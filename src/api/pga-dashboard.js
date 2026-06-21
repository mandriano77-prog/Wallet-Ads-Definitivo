'use strict';

const {
  getPgaSettings,
  upsertPgaSettings,
  listExperiences,
  getExperience,
  createExperience,
  updateExperience,
  softDeleteExperience,
  listExperienceBookings,
  updateExperienceBookingStatus,
  listCoinActions,
  updateCoinAction,
  getEngagementAnalytics,
  getPassBySerial
} = require('../db');
const { grantCoin } = require('../engine/coins');

function registerPgaDashboardRoutes(router, { requireBrandId, requireOwnedBrandPk, requireWriteAccess }) {
  router.get('/brands/:id/pga-settings', async (req, res) => {
    try {
      if (!requireOwnedBrandPk(req, res, req.params.id)) return;
      res.json(await getPgaSettings(req.params.id));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/brands/:id/pga-settings', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      if (!requireOwnedBrandPk(req, res, req.params.id)) return;
      const settings = await upsertPgaSettings(req.params.id, req.body || {});
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/brands/:id/engagement-analytics', async (req, res) => {
    try {
      if (!requireOwnedBrandPk(req, res, req.params.id)) return;
      const days = parseInt(req.query.days, 10) || 30;
      res.json(await getEngagementAnalytics(req.params.id, days));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/experiences', async (req, res) => {
    try {
      const { brand_id, category, active } = req.query;
      if (!requireBrandId(req, res, brand_id)) return;
      res.json(await listExperiences(brand_id, { category, active }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/experiences', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      const { brand_id } = req.body || {};
      if (!requireBrandId(req, res, brand_id)) return;
      const row = await createExperience(req.body);
      res.status(201).json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/experiences/:id', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      const existing = await getExperience(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Esperienza non trovata' });
      if (!requireBrandId(req, res, existing.brand_id)) return;
      res.json(await updateExperience(req.params.id, existing.brand_id, req.body || {}));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/experiences/:id', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      const existing = await getExperience(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Esperienza non trovata' });
      if (!requireBrandId(req, res, existing.brand_id)) return;
      res.json(await softDeleteExperience(req.params.id, existing.brand_id));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/experiences/:id/bookings', async (req, res) => {
    try {
      const existing = await getExperience(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Esperienza non trovata' });
      if (!requireBrandId(req, res, existing.brand_id)) return;
      const rows = await listExperienceBookings(req.params.id, existing.brand_id, {
        status: req.query.status
      });
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/bookings/:id/status', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      const { brand_id, status } = req.body || {};
      if (!requireBrandId(req, res, brand_id)) return;
      if (!status) return res.status(400).json({ error: 'status richiesto' });
      const row = await updateExperienceBookingStatus(req.params.id, brand_id, status);
      if (!row) return res.status(404).json({ error: 'Booking non trovato' });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/coins/actions', async (req, res) => {
    try {
      const { brand_id } = req.query;
      if (!requireBrandId(req, res, brand_id)) return;
      res.json(await listCoinActions(brand_id));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/coins/actions/:id', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      const { brand_id } = req.body || {};
      if (!requireBrandId(req, res, brand_id)) return;
      const row = await updateCoinAction(req.params.id, brand_id, req.body || {});
      if (!row) return res.status(404).json({ error: 'Regola coin non trovata' });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/coins/manual-grant', async (req, res) => {
    try {
      if (!requireWriteAccess(req, res)) return;
      const { brand_id, pass_serial, coin_amount, description } = req.body || {};
      if (!requireBrandId(req, res, brand_id)) return;
      if (!pass_serial || coin_amount == null) {
        return res.status(400).json({ error: 'pass_serial e coin_amount richiesti' });
      }
      const pass = await getPassBySerial(pass_serial);
      if (!pass || pass.brand_id !== brand_id) {
        return res.status(404).json({ error: 'Pass non trovato per il brand' });
      }
      const amount = parseInt(coin_amount, 10);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'coin_amount deve essere positivo' });
      }
      const out = await grantCoin(brand_id, pass_serial, 'manual_grant', {
        coin_amount: amount,
        description: description || 'Assegnazione manuale HR',
        user_id: pass.member_id || null
      });
      res.status(201).json(out);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { registerPgaDashboardRoutes };
