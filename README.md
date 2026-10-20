# Master Gallery

Master Gallery is a dependency-free static image gallery built with HTML, CSS and vanilla JavaScript. It is configured for Vercel static hosting.

## Features

- Responsive gallery with category filters and a rotating hero banner.
- Live search across image titles, categories and descriptive alt text.
- Favorites that persist in the current browser using local storage.
- Sorting by featured order, title ascending/descending, or category.
- Result counts and a helpful empty state when a search has no matches.
- Image lightbox with previous/next navigation, keyboard controls and slideshow playback.
- Share an image using the device share sheet, with clipboard fallback where supported.
- Keyboard-accessible gallery cards and favorite controls, plus reduced-motion support.

## Requirements

- A modern browser for the gallery.
- Node.js 22 or newer to run the project checks. The website itself has no runtime server and no environment variables.

## Run locally

Open index.html in a browser or serve the project directory with any static file server. For validation, run:

    npm run lint
    npm test
    npm run build

The tests use Node's built-in test runner, so no package installation or third-party test dependencies are required.

## Keyboard controls

- Enter or Space on a focused gallery card opens the image.
- Left/Right Arrow moves through visible images in the lightbox.
- Escape closes the lightbox.
- Tab and Shift+Tab remain within the lightbox while it is open.

## Deployment

The repository includes vercel.json for static deployment. Preview deployments should be used to validate changes before promoting them to production. No secrets or environment variables are required.

## Favorites and privacy

Favorite image identifiers are stored only in this browser's local storage. They are not uploaded to a server and will not automatically sync across devices. Clearing browser storage removes saved favorites.
