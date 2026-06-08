/* 
 *  Copyright 2026 Charles DeLuca
 *  
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  
 *      http://www.apache.org/licenses/LICENSE-2.0
 *  
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * PIXEL JUMP — Internationalization (i18n)
 * Supports: EN, RU
 */

const TRANSLATIONS = {
  en: {
    // Menu
    start_game: '▶ START GAME',
    replay_tutorial: '🎓 REPLAY TUTORIAL',
    skins: '🎨 SKINS',
    duel: '⚔️ DUEL',
    characters: '👤 CHARACTERS',
    leaderboard: '🏆 LEADERBOARD',
    settings: '⚙ SETTINGS',
    hi_player: 'Hi, Player',

    // Daily
    daily_challenge: 'DAILY CHALLENGE',
    daily_loading: 'Loading...',
    daily_none: 'No challenge today.',
    daily_completed: '✅ COMPLETED',
    daily_in_progress: '🎯 IN PROGRESS',

    // HUD
    score: 'SCORE',
    best: 'BEST',

    // Pause
    paused: '⏸ PAUSED',
    resume: '▶ RESUME',
    restart: '↻ RESTART',
    main_menu: '⬅ MAIN MENU',

    // Game Over
    game_over: 'GAME OVER',
    new_record: '🏆 NEW RECORD!',
    play_again: '▶ PLAY AGAIN',
    share_score: '📤 SHARE SCORE',
    menu: '🏠 MENU',

    // Characters
    select_character: 'SELECT CHARACTER',
    select_play: 'SELECT & PLAY ▶',
    back: '⬅ BACK',
    unlocked: '✅ UNLOCKED',
    locked: '🔒 LOCKED',

    // Perks
    choose_perk: 'CHOOSE YOUR PERK',
    perk_subtitle: 'Select one modifier for this run',
    start_with_perk: 'START GAME ▶',
    skip_perk: 'SKIP (No Perk)',
    feather_name: 'FEATHER',
    feather_desc: 'Slower fall\n-10% gravity',
    turbo_name: 'TURBO',
    turbo_desc: 'Higher jumps\n+20% force',
    shield_name: 'SHIELD',
    shield_desc: 'One extra life\nper game',

    // Leaderboard
    top_100: '🏆 TOP 100',
    no_scores: 'No scores yet. Be the first!',
    loading: 'Loading...',
    load_error: 'Failed to load. Check connection.',

    // Settings
    settings_title: '⚙ SETTINGS',
    sound: '🔊 SOUND',
    vibration: '📳 VIBRATION',
    controls: '🕹️ CONTROLS',
    sensitivity: '🎚️ SENSITIVITY',
    quality: '⚡ QUALITY',
    language: '🌐 LANGUAGE',
    on: 'ON',
    off: 'OFF',
    high: 'HIGH',
    low: 'LOW',

    // Skins
    skins_title: '🎨 SKINS',
    unlock: 'UNLOCK:',
    select_skin: 'Select a skin',
    equipped: '✅ EQUIPPED',

    // Challenge / Duel
    duel_request: '⚔️ DUEL REQUEST',
    target_score: 'TARGET SCORE',
    accept_duel: '⚔️ ACCEPT DUEL',
    decline: '❌ DECLINE',
    duel_result: 'RESULT',
    you_won: '🎉 YOU WON!',
    almost: '😬 ALMOST!',
    you: 'YOU',
    rival: 'RIVAL',
    share_revenge: '📤 SHARE REVENGE',
    duel_info: 'Play a game then share your score to challenge friends!',
    start_duel: '⚔️ START DUEL',
    your_best: 'YOUR BEST',

    // Error
    error_title: '⚠️ ERROR',
    error_default: 'Something went wrong',
    retry: '🔄 RETRY',
    copy_error: '📋 COPY ERROR',

    // Tutorial
    tutorial_reset: 'Tutorial will show on your next game!',

    // Accelerometer
    accel_permission: 'Allow motion sensors for tilt controls?',
    accel_denied: 'Motion permission denied. Using tap controls.',
  },

  ru: {
    // Меню
    start_game: '▶ НАЧАТЬ ИГРУ',
    replay_tutorial: '🎓 ОБУЧЕНИЕ',
    skins: '🎨 СКИНЫ',
    duel: '⚔️ ДУЭЛЬ',
    characters: '👤 ПЕРСОНАЖИ',
    leaderboard: '🏆 РЕЙТИНГ',
    settings: '⚙ НАСТРОЙКИ',
    hi_player: 'Привет, Игрок',

    // Ежедневное
    daily_challenge: 'ЕЖЕДНЕВНЫЙ ВЫЗОВ',
    daily_loading: 'Загрузка...',
    daily_none: 'Сегодня нет вызова.',
    daily_completed: '✅ ВЫПОЛНЕНО',
    daily_in_progress: '🎯 В ПРОЦЕССЕ',

    // HUD
    score: 'СЧЁТ',
    best: 'ЛУЧШИЙ',

    // Пауза
    paused: '⏸ ПАУЗА',
    resume: '▶ ПРОДОЛЖИТЬ',
    restart: '↻ ЗАНОВО',
    main_menu: '⬅ ГЛАВНОЕ МЕНЮ',

    // Конец игры
    game_over: 'КОНЕЦ ИГРЫ',
    new_record: '🏆 НОВЫЙ РЕКОРД!',
    play_again: '▶ ЗАНОВО',
    share_score: '📤 ПОДЕЛИТЬСЯ',
    menu: '🏠 МЕНЮ',

    // Персонажи
    select_character: 'ВЫБЕРИТЕ ПЕРСОНАЖА',
    select_play: 'ВЫБРАТЬ И ИГРАТЬ ▶',
    back: '⬅ НАЗАД',
    unlocked: '✅ РАЗБЛОКИРОВАН',
    locked: '🔒 ЗАБЛОКИРОВАН',

    // Перки
    choose_perk: 'ВЫБЕРИТЕ ПЕРК',
    perk_subtitle: 'Выберите бонус для этого забега',
    start_with_perk: 'НАЧАТЬ ИГРУ ▶',
    skip_perk: 'ПРОПУСТИТЬ',
    feather_name: 'ПЕРО',
    feather_desc: 'Медленное падение\n-10% гравитации',
    turbo_name: 'ТУРБО',
    turbo_desc: 'Высокий прыжок\n+20% силы',
    shield_name: 'ЩИТ',
    shield_desc: 'Доп. жизнь\nна игру',

    // Рейтинг
    top_100: '🏆 ТОП 100',
    no_scores: 'Пока нет результатов. Будьте первым!',
    loading: 'Загрузка...',
    load_error: 'Не удалось загрузить. Проверьте соединение.',

    // Настройки
    settings_title: '⚙ НАСТРОЙКИ',
    sound: '🔊 ЗВУК',
    vibration: '📳 ВИБРАЦИЯ',
    controls: '🕹️ УПРАВЛЕНИЕ',
    sensitivity: '🎚️ ЧУВСТВИТ.',
    quality: '⚡ КАЧЕСТВО',
    language: '🌐 ЯЗЫК',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    high: 'ВЫСОК.',
    low: 'НИЗК.',

    // Скины
    skins_title: '🎨 СКИНЫ',
    unlock: 'РАЗБЛОК.:',
    select_skin: 'Выберите скин',
    equipped: '✅ УСТАНОВЛЕН',

    // Дуэль
    duel_request: '⚔️ ВЫЗОВ НА ДУЭЛЬ',
    target_score: 'ЦЕЛЬ',
    accept_duel: '⚔️ ПРИНЯТЬ',
    decline: '❌ ОТКЛОНИТЬ',
    duel_result: 'РЕЗУЛЬТАТ',
    you_won: '🎉 ПОБЕДА!',
    almost: '😬 ПОЧТИ!',
    you: 'ВЫ',
    rival: 'СОПЕРНИК',
    share_revenge: '📤 РЕВАНШ',
    duel_info: 'Сыграйте и поделитесь счётом, чтобы вызвать друзей!',
    start_duel: '⚔️ НАЧАТЬ ДУЭЛЬ',
    your_best: 'ВАШ ЛУЧШИЙ',

    // Ошибка
    error_title: '⚠️ ОШИБКА',
    error_default: 'Что-то пошло не так',
    retry: '🔄 ПОВТОРИТЬ',
    copy_error: '📋 СКОПИРОВАТЬ',

    // Обучение
    tutorial_reset: 'Обучение начнётся в следующей игре!',

    // Акселерометр
    accel_permission: 'Разрешить датчики движения для управления наклоном?',
    accel_denied: 'Доступ к датчикам запрещён. Используется тап-управление.',
  }
};

