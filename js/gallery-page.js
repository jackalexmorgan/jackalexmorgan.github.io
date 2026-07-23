(() => {
  let activeGalleryViewer = null;
  let lightboxOpen = false;
  let lightboxReturnFocus = null;
  const galleryStates = new WeakMap();

  const CLOSE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';

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
        <figure class="gallery-lightbox__figure">
          <img class="gallery-lightbox__image" src="" alt="">
        </figure>
      </div>
    `;
    document.body.appendChild(root);

    const backdrop = root.querySelector('.gallery-lightbox__backdrop');
    const closeBtn = root.querySelector('.gallery-lightbox__close');
    const image = root.querySelector('.gallery-lightbox__image');

    const updateShape = () => {
      if (!image.naturalWidth) return;
      image.classList.toggle(
        'gallery-lightbox__image--wide',
        image.naturalWidth > image.naturalHeight * 1.15
      );
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
      root.hidden = false;

      requestAnimationFrame(() => {
        root.classList.add('gallery-lightbox--open');
        closeBtn.focus();
      });

      lightboxOpen = true;
      document.body.classList.add('gallery-lightbox-open');
    };

    image.addEventListener('load', updateShape);
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);

    return { open, close };
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

  const setActiveGalleryViewer = (viewer) => {
    activeGalleryViewer = viewer;
  };

  const initGalleryViewer = (viewer) => {
    if (viewer.dataset.galleryInit === 'true') return;
    viewer.dataset.galleryInit = 'true';

    const isSingle = viewer.dataset.gallerySingle !== undefined;
    const display = viewer.querySelector('[data-gallery-image]') || viewer.querySelector('.gallery-page__image');

    if (!display) return;

    bindExpandableImage(display, () => {
      setActiveGalleryViewer(viewer);
      getLightbox().open({
        src: display.getAttribute('src'),
        alt: display.getAttribute('alt') || '',
      });
    });

    viewer.addEventListener('pointerdown', () => setActiveGalleryViewer(viewer));
    viewer.addEventListener('focusin', () => setActiveGalleryViewer(viewer));

    if (isSingle) return;

    const counter = viewer.querySelector('[data-gallery-counter]');
    const prevBtn = viewer.querySelector('.gallery-page__nav--prev');
    const nextBtn = viewer.querySelector('.gallery-page__nav--next');
    const sources = Array.from(
      viewer.querySelectorAll('[data-gallery-sources] img'),
      (img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
      })
    );

    if (sources.length === 0) return;

    setActiveGalleryViewer(viewer);

    let index = 0;

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
      display.classList.add('gallery-page__image--fading');

      window.setTimeout(() => {
        const nextSrc = sources[index].src;
        const onReady = () => {
          updateShape();
          display.classList.remove('gallery-page__image--fading');
        };

        display.onload = onReady;
        display.onerror = onReady;
        display.src = nextSrc;
        display.alt = sources[index].alt || `Screen ${index + 1}`;

        if (display.complete && display.getAttribute('src') === nextSrc) {
          onReady();
        }

        updateCounter();
        updateNav();
      }, 150);
    };

    galleryStates.set(viewer, {
      get index() {
        return index;
      },
      get length() {
        return sources.length;
      },
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
