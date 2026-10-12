/* fibby — форма предзаказа: UTM, промокод блогера, валидация, отправка. */

import { state, summary, onChange, reachGoal } from './flavor.js';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'promo'];
const STORE = 'fb_attr';

/* Метки перехода живут 30 дней: блогер привёл сегодня, заказ может быть завтра. */
function attribution() {
  const url = new URLSearchParams(location.search);
  let saved = {};
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < 30 * 24 * 3600 * 1000) saved = parsed.data || {};
    }
  } catch (e) { /* приватный режим — просто работаем без памяти */ }

  const fresh = {};
  UTM_KEYS.forEach((k) => { const v = url.get(k); if (v) fresh[k] = v.slice(0, 120); });

  const data = Object.keys(fresh).length ? fresh : saved;
  if (Object.keys(fresh).length) {
    try { localStorage.setItem(STORE, JSON.stringify({ ts: Date.now(), data: fresh })); } catch (e) {}
  }
  return data;
}

function validContact(value) {
  const v = value.trim();
  if (v.length < 3) return false;
  const isEmail = /^[^\s@]+@[^\s@]+\.[a-zа-я]{2,}$/i.test(v);
  const isTg = /^@?[a-z0-9_]{4,32}$/i.test(v);
  return isEmail || isTg;
}

export function initForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const attr = attribution();
  Object.entries(attr).forEach(([k, v]) => {
    const input = form.querySelector(`input[name="${k}"]`);
    if (input) input.value = v;
  });

  // промокод блогера виден покупателю — это и есть его скидка
  const promo = attr.promo || attr.ref;
  if (promo) {
    const badge = document.querySelector('[data-promo-badge]');
    if (badge) {
      badge.hidden = false;
      badge.querySelector('[data-promo-code]').textContent = promo.toUpperCase();
    }
  }

  const summaryEl = form.querySelector('[data-summary]');
  const paint = () => { if (summaryEl) summaryEl.textContent = summary(); };
  paint();
  onChange(paint);

  const input = form.querySelector('#lead');
  const consent = form.querySelector('input[name="consent"]');
  const error = form.querySelector('.form__error');

  const showError = (msg) => {
    error.textContent = msg;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  };
  const clearError = () => {
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  };
  input.addEventListener('input', clearError);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validContact(input.value)) {
      showError('Нужен e-mail или ник в Telegram — например @fibby или mail@mail.ru');
      input.focus();
      return;
    }
    if (!consent.checked) {
      showError('Нужно согласие на обработку персональных данных.');
      consent.focus();
      return;
    }
    clearError();

    const payload = {
      contact: input.value.trim(),
      flavor: state.flavor,
      plan: state.plan,
      mode: state.mode,
      page: location.pathname,
      ts: new Date().toISOString()
    };
    UTM_KEYS.forEach((k) => {
      const v = form.querySelector(`input[name="${k}"]`)?.value;
      if (v) payload[k] = v;
    });

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    const ok = await send(payload);

    btn.disabled = false;
    btn.textContent = 'Хочу первым';

    if (!ok) {
      showError('Не отправилось. Попробуй ещё раз или напиши нам в Telegram.');
      return;
    }

    reachGoal('lead_submit', { plan: state.plan, flavor: state.flavor, mode: state.mode });
    form.hidden = true;
    const thanks = document.getElementById('thanks');
    thanks.hidden = false;
    thanks.querySelector('.thanks__title').focus?.();
  });
}

/* Куда уходят заявки. Пока приёмник не выбран (этап 6) — заявка не теряется:
   складываем её в localStorage, чтобы ни один контакт не пропал. */
async function send(payload) {
  const endpoint = window.FB_LEAD_ENDPOINT;

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return true;
    } catch (e) { /* падаем в локальный запас ниже */ }
  }

  try {
    const queue = JSON.parse(localStorage.getItem('fb_leads') || '[]');
    queue.push(payload);
    localStorage.setItem('fb_leads', JSON.stringify(queue));
  } catch (e) {}

  if (!endpoint) {
    console.warn('[fibby] Приёмник заявок не подключён. Заявка сохранена в localStorage.fb_leads:', payload);
    return true; // до этапа 6 показываем «спасибо», контакт лежит локально
  }
  return false;
}
