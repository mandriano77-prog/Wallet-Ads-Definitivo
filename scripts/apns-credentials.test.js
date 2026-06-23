const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPemCredential } = require('../src/engine/apns');

test('loadPemCredential reads base64 env fallback when file is absent', () => {
  const previous = process.env.TEST_SIGNER_CERT_BASE64;
  process.env.TEST_SIGNER_CERT_BASE64 = Buffer.from('pem-content').toString('base64');
  try {
    const value = loadPemCredential({
      filePath: '/tmp/does-not-exist-wallet-ads.pem',
      envName: 'TEST_SIGNER_CERT_BASE64'
    });
    assert.equal(value.toString('utf8'), 'pem-content');
  } finally {
    if (previous === undefined) delete process.env.TEST_SIGNER_CERT_BASE64;
    else process.env.TEST_SIGNER_CERT_BASE64 = previous;
  }
});
