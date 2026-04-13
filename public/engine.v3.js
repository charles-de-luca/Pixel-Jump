/**
 * PIXEL JUMP - Core Game Engine
 * Vertical platformer mechanics
 */
import { GhostSystem } from './ghost.js';
import { applyCharacterAbility, trackCharacterStats } from './characters.js';
import { updateBiome, getBiomeGradient, getPlatformColor } from './biomes.js';
import { SkinEffectsRenderer } from './skin-effects.js';

export class PixelJumpGame {
    constructor(canvas, ctx, audio, difficulty = 'normal') {
        this.canvas = canvas;
        this.ctx = ctx;
        this.audio = audio;
        this.difficulty = difficulty;

        // Performance optimization flags
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Game State
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.gameOver = false;
        this.platforms = [];
        this.particles = [];
        this.cameraY = 0;
        this.combo = 0;
        this.lastPlatformY = 0;

        // Physics Constants (Set via method to allow runtime changes)
        this.baseGravity = 0.4;
        this.baseJumpForce = -10;
        this.gravity = this.baseGravity;
        this.jumpForce = this.baseJumpForce;
        this.boostForce = this.baseJumpForce * 1.5; // boost platforms
        this.moveSpeed = 4;
        this.platformGap = 85; // Original "sparse" feel
        this.nextPlatformY = 600;

        // Initial Difficulty Set
        this.setDifficulty(difficulty);

        // Player
        this.player = {
            x: 180 - 8, // Centered (16px width)
            y: 400,
            width: 16,
            height: 16,
            vx: 0,
            vy: 0,
            isJumping: false,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
        };

        // Input
        this.leftPressed = false;
        this.rightPressed = false;
        this.tiltX = 0;

        // Systems
        this.ghost = this.isMobile ? null : new GhostSystem(); // Disable ghost system on mobile for performance
        this.enemies = [];

        this.frameCount = 0;

        // Stats for Daily Challenge
        this.jumps = 0;
        this.maxCombo = 0;

        // Character System
        this.selectedCharacter = null; // Set by main.js
        this.characterStats = {};
        this.teleportChance = 0;
        this.secondChanceAvailable = false;
        this.secondChanceUsed = false;

        // Perk System
        this.activePerk = null;
        this.perkShieldActive = false;
        this.perkShieldUsed = false;

        // Skin System
        this.activeSkin = null;
        this.skinEffects = new SkinEffectsRenderer(ctx);

        // (Note: baseGravity, jumpForce, moveSpeed, etc. already initialized above at constructor start)

        this.highestY = 0;

        // Fair Generation Constants
        this.MAX_JUMP_HEIGHT = 150;
        this.MAX_JUMP_WIDTH = 120;
        this.MIN_PLATFORMS_ON_SCREEN = 6;
        this.platformCounter = 0;

        // Animation & Visual Effects
        this.screenShake = 0;
        this.stars = [];

        // Initialize default biome to avoid false transition on first frame
        this.currentBiome = { id: 'forest', name: '🌲 CLASSIC', colors: { background: ['#0a0a1a', '#111111'], platforms: ['#00FF00', '#00AA00'], stars: '#FFFFFF' }, modifiers: {}, description: 'Classic Mode' };

        this.initStars();
    }

