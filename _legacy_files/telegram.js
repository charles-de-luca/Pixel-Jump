/**
 * Telegram Web Apps integration for UPLOOP game
 */

// Initialize Telegram Web App
export function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    // Expand the web app to full screen
    tg.expand();

    // Set header color
    tg.setHeaderColor('#000000');

    // Set background color
    tg.setBackgroundColor('#1a1a1a');

    // Enable closing confirmation
    tg.enableClosingConfirmation();

    // Return the Telegram WebApp object for further use
    return tg;
  } else {
    console.warn('Telegram WebApp not available');
    // Return a mock object with fallback implementations
    return createMockTelegramWebApp();
  }
}

// Function to authenticate user via Telegram WebApp
export function authenticateUser() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    // Get user data from Telegram
    const user = tg.initDataUnsafe?.user;
    if (user) {
      // Create a secure token based on user data
      const userData = {
        id: user.id,
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        authDate: Date.now()
      };

      // Store user data locally
      localStorage.setItem('telegram_user_data', JSON.stringify(userData));

      // Create a simple authentication token (in a real app, this would involve server-side verification)
      const token = btoa(JSON.stringify(userData));
      localStorage.setItem('auth_token', token);

      console.log('User authenticated via Telegram:', userData);
      return userData;
    } else {
      console.warn('No user data found in Telegram WebApp');
      return null;
    }
  } else {
    console.warn('Telegram WebApp not available for authentication');
    return null;
  }
}


// Function to check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return false;
  }

  try {
    // Verify the token (basic check - in a real app, this would involve server-side verification)
    const userData = JSON.parse(atob(token));
    // Check if user data is still valid (not too old)
    const timeDiff = Date.now() - userData.authDate;
    // Token is valid for 24 hours
    return timeDiff < 24 * 60 * 1000;
  } catch (e) {
    console.error('Error verifying auth token:', e);
    return false;
  }
}

