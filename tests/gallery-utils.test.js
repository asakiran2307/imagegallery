
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizeText,
    filterAndSortItems,
    toggleFavorite,
    readFavorites,
    writeFavorites
} = require('../gallery-utils.js');

const items = [
    { id: 'mountain', title: 'Mountain Vista', category: 'nature', alt: 'Snowy mountain at sunset', index: 0 },
    { id: 'forest', title: 'Mystic Forest', category: 'nature', alt: 'Tall green trees', index: 1 },
    { id: 'circuit', title: 'Circuit Dreams', category: 'technology', alt: 'Circuit board close-up', index: 2 },
    { id: 'color', title: 'Color Waves', category: 'abstract', alt: 'Café-colored abstract art', index: 3 }
];

test('normalizes case, whitespace and accented characters for search', function () {
    assert.equal(normalizeText('  CAFÉ  '), 'cafe');
});

test('search matches title, category and alt text', function () {
    assert.deepEqual(filterAndSortItems(items, { query: 'circuit' }).map(function (item) { return item.id; }), ['circuit']);
    assert.deepEqual(filterAndSortItems(items, { query: 'NATURE' }).map(function (item) { return item.id; }), ['mountain', 'forest']);
    assert.deepEqual(filterAndSortItems(items, { query: 'green trees' }).map(function (item) { return item.id; }), ['forest']);
});

test('category filtering and search combine correctly', function () {
    assert.deepEqual(filterAndSortItems(items, { category: 'nature', query: 'forest' }).map(function (item) { return item.id; }), ['forest']);
    assert.deepEqual(filterAndSortItems(items, { category: 'technology', query: 'mountain' }), []);
});

test('favorites filter only returns saved identifiers', function () {
    assert.deepEqual(filterAndSortItems(items, { category: 'favorites', favorites: new Set(['forest', 'color']) }).map(function (item) { return item.id; }), ['forest', 'color']);
});

test('sort modes are deterministic and do not mutate the input array', function () {
    const originalIds = items.map(function (item) { return item.id; });
    assert.deepEqual(filterAndSortItems(items, { sortBy: 'title-asc' }).map(function (item) { return item.title; }), ['Circuit Dreams', 'Color Waves', 'Mountain Vista', 'Mystic Forest']);
    assert.deepEqual(filterAndSortItems(items, { sortBy: 'title-desc' }).map(function (item) { return item.title; }), ['Mystic Forest', 'Mountain Vista', 'Color Waves', 'Circuit Dreams']);
    assert.deepEqual(filterAndSortItems(items, { sortBy: 'category' }).map(function (item) { return item.id; }), ['color', 'mountain', 'forest', 'circuit']);
    assert.deepEqual(items.map(function (item) { return item.id; }), originalIds);
});

test('toggleFavorite returns a new set and toggles both directions', function () {
    const initial = new Set(['forest']);
    const added = toggleFavorite(initial, 'circuit');
    assert.deepEqual(Array.from(initial), ['forest']);
    assert.equal(added.has('forest'), true);
    assert.equal(added.has('circuit'), true);
    const removed = toggleFavorite(added, 'forest');
    assert.equal(removed.has('forest'), false);
    assert.equal(removed.has('circuit'), true);
});

test('readFavorites tolerates malformed data and unavailable storage', function () {
    assert.equal(readFavorites(null).size, 0);
    assert.equal(readFavorites({ getItem: function () { return '{bad json'; } }).size, 0);
    const values = readFavorites({ getItem: function () { return '["a","a",3,""]'; } });
    assert.deepEqual(Array.from(values), ['a']);
});

test('writeFavorites stores a stable sorted list and handles unavailable storage', function () {
    let stored = '';
    const storage = { setItem: function (key, value) { stored = key + ':' + value; } };
    assert.equal(writeFavorites(storage, new Set(['z', 'a'])), true);
    assert.equal(stored, 'master-gallery:favorites:v1:["a","z"]');
    assert.equal(writeFavorites(null, new Set(['a'])), false);
    assert.equal(writeFavorites({ setItem: function () { throw new Error('quota'); } }, new Set(['a'])), false);
});
