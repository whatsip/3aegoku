/* ═══════════════════════════════════════════
   SLIDER 43 — auto-scroll landscape slider
═══════════════════════════════════════════ */
(function initSlider43() {
  const track      = document.getElementById('s43Track');
  const btnPause   = document.getElementById('s43BtnPause');
  const btnSlow    = document.getElementById('s43BtnSlow');
  const btnFast    = document.getElementById('s43BtnFast');
  const speedDots  = document.getElementById('s43SpeedDots');
  if (!track) return;

  const IMAGES = [
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', label: 'Summit Glow',       color: '#7df9ff' },
    { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80', label: 'Deep Ocean',        color: '#4a9eff' },
    { url: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=800&q=80', label: 'Night Sky',         color: '#7df9ff' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', label: 'Forest Mist',       color: '#4a9eff' },
    { url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80', label: 'Desert Dunes',      color: '#7df9ff' },
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80', label: 'Alpine Lake',       color: '#4a9eff' },
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', label: 'Rocky Peaks',       color: '#7df9ff' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', label: 'Tropic Shore',      color: '#4a9eff' },
    { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', label: 'Storm Light',       color: '#7df9ff' },
    { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80', label: 'Mirror Lake',       color: '#4a9eff' },
    { url: 'https://images.unsplash.com/photo-1445375011782-2384686778a0?w=800&q=80', label: 'Canyon Gold',       color: '#7df9ff' },
    { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80', label: 'Wildflower Bloom',  color: '#4a9eff' },
  ];

  function buildCards(setData) {
    return setData.map((img, i) => {
      const card = document.createElement('div');
      card.className = 's43-card';

      const cardImg = document.createElement('img');
      cardImg.className = 's43-card-img';
      cardImg.src = img.url;
      cardImg.alt = img.label;
      cardImg.loading = 'lazy';

      const overlay = document.createElement('div');
      overlay.className = 's43-card-overlay';

      const num = document.createElement('span');
      num.className = 's43-card-num';
      num.textContent = String(i + 1).padStart(2, '0');

      const label = document.createElement('div');
      label.className = 's43-card-label';
      label.textContent = img.label;

      const halo = document.createElement('div');
      halo.style.cssText = `
        position:absolute; inset:-2px; border-radius:14px; pointer-events:none;
        box-shadow: 0 0 0 1.5px ${img.color}, 0 0 30px 8px ${img.color}44, 0 0 60px 18px ${img.color}22;
        opacity:0; transition: opacity 0.4s ease;
      `;

      card.append(cardImg, overlay, num, label, halo);

      card.addEventListener('mouseenter', () => { halo.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { halo.style.opacity = '0'; card.style.transform = ''; });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform = `scale(1.07) translateY(-8px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg)`;
      });

      return card;
    });
  }

  [...buildCards(IMAGES), ...buildCards(IMAGES), ...buildCards(IMAGES)]
    .forEach(c => track.appendChild(c));

  let offset  = 0;
  let speed   = 0.55;
  let paused  = false;

  function oneSetWidth() {
    const cards = track.querySelectorAll('.s43-card');
    const n  = IMAGES.length;
    let w = 0;
    for (let i = 0; i < n; i++) {
      w += cards[i].getBoundingClientRect().width;
    }
    const gap = parseFloat(getComputedStyle(track).gap) || 10;
    return w + gap * n;
  }

  (function animateS43() {
    if (!paused) {
      offset += speed;
      const sw = oneSetWidth();
      if (sw > 0 && offset >= sw) offset -= sw;
      track.style.transform = `translateX(${-offset}px)`;
    }
    requestAnimationFrame(animateS43);
  })();

  track.addEventListener('mouseenter', () => { if (!paused) paused = true; });
  track.addEventListener('mouseleave', () => {
    if (btnPause && btnPause.textContent.includes('Pause')) paused = false;
  });

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      paused = !paused;
      btnPause.innerHTML = paused ? '&#x25B6; Resume' : '&#x23F8; Pause';
      btnPause.classList.toggle('active', paused);
    });
  }

  const SPEEDS = [0.25, 0.55, 0.9, 1.4, 2.0];
  let speedIdx = 1;

  if (speedDots) {
    SPEEDS.forEach((s, i) => {
      const dot = document.createElement('div');
      dot.className = 's43-speed-dot' + (i === speedIdx ? ' active' : '');
      dot.title = `Speed ${i + 1}`;
      dot.addEventListener('click', () => {
        speedIdx = i; speed = s;
        speedDots.querySelectorAll('.s43-speed-dot')
          .forEach((d, j) => d.classList.toggle('active', j === i));
      });
      speedDots.appendChild(dot);
    });
  }

  btnFast && btnFast.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    speed = SPEEDS[speedIdx];
    speedDots && speedDots.querySelectorAll('.s43-speed-dot')
      .forEach((d, j) => d.classList.toggle('active', j === speedIdx));
  });
})();
