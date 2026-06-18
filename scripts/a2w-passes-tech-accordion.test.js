'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(
  path.join(__dirname, '..', 'src/dashboard/index.html'),
  'utf8'
);

test('pass emessi: lista prima della diagnostica wallet in accordion chiuso', () => {
  const passesSection = indexHtml.match(/<div id="passes"[\s\S]*?<\/div>\s*<!-- TEMPLATES -->/);
  assert.ok(passesSection, 'sezione passes mancante');
  const block = passesSection[0];
  const contentIdx = block.indexOf('id="passesContent"');
  const accordionIdx = block.indexOf('id="passWalletTechAccordion"');
  assert.ok(contentIdx >= 0 && accordionIdx >= 0, 'passesContent o accordion mancanti');
  assert.ok(contentIdx < accordionIdx, 'la lista pass deve precedere l accordion tecnico');
  assert.match(block, /Collegamenti tecnici Wallet \(avanzato\)/);
  assert.doesNotMatch(block, /<details[^>]*passWalletTechAccordion[^>]*\sopen/i);
});

test('loadPasses carica diagnostica dopo il contenuto principale', () => {
  assert.match(indexHtml, /async function loadPasses[\s\S]*finally\s*\{[\s\S]*loadPassWalletChannelsDiag\(\)/);
});
