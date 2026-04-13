// Settings and Skins functionality
let soundEnabled = true;
let vibrationEnabled = true;
let tiltEnabled = false;
let currentSkin = 'green';

const skinColors = {
    green: '#00FF00',
    blue: '#0000FF',
    red: '#FF0000',
    yellow: '#FFFF00',
    purple: '#8B00FF',
    rainbow: '#FF00FF'
};

// Load settings from localStorage
function loadSettings() {
    soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    tiltEnabled = localStorage.getItem('tiltEnabled') === 'true';
    currentSkin = localStorage.getItem('currentSkin') || 'green';

    updateSettingsUI();
    updateSettingsUI();
    initSkins();
    // We don't apply skin to game player here as game might not be ready
    // It will be picked up when game starts using currentSkin variable
}

function saveSettings() {
    localStorage.setItem('soundEnabled', soundEnabled);
    localStorage.setItem('vibrationEnabled', vibrationEnabled);
    localStorage.setItem('tiltEnabled', tiltEnabled);
    localStorage.setItem('currentSkin', currentSkin);
}

function updateSettingsUI() {
    const soundToggle = document.getElementById('toggle-sound');
    const vibrationToggle = document.getElementById('toggle-vibration');
    const tiltToggle = document.getElementById('toggle-tilt');

    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? 'ON' : 'OFF';
        soundToggle.classList.toggle('off', !soundEnabled);
    }

    if (vibrationToggle) {
        vibrationToggle.textContent = vibrationEnabled ? 'ON' : 'OFF';
        vibrationToggle.classList.toggle('off', !vibrationEnabled);
    }

    if (tiltToggle) {
        tiltToggle.textContent = tiltEnabled ? 'ON' : 'OFF';
        tiltToggle.classList.toggle('off', !tiltEnabled);
    }

    // Apply settings
    if (window.audio) {
        window.audio.setEnabled(soundEnabled);
    }
}

const skinUnlockConditions = {
    green: 0,
    blue: 0,
    red: 0,
    yellow: 500,
    purple: 1000,
    rainbow: 2000
};

let unlockedSkins = ['green', 'blue', 'red'];
let selectedSkin = 'green';

// Initialize skins on load
function initSkins() {
    const user = window.userProfile || { id: 'local' };
    const savedSkinsKey = `unlockedSkins_${user.id}`;
    const selectedSkinKey = `selectedSkin_${user.id}`;

    if (localStorage.getItem(savedSkinsKey)) {
        unlockedSkins = JSON.parse(localStorage.getItem(savedSkinsKey));
    }

    if (localStorage.getItem(selectedSkinKey)) {
        currentSkin = localStorage.getItem(selectedSkinKey);
    }

    updateSettingsUI();
    updateSkinsUI();
}

function checkUnlockedSkins(score) {
    const user = window.userProfile || { id: 'local' };
    const savedSkinsKey = `unlockedSkins_${user.id}`;
    let newUnlock = false;
    let unlockedSkinName = '';

    for (const [skinId, minScore] of Object.entries(skinUnlockConditions)) {
        if (score >= minScore && !unlockedSkins.includes(skinId)) {
            unlockedSkins.push(skinId);
            newUnlock = true;
            unlockedSkinName = skinId;
        }
    }

    if (newUnlock) {
        localStorage.setItem(savedSkinsKey, JSON.stringify(unlockedSkins));
        updateSkinsUI();

        // Show notification if element exists
        const notif = document.getElementById('notification-popup');
        if (notif) {
            const notifMsg = document.getElementById('notif-message');
            if (notifMsg) notifMsg.textContent = `New Skin: ${unlockedSkinName.toUpperCase()}!`;
            notif.classList.add('visible');
            setTimeout(() => notif.classList.remove('visible'), 3000);
        }

        if (window.triggerHapticFeedback) window.triggerHapticFeedback('success');
    }
}

function updateSkinsUI() {
    document.querySelectorAll('.skin-item').forEach(item => {
        const skinName = item.dataset.skin;

        // Update locking status
        if (unlockedSkins.includes(skinName)) {
            item.classList.remove('locked');
            const lockEl = item.querySelector('.skin-lock');
            if (lockEl) lockEl.style.display = 'none';
        } else {
            item.classList.add('locked');
            const lockEl = item.querySelector('.skin-lock');
            if (lockEl) {
                lockEl.style.display = 'block';
                lockEl.textContent = `🔒 ${skinUnlockConditions[skinName]}`;
            }
        }

        // Update active status
        item.classList.remove('active');
        if (skinName === currentSkin) {
            item.classList.add('active');
        }
    });
}

function applySkin(skinName) {
    if (!unlockedSkins.includes(skinName)) {
        if (window.triggerHapticFeedback) window.triggerHapticFeedback('error');
        return false;
    }

    currentSkin = skinName;
    const user = window.userProfile || { id: 'local' };
    localStorage.setItem(`selectedSkin_${user.id}`, skinName);

    // Update player color directly
    if (window.game && window.game.player) {
        window.game.player.color = skinColors[skinName] || skinColors.green;
    }

    updateSkinsUI();
    saveSettings(); // Ensure other settings saved too
    return true;
}

// Export for use in main.js
window.checkUnlockedSkins = checkUnlockedSkins;


const triggerHapticFeedback = window.triggerHapticFeedback || (() => { });

// Settings event listeners
document.getElementById('btn-settings')?.addEventListener('click', () => {
    if (window.showScreen) {
        window.showScreen('settings-screen');
    }
    triggerHapticFeedback('light');
});

document.getElementById('toggle-sound')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSettingsUI();
    saveSettings();
    triggerHapticFeedback('light');
});

document.getElementById('toggle-vibration')?.addEventListener('click', () => {
    vibrationEnabled = !vibrationEnabled;
    updateSettingsUI();
    saveSettings();
    triggerHapticFeedback('light');
});

document.getElementById('toggle-tilt')?.addEventListener('click', () => {
    tiltEnabled = !tiltEnabled;
    updateSettingsUI();
    saveSettings();
    triggerHapticFeedback('light');
});

document.getElementById('btn-back-settings')?.addEventListener('click', () => {
    if (window.showScreen) window.showScreen('menu-screen');
    triggerHapticFeedback('light');
});

// Skins event listeners
document.getElementById('btn-skins')?.addEventListener('click', () => {
    if (window.showScreen) window.showScreen('skins-screen');
    triggerHapticFeedback('light');
});

document.querySelectorAll('.skin-item').forEach(item => {
    item.addEventListener('click', () => {
        const skinName = item.dataset.skin;
        if (applySkin(skinName)) {
            triggerHapticFeedback('medium');
        } else {
            triggerHapticFeedback('error');
        }
    });
});


document.getElementById('btn-back-skins')?.addEventListener('click', () => {
    if (window.showScreen) window.showScreen('menu-screen');
    triggerHapticFeedback('light');
});

// Initialize settings on load
loadSettings();
