/**
 * PIXEL JUMP - Main Game Entry Point
 * 8-bit Pixel Art Telegram Mini Game
 */

// Import game engine
import { PixelJumpGame } from './engine.v3.js';
import { CHARACTERS, getCharacter, checkCharacterUnlocks, checkAchievements } from './characters.js';

// Import audio system
import { PixelAudio } from './audio.js';

// Import leaderboard
import { Leaderboard, showLeaderboard } from './leaderboard.js';

// Import Telegram integration
import { initTelegram, saveHighScore, getHighScore, sendGameEvent, triggerHapticFeedback, updateMainButton, hideMainButton, saveProgressToCloud, loadProgressFromCloud } from './telegram.js';

// Import Firebase
import { initFirebase, auth } from './firebase-config.js';

// Import Cloud Sync
import { CloudSync } from './cloud-sync.js';

// Import Challenge System
import { challengeSystem } from './challenges.js';

// Import Character UI
import { initCharacterSelect } from './character-ui.js';

// Import Biome System
import { updateBiome } from './biomes.js';

// Import Perks System
import { getAllPerks, getPerk, applyPerk } from './perks.js';

// Import Genesis Pack Skins
import { applySkinEffects, getSkin } from './genesis-skins.js';
import './settings-skins.js';
import './daily-challenge.js';

// Import Tutorial Manager
import { TutorialManager } from './tutorial.js';
import { detectDevice, getDefaultControlMode, shouldShowTiltControls } from './device-utils.js';
import { initI18n, t, setLanguage, getLang, toggleLanguage, applyTranslations } from './i18n.js';

// Detect device type
const deviceInfo = detectDevice();
console.log(`📱 Device: ${deviceInfo.deviceType} | Touch: ${deviceInfo.hasTouch}`);

// Set default control mode if not set
if (!window.controlMode) {
    window.controlMode = localStorage.getItem('pixelJump_controlMode') || getDefaultControlMode(deviceInfo);
    localStorage.setItem('pixelJump_controlMode', window.controlMode);
    console.log(`🎮 Control mode: ${window.controlMode}`);
}

// Initialize Telegram
const tg = initTelegram();
if (tg) {
    tg.ready();
    // Neon theme is permanently locked
}

// DEBUG CONSOLE INTERCEPTOR
(function () {
    const debugDiv = document.getElementById('debug-console');
    if (!debugDiv) return;

    function logToScreen(msg, color = '#0f0') {
        const line = document.createElement('div');
        line.textContent = `> ${msg}`;
        line.style.color = color;
        debugDiv.appendChild(line);
        // Keep 50 lines max
        if (debugDiv.childElementCount > 50) debugDiv.removeChild(debugDiv.firstChild);
        // Auto scroll
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }

    // Override console methods safely
    const originalLog = console.log;
    console.log = function (...args) {
        originalLog.apply(console, args);
        try {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            logToScreen(msg);
        } catch (e) { }
    };

    const originalError = console.error;
    console.error = function (...args) {
        originalError.apply(console, args);
        try {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            logToScreen(msg, '#f00');
        } catch (e) { }
    };
})();

// SERVICE WORKER REGISTRATION (v3.60)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ ServiceWorker registered: ', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New update found...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version installed! Show notification
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(err => {
                console.warn('❌ ServiceWorker registration failed: ', err);
            });
    });
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.innerHTML = `
        <div style="
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.9); border: 2px solid #0f0;
            padding: 15px; border-radius: 8px; z-index: 10000;
            color: #fff; font-family: 'Press Start 2P', monospace;
            text-align: center; box-shadow: 0 5px 20px rgba(0,255,0,0.3);
            animation: slideDown 0.5s ease-out;
            width: 90%; max-width: 350px;
        ">
            <div style="font-size: 10px; color: #0f0; margin-bottom: 8px;">🚀 UPDATE AVAILABLE</div>
            <div style="font-size: 8px; color: #ccc; margin-bottom: 15px;">New version downloaded</div>
            <button onclick="window.location.reload()" style="
                background: #0f0; color: #000; border: none;
                padding: 10px 20px; font-family: inherit; font-size: 10px;
                cursor: pointer; width: 100%; border-radius: 4px;
            ">RELOAD NOW</button>
        </div>
        <style>
            @keyframes slideDown { from { top: -100px; } to { top: 20px; } }
        </style>
    `;
    document.body.appendChild(notification);
}


let userProfile = {
    id: null,
    username: 'Player',
    firstName: '',
    photoUrl: null,
    // Character System
    selectedCharacter: 'jumper',
    unlockedCharacters: ['jumper'], // Default character always unlocked
    totalScore: 0,
    dailyChallengesCompleted: 0,
    achievements: [],
    secretStats: {}
};
window.userProfile = userProfile; // Export globally (BEFORE attemptAuth)

// Load character from localStorage
// Local storage logic moved to async initGame with CloudStorage sync

// Visual Debug Helper
function updateDebugInfo(status, error = '') {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.innerHTML = `Loading...<br><span style="font-size:10px;color:yellow">${status}</span>`;
        if (error) console.error(error);
    }
}

