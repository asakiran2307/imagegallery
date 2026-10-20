
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const requiredFiles = ['index.html', 'style.css', 'script.js', 'gallery-utils.js', 'vercel.json', 'README.md'];
const missing = requiredFiles.filter(function (file) {
    return !fs.existsSync(path.join(root, file));
});

if (missing.length) {
    console.error('Static build verification failed; missing files: ' + missing.join(', '));
    process.exit(1);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const localAssets = ['style.css', 'gallery-utils.js', 'script.js'];
const unreferenced = localAssets.filter(function (asset) {
    return html.indexOf(asset) < 0;
});

if (unreferenced.length) {
    console.error('Static build verification failed; HTML does not reference: ' + unreferenced.join(', '));
    process.exit(1);
}
if (!Array.isArray(config.builds) || config.builds.length === 0) {
    console.error('Static build verification failed; Vercel static build configuration is missing.');
    process.exit(1);
}

console.log('Static build verification passed: required assets and Vercel configuration are present.');
