/**
 * fibby — приёмник заявок с лендинга.
 *
 * Пишет каждую заявку строкой в Google-таблицу и сразу присылает её
 * в Telegram. Токен бота лежит здесь, в коде сайта его нет.
 *
 * Как подключить — site/integrations/README.md
 */

// Заполняется в «Настройки проекта» → «Свойства скрипта» (см. README, шаг 3).
// В коде секретов не держим.
const PROPS = PropertiesService.getScriptProperties();

const SHEET_NAME = 'Заявки';

const COLUMNS = [
  'Когда', 'Контакт', 'Вкус', 'Набор', 'Тип',
  'Промокод', 'ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const contact = String(data.contact || '').trim();
    if (!contact) return json({ ok: false, error: 'empty contact' });

    saveRow(data);
    notifyTelegram(data);

    return json({ ok: true });
  } catch (err) {
    // заявку не теряем: пишем ошибку в журнал выполнений
    console.error(err);
    return json({ ok: false, error: String(err) });
  }
}

/** Проверка, что скрипт опубликован: открой ссылку в браузере. */
function doGet() {
  return json({ ok: true, service: 'fibby leads' });
}

function saveRow(data) {
  const ss = SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID'));
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date(),
    data.contact || '',
    flavorName(data.flavor),
    data.plan === '3' ? '3 пачки' : '1 пачка',
    data.mode === 'sub' ? 'подписка' : 'разово',
    data.promo || '',
    data.ref || '',
    data.utm_source || '',
    data.utm_medium || '',
    data.utm_campaign || '',
    data.utm_content || '',
    data.utm_term || ''
  ]);
}

function notifyTelegram(data) {
  const token = PROPS.getProperty('TG_TOKEN');
  const chatId = PROPS.getProperty('TG_CHAT_ID');
  if (!token || !chatId) return; // Telegram не настроен — таблицы достаточно

  const lines = [
    '🫐 Новая заявка на предзаказ',
    '',
    'Контакт: ' + (data.contact || '—'),
    'Вкус: ' + flavorName(data.flavor),
    'Набор: ' + (data.plan === '3' ? '3 пачки' : '1 пачка'),
    'Тип: ' + (data.mode === 'sub' ? 'подписка' : 'разово')
  ];

  const promo = data.promo || data.ref;
  if (promo) lines.push('Промокод: ' + promo);
  if (data.utm_source) lines.push('Источник: ' + data.utm_source + (data.utm_campaign ? ' / ' + data.utm_campaign : ''));

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
      disable_web_page_preview: true
    })
  });
}

function flavorName(key) {
  return { apple: 'яблоко', raspberry: 'малина', mango: 'манго' }[key] || key || '—';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Запусти один раз в редакторе, чтобы проверить таблицу и Telegram. */
function testLead() {
  const demo = {
    contact: '@test_fibby',
    flavor: 'apple',
    plan: '3',
    mode: 'sub',
    promo: 'TEST10',
    utm_source: 'telegram'
  };
  saveRow(demo);
  notifyTelegram(demo);
}
