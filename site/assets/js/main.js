/* fibby — анимации и интерактив.
   GSAP, ScrollTrigger и Lenis подключены в index.html обычными <script>,
   поэтому берём их из window. Если библиотеки не загрузились — сайт
   продолжает работать, просто без анимаций. */

import { initControls, setFlavor } from './flavor.js';
import { initForm } from './form.js';
import { initPackScene } from './pack-canvas.js';
import { initMetrika, initTelegramLinks, initLegal } from './integrations.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate = Boolean(gsap && ScrollTrigger) && !reduced;

document.documentElement.classList.add('js');
if (reduced) document.documentElement.classList.add('reduced');

/* ---------- плавный скролл ---------- */

function initSmoothScroll() {
  if (reduced || !window.Lenis) return null;

  const lenis = new window.Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false // на телефоне оставляем родную инерцию — она лучше
  });

  if (ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // якорные ссылки едут через Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70, duration: 1.2 });
    });
  });

  return lenis;
}

/* ---------- первый экран: заголовок из-под маски ---------- */

function initHero() {
  const h1 = document.querySelector('.hero__copy .h1');
  if (!h1) return;

  // разбиваем заголовок по строкам: каждое слово в маску, строки соберутся сами
  const words = h1.textContent.trim().split(/\s+/);
  const accentWord = h1.querySelector('.accent')?.textContent.trim();
  h1.textContent = '';
  const spans = words.map((w) => {
    const mask = document.createElement('span');
    mask.className = 'mask';
    const inner = document.createElement('span');
    inner.className = 'mask__in';
    if (accentWord && w === accentWord) inner.classList.add('accent');
    inner.textContent = w;
    mask.appendChild(inner);
    h1.appendChild(mask);
    h1.appendChild(document.createTextNode(' '));
    return inner;
  });

  // первый экран анимирует только вступительный таймлайн,
  // поэтому убираем его элементы из системы «появление на скролле»
  const heroItems = document.querySelectorAll('#top [data-reveal]');
  heroItems.forEach((el) => el.removeAttribute('data-reveal'));

  if (!canAnimate) { spans.forEach((s) => { s.style.transform = 'none'; }); return; }

  // задаём сдвиг через GSAP, иначе он спорит с CSS-сдвигом в пикселях
  gsap.set(spans, { yPercent: 110, y: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to(spans, { yPercent: 0, duration: 0.9, stagger: 0.07 })
    .fromTo('.hero__copy .eyebrow', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
    .fromTo('.hero__copy .lead', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6 }, 0.45)
    .fromTo('.hero__cta > *', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.6)
    .fromTo('.hero__ticks .tick', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 }, 0.75)
    .fromTo('.pack-stage', { opacity: 0, scale: 0.94, y: 28 }, { opacity: 1, scale: 1, y: 0, duration: 1.1 }, 0.15)
    .fromTo('.flavors .flavor', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 }, 0.9)
    .fromTo('.pack-stage__hint', { opacity: 0, rotate: 4 }, { opacity: 1, rotate: -5, duration: 0.5 }, 1.1);
}

/* ---------- появление блоков на скролле ---------- */

function initReveals() {
  if (!canAnimate) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.removeAttribute('data-reveal'));
    return;
  }

  // элементы внутри одной секции выезжают друг за другом
  document.querySelectorAll('section, footer').forEach((section) => {
    const items = section.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: section, start: 'top 78%' }
    });
  });
}

/* ---------- бегущие строки ---------- */

function initMarquees() {
  document.querySelectorAll('.marquee').forEach((marquee) => {
    const track = marquee.querySelector('.marquee__track');
    if (!track) return;

    if (!canAnimate) return; // остаётся CSS-анимация / статика

    track.style.animation = 'none';
    const half = track.scrollWidth / 2;
    const speed = marquee.classList.contains('marquee--band') ? 60 : 45; // px/с
    const tween = gsap.to(track, {
      x: -half,
      duration: half / speed,
      ease: 'none',
      repeat: -1
    });

    marquee.addEventListener('mouseenter', () => tween.timeScale(0.25));
    marquee.addEventListener('mouseleave', () => tween.timeScale(1));
  });
}

