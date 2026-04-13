/**
 * PIXEL JUMP - Biome System
 * Different themed zones with unique modifiers
 */

export const BIOMES = {
    forest: {
        id: 'forest',
        name: '🌲 CLASSIC',
        heightRange: [0, Infinity],
        colors: {
            background: ['#0a0a1a', '#111111'],
            platforms: ['#00FF00', '#00AA00'], // Bright Green
            stars: '#FFFFFF'
        },
        modifiers: {},
        description: 'Classic Mode'
    },

    lava: {
        id: 'lava',
        name: '🔥 LAVA',
        heightRange: [30000, 50000], // Starts after 3000 as requested
        colors: {
            background: ['#220500', '#110000'],
            platforms: ['#8B0000', '#800000'], // DarkRed
            stars: '#FFA500'
        },
        modifiers: {
            breakingChance: 0.5,
            particleColor: '#FF4500'
        },
        description: 'Watch out for breaking platforms!'
    },

    ice: {
        id: 'ice',
        name: '❄️ ICE',
        heightRange: [50000, 70000],
        colors: {
            background: ['#001133', '#00081a'],
            platforms: ['#00CED1', '#008B8B'], // DarkTurquoise
            stars: '#E0FFFF'
        },
        modifiers: {
            friction: 0.95,
            particleColor: '#AFEEEE'
        },
        description: 'Slippery surfaces!'
    },

    space: {
        id: 'space',
        name: '🌌 SPACE',
        heightRange: [80000, Infinity],
        colors: {
            background: ['#000000', '#0a0a2a'],
            platforms: ['#4B0082', '#483D8B'], // Indigo
            stars: '#FFFFFF'
        },
        modifiers: {
            gravity: 0.28,
            particleColor: '#9370DB'
        },
        description: 'Zero gravity!'
    }
};

/**
 * Get biome based on player height (negative Y = higher)
 */
export function getBiomeByHeight(height) {
    // DISABLED: Always return Forest/Classic
    return BIOMES.forest;
}

/**
 * Apply biome modifiers to game engine
 */
export function applyBiomeModifiers(game, biome) {
    if (!game || !biome) return;

    // Reset to base values first
    game.baseGravity = game.baseGravity || 0.4;
    game.baseFriction = game.baseFriction || 0.98;

    // Apply character modifiers first (if any)
    if (game.selectedCharacter && game.selectedCharacter.ability) {
        const ability = game.selectedCharacter.ability;
        if (ability.type === 'gravity_modifier') {
            game.gravity = game.baseGravity * ability.value;
        }
    } else {
        game.gravity = game.baseGravity;
    }

    // Then apply biome modifiers on top
    if (biome.modifiers.gravity) {
        game.gravity = biome.modifiers.gravity;
    }

    if (biome.modifiers.friction) {
        game.friction = biome.modifiers.friction;
    } else {
        game.friction = game.baseFriction;
    }

    // Store biome-specific settings
    game.currentBiome = biome;
    game.biomeBreakingChance = biome.modifiers.breakingChance || 0;
    game.biomeParticleColor = biome.modifiers.particleColor || '#FFFFFF';
}

/**
 * Update biome based on current camera position
 */
export function updateBiome(game) {
    if (!game) return;

    const newBiome = getBiomeByHeight(game.cameraY);

    // Check if biome changed
    if (!game.currentBiome || game.currentBiome.id !== newBiome.id) {
        console.log(`🌍 Entering ${newBiome.name}: ${newBiome.description}`);

        // Apply new biome
        applyBiomeModifiers(game, newBiome);

        // Visual notification
        showBiomeTransition(newBiome);

        // Play transition sound
        if (window.audio && window.audio.playBoost) {
            window.audio.playBoost();
        }

        // Screen shake for dramatic effect
        if (game.screenShake !== undefined) {
            game.screenShake = 8;
        }
    }
}

/**
 * Show biome transition notification
 */
function showBiomeTransition(biome) {
    const notification = document.createElement('div');
    notification.className = 'biome-notification';
    notification.innerHTML = `
        <div class="biome-name">${biome.name}</div>
        <div class="biome-desc">${biome.description}</div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

/**
 * Get background gradient for current biome
 */
export function getBiomeGradient(ctx, biome) {
    if (!biome) biome = BIOMES.forest;

    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, biome.colors.background[0]);
    gradient.addColorStop(1, biome.colors.background[1]);
    return gradient;
}

/**
 * Get platform color based on type and biome
 */
export function getPlatformColor(type, biome) {
    if (!biome) biome = BIOMES.forest;

    // Normal platforms take the biome color
    if (type === 'normal') {
        return biome.colors.platforms[0];
    }

    // Interactive platforms have DISTINCT colors to avoid confusion
    const typeColors = {
        breaking: '#FFD700', // Gold (distinct from Red/Green)
        moving: '#1E90FF',   // DodgerBlue (distinct from Ice Cyan)
        fake: '#FF4500',     // OrangeRed (distinct from Lava DarkRed)
        boost: '#FF00FF'     // Magenta (High contrast)
    };

    return typeColors[type] || biome.colors.platforms[0];
}
