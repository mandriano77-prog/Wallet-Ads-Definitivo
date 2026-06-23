const test = require('node:test');
const assert = require('node:assert/strict');

const {
  inferPushChannelFromPrompt,
  resolvePushChannel,
  normalizeProposal
} = require('../src/engine/push-assistant');

test('inferPushChannelFromPrompt maps tutti to all', () => {
  assert.equal(inferPushChannelFromPrompt('Programma una push a tutti i dipendenti lunedì alle 10'), 'all');
  assert.equal(inferPushChannelFromPrompt('Mandala su tutti i wallet'), 'all');
  assert.equal(inferPushChannelFromPrompt('Invia a tutti'), 'all');
});

test('resolvePushChannel prefers prompt inference over model apple default', () => {
  assert.equal(
    resolvePushChannel('apple', 'Schedula notifica a tutti i canali domani'),
    'all'
  );
});

test('normalizeProposal applies channel inference from user prompt', () => {
  const proposal = normalizeProposal(
    { channel: 'apple', title: 'Ciao', message: 'Test', schedule_type: 'weekly', days: [1] },
    { name: 'Brand' },
    'Programma push a tutti i wallet ogni lunedì alle 09:00'
  );
  assert.equal(proposal.channel, 'all');
});
