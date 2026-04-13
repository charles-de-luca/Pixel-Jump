/**
 * PIXEL JUMP - GENESIS PACK
 * 12 Unique Skins with Visual Effects
 */

export const GENESIS_PACK = {
    pixel_cube: {
        id: 'pixel_cube',
        name: 'PIXEL CUBE',
        emoji: '🟩',
        color: '#00FF00',
        description: 'Classic starter\nNo effects',
        unlock: {
            type: 'default',
            value: 0
        },
        effects: {
            trail: false,
            glow: false,
            particles: false
        }
    },

    neon_runner: {
        id: 'neon_runner',
        name: 'NEON RUNNER',
        emoji: '🏃',
        color: '#00DDFF',
        description: 'Blue neon glow\nLight jump trail',
        unlock: {
            type: 'score',
            value: 300
        },
        effects: {
            trail: true,
            trailColor: '#00DDFF',
            glow: true,
            glowColor: 'rgba(0, 221, 255, 0.5)',
            particles: false
        }
    },

    rage_core: {
        id: 'rage_core',
        name: 'RAGE CORE',
        emoji: '😈',
        color: '#FF0000',
        description: 'Angry red eyes\nPulses on fall',
        unlock: {
            type: 'score',
            value: 500
        },
        effects: {
            trail: false,
            glow: true,
            glowColor: 'rgba(255, 0, 0, 0.6)',
            pulse: true,
            particles: false,
            eyes: 'angry' // Custom eyes
        }
    },

    retro_kid: {
        id: 'retro_kid',
        name: 'RETRO KID',
        emoji: '👦',
        color: '#FFFF00',
        description: 'NES-style character\nRunning animation',
        unlock: {
            type: 'score',
            value: 700
        },
        effects: {
            trail: false,
            glow: false,
            particles: false,
            animated: true,
            sprite: 'retro' // Custom sprite animation
        }
    },

    bitbot: {
        id: 'bitbot',
        name: 'BITBOT',
        emoji: '🤖',
        color: '#888888',
        description: 'Mechanical robot\nPixel sparks',
        unlock: {
            type: 'score',
            value: 1000
        },
        effects: {
            trail: false,
            glow: false,
            particles: true,
            particleColor: '#FFFF00',
            particleType: 'sparks'
        }
    },

    ghost_byte: {
        id: 'ghost_byte',
        name: 'GHOST BYTE',
        emoji: '👻',
        color: '#FFFFFF',
        description: 'Semi-transparent\nFade trail',
        unlock: {
            type: 'streak',
            value: 800,
            count: 3,
            description: '3 times > 800 score'
        },
        effects: {
            trail: true,
            trailColor: '#FFFFFF',
            glow: true,
            glowColor: 'rgba(255, 255, 255, 0.3)',
            opacity: 0.7,
            fadeEffect: true
        }
    },

    inferno_core: {
        id: 'inferno_core',
        name: 'INFERNO CORE',
        emoji: '🔥',
        color: '#FF6600',
        description: 'Flaming cube\nOrange particles',
        unlock: {
            type: 'score',
            value: 1200
        },
        effects: {
            trail: true,
            trailColor: '#FF6600',
            glow: true,
            glowColor: 'rgba(255, 102, 0, 0.7)',
            particles: true,
            particleColor: '#FF6600',
            particleType: 'fire',
            platformTint: '#FF2200' // Platforms turn red
        }
    },

    glitch_entity: {
        id: 'glitch_entity',
        name: 'GLITCH ENTITY',
        emoji: '👾',
        color: '#8B00FF',
        description: 'Sprite glitches\nRandom twitches',
        unlock: {
            type: 'secret',
            condition: 'random_event',
            description: 'Random secret event'
        },
        effects: {
            trail: false,
            glow: true,
            glowColor: 'rgba(139, 0, 255, 0.5)',
            particles: false,
            glitch: true,
            glitchChance: 0.1 // 10% chance per frame
        }
    },

    hacker_zero: {
        id: 'hacker_zero',
        name: 'HACKER ZERO',
        emoji: '🧠',
        color: '#00FF00',
        description: 'Matrix effect\nGreen UI tint',
        unlock: {
            type: 'social',
            condition: 'beat_friend_record',
            description: 'Beat friend record'
        },
        effects: {
            trail: true,
            trailColor: '#00FF00',
            trailType: 'matrix', // Matrix symbols
            glow: true,
            glowColor: 'rgba(0, 255, 0, 0.4)',
            uiTint: '#00FF00'
        }
    },

    shadow: {
        id: 'shadow',
        name: 'SHADOW',
        emoji: '🥷',
        color: '#000000',
        description: 'Black silhouette\nDark fog',
        unlock: {
            type: 'streak',
            value: 1000,
            count: 3,
            description: '3 times > 1000 score'
        },
        effects: {
            trail: false,
            glow: true,
            glowColor: 'rgba(0, 0, 0, 0.5)',
            particles: true,
            particleColor: '#333333',
            particleType: 'fog',
            backgroundDarken: true,
            eyes: 'white' // White eyes on black body
        }
    },

    cursed_pixel: {
        id: 'cursed_pixel',
        name: 'CURSED PIXEL',
        emoji: '☠️',
        color: '#440044',
        description: 'Cracked cube\nScreen distorts',
        unlock: {
            type: 'deaths',
            value: 100,
            description: '100 total deaths'
        },
        effects: {
            trail: false,
            glow: true,
            glowColor: 'rgba(68, 0, 68, 0.6)',
            particles: false,
            cracked: true,
            flickerChance: 0.05, // Random flicker
            deathEffect: 'distort' // Screen distortion on death
        }
    },

    influencer: {
        id: 'influencer',
        name: 'INFLUENCER',
        emoji: '🦸',
        color: '#FFD700',
        description: 'Golden cube\nSparkles on record',
        unlock: {
            type: 'social',
            condition: 'referrals',
            value: 5,
            description: '5 friends joined'
        },
        effects: {
            trail: true,
            trailColor: '#FFD700',
            glow: true,
            glowColor: 'rgba(255, 215, 0, 0.7)',
            particles: true,
            particleColor: '#FFD700',
            particleType: 'sparkles',
            crownIcon: true // Crown in UI
        }
    }
};

