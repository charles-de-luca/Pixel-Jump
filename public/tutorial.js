/**
 * tutorial.js - Completely rewritten tutorial system
 * Simple, reliable, no DOM manipulation issues
 */

export class TutorialManager {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentStep = 0;
        this.steps = [
            {
                text: '👋 Welcome to PIXEL JUMP!\n\nJump to the top & unlock cool skins!',
                showButton: true,
                pauseGame: true
            },
            {
                text: '🎮 TAP LEFT or RIGHT to move\n\nTry it now!',
                showButton: false,
                pauseGame: false,
                waitForInput: true,
                showHand: true
            },
            {
                text: '🟢 Land on platforms\n⚠️ Don\'t fall!',
                showButton: false,
                pauseGame: false,
                autoAdvance: 2500
            },
            {
                text: '🎯 Good luck!\n\nBeat the High Score!',
                showButton: false,
                pauseGame: false,
                autoAdvance: 2000
            }
        ];

        // DOM Elements
        this.container = null;
        this.textElement = null;
        this.buttonElement = null;
        this.handElement = null;

        this.inputCheckInterval = null;
    }

    init() {
        // Force TAP mode for tutorial to avoid confusion with Tilt
        if (window.controlMode !== 'tap') {
            console.log('Force enabling TAP mode for tutorial');
            window.controlMode = 'tap';
            localStorage.setItem('pixelJump_controlMode', 'tap');
        }

        // Check if tutorial was already completed
        if (localStorage.getItem('tutorial_completed') === 'true') {
            console.log('🎓 Tutorial already completed, skipping');
            return;
        }

        console.log('🎓 Starting Tutorial');
        this.createUI();
        this.isActive = true;
        this.showStep(0);
    }

    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'tutorial-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            pointer-events: none; /* Crucial for passing clicks */
            touch-action: none;
        `;

        // Input Forwarding (Failsafe for mobile)
        this.container.addEventListener('touchstart', (e) => {
            if (this.currentStep === 1) { // WaitForInput step
                this.handleInputForwarding(e);
            }
        }, { passive: false });

        this.container.addEventListener('mousedown', (e) => {
            if (this.currentStep === 1) {
                this.handleInputForwarding(e);
            }
        });

        // Message box
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #0f0;
            border-radius: 8px;
            padding: 25px 30px;
            max-width: 85%;
            text-align: center;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
            pointer-events: auto;
            margin-bottom: 60px;
        `;

        // Text element
        this.textElement = document.createElement('div');
        this.textElement.style.cssText = `
            color: #fff;
            font-family: 'Press Start 2P', monospace;
            font-size: 13px;
            line-height: 1.8;
            white-space: pre-line;
            margin-bottom: 20px;
        `;

        // Continue button
        this.buttonElement = document.createElement('button');
        this.buttonElement.textContent = 'CONTINUE ▶';
        this.buttonElement.style.cssText = `
            background: #0f0;
            color: #000;
            border: none;
            padding: 12px 24px;
            font-family: 'Press Start 2P', monospace;
            font-size: 11px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
            display: none;
        `;
        this.buttonElement.onmouseover = () => {
            this.buttonElement.style.background = '#0c0';
            this.buttonElement.style.transform = 'scale(1.05)';
        };
        this.buttonElement.onmouseout = () => {
            this.buttonElement.style.background = '#0f0';
            this.buttonElement.style.transform = 'scale(1)';
        };
        this.buttonElement.onclick = () => this.nextStep();

        // Hand pointer
        this.handElement = document.createElement('div');
        this.handElement.textContent = '👆';
        this.handElement.style.cssText = `
            position: absolute;
            font-size: 48px;
            display: none;
            animation: bounce 1s ease-in-out infinite;
            pointer-events: none;
        `;

        // Add bounce animation
        if (!document.getElementById('tutorial-animations')) {
            const style = document.createElement('style');
            style.id = 'tutorial-animations';
            style.textContent = `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `;
            document.head.appendChild(style);
        }

        // Assemble UI
        messageBox.appendChild(this.textElement);
        messageBox.appendChild(this.buttonElement);
        this.container.appendChild(messageBox);
        this.container.appendChild(this.handElement);
        document.body.appendChild(this.container);
    }

    handleInputForwarding(e) {
        if (!this.game) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const width = window.innerWidth;

        if (clientX < width / 2) {
            this.game.setInput(true, false); // Left
        } else {
            this.game.setInput(false, true); // Right
        }

        // Clear input after short delay (simulate tap)
        setTimeout(() => {
            if (this.game) this.game.setInput(false, false);
        }, 100);
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];

        // Update text
        this.textElement.textContent = step.text;
        this.textElement.style.opacity = '0';
        setTimeout(() => {
            this.textElement.style.transition = 'opacity 0.3s';
            this.textElement.style.opacity = '1';
        }, 50);

        // Handle game pause
        if (this.game) {
            this.game.isPaused = step.pauseGame;
            if (!step.pauseGame) {
                this.game.isRunning = true; // FORCE RUNNING

                // Ensure physics are active
                if (!this.game.animationFrameId && window.gameLoop) {
                    // If loop stopped, restart logic might be needed but usually isRunning=true is enough for engine
                    console.log('▶️ Resuming game for tutorial');
                }
            }
        }

        // Show/hide button
        if (step.showButton) {
            this.buttonElement.style.display = 'inline-block';
            this.buttonElement.style.pointerEvents = 'auto'; // Ensure clickable
            this.handElement.style.display = 'none';
        } else {
            this.buttonElement.style.display = 'none';
        }

        // Show hand pointer
        if (step.showHand) {
            this.handElement.style.display = 'block';
            this.handElement.style.right = '25%';
            this.handElement.style.bottom = '30%';
        } else {
            this.handElement.style.display = 'none';
        }

        // Wait for player input
        if (step.waitForInput) {
            this.waitForPlayerMovement();
        }

        // Auto advance
        if (step.autoAdvance) {
            setTimeout(() => this.nextStep(), step.autoAdvance);
        }
    }

    waitForPlayerMovement() {
        // Clear any existing interval
        if (this.inputCheckInterval) {
            clearInterval(this.inputCheckInterval);
        }

        // Check for player movement
        this.inputCheckInterval = setInterval(() => {
            if (this.game && this.game.player && Math.abs(this.game.player.vx) > 0.1) {
                clearInterval(this.inputCheckInterval);
                this.inputCheckInterval = null;

                // Give player a moment to see movement, then advance
                setTimeout(() => this.nextStep(), 1000);
            }
        }, 100);
    }

    nextStep() {
        // Clear input check if active
        if (this.inputCheckInterval) {
            clearInterval(this.inputCheckInterval);
            this.inputCheckInterval = null;
        }

        this.showStep(this.currentStep + 1);
    }

    complete() {
        console.log('✅ Tutorial Completed!');
        this.isActive = false;
        localStorage.setItem('tutorial_completed', 'true');

        // Fade out and remove
        if (this.container) {
            this.container.style.transition = 'opacity 0.5s';
            this.container.style.opacity = '0';

            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.container = null;
            }, 500);
        }

        // Unpause game
        if (this.game) {
            this.game.isPaused = false;
        }

        // Clean up intervals
        if (this.inputCheckInterval) {
            clearInterval(this.inputCheckInterval);
        }
    }

    // Optional: Add skip functionality
    skip() {
        console.log('⏭️ Tutorial Skipped');
        this.complete();
    }
}
