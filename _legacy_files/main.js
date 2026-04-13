/**
 * PIXEL JUMP - Main Game Entry Point
 * 8-bit Pixel Art Telegram Mini Game
 */

// Import game engine
import { PixelJumpGame } from './engine.v3.js';

// Import audio system
import { PixelAudio } from './audio.js';

// Import leaderboard
import { Leaderboard, showLeaderboard } from './leaderboard.js';

// Import Telegram integration
import { initTelegram, saveHighScore, getHighScore, sendGameEvent, triggerHapticFeedback, updateMainButton, hideMainButton, applyTheme } from './telegram.js';

// Import Firebase
import { initFirebase } from './firebase-config.js';

// Initialize Telegram
const tg = initTelegram();
if (tg) {
    tg.ready();
    // applyTheme(); // Disabled to restore original neon look
}

// DEBUG CONSOLE INTERCEPTOR
(function () {
    const debugDiv = document.getElementById('debug-console');
    if (!debugDiv) return;

    function logToScreen(msg, color = '#0f0') {
        const line = document.createElement('div');
        line.style.color = color;
        line.innerText = `> ${msg}`;
        debugDiv.appendChild(line);
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = function (...args) {
        originalLog.apply(console, args);
        try {
            logToScreen(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        } catch (e) { }
    };

    console.warn = function (...args) {
        originalWarn.apply(console, args);
        logToScreen(args.join(' '), '#ff0');
    };

    console.error = function (...args) {
        originalError.apply(console, args);
        logToScreen(args.join(' '), '#f00');
    };

    window.onerror = function (msg, url, line, col, error) {
        logToScreen(`ERROR: ${msg} (${line}:${col})`, '#f00');
        return false;
    };
})();

let userProfile = {
    id: 'local_user',
    username: 'Player',
    firstName: 'Player',
    isPremium: false
};

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
        // Re-init in case it wasn't ready
        const tgRetry = window.Telegram?.WebApp;
        if (tgRetry && tgRetry.initDataUnsafe && tgRetry.initDataUnsafe.user) {
            const u = tgRetry.initDataUnsafe.user;
            window.userProfile = {
                id: u.id ? u.id.toString() : 'local_id',
                username: u.username || u.first_name || 'Player',
                firstName: u.first_name || 'Player',
                isPremium: u.is_premium || false,
                photoUrl: u.photo_url
            };
            console.log('Auth Success:', window.userProfile.username);
            updateDebugInfo(`Auth: OK (${window.userProfile.username})`);

            // Hide retry button if visible
            const btn = document.getElementById('btn-manual-login');
            if (btn) btn.classList.add('hidden');

            return true;
        } else {
            // Show retry button
            const btn = document.getElementById('btn-manual-login');
            if (btn) {
                btn.classList.remove('hidden');
                updateDebugInfo('Auth: Failed. Tap Retry.');
            } else {
                updateDebugInfo('Auth: None');
            }
            return false;
        }
    } catch (e) {
        console.warn('Auth Error:', e);
        updateDebugInfo('Auth: Error', e.message);
        return false;
    }
}

// Initial Attempt
attemptAuth();

// Retry Handler
document.getElementById('btn-manual-login')?.addEventListener('click', () => {
    updateDebugInfo('Retrying Auth...');
    setTimeout(() => {
        if (attemptAuth()) {
            // If successful, maybe reload or continue init
            console.log('Manual auth successful');
        }
    }, 500);
});
window.userProfile = userProfile; // Export globally

// Initialize Firebase (non-blocking)
let firebaseInitialized = false;
const firebaseInitPromise = initFirebase()
    .then((user) => {
        if (user) {
            firebaseInitialized = true;
            console.log('Firebase initialized successfully');
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

    // Limit scale to prevent excessive blurriness on high DPI displays
    const maxScale = Math.min(3, scale); // Maximum 3x scaling to maintain pixel clarity
    scale = Math.min(scale, maxScale);

    // Apply scale via CSS transform to ensure crisp pixels
    // We center it using standard CSS in style.css, but we set dimensions here
    canvas.style.width = `${360 * scale}px`;
    canvas.style.height = `${640 * scale}px`;

    // Ensure canvas remains centered
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';

    // Update container if needed (usually flex centers it)
    console.log(`Resized: Scale ${scale.toFixed(2)}, Window ${windowWidth}x${windowHeight}`);
}

// Listen for resize and Telegram viewport changes
window.addEventListener('resize', resizeGame);
if (tg) {
    tg.onEvent('viewportChanged', resizeGame);
    tg.expand(); // Force expand again
}

// Initial Resize
resizeGame();

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

// Load high score
getHighScore().then(savedHighScore => {
    highScore = savedHighScore;
    updateHighScoreDisplay(highScore);
});



// UI Helper Functions
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show target screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }

    currentScreen = screenId.replace('-screen', '');
}
window.showScreen = showScreen; // Export for settings-skins.js

