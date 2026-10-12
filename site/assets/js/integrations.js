/* fibby — внешние подключения: Яндекс Метрика, Telegram-ссылки, юр. данные. */

/* ---------- Яндекс Метрика ---------- */

export function initMetrika() {
  const id = window.FB_METRIKA_ID;
  if (!id) return; // счётчика нет — цели уходят в консоль, см. flavor.js

  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();

  const script = document.createElement('script');
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  script.async = true;
  document.head.appendChild(script);

  window.ym(id, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true
  });

  // для посетителей без JS-трекинга
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute;left:-9999px" alt=""></div>`;
  document.body.appendChild(noscript);
}

/* ---------- Telegram ---------- */

export function initTelegramLinks() {
  const nick = window.FB_TELEGRAM;
  document.querySelectorAll('[data-tg]').forEach((el) => {
    if (!nick) {
      // канала пока нет — ссылку не показываем, чтобы не вести в пустоту
      el.setAttribute('aria-disabled', 'true');
      el.removeAttribute('href');
      el.title = 'Ссылка появится, когда заведём канал';
      return;
    }
    el.href = `https://t.me/${String(nick).replace(/^@/, '')}`;
    el.target = '_blank';
    el.rel = 'noopener';
  });
}

/* ---------- юридические данные ---------- */

export function initLegal() {
  const legal = window.FB_LEGAL || {};
  document.querySelectorAll('[data-legal]').forEach((el) => {
    const value = legal[el.dataset.legal];
    if (value) el.textContent = value;
  });
}
