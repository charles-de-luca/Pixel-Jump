// Settings and Skins functionality - GENESIS PACK EDITION
import { GENESIS_PACK, checkSkinUnlocks, applySkinEffects, getSkin, getAllSkins } from './genesis-skins.js';

let soundEnabled = true;
let vibrationEnabled = true;
let controlMode = 'tap'; // 'tap', 'tilt', 'hybrid'
let controlSensitivity = 5; // 1-10
let qualityMode = 'high'; // 'high', 'low'
let currentSkin = 'pixel_cube';

let unlockedSkins = ['pixel_cube']; // Default always unlocked
let selectedSkin = 'pixel_cube';

// User stats for unlock tracking
let userStats = {
    highScore: 0,
    totalDeaths: 0,
    scoreStreaks: [],
    beatFriendRecord: false,
    referralCount: 0,
    secretEvents: {}
};

// Initialize settings on load
function initSkins() {
    // ... existing skin load logic ...
    const user = window.userProfile || { id: 'local' };
    const savedSkinsKey = `unlockedSkins_genesis_${user.id}`;
    const selectedSkinKey = `selectedSkin_genesis_${user.id}`;
    const userStatsKey = `userStats_${user.id}`;

    // Load unlocked skins
    if (localStorage.getItem(savedSkinsKey)) {
        try {
            unlockedSkins = JSON.parse(localStorage.getItem(savedSkinsKey));
        } catch (e) {
            unlockedSkins = ['pixel_cube'];
        }
    }

    // Load selected skin
    if (localStorage.getItem(selectedSkinKey)) {
        const saved = localStorage.getItem(selectedSkinKey);
        if (GENESIS_PACK[saved]) {
            selectedSkin = saved;
            currentSkin = saved;
        }
    }

    // Expose for main.js and engine
    window.selectedSkin = selectedSkin;
    window.unlockedSkins = unlockedSkins;
    window.userStats = userStats;

    // Load user stats
    if (localStorage.getItem(userStatsKey)) {
        try {
            userStats = JSON.parse(localStorage.getItem(userStatsKey));
            window.userStats = userStats;
        } catch (e) {
            console.warn('Failed to load user stats');
        }
    }

    loadSettings();
    updateSettingsUI();
    setupSettingsListeners(); // Attach listeners
    renderSkinsList();
}

function loadSettings() {
    // Load Sound
    if (localStorage.getItem('pixelJump_sound') !== null) {
        soundEnabled = localStorage.getItem('pixelJump_sound') === 'true';
    }
    // Load Vibration
    if (localStorage.getItem('pixelJump_vibration') !== null) {
        vibrationEnabled = localStorage.getItem('pixelJump_vibration') === 'true';
    }

    // Load Control Mode (Migration from boolean 'tilt')
    if (localStorage.getItem('pixelJump_controlMode')) {
        controlMode = localStorage.getItem('pixelJump_controlMode');
    } else if (localStorage.getItem('pixelJump_tilt') === 'true') {
        controlMode = 'tilt'; // Migration
    }

    // Load Sensitivity
    if (localStorage.getItem('pixelJump_sensitivity')) {
        controlSensitivity = parseInt(localStorage.getItem('pixelJump_sensitivity'));
    }

    // Load Quality
    if (localStorage.getItem('pixelJump_quality')) {
        qualityMode = localStorage.getItem('pixelJump_quality');
    }

    // Apply global settings
    window.controlMode = controlMode;
    window.controlSensitivity = controlSensitivity;
    window.qualityMode = qualityMode;

    // Apply to audio engine if exists
    if (window.audio) {
        window.audio.setEnabled(soundEnabled);
    }
}

function renderSkinsList() {
    const listContainer = document.getElementById('skins-list');
    if (!listContainer) return;

    // Use grid layout container
    listContainer.className = 'skins-container';
    listContainer.innerHTML = '';

    // Add Preview Panel at top
    const previewPanel = document.createElement('div');
    previewPanel.id = 'skin-preview-panel';
    previewPanel.className = 'skin-preview-panel';
    listContainer.appendChild(previewPanel);

    // Add Grid container
    const grid = document.createElement('div');
    grid.className = 'skins-grid';
    listContainer.appendChild(grid);

    const allSkins = getAllSkins();

    allSkins.forEach(skin => {
        const isUnlocked = unlockedSkins.includes(skin.id);
        const isActive = currentSkin === skin.id;

        const card = document.createElement('div');
        card.className = `skin-card ${isActive ? 'active' : ''} ${isUnlocked ? '' : 'locked'}`;
        card.dataset.skin = skin.id;

        // Lock icon
        if (!isUnlocked) {
            const lock = document.createElement('div');
            lock.className = 'skin-lock-icon';
            lock.textContent = '🔒';
            card.appendChild(lock);
        }

        // Emoji Icon
        const iconSpan = document.createElement('div');
        iconSpan.className = 'skin-icon';
        iconSpan.textContent = skin.emoji;
        card.appendChild(iconSpan);

        // Name
        const nameSpan = document.createElement('div');
        nameSpan.className = 'skin-name';
        nameSpan.textContent = skin.name;
        card.appendChild(nameSpan);

        card.onclick = () => selectSkinInMenu(skin.id);
        grid.appendChild(card);
    });

    // Initialize preview
    updateSkinDetails(selectedSkin || currentSkin);
}

