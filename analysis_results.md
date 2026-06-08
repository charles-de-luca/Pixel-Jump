# Pixel Jump — Обновлённый Отчёт о Состоянии Проекта
**Версия:** v2.0 | **Дата:** 31.05.2026 | **Платформа:** Firebase Hosting

---

## 🟢 Исправлено (Статус — ОК)

| # | Проблема | Статус |
|---|----------|--------|
| 1 | **Зависание на экране загрузки** — Mock CloudStorage теперь вызывает callback | ✅ Исправлено |
| 2 | **Загрузка рекорда** — `getHighScore()` обёрнута в Promise | ✅ Исправлено |
| 3 | **Service Worker пути** — относительные пути (`./`, `index.html`), без `/prefix` | ✅ Исправлено |
| 4 | **Firestore правила** — запись `leaderboard/{uid}` привязана к `request.auth.uid` | ✅ Исправлено |
| 5 | **Leaderboard.js** — запись через `auth.currentUser.uid` вместо Telegram ID | ✅ Исправлено |
| 6 | **Импорты settings-skins.js, daily-challenge.js** — добавлены в main.v3.js | ✅ Исправлено |
| 7 | **NaN в отображении рекорда** — добавлены защиты `isNaN()` | ✅ Исправлено |
| 8 | **Дублирование event listeners** — проведена консолидация | ✅ Исправлено |

---

## 🔴 Критические Баги (требуют немедленного исправления)