// Function to get authenticated user data
export function getAuthenticatedUser() {
  if (!isAuthenticated()) {
    return null;
  }

  const token = localStorage.getItem('auth_token');
  try {
    return JSON.parse(atob(token));
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
}

// Enhanced security function for token validation
export function validateToken(token) {
  try {
    // Decode the token to check its contents
    const decoded = JSON.parse(atob(token));

    // Check if the token has required fields
    if (!decoded.id || !decoded.authDate) {
      return false;
    }

    // Check if the token is not expired (valid for 24 hours)
    const timeDiff = Date.now() - decoded.authDate;
    if (timeDiff > 24 * 60 * 60 * 1000) {
      return false;
    }

    // In a real application, you would also verify the token signature here
    // This is a simplified version for demonstration purposes

    return true;
  } catch (e) {
    console.error('Error validating token:', e);
    return false;
  }
}

// Securely encode data for transmission
export function secureEncode(data) {
  // In a real application, you would use proper encryption here
  // For now, we'll just use a simple encoding approach

  // Add a timestamp to the data to prevent replay attacks
  const dataWithTimestamp = {
    ...data,
    timestamp: Date.now()
  };

  // Convert to JSON string and encode
  const jsonString = JSON.stringify(dataWithTimestamp);
  return btoa(jsonString);
}

// Securely decode received data
export function secureDecode(encodedData) {
  try {
    // Decode the base64 string
    const jsonString = atob(encodedData);

    // Parse the JSON
    const data = JSON.parse(jsonString);

    // Check if the data has a timestamp
    if (!data.timestamp) {
      throw new Error('Missing timestamp in received data');
    }

    // Check if the data is not too old (prevent replay attacks)
    const timeDiff = Date.now() - data.timestamp;
    if (timeDiff > 5 * 60 * 1000) { // 5 minutes
      throw new Error('Received data is too old');
    }

    // Remove the timestamp before returning
    delete data.timestamp;

    return data;
  } catch (e) {
    console.error('Error decoding data:', e);
    return null;
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
      getItem: async (key) => {
        try {
          // Fallback to localStorage if CloudStorage is not available
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          // Fallback to localStorage if CloudStorage is not available
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error storing to localStorage:', error);
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
          await tg.CloudStorage.setItem('uploop_high_score', score.toString());
          console.log('High score also saved to Telegram CloudStorage');
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
      const result = await tg.CloudStorage.getItem('uploop_high_score');
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

// Function to send game event to Telegram analytics
export function sendGameEvent(eventName, eventData = {}) {
  const tg = initTelegram();
  try {
    if (tg && navigator.onLine) {
      // Send event to Telegram analytics only if online
      tg.sendData(JSON.stringify({ event: eventName, data: eventData }));
    } else if (!navigator.onLine) {
      // Queue the event for later sending when online
      queueOfflineEvent({ event: eventName, data: eventData });
    }
    console.log('Game event sent:', eventName, eventData);
  } catch (error) {
    console.error('Error sending game event:', error);
    // Queue the event for later sending when online
    queueOfflineEvent({ event: eventName, data: eventData });
  }
}

// Queue for storing events when offline
let offlineEventQueue = [];

// Function to queue events for offline sending
function queueOfflineEvent(event) {
  offlineEventQueue.push({
    ...event,
    timestamp: Date.now()
  });

  // Limit queue size to prevent excessive memory usage
  if (offlineEventQueue.length > 100) {
    offlineEventQueue.shift(); // Remove oldest event
  }

  // Store in localStorage for persistence
  try {
    localStorage.setItem('uploop_offline_events', JSON.stringify(offlineEventQueue));
  } catch (storageError) {
    console.error('Error storing offline events:', storageError);
  }
}

// Function to send queued events when back online
export function sendQueuedOfflineEvents() {
  if (!navigator.onLine) return; // Only send when online

  try {
    // Load any previously stored events
    const storedEvents = localStorage.getItem('uploop_offline_events');
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents);
      offlineEventQueue = [...parsedEvents, ...offlineEventQueue];
      localStorage.removeItem('uploop_offline_events'); // Clear stored events
    }
  } catch (parseError) {
    console.error('Error loading stored offline events:', parseError);
  }

  // Process all queued events
  const tg = initTelegram();
  offlineEventQueue.forEach(event => {
    try {
      if (tg) {
        tg.sendData(JSON.stringify(event));
      }
      console.log('Sent queued offline event:', event);
    } catch (sendError) {
      console.error('Error sending queued event:', sendError);
      // If we still can't send, put it back in the queue
      return; // Stop processing further events to avoid blocking
    }
  });

  // Clear the queue after sending (or keep unsent events)
  offlineEventQueue = [];
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

// Telemetry functions for analytics
let telemetryEvents = [];

// Log an event to telemetry
export function logTelemetryEvent(eventType, data = {}) {
  const timestamp = Date.now();
  const event = {
    type: eventType,
    data: data,
    timestamp: timestamp,
    score: globalThis.currentScore || 0,
    level: globalThis.currentLevel || 1
  };

  telemetryEvents.push(event);
  console.log('Telemetry event logged:', event);

  // Send to Telegram analytics
  sendGameEvent(eventType, data);
}

// Get all collected telemetry events
export function getTelemetryEvents() {
  return telemetryEvents;
}

// Send telemetry to backend (placeholder for future implementation)
export function sendTelemetry() {
  if (telemetryEvents.length > 0) {
    console.log('Sending telemetry data:', telemetryEvents);

    // In a real implementation, this would send data to a backend server
    // For now, we'll just clear the events array
    telemetryEvents = [];
  }
}

// Initialize telemetry collection
export function initTelemetry() {
  logTelemetryEvent('game_init');

  // Set up periodic telemetry sending
  // Only send periodically if online, otherwise just collect locally
  if (navigator.onLine) {
    setInterval(sendTelemetry, 30000); // Send every 30 seconds
  }

  // Log important game events
  window.addEventListener('beforeunload', () => {
    logTelemetryEvent('session_end', {
      duration: Date.now() - window.gameStartTime
    });
    sendTelemetry(); // Send any remaining events
  });

  // Track online/offline status changes
  window.addEventListener('online', () => {
    console.log('Connection restored, sending queued telemetry');
    // Send telemetry when connection is restored
    sendTelemetry();
    sendQueuedOfflineEvents(); // Send any queued offline events
    // Restart periodic sending
    setInterval(sendTelemetry, 30000); // Send every 30 seconds
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, queuing telemetry locally');
  });

  // Track session start
  window.gameStartTime = Date.now();
}

// Haptic feedback functions
export function triggerHapticFeedback(type = 'light') {
  const tg = initTelegram();
  try {
    if (tg && tg.HapticFeedback) {
      switch (type) {
        case 'light':
          tg.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          tg.HapticFeedback.impactOccurred('medium');
          break;
        case 'heavy':
          tg.HapticFeedback.impactOccurred('heavy');
          break;
        case 'rigid':
          tg.HapticFeedback.impactOccurred('rigid');
          break;
        case 'soft':
          tg.HapticFeedback.impactOccurred('soft');
          break;
        case 'notification_success':
          tg.HapticFeedback.notificationOccurred('success');
          break;
        case 'notification_warning':
          tg.HapticFeedback.notificationOccurred('warning');
          break;
        case 'notification_error':
          tg.HapticFeedback.notificationOccurred('error');
          break;
        case 'selection_change':
          tg.HapticFeedback.selectionChanged();
          break;
        default:
          tg.HapticFeedback.impactOccurred('light');
      }
    } else {
      // Fallback to native vibration API if Telegram HapticFeedback is not available
      if (navigator.vibrate) {
        const vibrationPattern = {
          light: [10],
          medium: [20],
          heavy: [30],
          rigid: [25],
          soft: [15],
          notification_success: [10, 50, 10],
          notification_warning: [100],
          notification_error: [100, 50, 100],
          selection_change: [5]
        };
        navigator.vibrate(vibrationPattern[type] || [10]);
      }
    }
    console.log('Haptic feedback triggered:', type);
  } catch (error) {
    console.error('Error triggering haptic feedback:', error);

    // Fallback to native vibration API if there's an error
    try {
      if (navigator.vibrate) {
        const vibrationPattern = {
          light: [10],
          medium: [20],
          heavy: [30],
          rigid: [25],
          soft: [15],
          notification_success: [10, 50, 10],
          notification_warning: [100],
          notification_error: [100, 50, 100],
          selection_change: [5]
        };
        navigator.vibrate(vibrationPattern[type] || [10]);
      }
    } catch (vibrationError) {
      console.error('Error with vibration fallback:', vibrationError);
    }
  }
}

// Main Button functions
let mainButton;

export function initMainButton() {
  const tg = initTelegram();
  if (tg) {
    try {
      mainButton = tg.MainButton;
      console.log('Main button initialized');
    } catch (error) {
      console.error('Error initializing main button:', error);
    }
  }
  return mainButton;
}
export function updateMainButton(text, callback, isVisible = true, isActive = true, color = null, textColor = null) {
  if (mainButton) {
    try {
      if (isVisible) {
        mainButton.setText(text);
        mainButton.offClick(); // Remove previous click handlers
        if (callback) {
          mainButton.onClick(callback);
        }
        if (color || textColor) {
          const params = {};
          if (color) params.color = color;
          if (textColor) params.text_color = textColor;
          mainButton.setParams(params);
        }
        if (isActive) {
          mainButton.show();
          mainButton.enable();
        } else {
          mainButton.show();
          mainButton.disable();
        }
      } else {
        mainButton.hide();
      }
      console.log('Main button updated:', { text, isVisible, isActive, color, textColor });
    } catch (error) {
      console.error('Error updating main button:', error);
    }
  }
}

// Function to hide the main button
export function hideMainButton() {
  if (mainButton) {
    try {
      mainButton.hide();
      console.log('Main button hidden');
    } catch (error) {
      console.error('Error hiding main button:', error);
    }
  }
}


// Function to get theme colors from Telegram
export function getThemeColors() {
  const tg = initTelegram();
  if (tg && tg.themeParams) {
    return {
      backgroundColor: tg.themeParams.bg_color || '#ffffff',
      headerBackgroundColor: tg.themeParams.header_bg_color || '#000000',
      textColor: tg.themeParams.text_color || '#000000',
      hintColor: tg.themeParams.hint_color || '#888888',
      linkColor: tg.themeParams.link_color || '#2688ce',
      buttonColor: tg.themeParams.button_color || '#2688ce',
      buttonTextColor: tg.themeParams.button_text_color || '#ffffff'
    };
  }

  // Default fallback colors
  return {
    backgroundColor: '#1a1a1a',
    headerBackgroundColor: '#000000',
    textColor: '#ffffff',
    hintColor: '#888888',
    linkColor: '#2688ce',
    buttonColor: '#2688ce',
    buttonTextColor: '#ffffff'
  };
}

// Function to apply theme colors to game
export function applyThemeToGame() {
  const themeColors = getThemeColors();

  // Apply background color to canvas
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.style.backgroundColor = themeColors.backgroundColor;
  }

  // Apply colors to other game elements if needed
  document.body.style.backgroundColor = themeColors.backgroundColor;
  document.body.style.color = themeColors.textColor;
  return themeColors;
}

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

// Function to send game data to Telegram Bot API
export async function sendGameData(data) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    console.warn('User not authenticated, cannot send game data to bot');
    return false;
  }

  try {
    // In a real implementation, this would make an HTTP request to your bot backend
    // For now, we'll simulate this with a mock API call
    console.log('Sending game data to bot:', data);

    // This is where you would actually send data to your Telegram bot backend
    // Example:
    /*
    const response = await fetch('YOUR_BOT_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        user_id: getAuthenticatedUser().id,
        data: data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    */

    // Simulated successful response
    return { success: true, data: data };
  } catch (error) {
    console.error('Error sending game data to bot:', error);
    return { success: false, error: error.message };
  }
}

// Function to send score to bot
export async function sendScoreToBot(score) {
  const userData = getAuthenticatedUser();
  if (!userData) {
    console.warn('Cannot send score to bot: no authenticated user');
    return false;
  }

  return await sendGameData({
    type: 'score_update',
    user_id: userData.id,
    score: score,
    timestamp: Date.now()
  });
}

// Function to get game data from Telegram Bot API
export async function getGameData(dataType) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    console.warn('User not authenticated, cannot get game data from bot');
    return null;
  }

  try {
    // In a real implementation, this would make an HTTP request to your bot backend
    // For now, we'll simulate this with a mock API call
    console.log('Getting game data from bot:', dataType);

    // This is where you would actually fetch data from your Telegram bot backend
    // Example:
    /*
    const response = await fetch(`YOUR_BOT_API_ENDPOINT/${dataType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    */

    // Simulated response based on data type
    switch (dataType) {
      case 'leaderboard':
        return {
          success: true,
          data: [
            { user_id: userData.id, username: userData.username, score: await getHighScore() },
            { user_id: 2, username: 'player2', score: 5000 },
            { user_id: 3, username: 'player3', score: 3200 }
          ]
        };
      case 'user_stats':
        return {
          success: true,
          data: {
            user_id: userData.id,
            total_games: 15,
            best_score: await getHighScore(),
            achievements: ['first_game', 'high_score']
          }
        };
      default:
        return { success: true, data: {} };
    }
  } catch (error) {
    console.error('Error getting game data from bot:', error);
    return { success: false, error: error.message };
  }
}
