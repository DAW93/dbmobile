

class AudioService {
    private audioContext: AudioContext | null = null;
    private oscillators: OscillatorNode[] = [];
    private gainNode: GainNode | null = null;
    private isPlaying = false;

    private init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    play(type: 'ringtone' | 'alarm') {
        if (this.isPlaying) this.stop();
        this.init();
        if (!this.audioContext) return;

        this.isPlaying = true;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime); // Set volume

        if (type === 'ringtone') {
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(941.0, this.audioContext.currentTime); // DTMF tone
            
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1477.0, this.audioContext.currentTime); // DTMF tone

            osc1.connect(this.gainNode);
            osc2.connect(this.gainNode);
            
            osc1.start();
            osc2.start();
            this.oscillators = [osc1, osc2];
        } else { // alarm
            const osc = this.audioContext.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, this.audioContext.currentTime);

            // Create a beeping effect
            this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.2);
            this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);

            osc.connect(this.gainNode);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
            
            // Loop the alarm sound
            const intervalId = setInterval(() => {
                if (!this.isPlaying || !this.audioContext) {
                    clearInterval(intervalId);
                    return;
                }
                const newOsc = this.audioContext.createOscillator();
                newOsc.type = 'square';
                newOsc.frequency.setValueAtTime(800, this.audioContext.currentTime);
                newOsc.connect(this.gainNode!);
                newOsc.start();
                newOsc.stop(this.audioContext.currentTime + 0.1);
                this.oscillators.push(newOsc);
            }, 500);
            this.oscillators.push(osc);
        }
    }

    stop() {
        if (!this.isPlaying) return;
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch(e) { /* Already stopped */ }
        });
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        this.oscillators = [];
        this.gainNode = null;
        this.isPlaying = false;
        // The interval for alarm needs to be cleared, but it's managed internally
        // by the isPlaying flag check.
    }
}

export const audioService = new AudioService();
