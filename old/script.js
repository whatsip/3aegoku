/**
 * LUMINARY — script.js
 * ─────────────────────────────────────────────────────────────
 * Modules:
 *  1. Custom Cursor
 *  2. Header scroll behaviour
 *  3. Mobile nav toggle
 *  4. Slider (translate, scale hierarchy, dots)
 *  5. Mouse parallax tilt on slide cards
 *  6. Scroll reveal (Intersection Observer)
 *  7. Hero parallax layers (scroll-based)
 *  8. About image parallax (scroll-based)
 *  9. Wheel → horizontal scroll mapping
 * 10. Touch / swipe support
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */

/**
 * Clamp a value between min and max.
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Debounce: delay execution until after wait ms have passed since the last call.
 */
function debounce(fn, wait = 80) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * RAF-throttle: coalesce rapid calls into one per animation frame.
 */
function rafThrottle(fn) {
  let rafId = null;
  return (...args) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}

/* ═══════════════════════════════════════════
   1. CUSTOM CURSOR — 3-layer parallax crosshair
   ─ Layer 1: dot      follows instantly
   ─ Layer 2: cross    lerp 0.22 — medium lag
   ─ Layer 3: reticle  lerp 0.09 — heavy lag
   Velocity stretches the reticle along movement axis.
   On hover over interactive elements: reticle "locks".
═══════════════════════════════════════════ */
(function initCursor() {
  const dot   = document.getElementById('cursorDot');
  const cross = document.getElementById('cursorCross');
  const ring  = document.getElementById('cursorRing');

  if (!dot || !cross || !ring) return;

  // Disable on touch devices — restore default cursor
  if (window.matchMedia('(hover: none)').matches) {
    [dot, cross, ring].forEach(el => el.style.display = 'none');
    document.body.style.cursor = 'auto';
    return;
  }

  // Raw mouse position (follows instantly)
  let mx = -300, my = -300;

  // Layer 2 — cross (medium inertia)
  let cx = -300, cy = -300;

  // Layer 3 — ring (heavy inertia)
  let rx = -300, ry = -300;

  // Previous ring position — for velocity calc
  let prevRx = -300, prevRy = -300;

  // Rotation angle for cross (slowly spins)
  let crossAngle = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  // Hover state
  let isHover = false;
  const interactiveSel = 'a, button, [role="button"], .slide-item, .dual-box, input, textarea, .slider-arrow';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSel)) {
      isHover = true;
      dot.classList.add('cursor-hover');
      ring.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSel)) {
      isHover = false;
      dot.classList.remove('cursor-hover');
      ring.classList.remove('cursor-hover');
    }
  });

  // Hide/show on window leave/enter
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = cross.style.opacity = ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = cross.style.opacity = ring.style.opacity = '1';
  });

  function animateCursor() {
    requestAnimationFrame(animateCursor);

    // ── Layer 1: dot (instant) ──
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    // ── Layer 2: cross (lerp 0.22) ──
    cx += (mx - cx) * 0.22;
    cy += (my - cy) * 0.22;
    crossAngle += isHover ? 1.8 : 0.5; // spin faster on hover
    cross.style.left      = cx + 'px';
    cross.style.top       = cy + 'px';
    cross.style.transform = `translate(-50%, -50%) rotate(${crossAngle}deg)`;

    // ── Layer 3: ring (lerp 0.09) ──
    prevRx = rx;
    prevRy = ry;
    rx += (mx - rx) * 0.09;
    ry += (my - ry) * 0.09;

    // Velocity → elongate ring along movement direction
    const vx   = rx - prevRx;
    const vy   = ry - prevRy;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const stretchX = 1 + clamp(Math.abs(vx) * 0.045, 0, 0.55);
    const stretchY = 1 + clamp(Math.abs(vy) * 0.045, 0, 0.55);
    // Angle of movement
    const moveAngle = speed > 0.3 ? Math.atan2(vy, vx) * (180 / Math.PI) : 0;

    ring.style.left      = rx + 'px';
    ring.style.top       = ry + 'px';
    // Apply velocity stretch — shrink perpendicular to motion
    if (!isHover && speed > 0.3) {
      ring.style.transform = `translate(-50%, -50%) rotate(${moveAngle}deg) scaleX(${stretchX}) scaleY(${1 / stretchX * 0.96})`;
    } else if (isHover) {
      // Locked state — slight pulse scale
      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.04;
      ring.style.transform = `translate(-50%, -50%) scale(${pulse})`;
    } else {
      ring.style.transform = `translate(-50%, -50%)`;
    }
  }

  animateCursor();
})();

