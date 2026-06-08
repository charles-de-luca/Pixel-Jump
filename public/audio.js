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
 * PIXEL JUMP - 8-bit Audio System
 * Procedural sound generation using Web Audio API
 */

export class PixelAudio {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;

        // Initialize on user interaction (required by browsers)
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            // Check if AudioContext is supported
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                this.initialized = true;
                // this.enabled = true; // REMOVED: Respect user setting set via setEnabled before init
                console.log('Audio initialized');
            } else {
                console.warn('Web Audio API not supported');
                this.enabled = false;
            }
        } catch (e) {
            console.warn('Audio init error:', e);
            this.enabled = false;
            this.initialized = false; // Allow retry? Or permanently disable?
        }
    }

    // Jump sound - short upward sweep
    playJump() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Oscillator for tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Square wave for 8-bit sound
        osc.type = 'square';

        // Frequency sweep (200Hz -> 600Hz)
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

        // Volume envelope
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Boost sound - longer, higher pitch sweep
    playBoost() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth'; // Sawtooth for "power" sound

        // Frequency sweep (400Hz -> 1200Hz)
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.3);

        // Volume envelope
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Platform break sound - descending noise
    playBreak() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';

        // Descending frequency
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Game over sound - sad descending tone
    playGameOver() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // First tone
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain1.gain.setValueAtTime(this.volume, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Second tone (delayed)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(300, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(150, now + 0.45);
        gain2.gain.setValueAtTime(this.volume, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.45);
    }

    // New record sound - triumphant fanfare
    playNewRecord() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Play a sequence of notes
        const notes = [
            { freq: 523, time: 0, duration: 0.15 },      // C5
            { freq: 659, time: 0.15, duration: 0.15 },   // E5
            { freq: 784, time: 0.3, duration: 0.3 }      // G5
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            gain.gain.setValueAtTime(this.volume, now + note.time);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

            osc.start(now + note.time);
            osc.stop(now + note.time + note.duration);
        });
    }

    // Combo sound - quick blip
    playCombo() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}
