/* ==========================================================================
   GARG ENTERPRISES - INTERACTION CONTROLLER (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* 1. LOADER SCREEN REMOVAL */
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        window.addEventListener('load', () => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600); // Sync with CSS transition duration
        });
        
        // Fallback: hide loader if load event takes too long
        setTimeout(() => {
            if (loader.style.display !== 'none') {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 600);
            }
        }, 3000);
    }

    /* 2. STICKY HEADER OBSERVER */
    const header = document.querySelector('.main-header');
    const handleScrollHeader = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScrollHeader);
    // Initial call in case page is refreshed while scrolled
    handleScrollHeader();

    /* 3. SCROLL REVEAL ANIMATIONS */
    const revealElements = document.querySelectorAll('.reveal-section, .reveal-fade');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve once revealed to save CPU cycles
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1, // 10% visible
        rootMargin: '0px 0px -40px 0px' // Trigger slightly before element enters
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    /* 4. STATISTICS COUNTER */
    const statsSection = document.getElementById('stats');
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    const runCounters = () => {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            const duration = 1800; // Total animation length in ms
            const startTime = performance.now();

            const updateCount = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic progress curve
                const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
                const currentVal = Math.floor(easeOutQuad(progress) * target);
                
                stat.textContent = currentVal;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target;
                }
            };

            requestAnimationFrame(updateCount);
        });
    };

    if (statsSection && statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersStarted) {
                    countersStarted = true;
                    runCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        statsObserver.observe(statsSection);
    }

    /* 5. PRODUCT CATEGORY FILTER & SEARCH */
    const searchInput = document.getElementById('product-search');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    const productsGrid = document.getElementById('products-grid');

    let activeFilter = 'all';
    let searchQuery = '';

    const filterProducts = () => {
        let visibleCount = 0;

        productCards.forEach(card => {
            const categories = card.getAttribute('data-category').toLowerCase().split(' ');
            const title = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            
            const matchesFilter = (activeFilter === 'all' || categories.includes(activeFilter));
            const matchesSearch = (title.includes(searchQuery) || desc.includes(searchQuery));

            if (matchesFilter && matchesSearch) {
                card.style.display = 'flex';
                // Trigger quick visual fade-in
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, 10);
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(15px) scale(0.95)';
                // Delay display none so transition has time to play
                card.style.display = 'none';
            }
        });

        // Optional: Show "no products found" notice
        let noResultsMsg = document.getElementById('no-results-msg');
        if (visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('p');
                noResultsMsg.id = 'no-results-msg';
                noResultsMsg.style.textAlign = 'center';
                noResultsMsg.style.gridColumn = '1 / -1';
                noResultsMsg.style.padding = '40px 0';
                noResultsMsg.style.color = 'var(--color-text-muted)';
                noResultsMsg.style.fontFamily = 'var(--font-headings)';
                noResultsMsg.style.fontSize = '1.1rem';
                noResultsMsg.textContent = 'No products match your search/filter criteria. Try WhatsApp inquiry!';
                productsGrid.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    };

    // Filter Buttons Click
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeFilter = e.currentTarget.getAttribute('data-filter');
            filterProducts();
        });
    });

    // Search Input Typing
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterProducts();
        });
    }

    /* 6. REUSABLE PREMIUM COVERFLOW CAROUSEL FACTORY */
    const createCarousel = ({
        containerSelector,
        lightboxId,
        lightboxImgId,
        lightboxCaptionId,
        autoplayInterval = 3000
    }) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const track = container.querySelector('.carousel-track');
        const originalSlides = Array.from(track.querySelectorAll('.carousel-slide'));
        const slideCount = originalSlides.length;
        if (slideCount === 0) return;

        // ── Lightbox setup ──
        const lightbox        = document.getElementById(lightboxId);
        const lightboxImg     = document.getElementById(lightboxImgId);
        const lightboxCaption = document.getElementById(lightboxCaptionId);
        const lightboxClose   = lightbox ? lightbox.querySelector('.lightbox-close') : null;
        const lightboxPrevBtn = lightbox ? lightbox.querySelector('.lightbox-prev')  : null;
        const lightboxNextBtn = lightbox ? lightbox.querySelector('.lightbox-next')  : null;

        let lightboxIndex = 0;
        const slideData = [];

        originalSlides.forEach(slide => {
            const img        = slide.querySelector('img');
            const captionEl  = slide.querySelector('.slide-caption span');
            const placeholder = slide.querySelector('.award-placeholder');
            slideData.push({
                src:   img ? img.getAttribute('src') : null,
                alt:   img ? img.getAttribute('alt') : '',
                label: captionEl ? captionEl.textContent : (placeholder ? placeholder.getAttribute('data-label') : ''),
                isPlaceholder: !img
            });
        });

        const openLightbox = (index) => {
            if (!lightbox) return;
            const item = slideData[index];
            if (item.isPlaceholder || !item.src) return; // Don't open placeholder
            lightboxIndex = index;
            if (lightboxImg)     lightboxImg.src = item.src;
            if (lightboxImg)     lightboxImg.alt = item.alt;
            if (lightboxCaption) lightboxCaption.textContent = item.label;
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
            if (!lightbox) return;
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        };

        const showLightboxPrev = () => {
            lightboxIndex = (lightboxIndex - 1 + slideData.length) % slideData.length;
            const item = slideData[lightboxIndex];
            if (lightboxImg)     lightboxImg.src = item.src || '';
            if (lightboxCaption) lightboxCaption.textContent = item.label;
        };

        const showLightboxNext = () => {
            lightboxIndex = (lightboxIndex + 1) % slideData.length;
            const item = slideData[lightboxIndex];
            if (lightboxImg)     lightboxImg.src = item.src || '';
            if (lightboxCaption) lightboxCaption.textContent = item.label;
        };

        if (lightboxClose)   lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showLightboxPrev);
        if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showLightboxNext);
        if (lightbox) {
            lightbox.addEventListener('click', e => {
                if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-content-wrapper')) closeLightbox();
            });
        }

        // ── Clone slides for infinite loop ──
        const clonesToAppend  = originalSlides.slice(0, 2).map(s => s.cloneNode(true));
        const clonesToPrepend = originalSlides.slice(-2).map(s => s.cloneNode(true));
        clonesToAppend.forEach(c => c.classList.add('clone'));
        clonesToPrepend.forEach(c => c.classList.add('clone'));
        clonesToPrepend.reverse().forEach(c => track.insertBefore(c, track.firstChild));
        clonesToAppend.forEach(c => track.appendChild(c));

        const allSlides = Array.from(track.querySelectorAll('.carousel-slide'));

        let carouselIndex   = 2;
        let isTransitioning = false;
        let isDragging      = false;
        let startX          = 0;
        let dragOffset      = 0;
        let startTime       = 0;
        let autoplayTimer   = null;
        let inactivityTimeout = null;

        // ── Counter & dots ──
        const counterEl = container.querySelector('.carousel-counter .current-num');
        const totalEl   = container.querySelector('.carousel-counter .total-num');
        const dotsEl    = container.querySelector('.carousel-dots');

        if (totalEl) totalEl.textContent = String(slideCount).padStart(2, '0');

        const updateCounter = (activeIndex) => {
            if (counterEl) counterEl.textContent = String(activeIndex + 1).padStart(2, '0');
        };

        const setupDots = () => {
            if (!dotsEl) return;
            dotsEl.innerHTML = '';
            for (let i = 0; i < slideCount; i++) {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                if (i === 0) dot.classList.add('active');
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    if (isTransitioning) return;
                    beginTransition();
                    carouselIndex = i + 2;
                    setTrackPosition();
                    updateActiveClasses();
                    resetAutoplay();
                });
                dotsEl.appendChild(dot);
            }
        };

        const updateDots = (activeIndex) => {
            if (!dotsEl) return;
            dotsEl.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
                dot.classList.toggle('active', idx === activeIndex);
            });
        };

        const updateActiveClasses = () => {
            allSlides.forEach((slide, idx) => {
                slide.classList.toggle('active', idx === carouselIndex);
            });
            const activeIndex = (carouselIndex - 2 + slideCount) % slideCount;
            updateDots(activeIndex);
            updateCounter(activeIndex);
        };

        const setTrackPosition = () => {
            container.style.setProperty('--current-index', carouselIndex);
        };

        // ── Arrows ──
        const prevArrow = container.querySelector('.prev-arrow');
        const nextArrow = container.querySelector('.next-arrow');
        if (prevArrow) prevArrow.addEventListener('click', () => {
            if (isTransitioning) return;
            beginTransition();
            carouselIndex--;
            setTrackPosition();
            updateActiveClasses();
            resetAutoplay();
        });
        if (nextArrow) nextArrow.addEventListener('click', () => {
            if (isTransitioning) return;
            beginTransition();
            carouselIndex++;
            setTrackPosition();
            updateActiveClasses();
            resetAutoplay();
        });

        // ── Click side slides to center / open lightbox on active ──
        allSlides.forEach(slide => {
            slide.addEventListener('click', () => {
                if (isDragging) return;
                const clickedIndex = allSlides.indexOf(slide);
                if (clickedIndex === carouselIndex) {
                    const activeIndex = (carouselIndex - 2 + slideCount) % slideCount;
                    openLightbox(activeIndex);
                } else {
                    if (isTransitioning) return;
                    beginTransition();
                    carouselIndex = clickedIndex;
                    setTrackPosition();
                    updateActiveClasses();
                    resetAutoplay();
                }
            });
        });

        // ── Autoplay ──
        const startAutoplay = () => {
            clearInterval(autoplayTimer);
            autoplayTimer = setInterval(() => {
                if (isDragging || isTransitioning) return;
                beginTransition();
                carouselIndex++;
                setTrackPosition();
                updateActiveClasses();
            }, autoplayInterval);
        };

        const resetAutoplay = () => {
            clearInterval(autoplayTimer);
            clearTimeout(inactivityTimeout);
            inactivityTimeout = setTimeout(startAutoplay, 3000);
        };

        // ── Drag / Swipe ──
        const getEventX = e => e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;

        const handleDragStart = e => {
            if (isTransitioning) return;
            if (e.type.startsWith('mouse') && e.button !== 0) return;
            isDragging = true;
            startX = getEventX(e);
            dragOffset = 0;
            startTime = performance.now();
            track.classList.add('dragging');
            clearInterval(autoplayTimer);
            clearTimeout(inactivityTimeout);
        };

        const handleDragMove = e => {
            if (!isDragging) return;
            dragOffset = getEventX(e) - startX;
            track.style.setProperty('--drag-offset', `${dragOffset}px`);
        };

        const handleDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            track.classList.remove('dragging');
            track.style.removeProperty('--drag-offset');

            const slideWidthPercent = parseFloat(getComputedStyle(container).getPropertyValue('--slide-width')) || 75;
            const slideWidthPx  = container.offsetWidth * (slideWidthPercent / 100);
            const threshold     = slideWidthPx * 0.15;
            const dragDuration  = performance.now() - startTime;
            const isFastSwipe   = Math.abs(dragOffset) > 50 && dragDuration < 250;

            if      (dragOffset < -threshold || (isFastSwipe && dragOffset < 0)) carouselIndex++;
            else if (dragOffset >  threshold || (isFastSwipe && dragOffset > 0)) carouselIndex--;

            beginTransition();
            setTrackPosition();
            updateActiveClasses();
            resetAutoplay();
        };

        track.addEventListener('mousedown', handleDragStart);
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        track.addEventListener('touchstart', handleDragStart, { passive: true });
        track.addEventListener('touchmove',  handleDragMove,  { passive: true });
        track.addEventListener('touchend',   handleDragEnd);

        // ── Safe transition unlock ──
        let transitionSafetyTimer = null;
        const unlockTransition = () => {
            clearTimeout(transitionSafetyTimer);
            isTransitioning = false;
            if (carouselIndex >= slideCount + 2) {
                track.classList.add('dragging');
                carouselIndex = 2;
                setTrackPosition();
                track.offsetHeight;
                track.classList.remove('dragging');
            } else if (carouselIndex <= 1) {
                track.classList.add('dragging');
                carouselIndex = slideCount + 1;
                setTrackPosition();
                track.offsetHeight;
                track.classList.remove('dragging');
            }
            updateActiveClasses();
        };

        // Listen on track only (not bubbled from child slides)
        track.addEventListener('transitionend', e => {
            if (e.target !== track || e.propertyName !== 'transform') return;
            unlockTransition();
        });

        // Wrapper to set isTransitioning with a safety fallback
        const beginTransition = () => {
            isTransitioning = true;
            clearTimeout(transitionSafetyTimer);
            transitionSafetyTimer = setTimeout(unlockTransition, 500);
        };

        // ── Init ──
        setupDots();
        updateActiveClasses();
        setTrackPosition();

        // Start autoplay only when the section is visible in the viewport
        const gallerySection = container.closest('section') || container;
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAutoplay();
                } else {
                    clearInterval(autoplayTimer);
                    clearTimeout(inactivityTimeout);
                }
            });
        }, { threshold: 0.2 });
        visibilityObserver.observe(gallerySection);

        window.addEventListener('resize', () => {
            clearTimeout(window._carouselResizeTimer);
            window._carouselResizeTimer = setTimeout(setTrackPosition, 100);
        });
    };

    // Global keyboard handler for whichever lightbox is open
    document.addEventListener('keydown', e => {
        ['lightbox', 'awards-lightbox'].forEach(id => {
            const lb = document.getElementById(id);
            if (lb && lb.style.display === 'flex') {
                if (e.key === 'Escape')      lb.querySelector('.lightbox-close')?.click();
                if (e.key === 'ArrowLeft')   lb.querySelector('.lightbox-prev')?.click();
                if (e.key === 'ArrowRight')  lb.querySelector('.lightbox-next')?.click();
            }
        });
    });

    /* 6a. SHOWROOM GALLERY CAROUSEL */
    createCarousel({
        containerSelector: '.gallery-section .premium-carousel-container',
        lightboxId:         'lightbox',
        lightboxImgId:      'lightbox-img',
        lightboxCaptionId:  'lightbox-caption',
        autoplayInterval:   3000
    });


    /* 7. FLOATING BACK TO TOP & UTILITIES */
    const backToTopBtn = document.getElementById('back-to-top');

    const handleScrollTopBtn = () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    };
    
    window.addEventListener('scroll', handleScrollTopBtn);

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
