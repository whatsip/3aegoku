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

  const items       = Array.from(track.querySelectorAll('.slide-item'));
  const totalItems  = items.length;
  let   centerIndex = Math.floor(totalItems / 2); // start at center

  /**
   * How many slides are visible on each side of center depends on viewport.
   * Desktop: 2 sides visible fully + partial = show 5+
   * Tablet: 1-2 sides
   * Mobile: 0-1 sides
   */
  function getVisibleSides() {
    const w = window.innerWidth;
    if (w >= 1024) return 2;
    if (w >= 640)  return 1;
    return 0;
  }

  /**
   * Get slide width + gap for offset calculations.
   */
  function getSlideMetrics() {
    if (!items[0]) return { w: 220, gap: 14 };
    const style  = getComputedStyle(items[0]);
    const w      = items[0].offsetWidth;
    const gap    = parseFloat(getComputedStyle(track).gap) || 14;
    return { w, gap };
  }

  /**
   * Build dot elements.
   */
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className  = 'slider-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  /**
   * Update dot states.
   */
  function updateDots() {
    if (!dotsWrap) return;
    const dots = dotsWrap.querySelectorAll('.slider-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === centerIndex);
      d.setAttribute('aria-selected', i === centerIndex);
    });
  }

  /**
   * Assign data-pos attribute to each slide for CSS scaling.
   * Positions: "center" | "near" | "far" | "edge" | "" (default)
   */
  function assignPositions() {
    const sides = getVisibleSides();
    items.forEach((item, i) => {
      const dist = Math.abs(i - centerIndex);
      if (dist === 0)      item.dataset.pos = 'center';
      else if (dist === 1) item.dataset.pos = 'near';
      else if (dist === 2) item.dataset.pos = 'far';
      else                 item.dataset.pos = 'edge';
    });
  }

  /**
   * Calculate the translateX needed to center `centerIndex`.
   */
  function calcOffset() {
    const { w, gap } = getSlideMetrics();
    const vw         = viewport.offsetWidth;
    // Center of viewport
    const vpCenter   = vw / 2;
    // Left edge of center slide in track-space (without any transform)
    const trackOffsetToCenter = centerIndex * (w + gap) + w / 2;
    return vpCenter - trackOffsetToCenter;
  }

  /**
   * Apply transform to track.
   */
  function applyTransform(offset) {
    track.style.transform = `translateX(${offset}px)`;
  }

  /**
   * Full render cycle.
   */
  function render() {
    assignPositions();
    applyTransform(calcOffset());
    updateDots();
  }

  /**
   * Navigate to a specific slide index.
   */
  function goTo(index) {
    centerIndex = clamp(index, 0, totalItems - 1);
    render();
  }

  /**
   * Navigate relative to current.
   */
  function shift(delta) {
    goTo(centerIndex + delta);
  }

  // Arrow buttons
  btnPrev && btnPrev.addEventListener('click', () => shift(-1));
  btnNext && btnNext.addEventListener('click', () => shift(1));

  // Keyboard nav when focused inside slider
  viewport && viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); shift(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); shift(1);  }
  });

  // Re-render on resize (debounced)
  window.addEventListener('resize', debounce(render, 120));

  // Init
  buildDots();
  render();

  return { goTo, shift, get centerIndex() { return centerIndex; } };
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
   BONUS: Hero mouse parallax
   Drives orbs + canvas particles at different depths
