/**
 * Telegram Web Apps integration for UPLOOP game
 */
import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Module-level cache — prevents re-running side effects (expand, setHeaderColor, etc.) on every call
let _cachedTg = null;

// Initialize Telegram Web App
export function initTelegram() {
  // Return cached instance if already initialized
  if (_cachedTg) return _cachedTg;

  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    // One-time setup — only runs on first call
    tg.expand();
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#1a1a1a');
    tg.enableClosingConfirmation();

    _cachedTg = tg;
    return _cachedTg;
  } else {
    console.warn('Telegram WebApp not available, using mock');
    _cachedTg = createMockTelegramWebApp();
    return _cachedTg;
  }
}



// Mock Telegram Web App for offline functionality
function createMockTelegramWebApp() {
  return {
    expand: () => { },
    setHeaderColor: () => { },
    setBackgroundColor: () => { },
    enableClosingConfirmation: () => { },
    CloudStorage: {
      getItem: (key, callback) => {
        try {
          const value = localStorage.getItem(key);
          if (typeof callback === 'function') {
            callback(null, value);
          }
          return Promise.resolve(value);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          if (typeof callback === 'function') {
            callback(error, null);
          }
          return Promise.resolve(null);
        }
      },
      setItem: (key, value, callback) => {
        try {
          localStorage.setItem(key, value);
          if (typeof callback === 'function') {
            callback(null, true);
          }
          return Promise.resolve(true);
        } catch (error) {
          console.error('Error storing to localStorage:', error);
          if (typeof callback === 'function') {
            callback(error, false);
          }
          return Promise.resolve(false);
        }
      }
    },
    sendData: (data) => {
      // In offline mode, just log the data
      console.log('Sending data (offline mode):', data);
    },
    showAlert: (message) => {
      alert(message);
    },
    shareToStory: () => {
      console.log('Sharing to story (offline mode)');
    },
    HapticFeedback: {
      impactOccurred: (style) => {
        // Provide basic vibration feedback if available
        if (navigator.vibrate) {
          const vibrationPattern = {
            light: [10],
            medium: [20],
            heavy: [30],
            rigid: [25],
            soft: [15]
          };
          navigator.vibrate(vibrationPattern[style] || [10]);
        }
      },
      notificationOccurred: (type) => {
        // Provide basic vibration feedback if available
        if (navigator.vibrate) {
          const vibrationPattern = {
            success: [10, 50, 10],
            warning: [100],
            error: [100, 50, 100]
          };
          navigator.vibrate(vibrationPattern[type] || [100]);
        }
      },
      selectionChanged: () => {
        // Provide basic vibration feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([5]);
        }
      }
    },
    MainButton: {
      setText: (text) => { },
      onClick: (callback) => { },
      offClick: () => { },
      setParams: (params) => { },
      show: () => { },
      hide: () => { },
      enable: () => { },
      disable: () => { }
    },
    viewportStableHeight: window.innerHeight,
    viewportHeight: window.innerHeight,
    themeParams: {
      bg_color: '#1a1a1a',
      header_bg_color: '#000000',
      text_color: '#ffffff',
      hint_color: '#888888',
      link_color: '#2688ce',
      button_color: '#2688ce',
      button_text_color: '#ffffff'
    }
  };
}

