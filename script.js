
'use strict';

const galleryGrid = document.getElementById('galleryGrid');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
const searchInput = document.getElementById('gallerySearch');
const clearSearchButton = document.getElementById('clearSearch');
const sortSelect = document.getElementById('gallerySort');
const galleryStatus = document.getElementById('galleryStatus');
const emptyState = document.getElementById('emptyState');

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxOverlay = document.querySelector('.lightbox-overlay');
const lightboxSlideshow = document.getElementById('lightboxSlideshow');
const lightboxShare = document.getElementById('lightboxShare');
const actionFeedback = document.getElementById('actionFeedback');

const STORAGE_KEY = 'master-gallery:favorites:v1';
const SLIDESHOW_INTERVAL = 3000;
const HERO_INTERVAL = 5000;
const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
const heroIndicators = Array.from(document.querySelectorAll('.hero-indicator'));
const heroPrevButton = document.getElementById('heroPrev');
const heroNextButton = document.getElementById('heroNext');
const prefersReducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const galleryRecords = galleryItems.map(function (element, index) {
    const image = element.querySelector('img');
    const titleElement = element.querySelector('.image-title');
    const categoryElement = element.querySelector('.image-category');
    return {
        element: element,
        index: index,
        id: image ? (image.getAttribute('data-image-id') || image.getAttribute('src') || ('image-' + index)) : ('image-' + index),
        title: titleElement ? titleElement.textContent.trim() : 'Untitled image',
        category: element.getAttribute('data-category') || (categoryElement ? categoryElement.textContent.trim().toLowerCase() : ''),
        alt: image ? (image.getAttribute('alt') || '') : ''
    };
});

function getStorage() {
    try {
        return window.localStorage;
    } catch (error) {
        return null;
    }
}

let favoriteIds = GalleryUtils.readFavorites(getStorage(), STORAGE_KEY);
let currentCategory = 'all';
let currentQuery = '';
let currentSort = 'featured';
let visibleImages = [];
let currentImageIndex = 0;
let currentRecord = null;
let previousFocus = null;
let slideshowInterval = null;
let isSlideshowPlaying = false;
let currentHeroSlide = 0;
let heroInterval = null;

function updateFavoriteButton(record) {
    const button = record.element.querySelector('.favorite-toggle');
    if (!button) return;

    const isFavorite = favoriteIds.has(record.id);
    button.textContent = isFavorite ? '★' : '☆';
    button.classList.toggle('is-favorite', isFavorite);
    button.setAttribute('aria-pressed', String(isFavorite));
    button.setAttribute('aria-label', (isFavorite ? 'Remove ' + record.title + ' from favorites' : 'Add ' + record.title + ' to favorites'));
    button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
}

function toggleFavorite(record) {
    favoriteIds = GalleryUtils.toggleFavorite(favoriteIds, record.id);
    const saved = GalleryUtils.writeFavorites(getStorage(), favoriteIds, STORAGE_KEY);
    galleryRecords.forEach(updateFavoriteButton);
    renderGallery();
    if (!saved && galleryStatus) {
        galleryStatus.textContent += ' — favorites may not persist in this browser.';
    }
}

function initFavoriteControls() {
    galleryRecords.forEach(function (record) {
        const card = record.element.querySelector('.image-card');
        if (!card) return;

        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Open image: ' + record.title);

        const favoriteButton = document.createElement('button');
        favoriteButton.type = 'button';
        favoriteButton.className = 'favorite-toggle';
        favoriteButton.textContent = '☆';
        favoriteButton.setAttribute('aria-pressed', 'false');
        favoriteButton.setAttribute('aria-label', 'Add ' + record.title + ' to favorites');
        favoriteButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(record);
        });
        card.appendChild(favoriteButton);

        card.addEventListener('click', function (event) {
            if (event.target.closest('.favorite-toggle')) return;
            openLightbox(record.element);
        });
        card.addEventListener('keydown', function (event) {
            if (event.target !== card) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(record.element);
            }
        });

        updateFavoriteButton(record);
    });
}

function updateVisibleImages() {
    const searchableRecords = galleryRecords.map(function (record) {
        return {
            id: record.id,
            title: record.title,
            category: record.category,
            alt: record.alt,
            index: record.index,
            record: record
        };
    });

    const result = GalleryUtils.filterAndSortItems(searchableRecords, {
        category: currentCategory,
        query: currentQuery,
        sortBy: currentSort,
        favorites: favoriteIds
    });

    visibleImages = result.map(function (item) { return item.record; });
}

