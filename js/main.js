document.addEventListener('DOMContentLoaded', () => {
  const initHeroTypewriter = () => {
    const line1 = document.getElementById('hero-line-1');
    const line1Wrap = document.getElementById('hero-line-1-wrap');
    const line2Wrap = document.getElementById('hero-line-2-wrap');
    const line3Wrap = document.getElementById('hero-line-3-wrap');
    const prefix = document.getElementById('hero-prefix');
    const designPrefix = document.getElementById('hero-design');
    const rotating = document.getElementById('hero-rotating');
    const cursor = document.getElementById('hero-cursor');
    const title = document.querySelector('.hero__title');

    if (!line1 || !prefix || !designPrefix || !rotating || !cursor || !title) return;

    const line1Text = "Hi! I'm Jack 👋";
    const line2Prefix = "I'm a Digital Product Designer and I";
    const line3Prefix = 'design ';
    const START_PHRASE_TEXT = 'exceptional experiences';
    const phrases = [
      { text: 'exceptional experiences', emoji: '✨', color: '#f3e8ff' },
      { text: 'AI native flows', emoji: '🤖', color: '#ccf2fb' },
      { text: 'powerful web apps', emoji: '🌐', color: '#d4e8ff' },
      { text: 'beautiful mobile apps', emoji: '📲', color: '#ccf5dd' },
      { text: 'data driven products', emoji: '📊', color: '#ddd4ff' },
      { text: 'products people love', emoji: '❤️', color: '#ffd4e5' },
      { text: 'frictionless interactions', emoji: '🌊', color: '#c2ebff' },
      { text: 'interfaces that scale', emoji: '📈', color: '#c8f5c8' },
      { text: 'human-centered software', emoji: '💻', color: '#dce3f5' },
      { text: 'seamless user journeys', emoji: '🚀', color: '#eadcff' },
      { text: 'intelligent interfaces', emoji: '🧠', color: '#ffe0f0' },
      { text: 'solutions that stick', emoji: '🎯', color: '#ffe4c7' },
      { text: 'the next big thing', emoji: '🏆', color: '#fff0c8' },
      { text: 'innovative solutions', emoji: '💡', color: '#fff8cc' },
      { text: 'pixel-perfect handoffs', emoji: '📐', color: '#e8f0ff' },
      { text: 'designs devs love to build', emoji: '🛠️', color: '#dfe8f0' },
      { text: 'digital game-changers', emoji: '⛳️', color: '#ddf8e8' },
    ];

    const RECENT_COOLDOWN = 4;

    const getStartPhrase = () =>
      phrases.find((phrase) => phrase.text === START_PHRASE_TEXT) ?? phrases[0];

    const pickNextPhrase = (current, recentTexts) => {
      const blocked = new Set(recentTexts);
      const options = phrases.filter((phrase) => !blocked.has(phrase.text));

      if (options.length > 0) {
        return options[Math.floor(Math.random() * options.length)];
      }

      const fallback = phrases.filter((phrase) => phrase.text !== current.text);
      return fallback[Math.floor(Math.random() * fallback.length)];
    };

    const HERO_INTRO_KEY = 'designedbyjack:hero-intro-played';

    const introAlreadyPlayed = () => sessionStorage.getItem(HERO_INTRO_KEY) === '1';

    const markIntroPlayed = () => {
      sessionStorage.setItem(HERO_INTRO_KEY, '1');
    };

    const SPEED = 1.144;
    const ms = (value) => Math.round(value / SPEED);

    const TYPE_MS = ms(24);
    const LINE1_TYPE_MS = ms(31);
    const DELETE_MS = ms(16);
    const getRotatePauseMs = () => 2300 + Math.random() * (3900 - 2300);
    const CURSOR_BLINK_MS = ms(1000);
    const START_CURSOR_BLINKS = 2;
    const LINE1_PAUSE_MS = ms(1500);
    const MID_TYPE_PAUSE_MS = ms(1000);
    const CHROME_DELAY_MS = ms(500);
    const PRE_TYPE_PAUSE_MS = ms(750);
    const DYNAMIC_TYPE_MS = ms(30);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const phraseLabel = (phrase) => `${phrase.text}! ${phrase.emoji}`;

    const chromeEls = () => document.querySelectorAll('.hero-chrome');

    const showChrome = () => {
      chromeEls().forEach((el) => {
        el.classList.add('is-visible');
        el.removeAttribute('aria-hidden');
      });
    };

    const placeCursor = (parent) => {
      parent.appendChild(cursor);
    };

    const clearHighlight = () => {
      rotating.style.backgroundColor = 'transparent';
      rotating.style.removeProperty('--highlight-bg');
    };

    const setHighlight = (phrase) => {
      rotating.style.setProperty('--highlight-bg', phrase.color);
      rotating.style.backgroundColor = phrase.color;
    };

    const fullHeroLabel = (phrase) =>
      `${line1Text} ${line2Prefix} ${line3Prefix}${phraseLabel(phrase)}`;

    const setFullText = (phrase = getStartPhrase()) => {
      line1.textContent = line1Text;
      line2Wrap.hidden = false;
      line3Wrap.hidden = false;
      prefix.textContent = line2Prefix;
      designPrefix.textContent = line3Prefix;
      rotating.textContent = phraseLabel(phrase);
      setHighlight(phrase);
      placeCursor(line3Wrap);
      title.setAttribute('aria-label', fullHeroLabel(phrase));
    };

    if (prefersReducedMotion) {
      setFullText();
      showChrome();
      return;
    }

    const typeInto = async (el, text, { speed = TYPE_MS, pauseAfter = [] } = {}) => {
      const chars = [...text];
      for (let i = 1; i <= chars.length; i += 1) {
        const current = chars.slice(0, i).join('');
        el.textContent = current;
        await sleep(speed);
        if (pauseAfter.includes(current)) {
          await sleep(MID_TYPE_PAUSE_MS);
        }
      }
    };

    const deleteFrom = async (el, speed = DELETE_MS) => {
      while (el.textContent.length > 0) {
        el.textContent = [...el.textContent].slice(0, -1).join('');
        await sleep(speed);
      }
    };

    const deletePhrase = async () => {
      await deleteFrom(rotating);
      clearHighlight();
    };

    const typePhrase = async (phrase) => {
      await sleep(PRE_TYPE_PAUSE_MS);
      setHighlight(phrase);
      await typeInto(rotating, phraseLabel(phrase), { speed: DYNAMIC_TYPE_MS });
    };

    const announce = (phrase) => {
      title.setAttribute('aria-label', fullHeroLabel(phrase));
    };

    const revealChrome = async () => {
      await sleep(CHROME_DELAY_MS);
      showChrome();
    };

    const runRotationLoop = async (currentPhrase, recentTexts) => {
      while (true) {
        await sleep(getRotatePauseMs());

        const nextPhrase = pickNextPhrase(currentPhrase, recentTexts);

        await deletePhrase();
        await typePhrase(nextPhrase);
        announce(nextPhrase);
        currentPhrase = nextPhrase;
        recentTexts = [...recentTexts, nextPhrase.text].slice(-RECENT_COOLDOWN);
      }
    };

    const runIntro = async () => {
      placeCursor(line1Wrap);
      await sleep(CURSOR_BLINK_MS * START_CURSOR_BLINKS);
      await typeInto(line1, line1Text, { pauseAfter: ['Hi!'], speed: LINE1_TYPE_MS });
      await sleep(LINE1_PAUSE_MS);

      line2Wrap.hidden = false;
      placeCursor(line2Wrap);
      await typeInto(prefix, line2Prefix);

      line3Wrap.hidden = false;
      placeCursor(line3Wrap);
      await typeInto(designPrefix, line3Prefix);

      const currentPhrase = getStartPhrase();
      const recentTexts = [currentPhrase.text];
      await typePhrase(currentPhrase);
      announce(currentPhrase);

      markIntroPlayed();
      revealChrome();
      runRotationLoop(currentPhrase, recentTexts);
    };

    const resumeHero = () => {
      const currentPhrase = getStartPhrase();
      const recentTexts = [currentPhrase.text];

      setFullText(currentPhrase);
      showChrome();
      runRotationLoop(currentPhrase, recentTexts);
    };

    if (introAlreadyPlayed()) {
      resumeHero();
    } else {
      runIntro();
    }
  };

  initHeroTypewriter();

  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  const initBlockHover = () => {
    const blocks = document.querySelectorAll('.block');

    const setHoverOrigin = (block, clientX, clientY) => {
      const rect = block.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const radius = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y)
      ) + 2;

      block.style.setProperty('--hover-x', `${x}px`);
      block.style.setProperty('--hover-y', `${y}px`);
      block.style.setProperty('--hover-active-radius', `${radius}px`);
    };

    blocks.forEach((block) => {
      const hoverColor = block.dataset.hoverColor;
      if (hoverColor) {
        block.style.setProperty('--block-hover', hoverColor);
      }

      block.addEventListener('mouseenter', (event) => {
        setHoverOrigin(block, event.clientX, event.clientY);
        block.classList.add('is-hover');
      });

      block.addEventListener('mousemove', (event) => {
        if (!block.classList.contains('is-hover')) return;
        setHoverOrigin(block, event.clientX, event.clientY);
      });

      block.addEventListener('mouseleave', (event) => {
        setHoverOrigin(block, event.clientX, event.clientY);
        block.classList.remove('is-hover');
      });

      block.addEventListener('focus', () => {
        const rect = block.getBoundingClientRect();
        setHoverOrigin(block, rect.left + rect.width / 2, rect.top + rect.height / 2);
        block.classList.add('is-hover');
      });

      block.addEventListener('blur', () => {
        block.classList.remove('is-hover');
      });
    });
  };

  initBlockHover();

  const initHeaderScroll = () => {
    const header = document.querySelector('.site-header');
    if (!header || !document.querySelector('.home-panels')) return;

    const updateHeader = () => {
      header.classList.toggle('site-header--static', window.scrollY > 32);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  };

  initHeaderScroll();
});
