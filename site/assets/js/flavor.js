/* fibby — переключатель вкуса.
   Меняет класс на <html>, остальное делают CSS-переменные в tokens.css. */

const FLAVORS = {
  apple:     { cls: '',                  name: 'зелёное яблоко', label: 'Яблоко' },
  raspberry: { cls: 'flavor-raspberry',  name: 'малина',         label: 'Малина' },
  mango:     { cls: 'flavor-mango',      name: 'манго',          label: 'Манго' }
};

export const state = { flavor: 'apple', plan: '3', mode: 'sub' };

const listeners = [];
export function onChange(fn) { listeners.push(fn); }
function emit() { listeners.forEach((fn) => fn(state)); }

export function setFlavor(key) {
  if (!FLAVORS[key] || state.flavor === key) return;
  state.flavor = key;

  const root = document.documentElement;
  Object.values(FLAVORS).forEach((f) => f.cls && root.classList.remove(f.cls));
  if (FLAVORS[key].cls) root.classList.add(FLAVORS[key].cls);

  document.querySelectorAll('[data-flavor-name]').forEach((el) => {
    el.textContent = FLAVORS[key].name;
  });
  document.querySelectorAll('.flavor').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.flavor === key));
  });
  const hidden = document.querySelector('input[name="flavor"]');
  if (hidden) hidden.value = key;

  emit();
  reachGoal('flavor_change', { flavor: key });
}

export function setPlan(id) {
  if (state.plan === id) return;
  state.plan = id;
  document.querySelectorAll('.plan').forEach((card) => {
    const sel = card.dataset.plan === id;
    card.setAttribute('aria-current', String(sel));
    const btn = card.querySelector('[data-pick-plan]');
    btn.textContent = sel ? 'Выбрано · оформить предзаказ' : 'Выбрать';
    btn.classList.toggle('btn--accent', sel);
    btn.classList.toggle('btn--brand', !sel);
  });
  const hidden = document.querySelector('input[name="plan"]');
  if (hidden) hidden.value = id;
  emit();
  reachGoal('plan_select', { plan: id });
}

export function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
  });
  const text = mode === 'sub'
    ? 'по подписке, раз в месяц · отмена в любой момент'
    : 'разовая покупка';
  document.querySelectorAll('[data-mode-text]').forEach((el) => { el.textContent = text; });
  const hidden = document.querySelector('input[name="mode"]');
  if (hidden) hidden.value = mode;
  emit();
}

export function summary() {
  const planName = state.plan === '3' ? '3 пачки' : '1 пачка';
  const modeName = state.mode === 'sub' ? 'по подписке' : 'разово';
  return `${planName} · ${FLAVORS[state.flavor].label.toLowerCase()} · ${modeName}`;
}

/* Яндекс Метрика: цели. Счётчик подключается на этапе 6, до этого — тихо в консоль. */
export function reachGoal(goal, params) {
  const id = window.FB_METRIKA_ID;
  if (id && typeof window.ym === 'function') {
    window.ym(id, 'reachGoal', goal, params);
  } else if (window.FB_DEBUG) {
    console.log('[цель]', goal, params || '');
  }
}

export function initControls() {
  document.querySelectorAll('.flavor').forEach((btn) => {
    btn.addEventListener('click', () => setFlavor(btn.dataset.flavor));
  });
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
  document.querySelectorAll('[data-pick-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.pickPlan;
      if (state.plan === id) {
        document.getElementById('preorder').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('lead').focus({ preventScroll: true });
      } else {
        setPlan(id);
      }
    });
  });

  // клики по кнопкам предзаказа — цель метрики
  document.querySelectorAll('[data-metrika]').forEach((el) => {
    el.addEventListener('click', () => reachGoal('preorder_click', { place: el.dataset.metrika }));
  });

  // стрелки влево/вправо по переключателю вкуса
  const flavorKeys = Object.keys(FLAVORS);
  document.querySelector('.flavors')?.addEventListener('keydown', (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = flavorKeys[(flavorKeys.indexOf(state.flavor) + dir + flavorKeys.length) % flavorKeys.length];
    setFlavor(next);
    document.querySelector(`.flavor[data-flavor="${next}"]`)?.focus();
  });
}