/* ═══════════════════════════════════════════
   2. HEADER SCROLL BEHAVIOUR
═══════════════════════════════════════════ */
(function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const update = rafThrottle(() => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  window.addEventListener('scroll', update, { passive: true });
  update(); // run once on load
})();

/* ═══════════════════════════════════════════
   3. MOBILE NAV TOGGLE
═══════════════════════════════════════════ */
(function initMobileNav() {
  const btn    = document.getElementById('hamburger');
  const nav    = document.getElementById('mobileNav');
  const links  = nav ? nav.querySelectorAll('.mob-link') : [];
  if (!btn || !nav) return;

  function open() {
    btn.classList.add('open');
    nav.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    nav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    btn.classList.remove('open');
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? close() : open();
  });

  // Close on link click
  links.forEach(link => link.addEventListener('click', close));

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();

/* ═══════════════════════════════════════════
   4. SLIDER
═══════════════════════════════════════════ */
const Slider = (function initSlider() {
  const track    = document.getElementById('sliderTrack');
  const viewport = document.getElementById('sliderViewport');
  const btnPrev  = document.getElementById('sliderPrev');
  const btnNext  = document.getElementById('sliderNext');
  const dotsWrap = document.getElementById('sliderDots');

  if (!track) return {};

  /* ── Collect original (real) slides ── */
  const realItems = Array.from(track.querySelectorAll('.slide-item'));
  const realCount = realItems.length;

  /* ── Build clone sets for infinite loop ──
     Layout: [clonesBefore × realCount] [real × realCount] [clonesAfter × realCount]
     Indices: 0 … realCount-1 | realCount … 2*realCount-1 | 2*realCount … 3*realCount-1
  */
  const clonesBefore = realItems.map(el => {
    const cl = el.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    cl.removeAttribute('data-index');
    return cl;
  });
  const clonesAfter = realItems.map(el => {
    const cl = el.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    cl.removeAttribute('data-index');
    return cl;
  });

  clonesBefore.forEach(cl => track.insertBefore(cl, track.firstChild));
  clonesAfter.forEach(cl  => track.appendChild(cl));

  /* ── Re-query all items (originals + clones) ── */
  const items      = Array.from(track.querySelectorAll('.slide-item'));
  const totalItems = items.length; // realCount × 3

  /* Start at the first item of the MIDDLE (real) set so clones fill both sides */
  let centerIndex = realCount;

  /* ── Helpers ── */
  function getSlideMetrics() {
    if (!items[0]) return { w: 220, gap: 14 };
    const w   = items[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 14;
    return { w, gap };
  }

  /** Logical index within the real set (for dots). */
  function logicalIndex() {
    return ((centerIndex - realCount) % realCount + realCount) % realCount;
  }

  /* ── Dots ── */
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (let i = 0; i < realCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goToReal(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsWrap) return;
    const li   = logicalIndex();
    const dots = dotsWrap.querySelectorAll('.slider-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === li);
      d.setAttribute('aria-selected', String(i === li));
    });
  }

  /* ── Position classes ── */
  function assignPositions() {
    items.forEach((item, i) => {
      const dist = Math.abs(i - centerIndex);
      if      (dist === 0) item.dataset.pos = 'center';
      else if (dist === 1) item.dataset.pos = 'near';
      else if (dist === 2) item.dataset.pos = 'far';
      else                 item.dataset.pos = 'edge';
    });
  }

  /* ── Offset calculation ── */
  function calcOffset() {
    const { w, gap } = getSlideMetrics();
    const vpCenter   = viewport.offsetWidth / 2;
    const trackCenter = centerIndex * (w + gap) + w / 2;
    return vpCenter - trackCenter;
  }

  /* ── Apply CSS transform, optionally without animation ── */
  function applyTransform(offset, animate) {
    if (!animate) {
      track.style.transition = 'none';
      track.style.transform  = `translateX(${offset}px)`;
      /* Force reflow so the no-transition frame is committed */
      void track.offsetWidth;
      track.style.transition = '';
    } else {
      track.style.transform = `translateX(${offset}px)`;
    }
  }

  /* ── Full render ── */
  function render(animate = true) {
    assignPositions();
    applyTransform(calcOffset(), animate);
    updateDots();
  }

  /* ── Infinite-wrap check (runs after transition ends) ──
     If centerIndex drifted into clone territory, silently
     jump to the equivalent real index.
  */
  let wrapTimer = null;
  function scheduleWrapCheck() {
    clearTimeout(wrapTimer);
    wrapTimer = setTimeout(() => {
      if (centerIndex < realCount) {
        centerIndex += realCount;
        render(false);
      } else if (centerIndex >= realCount * 2) {
        centerIndex -= realCount;
        render(false);
      }
    }, 700); // wait for CSS transition (0.65s) to finish
  }

  /* ── Navigation ── */
  function goTo(index) {
    centerIndex = index;
    render(true);
    scheduleWrapCheck();
  }

  function goToReal(realIdx) {
    centerIndex = realCount + realIdx;
    render(true);
    scheduleWrapCheck();
  }

  function shift(delta) {
    goTo(centerIndex + delta);
  }

  /* ── Event wiring ── */
  btnPrev && btnPrev.addEventListener('click', () => shift(-1));
  btnNext && btnNext.addEventListener('click', () => shift(1));

  viewport && viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); shift(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); shift(1);  }
  });

  window.addEventListener('resize', debounce(() => render(false), 120));

  /* ── Init (no animation on first paint) ── */
  buildDots();
  render(false);

  return { goTo, shift, goToReal, get centerIndex() { return centerIndex; } };
})();

