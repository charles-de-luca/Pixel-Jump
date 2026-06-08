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
 * PIXEL JUMP - Skin Visual Effects Renderer
 * Handles trail, particles, glow, and glitch effects
 */

export class SkinEffectsRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.trailParticles = [];
        this.effectParticles = [];
    }

    // Add trail particle
    addTrailParticle(x, y, color, opacity = 1.0) {
        this.trailParticles.push({
            x: x,
            y: y,
            color: color,
            life: 20,
            maxLife: 20,
            opacity: opacity,
            size: 12
        });
    }

    // Add effect particle (sparks, fire, fog, etc)
    addEffectParticle(x, y, type, color) {
        const particle = {
            x: x,
            y: y,
            color: color,
            life: 30,
            maxLife: 30,
            type: type,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        };

        // Type-specific behavior
        switch (type) {
            case 'sparks':
                particle.vy = -Math.random() * 3; // Upward
                particle.size = 2;
                break;
            case 'fire':
                particle.vy = -Math.random() * 2; // Upward
                particle.vx = (Math.random() - 0.5) * 1;
                particle.size = 3;
                break;
            case 'fog':
                particle.vy = Math.random() * 0.5; // Slow downward
                particle.vx = (Math.random() - 0.5) * 0.5;
                particle.size = 8;
                break;
            case 'sparkles':
                particle.vy = -Math.random() - 1; // Float up
                particle.size = 2;
                break;
            case 'matrix':
                particle.vy = Math.random() * 2 + 1; // Fall down
                particle.vx = 0;
                particle.size = 8;
                particle.symbol = this.getRandomMatrixSymbol();
                break;
            default:
                particle.size = 2;
        }

        this.effectParticles.push(particle);
    }

    // Get random Matrix symbol
    getRandomMatrixSymbol() {
        const symbols = ['0', '1', 'ﾊ', 'ﾐ', 'ﾋ', 'ｰ', 'ｳ', 'ｼ', 'ﾅ', 'ﾓ', 'ﾆ', 'ｻ', 'ﾜ', 'ﾂ'];
        return symbols[Math.floor(Math.random() * symbols.length)];
    }

    // Update all particles
    update() {
        // Update trail particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life--;
            p.opacity = (p.life / p.maxLife) * 0.6;
            p.size *= 0.95; // Shrink over time

            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }

        // Update effect particles
        for (let i = this.effectParticles.length - 1; i >= 0; i--) {
            const p = this.effectParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                this.effectParticles.splice(i, 1);
            }
        }
    }

    // Render trail particles
    renderTrail(cameraY) {
        for (let p of this.trailParticles) {
            const screenY = p.y - cameraY;
            if (screenY < -20 || screenY > 700) continue;

            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(
                Math.floor(p.x),
                Math.floor(screenY),
                p.size,
                p.size
            );
        }
        this.ctx.globalAlpha = 1.0;
    }

    // Render effect particles
    renderEffects(cameraY) {
        for (let p of this.effectParticles) {
            const screenY = p.y - cameraY;
            if (screenY < -20 || screenY > 700) continue;

            const alpha = p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;

            // Matrix symbols use text rendering
            if (p.type === 'matrix' && p.symbol) {
                this.ctx.fillStyle = p.color;
                this.ctx.font = '10px monospace';
                this.ctx.fillText(
                    p.symbol,
                    Math.floor(p.x),
                    Math.floor(screenY)
                );
            } else {
                // Regular particle rendering
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(
                    Math.floor(p.x),
                    Math.floor(screenY),
                    p.size,
                    p.size
                );
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    // Apply glow effect
    applyGlow(color, blur = 15) {
        this.ctx.shadowBlur = blur;
        this.ctx.shadowColor = color;
    }

    // Clear glow
    clearGlow() {
        this.ctx.shadowBlur = 0;
    }

    // Apply glitch effect (random offset)
    applyGlitch(chance = 0.1) {
        if (Math.random() < chance) {
            return {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4
            };
        }
        return { x: 0, y: 0 };
    }

    // Apply background darkening effect
    applyBackgroundDarken(ctx, alpha = 0.3) {
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Get platform tint color (for Inferno effect)
    getPlatformTint(platformColor, tintColor) {
        // Blend platform color with tint
        return tintColor; // Simple version - just use tint color
    }

    // Clear all particles
    clear() {
        this.trailParticles = [];
        this.effectParticles = [];
    }
}
