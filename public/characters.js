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
 * PIXEL JUMP - Character System
 * Each character has unique passive abilities
 */

export const CHARACTERS = {
    jumper: {
        id: 'jumper',
        name: 'JUMPER',
        emoji: '🟢',
        color: '#00FF00',
        ability: null,
        description: 'Balanced\nfor beginners',
        unlockType: 'default'
    },

    floaty: {
        id: 'floaty',
        name: 'FLOATY',
        emoji: '🟦',
        color: '#0000FF',
        ability: {
            type: 'gravity_modifier',
            value: 0.9 // -10% gravity
        },
        description: 'Slower fall\n-10% gravity',
        unlockType: 'score',
        unlockValue: 1000
    },

    rocket: {
        id: 'rocket',
        name: 'ROCKET',
        emoji: '🟥',
        color: '#FF0000',
        ability: {
            type: 'jump_boost',
            value: 1.15 // +15% first jump
        },
        description: 'Higher jumps\n+15% boost',
        unlockType: 'daily',
        unlockValue: 3 // Complete 3 daily challenges
    },

    glitch: {
        id: 'glitch',
        name: 'GLITCH',
        emoji: '🟪',
        color: '#8B00FF',
        ability: {
            type: 'teleport',
            chance: 0.05 // 5% chance per frame when falling
        },
        description: '5% teleport\nto safe platform',
        unlockType: 'secret',
        unlockCondition: 'die_on_fake_platform' // Easter egg
    },

    ghost: {
        id: 'ghost',
        name: 'GHOST',
        emoji: '⬜',
        color: '#FFFFFF',
        ability: {
            type: 'second_chance',
            value: 1 // One free death
        },
        description: '1 Extra Life\nper game',
        unlockType: 'achievement',
        unlockCondition: 'beat_personal_best'
    }
};

/**
 * Check which characters should be unlocked based on user profile
 */
export function checkCharacterUnlocks(userProfile) {
    const unlocks = [];

    if (!userProfile) return unlocks;

    Object.values(CHARACTERS).forEach(char => {
        // Skip if already unlocked
        if (userProfile.unlockedCharacters?.includes(char.id)) return;

        let shouldUnlock = false;

        switch (char.unlockType) {
            case 'default':
                shouldUnlock = true; // Always unlocked
                break;

            case 'score':
                const totalScore = userProfile.totalScore || 0;
                shouldUnlock = totalScore >= char.unlockValue;
                break;

            case 'daily':
                const dailyCount = userProfile.dailyChallengesCompleted || 0;
                shouldUnlock = dailyCount >= char.unlockValue;
                break;

            case 'achievement':
                const achievements = userProfile.achievements || [];
                shouldUnlock = achievements.includes(char.unlockCondition);
                break;

            case 'secret':
                // Secret conditions tracked separately
                const secretStats = userProfile.secretStats || {};
                shouldUnlock = secretStats[char.unlockCondition] === true;
                break;
        }

        if (shouldUnlock) {
            unlocks.push(char);
        }
    });

    return unlocks;
}

/**
 * Get character by ID, default to jumper
 */
export function getCharacter(characterId) {
    return CHARACTERS[characterId] || CHARACTERS.jumper;
}

/**
 * Apply character ability to game engine
 */
export function applyCharacterAbility(game, character) {
    if (!character || !character.ability) {
        // Reset to defaults for jumper
        game.baseGravity = 0.4;
        game.baseJumpForce = -10;
        game.gravity = game.baseGravity;
        game.jumpForce = game.baseJumpForce;
        return;
    }

    const ability = character.ability;

    switch (ability.type) {
        case 'gravity_modifier':
            game.baseGravity = 0.4;
            game.gravity = game.baseGravity * ability.value;
            console.log(`🟦 FLOATY: Gravity reduced to ${game.gravity}`);
            break;

        case 'jump_boost':
            game.baseJumpForce = -10;
            game.jumpForce = game.baseJumpForce * ability.value;
            game.boostForce = -18 * ability.value; // Also boost the boost
            console.log(`🟥 ROCKET: Jump force increased to ${game.jumpForce}`);
            break;

        case 'teleport':
            // Handled in update loop
            game.teleportChance = ability.chance;
            console.log(`🟪 GLITCH: 5% teleport chance active`);
            break;

        case 'second_chance':
            // Single use per game
            game.secondChanceAvailable = true;
            game.secondChanceUsed = false;
            console.log(`⬜ GHOST: Extra life ready`);
            break;
    }
}

/**
 * Track stats for achievements and unlocks
 */
export function trackCharacterStats(game, event) {
    if (!game.characterStats) {
        game.characterStats = {
            character: game.selectedCharacter?.id || 'jumper',
            teleports: 0,
            secondChanceUsed: false,
            diedOnFakePlatform: false
        };
    }

    switch (event.type) {
        case 'teleport':
            game.characterStats.teleports++;
            break;

        case 'second_chance_used':
            game.characterStats.secondChanceUsed = true;
            break;

        case 'died_on_fake':
            game.characterStats.diedOnFakePlatform = true;
            break;
    }

    return game.characterStats;
}

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
    rocket_run: {
        id: 'rocket_run',
        name: 'ROCKET RUN',
        description: 'Score 2000+ with Rocket',
        emoji: '🚀',
        check: (stats) => stats.character === 'rocket' && stats.score >= 2000
    },

    ghost_master: {
        id: 'ghost_master',
        name: 'GHOST MASTER',
        description: 'Win without using extra life',
        emoji: '👻',
        check: (stats) => stats.character === 'ghost' && !stats.secondChanceUsed && stats.score >= 1000
    },

    glitch_luck: {
        id: 'glitch_luck',
        name: 'GLITCH LUCK',
        description: 'Teleport 5+ times in one game',
        emoji: '⚡',
        check: (stats) => stats.teleports >= 5
    },

    floaty_pro: {
        id: 'floaty_pro',
        name: 'FLOATY PRO',
        description: 'Score 1500+ with Floaty',
        emoji: '💙',
        check: (stats) => stats.character === 'floaty' && stats.score >= 1500
    }
};

/**
 * Check which achievements were earned this game
 */
export function checkAchievements(stats, previousAchievements = []) {
    const newAchievements = [];

    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (previousAchievements.includes(achievement.id)) return;
        if (achievement.check(stats)) {
            newAchievements.push(achievement);
        }
    });

    return newAchievements;
}
