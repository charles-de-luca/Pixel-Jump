/**
 * PIXEL JUMP - Challenge System
 * Handles Duel Mode sharing and deep linking
 */

import { db, auth } from './firebase-config.js';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class ChallengeSystem {
    constructor() {
        this.activeChallenge = null;
    }

    /**
     * Creates a new challenge in Firestore
     * @param {number} score - The score to beat
     * @param {string} skin - Current skin ID
     * @returns {Promise<string>} - The Challenge ID
     */
    async createChallenge(score, skin) {
        if (!db || !auth.currentUser) {
            console.warn('Cannot create challenge: No DB or User');
            return null;
        }

        try {
            const user = window.userProfile || { username: 'Player', id: auth.currentUser.uid };

            const challengeData = {
                creatorId: auth.currentUser.uid,
                creatorName: user.username || 'Anonymous',
                scoreToBeat: score,
                skin: skin || 'default',
                createdAt: serverTimestamp(),
                status: 'active'
            };

            const docRef = await addDoc(collection(db, 'challenges'), challengeData);
            console.log('Challenge created with ID:', docRef.id);
            return docRef.id;
        } catch (e) {
            console.error('Error creating challenge:', e);
            return null;
        }
    }

    /**
     * Fetch challenge details
     * @param {string} challengeId 
     */
    async getChallenge(challengeId) {
        if (!db) return null;

        try {
            const docRef = doc(db, 'challenges', challengeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                console.warn('Challenge not found');
                return null;
            }
        } catch (e) {
            console.error('Error fetching challenge:', e);
            return null;
        }
    }

    /**
     * Generate the deep link for sharing
     * @param {string} challengeId 
     * @param {number} score 
     */
    generateShareUrl(challengeId, score) {
        const botUsername = 'pixel_jump_bot'; // Replace with actual bot username if known, or use t.me/share
        const appUrl = `https://t.me/${botUsername}?start=challenge_${challengeId}`;

        // Fallback for web-only testing if not on Telegram
        const webUrl = `${window.location.origin}?start_param=challenge_${challengeId}`;

        return {
            telegram: `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(`⚔️ I scored ${score}! Can you beat me?`)}`,
            web: webUrl
        };
    }
}

// Global instance
export const challengeSystem = new ChallengeSystem();
window.challengeSystem = challengeSystem;
