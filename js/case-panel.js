document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('case-panel');
  const scrollHost = panel?.querySelector('.case-panel__scroll');
  const homePanels = document.querySelector('.home-panels');
  if (!panel || !scrollHost) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionMs = prefersReducedMotion ? 0 : 550;
  let isOpen = panel.classList.contains('case-panel--open');
  let isAnimating = false;

  const resolveFromSiteRoot = (href) => new URL(href, `${window.location.origin}/`);

  const isSiteHomeHref = (href) => {
    if (!href || href.startsWith('#')) return false;

    const { pathname } = resolveFromSiteRoot(href);
    return pathname === '/' || pathname === '/index.html';
  };

  const siteHomePath = () => {
    const path = resolveFromSiteRoot('index.html').pathname;
    return path.endsWith('/index.html') ? path : '/';
  };

  const rewriteUrls = (root, baseUrl) => {
    root.querySelectorAll('[src], [href]').forEach((el) => {
      const attr = el.hasAttribute('src') ? 'src' : 'href';
      const value = el.getAttribute(attr);
      if (!value || /^(https?:|mailto:|#|data:|tel:)/.test(value)) return;

      const resolved = new URL(value, baseUrl);
      if (attr === 'href' && isSiteHomeHref(resolved.pathname + resolved.search + resolved.hash)) {
        el.setAttribute(attr, siteHomePath() + resolved.search + resolved.hash);
        return;
      }

      el.setAttribute(attr, resolved.pathname + resolved.search + resolved.hash);
    });
  };

  const initSeeAlsoLinks = (root = document) => {
    root.querySelectorAll('.case-footer p em a[data-hover-color]').forEach((link) => {
      if (link.dataset.seeAlsoInit === 'true') return;
      link.dataset.seeAlsoInit = 'true';
      link.style.setProperty('--see-also-hover', link.dataset.hoverColor);
    });
  };

  const initReveals = (root) => {
    const reveals = root.querySelectorAll('.reveal:not(.visible)');

    if (reveals.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('visible'));
      return;
    }

    const scrollRoot =
      root instanceof Element && root.classList.contains('case-panel__scroll')
        ? root
        : null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px 0px 0px',
        ...(scrollRoot ? { root: scrollRoot } : {}),
      }
    );

    reveals.forEach((el) => observer.observe(el));
  };

  const revealVisibleInScroll = (container) => {
    if (!(container instanceof Element)) return;

    const bounds = container.getBoundingClientRect();

    container.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > bounds.top + 8 && rect.top < bounds.bottom - 8) {
        el.classList.add('visible');
      }
    });
  };

  const setOpenState = (open) => {
    isOpen = open;
    panel.classList.toggle('case-panel--open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('case-open', open);

    if (homePanels) {
      homePanels.setAttribute('aria-hidden', open ? 'true' : 'false');
    }
  };

  const waitForTransition = () =>
    new Promise((resolve) => {
      if (prefersReducedMotion || transitionMs === 0) {
        resolve();
        return;
      }

      const onEnd = (event) => {
        if (event.target !== panel || event.propertyName !== 'transform') return;
        panel.removeEventListener('transitionend', onEnd);
        resolve();
      };

      panel.addEventListener('transitionend', onEnd);
      window.setTimeout(resolve, transitionMs + 50);
    });

  const openPanel = async (url, { push = true } = {}) => {
    if (isAnimating) return;

    const absoluteUrl = new URL(url, window.location.href).href;

    if (isOpen && panel.dataset.caseUrl === absoluteUrl) return;

    isAnimating = true;

    try {
      if (isOpen) {
        setOpenState(false);
        await waitForTransition();
      }

      const response = await fetch(absoluteUrl);
      if (!response.ok) throw new Error('Failed to load case study');

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const casePage = doc.querySelector('.case-page');

      if (!casePage) {
        window.location.href = absoluteUrl;
        return;
      }

      scrollHost.innerHTML = '';
      scrollHost.appendChild(casePage);
      rewriteUrls(scrollHost, absoluteUrl);
      panel.dataset.caseUrl = absoluteUrl;

      if (doc.title) document.title = doc.title;

      scrollHost.scrollTop = 0;
      initSeeAlsoLinks(scrollHost);

      if (typeof window.initGalleryPage === 'function') {
        window.initGalleryPage(scrollHost);
      }

      if (typeof window.initImageCompare === 'function') {
        window.initImageCompare(scrollHost);
      }

      setOpenState(true);
      await waitForTransition();

      initReveals(scrollHost);
      revealVisibleInScroll(scrollHost);

      if (push) {
        history.pushState({ panelUrl: absoluteUrl }, '', new URL(absoluteUrl).pathname);
      }
    } catch {
      window.location.href = url;
    } finally {
      isAnimating = false;
    }
  };

  const closePanel = async ({ push = true, redirectTo = null } = {}) => {
    if (!isOpen || isAnimating) return;

    isAnimating = true;
    setOpenState(false);
    await waitForTransition();

    const standalone = !homePanels;

    if (standalone || redirectTo) {
      const homeHref = redirectTo || siteHomePath();
      window.location.href = resolveFromSiteRoot(homeHref).href;
      return;
    }

    panel.dataset.caseUrl = '';
    scrollHost.innerHTML = '';
    document.title = document.body.dataset.homeTitle || document.title;

    if (push) {
      history.pushState({}, '', siteHomePath());
    }

    isAnimating = false;
  };

  const isPanelLink = (anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || anchor.target === '_blank') return false;
    return /work\/(?:galleries\/[^/]+|[^/]+)\/index\.html/.test(href);
  };

  const isHomeLink = (anchor) => isSiteHomeHref(anchor.getAttribute('href'));

  document.addEventListener('click', (event) => {
    const caseLink = event.target.closest('a');
    if (!caseLink) return;

    if (isPanelLink(caseLink)) {
      event.preventDefault();
      openPanel(caseLink.href);
      return;
    }

    if (!isOpen) return;

    if (caseLink.classList.contains('case-back')) {
      event.preventDefault();
      if (homePanels) {
        closePanel();
      } else {
        closePanel({ redirectTo: caseLink.getAttribute('href') });
      }
      return;
    }

    if (homePanels && isHomeLink(caseLink)) {
      event.preventDefault();
      closePanel();
      return;
    }

    if (!homePanels && isHomeLink(caseLink)) {
      event.preventDefault();
      closePanel({ redirectTo: caseLink.getAttribute('href') });
    }
  });

  window.addEventListener('popstate', (event) => {
    const panelUrl = event.state?.panelUrl || event.state?.caseStudy;
    if (panelUrl) {
      openPanel(panelUrl, { push: false });
      return;
    }

    if (isOpen) {
      closePanel({ push: false });
    }
  });

  scrollHost.addEventListener(
    'scroll',
    () => {
      revealVisibleInScroll(scrollHost);
    },
    { passive: true }
  );

  const isStandaloneCase = panel.querySelector('.case-page') && !homePanels;

  if (isStandaloneCase) {
    document.body.dataset.homeTitle = document.body.dataset.homeTitle || 'Jack Morgan | Product Designer';
    panel.dataset.caseUrl = window.location.href;
    initSeeAlsoLinks(scrollHost);

    const bootReveals = () => {
      initReveals(scrollHost);
      revealVisibleInScroll(scrollHost);
    };

    if (!prefersReducedMotion) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOpenState(true);
          bootReveals();
        });
      });
    } else {
      setOpenState(true);
      bootReveals();
    }
  } else {
    document.body.dataset.homeTitle = document.title;
    panel.setAttribute('aria-hidden', 'true');
  }
});
