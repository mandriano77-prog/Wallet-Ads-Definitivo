'use strict';

/**
 * AC-001: HR può creare merchant manualmente via form
 * Build brief §11.1 — Sprint 1 foundation (HUB Convenzioni)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('AC-001: dashboard exposes manual merchant form with required fields', () => {
  const html = read('src/dashboard/index.html');
  assert.match(html, /id="hubMerchantForm"/);
  assert.match(html, /id="hubMerchantName"[^>]*required/);
  assert.match(html, /id="hubMerchantCategory"[^>]*required/);
  assert.match(html, /id="hubMerchantDiscount"[^>]*required/);
  assert.match(html, /name="online_enabled"/);
  assert.match(html, /name="physical_enabled"/);
});

test('AC-001: fd-conventions posts new merchant to POST /merchants', () => {
  const js = read('src/filodiretto/fd-conventions.js');
  assert.match(js, /function saveMerchantForm/);
  assert.match(js, /apiBase\(\) \+ '\/merchants'/);
  assert.match(js, /var method = state\.editingId \? 'PUT' : 'POST'/);
  assert.match(js, /brand_id: bid/);
  assert.match(js, /discount_label/);
});

test('AC-001: API registers POST /merchants with write access and brand scope', () => {
  const api = read('src/api/hub-merchants.js');
  assert.match(api, /router\.post\('\/merchants'/);
  assert.match(api, /requireWriteAccess/);
  assert.match(api, /requireBrandId/);
  assert.match(api, /createMerchant\(req\.body\)/);
});

test('AC-001: db createMerchant enforces required fields', () => {
  const db = read('src/db/index.js');
  assert.match(db, /async function createMerchant/);
  assert.match(db, /brand_id, name, category e discount_label sono obbligatori/);
  assert.match(db, /INSERT INTO merchants/);
});
