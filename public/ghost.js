/**
 * Ghost Replay System
 * Records and plays back player movements
 */
export class GhostSystem {
    constructor() {
        this.recording = [];
        this.bestRun = null;
        this.isRecording = false;
        this.isPlaying = false;
        this.startFrame = 0;
        this.frameCount = 0;

        this.loadBestRun();
    }

    startRecording() {
        this.recording = [];
        this.isRecording = true;
        this.frameCount = 0;
    }

    stopRecording() {
        this.isRecording = false;
    }

    recordFrame(playerX, playerY) {
        if (!this.isRecording) return;

        // Record only every 2nd frame to save space
        if (this.frameCount % 2 === 0) {
            // Compress data: x (int), y (int)
            this.recording.push(Math.round(playerX), Math.round(playerY));
        }
        this.frameCount++;
    }

    saveIfBest(score) {
        const currentBestScore = parseInt(localStorage.getItem('ghostBestScore') || '0');

        if (score > currentBestScore) {
            console.log('New Ghost Record!');
            localStorage.setItem('ghostBestScore', score);
            // Limit recording length to avoid localStorage limits (approx 2 minutes of gameplay keyframes)
            const limitedRecording = this.recording.slice(0, 7200);
            localStorage.setItem('ghostRunData', JSON.stringify(limitedRecording));
            this.bestRun = limitedRecording;
        }
    }

    loadBestRun() {
        const data = localStorage.getItem('ghostRunData');
        if (data) {
            try {
                this.bestRun = JSON.parse(data);
            } catch (e) {
                console.error('Failed to load ghost data', e);
            }
        }
    }

    startPlayback() {
        if (this.bestRun && this.bestRun.length > 0) {
            this.isPlaying = true;
            this.startFrame = 0;
        }
    }

    getGhostPosition(currentFrame) {
        if (!this.isPlaying || !this.bestRun) return null;

        // Since we recorded every 2nd frame
        const dataIndex = Math.floor(currentFrame / 2) * 2;

        if (dataIndex >= this.bestRun.length - 1) {
            this.isPlaying = false;
            return null;
        }

        return {
            x: this.bestRun[dataIndex],
            y: this.bestRun[dataIndex + 1]
        };
    }
}
