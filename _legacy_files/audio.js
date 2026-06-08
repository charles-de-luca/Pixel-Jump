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
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
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

    // Boost sound - enhanced jump sound
    playBoost() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create two oscillators for richer sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const merger = ctx.createChannelMerger(2);

        // Connect first oscillator
        osc1.connect(gain1);
        gain1.connect(merger, 0, 0);

        // Connect second oscillator (slightly detuned)
        osc2.connect(gain2);
        gain2.connect(merger, 0, 1);

        // Connect to destination
        merger.connect(ctx.destination);

        // Different wave types for richer sound
        osc1.type = 'square';
        osc2.type = 'triangle';

        // Higher frequency for boost sound
        const baseFreq = 300;
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.15);

        osc2.frequency.setValueAtTime(baseFreq * 1.2, now);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.15);

        // Volume envelope
        gain1.gain.setValueAtTime(this.volume * 0.7, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        gain2.gain.setValueAtTime(this.volume * 0.5, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.2);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}
