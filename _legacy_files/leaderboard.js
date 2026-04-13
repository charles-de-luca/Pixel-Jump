/**
 * PIXEL JUMP — Leaderboard System
 * Firebase Firestore + local fallback
 */

import { db, auth } from './firebase-config.js';
import { collection, doc, setDoc, getDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const LOCAL_KEY = 'pixelJump_localLeaderboard';

export class Leaderboard {
    constructor() {
        this.leaderboardData = [];
    }

    async submitScore(score, username, userId) {
        // Always save locally
        this._saveLocal(score, username, userId);

        if (!db) {
            console.warn('Firestore not available, saved locally');
            return true;
        }

        try {
            const finalUserId = userId || auth?.currentUser?.uid || 'anonymous';
            const scoreDocRef = doc(db, 'leaderboard', finalUserId);

            const docSnap = await getDoc(scoreDocRef);
            if (docSnap.exists()) {
                const existing = docSnap.data();
                if (existing.score >= score) {
                    return true; // Existing score is higher
                }
            }

            await setDoc(scoreDocRef, {
                userId: finalUserId,
                username: username || 'Player',
                score: score,
                photoUrl: window.userProfile?.photoUrl || null,
                timestamp: Date.now(),
                date: new Date().toISOString()
            });

            console.log('Score submitted to leaderboard');
            return true;
        } catch (error) {
            console.error('Error submitting score:', error);
            return false;
        }
    }

    async getTopScores(limitCount = 100) {
        // Always try local first as fallback base
        const localScores = this._getLocal(limitCount);

        if (!db) {
            console.warn('Firestore not available, returning local leaderboard');
            return localScores;
        }

        try {
            const leaderboardRef = collection(db, 'leaderboard');
            const q = query(
                leaderboardRef,
                orderBy('score', 'desc'),
                limit(limitCount * 3)
            );

            const querySnapshot = await getDocs(q);
            const scores = [];
            const seenUsers = new Set();

            querySnapshot.forEach((docItem) => {
                const data = docItem.data();
                const uniqueKey = docItem.id;

                if (uniqueKey && !seenUsers.has(uniqueKey)) {
                    seenUsers.add(uniqueKey);
                    scores.push({
                        id: docItem.id,
                        ...data
                    });
                }
            });

            const finalScores = scores.slice(0, limitCount);
            this.leaderboardData = finalScores;

            // Cache for offline use
            try {
                localStorage.setItem('pixelJump_leaderboardCache', JSON.stringify(finalScores));
            } catch (e) { /* ignore */ }

            return finalScores;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            // Try cache
            try {
                const cached = localStorage.getItem('pixelJump_leaderboardCache');
                if (cached) return JSON.parse(cached);
            } catch (e) { /* ignore */ }
            return localScores;
        }
    }

    async getUserRank(userId) {
        if (!db) return null;

        try {
            const allScores = await this.getTopScores(100);
            const idx = allScores.findIndex(s => s.userId === userId);
            if (idx === -1) return null;
            return { rank: idx + 1, score: allScores[idx].score };
        } catch (error) {
            console.error('Error getting user rank:', error);
            return null;
        }
    }

    // --- Local storage fallback ---
    _saveLocal(score, username, userId) {
        try {
            const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            const existing = data.findIndex(e => e.userId === userId);
            if (existing >= 0) {
                if (data[existing].score < score) {
                    data[existing].score = score;
                    data[existing].username = username;
                    data[existing].timestamp = Date.now();
                }
            } else {
                data.push({ userId, username, score, timestamp: Date.now() });
            }
            data.sort((a, b) => b.score - a.score);
            localStorage.setItem(LOCAL_KEY, JSON.stringify(data.slice(0, 100)));
        } catch (e) { /* ignore */ }
    }

    _getLocal(limitCount) {
        try {
            const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            return data.slice(0, limitCount);
        } catch (e) {
            return [];
        }
    }
}

// Leaderboard UI
export function showLeaderboard(leaderboard) {
    const screen = document.getElementById('leaderboard-screen');
    if (!screen) return;

    const container = screen.querySelector('.leaderboard-list');
    if (!container) return;

    container.innerHTML = '';

    if (leaderboard.length === 0) {
        const t = window.currentLang === 'ru' ? 'Пока нет результатов. Будьте первым!' : 'No scores yet. Be the first!';
        container.innerHTML = `<div class="no-scores">${t}</div>`;
        return;
    }

    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';

        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        const avatarUrl = entry.photoUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.username || 'User')}&background=8B00FF&color=fff&size=64&bold=true`;

        // Highlight current user
        const isMe = entry.userId === window.userProfile?.id;

        item.innerHTML = `
            <span class="rank">${medal}</span>
            <div class="avatar-container">
                <img src="${avatarUrl}" alt="${entry.username}" class="leaderboard-avatar" onerror="this.style.display='none'">
            </div>
            <span class="username">${isMe ? '► ' : ''}${entry.username}</span>
            <span class="score">${String(entry.score).padStart(5, '0')}</span>
        `;
        if (isMe) item.style.background = 'rgba(0,255,65,0.06)';

        container.appendChild(item);
    });
}
