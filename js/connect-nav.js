(() => {
  const mq = window.matchMedia('(max-width: 640px)');

  const closeConnect = (nav, connect, toggle) => {
    connect.classList.remove('is-open');
    nav.classList.remove('is-connect-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const initConnectNav = (root = document) => {
    const scope = root.querySelector ? root : document;

    scope.querySelectorAll('.site-header__nav').forEach((nav) => {
      const connect = nav.querySelector('.site-header__connect');
      const toggle = nav.querySelector('.site-header__connect-toggle');
      if (!connect || !toggle || toggle.dataset.connectInit === 'true') return;

      toggle.dataset.connectInit = 'true';

      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!mq.matches) return;

        const open = !connect.classList.contains('is-open');
        connect.classList.toggle('is-open', open);
        nav.classList.toggle('is-connect-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });

      document.addEventListener('click', (event) => {
        if (!nav.contains(event.target)) {
          closeConnect(nav, connect, toggle);
        }
      });

      mq.addEventListener?.('change', (event) => {
        if (!event.matches) closeConnect(nav, connect, toggle);
      });
    });
  };

  window.initConnectNav = initConnectNav;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initConnectNav(document));
  } else {
    initConnectNav(document);
  }
})();
