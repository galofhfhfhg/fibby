/* fibby — настройки сайта.
   Это единственный файл, который нужно править руками.
   Всё остальное подхватится само. Инструкции — site/integrations/README.md */

/* 1. Куда уходят заявки.
   Ссылка на Google Apps Script (см. site/integrations/README.md, шаг 1-5).
   Пока null — заявки складываются в браузере и в консоли, ничего не теряется,
   но и к тебе не приходят. */
window.FB_LEAD_ENDPOINT = null;

/* 2. Номер счётчика Яндекс Метрики. Только цифры, например 98765432.
   Пока null — метрика не подключается, цели пишутся в консоль браузера. */
window.FB_METRIKA_ID = null;

/* 3. Telegram-канал бренда. Ник без собачки, например 'fibby_ru'. */
window.FB_TELEGRAM = null;

/* 4. Юридические данные для подвала и политики ПДн.
   Пока пусто — на сайте остаются плейсхолдеры [__]. */
window.FB_LEGAL = {
  entity: null,   // 'ИП Иванов Иван Иванович'
  inn: null,      // '770123456789'
  email: null     // 'hi@fibby.ru' — для отзыва согласия на обработку данных
};

/* 5. Кадры 3D-пачки. Заполнить, когда придёт рендер.
   Подробности — site/assets/frames/README.md */
window.FB_FRAMES = null;
// window.FB_FRAMES = { path: 'assets/frames/pack-', count: 120, ext: 'webp' };

/* 6. Отладка: true — цели и заявки видно в консоли браузера. */
window.FB_DEBUG = true;
