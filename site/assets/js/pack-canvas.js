/* fibby — сцена с пачкой.

   Два режима:
   1. Кадры есть (window.FB_FRAMES задан) — рисуем секвенцию webp в <canvas>
      по прогрессу скролла. Так сделано у trenchies.co.
   2. Кадров ещё нет — работает CSS-заглушка: пачка поворачивается и
      приподнимается, кубики высыпаются вниз. Механика скролла та же,
      поэтому при появлении рендера меняется только режим. */

export function initPackScene({ gsap, ScrollTrigger, canAnimate }) {
  const stage = document.getElementById('pack-stage');
  if (!stage) return;

  const frames = window.FB_FRAMES; // { path, count, ext }
  if (frames && frames.count) {
    initSequence({ stage, frames, gsap, ScrollTrigger, canAnimate });
  } else {
    initFallback({ stage, gsap, ScrollTrigger, canAnimate });
  }
}

/* ---------- режим 1: секвенция кадров ---------- */

function initSequence({ stage, frames, gsap, ScrollTrigger, canAnimate }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pack-stage__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Пачка fibby — мармелад с клетчаткой');
  stage.appendChild(canvas);
  stage.classList.add('has-sequence');

  const ctx = canvas.getContext('2d', { alpha: true });
  const images = [];
  let loaded = 0;
  const current = { frame: 0 };

  const src = (i) => `${frames.path}${String(i).padStart(4, '0')}.${frames.ext || 'webp'}`;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = stage.getBoundingClientRect();
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
    draw();
  };

  const draw = () => {
    const img = images[Math.round(current.frame)];
    if (!img || !img.complete) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // вписываем кадр по центру, сохраняя пропорции
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  };

  // первый кадр грузим сразу, остальные — лениво, чтобы не портить LCP
  for (let i = 0; i < frames.count; i++) {
    const img = new Image();
    img.decoding = 'async';
    if (i > 0) img.loading = 'lazy';
    img.onload = () => { loaded++; if (i === 0) draw(); };
    img.src = src(i);
    images.push(img);
  }

  window.addEventListener('resize', resize);
  resize();

  if (!canAnimate) return;

  gsap.to(current, {
    frame: frames.count - 1,
    ease: 'none',
    snap: 'frame',
    onUpdate: draw,
    scrollTrigger: {
      trigger: stage,
      start: 'top 70%',
      endTrigger: '#how',
      end: 'center center',
      scrub: 0.6
    }
  });
}

/* ---------- режим 2: CSS-заглушка ---------- */

function initFallback({ stage, gsap, ScrollTrigger, canAnimate }) {
  if (!canAnimate) return;

  const pack = stage.querySelector('.pack');
  const inner = stage.querySelectorAll('.pack__fill .fb-cube');
  const glow = stage.querySelector('.pack-stage__glow');
  if (!pack) return;

  // пачка живёт на скролле: доворачивается и приподнимается
  gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top 65%',
      endTrigger: '#how',
      end: 'center center',
      scrub: 0.8
    }
  })
    .fromTo(pack,
      { rotateZ: -3, rotateY: 0, scale: 1 },
      { rotateZ: 6, rotateY: -16, scale: 1.04, ease: 'none' }, 0)
    .fromTo(glow, { scale: 1 }, { scale: 1.25, ease: 'none' }, 0)
    // кубики «высыпаются»: уходят вниз и в стороны, растворяясь
    .fromTo(inner,
      { y: 0, opacity: 0.9 },
      {
        y: (i) => 120 + i * 26,
        x: (i) => (i % 2 ? 1 : -1) * (24 + i * 8),
        rotate: (i) => (i % 2 ? 1 : -1) * 70,
        opacity: 0,
        ease: 'power1.in',
        stagger: 0.06
      }, 0);

  // кубики в карточке «вот так выглядит 5 г» подпрыгивают, когда она появляется
  const target = document.getElementById('cube-target');
  if (target) {
    gsap.from(target.querySelectorAll('.fb-cube'), {
      y: -60,
      opacity: 0,
      rotate: 25,
      duration: 0.7,
      ease: 'back.out(1.7)',
      stagger: 0.12,
      scrollTrigger: { trigger: target, start: 'top 95%' }
    });
  }
}
