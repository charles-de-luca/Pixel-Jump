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
 * PIXEL JUMP - Daily Challenge System
 */
import { triggerHapticFeedback } from './telegram.js';

export class DailyChallenge {
    constructor() {
        this.challenges = [
            { id: 1, type: 'score', target: 500, description: "Score 500 points", reward: 'XP' },
            { id: 2, type: 'score', target: 1000, description: "Score 1000 points", reward: 'XP' },
            { id: 3, type: 'combo', target: 5, description: "Get a 5x Combo", reward: 'XP' },
            { id: 4, type: 'jumps', target: 50, description: "Jump 50 times", reward: 'XP' }
        ];

        this.currentChallenge = null;
        this.completed = false;

        this.init();
    }

    init() {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const savedDate = localStorage.getItem('dailyChallengeDate');

        if (savedDate !== today) {
            // New day, new challenge
            this.generateChallenge(today);
        } else {
            // Load saved challenge
            this.currentChallenge = JSON.parse(localStorage.getItem('dailyChallenge'));
            this.completed = localStorage.getItem('dailyChallengeCompleted') === 'true';
        }

        this.updateUI();
    }

    generateChallenge(dateString) {
        // Simple pseudo-random using date string
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
            hash |= 0;
        }

        const index = Math.abs(hash) % this.challenges.length;
        this.currentChallenge = this.challenges[index];
        this.completed = false;

        localStorage.setItem('dailyChallengeDate', dateString);
        localStorage.setItem('dailyChallenge', JSON.stringify(this.currentChallenge));
        localStorage.setItem('dailyChallengeCompleted', 'false');
    }

    checkProgress(gameStats) {
        if (this.completed || !this.currentChallenge) return;

        let challengeMet = false;

        switch (this.currentChallenge.type) {
            case 'score':
                if (gameStats.score >= this.currentChallenge.target) challengeMet = true;
                break;
            case 'combo':
                if (gameStats.maxCombo >= this.currentChallenge.target) challengeMet = true;
                break;
            case 'jumps':
                if (gameStats.jumps >= this.currentChallenge.target) challengeMet = true;
                break;
        }

        if (challengeMet) {
            this.completeChallenge();
        }
    }

    completeChallenge() {
        this.completed = true;
        localStorage.setItem('dailyChallengeCompleted', 'true');

        // Show notification
        const notification = document.getElementById('daily-notification');
        if (notification) {
            notification.textContent = `Daily Challenge Complete!`;
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 3000);
        }

        triggerHapticFeedback('success');
        this.updateUI();
    }

    updateUI() {
        const titleEl = document.getElementById('daily-title');
        const descEl = document.getElementById('daily-desc');
        const statusEl = document.getElementById('daily-status');

        if (titleEl && this.currentChallenge) {
            descEl.textContent = this.currentChallenge.description;

            if (this.completed) {
                statusEl.textContent = "✅ COMPLETED";
                statusEl.className = "daily-status completed";
            } else {
                statusEl.textContent = "🎯 IN PROGRESS";
                statusEl.className = "daily-status";
            }
        }
    }
}

// Initialize
window.dailyChallenge = new DailyChallenge();