function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('current-score');
    if (scoreElement) {
        scoreElement.textContent = String(score).padStart(5, '0');
    }
}

function updateHighScoreDisplay(highScore) {
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        highScoreElement.textContent = String(highScore).padStart(5, '0');
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
    console.log('Initializing PIXEL JUMP...');

    try {
        // Create game instance - with error handling
        game = new PixelJumpGame(canvas, ctx, audio);
        window.game = game; // Export for settings-skins.js

        // Show loading screen and simulate loading
        const loadingElement = document.getElementById('loading-screen');
        const progressFill = loadingElement.querySelector('.progress-fill');

        // Animate loading
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (progressFill) {
                progressFill.style.width = `${i}%`;
            }
        }

        // Hide loading, show menu
        setTimeout(() => {
            showScreen('menu-screen');
            console.log('Game ready!');
        }, 500);
    } catch (error) {
        console.error('Failed to initialize game:', error);
        console.error('Error stack:', error.stack);
        // Show error screen if initialization fails
        document.getElementById('loading-screen')?.classList.add('hidden');
        showScreen('menu-screen'); // Go to menu as fallback
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
async function startGame() {
    console.log('Starting game...');

    // Initialize audio on first interaction (SAFE MODE)
    try {
        if (audio) {
            // Check if context exists but suspended
            if (audio.audioContext && audio.audioContext.state === 'suspended') {
                console.log('⏸ Audio context suspended, resuming...');
                await audio.audioContext.resume().catch(e => console.warn('Resume failed:', e));
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

    // Hide menu, show HUD
    showScreen('playing'); // No screen overlay during play
    document.getElementById('game-hud').classList.remove('hidden');

    // Start game
    if (typeof game.start === 'function') {
        game.start();
    } else if (typeof game.init === 'function') {
        game.init();
    } else {
        console.error('❌ No start/init method found on game instance');
    }

    score = 0;
    updateScoreDisplay(0);
    updateComboDisplay(0);

    sendGameEvent('game_start');
    triggerHapticFeedback('medium');

    // Start game loop
    if (!animationFrameId) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function handleGameOver() {
    console.log('Game Over! Score:', game.score);

    // Play game over sound
    if (typeof audio.playGameOver === 'function') {
        audio.playGameOver();
    }

    // Stop game
    if (typeof game.stop === 'function') {
        game.stop();
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Hide HUD
    const hudElement = document.getElementById('game-hud');
    if (hudElement) {
        hudElement.classList.add('hidden');
    }

    // Update scores
    score = game.score || 0; // Ensure score is a number
    const isNewRecord = score > (highScore || 0);
    if (isNewRecord) {
        highScore = score;
        saveHighScore(highScore);
        updateHighScoreDisplay(highScore);
        if (typeof audio.playNewRecord === 'function') {
            audio.playNewRecord();
        }
    }

    // Check for skin unlocks
    if (window.checkUnlockedSkins && typeof window.checkUnlockedSkins === 'function') {
        window.checkUnlockedSkins(score);
    }

    // Check Daily Challenge
    if (window.dailyChallenge && typeof window.dailyChallenge.checkProgress === 'function') {
        window.dailyChallenge.checkProgress({
            score: score,
            maxCombo: game.maxCombo || 0, // Use game's maxCombo if available
            jumps: game.jumps || Math.floor(score / 5) // Use game's jump counter if available
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
}

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
    showScreen('playing');
    triggerHapticFeedback('light');

    // Make sure game is not running already
    if (game && typeof game.isRunning !== 'undefined') {
        game.isRunning = true;
    }

    // Restore animation loop
    if (!animationFrameId) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function restartGame() {
    showScreen('playing');
    startGame();
}

function returnToMenu() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    game.stop();
    document.getElementById('game-hud').classList.add('hidden');
    showScreen('menu-screen');
    triggerHapticFeedback('light');
}

function shareScore() {
    const message = `I scored ${score} in Pixel Jump! Can you beat me?`;

    if (tg && tg.shareMessage) {
        tg.shareMessage(message);
    } else if (navigator.share) {
        navigator.share({
            title: 'Pixel Jump Score',
            text: message
        }).catch(err => console.log('Share failed:', err));
    } else {
        navigator.clipboard.writeText(message)
            .then(() => alert('Score copied to clipboard!'))
            .catch(err => console.log('Copy failed:', err));
    }
}

// Button Event Listeners
document.getElementById('btn-start').addEventListener('click', startGame);
// btn-leaderboard handler is defined below (line ~691)
document.getElementById('btn-skins')?.addEventListener('click', () => {
    showScreen('skins-screen');
});
document.getElementById('btn-settings')?.addEventListener('click', () => {
    showScreen('settings-screen');
});

document.getElementById('btn-resume').addEventListener('click', resumeGame);
document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-menu').addEventListener('click', returnToMenu);

document.getElementById('btn-play-again').addEventListener('click', () => {
    showScreen('playing');
    startGame();
});
document.getElementById('btn-share').addEventListener('click', shareScore);
document.getElementById('btn-menu-go').addEventListener('click', returnToMenu);

// Global Error Handler for Mobile Debugging
window.onerror = function (msg, url, line, col, error) {
    console.error(`Global Error: ${msg} at ${line}:${col}`);
    return false;
};

// Input Handling
function setupInputs() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (!game || !game.isRunning) {
            if (e.key === ' ' || e.key === 'Enter') {
                // allow starting via keyboard if stuck
                const startBtn = document.getElementById('btn-start');
                if (startBtn && !startBtn.parentElement.classList.contains('hidden')) startBtn.click();
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'a') {
            if (game && typeof game.setInput === 'function') game.setInput(true, game.rightPressed);
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            if (game && typeof game.setInput === 'function') game.setInput(game.leftPressed, true);
        }
        if (e.key === 'Escape') pauseGame();
    });

    document.addEventListener('keyup', (e) => {
        if (!game) return;
        if (typeof game.setInput !== 'function') return;

        if (e.key === 'ArrowLeft' || e.key === 'a') game.setInput(false, game.rightPressed);
        if (e.key === 'ArrowRight' || e.key === 'd') game.setInput(game.leftPressed, false);
    });

    // Touch Controls (Improved for mobile compatibility)
    const handleTouch = (e) => {
        // Check if the touch is on UI elements to avoid interfering with them
        const target = e.target;
        const isUI = target.tagName === 'BUTTON' || target.closest('button') || target.closest('.pixel-button') || target.closest('.setting-item');

        // If touching UI, do NOT prevent default (let click happen)
        if (isUI) return;

        // If game is running, prevent default to stop scrolling/zooming
        if (game && game.isRunning) {
            if (e.cancelable) e.preventDefault();
        } else {
            // If not in game, and not UI, maybe prevent scrolling?
            if (target.tagName === 'CANVAS' && e.cancelable) e.preventDefault();
        }

        if (!game || !game.isRunning) return;
        if (typeof game.setInput !== 'function') return;

        const touch = e.touches[0];
        // If no touches (touchend), default to 0 or handle logic
        if (!touch) return;

        const x = touch.clientX;
        const width = window.innerWidth;

        if (x < width / 2) {
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
        // Check if touching UI elements
        const target = e.target;
        const isUI = target.tagName === 'BUTTON' || target.closest('button');
        if (isUI) return; // Let clicks happen

        if (e.cancelable) e.preventDefault();
        if (game && typeof game.setInput === 'function') game.setInput(false, false);
    };

    // Attach to window but filter
    window.addEventListener('touchstart', handleTouch, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Touchmove: valid only for game
    window.addEventListener('touchmove', (e) => {
        if (game && game.isRunning) {
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });
}

// Call setupInputs
setupInputs();

// Accelerometer support (optional)
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
        if (currentScreen === 'playing' && e.gamma !== null) {
            // Normalize gamma (-90 to 90) to (-1 to 1)
            const tiltX = Math.max(-1, Math.min(1, e.gamma / 45));
            game.setTilt(tiltX);
        }
    });
}

// Start the game
window.addEventListener('load', () => {
    console.log('PIXEL JUMP loaded');
    initGame();
});

// Export for debugging
window.gameDebug = {
    game,
    showScreen,
    startGame,
    score: () => game.score
};

console.log('PIXEL JUMP main.js loaded');

// Leaderboard button handlers
document.getElementById('btn-leaderboard')?.addEventListener('click', async () => {
    showScreen('leaderboard-screen');
    triggerHapticFeedback('light');

    // Load leaderboard data
    const scores = await leaderboard.getTopScores(10);
    showLeaderboard(scores);
});

document.getElementById('btn-back-leaderboard')?.addEventListener('click', () => {
    showScreen('menu-screen');
    triggerHapticFeedback('light');
});

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

// Update handleGameOver to submit score
const originalHandleGameOver = handleGameOver;
handleGameOver = function () {
    originalHandleGameOver();

    // Submit to leaderboard if score is decent
    if (game.score > 10) {
        submitToLeaderboard(game.score);
    }
};

console.log('Leaderboard system initialized');