function renderGallery() {
    updateVisibleImages();
    const visibleSet = new Set(visibleImages.map(function (record) { return record.element; }));

    galleryRecords.forEach(function (record) {
        const visible = visibleSet.has(record.element);
        record.element.classList.toggle('hidden', !visible);
        record.element.setAttribute('aria-hidden', String(!visible));
        record.element.style.order = String(record.index);
    });

    visibleImages.forEach(function (record, index) {
        record.element.style.order = String(index);
        galleryGrid.appendChild(record.element);
    });

    if (galleryStatus) {
        const noun = visibleImages.length === 1 ? 'image' : 'images';
        galleryStatus.textContent = 'Showing ' + visibleImages.length + ' of ' + galleryRecords.length + ' ' + noun;
        if (currentCategory !== 'all') {
            galleryStatus.textContent += ' in ' + (currentCategory === 'favorites' ? 'Favorites' : currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1));
        }
        if (currentQuery.trim()) {
            galleryStatus.textContent += ' for "' + currentQuery.trim() + '"';
        }
    }

    if (emptyState) {
        emptyState.hidden = visibleImages.length > 0;
        if (visibleImages.length === 0) {
            if (currentCategory === 'favorites' && favoriteIds.size === 0 && !currentQuery.trim()) {
                emptyState.querySelector('h2').textContent = 'No favorites yet';
                emptyState.querySelector('p').textContent = 'Choose the star on any image to save it here. Favorites stay on this device when browser storage is available.';
            } else {
                emptyState.querySelector('h2').textContent = 'No images found';
                emptyState.querySelector('p').textContent = 'Try another search or choose a different category. You can also save images with the star button.';
            }
        }
    }

    if (currentRecord && lightbox.classList.contains('active')) {
        const newIndex = visibleImages.indexOf(currentRecord);
        if (newIndex < 0) {
            closeLightbox();
        } else {
            currentImageIndex = newIndex;
        }
    }
}

function filterGallery(category) {
    currentCategory = category || 'all';
    filterButtons.forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-filter') === currentCategory);
    });
    renderGallery();
}

function updateLightboxImage() {
    const record = visibleImages[currentImageIndex];
    if (!record) return;

    currentRecord = record;
    const image = record.element.querySelector('img');
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt || record.title;
    lightboxTitle.textContent = record.title;
    lightboxCategory.textContent = record.category;
    if (actionFeedback) actionFeedback.textContent = '';
}

function openLightbox(target) {
    const record = target && target.element ? target : galleryRecords.find(function (item) {
        return item.element === target;
    });
    if (!record || visibleImages.indexOf(record) < 0) return;

    previousFocus = document.activeElement;
    currentImageIndex = visibleImages.indexOf(record);
    currentRecord = record;
    updateLightboxImage();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopSlideshow();

    const focusTarget = previousFocus;
    previousFocus = null;
    currentRecord = null;
    if (focusTarget && document.contains(focusTarget) && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
    }
}