/* ═══════════════════════════════════════════
   5. MOUSE PARALLAX TILT ON SLIDE CARDS
═══════════════════════════════════════════ */
(function initCardTilt() {
  const track = document.getElementById('sliderTrack');
  if (!track) return;

  // Only on non-touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const MAX_TILT = 12; // degrees

  track.addEventListener('mousemove', rafThrottle((e) => {
    const cards = track.querySelectorAll('.slide-card');
    cards.forEach(card => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotateX = -dy * MAX_TILT;
      const rotateY =  dx * MAX_TILT;

      // Only tilt the card the mouse is over
      if (Math.abs(dx) <= 1.2 && Math.abs(dy) <= 1.2) {
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        // Parallax inner image
        const img = card.querySelector('.slide-inner img');
        if (img) {
          img.style.transform = `translate(${dx * -6}px, ${dy * -6}px) scale(1.06)`;
        }
      }
    });
  }));

  // Reset on mouse leave
  track.addEventListener('mouseleave', () => {
    const cards = track.querySelectorAll('.slide-card');
    cards.forEach(card => {
      card.style.transform = '';
      const img = card.querySelector('.slide-inner img');
      if (img) img.style.transform = '';
    });
  });
})();

/* ═══════════════════════════════════════════
   6. SCROLL REVEAL (Intersection Observer)
═══════════════════════════════════════════ */
(function initScrollReveal() {
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const delay = el.dataset.revealDelay || 0;
        setTimeout(() => {
          el.classList.add('revealed');
        }, parseInt(delay, 10));
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════
   7. HERO PARALLAX LAYERS (scroll-based)
═══════════════════════════════════════════ */
(function initHeroParallax() {
  const layers = document.querySelectorAll('[data-parallax-speed]');
  if (!layers.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const handler = rafThrottle(() => {
    const scrollY = window.scrollY;
    layers.forEach(layer => {
      const speed  = parseFloat(layer.dataset.parallaxSpeed) || 0.2;
      const offset = scrollY * speed;
      layer.style.transform = `translateY(${offset}px)`;
    });
  });

  window.addEventListener('scroll', handler, { passive: true });
})();

/* ═══════════════════════════════════════════
   8. ABOUT IMAGE PARALLAX (scroll-based)
═══════════════════════════════════════════ */
(function initAboutParallax() {
  const frame = document.querySelector('[data-parallax-about]');
  if (!frame) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const handler = rafThrottle(() => {
    const rect   = frame.getBoundingClientRect();
    const winH   = window.innerHeight;
    // Normalized position: 0 = top of viewport, 1 = bottom
    const norm   = clamp(1 - (rect.top + rect.height / 2) / winH, 0, 1);
    // Map to ±20px range
    const offset = (norm - 0.5) * -40;
    frame.style.transform = `translateY(${offset}px)`;
  });

  window.addEventListener('scroll', handler, { passive: true });
})();

/* ═══════════════════════════════════════════
   9. WHEEL → HORIZONTAL SCROLL MAPPING
   (converts vertical wheel on slider into
    slider navigation with smooth inertia)
═══════════════════════════════════════════ */
(function initWheelScroll() {
  const viewport = document.getElementById('sliderViewport');
  if (!viewport || !Slider) return;

  let accum      = 0;
  const THRESHOLD = 60; // px accumulated before jumping

  viewport.addEventListener('wheel', (e) => {
    // Only intercept when pointer is over slider
    const rect = viewport.getBoundingClientRect();
    const inViewport =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;

    if (!inViewport) return;

    e.preventDefault();

    // Accumulate delta (works for both wheel & trackpad)
    accum += e.deltaX || e.deltaY;

    if (accum >  THRESHOLD) { Slider.shift(1);  accum = 0; }
    if (accum < -THRESHOLD) { Slider.shift(-1); accum = 0; }
  }, { passive: false });
})();

/* ═══════════════════════════════════════════
   10. TOUCH / SWIPE SUPPORT
═══════════════════════════════════════════ */
(function initTouchSwipe() {
  const viewport = document.getElementById('sliderViewport');
  if (!viewport || !Slider) return;

  let startX = 0;
  let startY = 0;
  let isDragging = false;
  const MIN_SWIPE = 40;

  viewport.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    // If horizontal swipe is dominant, prevent page scroll
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  }, { passive: false });

  viewport.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) >= MIN_SWIPE) {
      Slider.shift(dx < 0 ? 1 : -1);
    }
  });
})();