    initStars() {
        // Generate static background stars
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 2000, // Spread over large vertical area
                brightness: Math.random() * 0.5 + 0.5
            });
        }
    }

    initPlatforms() {
        // Initial platform under player (wider and thicker for safety)
        this.platforms.push({
            x: 180 - 30,
            y: 600,
            width: 60,
            height: 6,
            type: 'normal',
            broken: false
        });

        // Generate starting platforms
        for (let y = 550; y > 0; y -= this.platformGap) {
            this.generatePlatform(y);
        }
    }

    generatePlatform(yPosition) {
        this.platformCounter++;
        const y = yPosition !== undefined ? yPosition : this.nextPlatformY;
        const width = (Math.floor(Math.random() * 4) + 3) * 8; // 24, 32, 40, 48

        // FAIR GENERATION: Ensure reachability from last platform
        let x;
        const lastPlatform = this.platforms[this.platforms.length - 1];
        if (lastPlatform && yPosition === undefined) {
            // Calculate reachable X range from last platform
            const lastCenterX = lastPlatform.x + lastPlatform.width / 2;
            const maxJump = this.MAX_JUMP_WIDTH || 180; // Default if undefined

            // Allow wider range but keep responsive
            let minX = Math.max(0, lastCenterX - maxJump);
            let maxX = Math.min(this.canvas.width - width, lastCenterX + maxJump);

            // ANTI-BIAS LOGIC:
            // If we are too far right, force bias to left
            if (lastCenterX > this.canvas.width * 0.7) {
                maxX = Math.min(maxX, lastCenterX - 20); // Must move left
                minX = Math.max(0, minX); // Ensure valid
            }
            // If too far left, force bias to right
            else if (lastCenterX < this.canvas.width * 0.3) {
                minX = Math.max(minX, lastCenterX + 20); // Must move right
                maxX = Math.min(this.canvas.width - width, maxX);
            }

            // Fallback for safety (if range became invalid)
            if (minX >= maxX) {
                minX = Math.max(0, lastCenterX - maxJump);
                maxX = Math.min(this.canvas.width - width, lastCenterX + maxJump);
            }

            // Randomly choose position
            x = minX + Math.random() * (maxX - minX);
        } else {
            // Initial platforms - spread across full canvas width
            x = Math.random() * (this.canvas.width - width);
        }

        let type = 'normal';
        const score = Math.floor((-this.cameraY) / 10);
        const rand = Math.random();

        // SAFETY NET: Every 10th platform is guaranteed normal/safe
        const isSafePlatform = this.platformCounter % 10 === 0;

        // Progressive Difficulty (only if not a safe platform)
        if (isSafePlatform) {
            type = 'normal';
        } else if (score > 2500) {
            if (rand < 0.15) type = 'fake';       // 15% Fake
            else if (rand < 0.45) type = 'moving'; // 30% Moving
            else if (rand < 0.60) type = 'breaking'; // 15% Breaking
            else if (rand < 0.65) type = 'boost';  // 5% Boost
        } else if (score > 1000) {
            if (rand < 0.05) type = 'fake';       // 5% Fake
            else if (rand < 0.3) type = 'moving';  // 25% Moving
            else if (rand < 0.5) type = 'breaking'; // 20% Breaking
            else if (rand < 0.55) type = 'boost';  // 5% Boost
        } else if (score > 500) {
            if (rand < 0.2) type = 'moving';       // 20% Moving
            else if (rand < 0.3) type = 'breaking'; // 10% Breaking
            else if (rand < 0.35) type = 'boost';  // 5% Boost
        } else {
            if (rand < 0.05) type = 'boost';      // 5% Boost early on
        }

        this.platforms.push({
            x: x,
            y: y,
            width: width,
            height: 6, // Thicker for better visibility
            type: type,
            broken: false,
            direction: Math.random() < 0.5 ? 1 : -1,
            speed: (1 + (score / 5000))
        });

        if (yPosition === undefined) {
            // Dynamic Gaps based on score
            // Base 85 (Sparse) -> Scale up to ~120
            let gap = this.platformGap;

            if (score > 500) gap = Math.min(this.platformGap + 10, 100);
            if (score > 1000) gap = Math.min(this.platformGap + 20, 110);
            if (score > 2000) gap = Math.min(this.platformGap + 35, 120);

            // Add some variance to gap but cap it
            const variance = (Math.random() * 15) - 7;
            const finalGap = Math.min(gap + variance, this.MAX_JUMP_HEIGHT * 0.85);
            this.nextPlatformY -= finalGap;
        }

        // Spawn Enemy (10% chance above score 1000)
        if (score > 1000 && Math.random() < 0.1) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 16),
                y: y - 50, // Floating above platform
                width: 16,
                height: 16,
                vx: Math.random() < 0.5 ? 2 : -2,
                vy: 0,
                color: '#FF00FF' // Magenta enemy
            });
        }
    }

    createParticles(x, y, color, count = 5) {
        // Reduce particles on Low quality and mobile devices
        const quality = window.qualityMode || 'high';
        let particleCount = count;

        if (quality === 'low') {
            particleCount = Math.ceil(count / 2);
        }

        // Further reduce particles on mobile devices
        if (this.isMobile) {
            particleCount = Math.ceil(particleCount / 2);
        }

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 20, // Short life
                color: color
            });
        }
    }

    // Difficulty Settings
    setDifficulty(level) {
        this.difficulty = level;
        console.log(`⚙️ Engine Difficulty Set: ${level}`);

        switch (level) {
            case 'easy':
                this.baseGravity = 0.35; // Floaty
                this.baseJumpForce = -9.5;
                this.moveSpeed = 3.5;    // Slower
                this.platformGap = 55;   // Closer
                break;
            case 'hard':
                this.baseGravity = 0.5;  // Heavy
                this.baseJumpForce = -11.0;
                this.moveSpeed = 5.0;    // Faster
                this.platformGap = 70;   // Further
                break;
            case 'normal':
            default:
                this.baseGravity = 0.4;
                this.baseJumpForce = -10.0;
                this.moveSpeed = 4.0;
                this.platformGap = 85; // Original "sparse" feel
                break;
        }

        // Apply immediate physics update if running
        this.gravity = this.baseGravity;
        this.jumpForce = this.baseJumpForce;
        this.boostForce = this.baseJumpForce * 1.5;
    }

    update() {
        if (!this.isRunning) return;

        // Decay screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.8;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }

        // GLITCH TELEPORT: Check for teleport when falling
        if (this.teleportChance > 0 && this.player.vy > 5) {
            if (Math.random() < this.teleportChance) {
                this.teleportToSafePlatform();
                if (typeof trackCharacterStats === 'function') {
                    trackCharacterStats(this, { type: 'teleport' });
                } else {
                    console.warn('⚠️ trackCharacterStats is not defined');
                }
            }
        }

        // Update player state with squash/stretch animation
        if (this.player.vy < 0) {
            this.player.state = 'jump';
            this.player.scaleX = 0.8; // Squash horizontally
            this.player.scaleY = 1.2; // Stretch vertically
        } else if (this.player.vy > 0) {
            this.player.state = 'fall';
            this.player.scaleX = 1.1; // Stretch horizontally
            this.player.scaleY = 0.9; // Squash vertically
        } else {
            this.player.state = 'idle';
            // Gentle breathing animation - reduce frequency on mobile
            const freq = this.isMobile ? 0.05 : 0.1; // Slower animation on mobile
            const breathe = Math.sin(this.frameCount * freq) * 0.05;
            this.player.scaleX = 1 + breathe;
            this.player.scaleY = 1 - breathe;
        }

        // Apply handling
        // Apply handling based on Control Mode
        const mode = window.controlMode || 'tap'; // tap, tilt, hybrid
        const sensitivity = (window.controlSensitivity || 5) / 5; // 1.0 is default (at 5)

        let moveForce = 0;

        // TAP INPUT (from keyboard/mouse/touch via setInput)
        if (this.leftPressed) moveForce = -1;
        else if (this.rightPressed) moveForce = 1;

        // TILT INPUT (Additive for Hybrid, Exclusive for Tilt)
        if (mode === 'tilt' || mode === 'hybrid') {
            // Apply deadzone (±5 degrees approx 0.1 rad or gamma units)
            // tiltX is usually -1 to 1 range from setTilt
            let tiltInput = this.tiltX;

            // Deadzone (±0.05 is roughly 5% tilt)
            if (Math.abs(tiltInput) < 0.05) tiltInput = 0;

            // Adaptive Sensitivity (Non-linear curve)
            // Stronger tilt = exponential force
            const sign = Math.sign(tiltInput);
            const magnitude = Math.abs(tiltInput);

            // Curve: power of 1.5 for control
            const curvedInput = sign * Math.pow(magnitude, 1.5);

            if (mode === 'tilt') {
                // If Tilt Mode: Overwrite Tap unless Tap is active
                moveForce = curvedInput * sensitivity; // Scaled
            } else if (mode === 'hybrid') {
                // Hybrid: Additive (Tap + Tilt)
                moveForce += curvedInput * sensitivity * 0.5; // Half strength for tilt in hybrid
            }
        }

        // Apply movement
        // Clamp force
        if (moveForce < -1) moveForce = -1;
        if (moveForce > 1) moveForce = 1;

        this.player.vx = moveForce * this.moveSpeed;

        this.player.vy += this.gravity;
        this.player.x += this.player.vx;
        // Sanitize vy to prevent NaN or extreme values causing tunneling
        if (isNaN(this.player.vy) || !isFinite(this.player.vy)) {
            console.warn('⚠️ Physics NaN detected (vy). Resetting to 0.');
            this.player.vy = 0;
        }
        
        // Clamp maximum falling velocity (terminal velocity) and jumping velocity
        this.player.vy = Math.max(-25, Math.min(this.player.vy, 20));

        this.player.y += this.player.vy;

        // Wrap around
        if (this.player.x + this.player.width < 0) this.player.x = this.canvas.width;
        if (this.player.x > this.canvas.width) this.player.x = -this.player.width;

        // Camera follow
        if (this.player.y < this.cameraY + 300) {
            this.cameraY = this.player.y - 300;
        }

        // Platform collision
        if (this.player.vy > 0) {
            for (let platform of this.platforms) {
                // Ignore broken or fake platforms
                if (platform.broken || platform.type === 'fake') continue;

                // Dynamic collision threshold to prevent tunneling at high speeds
                // As player falls faster, search distinct range increases
                const collisionThreshold = Math.max(10, this.player.vy + 2);

                if (this.player.x + this.player.width > platform.x &&
                    this.player.x < platform.x + platform.width &&
                    this.player.y + this.player.height > platform.y &&
                    this.player.y + this.player.height < platform.y + platform.height + collisionThreshold) {

                    // Jump
                    let force = this.jumpForce;
                    let sound = 'jump';
                    let particleColor = '#FFFFFF';

                    if (platform.type === 'boost') {
                        force = typeof this.boostForce === 'number' && !isNaN(this.boostForce) ? this.boostForce : -15;
                        sound = 'boost';
                        particleColor = '#8B00FF';
                    }

                    this.player.vy = force;

                    // Landing squash animation
                    this.player.scaleX = 1.3;
                    this.player.scaleY = 0.7;

                    // Reduce particles on mobile for performance
                    const particleCount = this.isMobile ? 3 : 6; // Fewer particles on mobile
                    this.createParticles(this.player.x + 8, this.player.y + 16, particleColor, particleCount);

                    if (sound === 'jump') {
                        this.audio.playJump();
                        this.screenShake = 2; // Light shake
                    } else {
                        this.audio.playBoost();
                        this.screenShake = 5; // Stronger shake for boost
                    }

                    // Stats
                    this.jumps++;

                    // Combo logic
                    if (this.player.y < this.highestY - 50) {
                        this.combo++;
                        if (this.combo > this.maxCombo) this.maxCombo = this.combo; // Track max combo
                        if (this.combo > 2) this.audio.playCombo();
                    } else {
                        this.combo = 0;
                    }
                    this.highestY = this.player.y;

                    // Platform effects
                    if (platform.type === 'breaking') {
                        platform.broken = true;
                        // Reduce particles on mobile for performance
                        const particleCount = this.isMobile ? 4 : 8; // Fewer particles on mobile
                        this.createParticles(platform.x + platform.width / 2, platform.y, '#FFFF00', particleCount);
                        this.audio.playBreak();
                        this.screenShake = 3; // Shake on platform break
                    }
                }
            }
        }

        // Update Biome based on height
        if (typeof updateBiome === 'function') {
            updateBiome(this);
        } else if (!this._biomeWarningShown) {
            console.warn('⚠️ updateBiome is not defined - biome system disabled');
            this._biomeWarningShown = true;
        }

        // Generate platforms & ensure minimum density
        while (this.nextPlatformY > this.cameraY - 100) {
            this.generatePlatform();
        }

        // COUNT platforms on screen and spawn more if needed
        const visiblePlatforms = this.platforms.filter(p =>
            p.y > this.cameraY && p.y < this.cameraY + this.canvas.height
        );
        if (visiblePlatforms.length < this.MIN_PLATFORMS_ON_SCREEN) {
            for (let i = visiblePlatforms.length; i < this.MIN_PLATFORMS_ON_SCREEN; i++) {
                this.generatePlatform();
            }
        }

        // Update platforms (moving) - skip on some frames on mobile for performance
        let platformUpdateFrame = true;
        // DISABLED MOBILE OPTIMIZATION for platforms to prevent stutter/disappearing feel
        // if (this.isMobile) {
        //    platformUpdateFrame = this.frameCount % 2 === 0;
        // }

        if (platformUpdateFrame) {
            for (let platform of this.platforms) {
                if (platform.type === 'moving') {
                    platform.x += platform.speed * platform.direction;
                    if (platform.x < 0 || platform.x + platform.width > this.canvas.width) {
                        platform.direction *= -1;
                    }
                }
            }
        }

        // Remove off-screen platforms (Increased buffer to 300px to prevent popping)
        this.platforms = this.platforms.filter(p => p.y < this.cameraY + this.canvas.height + 300);

        // Score
        const currentScore = Math.floor((-this.cameraY) / 10);
        if (currentScore > this.score) {
            this.score = currentScore;
        }

        // Game Over (with perk shield or Ghost second chance)
        if (this.player.y > this.cameraY + this.canvas.height) {
            // PERK SHIELD: Extra life from shield perk
            if (this.perkShieldActive && !this.perkShieldUsed) {
                console.log('🛡 SHIELD: Using perk extra life!');
                this.perkShieldUsed = true;
                this.player.y = this.cameraY + 300;
                this.player.vy = 0;
                this.screenShake = 5;
                this.audio.playBoost();
                // Reduce particles on mobile for performance
                const particleCount = this.isMobile ? 10 : 20; // Fewer particles on mobile
                this.createParticles(this.player.x + 8, this.player.y + 8, '#FFFF00', particleCount);
                return;
            }

            // GHOST ABILITY: Second chance
            if (this.secondChanceAvailable && !this.secondChanceUsed) {
                console.log('⬜ GHOST: Using second chance!');
                this.secondChanceUsed = true;
                this.player.y = this.cameraY + 300; // Teleport back up
                this.player.vy = 0;
                this.screenShake = 5;
                this.audio.playBoost(); // Play boost sound for revival
                if (typeof trackCharacterStats === 'function') {
                    trackCharacterStats(this, { type: 'second_chance_used' });
                }
                // Reduce particles on mobile for performance
                const particleCount = this.isMobile ? 10 : 20; // Fewer particles on mobile
                this.createParticles(this.player.x + 8, this.player.y + 8, '#FFFFFF', particleCount);
                return; // Don't trigger game over
            }

            this.audio.playGameOver();
            this.screenShake = 10; // Big shake on death
            this.stop();
            if (window.handleGameOver) window.handleGameOver();
            return 'gameover';
        }

        // Update Enemies - skip on some frames on mobile for performance
        let enemyUpdateFrame = true;
        if (this.isMobile) {
            enemyUpdateFrame = this.frameCount % 2 === 0; // Only update every other frame on mobile
        }

        if (enemyUpdateFrame) {
            for (let enemy of this.enemies) {
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;

                // Bounce off walls
                if (enemy.x <= 0 || enemy.x + enemy.width >= this.canvas.width) {
                    enemy.vx *= -1;
                }

                // Collision with player
                if (this.player.x < enemy.x + enemy.width &&
                    this.player.x + this.player.width > enemy.x &&
                    this.player.y < enemy.y + enemy.height &&
                    this.player.y + this.player.height > enemy.y) {
                    this.audio.playGameOver();
                    this.stop();
                    if (window.handleGameOver) window.handleGameOver();
                    return 'gameover';
                }
            }
        }

        // Remove off-screen enemies
        this.enemies = this.enemies.filter(e => e.y < this.cameraY + this.canvas.height + 100);

        // Update Particles - optimize for performance on mobile
        if (this.isMobile) {
            // Skip particle updates every other frame on mobile
            if (this.frameCount % 2 === 0) {
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    let p = this.particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life--;
                    if (p.life <= 0) this.particles.splice(i, 1);
                }
            }
        } else {
            // Update all particles on PC
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        }

        // Update skin effects — generate trail and effect particles
        if (this.skinEffects && this.activeSkin) {
            const effects = this.activeSkin.effects;

            // Generate trail particles if skin has trail
            if (effects?.trail && effects.trailColor) {
                // Add trail particle at player position every 3rd frame
                if (this.frameCount % 3 === 0) {
                    this.skinEffects.addTrailParticle(
                        this.player.x, this.player.y,
                        effects.trailColor,
                        effects.opacity || 1.0
                    );
                }
            }

            // Generate effect particles if skin has particles
            if (effects?.particles && effects.particleColor) {
                // Add effect particle every 5th frame to avoid overload
                if (this.frameCount % 5 === 0) {
                    this.skinEffects.addEffectParticle(
                        this.player.x + Math.random() * 16,
                        this.player.y + Math.random() * 16,
                        effects.particleType || 'sparks',
                        effects.particleColor
                    );
                }
            }

            this.skinEffects.update();
        }

        // Ghost Recording - only record on non-mobile devices
        if (this.ghost && !this.isMobile) {
            this.ghost.recordFrame(this.player.x, this.player.y);
        }
        this.frameCount++;
    }

    render() {
        this.ctx.imageSmoothingEnabled = false; // Strict pixel art

        // Apply screen shake to camera
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
        const effectiveCameraY = this.cameraY + shakeY;

        // Background with gradient
        // Use biome-specific gradient
        const gradient = getBiomeGradient(this.ctx, this.currentBiome);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars (parallax effect) - optimized for performance
        if (!this.isMobile || this.frameCount % 2 === 0) { // Only draw stars every other frame on mobile
            this.ctx.fillStyle = '#FFFFFF';
            for (let star of this.stars) {
                const starY = (star.y - effectiveCameraY * 0.5) % (this.canvas.height + 100);
                if (starY > 0 && starY < this.canvas.height) {
                    this.ctx.globalAlpha = star.brightness;
                    this.ctx.fillRect(Math.floor(star.x + shakeX), Math.floor(starY), 1, 1);
                }
            }
            this.ctx.globalAlpha = 1.0;
        }

        // Draw platforms (improved visuals)
        for (let platform of this.platforms) {
            if (platform.broken) continue;

            const platX = Math.floor(platform.x + shakeX);
            const platY = Math.floor(platform.y - effectiveCameraY);
            const platW = platform.width;
            const platH = Math.max(platform.height, 5); // Min 5px height for visibility

            const platformColor = getPlatformColor(platform.type, this.currentBiome);

            if (platform.type === 'fake') {
                this.ctx.globalAlpha = 0.5 + Math.sin(this.frameCount * 0.1) * 0.15;
            }

            // Shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.35)';
            this.ctx.fillRect(platX, platY + 2, platW, platH);

            // Main body
            this.ctx.fillStyle = platformColor;
            this.ctx.fillRect(platX, platY, platW, platH);

            // Top highlight (1px lighter stripe)
            this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.ctx.fillRect(platX, platY, platW, 1);

            // Special platform indicators
            if (platform.type === 'boost') {
                // Draw arrows on boost platforms
                const arrowX = platX + Math.floor(platW / 2);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(arrowX - 1, platY - 3, 2, 2);
                this.ctx.fillRect(arrowX - 3, platY - 1, 6, 1);
            } else if (platform.type === 'moving') {
                // Dots on moving platforms
                this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
                for (let dx = 4; dx < platW - 4; dx += 6) {
                    this.ctx.fillRect(platX + dx, platY + Math.floor(platH / 2), 1, 1);
                }
            } else if (platform.type === 'breaking') {
                // Crack lines
                this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
                this.ctx.fillRect(platX + Math.floor(platW * 0.3), platY + 1, 1, platH - 2);
                this.ctx.fillRect(platX + Math.floor(platW * 0.65), platY + 1, 1, platH - 2);
            }

            this.ctx.globalAlpha = 1.0;
        }

        // Draw Enemies
        for (let enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(Math.floor(enemy.x + shakeX), Math.floor(enemy.y - effectiveCameraY), 16, 16);

            // Enemy Eyes - only draw on higher performance devices
            if (!this.isMobile) {
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(Math.floor(enemy.x + shakeX) + 4, Math.floor(enemy.y - effectiveCameraY) + 4, 8, 2);
            }
        }

        // Draw Particles (2x2 px) - reduce particles on mobile for performance
        const particleDensity = this.isMobile ? 0.7 : 1.0; // Reduce particles on mobile
        for (let p of this.particles) {
            // Skip some particles on mobile to improve performance
            if (this.isMobile && Math.random() > particleDensity) continue;

            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 20;
            this.ctx.fillRect(Math.floor(p.x + shakeX), Math.floor(p.y - effectiveCameraY), 2, 2);
        }
        this.ctx.globalAlpha = 1.0;

        // Render skin effects (trail and particles) BEFORE player
        if (this.skinEffects) {
            // Render trail
            if (this.activeSkin?.effects?.trail) {
                this.skinEffects.renderTrail(effectiveCameraY);
            }

            // Render effect particles
            if (this.activeSkin?.effects?.particles) {
                this.skinEffects.renderEffects(effectiveCameraY);
            }
        }

        // ===== DRAW PLAYER =====
        const px = Math.floor(this.player.x + shakeX);
        const py = Math.floor(this.player.y - effectiveCameraY);

        const scaleX = this.player.scaleX || 1;
        const scaleY = this.player.scaleY || 1;
        const w = Math.floor(16 * scaleX);
        const h = Math.floor(16 * scaleY);
        const cx = px + 8;
        const cy = py + 8;
        const drawX = cx - w / 2;
        const drawY = cy - h / 2;

        // Apply glitch effect
        let glitchOffset = { x: 0, y: 0 };
        if (this.activeSkin?.effects?.glitch && this.skinEffects) {
            glitchOffset = this.skinEffects.applyGlitch(
                this.activeSkin.effects.glitchChance || 0.1
            );
        }

        // Apply glow
        if (this.activeSkin?.effects?.glow && this.skinEffects) {
            this.skinEffects.applyGlow(
                this.activeSkin.effects.glowColor || 'rgba(0, 255, 0, 0.5)',
                15
            );
        }

        // Pulse effect
        let pulseScale = 1.0;
        if (this.activeSkin?.effects?.pulse && this.player.vy > 0) {
            pulseScale = 1.0 + Math.sin(this.frameCount * 0.3) * 0.1;
        }

        // Opacity for ghost skin
        if (this.activeSkin?.effects?.opacity) {
            this.ctx.globalAlpha = this.activeSkin.effects.opacity;
        }

        const finalX = Math.floor(drawX + glitchOffset.x);
        const finalY = Math.floor(drawY + glitchOffset.y);
        const finalW = Math.floor(w * pulseScale);
        const finalH = Math.floor(h * pulseScale);

        // Try to render emoji/character, fallback to colored rectangle
        const emoji = this.activeSkin?.emoji || this.selectedCharacter?.emoji;
        let emojiDrawn = false;

        if (emoji && !this._emojiRenderFailed) {
            try {
                this.ctx.save();
                this.ctx.font = `${Math.max(finalW, finalH)}px serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                // Draw emoji centered on player position
                this.ctx.fillText(emoji, finalX + finalW / 2, finalY + finalH / 2 + 1);
                this.ctx.restore();
                emojiDrawn = true;
            } catch (e) {
                this._emojiRenderFailed = true; // Don't try again
            }
        }

        if (!emojiDrawn) {
            // Outline
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(finalX - 1, finalY - 1, finalW + 2, finalH + 2);

            // Body
            this.ctx.fillStyle = this.player.color || '#00FF00';
            this.ctx.fillRect(finalX, finalY, finalW, finalH);

            // Eyes
            const lookRight = this.player.vx >= 0;
            const eyeBaseX = lookRight ? finalX + Math.floor(finalW * 0.3) : finalX + Math.floor(finalW * 0.15);
            const eyeY = finalY + Math.floor(finalH * 0.3);
            const eyeGap = Math.floor(finalW * 0.35);

            // Eye whites
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(eyeBaseX, eyeY, 3, 3);
            this.ctx.fillRect(eyeBaseX + eyeGap, eyeY, 3, 3);

            // Pupils (move with velocity)
            const pupilOff = this.player.vx > 0 ? 1 : (this.player.vx < 0 ? -1 : 0);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(eyeBaseX + 1 + pupilOff, eyeY + 1, 1, 1);
            this.ctx.fillRect(eyeBaseX + eyeGap + 1 + pupilOff, eyeY + 1, 1, 1);

            // Mouth (changes with state)
            if (this.player.vy < -3) {
                // Jumping — open mouth
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(finalX + Math.floor(finalW * 0.35), finalY + Math.floor(finalH * 0.65), Math.floor(finalW * 0.3), 2);
            } else if (this.player.vy > 5) {
                // Falling fast — scared mouth
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(finalX + Math.floor(finalW * 0.35), finalY + Math.floor(finalH * 0.6), Math.floor(finalW * 0.3), 3);
            }
        }

        // Restore alpha
        this.ctx.globalAlpha = 1.0;

        // Clear glow
        if (this.activeSkin?.effects?.glow && this.skinEffects) {
            this.skinEffects.clearGlow();
        }

        // Draw Ghost if available and not on mobile
        if (this.ghost && !this.isMobile) {
            const ghostPos = this.ghost.getGhostPosition(this.frameCount);
            if (ghostPos) {
                this.ctx.globalAlpha = 0.3;
                const screenY = Math.floor(ghostPos.y - effectiveCameraY);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(Math.floor(ghostPos.x + shakeX), screenY, 16, 16);
                this.ctx.globalAlpha = 1.0;
            }
        }
    }

    start() {
        this.isRunning = true;
        this.cameraY = 0;
        this.score = 0;
        // this.highScore = 0; // Do not reset high score

        // RESET DIFFICULTY & PHYSICS
        // Re-apply current difficulty settings to ensure correct gap/gravity/speed
        this.setDifficulty(this.difficulty || 'normal');

        this.platformCounter = 0;

        // Initialize runtime physics variables (now handled by setDifficulty, but safety check)
        this.gravity = this.baseGravity || 0.4;
        this.friction = 0.98;

        // Forces - Add fallbacks to prevent NaN
        const jumpVal = this.baseJumpForce || -10;
        this.jumpForce = jumpVal;
        this.boostForce = jumpVal * 1.5;

        console.log(`🚀 Start Physics: Gravity=${this.gravity}, Jump=${this.jumpForce}, Boost=${this.boostForce}`);

        // Input handling
        this.keys = {
            left: false,
            right: false,
            up: false
        };

        this.combo = 0;
        this.lastCombo = 0;

        // Reset stats
        this.jumps = 0;
        this.maxCombo = 0;

        this.player.x = 180;
        this.player.y = 500;
        this.player.vx = 0;
        this.player.vy = 0;

        // Apply character color and abilities
        if (this.selectedCharacter) {
            this.player.color = this.selectedCharacter.color;
            applyCharacterAbility(this, this.selectedCharacter);
        }

        // Initialize character stats tracking
        this.characterStats = {
            character: this.selectedCharacter?.id || 'jumper',
            teleports: 0,
            secondChanceUsed: false,
            score: 0
        };

        this.platforms = [];
        this.enemies = [];
        this.particles = [];
        this.nextPlatformY = 600;
        this.initPlatforms();

        // Ghost - SAFELY START
        // On low-end mobile, recording causes crashes (OOM).
        // We disable it if screen is small (mobile indication) or explicit flag, or if device memory is less than 4GB.
        const isMobile = window.innerWidth < 800 || this.isMobile; // Simple check
        const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        const shouldDisableGhost = isMobile || hasLowMemory;
        
        if (!shouldDisableGhost && this.ghost) {
            try {
                this.ghost.startPlayback();
                this.ghost.startRecording();
            } catch (e) {
                console.warn('Ghost system error:', e);
            }
        } else {
            // console.log('Ghost disabled on mobile for stability');
        }

        this.frameCount = 0;

        // Loop is driven externally by main.js
    }

    teleportToSafePlatform() {
        // Find closest safe (normal) platform above player
        const safePlatforms = this.platforms.filter(p =>
            p.type === 'normal' &&
            !p.broken &&
            p.y < this.player.y &&
            p.y > this.cameraY
        );

        if (safePlatforms.length === 0) return; // No safe platforms

        // Sort by distance, get closest
        safePlatforms.sort((a, b) => {
            const distA = Math.abs(this.player.y - a.y);
            const distB = Math.abs(this.player.y - b.y);
            return distA - distB;
        });

        const targetPlatform = safePlatforms[0];

        // Teleport player above platform
        this.player.x = targetPlatform.x + targetPlatform.width / 2 - this.player.width / 2;
        this.player.y = targetPlatform.y - this.player.height - 5;
        this.player.vy = 0;

        // Visual feedback
        this.createParticles(this.player.x + 8, this.player.y + 8, '#8B00FF', 15);
        this.screenShake = 4;
        this.audio.playBoost(); // Reuse boost sound

        console.log('🟪 GLITCH: Teleported to safety!');
    }

    stop() {
        this.isRunning = false;

        // Properly stop ghost system if available
        if (this.ghost) {
            this.ghost.stopRecording();
            this.ghost.saveIfBest(this.score);
        }

        // Clear all particles to free memory
        this.particles = [];

        // Clear enemies
        this.enemies = [];

        // External loop will handle stopping based on isRunning or screen change
    }

    setTilt(x) {
        this.tiltX = x;
    }

    setInput(left, right) {
        this.leftPressed = left;
        this.rightPressed = right;
    }
}
