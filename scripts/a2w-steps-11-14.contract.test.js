'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'src/dashboard/index.html'), 'utf8');
const pushUx = fs.readFileSync(path.join(root, 'src/dashboard/js/a2w-push-ux.js'), 'utf8');
const pushCss = fs.readFileSync(path.join(root, 'src/dashboard/styles/a2w-push.css'), 'utf8');

test('STEP 11: empty state Contatti promette campagna, non landing', () => {
  assert.match(indexHtml, /Crea la prima campagna/);
  assert.doesNotMatch(indexHtml, /Crea la prima landing/);
  assert.match(indexHtml, /openA2wContactsPrimaryLanding\(\)/);
});

test('STEP 11: modale campagna ha azione primaria e secondaria distinte', () => {
  const block = indexHtml.match(/a2w-campaign-modal-actions[\s\S]{0,900}/)?.[0] || '';
  assert.match(block, /a2w-campaign-modal-actions__primary/);
  assert.match(block, /a2w-btn-primary[\s\S]*saveCampaign\(false\)/);
  assert.match(block, /btn sec[\s\S]*saveCampaign\(true\)/);
  assert.match(block, /a2w-campaign-modal-actions__hint/);
});

test('STEP 12: push A2W ha anteprima, contatori e conferma invio', () => {
  assert.match(indexHtml, /a2w-push-ux\.js/);
  assert.match(pushUx, /a2wPushPreview/);
  assert.match(pushUx, /TITLE_MAX = 50/);
  assert.match(pushUx, /MESSAGE_MAX = 178/);
  assert.match(pushUx, /a2wPushConfirmModal/);
  assert.match(pushUx, /wirePushSendConfirm/);
  assert.match(pushCss, /a2w-push-preview/);
  assert.match(pushCss, /a2w-push-char-count--over/);
});

test('STEP 13: Reward e Challenge hanno empty host curati', () => {
  assert.match(indexHtml, /id="iwEmptyHost"/);
  assert.match(indexHtml, /id="gamEmptyHost"/);
  assert.match(indexHtml, /function renderA2wSectionEmptyState/);
  assert.match(indexHtml, /function isA2wEngagementEmptyActive/);
});

test('STEP 14: microcopy Reward/Challenge per product line', () => {
  assert.match(indexHtml, /reward_page_blurb/);
  assert.match(indexHtml, /challenge_page_blurb/);
  assert.match(indexHtml, /data-menu-key="reward_page_blurb"/);
  assert.match(indexHtml, /data-menu-key="challenge_page_blurb"/);
  const hrBlock = indexHtml.match(/PRODUCT_MENU_COPY = \{[\s\S]{0,3500}/)?.[0] || '';
  assert.match(hrBlock, /reward_page_blurb:[\s\S]*dipendenti/);
  const defaults = indexHtml.match(/PRODUCT_MENU_DEFAULTS = \{[\s\S]{0,1800}/)?.[0] || '';
  const adsRewardBlurb = defaults.match(/reward_page_blurb:\s*'[^']+'/)?.[0] || '';
  assert.match(adsRewardBlurb, /possessori del pass/);
  assert.doesNotMatch(adsRewardBlurb, /dipendenti/);
});
