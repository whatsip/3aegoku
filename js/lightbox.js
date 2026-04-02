/* ═══════════════════════════════════════════
   LIGHTBOX — full image on slide click
═══════════════════════════════════════════ */
(function initLightbox() {
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightboxImg');
  const lightboxLabel = document.getElementById('lightboxLabel');
  const closeBtn     = document.getElementById('lightboxClose');
  const bgEl         = document.getElementById('lightboxBg');
  if (!lightbox || !lightboxImg) return;

  function openLightbox(src, alt, label) {
    lightboxImg.src = src.replace(/[?&]w=\d+/, (m) => m.replace(/\d+/, '1400'));
    lightboxImg.alt = alt;
    if (lightboxLabel) lightboxLabel.textContent = label || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 350);
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.slide-item .slide-card');
    if (!card) return;
    const img   = card.querySelector('.slide-inner img');
    const label = card.querySelector('.slide-label');
    if (!img) return;
    openLightbox(img.src, img.alt, label ? label.textContent : '');
  });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.s43-card');
    if (!card) return;
    const img   = card.querySelector('.s43-card-img');
    const label = card.querySelector('.s43-card-label');
    if (!img) return;
    openLightbox(img.src, img.alt, label ? label.textContent : '');
  });

  closeBtn && closeBtn.addEventListener('click', closeLightbox);
  bgEl     && bgEl.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
})();
