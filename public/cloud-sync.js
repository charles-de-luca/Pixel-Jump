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
 * PIXEL JUMP — Cloud Sync Module
 * Saves/loads player progress to Firebase Firestore for cross-device sync.
 * Uses Firebase Auth UID as the document key for secure per-user isolation.
 */

import { db, auth } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const SYNC_DEBOUNCE_MS = 5000; // Min 5s between writes

export class CloudSync {
    constructor() {
        this._saveTimer = null;
        this._lastSaveTime = 0;
        this._userId = null;
        this._loaded = false;
    }

    /**
     * Get the Firebase Auth UID as the Firestore document key.
     * Falls back to null if user is not authenticated.
     * Using Firebase UID ensures Firestore security rules can enforce owner-only writes.
     */
    _getUserId() {
        // Always prefer Firebase Auth UID (secure, enforced by Firestore rules)
        if (auth && auth.currentUser && auth.currentUser.uid) {
            this._userId = auth.currentUser.uid;
            return this._userId;
        }

        // If cached from a previous call, reuse
        if (this._userId) return this._userId;

        // Not authenticated yet — cannot sync
        return null;
    }

    /**
     * Load player progress from Firestore and merge with local data.
     * Cloud data takes priority for scores (max), union for unlocks.
     */
    async loadProgress() {
        const userId = this._getUserId();
        if (!userId || !db) {
            console.log('☁️ CloudSync: skipped load (no user or db)');
            return null;
        }

        try {
            const docRef = doc(db, 'players', userId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log('☁️ CloudSync: no cloud data found, will create on first save');
                this._loaded = true;
                return null;
            }

            const cloud = docSnap.data();
            console.log('☁️ CloudSync: loaded cloud data', cloud);

            // Merge cloud data into local state
            this._mergeToLocal(cloud);
            this._loaded = true;

            return cloud;
        } catch (error) {
            console.warn('☁️ CloudSync: load failed:', error.message);
            return null;
        }
    }

    /**
     * Save current player progress to Firestore.
     * Debounced to prevent excessive writes.
     */
    async saveProgress() {
        const userId = this._getUserId();
        if (!userId || !db) {
            console.log('☁️ CloudSync: skipped save (no user or db)');
            return false;
        }

        // Debounce
        const now = Date.now();
        if (now - this._lastSaveTime < SYNC_DEBOUNCE_MS) {
            // Schedule a delayed save if not already scheduled
            if (!this._saveTimer) {
                this._saveTimer = setTimeout(() => {
                    this._saveTimer = null;
                    this.saveProgress();
                }, SYNC_DEBOUNCE_MS);
            }
            return false;
        }

        this._lastSaveTime = now;

        try {
            const data = this._collectLocalData();
            const docRef = doc(db, 'players', userId);

            await setDoc(docRef, {
                ...data,
                lastSyncedAt: Date.now()
            }, { merge: true });

            console.log('☁️ CloudSync: saved to cloud', data);
            return true;
        } catch (error) {
            console.warn('☁️ CloudSync: save failed:', error.message);
            return false;
        }
    }

    /**
     * Collect all local progress data into a single object.
     */
    _collectLocalData() {
        const profile = window.userProfile || {};
        const userId = profile.id || 'local';

        // High score
        const highScore = Math.max(
            parseInt(localStorage.getItem('uploop_high_score') || '0'),
            parseInt(localStorage.getItem(`highScore_${userId}`) || '0'),
            0
        );

        // Unlocked characters
        let unlockedCharacters = ['jumper'];
        try {
            const saved = localStorage.getItem('unlockedCharacters');
            if (saved) unlockedCharacters = JSON.parse(saved);
        } catch (e) { /* use default */ }

        // Selected character
        const selectedCharacter = localStorage.getItem('selectedCharacter') || 'jumper';

        // Unlocked skins
        let unlockedSkins = ['pixel_cube'];
        try {
            const saved = localStorage.getItem(`unlockedSkins_genesis_${userId}`);
            if (saved) unlockedSkins = JSON.parse(saved);
        } catch (e) { /* use default */ }

        // Selected skin
        const selectedSkin = localStorage.getItem(`selectedSkin_genesis_${userId}`) || 'pixel_cube';

        // User stats
        let userStats = {};
        try {
            const saved = localStorage.getItem(`userStats_${userId}`);
            if (saved) userStats = JSON.parse(saved);
        } catch (e) { /* use default */ }

        // Settings
        const settings = {
            sound: localStorage.getItem('pixelJump_sound') !== 'false',
            vibration: localStorage.getItem('pixelJump_vibration') !== 'false',
            controlMode: localStorage.getItem('pixelJump_controlMode') || 'tap',
            sensitivity: parseInt(localStorage.getItem('pixelJump_sensitivity') || '5'),
            quality: localStorage.getItem('pixelJump_quality') || 'high'
        };

        // Total score
        const totalScore = profile.totalScore || parseInt(userStats.highScore || '0') || 0;

        return {
            highScore,
            totalScore,
            unlockedCharacters,
            selectedCharacter,
            unlockedSkins,
            selectedSkin,
            userStats,
            settings,
            username: profile.username || profile.firstName || 'Player',
            photoUrl: profile.photoUrl || null
        };
    }

