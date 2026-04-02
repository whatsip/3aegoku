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

  let W = 0, H = 0, t = 0, sp = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', debounce(resize, 100));
  resize();

  function updateSP() {
    const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    sp = window.scrollY / maxS;
  }
  window.addEventListener('scroll', updateSP, { passive: true });

  const lerp    = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v)       => Math.min(1, Math.max(0, v));
  const rand    = (a, b)    => a + Math.random() * (b - a);
  function depthAlpha(sp, enter, peak, exit) {
    if (sp < enter || sp > exit) return 0;
    if (sp < peak) return (sp - enter) / (peak - enter);
    if (sp > peak) return 1 - (sp - peak) / (exit - peak);
    return 1;
  }

  const BG_ZONES = [
    { sp: 0.00, top: [148, 218, 250], bot: [72,  175, 228] },
    { sp: 0.08, top: [48,  162, 218], bot: [22,  112, 178] },
    { sp: 0.22, top: [18,  100, 162], bot: [8,    64, 128] },
    { sp: 0.42, top: [8,    58, 118], bot: [4,    32,  80] },
    { sp: 0.62, top: [4,    28,  74], bot: [2,    14,  46] },
    { sp: 0.82, top: [2,    14,  42], bot: [1,     7,  28] },
    { sp: 1.00, top: [4,    22,  26], bot: [2,    11,  15] },
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

  const RAYS = Array.from({ length: 7 }, () => ({
    xPos:    rand(0.08, 0.92),
    angle:   rand(-0.22, 0.22),
    halfW:   rand(0.018, 0.045),
    phase:   rand(0, Math.PI * 2),
    speed:   rand(0.0004, 0.0008),
    opacity: rand(0.045, 0.09),
  }));

  const CAUSTICS = Array.from({ length: 14 }, () => ({
    x:     rand(0, 1),
    y:     rand(0, 0.55),
    r:     rand(0.025, 0.08),
    phase: rand(0, Math.PI * 2),
    speed: rand(0.007, 0.018),
  }));

  const BUBBLES = Array.from({ length: 38 }, () => ({
    x:      rand(0, 1),
    y:      rand(0, 1),
    r:      rand(1.5, 5),
    vy:     rand(0.00025, 0.0007),
    wobble: rand(0, Math.PI * 2),
    ws:     rand(0.018, 0.04),
    op:     rand(0.12, 0.42),
    depth:  rand(0.05, 0.88),
  }));

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
      glowColor:  null,
    };
  }

  const SMALL_FISH = Array.from({ length: 18 }, () =>
    makeFish(rand(0.08, 0.44), rand(10, 24), 1.1,
      ['rgba(205,232,248,0.82)', 'rgba(188,218,238,0.80)', 'rgba(225,242,255,0.78)'],
      'rgba(245,252,255,0.95)')
  );

  const MED_FISH = Array.from({ length: 7 }, () =>
    makeFish(rand(0.30, 0.66), rand(34, 58), 0.8,
      ['rgba(78,148,205,0.86)', 'rgba(60,128,192,0.86)', 'rgba(98,162,215,0.82)'],
      'rgba(148,202,238,0.9)')
  );

  const BIG_FISH = Array.from({ length: 3 }, () => {
    const f = makeFish(rand(0.58, 0.90), rand(78, 132), 0.45,
      ['rgba(32,78,148,0.92)', 'rgba(25,65,138,0.92)', 'rgba(45,92,162,0.88)'],
      'rgba(80,165,225,0.88)');
    f.glowColor = 'rgba(80,200,255,0.18)';
    return f;
  });

  function r(a, b) { return Math.round(rand(a, b)); }

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

  const ROCKS = Array.from({ length: 14 }, () => ({
    x:    rand(0, 1),
    w:    rand(0.025, 0.065),
    h:    rand(0.032, 0.075),
    tilt: rand(-0.35, 0.35),
    c:    `rgba(${r(18,42)},${r(36,64)},${r(26,50)},0.92)`,
  }));

  const MOSS = Array.from({ length: 28 }, () => ({
    x:     rand(0, 1),
    yOff:  rand(0, 0.042),
    r:     rand(0.012, 0.048),
    phase: rand(0, Math.PI * 2),
    c:     `rgba(${r(8,30)},${r(68,112)},${r(18,46)},0.78)`,
  }));

  function drawBackground() {
    const c   = getBgRGB(sp);
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, `rgb(${c.top})`);
    grd.addColorStop(1, `rgb(${c.bot})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function drawSurface() {
    const a = depthAlpha(sp, 0, 0, 0.12);
    if (a <= 0) return;

    const sy = H * clamp01(0.35 - sp * 3.2);

    if (sy > 0) {
      const skyGrd = ctx.createLinearGradient(0, 0, 0, sy);
      skyGrd.addColorStop(0,   `rgba(165,222,255,${a})`);
      skyGrd.addColorStop(0.55,`rgba(208,238,255,${a})`);
      skyGrd.addColorStop(1,   `rgba(180,228,252,${a * 0.85})`);
      ctx.fillStyle = skyGrd;
      ctx.fillRect(0, 0, W, sy);

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

        const flareW = W * 0.04;
        const flareGrd = ctx.createLinearGradient(sunX - flareW, sy, sunX + flareW, sy);
        flareGrd.addColorStop(0,   'rgba(255,255,220,0)');
        flareGrd.addColorStop(0.5, `rgba(255,255,220,${sunA * 0.45})`);
        flareGrd.addColorStop(1,   'rgba(255,255,220,0)');
        ctx.fillStyle = flareGrd;
        ctx.fillRect(sunX - W * 0.25, sy - 3, W * 0.5, 6);
      }
    }

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
    ctx.strokeStyle = 'rgba(200,240,255,0.22)';
    ctx.lineWidth   = 8;
    ctx.filter      = 'blur(4px)';
    ctx.stroke();
    ctx.filter      = 'none';
    ctx.restore();
  }

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
      ctx.fillStyle = 'rgba(230,248,255,0.35)';
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.32, by - b.r * 0.32, b.r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

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

  function drawOneFish(f) {
    const localA = depthAlpha(sp, f.worldDepth - 0.20, f.worldDepth, f.worldDepth + 0.20);
    if (localA <= 0) return;

    f.phase     += f.phaseSpeed;
    f.vertPhase += 0.009;
    f.x         += f.speed;
    f.y         += Math.sin(f.vertPhase) * 0.00025;

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

    if (f.glowColor) {
      ctx.shadowColor = f.glowColor;
      ctx.shadowBlur  = 28;
    }

    ctx.translate(drawX, drawY);
    if (!f.facingRight) ctx.scale(-1, 1);

    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, wag * 0.62);
    ctx.lineTo(-s * 1.32, -s * 0.54 + wag * 1.85);
    ctx.lineTo(-s * 0.88, wag * 0.35);
    ctx.lineTo(-s * 1.32,  s * 0.54 + wag * 1.85);
    ctx.closePath();
    ctx.fill();

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

    ctx.beginPath();
    ctx.moveTo(s * 0.08, -s * 0.33 + wag2 * 0.35);
    ctx.quadraticCurveTo(-s * 0.15, -s * 0.72 + wag2 * 0.5, -s * 0.38, -s * 0.35 + wag2 * 0.42);
    ctx.closePath();
    ctx.fillStyle = f.color;
    ctx.globalAlpha *= 0.55;
    ctx.fill();
    ctx.globalAlpha /= 0.55;

    ctx.beginPath();
    ctx.moveTo(s * 0.6, s * 0.08);
    ctx.bezierCurveTo(s * 0.2, s * 0.36, -s * 0.2, s * 0.32, -s * 0.5, s * 0.18);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = s * 0.06;
    ctx.lineCap     = 'round';
    ctx.stroke();

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

  function drawBottom() {
    const a = depthAlpha(sp, 0.76, 0.90, 1.0);
    if (a <= 0) return;

    ctx.save();
    ctx.globalAlpha = a;

    const sedH = H * 0.18;
    const sedGrd = ctx.createLinearGradient(0, H - sedH, 0, H);
    sedGrd.addColorStop(0,   'rgba(6,22,14,0)');
    sedGrd.addColorStop(0.38,'rgba(4,18,10,0.55)');
    sedGrd.addColorStop(1,   'rgba(3,12,8,0.88)');
    ctx.fillStyle = sedGrd;
    ctx.fillRect(0, H - sedH, W, sedH);

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
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.ellipse(-rw * 0.12, -rh * 0.18, rw * 0.24, rh * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    MOSS.forEach(m => {
      m.phase += 0.004;
      const mx = m.x * W;
      const my = H - m.yOff * H;
      const mr = m.r * W;
      ctx.fillStyle = m.c;
      ctx.beginPath();
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
    drawSurface();
  }

  draw();
})();
