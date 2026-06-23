'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPushHelpers() {
  const html = fs.readFileSync(path.join(__dirname, '../src/dashboard/index.html'), 'utf8');
  const start = html.indexOf('const PUSH_SEND_TIMEOUT_MS');
  const end = html.indexOf('async function sendImmediatePush()');
  const block = html.slice(start, end);
  const g = {
    document: {
      getElementById(id) {
        return g._els[id] || null;
      }
    },
    _els: {
      pushTitleError: { textContent: '' },
      pushMessageError: { textContent: '' },
      pushSendError: { textContent: '', hidden: true },
      pushSendBtn: { disabled: false, innerHTML: 'Send', dataset: {} }
    }
  };
  ['pushTitle', 'pushMessage'].forEach((id) => {
    g._els[id] = { value: '', setAttribute() {} };
  });
  vm.runInNewContext(block, g, { filename: 'push-helpers.js' });
  return g;
}

test('setPushFieldError writes inline validation message', () => {
  const g = loadPushHelpers();
  g.setPushFieldError('pushTitle', 'Inserisci un titolo per la notifica');
  assert.equal(g._els.pushTitleError.textContent, 'Inserisci un titolo per la notifica');
});

test('setPushSendLoading restores button label', () => {
  const g = loadPushHelpers();
  g.setPushSendLoading(true);
  assert.equal(g._els.pushSendBtn.disabled, true);
  g.setPushSendLoading(false);
  assert.equal(g._els.pushSendBtn.disabled, false);
});

function loadPushLinkedContentHelpers() {
  const html = fs.readFileSync(path.join(__dirname, '../src/dashboard/index.html'), 'utf8');
  const start = html.indexOf('function parsePushLinkedContent(raw)');
  const end = html.indexOf('async function loadPushLinkedContentSelect()');
  const block = html.slice(start, end);
  const g = {
    currentBrandSlug: 'acme',
    window: { pushMerchantsById: {}, location: { hostname: 'studio.test', origin: 'https://studio.test' } }
  };
  vm.runInNewContext(block, g, { filename: 'push-linked-content.js' });
  return g;
}

test('parsePushLinkedContent maps reward, challenge and convention kinds', () => {
  const g = loadPushLinkedContentHelpers();
  assert.equal(g.parsePushLinkedContent('reward:12').instant_win_id, '12');
  assert.equal(g.parsePushLinkedContent('challenge:34').gamification_id, '34');
  assert.equal(g.parsePushLinkedContent('convention:56').convention_id, '56');
  assert.equal(Object.keys(g.parsePushLinkedContent('')).length, 0);
});

test('applyPushLinkedContentToBody maps convention to pass link fields', () => {
  const g = loadPushLinkedContentHelpers();
  Object.assign(g.window.pushMerchantsById, {
    m1: { id: 'm1', name: 'Farmacia Rossi', online_enabled: true, online_url: 'https://example.com/offerta' }
  });
  g.body = {};
  g.applyPushLinkedContentToBody(g.body, 'convention:m1');
  assert.equal(g.body.include_pass_link, true);
  assert.equal(g.body.pass_link_url, 'https://example.com/offerta');
  assert.equal(g.body.pass_link_label, 'Farmacia Rossi');
});
