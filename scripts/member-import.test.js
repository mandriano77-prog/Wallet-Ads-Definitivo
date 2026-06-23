const test = require('node:test');
const assert = require('node:assert/strict');
const { parseImportFile, previewImport } = require('../src/engine/member-import');

test('parseImportFile reads CSV payloads', async () => {
  const csv = 'matricola,nome,cognome,email\n42,Ada,Lovelace,ada@example.com\n';
  const parsed = await parseImportFile({ csv_text: csv });

  assert.deepEqual(parsed.headers, ['matricola', 'nome', 'cognome', 'email']);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0][0], '42');
});

test('previewImport rejects Excel formats in production-safe parser', async () => {
  await assert.rejects(
    () => previewImport({
      filename: 'dipendenti.xlsx',
      file_base64: Buffer.from('not-a-workbook').toString('base64')
    }),
    /Formato non supportato/
  );
});
