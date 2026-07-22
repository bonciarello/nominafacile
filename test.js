/**
 * NominaFacile — Test Suite
 *
 * Carica index.html in JSDOM e verifica la logica di trasformazione
 * simulando interazioni utente.
 *
 * Uso: node test.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'https://github.com/bonciarello/nominafacile/' });

// Wait for scripts to execute
function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  // Allow DOM scripts to run
  await waitFor(100);

  const { window } = dom;
  const { document } = window;

  // Access the exposed API
  const api = window._nominafacile;
  if (!api) {
    console.error('❌ API non esposta. Verifica che window._nominafacile sia definito.');
    process.exit(1);
  }

  const { generateFilename, removeAccents, getExtCategory } = api;

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`  ✗ ${name}`);
      console.log(`    ${e.message}`);
    }
  }

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  function assertEquals(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(`${msg || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
    }
  }

  // ═══════════════════════════════════════
  // Test: removeAccents
  // ═══════════════════════════════════════
  console.log('\n📋 Test: removeAccents');

  test('à → a', () => assertEquals(removeAccents('à'), 'a'));
  test('è → e', () => assertEquals(removeAccents('è'), 'e'));
  test('é → e', () => assertEquals(removeAccents('é'), 'e'));
  test('ì → i', () => assertEquals(removeAccents('ì'), 'i'));
  test('ò → o', () => assertEquals(removeAccents('ò'), 'o'));
  test('ù → u', () => assertEquals(removeAccents('ù'), 'u'));
  test('caffè → caffe', () => assertEquals(removeAccents('caffè'), 'caffe'));
  test('perché → perche', () => assertEquals(removeAccents('perché'), 'perche'));
  test('No accents unchanged', () => assertEquals(removeAccents('ciao mondo'), 'ciao mondo'));
  test('Mixed: città è bella → citta e bella', () => assertEquals(removeAccents('città è bella'), 'citta e bella'));

  // ═══════════════════════════════════════
  // Test: getExtCategory
  // ═══════════════════════════════════════
  console.log('\n📋 Test: getExtCategory');

  test('pdf → pdf', () => assertEquals(getExtCategory('pdf'), 'pdf'));
  test('.pdf → pdf', () => assertEquals(getExtCategory('.pdf'), 'pdf'));
  test('docx → doc', () => assertEquals(getExtCategory('docx'), 'doc'));
  test('xlsx → sheet', () => assertEquals(getExtCategory('xlsx'), 'sheet'));
  test('jpg → image', () => assertEquals(getExtCategory('jpg'), 'image'));
  test('png → image', () => assertEquals(getExtCategory('png'), 'image'));
  test('mp3 → audio', () => assertEquals(getExtCategory('mp3'), 'audio'));
  test('mp4 → video', () => assertEquals(getExtCategory('mp4'), 'video'));
  test('zip → archive', () => assertEquals(getExtCategory('zip'), 'archive'));
  test('html → code', () => assertEquals(getExtCategory('html'), 'code'));
  test('js → code', () => assertEquals(getExtCategory('js'), 'code'));
  test('unknown → empty string', () => assertEquals(getExtCategory('xyz'), ''));
  test('empty → empty string', () => assertEquals(getExtCategory(''), ''));

  // ═══════════════════════════════════════
  // Test: generateFilename
  // ═══════════════════════════════════════
  console.log('\n📋 Test: generateFilename');

  const defaultOpts = {
    separator: '-',
    toLowerCase: true,
    removeAccents: true,
    removeNonAlphanumeric: false,
    maxLength: 0,
    prefix: '',
    suffix: '',
    extension: ''
  };

  // Basic
  test('Simple description with defaults', () => {
    assertEquals(generateFilename('Relazione finale progetto', defaultOpts), 'relazione-finale-progetto');
  });

  test('Empty description returns empty', () => {
    assertEquals(generateFilename('', defaultOpts), '');
    assertEquals(generateFilename('   ', defaultOpts), '');
  });

  test('Single word', () => {
    assertEquals(generateFilename('Documento', defaultOpts), 'documento');
  });

  // Accents
  test('Accents removed', () => {
    assertEquals(generateFilename('città è bella', defaultOpts), 'citta-e-bella');
  });

  test('Accents NOT removed when toggle off', () => {
    const opts = { ...defaultOpts, removeAccents: false, toLowerCase: false };
    assertEquals(generateFilename('città è bella', opts), 'città-è-bella');
  });

  // Lowercase
  test('Lowercase off preserves case', () => {
    const opts = { ...defaultOpts, toLowerCase: false };
    assertEquals(generateFilename('Relazione Finale', opts), 'Relazione-Finale');
  });

  // Separators
  test('Underscore separator', () => {
    const opts = { ...defaultOpts, separator: '_' };
    assertEquals(generateFilename('ciao mondo', opts), 'ciao_mondo');
  });

  test('Dot separator', () => {
    const opts = { ...defaultOpts, separator: '.' };
    assertEquals(generateFilename('ciao mondo', opts), 'ciao.mondo');
  });

  test('No separator (joined words)', () => {
    const opts = { ...defaultOpts, separator: '' };
    assertEquals(generateFilename('ciao mondo bello', opts), 'ciaomondobello');
  });

  // Non-alphanumeric removal
  test('Remove non-alphanumeric', () => {
    const opts = { ...defaultOpts, removeNonAlphanumeric: true };
    assertEquals(generateFilename('file #1 @ important!', opts), 'file-1-important');
  });

  test('Remove non-alphanumeric keeps separator', () => {
    const opts = { ...defaultOpts, removeNonAlphanumeric: true, separator: '_' };
    assertEquals(generateFilename('file #1 @ important!', opts), 'file_1_important');
  });

  test('Remove non-alphanumeric with no separator', () => {
    const opts = { ...defaultOpts, removeNonAlphanumeric: true, separator: '' };
    assertEquals(generateFilename('file #1 @ test', opts), 'file1test');
  });

  // Prefix / Suffix / Extension
  test('Prefix added', () => {
    const opts = { ...defaultOpts, prefix: '2024-' };
    assertEquals(generateFilename('documento', opts), '2024-documento');
  });

  test('Suffix added', () => {
    const opts = { ...defaultOpts, suffix: '-finale' };
    assertEquals(generateFilename('documento', opts), 'documento-finale');
  });

  test('Extension added', () => {
    const opts = { ...defaultOpts, extension: 'pdf' };
    assertEquals(generateFilename('relazione', opts), 'relazione.pdf');
  });

  test('Extension with dot', () => {
    const opts = { ...defaultOpts, extension: '.pdf' };
    assertEquals(generateFilename('relazione', opts), 'relazione.pdf');
  });

  test('Prefix + suffix + extension', () => {
    const opts = { ...defaultOpts, prefix: '2024-', suffix: '-v2', extension: 'pdf' };
    assertEquals(generateFilename('relazione finale', opts), '2024-relazione-finale-v2.pdf');
  });

  // Max length
  test('Max length: truncates long name', () => {
    const opts = { ...defaultOpts, maxLength: 20 };
    const result = generateFilename('questa è una descrizione molto lunga', opts);
    assert(result.length <= 20, `Length ${result.length} > 20`);
  });

  test('Max length: preserves extension', () => {
    const opts = { ...defaultOpts, maxLength: 16, extension: 'pdf' };
    const result = generateFilename('relazione finale progetto', opts);
    assert(result.endsWith('.pdf'), `Result "${result}" doesn't end with .pdf`);
    assert(result.length <= 16, `Length ${result.length} > 16`);
  });

  test('Max length: short enough name is not truncated', () => {
    const opts = { ...defaultOpts, maxLength: 100, extension: 'pdf' };
    assertEquals(generateFilename('breve', opts), 'breve.pdf');
  });

  test('Max length: very short limit keeps extension if possible', () => {
    const opts = { ...defaultOpts, maxLength: 8, extension: 'pdf' };
    const result = generateFilename('relazione', opts);
    assert(result.length <= 8, `Length ${result.length} > 8: "${result}"`);
  });

  // Edge cases
  test('Multiple spaces collapse', () => {
    assertEquals(generateFilename('ciao    mondo   bello', defaultOpts), 'ciao-mondo-bello');
  });

  test('Leading/trailing spaces trimmed', () => {
    assertEquals(generateFilename('  ciao mondo  ', defaultOpts), 'ciao-mondo');
  });

  test('Special Italian characters: àèéìòù', () => {
    assertEquals(generateFilename('caffè tè però sì più giù', defaultOpts), 'caffe-te-pero-si-piu-giu');
  });

  // ═══════════════════════════════════════
  // Test: DOM interactions
  // ═══════════════════════════════════════
  console.log('\n📋 Test: DOM interactions');

  test('Textarea input updates filename', () => {
    const textarea = document.getElementById('description');
    const input = document.getElementById('fileNameInput');

    textarea.value = 'Test descrizione';
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    assertEquals(input.value, 'test-descrizione', 'Filename should update on input');
  });

  test('Separator change updates filename', () => {
    const textarea = document.getElementById('description');
    const underscoreRadio = document.querySelector('input[name="separator"][value="_"]');
    const input = document.getElementById('fileNameInput');

    textarea.value = 'ciao mondo';
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    underscoreRadio.checked = true;
    underscoreRadio.dispatchEvent(new window.Event('change', { bubbles: true }));

    assertEquals(input.value, 'ciao_mondo', 'Filename should use underscore');
  });

  test('Toggle lowercase off updates filename', () => {
    const textarea = document.getElementById('description');
    const toggle = document.getElementById('toggle-lowercase');
    const hyphenRadio = document.querySelector('input[name="separator"][value="-"]');
    const input = document.getElementById('fileNameInput');

    // Reset separator to hyphen
    hyphenRadio.checked = true;
    hyphenRadio.dispatchEvent(new window.Event('change', { bubbles: true }));

    textarea.value = 'Ciao Mondo';
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    toggle.checked = false;
    toggle.dispatchEvent(new window.Event('change', { bubbles: true }));

    assertEquals(input.value, 'Ciao-Mondo', 'Filename should preserve case');
  });

  test('Extension changes badge color attribute', () => {
    const extInput = document.getElementById('extension');
    const badge = document.getElementById('fileBadge');
    const textarea = document.getElementById('description');

    // Set description and extension
    textarea.value = 'test';
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    extInput.value = 'pdf';
    extInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    assertEquals(badge.getAttribute('data-ext-color'), 'pdf', 'Badge should have pdf color');
  });

  test('Copy button enabled when filename exists', () => {
    const textarea = document.getElementById('description');
    const btnCopy = document.getElementById('btnCopy');

    textarea.value = 'test';
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    assert(!btnCopy.disabled, 'Copy button should be enabled');
  });

  test('Copy button disabled when filename empty', () => {
    const textarea = document.getElementById('description');
    const btnCopy = document.getElementById('btnCopy');

    textarea.value = '';
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    assert(btnCopy.disabled, 'Copy button should be disabled');
  });

  // ═══════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  Totale: ${passed + failed} test — ${passed} passati, ${failed} falliti`);
  console.log(`${'═'.repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Errore durante i test:', err);
  process.exit(1);
});
