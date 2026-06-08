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
 * Character Selection UI
 * Carousel navigation with unlock status
 */

import { CHARACTERS, getCharacter } from './characters.js';

let currentCharacterIndex = 0;
let listenersAttached = false;
const characterIds = Object.keys(CHARACTERS);

export function initCharacterSelect() {
    // Find current character index
    const savedChar = window.userProfile?.selectedCharacter || 'jumper';
    currentCharacterIndex = characterIds.indexOf(savedChar);
    if (currentCharacterIndex === -1) currentCharacterIndex = 0;

    updateCharacterDisplay();

    // Attach navigation listeners only once to avoid duplicates
    if (listenersAttached) return;
    listenersAttached = true;

    // Navigation
    document.getElementById('char-prev')?.addEventListener('click', () => {
        currentCharacterIndex = (currentCharacterIndex - 1 + characterIds.length) % characterIds.length;
        updateCharacterDisplay();
        playNavigationSound();
    });

    document.getElementById('char-next')?.addEventListener('click', () => {
        currentCharacterIndex = (currentCharacterIndex + 1) % characterIds.length;
        updateCharacterDisplay();
        playNavigationSound();
    });

    document.getElementById('btn-select-character')?.addEventListener('click', selectCharacter);
    document.getElementById('btn-back-from-chars')?.addEventListener('click', () => {
        if (window.showScreen) window.showScreen('menu-screen');
    });
}

function updateCharacterDisplay() {
    const charId = characterIds[currentCharacterIndex];
    const char = CHARACTERS[charId];
    const isUnlocked = window.userProfile?.unlockedCharacters?.includes(charId) ?? false;

    // Update visual
    const spriteEl = document.getElementById('char-sprite');
    const nameEl = document.getElementById('char-name');
    const abilityEl = document.getElementById('char-ability');

    if (spriteEl) spriteEl.textContent = char.emoji;
    if (nameEl) nameEl.textContent = char.name;
    if (abilityEl) abilityEl.textContent = char.description;

    // Update lock status
    const statusEl = document.getElementById('char-status');
    if (statusEl) {
        if (isUnlocked) {
            statusEl.innerHTML = '<span class="unlocked">✅ UNLOCKED</span>';
        } else {
            statusEl.innerHTML = '<span class="locked">🔒 LOCKED</span>';
        }
    }

    // Update progress for score-based unlocks
    const progressEl = document.getElementById('char-progress');
    if (progressEl) {
        if (!isUnlocked && char.unlockType === 'score') {
            const current = window.userProfile?.totalScore || 0;
            const required = char.unlockValue;
            const percent = Math.min(100, (current / required) * 100);

            progressEl.classList.remove('hidden');
            const labelEl = progressEl.querySelector('.progress-label');
            const fillEl = progressEl.querySelector('.progress-bar-fill');

            if (labelEl) labelEl.textContent = `${current} / ${required} TOTAL SCORE`;
            if (fillEl) fillEl.style.width = `${percent}%`;
        } else if (!isUnlocked) {
            // Other unlock types
            progressEl.classList.remove('hidden');
            const labelEl = progressEl.querySelector('.progress-label');
            if (labelEl) {
                if (char.unlockType === 'daily') {
                    labelEl.textContent = `Complete ${char.unlockValue} Daily Challenges`;
                } else if (char.unlockType === 'achievement') {
                    labelEl.textContent = char.unlockCondition.replace('_', ' ').toUpperCase();
                } else if (char.unlockType === 'secret') {
                    labelEl.textContent = '??? SECRET CONDITION ???';
                }
            }
        } else {
            progressEl.classList.add('hidden');
        }
    }

    // Update carousel indicators
    document.querySelectorAll('.indicator').forEach((ind, i) => {
        ind.classList.toggle('active', i === currentCharacterIndex);
    });

    // Update select button
    const selectBtn = document.getElementById('btn-select-character');
    if (selectBtn) {
        if (!isUnlocked) {
            selectBtn.disabled = true;
            selectBtn.textContent = '🔒 LOCKED';
            selectBtn.classList.add('disabled');
        } else {
            selectBtn.disabled = false;
            selectBtn.textContent = 'SELECT & PLAY ▶';
            selectBtn.classList.remove('disabled');
        }
    }
}

function selectCharacter() {
    const charId = characterIds[currentCharacterIndex];
    const char = CHARACTERS[charId];
    const isUnlocked = window.userProfile?.unlockedCharacters?.includes(charId) ?? false;

    if (!isUnlocked) {
        console.warn('Cannot select locked character');
        return;
    }

    // Save selection
    if (window.userProfile) {
        window.userProfile.selectedCharacter = charId;
    }

    try {
        localStorage.setItem('selectedCharacter', charId);
    } catch (e) {
        console.warn('Failed to save character selection:', e);
    }

    console.log(`✅ Selected character: ${char.name} ${char.emoji}`);

    // Update game if it exists
    if (window.game) {
        window.game.selectedCharacter = char;
    }

    // Play confirmation sound
    if (window.audio && window.audio.playJump) {
        window.audio.playJump();
    }

    // Return to menu
    if (window.showScreen) {
        window.showScreen('menu-screen');
    }
}

function playNavigationSound() {
    // Subtle navigation feedback
    if (window.audio && window.audio.audioContext) {
        try {
            const ctx = window.audio.audioContext;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = 400;
            gain.gain.value = 0.1;

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // Silent fail for audio
        }
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.initCharacterSelect = initCharacterSelect;
}
