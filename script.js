
const galleryGrid = document.getElementById('galleryGrid');
const galleryItems = document.querySelectorAll('.gallery-item');
const filterButtons = document.querySelectorAll('.filter-btn');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxOverlay = document.querySelector('.lightbox-overlay');
const lightboxSlideshow = document.getElementById('lightboxSlideshow');

// State variables
let currentImageIndex = 0;
let currentCategory = 'all';
let visibleImages = [];

// Slideshow State
let slideshowInterval = null;
let isSlideshowPlaying = false;
const SLIDESHOW_INTERVAL = 3000; // 3 seconds per image

// Hero Slideshow State
let currentHeroSlide = 0;
let heroInterval = null;
const HERO_INTERVAL = 5000; // 5 seconds per hero slide
const heroSlides = document.querySelectorAll('.hero-slide');
const heroIndicators = document.querySelectorAll('.hero-indicator');
const heroPrevBtn = document.getElementById('heroPrev');
const heroNextBtn = document.getElementById('heroNext');

// Initialize everything on page load
function initGallery() {
    console.log('Gallery loading...');

    // Update visible images array
    updateVisibleImages();

    // Add click event to each gallery item
    galleryItems.forEach((item, index) => {
        const imageCard = item.querySelector('.image-card');
        imageCard.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    // Add filter button events
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            filterGallery(filter);

            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Lightbox controls
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPreviousImage);
    lightboxNext.addEventListener('click', showNextImage);
    lightboxSlideshow.addEventListener('click', toggleSlideshow);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Initialize hero slideshow
    initHeroSlideshow();

    console.log('Ready!');
}

// ============= Update Visible Images =============
function updateVisibleImages() {
    visibleImages = Array.from(galleryItems).filter(item => {
        return !item.classList.contains('hidden');
    });
}

function filterGallery(category) {

    galleryItems.forEach((item, index) => {
        const itemCategory = item.getAttribute('data-category');

        // Add staggered animation delay
        item.style.animationDelay = `${index * 0.05}s`;

        if (category === 'all' || itemCategory === category) {
            // Show item with smooth fade-in
            setTimeout(() => {
                item.classList.remove('hidden');
            }, index * 30);
        } else {
            // Hide item
            item.classList.add('hidden');
        }
    });

    // Update visible images after filtering
    setTimeout(() => {
        updateVisibleImages();
    }, 500);
}

// Lightbox stuff
/**
 * Open lightbox and display image at specified index
 * @param {number} index - Index of the gallery item to display
 */
function openLightbox(index) {
    // Find the actual index in the full gallery array
    const clickedItem = Array.from(galleryItems)[index];

    // If item is hidden, don't open lightbox
    if (clickedItem.classList.contains('hidden')) {
        return;
    }

    // Get index within visible images
    currentImageIndex = visibleImages.indexOf(clickedItem);

    // Get image data
    const img = clickedItem.querySelector('img');
    const title = clickedItem.querySelector('.image-title').textContent;
    const category = clickedItem.querySelector('.image-category').textContent;

    // Set lightbox content
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightboxTitle.textContent = title;
    lightboxCategory.textContent = category;

    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}


function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    stopSlideshow(); // Stop slideshow if playing

}


function showPreviousImage() {
    // Pause slideshow on manual navigation
    if (isSlideshowPlaying) {
        stopSlideshow();
    }

    currentImageIndex--;

    // Loop to end if at the beginning
    if (currentImageIndex < 0) {
        currentImageIndex = visibleImages.length - 1;
    }

    updateLightboxImage();
}


function showNextImage() {
    // Pause slideshow on manual navigation (unless called by slideshow itself)
    if (isSlideshowPlaying && !arguments[0]) {
        stopSlideshow();
    }

    currentImageIndex++;

    // Loop to beginning if at the end
    if (currentImageIndex >= visibleImages.length) {
        currentImageIndex = 0;
    }

    updateLightboxImage();
}

// Keep track of what's visible for lightbox nav
function updateLightboxImage() {
    const currentItem = visibleImages[currentImageIndex];

    if (!currentItem) {
        console.error('❌ No visible images available');
        return;
    }

    const img = currentItem.querySelector('img');
    const title = currentItem.querySelector('.image-title').textContent;
    const category = currentItem.querySelector('.image-category').textContent;

    // Add fade transition
    lightboxImage.style.opacity = '0';

    setTimeout(() => {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
        lightboxTitle.textContent = title;
        lightboxCategory.textContent = category;
        lightboxImage.style.opacity = '1';
    }, 150);

}

