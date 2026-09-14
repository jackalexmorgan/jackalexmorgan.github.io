(() => {
  const tryPlay = (video) => {
    if (!(video instanceof HTMLVideoElement)) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');

    const play = () => {
      const result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    };

    if (video.readyState >= 2) play();
    else {
      video.addEventListener('loadeddata', play, { once: true });
      video.addEventListener('canplay', play, { once: true });
      try {
        video.load();
      } catch (_) {
        /* ignore */
      }
    }
  };

  const initAutoplayVideos = (root = document) => {
    const scope = root.querySelector ? root : document;
    const videos = scope.querySelectorAll(
      'video[autoplay], .case-hero-image video, .design-test__video'
    );

    videos.forEach((video) => {
      if (video.dataset.autoplayInit === 'true') return;
      video.dataset.autoplayInit = 'true';

      tryPlay(video);

      if ('IntersectionObserver' in window) {
        const scrollRoot = video.closest('.case-panel__scroll');
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) tryPlay(video);
              else if (!video.paused) video.pause();
            });
          },
          {
            threshold: 0.15,
            ...(scrollRoot ? { root: scrollRoot } : {}),
          }
        );
        observer.observe(video);
      }
    });
  };

  window.initAutoplayVideos = initAutoplayVideos;

  const boot = () => initAutoplayVideos(document);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) initAutoplayVideos(document);
  });
})();