═══════════════════════════════════════════ */
(function initHeroMouseParallax() {
  const hero = document.getElementById('hero');
  const orb1 = document.querySelector('.bg-orb-1');
  const orb2 = document.querySelector('.bg-orb-2');

  if (!hero || window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Smoothed mouse position (0..1 from top-left)
  let targetNX = 0.5, targetNY = 0.5;
  let smoothNX = 0.5, smoothNY = 0.5;

  document.addEventListener('mousemove', (e) => {
    targetNX = e.clientX / window.innerWidth;
    targetNY = e.clientY / window.innerHeight;
  });

  // Export smooth values so particle system can read them
  window._heroParallaxNorm = { x: 0.5, y: 0.5 };

  function tick() {
    requestAnimationFrame(tick);
    smoothNX += (targetNX - smoothNX) * 0.06;
    smoothNY += (targetNY - smoothNY) * 0.06;

    // Write to shared object for particle system
    window._heroParallaxNorm.x = smoothNX;
    window._heroParallaxNorm.y = smoothNY;

    const dx = smoothNX - 0.5; // -0.5 to 0.5
    const dy = smoothNY - 0.5;

    if (orb1) orb1.style.transform = `translate(${dx * 60}px, ${dy * 40}px) scale(${1 + Math.abs(dx) * 0.08})`;
    if (orb2) orb2.style.transform = `translate(${dx * -40}px, ${dy * -30}px)`;
  }
  tick();
})();

/* ═══════════════════════════════════════════
   BACKGROUND CANVAS PARTICLE SYSTEM
   Three depth layers of particles:
   ─ Layer A (deep):   slow drift, tiny dots
   ─ Layer B (mid):    medium drift, + crosshairs
   ─ Layer C (near):   fast drift, diamond outlines
   All react to mouse position via window._heroParallaxNorm
═══════════════════════════════════════════ */
(function initBgParticles() {
  const canvas = document.getElementById('bgParticles');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');

  // ── Particle factory ──
  function makeParticle(type, index, total) {
    return {
      type,                              // 'dot' | 'cross' | 'diamond'
      x: Math.random(),                  // 0–1 normalised
      y: Math.random(),
      baseX: 0, baseY: 0,               // set on first draw
      size: type === 'dot'     ? (Math.random() * 1.4 + 0.6)
           : type === 'cross'  ? (Math.random() * 5   + 4)
           :                     (Math.random() * 6   + 4),
      // Depth: 0 = deepest (slowest), 1 = nearest (fastest)
      depth: type === 'dot'    ? Math.random() * 0.35
           : type === 'cross'  ? 0.35 + Math.random() * 0.35
           :                     0.70 + Math.random() * 0.30,
      opacity: type === 'dot'    ? (Math.random() * 0.45 + 0.15)
              : type === 'cross' ? (Math.random() * 0.30 + 0.10)
              :                    (Math.random() * 0.25 + 0.08),
      // Slow autonomous drift
      driftX: (Math.random() - 0.5) * 0.00012,
      driftY: (Math.random() - 0.5) * 0.00008,
      // Twinkle phase
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.004 + Math.random() * 0.006,
    };
  }

  // Create particles
  const particles = [];
  // 55 deep tiny dots
  for (let i = 0; i < 55; i++) particles.push(makeParticle('dot', i, 55));
  // 20 mid crosshairs
  for (let i = 0; i < 20; i++) particles.push(makeParticle('cross', i, 20));
  // 12 near diamonds
  for (let i = 0; i < 12; i++) particles.push(makeParticle('diamond', i, 12));

  // Resize handler
  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);
  resize();

  // Colour helpers — cyan/blue spectrum
  function particleColor(p, alpha) {
    // Deeper = cooler blue, nearer = warmer cyan
    const hue = 185 + p.depth * 25; // 185–210
    return `hsla(${hue}, 100%, ${55 + p.depth * 20}%, ${alpha})`;
  }

  // ── Draw a + crosshair ──
  function drawCross(x, y, size, alpha, p) {
    ctx.save();
    ctx.strokeStyle = particleColor(p, alpha);
    ctx.lineWidth   = 0.8;
    ctx.lineCap     = 'round';
    // Outer arms
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - size * 0.3, y);
    ctx.moveTo(x + size * 0.3, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - size * 0.3);
    ctx.moveTo(x, y + size * 0.3);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    // Centre dot
    ctx.fillStyle = particleColor(p, alpha * 1.4);
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Draw rotated diamond outline ──
  function drawDiamond(x, y, size, alpha, p) {
    ctx.save();
    ctx.strokeStyle = particleColor(p, alpha);
    ctx.lineWidth   = 0.8;
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.stroke();
    // Inner glow dot
    ctx.fillStyle = particleColor(p, alpha * 0.6);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Main render loop ──
  let t = 0;

  function draw() {
    requestAnimationFrame(draw);
    t++;

    const W = canvas.width;
    const H = canvas.height;

    if (W === 0 || H === 0) return;

    ctx.clearRect(0, 0, W, H);

    // Mouse parallax offset (from shared global)
    const norm = window._heroParallaxNorm || { x: 0.5, y: 0.5 };
    const offsetX = (norm.x - 0.5); // -0.5 to 0.5
    const offsetY = (norm.y - 0.5);

    particles.forEach(p => {
      // Drift over time
      p.x += p.driftX;
      p.y += p.driftY;

      // Wrap around edges
      if (p.x < -0.05) p.x = 1.05;
      if (p.x >  1.05) p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05;
      if (p.y >  1.05) p.y = -0.05;

      // Mouse parallax: deeper = less movement, nearer = more
      const parallaxStrength = p.depth * 55;
      const px = p.x * W + offsetX * parallaxStrength;
      const py = p.y * H + offsetY * parallaxStrength;

      // Twinkle — subtle opacity oscillation
      p.twinklePhase += p.twinkleSpeed;
      const twinkle    = 0.7 + 0.3 * Math.sin(p.twinklePhase);
      const finalAlpha = p.opacity * twinkle;

      if (p.type === 'dot') {
        ctx.save();
        // Soft glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5);
        grd.addColorStop(0,   particleColor(p, finalAlpha));
        grd.addColorStop(0.5, particleColor(p, finalAlpha * 0.4));
        grd.addColorStop(1,   particleColor(p, 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Hard core
        ctx.fillStyle = particleColor(p, finalAlpha * 1.2);
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (p.type === 'cross') {
        drawCross(px, py, p.size, finalAlpha, p);

      } else if (p.type === 'diamond') {
        drawDiamond(px, py, p.size, finalAlpha, p);
      }
    });
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
