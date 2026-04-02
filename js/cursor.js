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

  if (window.matchMedia('(hover: none)').matches) {
    [dot, cross, ring].forEach(el => el.style.display = 'none');
    document.body.style.cursor = 'auto';
    return;
  }

  let mx = -300, my = -300;
  let cx = -300, cy = -300;
  let rx = -300, ry = -300;
  let prevRx = -300, prevRy = -300;
  let crossAngle = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

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

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = cross.style.opacity = ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = cross.style.opacity = ring.style.opacity = '1';
  });

  function animateCursor() {
    requestAnimationFrame(animateCursor);

    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    cx += (mx - cx) * 0.22;
    cy += (my - cy) * 0.22;
    crossAngle += isHover ? 1.8 : 0.5;
    cross.style.left      = cx + 'px';
    cross.style.top       = cy + 'px';
    cross.style.transform = `translate(-50%, -50%) rotate(${crossAngle}deg)`;

    prevRx = rx;
    prevRy = ry;
    rx += (mx - rx) * 0.09;
    ry += (my - ry) * 0.09;

    const vx   = rx - prevRx;
    const vy   = ry - prevRy;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const stretchX = 1 + clamp(Math.abs(vx) * 0.045, 0, 0.55);
    const moveAngle = speed > 0.3 ? Math.atan2(vy, vx) * (180 / Math.PI) : 0;

    ring.style.left      = rx + 'px';
    ring.style.top       = ry + 'px';
    if (!isHover && speed > 0.3) {
      ring.style.transform = `translate(-50%, -50%) rotate(${moveAngle}deg) scaleX(${stretchX}) scaleY(${1 / stretchX * 0.96})`;
    } else if (isHover) {
      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.04;
      ring.style.transform = `translate(-50%, -50%) scale(${pulse})`;
    } else {
      ring.style.transform = `translate(-50%, -50%)`;
    }
  }

  animateCursor();
})();
