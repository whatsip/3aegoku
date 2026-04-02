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
