/**
 * PIXEL JUMP - Core Game Engine
 * Vertical platformer mechanics
 */
import { GhostSystem } from './ghost.js';

export class PixelJumpGame {
    constructor(canvas, ctx, audio) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.audio = audio;
        this.ghost = new GhostSystem();
        this.frameCount = 0;

        // Entities
        this.enemies = [];
        this.particles = [];

        // Game state
        this.isRunning = false;
        this.score = 0;
        this.combo = 0;
        this.lastCombo = 0;

        // Player (16x16 px)
        this.player = {
            x: 180,
            y: 500,
            width: 16,
            height: 16,
            vx: 0,
            vy: 0,
            color: '#00FF00', // Green
            state: 'idle', // idle, jump, fall, boost
            onGround: false
        };

        // Physics
        this.gravity = 0.4;
        this.jumpForce = -10; // Adjusted for smaller scale
        this.boostForce = -18;
        this.moveSpeed = 4;
        this.tiltX = 0;

        // Platforms
        this.platforms = [];
        this.cameraY = 0;
        this.nextPlatformY = 600;
        this.platformGap = 60; // Closer gap for smaller platforms

        this.highestY = 0;
    }

    initPlatforms() {
        // Initial platform under player
        this.platforms.push({
            x: 180 - 24,
            y: 600,
            width: 48,
            height: 4,
            type: 'normal',
            broken: false
        });

        // Generate starting platforms
        for (let y = 550; y > 0; y -= this.platformGap) {
            this.generatePlatform(y);
        }
    }

    generatePlatform(yPosition) {
        const y = yPosition !== undefined ? yPosition : this.nextPlatformY;
        const width = (Math.floor(Math.random() * 4) + 3) * 8; // 24, 32, 40, 48
        const x = Math.random() * (this.canvas.width - width);

        let type = 'normal';
        const score = Math.floor((-this.cameraY) / 10);
        const rand = Math.random();

        // Progressive Difficulty
        if (score > 2500) {
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
            height: 4,
            type: type,
            broken: false,
            direction: Math.random() < 0.5 ? 1 : -1,
            speed: (1 + (score / 5000)) // Speed increases slightly with score
        });

        if (yPosition === undefined) {
            // Dynamic Gaps based on score
            // Safe maximum is ~120px. 
            let gap = 60; // Base gap

            if (score > 500) gap = 70;
            if (score > 1000) gap = 80;
            if (score > 2000) gap = 90;

            // Add some variance to gap
            const variance = (Math.random() * 20) - 10;
            this.nextPlatformY -= (gap + variance);
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
        for (let i = 0; i < count; i++) {
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

    update() {
        if (!this.isRunning) return;

        // Update player state
        if (this.player.vy < 0) this.player.state = 'jump';
        else if (this.player.vy > 0) this.player.state = 'fall';
        else this.player.state = 'idle';

        // Apply handling
        // Keyboard/Touch
        if (this.leftPressed) this.player.vx = -this.moveSpeed;
        else if (this.rightPressed) this.player.vx = this.moveSpeed;
        else if (this.tiltX !== 0) this.player.vx = this.tiltX * this.moveSpeed;
        else this.player.vx = 0;

        // Apply physics
        this.player.vy += this.gravity;
        this.player.x += this.player.vx;
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

                if (this.player.x + this.player.width > platform.x &&
                    this.player.x < platform.x + platform.width &&
                    this.player.y + this.player.height > platform.y &&
                    this.player.y + this.player.height < platform.y + platform.height + 10) {

                    // Jump
                    let force = this.jumpForce;
                    let sound = 'jump';
                    let particleColor = '#FFFFFF';

                    if (platform.type === 'boost') {
                        force = this.boostForce;
                        sound = 'boost'; // Need to implement boost sound
                        particleColor = '#8B00FF';
                    }

                    this.player.vy = force;
                    this.createParticles(this.player.x + 8, this.player.y + 16, particleColor, 6);

                    if (sound === 'jump') this.audio.playJump();
                    else this.audio.playBoost(); // Now implemented

                    // Combo logic
                    if (this.player.y < this.highestY - 50) {
                        this.combo++;
                        if (this.combo > 2) this.audio.playCombo();
                    } else {
                        this.combo = 0;
                    }
                    this.highestY = this.player.y;

                    // Platform effects
                    if (platform.type === 'breaking') {
                        platform.broken = true;
                        this.createParticles(platform.x + platform.width / 2, platform.y, '#FFFF00', 8);
                        this.audio.playBreak();
                    }
                }
            }
        }

        // Generate platforms
        if (this.nextPlatformY > this.cameraY - 100) {
            this.generatePlatform();
        }

        // Update platforms (moving)
        for (let platform of this.platforms) {
            if (platform.type === 'moving') {
                platform.x += platform.speed * platform.direction;
                if (platform.x < 0 || platform.x + platform.width > this.canvas.width) {
                    platform.direction *= -1;
                }
            }
        }

        // Remove off-screen platforms
        this.platforms = this.platforms.filter(p => p.y < this.cameraY + this.canvas.height + 100);

        // Score
        const currentScore = Math.floor((-this.cameraY) / 10);
        if (currentScore > this.score) {
            this.score = currentScore;
        }

        // Game Over
        if (this.player.y > this.cameraY + this.canvas.height) {
            this.audio.playGameOver();
            this.stop();
            if (window.handleGameOver) window.handleGameOver();
        }

        // Update Enemies
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
                return;
            }
        }

        // Remove off-screen enemies
        this.enemies = this.enemies.filter(e => e.y < this.cameraY + this.canvas.height + 100);

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Ghost Recording
        this.ghost.recordFrame(this.player.x, this.player.y);
        this.frameCount++;
    }

    render() {
        this.ctx.imageSmoothingEnabled = false; // Strict pixel art
        this.ctx.fillStyle = '#111111'; // Dark background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw platforms
        for (let platform of this.platforms) {
            if (platform.broken) continue;

            // NES Palette Colors
            if (platform.type === 'normal') this.ctx.fillStyle = '#00FF00'; // Green
            if (platform.type === 'breaking') this.ctx.fillStyle = '#FFFF00'; // Yellow
            if (platform.type === 'moving') this.ctx.fillStyle = '#0000FF'; // Blue
            if (platform.type === 'fake') this.ctx.fillStyle = '#FF0000'; // Red
            if (platform.type === 'boost') this.ctx.fillStyle = '#8B00FF'; // Purple

            if (platform.type === 'fake') this.ctx.globalAlpha = 0.8;

            this.ctx.fillRect(
                Math.floor(platform.x),
                Math.floor(platform.y - this.cameraY),
                platform.width,
                platform.height
            );

            this.ctx.globalAlpha = 1.0;
        }

        // Draw Enemies
        for (let enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(Math.floor(enemy.x), Math.floor(enemy.y - this.cameraY), 16, 16);

            // Enemy Eyes
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(Math.floor(enemy.x) + 4, Math.floor(enemy.y - this.cameraY) + 4, 8, 2);
        }

        // Draw Particles (2x2 px)
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y - this.cameraY), 2, 2);
        }

        // Draw Player (16x16)
        this.ctx.fillStyle = this.player.color || '#00FF00';
        const px = Math.floor(this.player.x);
        const py = Math.floor(this.player.y - this.cameraY);

        // 1px Outline
        this.ctx.fillStyle = '#FFFFFF'; // White outline
        this.ctx.fillRect(px - 1, py - 1, 18, 18);

        this.ctx.fillStyle = this.player.color || '#00FF00';
        this.ctx.fillRect(px, py, 16, 16);

        // Eyes (1px)
        this.ctx.fillStyle = 'black';
        const eyeOffset = this.player.vx > 0 ? 8 : 4;
        this.ctx.fillRect(px + eyeOffset, py + 4, 2, 2);
        this.ctx.fillRect(px + eyeOffset + 6, py + 4, 2, 2);

        // Draw Ghost
        const ghostPos = this.ghost.getGhostPosition(this.frameCount);
        if (ghostPos) {
            this.ctx.globalAlpha = 0.3;
            const screenY = Math.floor(ghostPos.y - this.cameraY);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(ghostPos.x, screenY, 16, 16);
            this.ctx.globalAlpha = 1.0;
        }
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.combo = 0;
        this.cameraY = 0;
        this.lastCombo = 0;

        this.player.x = 180;
        this.player.y = 500;
        this.player.vx = 0;
        this.player.vy = 0;
        this.platforms = [];
        this.enemies = [];
        this.particles = [];
        this.nextPlatformY = 600;
        this.initPlatforms();

        // Ghost
        this.ghost.startPlayback();
        this.ghost.startRecording();
        this.frameCount = 0;

        // Loop is driven externally by main.js
    }

    stop() {
        this.isRunning = false;
        this.ghost.stopRecording(this.score);
        this.ghost.saveIfBest(this.score);
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