let currentLang = 'en';

/**
 * Initialize language from user profile or localStorage
 */
export function initI18n() {
  const saved = localStorage.getItem('pixelJump_lang');
  if (saved && TRANSLATIONS[saved]) {
    currentLang = saved;
  } else {
    // Auto-detect from Telegram or browser
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    const browserLang = navigator.language?.slice(0, 2);
    const detected = tgLang || browserLang || 'en';
    currentLang = detected === 'ru' ? 'ru' : 'en';
  }
  window.currentLang = currentLang;
  return currentLang;
}

/**
 * Get translation by key
 */
export function t(key) {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Set language and apply to all UI elements
 */
export function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  window.currentLang = lang;
  localStorage.setItem('pixelJump_lang', lang);
  applyTranslations();
}

/**
 * Get current language
 */
export function getLang() {
  return currentLang;
}

/**
 * Toggle between EN and RU
 */
export function toggleLanguage() {
  const next = currentLang === 'en' ? 'ru' : 'en';
  setLanguage(next);
  return next;
}

/**
 * Apply translations to all DOM elements with data-i18n attribute
 */
export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) el.textContent = text;
  });

  // Also update elements by specific IDs
  const map = {
    'btn-start': 'start_game',
    'btn-tutorial': 'replay_tutorial',
    'btn-skins': 'skins',
    'btn-challenges': 'duel',
    'btn-characters': 'characters',
    'btn-leaderboard': 'leaderboard',
    'btn-settings': 'settings',
    'btn-resume': 'resume',
    'btn-restart': 'restart',
    'btn-menu': 'main_menu',
    'btn-play-again': 'play_again',
    'btn-share': 'share_score',
    'btn-menu-go': 'menu',
    'btn-back-from-chars': 'back',
    'btn-back-settings': 'back',
    'btn-back-skins': 'back',
    'btn-back-leaderboard': 'back',
    'btn-select-character': 'select_play',
    'btn-start-with-perk': 'start_with_perk',
    'btn-skip-perk': 'skip_perk',
    'btn-accept-challenge': 'accept_duel',
    'btn-decline-challenge': 'decline',
    'btn-retry-game': 'retry',
    'btn-error-menu': 'main_menu',
    'btn-copy-error': 'copy_error',
    'btn-challenge-share': 'share_revenge',
    'btn-challenge-menu': 'menu',
  };

  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
}