### BUG-01 — `cloud-sync.js` использует Telegram ID как ключ документа
**Файл:** [`cloud-sync.js`](file:///home/anonimous/Документы/web/public/cloud-sync.js#L24-L33)  
**Серьёзность:** 🔴 Критическая (безопасность)

В `cloud-sync.js` метод `_getUserId()` возвращает `window.userProfile.id`, которое равно строке `"telegram_12345"` (Telegram ID пользователя). При этом **правило Firestore для коллекции `players`** требует лишь `request.auth != null` (любой авторизованный пользователь может писать в любой документ). Это создаёт дыру: злоумышленник может перезаписать прогресс чужого игрока.

```js
// cloud-sync.js L28 — использует Telegram ID, а не Firebase UID
_getUserId() {
    const profile = window.userProfile;
    if (profile && profile.id && ...) {
        this._userId = profile.id; // ← "telegram_12345", небезопасно!
    }
}
```

**Также:** `firestore.rules` для коллекции `players` разрешает запись любому авторизованному пользователю, а не только владельцу:
```
match /players/{playerId} {
    allow write: if request.auth != null; // ← Любой может перезаписать любого!
}
```

**Исправление:**  
1. `cloud-sync.js` должен использовать `auth.currentUser?.uid` вместо Telegram ID  
2. `firestore.rules` должен ограничить запись: `request.auth.uid == playerId`

---

### BUG-02 — `submitToLeaderboard` вызывается, но НЕ ждёт завершения
**Файл:** [`main.v3.js`](file:///home/anonimous/Документы/web/public/main.v3.js#L906-L908)  
**Серьёзность:** 🔴 Критическая (потеря данных)

`handleGameOver()` — синхронная функция, вызывающая `submitToLeaderboard(score)` **без `await`**. Это async-функция, и результат её выполнения теряется. Ошибки не логируются, промис не обрабатывается.

```js
// main.v3.js L906 — вызов без await!
if (score > 10) {
    submitToLeaderboard(score); // ← ПРОБЛЕМА: нет await, нет .catch()
}
```

**Исправление:** Добавить `.catch()`:
```js
if (score > 10) {
    submitToLeaderboard(score).catch(e => console.warn('Leaderboard submit failed:', e));
}
```

---

### BUG-03 — SW кэширует только 14 из 17+ JS-файлов проекта
**Файл:** [`sw.js`](file:///home/anonimous/Документы/web/public/sw.js#L6-L24)  
**Серьёзность:** 🔴 Критическая (PWA offline)

В `CRITICAL_URLS` отсутствуют следующие файлы, необходимые для работы игры:

| Файл | Есть в SW? |
|------|-----------|
| `ghost.js` | ❌ Нет |
| `tutorial.js` | ❌ Нет |
| `device-utils.js` | ❌ Нет |
| `i18n.js` | ❌ Нет |
| `cloud-sync.js` | ❌ Нет |
| `firebase-config.js` | ❌ Нет |
| `characters.js` | ✅ Есть |
| `perks.js` | ✅ Есть |
| `skin-effects.js` | ✅ Есть |
| `manifest.json` | ❌ Нет |

При работе в оффлайн-режиме или нестабильной сети игра упадёт, так как модули не загрузятся из кэша.

---

## 🟡 Средние Баги (ухудшают работу, но не блокируют)

### BUG-04 — `sendGameEvent` пишет в Firebase analytics при КАЖДОМ событии
**Файл:** [`telegram.js`](file:///home/anonimous/Документы/web/public/telegram.js#L462-L485)  
**Серьёзность:** 🟡 Средняя (расходы Firebase)

Каждый вызов `sendGameEvent('game_over', ...)` создаёт новый документ в коллекции `analytics`. Если пользователь играет 50 раз в день, это 50 записей. На 1000 пользователей — 50 000 операций записи в день. Приведёт к неожиданным расходам на Firebase.

**Нет правила в `firestore.rules`** для коллекции `analytics` — любой пользователь может читать чужую аналитику.

**Исправление:** Добавить правило в `firestore.rules`:
```
match /analytics/{docId} {
    allow read: if false; // Только серверный доступ
    allow create: if request.auth != null;
}
```

---

### BUG-05 — `cloud-sync.js` хранит прогресс по Telegram ID, но `leaderboard.js` — по Firebase UID
**Файл:** [`cloud-sync.js`](file:///home/anonimous/Документы/web/public/cloud-sync.js) + [`leaderboard.js`](file:///home/anonimous/Документы/web/public/leaderboard.js)  
**Серьёзность:** 🟡 Средняя (рассинхронизация данных)

Разные части кода используют разные идентификаторы:

| Модуль | Ключ документа Firestore |
|--------|--------------------------|
| `leaderboard.js` | `auth.currentUser.uid` ✅ |
| `cloud-sync.js` | `telegram_12345` ❌ |
| `firebase-config.js` | `globalThis.firebaseUserId` (Firebase UID) ✅ |

Это ведёт к тому, что у одного игрока будут два отдельных документа в разных коллекциях с разными ключами, и прогресс может не синхронизироваться.

---

### BUG-06 — `triggerHapticFeedback()` вызывает `initTelegram()` при каждом нажатии
**Файл:** [`telegram.js`](file:///home/anonimous/Документы/web/public/telegram.js#L601-L610)  
**Серьёзность:** 🟡 Средняя (производительность)

```js
export function triggerHapticFeedback(type = 'light') {
    const tg = initTelegram(); // ← Вызывает полную инициализацию при КАЖДОМ нажатии!
```

`initTelegram()` содержит логику установки цветов, вызов `tg.expand()`, `enableClosingConfirmation()` и т.д. Повторный вызов этих методов каждый раз при тактильном фидбэке может вызывать нежелательные эффекты.

**Исправление:** Кэшировать ссылку на `tg` в модуле или вынести haptic в отдельный метод.

---

### BUG-07 — `handleGameOver()` не вызывает `checkProgress` Daily Challenge при новом рекорде
**Файл:** [`main.v3.js`](file:///home/anonimous/Документы/web/public/main.v3.js#L952-L978)  
**Серьёзность:** 🟡 Средняя (логика)

При победе в duel mode функция делает `return` до того, как успевает выполниться `checkProgress` Daily Challenge:

```js
// L953-L977: При duel mode — ранний return!
if (currentChallengeData) {
    showScreen('challenge-result-screen');
    // ... UI update ...
    return; // ← Daily Challenge НЕ проверяется!
}
```

Игрок не получит зачёт за ежедневный вызов, если сыграл в duel mode.

---

### BUG-08 — `window.onerror` показывает `alert()` для ВСЕХ ошибок, включая третьестороннее
**Файл:** [`main.v3.js`](file:///home/anonimous/Документы/web/public/main.v3.js#L1144-L1148)  
**Серьёзность:** 🟡 Средняя (UX)

```js
window.onerror = function (msg, url, line, col, error) {
    alert(`CRITICAL ERROR:\n${msg}\nLine: ${line}`); // ← Алерт для ЛЮБОЙ ошибки!
```

Любая мелкая ошибка в сторонней библиотеке (Firebase SDK, Telegram SDK) вызовет раздражающий alert у пользователя. В продакшне это неприемлемо.

---

## 🔵 Слабые Места (технический долг)

### DEBT-01 — `firebase-config.js` дублирует функциональность `leaderboard.js`
Функции `getLeaderboard()`, `saveHighScoreToFirestore()` в `firebase-config.js` дублируют логику из `leaderboard.js`. Код не используется основным модулем `main.v3.js`.

### DEBT-02 — `telegram.js` содержит устаревший код аутентификации
Функции `authenticateUser()`, `validateToken()`, `secureEncode()`, `secureDecode()` основаны на `btoa/atob` и **не обеспечивают реальной безопасности**. Они не используются в основном потоке — замените на Firebase Auth.

### DEBT-03 — `sendGameEvent` в `telegram.js` пишет аналитику без throttle
Нет ограничения частоты записей. В тяжёлых сессиях (много событий) это создаёт O(n) операций записи.

### DEBT-04 — `daily-challenge.js` не подключён к игровому циклу
`DailyChallenge` инициализируется в `window.dailyChallenge`, но `checkProgress()` вызывается только при game over. Нет проверки в реальном времени по ходу игры (например, combo).

---

## 📋 Приоритетный план исправлений

| Приоритет | ID | Что делать | Файлы |
|-----------|-----|-----------|-------|
| 🔴 Срочно | BUG-01 | Исправить `cloud-sync.js` — использовать Firebase UID; ужесточить `firestore.rules` для `players` | `cloud-sync.js`, `firestore.rules` |
| 🔴 Срочно | BUG-02 | Добавить `.catch()` к `submitToLeaderboard()` в `handleGameOver` | `main.v3.js` |
| 🔴 Срочно | BUG-03 | Добавить в SW кэш: `ghost.js`, `tutorial.js`, `device-utils.js`, `i18n.js`, `cloud-sync.js`, `firebase-config.js`, `manifest.json` | `sw.js` |
| 🟡 Важно | BUG-04 | Добавить правило в `firestore.rules` для коллекции `analytics` | `firestore.rules` |
| 🟡 Важно | BUG-07 | Перенести check daily challenge ПЕРЕД блоком duel return | `main.v3.js` |
| 🟡 Важно | BUG-08 | Заменить `alert()` в `window.onerror` на логирование или показ `error-screen` | `main.v3.js` |
| 🔵 Долг | BUG-06 | Кэшировать `tg` в `telegram.js` | `telegram.js` |
| 🔵 Долг | DEBT-02 | Удалить мёртвый код аутентификации из `telegram.js` | `telegram.js` |

---

## ✅ Итог

> Самые срочные задачи: **BUG-01** (безопасность прогресса), **BUG-03** (PWA оффлайн), **BUG-02** (потеря очков).

Хотите, чтобы я исправил эти баги прямо сейчас?