/* ═══════════════════════════════════════════
   MOUSE TRACKER
   Writes smoothed normalised position (0-1)
   to window._mouse for the ocean canvas to use.
═══════════════════════════════════════════ */
(function initMouseTracker() {
  window._mouse = { x: 0.5, y: 0.5 };
  let tx = 0.5, ty = 0.5;

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX / window.innerWidth;
    ty = e.clientY / window.innerHeight;
  });

  (function smooth() {
    requestAnimationFrame(smooth);
    window._mouse.x += (tx - window._mouse.x) * 0.06;
    window._mouse.y += (ty - window._mouse.y) * 0.06;
  })();
})();

/* ═══════════════════════════════════════════
   OCEAN CANVAS
   ─────────────────────────────────────────
   scroll 0.00–0.10  Surface: sky, ripples, sun
   scroll 0.06–0.40  Shallow: light rays, caustics, small fish
   scroll 0.28–0.65  Mid-water: medium fish, plankton
   scroll 0.58–0.90  Deep: large fish, bioluminescent glow
   scroll 0.78–1.00  Bottom: seaweed, rocks, moss carpet
═══════════════════════════════════════════ */
(function initOceanCanvas() {
  const canvas = document.getElementById('oceanCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, t = 0, sp = 0; // sp = scroll progress 0-1

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', debounce(resize, 100));
  resize();

  /* ── Scroll progress ── */
  function updateSP() {
    const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    sp = window.scrollY / maxS;
  }
  window.addEventListener('scroll', updateSP, { passive: true });

  /* ── Maths helpers ── */
  const lerp    = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v)       => Math.min(1, Math.max(0, v));
  const rand    = (a, b)    => a + Math.random() * (b - a);
  /* smooth fade in/out within a depth window */
  function depthAlpha(sp, enter, peak, exit) {
    if (sp < enter || sp > exit) return 0;
    if (sp < peak) return (sp - enter) / (peak - enter);
    if (sp > peak) return 1 - (sp - peak) / (exit - peak);
    return 1;
  }

  /* ── Background gradient colour stops ──
     [scrollPos, topRGB, botRGB] */
  const BG_ZONES = [
    { sp: 0.00, top: [148, 218, 250], bot: [72,  175, 228] },
    { sp: 0.08, top: [48,  162, 218], bot: [22,  112, 178] },
    { sp: 0.22, top: [18,  100, 162], bot: [8,    64, 128] },
    { sp: 0.42, top: [8,    58, 118], bot: [4,    32,  80] },
    { sp: 0.62, top: [4,    28,  74], bot: [2,    14,  46] },
    { sp: 0.82, top: [2,    14,  42], bot: [1,     7,  28] },
    { sp: 1.00, top: [4,    22,  26], bot: [2,    11,  15] },  // moss-floor tint
  ];

  function getBgRGB(sp) {
    for (let i = 0; i < BG_ZONES.length - 1; i++) {
      const a = BG_ZONES[i], b = BG_ZONES[i + 1];
      if (sp >= a.sp && sp <= b.sp) {
        const f = (sp - a.sp) / (b.sp - a.sp);
        return {
          top: a.top.map((v, j) => Math.round(lerp(v, b.top[j], f))),
          bot: a.bot.map((v, j) => Math.round(lerp(v, b.bot[j], f))),
        };
      }
    }
    const last = BG_ZONES[BG_ZONES.length - 1];
    return { top: last.top, bot: last.bot };
  }

  /* ════════════════════════════════════════
     DATA CREATION
  ════════════════════════════════════════ */

  /* ── Light rays (7 shafts) ── */
  const RAYS = Array.from({ length: 7 }, () => ({
    xPos:    rand(0.08, 0.92),
    angle:   rand(-0.22, 0.22),
    halfW:   rand(0.018, 0.045),
    phase:   rand(0, Math.PI * 2),
    speed:   rand(0.0004, 0.0008),
    opacity: rand(0.045, 0.09),
  }));

  /* ── Caustic circles ── */
  const CAUSTICS = Array.from({ length: 14 }, () => ({
    x:     rand(0, 1),
    y:     rand(0, 0.55),
    r:     rand(0.025, 0.08),
    phase: rand(0, Math.PI * 2),
    speed: rand(0.007, 0.018),
  }));

  /* ── Bubbles ── */
  const BUBBLES = Array.from({ length: 38 }, () => ({
    x:      rand(0, 1),
    y:      rand(0, 1),
    r:      rand(1.5, 5),
    vy:     rand(0.00025, 0.0007),
    wobble: rand(0, Math.PI * 2),
    ws:     rand(0.018, 0.04),
    op:     rand(0.12, 0.42),
    depth:  rand(0.05, 0.88), // which scroll depth they live at
  }));

  /* ── Plankton / motes ── */
  const PLANKTON = Array.from({ length: 55 }, () => ({
    x:     rand(0, 1),
    y:     rand(0, 1),
    r:     rand(0.8, 2.4),
    vy:    rand(0.00005, 0.00018) * (Math.random() > 0.5 ? 1 : -1),
    tw:    rand(0, Math.PI * 2),
    tws:   rand(0.012, 0.04),
    op:    rand(0.08, 0.38),
    depth: rand(0.05, 0.95),
  }));

  /* ── Fish factory ── */
  function makeFish(worldDepth, size, speed, colors, glimmer) {
    return {
      x:          rand(0, 1),
      y:          rand(0.12, 0.88),
      worldDepth,
      size,
      speed:      rand(0.00014, 0.00032) * (speed * (Math.random() > 0.5 ? 1 : -1)),
      facingRight: Math.random() > 0.5,
      phase:      rand(0, Math.PI * 2),
      phaseSpeed: rand(0.055, 0.13),
      vertPhase:  rand(0, Math.PI * 2),
      color:      colors[Math.floor(Math.random() * colors.length)],
      glimmer,
      glowColor:  null, // set for deep fish
    };
  }

  /* small fish — silvery, schooling, shallow */
  const SMALL_FISH = Array.from({ length: 18 }, () =>
    makeFish(rand(0.08, 0.44), rand(10, 24), 1.1,
      ['rgba(205,232,248,0.82)', 'rgba(188,218,238,0.80)', 'rgba(225,242,255,0.78)'],
      'rgba(245,252,255,0.95)')
  );

  /* medium fish — blue-grey, mid water */
  const MED_FISH = Array.from({ length: 7 }, () =>
    makeFish(rand(0.30, 0.66), rand(34, 58), 0.8,
      ['rgba(78,148,205,0.86)', 'rgba(60,128,192,0.86)', 'rgba(98,162,215,0.82)'],
      'rgba(148,202,238,0.9)')
  );

  /* large fish — deep blue, slow, dramatic */
  const BIG_FISH = Array.from({ length: 3 }, () => {
    const f = makeFish(rand(0.58, 0.90), rand(78, 132), 0.45,
      ['rgba(32,78,148,0.92)', 'rgba(25,65,138,0.92)', 'rgba(45,92,162,0.88)'],
      'rgba(80,165,225,0.88)');
    f.glowColor = 'rgba(80,200,255,0.18)'; // bioluminescent hint
    return f;
  });

  /* ── Seaweed strands ── */
  const WEEDS = Array.from({ length: 22 }, () => ({
    x:      rand(0, 1),
    height: rand(0.10, 0.22),
    segs:   Math.floor(rand(4, 9)),
    sway:   rand(0, Math.PI * 2),
    swayS:  rand(0.007, 0.022),
    w:      rand(3, 7),
    c1: `rgba(${r(12,38)},${r(90,138)},${r(38,70)},0.82)`,
    c2: `rgba(${r(6,20)}, ${r(60,95)}, ${r(22,52)},0.60)`,
  }));
  function r(a, b) { return Math.round(rand(a, b)); }

  /* ── Bottom rocks ── */
  const ROCKS = Array.from({ length: 14 }, () => ({
    x:    rand(0, 1),
    w:    rand(0.025, 0.065),
    h:    rand(0.032, 0.075),
    tilt: rand(-0.35, 0.35),
    c:    `rgba(${r(18,42)},${r(36,64)},${r(26,50)},0.92)`,
  }));

  /* ── Moss blobs ── */
  const MOSS = Array.from({ length: 28 }, () => ({
    x:     rand(0, 1),
    yOff:  rand(0, 0.042),
    r:     rand(0.012, 0.048),
    phase: rand(0, Math.PI * 2),
    c:     `rgba(${r(8,30)},${r(68,112)},${r(18,46)},0.78)`,
  }));

  /* ════════════════════════════════════════
     DRAW FUNCTIONS
  ════════════════════════════════════════ */

  /* ── 1. Background gradient ── */
  function drawBackground() {
    const c   = getBgRGB(sp);
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, `rgb(${c.top})`);
    grd.addColorStop(1, `rgb(${c.bot})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── 2. Water surface (sky + ripple line + sun) ── */
  function drawSurface() {
    const a = depthAlpha(sp, 0, 0, 0.12);
    if (a <= 0) return;

    const sy = H * clamp01(0.35 - sp * 3.2); // surface line y

    /* sky block above surface */
    if (sy > 0) {
      const skyGrd = ctx.createLinearGradient(0, 0, 0, sy);
      skyGrd.addColorStop(0,   `rgba(165,222,255,${a})`);
      skyGrd.addColorStop(0.55,`rgba(208,238,255,${a})`);
      skyGrd.addColorStop(1,   `rgba(180,228,252,${a * 0.85})`);
      ctx.fillStyle = skyGrd;
      ctx.fillRect(0, 0, W, sy);

      /* sun disc */
      const sunX = W * (0.42 + window._mouse.x * 0.16);
      const sunY = sy * 0.28;
      const sunA = a * clamp01(1 - sp * 12);
      if (sunA > 0) {
        const sunGrd = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 100);
        sunGrd.addColorStop(0,   `rgba(255,252,220,${sunA * 0.92})`);
        sunGrd.addColorStop(0.25,`rgba(255,245,180,${sunA * 0.35})`);
        sunGrd.addColorStop(1,   'rgba(255,245,180,0)');
        ctx.fillStyle = sunGrd;
        ctx.fillRect(0, 0, W, sy);

        /* sun lens flare streak on water */
        const flareW = W * 0.04;
        const flareGrd = ctx.createLinearGradient(sunX - flareW, sy, sunX + flareW, sy);
        flareGrd.addColorStop(0,   'rgba(255,255,220,0)');
        flareGrd.addColorStop(0.5, `rgba(255,255,220,${sunA * 0.45})`);
        flareGrd.addColorStop(1,   'rgba(255,255,220,0)');
        ctx.fillStyle = flareGrd;
        ctx.fillRect(sunX - W * 0.25, sy - 3, W * 0.5, 6);
      }
    }

    /* ripple surface line */
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = `rgba(255,255,255,0.7)`;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const wy = Math.sin(x * 0.014 + t * 1.6) * 5.5
               + Math.sin(x * 0.031 + t * 2.4) * 2.5;
      x === 0 ? ctx.moveTo(x, sy + wy) : ctx.lineTo(x, sy + wy);
    }
    ctx.stroke();
    /* glow stroke below */
    ctx.strokeStyle = 'rgba(200,240,255,0.22)';
    ctx.lineWidth   = 8;
    ctx.filter      = 'blur(4px)';
    ctx.stroke();
    ctx.filter      = 'none';
    ctx.restore();
  }

  /* ── 3. God-rays ── */
  function drawRays() {
    const a = depthAlpha(sp, 0.0, 0.05, 0.52);
    if (a <= 0) return;
    const intensity = a * (1 - sp * 1.15);
    if (intensity <= 0) return;

    ctx.save();
    RAYS.forEach(ray => {
      ray.phase += ray.speed;
      const xSrc  = ray.xPos * W
                  + Math.sin(ray.phase) * 55
                  + (window._mouse.x - 0.5) * 80;
      const angle = ray.angle + Math.sin(ray.phase * 0.7) * 0.06;
      const len   = H * 1.7;
      const hw    = ray.halfW * W;
      const bx    = xSrc + Math.sin(angle) * len;
      const by    = Math.cos(angle) * len;

      const grd = ctx.createLinearGradient(xSrc, 0, bx, by);
      grd.addColorStop(0,   `rgba(220,248,255,${ray.opacity * intensity * 3.2})`);
      grd.addColorStop(0.28,`rgba(180,230,252,${ray.opacity * intensity * 1.4})`);
      grd.addColorStop(1,   'rgba(180,230,252,0)');

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(xSrc - hw * 0.28, 0);
      ctx.lineTo(xSrc + hw * 0.28, 0);
      ctx.lineTo(bx + hw, by);
      ctx.lineTo(bx - hw, by);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  /* ── 4. Caustics ── */
  function drawCaustics() {
    const a = depthAlpha(sp, 0.02, 0.08, 0.44);
    if (a <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    CAUSTICS.forEach(c => {
      c.phase += c.speed;
      const cx = c.x * W + Math.sin(c.phase * 0.65) * 28;
      const cy = c.y * H * 0.55 + Math.cos(c.phase * 0.5) * 18;
      const cr = c.r * W * (0.82 + Math.sin(c.phase) * 0.18);

      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      grd.addColorStop(0,   `rgba(145,225,255,${0.055 * a})`);
      grd.addColorStop(0.5, `rgba(100,185,245,${0.028 * a})`);
      grd.addColorStop(1,   'rgba(100,185,245,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  /* ── 5. Bubbles ── */
  function drawBubbles() {
    ctx.save();
    BUBBLES.forEach(b => {
      b.y    -= b.vy;
      b.wobble += b.ws;
      if (b.y < -0.04) b.y = 1.04;

      const localA = depthAlpha(sp, b.depth - 0.28, b.depth, b.depth + 0.28);
      if (localA <= 0) return;

      const bx = b.x * W + Math.sin(b.wobble) * 7;
      const by = b.y * H;

      ctx.globalAlpha = b.op * localA;
      ctx.strokeStyle = 'rgba(190,235,255,0.85)';
      ctx.lineWidth   = 0.9;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.stroke();
      /* highlight */
      ctx.fillStyle = 'rgba(230,248,255,0.35)';
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.32, by - b.r * 0.32, b.r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── 6. Plankton motes ── */
  function drawPlankton() {
    ctx.save();
    PLANKTON.forEach(p => {
      p.y   += p.vy;
      p.tw  += p.tws;
      if (p.y < -0.02) p.y = 1.02;
      if (p.y >  1.02) p.y = -0.02;

      const localA = depthAlpha(sp, p.depth - 0.25, p.depth, p.depth + 0.25);
      if (localA <= 0) return;

      const tw = 0.55 + 0.45 * Math.sin(p.tw);
      ctx.globalAlpha = p.op * localA * tw;
      ctx.fillStyle   = 'rgba(185,235,255,1)';
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── 7. Fish drawing core ── */
  function drawOneFish(f) {
    const localA = depthAlpha(sp, f.worldDepth - 0.20, f.worldDepth, f.worldDepth + 0.20);
    if (localA <= 0) return;

    /* update position */
    f.phase     += f.phaseSpeed;
    f.vertPhase += 0.009;
    f.x         += f.speed;
    f.y         += Math.sin(f.vertPhase) * 0.00025;

    /* parallax vertical offset: fish that aren't at current depth appear shifted */
    const depthOffset = (f.worldDepth - sp) * H * 0.38;
    const drawY = f.y * H + depthOffset;

    if (f.x > 1.14) { f.x = -0.14; f.facingRight = true;  }
    if (f.x < -0.14){ f.x =  1.14; f.facingRight = false; }
    if (drawY < -f.size * 2.5 || drawY > H + f.size * 2.5) return;

    const drawX = f.x * W;
    const s     = f.size;
    const wag   = Math.sin(f.phase) * s * 0.11;
    const wag2  = Math.sin(f.phase + 0.6) * s * 0.055;

    ctx.save();
    ctx.globalAlpha = localA;

    /* bioluminescent glow for large deep fish */
    if (f.glowColor) {
      ctx.shadowColor = f.glowColor;
      ctx.shadowBlur  = 28;
    }

    ctx.translate(drawX, drawY);
    if (!f.facingRight) ctx.scale(-1, 1);

    /* tail fork */
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, wag * 0.62);
    ctx.lineTo(-s * 1.32, -s * 0.54 + wag * 1.85);
    ctx.lineTo(-s * 0.88, wag * 0.35);
    ctx.lineTo(-s * 1.32,  s * 0.54 + wag * 1.85);
    ctx.closePath();
    ctx.fill();

    /* body */
    const bodyGrd = ctx.createLinearGradient(-s * 0.6, -s * 0.38, s * 0.85, s * 0.38);
    bodyGrd.addColorStop(0,   f.color);
    bodyGrd.addColorStop(0.45, f.glimmer);
    bodyGrd.addColorStop(1,   f.color);
    ctx.fillStyle = bodyGrd;
    ctx.beginPath();
    ctx.moveTo(s * 0.82, 0);
    ctx.bezierCurveTo( s * 0.5,  -s * 0.38,  -s * 0.1, -s * 0.34 + wag2,  -s * 0.62,  wag * 0.6);
    ctx.bezierCurveTo(-s * 0.1,   s * 0.34 + wag2,  s * 0.5,   s * 0.38,   s * 0.82,  0);
    ctx.closePath();
    ctx.fill();

    /* dorsal fin */
    ctx.beginPath();
    ctx.moveTo(s * 0.08, -s * 0.33 + wag2 * 0.35);
    ctx.quadraticCurveTo(-s * 0.15, -s * 0.72 + wag2 * 0.5, -s * 0.38, -s * 0.35 + wag2 * 0.42);
    ctx.closePath();
    ctx.fillStyle = f.color;
    ctx.globalAlpha *= 0.55;
    ctx.fill();
    ctx.globalAlpha /= 0.55;

    /* belly shine strip */
    ctx.beginPath();
    ctx.moveTo(s * 0.6, s * 0.08);
    ctx.bezierCurveTo(s * 0.2, s * 0.36, -s * 0.2, s * 0.32, -s * 0.5, s * 0.18);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = s * 0.06;
    ctx.lineCap     = 'round';
    ctx.stroke();

    /* eye */
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(8,14,32,0.95)';
    ctx.beginPath();
    ctx.arc(s * 0.50, -s * 0.07, s * 0.115, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.arc(s * 0.525, -s * 0.10, s * 0.048, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFishLayer(fishArr) {
    fishArr.forEach(drawOneFish);
  }

  /* ── 8. Seaweed ── */
  function drawSeaweed() {
    const a = depthAlpha(sp, 0.36, 0.56, 1.0);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    WEEDS.forEach(w => {
      w.sway += w.swayS;
      const baseY = H + 4;
      const totalH = w.height * H;
      const wx = w.x * W;

      const grd = ctx.createLinearGradient(wx, baseY, wx, baseY - totalH);
      grd.addColorStop(0, w.c1);
      grd.addColorStop(1, w.c2);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = w.w;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      ctx.beginPath();
      ctx.moveTo(wx, baseY);
      for (let seg = 1; seg <= w.segs; seg++) {
        const frac = seg / w.segs;
        const sx   = wx + Math.sin(w.sway + seg * 0.85) * seg * 4.5;
        const sy   = baseY - totalH * frac;
        const cpx  = wx + Math.sin(w.sway + seg * 0.5) * seg * 6.5;
        const cpy  = baseY - totalH * (frac - 0.5 / w.segs);
        ctx.quadraticCurveTo(cpx, cpy, sx, sy);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ── 9. Bottom: sediment + rocks + moss ── */
  function drawBottom() {
    const a = depthAlpha(sp, 0.76, 0.90, 1.0);
    if (a <= 0) return;

    ctx.save();
    ctx.globalAlpha = a;

    /* sediment dark strip */
    const sedH = H * 0.18;
    const sedGrd = ctx.createLinearGradient(0, H - sedH, 0, H);
    sedGrd.addColorStop(0,   'rgba(6,22,14,0)');
    sedGrd.addColorStop(0.38,'rgba(4,18,10,0.55)');
    sedGrd.addColorStop(1,   'rgba(3,12,8,0.88)');
    ctx.fillStyle = sedGrd;
    ctx.fillRect(0, H - sedH, W, sedH);

    /* rocks */
    ROCKS.forEach(rock => {
      const rx = rock.x * W;
      const rh = rock.h * H;
      const rw = rock.w * W;
      const ry = H - rh * 0.55;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rock.tilt);
      ctx.fillStyle = rock.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, rw * 0.5, rh * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      /* rock highlight */
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.ellipse(-rw * 0.12, -rh * 0.18, rw * 0.24, rh * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    /* moss blobs */
    MOSS.forEach(m => {
      m.phase += 0.004;
      const mx = m.x * W;
      const my = H - m.yOff * H;
      const mr = m.r * W;
      ctx.fillStyle = m.c;
      ctx.beginPath();
      /* irregular polygon approximating a blob */
      for (let ang = 0; ang < Math.PI * 2; ang += 0.45) {
        const rad = mr * (0.68 + Math.sin(ang * 3.1 + m.phase) * 0.32);
        const bx  = mx + Math.cos(ang) * rad;
        const by  = my + Math.sin(ang) * rad * 0.48;
        ang < 0.01 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }

  /* ── 10. Ambient depth fog overlay ── */
  function drawDepthFog() {
    if (sp < 0.18) return;
    const fogA = clamp01((sp - 0.18) / 0.35) * 0.22;
    const c    = getBgRGB(sp);
    const grd  = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0,   `rgba(${c.top},${fogA * 0.5})`);
    grd.addColorStop(0.5, `rgba(${c.bot},${fogA * 0.18})`);
    grd.addColorStop(1,   `rgba(${c.bot},0)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  /* ════════════════════════════════════════
     MAIN LOOP
  ════════════════════════════════════════ */
  function draw() {
    requestAnimationFrame(draw);
    t += 0.016;

    if (W === 0 || H === 0) return;

    drawBackground();
    drawRays();
    drawCaustics();
    drawPlankton();
    drawBubbles();
    drawFishLayer(SMALL_FISH);
    drawFishLayer(MED_FISH);
    drawFishLayer(BIG_FISH);
    drawSeaweed();
    drawBottom();
    drawDepthFog();
    drawSurface(); // drawn last so sky overlays water near scroll=0
  }

  draw();
})();

/* ═══════════════════════════════════════════
   BONUS: Smooth scroll for anchor links
═══════════════════════════════════════════ */
(function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
