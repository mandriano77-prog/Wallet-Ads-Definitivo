'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const chrome = fs.readFileSync(path.join(root, 'src/dashboard/styles/a2w-chrome.css'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'src/dashboard/js/a2w-shell.js'), 'utf8');
const sidebar = fs.readFileSync(path.join(root, 'src/dashboard/js/components/sidebar.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'src/dashboard/index.html'), 'utf8');

test('breakpoint mobile allineato a 767px in shell e sidebar.js', () => {
  assert.match(shell, /A2W_SIDEBAR_MOBILE_BREAKPOINT = '\(max-width: 767px\)'/);
  assert.match(sidebar, /MOBILE_MQ = '\(max-width: 767px\)'/);
});

test('drawer mobile: hamburger, overlay, sidebar off-canvas', () => {
  assert.match(chrome, /@media \(max-width: 767px\)[\s\S]*\.sidebar-toggle[\s\S]*display:\s*inline-flex/);
  assert.match(chrome, /body\.sidebar-open \.sidebar-backdrop[\s\S]*display:\s*block/);
  assert.match(chrome, /translateX\(-100%\)/);
  assert.match(chrome, /body\.sidebar-open[\s\S]*translateX\(0\)/);
  assert.match(chrome, /grid-template-columns:\s*1fr !important/);
});

test('desktop mantiene sidebar in grid (nessun drawer sotto 768px nel CSS)', () => {
  assert.match(chrome, /@media \(min-width: 768px\)/);
  assert.match(chrome, /grid-template-columns: var\(--a2w-sidebar-expanded-w\) 1fr/);
});

test('index.html non nasconde sidebar A2W su mobile', () => {
  assert.match(indexHtml, /html:not\(\.a2w-shell\) \.sidebar \{ display: none; \}/);
  assert.doesNotMatch(indexHtml, /@media \(max-width: 767px\)[\s\S]*?^\s+\.sidebar \{ display: none; \}/m);
});

test('sidebar.js chiude drawer su resize desktop e tap backdrop', () => {
  assert.match(sidebar, /backdrop\.addEventListener\('click', closeDrawer\)/);
  assert.match(sidebar, /addEventListener\('change'/);
  assert.match(sidebar, /document\.body\.style\.overflow/);
});