/**
 * Check unlock conditions
 */
export function checkSkinUnlocks(userStats) {
    const unlockedSkins = ['pixel_cube']; // Default always unlocked

    Object.values(GENESIS_PACK).forEach(skin => {
        if (skin.id === 'pixel_cube') return; // Skip default

        const unlock = skin.unlock;
        let isUnlocked = false;

        switch (unlock.type) {
            case 'score':
                isUnlocked = (userStats.highScore || 0) >= unlock.value;
                break;

            case 'streak':
                const streaks = userStats.scoreStreaks || [];
                const aboveThreshold = streaks.filter(s => s >= unlock.value);
                isUnlocked = aboveThreshold.length >= unlock.count;
                break;

            case 'deaths':
                isUnlocked = (userStats.totalDeaths || 0) >= unlock.value;
                break;

            case 'social':
                if (unlock.condition === 'beat_friend_record') {
                    isUnlocked = userStats.beatFriendRecord || false;
                } else if (unlock.condition === 'referrals') {
                    isUnlocked = (userStats.referralCount || 0) >= unlock.value;
                }
                break;

            case 'secret':
                isUnlocked = userStats.secretEvents?.[unlock.condition] || false;
                break;
        }

        if (isUnlocked && !unlockedSkins.includes(skin.id)) {
            unlockedSkins.push(skin.id);
        }
    });

    return unlockedSkins;
}

/**
 * Apply skin visual effects to game
 */
export function applySkinEffects(game, skinId) {
    const skin = GENESIS_PACK[skinId];
    if (!skin) return;

    // Store skin config in game
    game.activeSkin = skin;
    game.player.color = skin.color;

    console.log(`🎨 Applied skin: ${skin.name} ${skin.emoji}`);
}

/**
 * Get skin by ID
 */
export function getSkin(skinId) {
    return GENESIS_PACK[skinId] || GENESIS_PACK.pixel_cube;
}

/**
 * Get all skins
 */
export function getAllSkins() {
    return Object.values(GENESIS_PACK);
}
