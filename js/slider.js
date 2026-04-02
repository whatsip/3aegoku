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

  const realItems = Array.from(track.querySelectorAll('.slide-item'));
  const realCount = realItems.length;

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

  const items      = Array.from(track.querySelectorAll('.slide-item'));
  const totalItems = items.length;

  let centerIndex = realCount;

  function getSlideMetrics() {
    if (!items[0]) return { w: 220, gap: 14 };
    const w   = items[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 14;
    return { w, gap };
  }

  function logicalIndex() {
    return ((centerIndex - realCount) % realCount + realCount) % realCount;
  }

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

  function assignPositions() {
    items.forEach((item, i) => {
      const dist = Math.abs(i - centerIndex);
      if      (dist === 0) item.dataset.pos = 'center';
      else if (dist === 1) item.dataset.pos = 'near';
      else if (dist === 2) item.dataset.pos = 'far';
      else                 item.dataset.pos = 'edge';
    });
  }

  function calcOffset() {
    const { w, gap } = getSlideMetrics();
    const vpCenter   = viewport.offsetWidth / 2;
    const trackCenter = centerIndex * (w + gap) + w / 2;
    return vpCenter - trackCenter;
  }

  function applyTransform(offset, animate) {
    if (!animate) {
      track.style.transition = 'none';
      track.style.transform  = `translateX(${offset}px)`;
      void track.offsetWidth;
      track.style.transition = '';
    } else {
      track.style.transform = `translateX(${offset}px)`;
    }
  }

  function render(animate = true) {
    assignPositions();
    applyTransform(calcOffset(), animate);
    updateDots();
  }

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
    }, 700);
  }

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

  btnPrev && btnPrev.addEventListener('click', () => shift(-1));
  btnNext && btnNext.addEventListener('click', () => shift(1));

  viewport && viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); shift(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); shift(1);  }
  });

  window.addEventListener('resize', debounce(() => render(false), 120));

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

  if (window.matchMedia('(hover: none)').matches) return;

  const MAX_TILT = 12;

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

      if (Math.abs(dx) <= 1.2 && Math.abs(dy) <= 1.2) {
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        const img = card.querySelector('.slide-inner img');
        if (img) {
          img.style.transform = `translate(${dx * -6}px, ${dy * -6}px) scale(1.06)`;
        }
      }
    });
  }));

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
   9. WHEEL → HORIZONTAL SCROLL MAPPING
═══════════════════════════════════════════ */
(function initWheelScroll() {
  const viewport = document.getElementById('sliderViewport');
  if (!viewport || !Slider) return;

  let accum      = 0;
  const THRESHOLD = 60;

  viewport.addEventListener('wheel', (e) => {
    const rect = viewport.getBoundingClientRect();
    const inViewport =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;

    if (!inViewport) return;

    e.preventDefault();

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
