(() => {
  const cleanups = new WeakMap();

  const initCaseHeaderLogo = (root = document) => {
    const scope = root.querySelector ? root : document;
    const headers = scope.querySelectorAll('.case-header--sticky-logo');

    headers.forEach((headerEl) => {
      const page = headerEl.closest('.case-page') || scope;
      const heroLogo =
        page.querySelector('[data-header-logo-sentinel]') ||
        page.querySelector('.case-hero__logo-img') ||
        page.querySelector('.case-hero h1');

      if (!heroLogo) return;

      const prev = cleanups.get(headerEl);
      if (prev) prev();

      const scrollRoot = headerEl.closest('.case-panel__scroll');
      const headerHeight = headerEl.offsetHeight || 72;
      const logoLink = headerEl.querySelector('.case-header__logo-link');

      const sync = () => {
        const headerBottom = headerEl.getBoundingClientRect().bottom;
        const logoBottom = heroLogo.getBoundingClientRect().bottom;
        const stuck = logoBottom <= headerBottom + 1;
        headerEl.classList.toggle('is-logo-stuck', stuck);
        if (logoLink) {
          logoLink.setAttribute('aria-hidden', stuck ? 'false' : 'true');
          logoLink.tabIndex = stuck ? 0 : -1;
        }
      };

      const scrollToTop = (event) => {
        event.preventDefault();
        if (scrollRoot) {
          scrollRoot.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      const observer = new IntersectionObserver(() => sync(), {
        root: scrollRoot || null,
        rootMargin: `-${headerHeight}px 0px 0px 0px`,
        threshold: [0, 0.01, 1],
      });

      observer.observe(heroLogo);

      const scrollTarget = scrollRoot || window;
      scrollTarget.addEventListener('scroll', sync, { passive: true });
      if (logoLink) {
        logoLink.addEventListener('click', scrollToTop);
      }

      cleanups.set(headerEl, () => {
        observer.disconnect();
        scrollTarget.removeEventListener('scroll', sync);
        if (logoLink) {
          logoLink.removeEventListener('click', scrollToTop);
        }
      });

      sync();
    });
  };

  window.initCaseHeaderLogo = initCaseHeaderLogo;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCaseHeaderLogo(document));
  } else {
    initCaseHeaderLogo(document);
  }
})();