    /**
     * Merge cloud data into local storage and userProfile.
     * Strategy: max for scores, union for unlocks, cloud wins for selections.
     */
    _mergeToLocal(cloud) {
        const profile = window.userProfile || {};
        const userId = profile.id || 'local';

        // --- High Score: take the maximum ---
        const localHigh = Math.max(
            parseInt(localStorage.getItem('uploop_high_score') || '0'),
            parseInt(localStorage.getItem(`highScore_${userId}`) || '0'),
            0
        );
        const mergedHigh = Math.max(localHigh, cloud.highScore || 0);
        localStorage.setItem('uploop_high_score', mergedHigh.toString());
        localStorage.setItem(`highScore_${userId}`, mergedHigh.toString());

        // --- Total Score: take maximum ---
        if (cloud.totalScore && profile) {
            profile.totalScore = Math.max(profile.totalScore || 0, cloud.totalScore || 0);
        }

        // --- Unlocked Characters: union ---
        let localChars = ['jumper'];
        try {
            const saved = localStorage.getItem('unlockedCharacters');
            if (saved) localChars = JSON.parse(saved);
        } catch (e) { /* use default */ }

        const cloudChars = cloud.unlockedCharacters || [];
        const mergedChars = [...new Set([...localChars, ...cloudChars])];
        localStorage.setItem('unlockedCharacters', JSON.stringify(mergedChars));
        if (profile.unlockedCharacters) {
            profile.unlockedCharacters = mergedChars;
        }

        // --- Selected Character: cloud wins if valid ---
        if (cloud.selectedCharacter) {
            localStorage.setItem('selectedCharacter', cloud.selectedCharacter);
            if (profile) profile.selectedCharacter = cloud.selectedCharacter;
        }

        // --- Unlocked Skins: union ---
        let localSkins = ['pixel_cube'];
        try {
            const saved = localStorage.getItem(`unlockedSkins_genesis_${userId}`);
            if (saved) localSkins = JSON.parse(saved);
        } catch (e) { /* use default */ }

        const cloudSkins = cloud.unlockedSkins || [];
        const mergedSkins = [...new Set([...localSkins, ...cloudSkins])];
        localStorage.setItem(`unlockedSkins_genesis_${userId}`, JSON.stringify(mergedSkins));

        // --- Selected Skin: cloud wins ---
        if (cloud.selectedSkin) {
            localStorage.setItem(`selectedSkin_genesis_${userId}`, cloud.selectedSkin);
            window.selectedSkin = cloud.selectedSkin;
        }

        // --- User Stats: merge (max for numeric, union for arrays) ---
        if (cloud.userStats) {
            let localStats = {};
            try {
                const saved = localStorage.getItem(`userStats_${userId}`);
                if (saved) localStats = JSON.parse(saved);
            } catch (e) { /* use default */ }

            const mergedStats = {
                highScore: Math.max(localStats.highScore || 0, cloud.userStats.highScore || 0),
                totalDeaths: Math.max(localStats.totalDeaths || 0, cloud.userStats.totalDeaths || 0),
                scoreStreaks: cloud.userStats.scoreStreaks || localStats.scoreStreaks || [],
                beatFriendRecord: localStats.beatFriendRecord || cloud.userStats.beatFriendRecord || false,
                referralCount: Math.max(localStats.referralCount || 0, cloud.userStats.referralCount || 0),
                secretEvents: { ...(localStats.secretEvents || {}), ...(cloud.userStats.secretEvents || {}) }
            };
            localStorage.setItem(`userStats_${userId}`, JSON.stringify(mergedStats));
            window.userStats = mergedStats;
        }

        // --- Settings: cloud wins ---
        if (cloud.settings) {
            const s = cloud.settings;
            if (s.sound !== undefined) localStorage.setItem('pixelJump_sound', s.sound.toString());
            if (s.vibration !== undefined) localStorage.setItem('pixelJump_vibration', s.vibration.toString());
            if (s.controlMode) localStorage.setItem('pixelJump_controlMode', s.controlMode);
            if (s.sensitivity) localStorage.setItem('pixelJump_sensitivity', s.sensitivity.toString());
            if (s.quality) localStorage.setItem('pixelJump_quality', s.quality);
        }

        console.log('☁️ CloudSync: merged cloud data into local storage');
    }
}
