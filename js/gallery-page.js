(() => {
  let activeGalleryViewer = null;
  let lightboxOpen = false;
  let lightboxReturnFocus = null;
  const galleryStates = new WeakMap();

  const CLOSE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const PREV_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  const NEXT_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  const createLightbox = () => {
    const root = document.createElement('div');
    root.className = 'gallery-lightbox';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Expanded gallery image');
    root.innerHTML = `
      <button type="button" class="gallery-lightbox__backdrop" aria-label="Close expanded image"></button>
      <button type="button" class="gallery-lightbox__close gallery-page__nav" aria-label="Close expanded image">
        ${CLOSE_SVG}
      </button>
      <div class="gallery-lightbox__stage">
        <button type="button" class="gallery-lightbox__nav gallery-page__nav gallery-lightbox__nav--prev" aria-label="Previous screen">
          ${PREV_SVG}
        </button>
        <div class="gallery-lightbox__media">
          <figure class="gallery-lightbox__figure">
            <img class="gallery-lightbox__image" src="" alt="">
          </figure>
          <p class="gallery-lightbox__counter gallery-page__counter--badge" data-lightbox-counter hidden>1 / 1</p>
        </div>
        <button type="button" class="gallery-lightbox__nav gallery-page__nav gallery-lightbox__nav--next" aria-label="Next screen">
          ${NEXT_SVG}
        </button>
      </div>
    `;
    document.body.appendChild(root);

    const backdrop = root.querySelector('.gallery-lightbox__backdrop');
    const closeBtn = root.querySelector('.gallery-lightbox__close');
    const image = root.querySelector('.gallery-lightbox__image');
    const counter = root.querySelector('[data-lightbox-counter]');
    const prevBtn = root.querySelector('.gallery-lightbox__nav--prev');
    const nextBtn = root.querySelector('.gallery-lightbox__nav--next');

    const updateShape = () => {
      if (!image.naturalWidth) return;
      image.classList.toggle(
        'gallery-lightbox__image--wide',
        image.naturalWidth > image.naturalHeight * 1.15
      );
    };

    const syncChrome = () => {
      const state = activeGalleryViewer
        ? galleryStates.get(activeGalleryViewer)
        : null;
      const hasSlides = Boolean(state && state.length > 1);

      prevBtn.hidden = !hasSlides;
      nextBtn.hidden = !hasSlides;
      counter.hidden = !hasSlides;

      if (!hasSlides) return;

      counter.textContent = `${state.index + 1} / ${state.length}`;
      prevBtn.disabled = state.index === 0;
      nextBtn.disabled = state.index === state.length - 1;
    };

    const syncImage = () => {
      const state = activeGalleryViewer
        ? galleryStates.get(activeGalleryViewer)
        : null;
      if (!state) return;

      const slide = state.slide();
      if (!slide) return;

      image.src = slide.src;
      image.alt = slide.alt || '';
      syncChrome();
    };

    const close = () => {
      if (!lightboxOpen) return;

      lightboxOpen = false;
      root.classList.remove('gallery-lightbox--open');
      root.hidden = true;
      document.body.classList.remove('gallery-lightbox-open');
      image.removeAttribute('src');
      lightboxReturnFocus?.focus();
      lightboxReturnFocus = null;
    };

    const open = ({ src, alt }) => {
      lightboxReturnFocus = document.activeElement;
      image.src = src;
      image.alt = alt || '';
      syncChrome();
      root.hidden = false;

      requestAnimationFrame(() => {
        root.classList.add('gallery-lightbox--open');
        closeBtn.focus();
      });

      lightboxOpen = true;
      document.body.classList.add('gallery-lightbox-open');
    };

    const step = (delta) => {
      const state = activeGalleryViewer
        ? galleryStates.get(activeGalleryViewer)
        : null;
      if (!state) return;

      const nextIndex = state.index + delta;
      if (nextIndex < 0 || nextIndex >= state.length) return;

      state.showSlide(nextIndex);
      syncImage();
    };

    image.addEventListener('load', updateShape);
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    return { open, close, syncChrome, syncImage, step };
  };

  let lightbox = null;

  const getLightbox = () => {
    if (!lightbox) lightbox = createLightbox();
    return lightbox;
  };

  const bindExpandableImage = (display, openAt) => {
    display.classList.add('gallery-page__image--expandable');
    display.setAttribute('role', 'button');
    display.setAttribute('tabindex', '0');
    display.setAttribute('aria-label', 'View expanded image');

    display.addEventListener('click', () => openAt());
    display.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAt();
      }
    });
  };

  const initScreenHover = (display) => {
    if (!display) return null;

    const configEl =
      display.closest('[data-screen-hover]') ||
      (document.body.classList.contains('gallery-page-body--screen-hover')
        ? document.body
        : null);

    if (!configEl) return null;

    const hoverColor =
      configEl.dataset.screenHover ||
      configEl.dataset.hoverColor ||
      document.body.dataset.hoverColor ||
      '#FF705C';

    const wipeHost =
      display.closest('.case-panel') ||
      document.querySelector('.case-panel') ||
      document.body;

    wipeHost.classList.add('case-panel--screen-hover');
    wipeHost.style.setProperty('--screen-hover', hoverColor);

    const hoverTarget = display;

    const setHoverOrigin = (clientX, clientY) => {
      const rect = wipeHost.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const radius =
        Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) + 2;

      wipeHost.style.setProperty('--hover-x', `${x}px`);
      wipeHost.style.setProperty('--hover-y', `${y}px`);
      wipeHost.style.setProperty('--hover-active-radius', `${radius}px`);
    };

    const clearHover = () => {
      wipeHost.classList.remove('is-hover');
      document.body.classList.remove('is-hover');
    };

    const startHover = (clientX, clientY) => {
      setHoverOrigin(clientX, clientY);
      wipeHost.classList.add('is-hover');
      document.body.classList.add('is-hover');
    };

    hoverTarget.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      startHover(event.clientX, event.clientY);
    });

    hoverTarget.addEventListener('pointermove', (event) => {
      if (!wipeHost.classList.contains('is-hover')) return;
      setHoverOrigin(event.clientX, event.clientY);
    });

    hoverTarget.addEventListener('pointerleave', (event) => {
      setHoverOrigin(event.clientX, event.clientY);
      clearHover();
    });

    return clearHover;
  };

  const setActiveGalleryViewer = (viewer) => {
    activeGalleryViewer = viewer;
  };

  const initGalleryViewer = (viewer) => {
    if (viewer.dataset.galleryInit === 'true') return;
    viewer.dataset.galleryInit = 'true';

    const isSingle = viewer.dataset.gallerySingle !== undefined;
    const staticCover = viewer.dataset.galleryStaticCover !== undefined;
    const display = viewer.querySelector('[data-gallery-image]') || viewer.querySelector('.gallery-page__image');

    if (!display) return;

    const clearScreenHover = initScreenHover(display);
    const sources = Array.from(
      viewer.querySelectorAll('[data-gallery-sources] img'),
      (img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
      })
    );

    const coverSrc = display.getAttribute('src');
    let index = staticCover
      ? 0
      : Math.max(0, sources.findIndex((slide) => slide.src === coverSrc));
    if (index < 0) index = 0;

    bindExpandableImage(display, () => {
      clearScreenHover?.();
      setActiveGalleryViewer(viewer);
      if (staticCover) {
        index = 0;
      }
      const slide = sources[index] || {
        src: display.getAttribute('src'),
        alt: display.getAttribute('alt') || '',
      };
      getLightbox().open({
        src: slide.src,
        alt: slide.alt,
      });
    });

    viewer.addEventListener('pointerdown', () => setActiveGalleryViewer(viewer));
    viewer.addEventListener('focusin', () => setActiveGalleryViewer(viewer));

    if (isSingle && sources.length === 0) return;

    const counter = viewer.querySelector('[data-gallery-counter]');
    const prevBtn = viewer.querySelector('.gallery-page__nav--prev');
    const nextBtn = viewer.querySelector('.gallery-page__nav--next');

    if (sources.length === 0) return;

    setActiveGalleryViewer(viewer);

    const updateShape = () => {
      if (!display.naturalWidth) return;
      display.classList.toggle(
        'gallery-page__image--wide',
        display.naturalWidth > display.naturalHeight * 1.15
      );
    };

    const updateCounter = () => {
      if (counter) counter.textContent = `${index + 1} / ${sources.length}`;
    };

    const updateNav = () => {
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === sources.length - 1;
    };

    const showSlide = (nextIndex) => {
      setActiveGalleryViewer(viewer);
      index = nextIndex;

      const applySlide = () => {
        const slide = sources[index];
        if (!slide) return;

        if (!staticCover) {
          display.classList.add('gallery-page__image--fading');

          window.setTimeout(() => {
            const onReady = () => {
              updateShape();
              display.classList.remove('gallery-page__image--fading');
            };

            display.onload = onReady;
            display.onerror = onReady;
            display.src = slide.src;
            display.alt = slide.alt || `Screen ${index + 1}`;

            if (display.complete && display.getAttribute('src') === slide.src) {
              onReady();
            }

            updateCounter();
            updateNav();

            if (lightboxOpen) {
              getLightbox().syncImage();
            }
          }, 150);
          return;
        }

        updateCounter();
        updateNav();

        if (lightboxOpen) {
          getLightbox().syncImage();
        }
      };

      applySlide();
    };

    galleryStates.set(viewer, {
      get index() {
        return index;
      },
      get length() {
        return sources.length;
      },
      slide: () => sources[index] || null,
      showSlide,
    });

    prevBtn?.addEventListener('click', () => {
      if (index > 0) showSlide(index - 1);
    });

    nextBtn?.addEventListener('click', () => {
      if (index < sources.length - 1) showSlide(index + 1);
    });

    display.onload = updateShape;
    if (display.complete) updateShape();
    updateCounter();
    updateNav();
  };

  const initGalleryPage = (root = document) => {
    root.querySelectorAll('[data-gallery-viewer]').forEach(initGalleryViewer);
  };

  document.addEventListener('keydown', (event) => {
    if (lightboxOpen && lightbox) {
      if (event.key === 'Escape') {
        event.preventDefault();
        lightbox.close();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        lightbox.step(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        lightbox.step(1);
        return;
      }

      return;
    }

    if (!activeGalleryViewer?.isConnected) return;

    const state = galleryStates.get(activeGalleryViewer);
    if (!state) return;

    if (event.key === 'ArrowLeft' && state.index > 0) {
      event.preventDefault();
      state.showSlide(state.index - 1);
    }

    if (event.key === 'ArrowRight' && state.index < state.length - 1) {
      event.preventDefault();
      state.showSlide(state.index + 1);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    initGalleryPage(document);
  });

  window.initGalleryPage = initGalleryPage;
})();