function selectSkinInMenu(skinId) {
    updateSkinDetails(skinId);
    selectedSkin = skinId;

    // Update active state visuals
    document.querySelectorAll('.skin-card').forEach(card => {
        card.classList.toggle('active', card.dataset.skin === skinId);
    });

    if (unlockedSkins.includes(skinId)) {
        currentSkin = skinId;
        window.selectedSkin = skinId; // Update global

        // Save to storage
        const user = window.userProfile || { id: 'local' };
        localStorage.setItem(`selectedSkin_genesis_${user.id}`, skinId);

        // Play select sound
        if (window.audio) window.audio.playJump();
    } else {
        // Play locked sound/haptic
        if (window.triggerHapticFeedback) window.triggerHapticFeedback('error');
    }
}

function updateSkinDetails(skinId) {
    const skin = getSkin(skinId);
    const panel = document.getElementById('skin-preview-panel');
    if (!panel) return;

    const isUnlocked = unlockedSkins.includes(skinId);

    let unlockText = '';
    if (!isUnlocked) {
        const unlock = skin.unlock;
        switch (unlock.type) {
            case 'score': unlockText = `Score ${unlock.value}+`; break;
            case 'streak': unlockText = unlock.description; break;
            case 'deaths': unlockText = `${unlock.value} deaths`; break;
            case 'social': unlockText = unlock.description; break;
            case 'secret': unlockText = '??? SECRET ???'; break;
        }
    }

    panel.innerHTML = `
            <div class="preview-char">${skin.emoji}</div>
            <div class="preview-info">
                <div class="preview-name">${skin.name}</div>
                <div class="preview-desc">${skin.description}</div>
                ${!isUnlocked ? `<div class="preview-unlock">🔓 Unlock: ${unlockText}</div>` : '<div class="preview-unlock" style="color:#0f0">✅ EQUIPPED</div>'}
            </div>
        `;

    // Update styling based on lock state
    panel.style.borderTopColor = isUnlocked ? '#0f0' : '#f00';
}

function applySkin(skinId) {
    const skin = getSkin(skinId);
    if (!unlockedSkins.includes(skinId)) {
        console.warn('Cannot apply locked skin');
        return;
    }

    selectedSkin = skinId;
    currentSkin = skinId;

    // Save to localStorage
    const user = window.userProfile || { id: 'local' };
    const selectedSkinKey = `selectedSkin_genesis_${user.id}`;
    localStorage.setItem(selectedSkinKey, skinId);

    // Apply to game if it exists
    if (window.game) {
        applySkinEffects(window.game, skinId);
    }

    console.log(`✅ Applied skin: ${skin.name} ${skin.emoji}`);

    // Cloud sync
    if (window.cloudSync) window.cloudSync.saveProgress();
}

// Check for new unlocks after game over
window.checkUnlockedSkins = function (score) {
    // Update stats
    userStats.highScore = Math.max(userStats.highScore, score);
    userStats.totalDeaths = (userStats.totalDeaths || 0) + 1;

    // Track score streaks
    if (!userStats.scoreStreaks) userStats.scoreStreaks = [];
    userStats.scoreStreaks.push(score);
    if (userStats.scoreStreaks.length > 10) {
        userStats.scoreStreaks = userStats.scoreStreaks.slice(-10); // Keep last 10
    }

    // Save stats
    const user = window.userProfile || { id: 'local' };
    const userStatsKey = `userStats_${user.id}`;
    localStorage.setItem(userStatsKey, JSON.stringify(userStats));

    // Check unlocks
    const newUnlocks = checkSkinUnlocks(userStats);
    const previouslyUnlocked = unlockedSkins.length;

    newUnlocks.forEach(skinId => {
        if (!unlockedSkins.includes(skinId)) {
            unlockedSkins.push(skinId);
            const skin = getSkin(skinId);
            console.log(`🎨 SKIN UNLOCKED: ${skin.name} ${skin.emoji}`);
            // TODO: Show unlock notification
        }
    });

    // Save unlocked skins
    if (unlockedSkins.length > previouslyUnlocked) {
        const savedSkinsKey = `unlockedSkins_genesis_${user.id}`;
        localStorage.setItem(savedSkinsKey, JSON.stringify(unlockedSkins));

        // Cloud sync
        if (window.cloudSync) window.cloudSync.saveProgress();
    }
};

