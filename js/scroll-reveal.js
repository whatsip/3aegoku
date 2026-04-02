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
    const norm   = clamp(1 - (rect.top + rect.height / 2) / winH, 0, 1);
    const offset = (norm - 0.5) * -40;
    frame.style.transform = `translateY(${offset}px)`;
  });

  window.addEventListener('scroll', handler, { passive: true });
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
