(() => {
  const mq = window.matchMedia('(max-width: 640px)');

  const closeConnect = (nav, connect, toggle, tray) => {
    connect.classList.remove('is-open');
    nav.classList.remove('is-connect-open');
    toggle.setAttribute('aria-expanded', 'false');
    tray?.setAttribute('aria-hidden', 'true');
  };

  const initConnectNav = (root = document) => {
    const scope = root.querySelector ? root : document;

    scope.querySelectorAll('.site-header__nav').forEach((nav) => {
      const connect = nav.querySelector('.site-header__connect');
      const toggle = nav.querySelector('.site-header__connect-toggle');
      const tray = connect?.querySelector('.site-header__connect-tray');
      if (!connect || !toggle || !tray || toggle.dataset.connectInit === 'true') return;

      toggle.dataset.connectInit = 'true';

      const setOpen = (open) => {
        connect.classList.toggle('is-open', open);
        nav.classList.toggle('is-connect-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        tray.setAttribute('aria-hidden', open ? 'false' : 'true');
      };

      setOpen(false);

      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!mq.matches) return;
        setOpen(!connect.classList.contains('is-open'));
      });

      document.addEventListener('click', (event) => {
        if (!document.contains(nav)) return;
        if (!nav.contains(event.target)) {
          closeConnect(nav, connect, toggle, tray);
        }
      });

      mq.addEventListener?.('change', (event) => {
        if (!event.matches) closeConnect(nav, connect, toggle, tray);
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