// Keyboard shortcuts
function handleKeyboard(e) {
    // Only handle keyboard if lightbox is active
    if (!lightbox.classList.contains('active')) {
        return;
    }

    switch (e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            showPreviousImage();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
        case ' ':
        case 'Spacebar':
            e.preventDefault();
            toggleSlideshow();
            break;
    }
}

// Slideshow controls
function toggleSlideshow() {
    if (isSlideshowPlaying) {
        stopSlideshow();
    } else {
        startSlideshow();
    }
}


function startSlideshow() {
    if (visibleImages.length <= 1) {
        console.log(' Not enough images for slideshow');
        return;
    }

    isSlideshowPlaying = true;

    // Update button state
    lightboxSlideshow.classList.add('playing');
    lightboxSlideshow.setAttribute('aria-label', 'Pause slideshow');

    // Toggle icons
    const playIcon = lightboxSlideshow.querySelector('.play-icon');
    const pauseIcon = lightboxSlideshow.querySelector('.pause-icon');
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');

    // Start auto-advance
    slideshowInterval = setInterval(() => {
        showNextImage(true); // Pass flag to prevent auto-pause
    }, SLIDESHOW_INTERVAL);


}


function stopSlideshow() {
    isSlideshowPlaying = false;

    // Clear interval
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }

    // Update button state
    lightboxSlideshow.classList.remove('playing');
    lightboxSlideshow.setAttribute('aria-label', 'Play slideshow');

    // Toggle icons
    const playIcon = lightboxSlideshow.querySelector('.play-icon');
    const pauseIcon = lightboxSlideshow.querySelector('.pause-icon');
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');


}

// Hero banner slideshow
function initHeroSlideshow() {
    // Start auto-rotation
    startHeroAutoplay();

    // Add navigation button listeners
    if (heroPrevBtn && heroNextBtn) {
        heroPrevBtn.addEventListener('click', () => {
            changeHeroSlide('prev');
            resetHeroAutoplay();
        });

        heroNextBtn.addEventListener('click', () => {
            changeHeroSlide('next');
            resetHeroAutoplay();
        });
    }

    // Add indicator click listeners
    heroIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToHeroSlide(index);
            resetHeroAutoplay();
        });
    });


}


function goToHeroSlide(slideIndex) {
    // Remove active class from current slide and indicator
    heroSlides[currentHeroSlide].classList.remove('active');
    heroIndicators[currentHeroSlide].classList.remove('active');

    // Update current slide
    currentHeroSlide = slideIndex;

    // Add active class to new slide and indicator
    heroSlides[currentHeroSlide].classList.add('active');
    heroIndicators[currentHeroSlide].classList.add('active');
}


function changeHeroSlide(direction) {
    const nextSlide = direction === 'next'
        ? (currentHeroSlide + 1) % heroSlides.length
        : (currentHeroSlide - 1 + heroSlides.length) % heroSlides.length;

    goToHeroSlide(nextSlide);
}


function startHeroAutoplay() {
    heroInterval = setInterval(() => {
        changeHeroSlide('next');
    }, HERO_INTERVAL);
}


function resetHeroAutoplay() {
    clearInterval(heroInterval);
    startHeroAutoplay();
}


function stopHeroAutoplay() {
    if (heroInterval) {
        clearInterval(heroInterval);
        heroInterval = null;
    }
}

// Fade in images when they load
function initImageLoading() {
    const images = document.querySelectorAll('.image-card img');

    images.forEach(img => {
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.style.opacity = '0';
            img.addEventListener('load', () => {
                img.style.transition = 'opacity 0.3s ease';
                img.style.opacity = '1';
            });
        }
    });
}


function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });

    galleryItems.forEach(item => {
        observer.observe(item);
    });
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initImageLoading();
    initScrollAnimations();
});

// ============= Performance Monitoring (Optional) =============
window.addEventListener('load', () => {
    console.log('✨ All resources loaded');

    // Log performance metrics
    const perfData = performance.getEntriesByType("navigation")[0];
    if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        console.log(`⚡ Page load time: ${loadTime.toFixed(2)}ms`);
    }
});


