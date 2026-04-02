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
  update();
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

  links.forEach(link => link.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();