// Function to save high score to Telegram cloud storage
export async function saveHighScore(score) {
  const tg = initTelegram();

  try {
    // Get current high score
    const currentHighScore = await getHighScore();

    // Only save if new score is higher
    if (score > currentHighScore) {
      // Always save to localStorage first (most reliable)
      try {
        localStorage.setItem('uploop_high_score', score.toString());
        console.log('High score saved to localStorage:', score);
      } catch (localStorageError) {
        console.error('Error saving to localStorage:', localStorageError);
      }

      // Try to also save to Telegram CloudStorage if available
      try {
        if (tg && tg.CloudStorage && typeof tg.CloudStorage.setItem === 'function') {
          await new Promise((resolve) => {
            tg.CloudStorage.setItem('uploop_high_score', score.toString(), (err, success) => {
              if (err) console.error('CloudStorage save error:', err);
              else console.log('✅ High score saved to CloudStorage');
              resolve(success);
            });
          });
        }
      } catch (cloudError) {
        // CloudStorage might not be supported, that's okay
        console.log('Telegram CloudStorage not available, localStorage used');
      }

      // Also send to bot API if authenticated
      if (isAuthenticated()) {
        try {
          await sendScoreToBot(score);
        } catch (botError) {
          console.log('Could not send score to bot:', botError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error in saveHighScore:', error);

    // Final fallback - just try localStorage
    try {
      localStorage.setItem('uploop_high_score', score.toString());
    } catch (e) {
      console.error('All save methods failed:', e);
    }
  }
}

// Function to retrieve high score from Telegram cloud storage
export async function getHighScore() {
  const tg = initTelegram();

  // Try localStorage first as it's more reliable
  try {
    const result = localStorage.getItem('uploop_high_score');
    if (result) {
      console.log('High score loaded from localStorage:', result);
      return parseInt(result);
    }
  } catch (localStorageError) {
    console.error('Error accessing localStorage:', localStorageError);
  }

  // Try Telegram CloudStorage as secondary option
  try {
    if (tg && tg.CloudStorage && typeof tg.CloudStorage.getItem === 'function') {
      const result = await new Promise((resolve) => {
        tg.CloudStorage.getItem('uploop_high_score', (err, value) => {
          if (err) {
            console.error('CloudStorage load error:', err);
            resolve(null);
          } else {
            resolve(value);
          }
        });
      });

      if (result) {
        console.log('High score loaded from Telegram CloudStorage:', result);
        // Also save to localStorage for faster access next time
        try {
          localStorage.setItem('uploop_high_score', result);
        } catch (e) { }
        return parseInt(result);
      }
    }
  } catch (error) {
    // CloudStorage might not be supported, that's okay
    console.log('Telegram CloudStorage not available, using localStorage only');
  }

  return 0;
}

// Function to save user progress (inventory) to Telegram CloudStorage
export async function saveProgressToCloud(progressData) {
  const tg = initTelegram();
  try {
    // Also save to localStorage as a fallback
    if (progressData.selectedCharacter) {
      localStorage.setItem('selectedCharacter', progressData.selectedCharacter);
    }
    if (progressData.unlockedCharacters) {
      localStorage.setItem('unlockedCharacters', JSON.stringify(progressData.unlockedCharacters));
    }

    if (tg && tg.CloudStorage && typeof tg.CloudStorage.setItem === 'function') {
      const payload = JSON.stringify(progressData);
      await new Promise((resolve) => {
        tg.CloudStorage.setItem('pixeljump_progress', payload, (err, success) => {
          if (err) console.error('CloudStorage save error:', err);
          else console.log('✅ Progress saved to CloudStorage');
          resolve(success);
        });
      });
      return true;
    }
  } catch (error) {
    console.error('Error in saveProgressToCloud:', error);
  }
  return false;
}

// Function to load user progress (inventory) from Telegram CloudStorage
export async function loadProgressFromCloud() {
  const tg = initTelegram();
  let progress = null;

  try {
    if (tg && tg.CloudStorage && typeof tg.CloudStorage.getItem === 'function') {
      const result = await new Promise((resolve) => {
        tg.CloudStorage.getItem('pixeljump_progress', (err, value) => {
          if (err) {
            console.error('CloudStorage load error:', err);
            resolve(null);
          } else {
            resolve(value);
          }
        });
      });
      
      if (result) {
        progress = JSON.parse(result);
        console.log('✅ Progress loaded from CloudStorage:', progress);
        
        // Sync to localStorage
        if (progress.selectedCharacter) localStorage.setItem('selectedCharacter', progress.selectedCharacter);
        if (progress.unlockedCharacters) localStorage.setItem('unlockedCharacters', JSON.stringify(progress.unlockedCharacters));
      }
    }
  } catch (error) {
    console.error('Error in loadProgressFromCloud:', error);
  }

  // Fallback to localStorage if cloud fails or is empty
  if (!progress) {
    progress = {};
    const savedChar = localStorage.getItem('selectedCharacter');
    if (savedChar) progress.selectedCharacter = savedChar;
    
    const savedUnlocks = localStorage.getItem('unlockedCharacters');
    if (savedUnlocks) {
      try {
        progress.unlockedCharacters = JSON.parse(savedUnlocks);
      } catch(e) {}
    }
    console.log('🔄 Progress loaded from localStorage fallback:', progress);
  }

  return progress;
}

// Telemetry functions for analytics
let telemetryEvents = [];

// Function to send game event to Firebase analytics (queues locally)
export function sendGameEvent(eventName, eventData = {}) {
  const firebaseUid = auth?.currentUser?.uid || 'anonymous';
  
  // Create analytics event document
  const event = {
    event: eventName,
    data: eventData,
    userId: firebaseUid,
    source: 'telegram_webapp',
    timestamp: Date.now(),
    clientTime: new Date().toISOString()
  };
  
  telemetryEvents.push(event);
  console.log('📊 Analytics event queued locally:', eventName, event);
}

// Offline queue functionality is removed. 
// Firebase Firestore automatically handles buffering offline writes.
export function sendQueuedOfflineEvents() {
  // Maintained for backward compatibility. Does nothing.
}

// Function to share game result
export function shareResult(score) {
  const tg = initTelegram();
  if (tg) {
    try {
      // Prepare share message
      const message = `I scored ${score} points in UPLOOP! Can you beat my score?`;

      // Attempt to share via Telegram
      if (tg.shareToStory) {
        // Share to story if available
        tg.shareToStory(message);
      } else {
        // Fallback to clipboard API for mobile browsers
        if (navigator.clipboard) {
          navigator.clipboard.writeText(message);
          tg.showAlert('Score copied to clipboard!');
        } else {
          tg.showAlert(message);
        }
      }
    } catch (error) {
      console.error('Error sharing result:', error);
    }
  }
}

// Log an event to telemetry
export function logTelemetryEvent(eventType, data = {}) {
  sendGameEvent(eventType, {
    ...data,
    score: globalThis.currentScore || 0,
    level: globalThis.currentLevel || 1
  });
}

// Get all collected telemetry events
export function getTelemetryEvents() {
  return telemetryEvents;
}

// Send telemetry queue to Firestore as a single batch document
export async function sendTelemetry() {
  if (telemetryEvents.length === 0 || !db) return;

  const eventsToSend = [...telemetryEvents];
  telemetryEvents = []; // Clear immediately to prevent race conditions

  try {
    const firebaseUid = auth?.currentUser?.uid || 'anonymous';
    const batchDoc = {
      userId: firebaseUid,
      source: 'telegram_webapp',
      events: eventsToSend,
      timestamp: serverTimestamp(),
      clientTime: new Date().toISOString()
    };

    await addDoc(collection(db, 'analytics'), batchDoc);
    console.log(`📊 Sent ${eventsToSend.length} analytics events to Firebase in a single batch`);
  } catch (error) {
    console.error('Error sending telemetry batch to Firebase:', error);
    // Put events back in queue if failed to avoid data loss
    telemetryEvents = [...eventsToSend, ...telemetryEvents];
  }
}

// Initialize telemetry collection
export function initTelemetry() {
  logTelemetryEvent('game_init');

  // Track session start
  window.gameStartTime = Date.now();

  // Track online/offline status changes
  let telemetryIntervalId = null;

  function startTelemetryInterval() {
    // Clear previous interval if exists to prevent stacking
    if (telemetryIntervalId) clearInterval(telemetryIntervalId);
    telemetryIntervalId = setInterval(sendTelemetry, 30000);
  }

  // Set up periodic telemetry sending if online
  if (navigator.onLine) {
    startTelemetryInterval();
  }

  // Log important game events
  window.addEventListener('beforeunload', () => {
    logTelemetryEvent('session_end', {
      duration: Date.now() - (window.gameStartTime || Date.now())
    });
    sendTelemetry(); // Send any remaining events
  });

  window.addEventListener('online', () => {
    console.log('Connection restored, sending queued telemetry');
    sendTelemetry(); // Send any remaining events
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, queuing telemetry locally');
    if (telemetryIntervalId) {
      clearInterval(telemetryIntervalId);
      telemetryIntervalId = null;
    }
  });
}

// Haptic feedback — uses cached tg directly for zero overhead
export function triggerHapticFeedback(type = 'light') {
  try {
    const tg = _cachedTg || initTelegram();
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    // ignore — haptic is non-critical
  }
}

// Main Button functions
let mainButton;

export function initMainButton() {
  const tg = initTelegram();
  if (tg) {
    try {
      mainButton = tg.MainButton;
      // Reset defaults
      mainButton.setParams({
        color: tg.themeParams.button_color || '#2688ce',
        text_color: tg.themeParams.button_text_color || '#ffffff'
      });
    } catch (error) {
      console.error('Error initializing main button:', error);
    }
  }
  return mainButton;
}

export function updateMainButton(text, callback, isVisible = true) {
  if (!mainButton) initMainButton();

  if (mainButton) {
    if (isVisible) {
      mainButton.setText(text.toUpperCase());
      mainButton.show();
      mainButton.enable();
      mainButton.offClick(mainButton.callback); // Remove old callback if any
      mainButton.callback = callback; // Store for removal
      mainButton.onClick(callback);
    } else {
      mainButton.hide();
    }
  }
}

export function hideMainButton() {
  if (mainButton) mainButton.hide();
}

// applyTheme, getThemeColors, applyThemeToGame are removed to enforce Neon style

// Safe Area Insets functions
export function getSafeAreaInsets() {
  const tg = initTelegram();
  if (tg) {
    // Use viewport stable height to calculate safe area
    const viewportStableHeight = tg.viewportStableHeight;
    const viewportHeight = tg.viewportHeight;

    // Calculate safe area insets based on the difference
    const bottomInset = viewportHeight - viewportStableHeight;

    return {
      top: tg.headerColor ? 0 : 20, // Usually safe area at the top
      bottom: Math.max(bottomInset, 20), // Minimum 20px for safe area at bottom
      left: 0,
      right: 0
    };
  }

  // Default safe area insets
  return {
    top: 20,
    bottom: 20,
    left: 0,
    right: 0
  };
}

// Function to adjust game layout based on safe area
export function adjustLayoutForSafeArea(canvas) {
  const safeArea = getSafeAreaInsets();

  if (canvas) {
    // Adjust canvas position based on safe area
    canvas.style.paddingTop = `${safeArea.top}px`;
    canvas.style.paddingBottom = `${safeArea.bottom}px`;
    canvas.style.paddingLeft = `${safeArea.left}px`;
    canvas.style.paddingRight = `${safeArea.right}px`;

    // Also update the canvas dimensions if needed
    canvas.width = window.innerWidth - safeArea.left - safeArea.right;
    canvas.height = window.innerHeight - safeArea.top - safeArea.bottom;
  }

  return safeArea;
}