function attemptAuth() {
    try {
        console.log('🔐 Attempting Telegram auth...');

        // Check if we're in Telegram environment
        if (!window.Telegram || !window.Telegram.WebApp) {
            console.warn('⚠️ Not in Telegram WebApp environment');
            return false;
        }

        const tg = window.Telegram.WebApp;
        const initData = tg.initDataUnsafe;

        if (!initData || !initData.user) {
            console.warn('⚠️ No user data from Telegram');
            const btn = document.getElementById('btn-manual-login');
            if (btn) {
                btn.classList.remove('hidden');
                updateDebugInfo('Auth: Failed. Tap Retry.');
            } else {
                updateDebugInfo('Auth: None');
            }
            return false;
        }

        const user = initData.user;
        console.log('✅ Telegram user data:', user);

        // Get user photo URL - Telegram provides photo_url in user object
        let photoUrl = null;
        if (user.photo_url) {
            photoUrl = user.photo_url;
        } else {
            // Fallback: use initial-based avatar
            const name = user.first_name || 'User';
            photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B00FF&color=fff&size=128&bold=true`;
        }

        // Update global userProfile
        window.userProfile.id = `telegram_${user.id}`;
        window.userProfile.username = user.username || `${user.first_name}_${user.id}`;
        window.userProfile.firstName = user.first_name || 'Player';
        window.userProfile.lastName = user.last_name || '';
        window.userProfile.photoUrl = photoUrl;
        window.userProfile.isPremium = user.is_premium || false;
        window.userProfile.languageCode = user.language_code || 'en';

        console.log('✅ User profile updated:', window.userProfile);
        updateDebugInfo(`Auth: OK (${window.userProfile.username})`);

        // Update Menu UI Immediately
        const userEl = document.getElementById('user-name');
        const avatarEl = document.querySelector('.user-avatar');

        if (userEl) {
            userEl.textContent = window.userProfile.username || 'Player';
            if (window.userProfile.isPremium) {
                userEl.style.color = '#8B00FF';
                userEl.innerHTML += ' 🌟';
            }
        }

        if (avatarEl && window.userProfile.photoUrl) {
            const avatarImg = document.createElement('img');
            avatarImg.src = window.userProfile.photoUrl;
            avatarImg.alt = 'Avatar';
            avatarImg.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; border: 2px solid #00FF00;';
            avatarImg.onerror = function() { this.style.display='none'; this.parentElement.innerHTML='👤'; };
            avatarEl.innerHTML = '';
            avatarEl.appendChild(avatarImg);
        }

        // Store in localStorage
        try {
            localStorage.setItem('telegram_user_data', JSON.stringify(window.userProfile));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }

        // Hide retry button if visible
        const btn = document.getElementById('btn-manual-login');
        if (btn) btn.classList.add('hidden');

        return true;
    } catch (error) {
        console.error('❌ Auth error:', error);
        updateDebugInfo('Auth: Error', error.message);
        return false;
    }
}

// Initial Attempt (window.userProfile already set above)
attemptAuth();

const ADMIN_UID = 'BxjJKuIOiPZG3IDcvvrEfsIsxWr2';

// Check for debug flag in URL
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === '1' || urlParams.get('tgWebAppDebugUrl');

// Force debug console if needed
if (debugMode) {
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole) debugConsole.style.display = 'block';
}

// Robust Retry Strategy (Try every 500ms for 3 seconds)
let authRetryCount = 0;

// Magic Gesture to toggle Debug Console (Triple tap on menu logo) - registered ONCE
document.getElementById('menu-logo')?.addEventListener('click', (e) => {
    if (e.detail === 3) {
        const debugConsole = document.getElementById('debug-console');
        if (debugConsole) {
            debugConsole.style.display = debugConsole.style.display === 'none' ? 'block' : 'none';
        }
    }
});
const authRetryInterval = setInterval(() => {
    authRetryCount++;
    const authSuccess = attemptAuth();

    // Check for Admin (Firebase Auth) OR simple debug override
    if ((auth && auth.currentUser && auth.currentUser.uid === ADMIN_UID) || debugMode) {
        const debugConsole = document.getElementById('debug-console');
        if (debugConsole) debugConsole.style.display = 'block';
        console.log('Debug console enabled.');
    }
    // (retry logic continues below)



    if (authSuccess) {
        clearInterval(authRetryInterval);
        console.log(`Auth auto-retry success after ${authRetryCount} attempts`);

        // PERSISTENCE FIX: Load unlocks from cloud/profile
        if (window.initSkins) window.initSkins();

        // Check character unlocks and sync (use already-imported checkCharacterUnlocks)
        if (window.userProfile) {
            const unlocks = checkCharacterUnlocks(window.userProfile);
            unlocks.forEach(char => {
                if (!window.userProfile.unlockedCharacters.includes(char.id)) {
                    window.userProfile.unlockedCharacters.push(char.id);
                }
            });
            saveProgressToCloud(window.userProfile);
        }
    } else if (authRetryCount >= 6) {
        clearInterval(authRetryInterval);
        console.log('Auth auto-retry gave up. Waiting for manual retry.');
    }
}, 500);

// Retry Handler
document.getElementById('btn-manual-login')?.addEventListener('click', () => {
    updateDebugInfo('Retrying Auth...');
    setTimeout(() => {
        if (attemptAuth()) {
            console.log('Manual auth successful');
        }
    }, 500);
});
// (window.userProfile already set after declaration — see line ~167)

// Initialize Firebase (non-blocking)
let firebaseInitialized = false;

// Initialize Cloud Sync
const cloudSync = new CloudSync();
window.cloudSync = cloudSync; // Export for settings-skins.js

const firebaseInitPromise = initFirebase()
    .then(async (user) => {
        if (user) {
            firebaseInitialized = true;
            console.log('Firebase initialized successfully');

            // Load cloud progress after auth
            try {
                const cloudData = await cloudSync.loadProgress();
                if (cloudData) {
                    console.log('☁️ Cloud progress loaded, refreshing UI...');
                    // Refresh high score display
                    const newHigh = parseInt(localStorage.getItem('uploop_high_score') || '0');
                    if (newHigh > highScore) {
                        highScore = newHigh;
                        updateHighScoreDisplay(highScore);
                    }
                    // Refresh skins if initSkins exists
                    if (window.initSkins) window.initSkins();
                }
            } catch (syncErr) {
                console.warn('☁️ Cloud sync load failed:', syncErr.message);
            }
        } else {
            console.log('Firebase not available, continuing without it');
        }
    })
    .catch((error) => {
        console.warn('Firebase initialization failed, continuing without Firebase:', error.message);
    });

// Get canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // Strict 8-bit rendering

// Set canvas internal resolution (Fixed for 8-bit logic)
canvas.width = 360;
canvas.height = 640;

// Dynamic Resizing for Universal Device Support
function resizeGame() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate scale factor to fit window while maintaining aspect ratio (360/640 = 0.5625)
    const targetRatio = 360 / 640;
    const windowRatio = windowWidth / windowHeight;

    let scale;
    if (windowRatio < targetRatio) {
        // Window is narrower than game, fit to width
        scale = windowWidth / 360;
    } else {
        // Window is wider than game, fit to height
        scale = windowHeight / 640;
    }

    // Apply scale via CSS transform to ensure crisp pixels
    canvas.style.width = `${360 * scale}px`;
    canvas.style.height = `${640 * scale}px`;

    // CRITICAL FIX: Center canvas on mobile
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = `translate(-50%, -50%)`;

    console.log('📐 Canvas resized:', {
        windowWidth,
        windowHeight,
        scale,
        canvasWidth: 360 * scale,
        canvasHeight: 640 * scale
    });
}

// Initial resize
resizeGame();

// Resize on window resize and orientation change
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeGame, 100); // Delay to let orientation settle
});
if (tg) {
    tg.onEvent('viewportChanged', resizeGame);
    tg.expand(); // Force expand again
}

// (duplicate resizeGame removed — already called at line 422)

// Initialize Audio
const audio = new PixelAudio();
window.audio = audio; // Export for settings-skins.js

// Game Instance
let game = null;

// Initialize leaderboard
const leaderboard = new Leaderboard();

// Game state
let currentScreen = 'loading'; // loading, menu, playing, paused, gameover
let score = 0;
let highScore = 0;
let animationFrameId = null;
let lastTime = 0; // Fix: Global variable required for loop
let selectedPerk = null; // Currently selected perk for next game
let currentDifficulty = 'normal'; // Default difficulty

// Load high score
getHighScore().then(savedHighScore => {
    // Fix NaN bug - ensure we always have a valid number
    highScore = isNaN(savedHighScore) || savedHighScore === null ? 0 : savedHighScore;
    console.log('📊 High Score loaded:', highScore);
    updateHighScoreDisplay(highScore);
});



// UI Helper Functions
function showError(msg) {
    console.error('SHOW ERROR:', msg);
    alert('⚠️ ERROR: ' + msg);
}

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show target screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }

    currentScreen = screenId.replace('-screen', '');

    // Apply i18n when navigating
    if (typeof applyTranslations === 'function') {
        try { applyTranslations(); } catch (e) { /* silent */ }
    }
}
window.showScreen = showScreen; // Export for settings-skins.js

function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('current-score');
    if (scoreElement) {
        scoreElement.textContent = String(score).padStart(5, '0');
    }
}

function updateHighScoreDisplay(score) {
    const highScoreEl = document.getElementById('high-score');
    if (highScoreEl) {
        // Fix NaN display bug
        const validScore = isNaN(score) || score === null ? 0 : score;
        highScoreEl.textContent = String(validScore).padStart(5, '0');
    }
}

function updateComboDisplay(combo) {
    const comboDisplay = document.getElementById('combo-display');
    const comboValue = document.getElementById('combo-value');

    if (comboDisplay && comboValue) {
        if (combo > 1) {
            comboDisplay.classList.remove('hidden');
            comboValue.textContent = combo;
        } else {
            comboDisplay.classList.add('hidden');
        }
    }
}

// Initialize game
async function initGame() {
    console.log('📍 initGame: START');
    console.log('Initializing PIXEL JUMP...');

    try {
        // Initialize game engine
        console.log('📍 Creating PixelJumpGame instance...');
        console.log(`⚙️ Difficulty: ${currentDifficulty}`);
        game = new PixelJumpGame(canvas, ctx, audio, currentDifficulty);
        console.log('📍 PixelJumpGame created successfully');

        // Initialize Tutorial (Global access)
        window.tutorial = new TutorialManager(game);

        // Inputs are bound at module level (setupInputs is called once below)
        console.log('✅ Inputs will be bound at module level');

        // Export game for settings
        window.game = game;

        try {
            console.log('☁️ Loading inventory from CloudStorage...');
            updateDebugInfo('Loading Cloud Data...');
            const cloudProgress = await loadProgressFromCloud();
            if (cloudProgress) {
                if (cloudProgress.selectedCharacter && CHARACTERS[cloudProgress.selectedCharacter]) {
                    userProfile.selectedCharacter = cloudProgress.selectedCharacter;
                }
                if (cloudProgress.unlockedCharacters && Array.isArray(cloudProgress.unlockedCharacters)) {
                    userProfile.unlockedCharacters = cloudProgress.unlockedCharacters;
                }
            }
        } catch (e) {
            console.warn('Failed to sync cloud progress:', e);
        }

        const selectedChar = getCharacter(userProfile.selectedCharacter);
        game.selectedCharacter = selectedChar;
        console.log(`🎮 Selected character: ${selectedChar.name} ${selectedChar.emoji}`);

        // Show loading screen and simulate loading
        const loadingElement = document.getElementById('loading-screen');
        const progressFill = loadingElement.querySelector('.progress-fill');

        console.log('📍 Starting loading animation...');

        // Animate loading (Slower pace per user request)
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 250)); // 2.5s total loading time
            if (progressFill) {
                progressFill.style.width = `${i}%`;
            }
            console.log(`📍 Loading progress: ${i}%`);
        }

        console.log('📍 Loading animation complete');

        setTimeout(() => {
            console.log('📍 Transitioning to menu screen...');
            showScreen('menu-screen');

            // Update User Badge in Menu
            const userEl = document.getElementById('user-name');
            const avatarEl = document.querySelector('.user-avatar');

            if (window.userProfile) {
                if (userEl) {
                    userEl.textContent = window.userProfile.username || 'Player';
                    if (window.userProfile.isPremium) {
                        userEl.style.color = '#8B00FF'; // Purple for premium
                        userEl.innerHTML += ' 🌟';
                    }
                }

                // Set avatar image
                if (avatarEl && window.userProfile.photoUrl) {
                    const avatarImg = document.createElement('img');
                    avatarImg.src = window.userProfile.photoUrl;
                    avatarImg.alt = 'Avatar';
                    avatarImg.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; border: 2px solid #00FF00;';
                    avatarImg.onerror = function() { this.style.display='none'; this.parentElement.innerHTML='👤'; };
                    avatarEl.innerHTML = '';
                    avatarEl.appendChild(avatarImg);
                }
            }

            // Show Main Button for PLAY?
            // User asked to revert, so let's hide it in menu to be safe and use on-screen buttons
            hideMainButton();

            console.log('✅ Game ready!');
        }, 500);
    } catch (error) {
        console.error('❌ Error in initGame:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

// Game Loop - Fixed Timestep Implementation
let accumulator = 0;
const FIXED_TIME_STEP = 1 / 60; // 60 updates per second
const MAX_FRAME_TIME = 0.1; // Max catch-up time (prevents spiral of death)

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    // Calculate delta time in seconds
    let frameTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap frame time to prevent spiraling if tab was inactive or very slow
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    accumulator += frameTime;

    if (currentScreen === 'playing') {
        // Update physics in fixed steps
        while (accumulator >= FIXED_TIME_STEP) {
            const result = game.update(); // Engine assumes 1 tick = 1/60s roughly

            if (result === 'gameover') {
                handleGameOver();
                return; // Stop loop
            }

            accumulator -= FIXED_TIME_STEP;
        }

        // Render (visuals use latest state)
        game.render();

        // Update UI (throttled naturally by render FPS)
        updateScoreDisplay(game.score);
        updateComboDisplay(game.combo);

        // Schedule next frame
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Event Handlers
// Event Handlers
async function startGame() {
    console.log('🚀 startGame: Initiating launch sequence...');

    // Ensure game instance exists (LAZY INIT STRATEGY)
    let gameInstance = window.game || game;

    if (!gameInstance) {
        console.warn('⚠️ Game instance missing. Attempting FORCE INIT...');
        try {
            if (typeof PixelJumpGame !== 'undefined' && canvas && ctx && audio) {
                const diff = localStorage.getItem('difficulty') || 'normal';
                game = new PixelJumpGame(canvas, ctx, audio, diff);
                window.game = game;
                gameInstance = game;

                // Init tutorial if needed since we skipped initGame
                if (typeof TutorialManager !== 'undefined') {
                    window.tutorial = new TutorialManager(game);
                }

                console.log('✅ FORCE INIT SUCCESSFUL');
            } else {
                throw new Error('Dependencies missing for force init');
            }
        } catch (e) {
            console.error('❌ FATAL: Force init failed:', e);
            const missingDeps = [];
            if (typeof PixelJumpGame === 'undefined') missingDeps.push('PixelJumpGame');
            if (!canvas) missingDeps.push('canvas');
            if (!ctx) missingDeps.push('ctx');
            if (!audio) missingDeps.push('audio');

            showError(`Init Failed: ${e.message}\nMissing: ${missingDeps.join(', ')}`);
            // setTimeout(() => window.location.reload(), 2000); // Disable auto-reload to see error
            return;
        }
    }

    // Force stop if running (Re-start behavior)
    if (gameInstance.isRunning) {
        console.warn('⚠️ Game was running, forcing stop for restart');
        if (gameInstance.stop) gameInstance.stop();
        gameInstance.isRunning = false;
    }

    // Initialize audio on first interaction (SAFE MODE)
    try {
        if (audio) {
            // Check if context exists but suspended
            if (audio.audioContext && audio.audioContext.state === 'suspended') {
                console.log('⏸ Audio context suspended, resuming...');
                audio.audioContext.resume().catch(e => console.warn('Resume failed:', e));
            }

            // Initialize if needed
            if (!audio.initialized && typeof audio.init === 'function') {
                console.log('🔊 Initializing Audio Context...');
                audio.init();
                console.log('✅ Audio initialized');
            }
        }
    } catch (audioErr) {
        console.warn('⚠️ Audio init warning (non-fatal):', audioErr);
    }

    // DEEP CLEANUP
    console.log('🧹 Starting cleanup...');
    try {
        if (gameInstance.stop) gameInstance.stop();
        if (gameInstance.ghost && gameInstance.ghost.stopRecording) gameInstance.ghost.stopRecording();
        // Reset arrays safely
        gameInstance.platforms = [];
        gameInstance.particles = [];
        gameInstance.enemies = [];
        console.log('✅ Cleanup complete');
    } catch (cleanupErr) {
        console.warn('⚠️ Cleanup warning:', cleanupErr.message);
    }

    // Hide menu, show HUD
    console.log('🎮 Switching screens...');
    showScreen('playing');
    const hudElement = document.getElementById('game-hud');
    if (hudElement) {
        hudElement.classList.remove('hidden');
        console.log('✅ HUD shown');
    } else {
        console.error('❌ HUD element not found');
    }

    // Show hints if first time
    if (!localStorage.getItem('pixelJump_hintsShown')) {
        const hints = document.getElementById('touch-hints');
        if (hints) {
            hints.classList.remove('hidden');
            hints.classList.remove('fade-out');
            // Auto fade after 4s
            setTimeout(() => {
                if (hints && !hints.classList.contains('fade-out')) {
                    hints.classList.add('fade-out');
                }
            }, 4000);
        }
    }

    // MAIN GAME LAUNCH
    try {
        console.log('🎮 Configuring game session...');

        // CRITICAL FIX: Use engine's own start() method to ensure all systems 
        // (ghost, physics, character stats, platforms, difficulty) initialize properly
        gameInstance.start();

        // Need to re-apply perks after start() depending on implementation
        if (selectedPerk && typeof applyPerk === 'function') {
            gameInstance.perkShieldActive = false;
            gameInstance.perkShieldUsed = false;
            applyPerk(gameInstance, selectedPerk);
        }

        console.log('✅ Game state reset via start(). Running = true');

        // Start game loop
        console.log('🔄 Starting game loop...');
        lastTime = 0; // Reset so gameLoop gets a clean start from rAF
        animationFrameId = requestAnimationFrame(gameLoop);
        console.log('✅ Game loop started');

        // START TUTORIAL IF NEEDED
        if (window.tutorial) {
            window.tutorial.init();
        }

        // Hide Main Button
        hideMainButton();

        console.log('✅✅✅ startGame() completed successfully');

    } catch (fatalError) {
        console.error('💥💥💥 FATAL ERROR in startGame:', fatalError.message);
        console.error('Stack trace:', fatalError.stack);

        // Show comprehensive error to user
        const debugDiv = document.getElementById('debug-console');
        if (debugDiv) {
            debugDiv.style.display = 'block';
            debugDiv.innerHTML += `<div style="color:red">CRASH: ${fatalError.message}<br>Stack: ${fatalError.stack}</div>`;
        }

        alert('Critical Error: ' + fatalError.message + '\nPlease screenshot the debug console and report this bug.');

        // Try to recover
        try {
            showScreen('menu-screen');
        } catch (e) {
            console.error('❌ Cannot even show menu:', e);
        }
    }
}

function handleGameOver() {
    console.log('Game Over! Score:', game.score);

    // NOTE: engine already called game.stop() and audio.playGameOver()
    // so we only cancel the animation frame and proceed with UI/scoring
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Hide HUD
    const hudEl = document.getElementById('game-hud');
    if (hudEl) hudEl.classList.add('hidden');

    // Update scores
    score = game.score;
    const isNewRecord = score > highScore;
    if (isNewRecord) {
        highScore = score;
        saveHighScore(highScore);
        updateHighScoreDisplay(highScore);
        audio.playNewRecord();
    }

    // Check for skin unlocks
    if (window.checkUnlockedSkins) {
        window.checkUnlockedSkins(score);
    }

    // Update character stats
    if (game.characterStats) {
        game.characterStats.score = score;
    }

    // Check character unlocks
    userProfile.totalScore = (userProfile.totalScore || 0) + score;
    const newUnlocks = checkCharacterUnlocks(userProfile);
    if (newUnlocks.length > 0) {
        newUnlocks.forEach(char => {
            if (!userProfile.unlockedCharacters.includes(char.id)) {
                userProfile.unlockedCharacters.push(char.id);
                console.log(`🔓 UNLOCKED: ${char.name} ${char.emoji}`);
                // TODO: Show unlock notification
            }
        });
        // Save unlocks
        try {
            saveProgressToCloud(userProfile);
        } catch (e) {
            console.warn('Failed to save unlocks:', e);
        }
    }

    // Check achievements
    const previousAchievements = userProfile.achievements || [];
    const newAchievements = checkAchievements(game.characterStats, previousAchievements);
    if (newAchievements.length > 0) {
        newAchievements.forEach(ach => {
            userProfile.achievements.push(ach.id);
            console.log(`🏅 ACHIEVEMENT: ${ach.emoji} ${ach.name}`);
            // TODO: Show achievement notification
        });
    }

    // Cloud sync — save progress after game over
    if (window.cloudSync) {
        window.cloudSync.saveProgress().catch(e => console.warn('☁️ Cloud save failed:', e.message));
    }

    // Submit to leaderboard if score is decent
    if (score > 10) {
        submitToLeaderboard(score);
    }

    // Check Daily Challenge
    if (window.dailyChallenge) {
        window.dailyChallenge.checkProgress({
            score: score,
            maxCombo: game.maxCombo || 0,
            jumps: game.jumps || 0
        });
    }

    // Show game over screen
    showScreen('gameover-screen');
    const finalScoreEl = document.getElementById('final-score');
    if (finalScoreEl) finalScoreEl.textContent = String(score).padStart(5, '0');
    // Fix for NaN issue
    const safeHighScore = (highScore && !isNaN(highScore)) ? highScore : 0;
    const bestScoreEl = document.getElementById('best-score');
    if (bestScoreEl) bestScoreEl.textContent = String(safeHighScore).padStart(5, '0');

    const newRecordElement = document.getElementById('new-record');
    if (isNewRecord && newRecordElement) {
        newRecordElement.classList.remove('hidden');
        triggerHapticFeedback('success'); // New record = success
    } else if (newRecordElement) {
        newRecordElement.classList.add('hidden');
        triggerHapticFeedback('error'); // Normal death = error
    }

    sendGameEvent('game_over', { score });

    // Hide Main Button to avoid duplication
    hideMainButton();

    // Duel mode — auto-prompt share
    if (window._duelMode) {
        window._duelMode = false;
        // Show share button prominently
        const shareBtn = document.getElementById('btn-share');
        if (shareBtn) {
            shareBtn.textContent = window.currentLang === 'ru' ? '⚔️ ОТПРАВИТЬ ВЫЗОВ' : '⚔️ SEND CHALLENGE';
            shareBtn.classList.add('primary', 'glow');
        }
    }

    // Handle Challenge Mode
    if (currentChallengeData) {
        showScreen('challenge-result-screen');

        const isVictory = score > currentChallengeData.scoreToBeat;
        const resultTitle = document.getElementById('duel-result-title');
        const box = document.getElementById('result-panel');
        const playerScoreEl = document.getElementById('duel-player-score');
        const targetScoreEl = document.getElementById('duel-target-score');
        if (playerScoreEl) playerScoreEl.textContent = score;
        if (targetScoreEl) targetScoreEl.textContent = currentChallengeData.scoreToBeat;

        if (resultTitle && isVictory) {
            resultTitle.textContent = "🎉 YOU WON!";
            resultTitle.style.color = "#00FF00";
            if (box) { box.classList.remove('defeat'); box.classList.add('victory'); }
            triggerHapticFeedback('success');
            audio.playNewRecord(); // Victory sound
        } else if (resultTitle) {
            resultTitle.textContent = "😬 ALMOST!";
            resultTitle.style.color = "#FF0000";
            if (box) { box.classList.remove('victory'); box.classList.add('defeat'); }
            triggerHapticFeedback('error');
        }
        return; // Skip standard game over screen
    }
}
// Expose handleGameOver globally for engine.v3.js
window.handleGameOver = handleGameOver;

function restartGame() {
    showScreen('playing');
    startGame();
}

function returnToMenu() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (game && typeof game.stop === 'function') {
        game.stop();
    }
    document.getElementById('game-hud')?.classList.add('hidden');
    showScreen('menu-screen');
    triggerHapticFeedback('light');
}

// Open character select
function openCharacterSelect() {
    showScreen('character-select-screen');
    initCharacterSelect();
    triggerHapticFeedback('light');
}

// Initialize perk selection
// Global Start Functions (Nuclear Option)
window.selectPerk = function (perkRole) {
    const cards = document.querySelectorAll('.perk-card');
    cards.forEach(c => c.classList.remove('selected'));

    const targetCard = document.querySelector(`.perk-card[data-perk="${perkRole}"]`);
    if (targetCard) targetCard.classList.add('selected');

    selectedPerk = perkRole;
    triggerHapticFeedback('light');
    console.log(`🎯 Perk selected via global: ${perkRole}`);
}

window.tryStartGame = function () {
    console.log('▶️ Global TryStartGame called');
    // alert('Debug: Try Start Called'); // Uncomment if needed
    triggerHapticFeedback('medium');
    try {
        startGame().catch(e => alert(`StartGame Failed: ${e.message}`));
    } catch (e) {
        alert(`TryStart Error: ${e.message}`);
    }
}

window.skipPerkAndStart = function () {
    console.log('⏭ Global Skip called');
    selectedPerk = null;
    triggerHapticFeedback('medium');
    startGame();
}

// Initialize perk selection (UI only)
function initPerkSelection() {
    // Reset visual selection
    selectedPerk = null;
    document.querySelectorAll('.perk-card').forEach(c => c.classList.remove('selected'));
}

// Share Function
async function shareScore() {
    const message = `I scored ${score} in Pixel Jump! Can you beat me?`;
    let shareUrl;
    const user = window.userProfile || { id: 'local' };
    const currentSkinId = localStorage.getItem(`selectedSkin_genesis_${user.id}`) || localStorage.getItem('selectedSkin') || window.selectedSkin || 'pixel_cube';
    try {
        // Try creating a challenge first
        if (score > 10 && challengeSystem) {
            const challengeId = await challengeSystem.createChallenge(score, currentSkinId);
            if (challengeId) {
                const urls = challengeSystem.generateShareUrl(challengeId, score);
                shareUrl = urls.telegram;
            }
        }
    } catch (e) {
        console.error('Error creating challenge for share:', e);
    }

    // Fallback if challenge creation failed
    if (!shareUrl) {
        const botName = 'pixel_jump_bot';
        const appUrl = `https://t.me/${botName}`;
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(message)}`;
    }

    console.log('Sharing URL:', shareUrl);

    if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(shareUrl);
    } else {
        // Fallback for web/testing
        window.open(shareUrl, '_blank');
    }
}

// Button Event Listeners
// (pause registered in setupInputs with haptic)

// START button now shows perk selection
document.getElementById('btn-start')?.addEventListener('click', () => {
    showScreen('perk-select-screen');
    initPerkSelection();
});

document.getElementById('btn-characters')?.addEventListener('click', openCharacterSelect);
document.getElementById('btn-tutorial')?.addEventListener('click', () => {
    localStorage.removeItem('tutorial_completed');
    triggerHapticFeedback('light');
    if (window.audio && window.audio.playJump) window.audio.playJump();
    alert('Tutorial will show on your next game!');
});
document.getElementById('btn-challenges')?.addEventListener('click', () => {
    triggerHapticFeedback('light');
    showDuelMenu();
});
document.getElementById('btn-skins')?.addEventListener('click', () => {
    showScreen('skins-screen');
    hideMainButton();
});
document.getElementById('btn-settings')?.addEventListener('click', () => {
    showScreen('settings-screen');
    hideMainButton();
});

// (resume registered in setupInputs)
document.getElementById('btn-restart')?.addEventListener('click', restartGame);
document.getElementById('btn-menu')?.addEventListener('click', returnToMenu);

document.getElementById('btn-play-again')?.addEventListener('click', () => {
    showScreen('playing');
    startGame();
});
document.getElementById('btn-share')?.addEventListener('click', shareScore);
document.getElementById('btn-menu-go')?.addEventListener('click', returnToMenu);

// Challenge Event Listeners
document.getElementById('btn-accept-challenge')?.addEventListener('click', () => {
    startGame();
});

document.getElementById('btn-decline-challenge')?.addEventListener('click', () => {
    currentChallengeData = null;
    showScreen('menu-screen');
});

document.getElementById('btn-challenge-menu')?.addEventListener('click', () => {
    currentChallengeData = null;
    returnToMenu();
});

document.getElementById('btn-challenge-share')?.addEventListener('click', () => {
    // Revenge share!
    shareScore(); // Will create a NEW challenge with player's new score
});

// Global Error Handler for Mobile Debugging (VISIBLE TO USER)
window.onerror = function (msg, url, line, col, error) {
    console.error(`Global Error: ${msg} at ${line}:${col}`);
    alert(`CRITICAL ERROR:\n${msg}\nLine: ${line}`);
    return false;
};

// Input Handling
function setupInputs() {
    // Keyboard Controls (SINGLE handler - supports both WASD and Arrow keys)
    document.addEventListener('keydown', (e) => {
        if (!game || !game.isRunning) {
            if (e.key === ' ' || e.key === 'Enter') {
                const startBtn = document.getElementById('btn-start');
                if (startBtn && !startBtn.parentElement.classList.contains('hidden')) startBtn.click();
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (typeof game.setInput === 'function') game.setInput(true, game.rightPressed);
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (typeof game.setInput === 'function') game.setInput(game.leftPressed, true);
        }
        if (e.key === 'Escape') pauseGame();
    });

    document.addEventListener('keyup', (e) => {
        if (!game || typeof game.setInput !== 'function') return;

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            game.setInput(false, game.rightPressed);
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            game.setInput(game.leftPressed, false);
        }
    });

    // Touch Controls (SINGLE handler on window — covers canvas and full screen)
    const handleTouch = (e) => {
        const target = e.target;
        const isUI = target.tagName === 'BUTTON' || target.closest('button') || target.closest('.pixel-btn') || target.closest('.pixel-button') || target.closest('.setting-item');
        if (isUI) return;

        if (game && game.isRunning) {
            if (e.cancelable) e.preventDefault();
        } else {
            if (target.tagName === 'CANVAS' && e.cancelable) e.preventDefault();
        }

        if (!game || !game.isRunning) return;
        if (typeof game.setInput !== 'function') return;

        const touch = e.touches[0];
        if (!touch) return;

        if (touch.clientX < window.innerWidth / 2) {
            game.setInput(true, false);
        } else {
            game.setInput(false, true);
        }

        // Hide hints on first tap
        const hints = document.getElementById('touch-hints');
        if (hints && !hints.classList.contains('fade-out')) {
            hints.classList.add('fade-out');
            setTimeout(() => hints.classList.add('hidden'), 1000);
            localStorage.setItem('pixelJump_hintsShown', 'true');
        }
    };

    const handleTouchEnd = (e) => {
        const target = e.target;
        const isUI = target.tagName === 'BUTTON' || target.closest('button');
        if (isUI) return;

        if (e.cancelable) e.preventDefault();
        if (game && typeof game.setInput === 'function') game.setInput(false, false);
    };

    // Mouse fallback (on gameCanvas)
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        gameCanvas.addEventListener('mousedown', (e) => {
            if (!game || !game.isRunning) return;
            if (e.clientX < window.innerWidth / 2) game.setInput(true, false);
            else game.setInput(false, true);
        });
        gameCanvas.addEventListener('mouseup', () => {
            if (game) game.setInput(false, false);
        });
    }

    // Touch events on window (single registration)
    window.addEventListener('touchstart', handleTouch, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchmove', (e) => {
        if (game && game.isRunning && e.cancelable) e.preventDefault();
    }, { passive: false });

    // ========== ACCELEROMETER / TILT CONTROLS ==========
    let accelPermissionGranted = false;

    function handleDeviceOrientation(e) {
        if (!game || !game.isRunning) return;

        const mode = window.controlMode || 'tap';
        if (mode === 'tap') return;

        let tilt = e.gamma; // Left-right tilt in portrait
        const orient = window.screen?.orientation?.type || '';
        if (orient.includes('landscape')) {
            tilt = e.beta;
        }

        if (tilt !== null && tilt !== undefined) {
            let normalizedTilt = tilt / 40; // Slightly more responsive
            normalizedTilt = Math.max(-1, Math.min(1, normalizedTilt));

            if (typeof game.setTilt === 'function') {
                game.setTilt(normalizedTilt);
            }
        }
    }

    // Also support DeviceMotionEvent for better accelerometer data
    function handleDeviceMotion(e) {
        if (!game || !game.isRunning) return;

        const mode = window.controlMode || 'tap';
        if (mode === 'tap') return;

        const accel = e.accelerationIncludingGravity;
        if (!accel) return;

        // x-axis: positive = tilt right, negative = tilt left
        let tilt = accel.x / 9.81; // Normalize to -1..1
        tilt = Math.max(-1, Math.min(1, tilt));

        // Invert for natural feel (tilt right = move right)
        if (typeof game.setTilt === 'function') {
            game.setTilt(-tilt);
        }
    }

    async function requestAccelerometerPermission() {
        if (accelPermissionGranted) {
           console.log('✅ Accelerometer listeners already attached');
           return true; 
        }

        // iOS 13+ requires explicit permission
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    accelPermissionGranted = true;
                    window.addEventListener('deviceorientation', handleDeviceOrientation);
                    console.log('✅ Accelerometer permission granted (iOS)');
                    return true;
                } else {
                    console.warn('❌ Accelerometer permission denied');
                    return false;
                }
            } catch (e) {
                console.error('Accelerometer permission error:', e);
                return false;
            }
        }

        // Android / other — no permission needed
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const response = await DeviceMotionEvent.requestPermission();
                if (response === 'granted') {
                    window.addEventListener('devicemotion', handleDeviceMotion);
                }
            } catch (e) { /* ignore */ }
        }

        // Just listen — permission not needed on most Android
        accelPermissionGranted = true;
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('devicemotion', handleDeviceMotion);
        console.log('✅ Accelerometer listeners attached');
        return true;
    }

    // Auto-request if tilt/hybrid mode is set
    const savedMode = window.controlMode || 'tap';
    if (savedMode === 'tilt' || savedMode === 'hybrid') {
        requestAccelerometerPermission();
    }

    // Expose for settings UI — request permission when switching to tilt
    window.requestAccelerometerPermission = requestAccelerometerPermission;

    // Hook into control mode changes
    const origControlModes = ['tap', 'tilt', 'hybrid'];
    origControlModes.forEach(mode => {
        const btn = document.getElementById(`mode-${mode}`);
        if (btn) {
            btn.addEventListener('click', () => {
                if ((mode === 'tilt' || mode === 'hybrid') && !accelPermissionGranted) {
                    requestAccelerometerPermission().then(granted => {
                        if (!granted) {
                            const msg = window.currentLang === 'ru'
                                ? 'Доступ к датчикам запрещён'
                                : 'Motion sensor permission denied';
                            alert(msg);
                            // Revert to tap
                            window.controlMode = 'tap';
                            localStorage.setItem('pixelJump_controlMode', 'tap');
                        }
                    });
                }
            });
        }
    });

    // Pause Button (single registration with haptic)
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pauseGame();
            triggerHapticFeedback('medium');
        });
    }

    // Resume Button (single registration)
    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            resumeGame();
        });
    }
}

// Call setupInputs
setupInputs();

// ========== i18n INIT ==========
initI18n();

// Language toggle in settings
document.getElementById('toggle-lang')?.addEventListener('click', () => {
    const newLang = toggleLanguage();
    const btn = document.getElementById('toggle-lang');
    if (btn) btn.textContent = newLang.toUpperCase();
    triggerHapticFeedback('light');
});

// Set initial language button text
const langBtn = document.getElementById('toggle-lang');
if (langBtn) langBtn.textContent = getLang().toUpperCase();

// ========== DUEL SYSTEM ==========
function showDuelMenu() {
    showScreen('duel-menu-screen');
    const bestEl = document.getElementById('duel-best-score');
    const safeHigh = (highScore && !isNaN(highScore)) ? highScore : 0;
    if (bestEl) bestEl.textContent = String(safeHigh).padStart(5, '0');
}

function startDuel() {
    triggerHapticFeedback('medium');
    // Mark as duel mode — on game over, auto-share
    window._duelMode = true;
    startGame();
}
window.startDuel = startDuel;

// Expose for HTML
document.getElementById('btn-duel-start')?.addEventListener('click', startDuel);
document.getElementById('btn-duel-back')?.addEventListener('click', () => {
    showScreen('menu-screen');
    triggerHapticFeedback('light');
});

// Challenge State
let currentChallengeData = null;

// Check for deep link on load
async function checkDeepLink() {
    // Check URL params (Web)
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start_param') || urlParams.get('start');

    // Check Telegram params
    const tgStart = window.Telegram?.WebApp?.initDataUnsafe?.start_param;

    const challengeParam = tgStart || startParam;

    if (challengeParam && challengeParam.startsWith('challenge_')) {
        const challengeId = challengeParam.replace('challenge_', '');
        console.log('Found challenge ID:', challengeId);

        // Fetch challenge
        const challenge = await challengeSystem.getChallenge(challengeId);
        if (challenge) {
            currentChallengeData = challenge;
            showChallengeRequest(challenge);
        }
    }
}

function showChallengeRequest(challenge) {
    showScreen('challenge-start-screen');

    const nameEl = document.getElementById('challenger-name');
    if (nameEl) nameEl.textContent = `@${challenge.creatorName} challenges you!`;

    const targetEl = document.getElementById('challenge-target');
    if (targetEl) targetEl.textContent = String(challenge.scoreToBeat).padStart(5, '0');

    // Auto-select skin if user has it, or warn
    // For now we just let them play with their own skin
}

// Start the game safely
function startApp() {
    console.log('🚀 Starting Application...');
    console.log('Document readyState:', document.readyState);
    console.log('Game object exists:', typeof game);

    initGame().then(() => {
        console.log('✅ initGame completed successfully');
        checkDeepLink();
    }).catch(err => {
        console.error('❌ Init failed:', err);
        console.error('Error stack:', err.stack);
        // Force menu show if init crashes
        document.getElementById('loading-screen')?.classList.add('hidden');
        showScreen('menu-screen');
    });
}

// Add global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    console.error('Promise:', event.promise);
});

console.log('📍 Checkpoint: Before readyState check');
if (document.readyState === 'complete') {
    console.log('📍 Document already complete, calling startApp immediately');
    startApp();
} else {
    console.log('📍 Document not complete, adding load listener');
    window.addEventListener('load', () => {
        console.log('📍 Load event fired, calling startApp');
        startApp();
    });
}
console.log('📍 Checkpoint: After readyState check');

// Export for debugging
window.gameDebug = {
    game,
    showScreen,
    startGame,
    score: () => game.score
};

console.log('PIXEL JUMP main.js loaded');

// ========== ERROR RECOVERY SYSTEM ==========
function showErrorScreen(error, context = 'Unknown') {
    console.error('🚨 SHOWING ERROR SCREEN');
    console.error('Context:', context);
    console.error('Error:', error);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (game && game.stop) {
        try { game.stop(); } catch (e) { console.warn('Could not stop game:', e); }
    }

    document.getElementById('game-hud')?.classList.add('hidden');
    showScreen('error-screen');

    const messageEl = document.getElementById('error-message');
    const detailsEl = document.getElementById('error-details');

    if (messageEl) messageEl.textContent = `${context}: ${error.message || error}`;
    if (detailsEl) detailsEl.textContent = error.stack || error.toString();

    window.lastError = {
        context,
        message: error.message || error.toString(),
        stack: error.stack || 'No stack trace',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
}

// Error Screen Button Handlers
document.getElementById('btn-retry-game')?.addEventListener('click', () => {
    console.log('🔄 Retry button clicked');
    try {
        startGame();
    } catch (error) {
        showErrorScreen(error, 'Retry failed');
    }
});

document.getElementById('btn-error-menu')?.addEventListener('click', () => {
    showScreen('menu-screen');
});

document.getElementById('btn-copy-error')?.addEventListener('click', () => {
    if (window.lastError) {
        const errorText = `PIXEL JUMP Error Report\nContext: ${window.lastError.context}\nMessage: ${window.lastError.message}\nTime: ${window.lastError.timestamp}\n\nStack:\n${window.lastError.stack}`;
        navigator.clipboard.writeText(errorText).then(() => alert('Error copied!')).catch(() => prompt('Copy error:', errorText));
    }
});

// Export for global access
window.showErrorScreen = showErrorScreen;

// Leaderboard button handlers
document.getElementById('btn-leaderboard')?.addEventListener('click', async () => {
    showScreen('leaderboard-screen');
    triggerHapticFeedback('light');

    // Show loading state
    const container = document.querySelector('.leaderboard-list');
    if (container) {
        const loadText = window.currentLang === 'ru' ? 'Загрузка...' : 'Loading...';
        container.innerHTML = `<div class="no-scores">${loadText}</div>`;
    }

    try {
        const scores = await leaderboard.getTopScores(100);
        showLeaderboard(scores);
    } catch (e) {
        console.error('Leaderboard load error:', e);
        if (container) {
            const errText = window.currentLang === 'ru' ? 'Ошибка загрузки' : 'Failed to load';
            container.innerHTML = `<div class="no-scores">${errText}</div>`;
        }
    }
});

document.getElementById('btn-back-leaderboard')?.addEventListener('click', () => {
    showScreen('menu-screen');
    triggerHapticFeedback('light');
});

// Pause/Resume Logic
function pauseGame() {
    if (!game || !game.isRunning) return;

    console.log('⏸ Game Paused');
    game.isRunning = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    showScreen('pause-screen');
}

function resumeGame() {
    console.log('▶ Game Resumed');

    // Restore screen state so gameLoop processes updates
    currentScreen = 'playing';
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) pauseScreen.classList.remove('active');

    // Show game HUD
    document.getElementById('game-hud')?.classList.remove('hidden');

    if (game) game.isRunning = true;

    if (!animationFrameId) {
        lastTime = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Global export for debug
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;

// Leaderboard submission integrated into handleGameOver directly (no monkey-patching)
// Submit score to leaderboard on game over
async function submitToLeaderboard(score) {
    const user = window.userProfile;
    // Use first name or username, fallback to 'Player'
    const displayName = user.username || user.firstName || 'Player';

    // Save locally first with user-specific key
    const storageKey = `highScore_${user.id}`;
    const currentMax = parseInt(localStorage.getItem(storageKey) || '0');

    if (score > currentMax) {
        localStorage.setItem(storageKey, score.toString());
        // Also update legacy key for backward compatibility
        localStorage.setItem('uploop_high_score', score.toString());
    }

    try {
        await leaderboard.submitScore(score, displayName, user.id);
        console.log(`Score ${score} submitted for ${displayName}`);
    } catch (e) {
        console.warn('Leaderboard submission failed:', e);
    }
}

console.log('Leaderboard system initialized');