function showPreviousImage() {
    if (visibleImages.length === 0) return;
    if (isSlideshowPlaying) stopSlideshow();
    currentImageIndex = (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
    updateLightboxImage();
}

function showNextImage(fromSlideshow) {
    if (visibleImages.length === 0) return;
    if (isSlideshowPlaying && !fromSlideshow) stopSlideshow();
    currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
    updateLightboxImage();
}

function toggleSlideshow() {
    if (isSlideshowPlaying) {
        stopSlideshow();
    } else {
        startSlideshow();
    }
}

function startSlideshow() {
    if (visibleImages.length < 2) {
        if (actionFeedback) actionFeedback.textContent = 'At least two visible images are needed for a slideshow.';
        return;
    }
    stopSlideshow();
    isSlideshowPlaying = true;
    lightboxSlideshow.classList.add('playing');
    lightboxSlideshow.setAttribute('aria-label', 'Pause slideshow');
    lightboxSlideshow.querySelector('.play-icon').classList.add('hidden');
    lightboxSlideshow.querySelector('.pause-icon').classList.remove('hidden');
    slideshowInterval = window.setInterval(function () {
        showNextImage(true);
    }, SLIDESHOW_INTERVAL);
}

function stopSlideshow() {
    isSlideshowPlaying = false;
    if (slideshowInterval !== null) {
        window.clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    if (!lightboxSlideshow) return;
    lightboxSlideshow.classList.remove('playing');
    lightboxSlideshow.setAttribute('aria-label', 'Play slideshow');
    const playIcon = lightboxSlideshow.querySelector('.play-icon');
    const pauseIcon = lightboxSlideshow.querySelector('.pause-icon');
    if (playIcon) playIcon.classList.remove('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
}

function handleKeyboard(event) {
    if (!lightbox.classList.contains('active')) return;

    if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPreviousImage();
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNextImage(false);
    } else if (event.key === 'Tab') {
        const focusable = Array.from(lightbox.querySelectorAll('button:not([disabled])'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

async function shareCurrentImage() {
    if (!currentRecord) return;
    const image = currentRecord.element.querySelector('img');
    const shareData = {
        title: currentRecord.title,
        text: currentRecord.title + ' — ' + currentRecord.category + ' (Master Gallery)',
        url: image.src
    };

    try {
        if (window.navigator.share) {
            await window.navigator.share(shareData);
            if (actionFeedback) actionFeedback.textContent = 'Share sheet opened.';
            return;
        }
        if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
            await window.navigator.clipboard.writeText(image.src);
            if (actionFeedback) actionFeedback.textContent = 'Image link copied to clipboard.';
            return;
        }
        if (actionFeedback) actionFeedback.textContent = 'Sharing is not supported in this browser.';
    } catch (error) {
        if (error && error.name !== 'AbortError' && actionFeedback) {
            actionFeedback.textContent = 'Could not share this image. Try copying its image address from the browser.';
        }
    }
}

function initHeroSlideshow() {
    if (heroSlides.length === 0) return;

    if (heroPrevButton) {
        heroPrevButton.addEventListener('click', function () {
            changeHeroSlide('prev');
            resetHeroAutoplay();
        });
    }
    if (heroNextButton) {
        heroNextButton.addEventListener('click', function () {
            changeHeroSlide('next');
            resetHeroAutoplay();
        });
    }
    heroIndicators.forEach(function (indicator, index) {
        indicator.addEventListener('click', function () {
            goToHeroSlide(index);
            resetHeroAutoplay();
        });
    });

    if (!prefersReducedMotion) startHeroAutoplay();
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stopHeroAutoplay();
        } else if (!prefersReducedMotion) {
            startHeroAutoplay();
        }
    });
}

function goToHeroSlide(index) {
    if (heroSlides.length === 0) return;
    const nextIndex = (index + heroSlides.length) % heroSlides.length;
    if (heroSlides[currentHeroSlide]) heroSlides[currentHeroSlide].classList.remove('active');
    if (heroIndicators[currentHeroSlide]) heroIndicators[currentHeroSlide].classList.remove('active');
    currentHeroSlide = nextIndex;
    heroSlides[currentHeroSlide].classList.add('active');
    if (heroIndicators[currentHeroSlide]) heroIndicators[currentHeroSlide].classList.add('active');
}

function changeHeroSlide(direction) {
    if (heroSlides.length === 0) return;
    const nextIndex = direction === 'next'
        ? (currentHeroSlide + 1) % heroSlides.length
        : (currentHeroSlide - 1 + heroSlides.length) % heroSlides.length;
    goToHeroSlide(nextIndex);
}

function startHeroAutoplay() {
    if (prefersReducedMotion || heroSlides.length < 2) return;
    stopHeroAutoplay();
    heroInterval = window.setInterval(function () {
        if (!document.hidden) changeHeroSlide('next');
    }, HERO_INTERVAL);
}

function resetHeroAutoplay() {
    if (!prefersReducedMotion) startHeroAutoplay();
}

function stopHeroAutoplay() {
    if (heroInterval !== null) {
        window.clearInterval(heroInterval);
        heroInterval = null;
    }
}

function initImageLoading() {
    galleryRecords.forEach(function (record) {
        const image = record.element.querySelector('img');
        if (!image) return;
        if (image.complete) {
            image.classList.toggle('image-error', image.naturalWidth === 0);
            return;
        }
        image.addEventListener('load', function () {
            image.classList.remove('image-error');
        }, { once: true });
        image.addEventListener('error', function () {
            image.classList.add('image-error');
        }, { once: true });
    });
}

function initGallery() {
    initFavoriteControls();

    filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            filterGallery(button.getAttribute('data-filter'));
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentQuery = searchInput.value;
            renderGallery();
        });
    }
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', function () {
            if (searchInput) {
                searchInput.value = '';
                currentQuery = '';
                searchInput.focus();
            }
            renderGallery();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = sortSelect.value;
            renderGallery();
        });
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', showPreviousImage);
    if (lightboxNext) lightboxNext.addEventListener('click', function () { showNextImage(false); });
    if (lightboxSlideshow) lightboxSlideshow.addEventListener('click', toggleSlideshow);
    if (lightboxShare) lightboxShare.addEventListener('click', shareCurrentImage);

    document.addEventListener('keydown', handleKeyboard);
    renderGallery();
    initHeroSlideshow();
    initImageLoading();
}

document.addEventListener('DOMContentLoaded', initGallery);
