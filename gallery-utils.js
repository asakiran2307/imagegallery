
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.GalleryUtils = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function normalizeText(value) {
        return String(value == null ? '' : value)
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .trim();
    }

    function filterAndSortItems(items, options) {
        const settings = options || {};
        const category = normalizeText(settings.category || 'all');
        const query = normalizeText(settings.query || '');
        const sortBy = settings.sortBy || 'featured';
        const favorites = settings.favorites instanceof Set
            ? settings.favorites
            : new Set(Array.isArray(settings.favorites) ? settings.favorites : []);
        const source = Array.isArray(items) ? items : [];

        const filtered = source.filter(function (item) {
            const itemCategory = normalizeText(item.category);
            const categoryMatches = category === 'all'
                || (category === 'favorites' ? favorites.has(item.id) : itemCategory === category);
            const searchMatches = !query || [item.title, item.category, item.alt].some(function (value) {
                return normalizeText(value).includes(query);
            });
            return categoryMatches && searchMatches;
        });

        if (sortBy === 'title-asc') {
            filtered.sort(function (a, b) {
                return normalizeText(a.title).localeCompare(normalizeText(b.title));
            });
        } else if (sortBy === 'title-desc') {
            filtered.sort(function (a, b) {
                return normalizeText(b.title).localeCompare(normalizeText(a.title));
            });
        } else if (sortBy === 'category') {
            filtered.sort(function (a, b) {
                const categoryCompare = normalizeText(a.category).localeCompare(normalizeText(b.category));
                return categoryCompare || normalizeText(a.title).localeCompare(normalizeText(b.title));
            });
        } else {
            filtered.sort(function (a, b) {
                return Number(a.index || 0) - Number(b.index || 0);
            });
        }

        return filtered;
    }

    function toggleFavorite(favorites, id) {
        const next = new Set(favorites instanceof Set ? favorites : (Array.isArray(favorites) ? favorites : []));
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    }

    function readFavorites(storage, key) {
        if (!storage || typeof storage.getItem !== 'function') return new Set();
        try {
            const value = JSON.parse(storage.getItem(key || 'master-gallery:favorites:v1') || '[]');
            if (!Array.isArray(value)) return new Set();
            return new Set(value.filter(function (id) {
                return typeof id === 'string' && id.length > 0;
            }));
        } catch (error) {
            return new Set();
        }
    }

    function writeFavorites(storage, favorites, key) {
        if (!storage || typeof storage.setItem !== 'function') return false;
        try {
            const values = Array.from(favorites instanceof Set ? favorites : []);
            storage.setItem(key || 'master-gallery:favorites:v1', JSON.stringify(values.sort()));
            return true;
        } catch (error) {
            return false;
        }
    }

    return {
        normalizeText: normalizeText,
        filterAndSortItems: filterAndSortItems,
        toggleFavorite: toggleFavorite,
        readFavorites: readFavorites,
        writeFavorites: writeFavorites
    };
}));
