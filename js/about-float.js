document.addEventListener('DOMContentLoaded', () => {
  const about = document.getElementById('about');
  const floatEl = document.getElementById('about-float');
  if (!about || !floatEl) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
  if (reducedMotion || isMobileViewport) return;

  const OBSTACLE_SELECTOR = '.about__heading, .about p, .about__meta';
  const RESTITUTION = 0.74;
  const MOUSE_PUSH = 9.25;
  const MOUSE_PUSH_MAX_SPEED = 5.2;
  const COLLISION_GRACE_MS = 1000;
  const MAX_SPEED = 2.1;
  const MIN_FLOAT_SPEED = 0.1;
  const DRIFT_EASE = 0.034;
  const TEXT_PAD = 18;
  const TEXT_SOLVE_PASSES = 5;
  const EDGE_PAD = 12;
  const ROTATION_RATE = 0.14;
  const FRAME = 1000 / 60;
  const ENTRANCE_RESTITUTION = 0.88;
  const ENTRANCE_FRICTION = 0.996;
  const LAUNCH_SPEED = 0.525;
  const ABOUT_FLOAT_INTRO_KEY = 'designedbyjack:about-float-intro-played';

  let active = false;
  let phase = 'float';
  let floatReady = false;
  let entranceFrames = 0;
  let rafId = null;
  let lastTime = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let mouseX = -9999;
  let mouseY = -9999;
  let lastMouseX = -9999;
  let lastMouseY = -9999;
  let radius = 48;
  let rotation = 0;
  let driftAngle = Math.random() * Math.PI * 2;
  let mouseWasInside = false;
  let collisionFreeUntil = 0;
  let launchStarted = false;
  let introCompleted = false;

  const navEntry = performance.getEntriesByType('navigation')[0];
  if (navEntry?.type === 'reload') {
    sessionStorage.removeItem(ABOUT_FLOAT_INTRO_KEY);
  } else if (sessionStorage.getItem(ABOUT_FLOAT_INTRO_KEY) === '1') {
    introCompleted = true;
  }

  const collisionsDisabled = (time) => time < collisionFreeUntil;

  const clampToBounds = (minX, maxX, minY, maxY) => {
    x = Math.min(maxX, Math.max(minX, x));
    y = Math.min(maxY, Math.max(minY, y));
  };

  const resolveBounds = (minX, maxX, minY, maxY, restitution = RESTITUTION) => {
    if (x < minX) {
      x = minX;
      if (vx < 0) vx = Math.abs(vx) * restitution;
    } else if (x > maxX) {
      x = maxX;
      if (vx > 0) vx = -Math.abs(vx) * restitution;
    }

    if (y < minY) {
      y = minY;
      if (vy < 0) vy = Math.abs(vy) * restitution;
    } else if (y > maxY) {
      y = maxY;
      if (vy > 0) vy = -Math.abs(vy) * restitution;
      if (phase === 'enter' && vy > -2) {
        vy = Math.min(vy * ENTRANCE_RESTITUTION - 2.4, -4.2);
      }
    }

    clampToBounds(minX, maxX, minY, maxY);
  };

  const bounceOffNormal = (nx, ny, restitution = RESTITUTION) => {
    const dot = vx * nx + vy * ny;
    if (dot > 0) {
      vx -= dot * nx * (1 + restitution);
      vy -= dot * ny * (1 + restitution);
      return;
    }
    vx = (vx - 2 * dot * nx) * restitution;
    vy = (vy - 2 * dot * ny) * restitution;
  };

  const resolveCircleRect = (rect, restitution = RESTITUTION) => {
    const closestX = Math.min(Math.max(x, rect.left), rect.right);
    const closestY = Math.min(Math.max(y, rect.top), rect.bottom);
    let dx = x - closestX;
    let dy = y - closestY;
    let dist = Math.hypot(dx, dy);

    if (dist === 0) {
      const penLeft = x - rect.left;
      const penRight = rect.right - x;
      const penTop = y - rect.top;
      const penBottom = rect.bottom - y;
      const minPen = Math.min(penLeft, penRight, penTop, penBottom);
      if (minPen === penLeft) {
        dx = -1;
        dy = 0;
        dist = penLeft;
      } else if (minPen === penRight) {
        dx = 1;
        dy = 0;
        dist = penRight;
      } else if (minPen === penTop) {
        dx = 0;
        dy = -1;
        dist = penTop;
      } else {
        dx = 0;
        dy = 1;
        dist = penBottom;
      }
    }

    if (dist >= radius) return false;

    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    const overlap = radius - dist + 0.5;
    x += nx * overlap;
    y += ny * overlap;
    bounceOffNormal(nx, ny, restitution);
    return true;
  };

  const getObstacles = (aboutRect) => {
    const nodes = about.querySelectorAll(OBSTACLE_SELECTOR);
    const rects = [];

    nodes.forEach((node) => {
      const r = node.getBoundingClientRect();
      rects.push({
        left: r.left - aboutRect.left - TEXT_PAD,
        top: r.top - aboutRect.top - TEXT_PAD,
        right: r.right - aboutRect.left + TEXT_PAD,
        bottom: r.bottom - aboutRect.top + TEXT_PAD,
      });
    });

    return rects;
  };

  const resolveTextObstacles = (aboutRect, restitution = RESTITUTION) => {
    const obstacles = getObstacles(aboutRect);

    for (let pass = 0; pass < TEXT_SOLVE_PASSES; pass += 1) {
      let hit = false;
      obstacles.forEach((rect) => {
        if (resolveCircleRect(rect, restitution)) hit = true;
      });
      if (!hit) break;
    }
  };

  const moveWithCollisions = (dt, minX, maxX, minY, maxY, aboutRect, restitution = RESTITUTION) => {
    const travel = Math.hypot(vx, vy) * dt;
    const maxStep = Math.max(5, radius * 0.22);
    const steps = Math.max(1, Math.ceil(travel / maxStep));

    for (let i = 0; i < steps; i += 1) {
      const stepDt = dt / steps;
      x += vx * stepDt;
      y += vy * stepDt;
      resolveBounds(minX, maxX, minY, maxY, restitution);
      resolveTextObstacles(aboutRect, restitution);
    }
  };

  const clampSpeed = (maxSpeed = MAX_SPEED) => {
    const speed = Math.hypot(vx, vy);
    if (speed <= maxSpeed) return;
    vx = (vx / speed) * maxSpeed;
    vy = (vy / speed) * maxSpeed;
  };

  const applyEntranceFriction = (dt) => {
    const drag = ENTRANCE_FRICTION ** dt;
    vx *= drag;
    vy *= drag;
  };

  const applyFloatFriction = (dt) => {
    const speed = Math.hypot(vx, vy);
    if (speed < 0.00001) {
      vx = Math.cos(driftAngle) * MIN_FLOAT_SPEED;
      vy = Math.sin(driftAngle) * MIN_FLOAT_SPEED;
      return;
    }

    const eased = 1 - Math.exp(-DRIFT_EASE * dt);
    const newSpeed = speed + (MIN_FLOAT_SPEED - speed) * eased;
    const scale = newSpeed / speed;
    vx *= scale;
    vy *= scale;
    driftAngle = Math.atan2(vy, vx);
  };

  const resolveMouse = (time, minX, maxX, minY, maxY, aboutRect) => {
    if (phase !== 'float') return;

    const mx = mouseX;
    const my = mouseY;
    const localX = mx - aboutRect.left;
    const localY = my - aboutRect.top;

    const mdx = x - localX;
    const mdy = y - localY;
    const mdist = Math.hypot(mdx, mdy);
    const inside = mdist < radius && mdist > 0.001;

    if (inside && !mouseWasInside) {
      const nx = mdx / mdist;
      const ny = mdy / mdist;
      const mouseVx = mx - lastMouseX;
      const mouseVy = my - lastMouseY;

      vx = nx * MOUSE_PUSH + mouseVx * 0.2;
      vy = ny * MOUSE_PUSH + mouseVy * 0.2;
      clampSpeed(MOUSE_PUSH_MAX_SPEED);
      driftAngle = Math.atan2(vy, vx);

      x += nx * Math.max(0, radius - mdist + 6);
      y += ny * Math.max(0, radius - mdist + 6);

      collisionFreeUntil = time + COLLISION_GRACE_MS;
      resolveBounds(minX, maxX, minY, maxY, RESTITUTION);
      resolveTextObstacles(aboutRect, RESTITUTION);
    }

    mouseWasInside = inside;
  };

  const measure = () => {
    radius = floatEl.offsetWidth / 2;
  };

  const introAlreadyPlayed = () => introCompleted;

  const markIntroPlayed = () => {
    introCompleted = true;
    sessionStorage.setItem(ABOUT_FLOAT_INTRO_KEY, '1');
  };

  const syncTransform = () => {
    measure();
    floatEl.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0) rotate(${rotation}deg)`;
  };

  const beginEntrance = () => {
    measure();
    const aboutRect = about.getBoundingClientRect();
    const w = aboutRect.width;
    const h = aboutRect.height;
    x = w + radius * 0.55;
    y = h + radius * 1.15;
    vx = -(2.85 + Math.random() * 0.75) * LAUNCH_SPEED;
    vy = -(9.2 + Math.random() * 2) * LAUNCH_SPEED;
    driftAngle = Math.atan2(vy, vx);
    rotation = 22 + Math.random() * 14;
    entranceFrames = 0;
    phase = 'enter';
    launchStarted = true;
  };

  const placeInitial = () => {
    measure();
    const aboutRect = about.getBoundingClientRect();
    const w = aboutRect.width;
    const h = aboutRect.height;
    x = radius + EDGE_PAD + Math.random() * Math.max(0, w - radius * 2 - EDGE_PAD * 2);
    y = radius + EDGE_PAD + Math.random() * Math.max(0, h - radius * 2 - EDGE_PAD * 2);
    driftAngle = Math.random() * Math.PI * 2;
    vx = Math.cos(driftAngle) * MIN_FLOAT_SPEED;
    vy = Math.sin(driftAngle) * MIN_FLOAT_SPEED;
    phase = 'float';
    floatReady = true;
  };

  const finishEntranceIfReady = (minX, maxX, minY, maxY) => {
    entranceFrames += 1;
    const speed = Math.hypot(vx, vy);
    const inside =
      x > minX + radius * 0.15 &&
      x < maxX - radius * 0.15 &&
      y > minY + radius * 0.15 &&
      y < maxY - radius * 0.15;

    if (entranceFrames < 18 || !inside) return;
    if (speed > MAX_SPEED * 0.92) return;

    phase = 'float';
    floatReady = true;
    markIntroPlayed();
    driftAngle = Math.atan2(vy, vx);
  };

  const tick = (time) => {
    if (!active) {
      rafId = null;
      return;
    }

    if (!lastTime) lastTime = time;
    const dt = Math.min(2.5, (time - lastTime) / FRAME);
    lastTime = time;

    measure();
    const aboutRect = about.getBoundingClientRect();
    const maxX = aboutRect.width - radius - EDGE_PAD;
    const maxY = aboutRect.height - radius - EDGE_PAD;
    const minX = radius + EDGE_PAD;
    const minY = radius + EDGE_PAD;

    if (phase === 'enter') {
      const preSpeed = Math.hypot(vx, vy);
      if (preSpeed > 2.4) {
        applyEntranceFriction(dt);
      } else {
        applyFloatFriction(dt);
      }

      const enterRestitution = preSpeed > 2.4 ? ENTRANCE_RESTITUTION : RESTITUTION;
      moveWithCollisions(dt, minX, maxX, minY, maxY, aboutRect, enterRestitution);

      const speed = Math.hypot(vx, vy);
      rotation += speed * ROTATION_RATE * dt;
      finishEntranceIfReady(minX, maxX, minY, maxY);
    } else {
      applyFloatFriction(dt);

      moveWithCollisions(dt, minX, maxX, minY, maxY, aboutRect, RESTITUTION);

      resolveMouse(time, minX, maxX, minY, maxY, aboutRect);
      resolveBounds(minX, maxX, minY, maxY, RESTITUTION);
      resolveTextObstacles(aboutRect, RESTITUTION);

      const speed = Math.hypot(vx, vy);
      const speedCap = collisionsDisabled(time) ? MOUSE_PUSH_MAX_SPEED : MAX_SPEED;
      clampSpeed(speedCap);
      rotation += speed * ROTATION_RATE * dt;
    }

    floatEl.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0) rotate(${rotation}deg)`;

    lastMouseX = mouseX;
    lastMouseY = mouseY;
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (active) return;
    active = true;
    lastTime = 0;
    mouseWasInside = false;
    floatEl.classList.add('is-active');

    const shouldLaunch = !introAlreadyPlayed() && !launchStarted;

    if (shouldLaunch) {
      collisionFreeUntil = 0;
      beginEntrance();
    } else if (introAlreadyPlayed() && !floatReady && phase !== 'enter') {
      placeInitial();
      syncTransform();
    } else {
      syncTransform();
    }

    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    active = false;
    floatEl.classList.remove('is-active');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) start();
        else stop();
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
  );

  observer.observe(about);

  window.addEventListener(
    'pointermove',
    (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      if (!active || phase === 'enter') return;
      if (floatReady) placeInitial();
    },
    { passive: true }
  );
});
