/**
 * PIXEL JUMP - Perks System
 * Pre-game modifiers for variety
 */

export const PERKS = {
    feather: {
        id: 'feather',
        name: '🪶 FEATHER',
        emoji: '🪶',
        description: 'Slower fall\n-10% gravity',
        effect: {
            type: 'gravity_modifier',
            value: 0.9 // 90% of base gravity
        }
    },

    turbo: {
        id: 'turbo',
        name: '⚡ TURBO',
        emoji: '⚡',
        description: 'Higher jumps\n+20% jump force',
        effect: {
            type: 'jump_modifier',
            value: 1.2 // 120% of base jump (+20%)
        }
    },

    shield: {
        id: 'shield',
        name: '🛡 SHIELD',
        emoji: '🛡',
        description: 'One extra life\nper game',
        effect: {
            type: 'extra_life',
            value: 1
        }
    }
};

/**
 * Apply perk effects to game engine
 */
export function applyPerk(game, perkId) {
    if (!game || !perkId) return;

    const perk = PERKS[perkId];
    if (!perk) {
        console.warn('Unknown perk:', perkId);
        return;
    }

    const effect = perk.effect;

    switch (effect.type) {
        case 'gravity_modifier':
            // Apply on top of character and biome modifiers
            const currentGravity = game.gravity || game.baseGravity || 0.4;
            game.gravity = currentGravity * effect.value;
            console.log(`🪶 FEATHER: Gravity reduced to ${game.gravity.toFixed(3)}`);
            break;

        case 'jump_modifier':
            // Boost jump force
            const currentJump = game.jumpForce || game.baseJumpForce || -10;
            game.jumpForce = currentJump * effect.value;
            game.boostForce = (game.boostForce || -18) * effect.value;
            console.log(`⚡ TURBO: Jump boosted to ${game.jumpForce.toFixed(1)}`);
            break;

        case 'extra_life':
            // Give shield (like Ghost character)
            game.perkShieldActive = true;
            game.perkShieldUsed = false;
            console.log(`🛡 SHIELD: Extra life ready`);
            break;
    }

    // Store active perk
    game.activePerk = perk;
}

/**
 * Get all available perks
 */
export function getAllPerks() {
    return Object.values(PERKS);
}

/**
 * Get perk by ID
 */
export function getPerk(perkId) {
    return PERKS[perkId] || null;
}