// Settings functions
function updateSettingsUI() {
    // Sound toggle
    const soundToggle = document.getElementById('toggle-sound');
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? 'ON' : 'OFF';
        soundToggle.classList.toggle('active', soundEnabled);
    }

    // Vibration toggle
    const vibToggle = document.getElementById('toggle-vibration');
    if (vibToggle) {
        vibToggle.textContent = vibrationEnabled ? 'ON' : 'OFF';
        vibToggle.classList.toggle('active', vibrationEnabled);
    }

    // Control Mode Toggles
    const modes = ['tap', 'tilt', 'hybrid'];
    modes.forEach(mode => {
        const btn = document.getElementById(`mode-${mode}`);
        if (btn) {
            btn.classList.toggle('active', controlMode === mode);
        }
    });

    // Sensitivity Slider
    const slider = document.getElementById('sensitivity-slider');
    const label = document.getElementById('sens-value');
    if (slider && label) {
        slider.value = controlSensitivity;
        label.textContent = controlSensitivity;
    }

    // Quality toggle
    const qualityToggle = document.getElementById('toggle-quality');
    if (qualityToggle) {
        qualityToggle.textContent = qualityMode === 'high' ? 'HIGH' : 'LOW';
        qualityToggle.classList.toggle('active', qualityMode === 'high');
    }
}

// Initialize settings listeners
export function setupSettingsListeners() {
    const soundToggle = document.getElementById('toggle-sound');
    if (soundToggle) {
        soundToggle.onclick = () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('pixelJump_sound', soundEnabled);

            // Apply immediately
            if (window.audio) {
                window.audio.setEnabled(soundEnabled);
            }

            updateSettingsUI();
            if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
            if (window.cloudSync) window.cloudSync.saveProgress();
        };
    }

    const vibToggle = document.getElementById('toggle-vibration');
    if (vibToggle) {
        vibToggle.onclick = () => {
            vibrationEnabled = !vibrationEnabled;
            localStorage.setItem('pixelJump_vibration', vibrationEnabled);
            updateSettingsUI();
            if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
            if (window.cloudSync) window.cloudSync.saveProgress();
        };
    }

    // Control Mode Listeners
    ['tap', 'tilt', 'hybrid'].forEach(mode => {
        const btn = document.getElementById(`mode-${mode}`);
        if (btn) {
            btn.onclick = () => {
                controlMode = mode;
                localStorage.setItem('pixelJump_controlMode', mode);
                window.controlMode = mode; // Update global
                updateSettingsUI();
                if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
            };
        }
    });

    // Sensitivity Listener
    const slider = document.getElementById('sensitivity-slider');
    if (slider) {
        slider.oninput = (e) => {
            controlSensitivity = parseInt(e.target.value);
            document.getElementById('sens-value').textContent = controlSensitivity;

            // Save & Apply
            localStorage.setItem('pixelJump_sensitivity', controlSensitivity);
            window.controlSensitivity = controlSensitivity;
        };
    }

    // Quality Toggle
    const qualityToggle = document.getElementById('toggle-quality');
    if (qualityToggle) {
        qualityToggle.onclick = () => {
            qualityMode = qualityMode === 'high' ? 'low' : 'high';
            localStorage.setItem('pixelJump_quality', qualityMode);
            window.qualityMode = qualityMode;
            updateSettingsUI();
            if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
        };
    }

    // Back button (Settings)
    const backBtn = document.getElementById('btn-back-settings');
    if (backBtn) {
        backBtn.onclick = () => {
            if (window.showScreen) window.showScreen('menu-screen');
            if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
        };
    }

    // Back button (Skins) - FIX: Was missing listener
    const backBtnSkins = document.getElementById('btn-back-skins');
    if (backBtnSkins) {
        backBtnSkins.onclick = () => {
            if (window.showScreen) window.showScreen('menu-screen');
            if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
        };
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkins);
} else {
    initSkins();
}

// Ensure global functions are definitely attached
window.initSkins = initSkins;
window.applySkin = applySkin;
window.updateSettingsUI = updateSettingsUI;
window.selectedSkin = selectedSkin;
window.selectSkinInMenu = selectSkinInMenu; // EXPLICIT EXPORT
