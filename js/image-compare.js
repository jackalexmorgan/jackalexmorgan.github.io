(() => {
  const setPosition = (root, percent) => {
    const clamped = Math.min(100, Math.max(0, percent));
    root.style.setProperty('--compare-position', `${clamped}%`);
    const input = root.querySelector('.image-compare__input');
    if (input) {
      input.value = String(Math.round(clamped));
      input.setAttribute('aria-valuenow', String(Math.round(clamped)));
    }
  };

  const syncBeforeWidth = (root) => {
    const beforeImage = root.querySelector('.image-compare__image--before');
    if (!beforeImage) return;
    beforeImage.style.width = `${root.offsetWidth}px`;
  };

  const initImageCompare = (root = document) => {
    root.querySelectorAll('[data-image-compare]').forEach((compare) => {
      if (compare.dataset.imageCompareInit === 'true') return;
      compare.dataset.imageCompareInit = 'true';

      const input = compare.querySelector('.image-compare__input');
      const divider = compare.querySelector('[data-image-compare-divider]');
      const prefersHoverTracking = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      let hovering = false;
      let dragging = false;

      const updateFromClientX = (clientX) => {
        const rect = compare.getBoundingClientRect();
        const percent = ((clientX - rect.left) / rect.width) * 100;
        setPosition(compare, percent);
      };

      const shouldTrackPointer = () => dragging || (prefersHoverTracking && hovering);

      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        dragging = true;
        compare.classList.add('is-dragging');
        compare.setPointerCapture(event.pointerId);
        updateFromClientX(event.clientX);
      };

      const onPointerMove = (event) => {
        if (!shouldTrackPointer()) return;
        updateFromClientX(event.clientX);
      };

      const onPointerUp = (event) => {
        if (!dragging) return;
        dragging = false;
        compare.classList.remove('is-dragging');
        compare.releasePointerCapture(event.pointerId);
      };

      compare.addEventListener('pointerenter', (event) => {
        hovering = true;
        if (prefersHoverTracking) {
          compare.classList.add('is-hover-tracking');
          updateFromClientX(event.clientX);
        }
      });

      compare.addEventListener('pointerleave', () => {
        hovering = false;
        compare.classList.remove('is-hover-tracking');
      });

      compare.addEventListener('pointerdown', onPointerDown);
      compare.addEventListener('pointermove', onPointerMove);
      compare.addEventListener('pointerup', onPointerUp);
      compare.addEventListener('pointercancel', onPointerUp);

      input?.addEventListener('input', () => {
        setPosition(compare, Number(input.value));
      });

      compare.addEventListener('keydown', (event) => {
        const step = event.shiftKey ? 10 : 2;
        const current = Number(input?.value || 50);

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setPosition(compare, current - step);
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setPosition(compare, current + step);
        }
      });

      const resizeObserver =
        'ResizeObserver' in window
          ? new ResizeObserver(() => syncBeforeWidth(compare))
          : null;

      resizeObserver?.observe(compare);

      setPosition(compare, Number(input?.value || 50));
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initImageCompare(document);
  });

  window.initImageCompare = initImageCompare;
})();
