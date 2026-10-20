
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('all gallery controls are present and the utility loads before the app script', function () {
    assert.match(html, /id="gallerySearch"/);
    assert.match(html, /id="gallerySort"/);
    assert.match(html, /data-filter="favorites"/);
    assert.match(html, /id="galleryStatus"[^>]*aria-live="polite"/);
    assert.match(html, /id="emptyState"/);
    assert.match(html, /id="lightboxShare"/);
    assert.ok(html.indexOf('gallery-utils.js') < html.indexOf('script.js'));
});

test('the original twelve gallery cards remain in the markup', function () {
    const count = (html.match(/class="gallery-item"/g) || []).length;
    assert.equal(count, 12);
});

test('gallery logic wires search, sorting, favorites, sharing and keyboard controls', function () {
    assert.match(script, /filterAndSortItems/);
    assert.match(script, /toggleFavorite/);
    assert.match(script, /shareCurrentImage/);
    assert.match(script, /event\.key === 'Escape'/);
    assert.match(script, /event\.key === 'ArrowLeft'/);
    assert.match(script, /event\.key === 'ArrowRight'/);
});

test('project scripts exist for lint, tests and static build verification', function () {
    assert.equal(typeof pkg.scripts.lint, 'string');
    assert.equal(typeof pkg.scripts.test, 'string');
    assert.equal(typeof pkg.scripts.build, 'string');
});