/* ---------- кубики отталкиваются от курсора ---------- */

function initMagneticCubes() {
  if (!canAnimate || window.matchMedia('(pointer: coarse)').matches) return;

  const stage = document.getElementById('pack-stage');
  if (!stage) return;
  const cubes = [...stage.querySelectorAll('.cube-float')];
  if (!cubes.length) return;

  cubes.forEach((c) => { c.style.animation = 'none'; });

  // мягкое парение через GSAP, чтобы не спорило с отталкиванием
  cubes.forEach((cube, i) => {
    gsap.to(cube, {
      y: -14,
      rotate: `+=${8 + i * 3}`,
      duration: 2.6 + i * 0.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.5
    });
  });

  const setters = cubes.map((c) => ({
    x: gsap.quickTo(c, 'x', { duration: 0.7, ease: 'power3.out' }),
    el: c
  }));

  stage.addEventListener('pointermove', (e) => {
    const box = stage.getBoundingClientRect();
    const mx = e.clientX - box.left;
    const my = e.clientY - box.top;

    setters.forEach(({ x, el }) => {
      const r = el.getBoundingClientRect();
      const cx = r.left - box.left + r.width / 2;
      const cy = r.top - box.top + r.height / 2;
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.hypot(dx, dy);
      const radius = 180;
      if (dist < radius) {
        const push = (1 - dist / radius) * 46;
        x((dx / (dist || 1)) * push);
        gsap.to(el, { y: (dy / (dist || 1)) * push - 14, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
      } else {
        x(0);
      }
    });
  });

  stage.addEventListener('pointerleave', () => {
    setters.forEach(({ x }) => x(0));
  });
}

/* ---------- FAQ ---------- */

function initFaq() {
  document.querySelectorAll('.faq__item').forEach((item) => {
    const btn = item.querySelector('.faq__q');
    const answer = item.querySelector('.faq__a');
    const sign = item.querySelector('.faq__sign');

    btn.addEventListener('click', () => {
      const open = item.dataset.open === 'true';

      // аккордеон: открыт один
      document.querySelectorAll('.faq__item[data-open="true"]').forEach((other) => {
        if (other === item) return;
        other.dataset.open = 'false';
        other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq__sign').textContent = '+';
        if (canAnimate) gsap.to(other.querySelector('.faq__a'), { height: 0, opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: () => { other.querySelector('.faq__a').style.height = ''; } });
      });

      item.dataset.open = String(!open);
      btn.setAttribute('aria-expanded', String(!open));
      sign.textContent = open ? '+' : '−';

      if (!canAnimate) return;
      if (open) {
        gsap.to(answer, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: () => { answer.style.height = ''; } });
      } else {
        gsap.fromTo(answer, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out', onComplete: () => { answer.style.height = ''; } });
      }
    });
  });
}

/* ---------- шапка: тень при скролле ---------- */

function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- старт ---------- */

initMetrika();
initTelegramLinks();
initLegal();
initControls();
initForm();
initFaq();
initHeader();
initSmoothScroll();
initHero();
initReveals();
initMarquees();
initMagneticCubes();
initPackScene({ gsap, ScrollTrigger, canAnimate });

// шрифты меняют высоту текста: пересчитываем точки старта анимаций
if (ScrollTrigger && document.fonts) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
window.addEventListener('load', () => ScrollTrigger && ScrollTrigger.refresh());

// вкус из ссылки: ?flavor=mango — для промо-ссылок блогеров
const urlFlavor = new URLSearchParams(location.search).get('flavor');
if (urlFlavor) setFlavor(urlFlavor);
