document.addEventListener('DOMContentLoaded', () => {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cursor = document.createElement('div');
  cursor.className = 'floating-cursor is-hidden';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <span class="floating-cursor__ring" aria-hidden="true">
      <svg class="floating-cursor__icon floating-cursor__icon--zoom-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="6"></circle>
        <path d="M14.5 14.5 19 19"></path>
        <path d="M10 7.5v5"></path>
        <path d="M7.5 10h5"></path>
      </svg>
      <svg class="floating-cursor__icon floating-cursor__icon--zoom-out" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="6"></circle>
        <path d="M14.5 14.5 19 19"></path>
        <path d="M7.5 10h5"></path>
      </svg>
    </span>
  `;
  document.body.appendChild(cursor);
  document.body.classList.add('has-floating-cursor');

  const ring = cursor.querySelector('.floating-cursor__ring');

  let ringX = 0;
  let ringY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;
  let hasEntered = false;

  const setRing = (x, y) => {
    ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  const render = () => {
    const ringEase = reducedMotion ? 1 : 0.2;

    ringX += (targetX - ringX) * ringEase;
    ringY += (targetY - ringY) * ringEase;

    setRing(ringX, ringY);

    if (Math.hypot(targetX - ringX, targetY - ringY) > 0.2) {
      rafId = requestAnimationFrame(render);
    } else {
      ringX = targetX;
      ringY = targetY;
      setRing(ringX, ringY);
      rafId = null;
    }
  };

  const moveTo = (clientX, clientY) => {
    targetX = clientX;
    targetY = clientY;
    if (!rafId) rafId = requestAnimationFrame(render);
  };

  const showCursor = (clientX, clientY) => {
    hasEntered = true;
    ringX = clientX;
    ringY = clientY;
    setRing(ringX, ringY);
    moveTo(clientX, clientY);
    cursor.classList.remove('is-hidden');
  };

  const hideCursor = () => {
    hasEntered = false;
    cursor.classList.add('is-hidden');
  };

  document.addEventListener('mousemove', (event) => {
    if (!hasEntered) showCursor(event.clientX, event.clientY);
    else moveTo(event.clientX, event.clientY);
  });

  document.documentElement.addEventListener('mouseleave', hideCursor);

  document.addEventListener('mousedown', () => {
    cursor.classList.add('is-pressed');
  });

  document.addEventListener('mouseup', () => {
    cursor.classList.remove('is-pressed');
  });

  document.addEventListener('mouseover', (event) => {
    const zoomOut = event.target.closest('.gallery-lightbox__backdrop');
    const zoomIn = event.target.closest('.gallery-page__image--expandable');
    const block = event.target.closest('.block');
    const interactive = event.target.closest(
      'a, button, [role="button"], input, textarea, select, label, summary, .block'
    );

    cursor.classList.toggle('is-zoom-out', Boolean(zoomOut));
    cursor.classList.toggle('is-zoom-in', Boolean(zoomIn) && !zoomOut);
    cursor.classList.toggle('is-hover', Boolean(interactive) && !zoomIn && !zoomOut);
    cursor.classList.toggle('is-on-block', Boolean(block) && !zoomIn && !zoomOut);
  });
});
