class TechnoWorkstation {
    constructor() {
        this.audioContext = null;
        this.selectedChord = null;
        this.currentNote = null;
        this.sequencerPlaying = false;
        this.arpeggioPlaying = false;
        this.drumSequencerPlaying = false;
        this.sequencerInterval = null;
        this.arpeggioInterval = null;
        this.drumSequencerInterval = null;
        this.gainNode = null;
        this.drumGain = null;
        this.limiter = null;
        this.currentOscillators = [];
        this.bpm = 128;
        
        // Note frequencies for keyboard
        this.noteFrequencies = {
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
            'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25
        };
        
        // Techno chord definitions
        this.chordDefinitions = {
            'Cm': [130.81, 155.56, 196.00],
            'Fm': [174.61, 207.65, 261.63],
            'Gm': [196.00, 233.08, 293.66],
            'Am': [220.00, 261.63, 329.63],
            'Dm': [146.83, 174.61, 220.00],
            'Em': [164.81, 196.00, 246.94],
            'Cm7': [130.81, 155.56, 196.00, 233.08],
            'Fm7': [174.61, 207.65, 261.63, 311.13],
            'Bdim': [123.47, 146.83, 174.61]
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create main gain node with lower volume
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.15;
            this.gainNode.connect(this.audioContext.destination);
            
            // Create drum gain node
            this.drumGain = this.audioContext.createGain();
            this.drumGain.gain.value = 0.6;
            this.drumGain.connect(this.gainNode);
            
            // Create master limiter to prevent distortion
            this.limiter = this.audioContext.createDynamicsCompressor();
            this.limiter.threshold.setValueAtTime(-6, this.audioContext.currentTime);
            this.limiter.knee.setValueAtTime(5, this.audioContext.currentTime);
            this.limiter.ratio.setValueAtTime(20, this.audioContext.currentTime);
            this.limiter.attack.setValueAtTime(0.003, this.audioContext.currentTime);
            this.limiter.release.setValueAtTime(0.1, this.audioContext.currentTime);
            this.limiter.connect(this.gainNode);
            
            this.setupEventListeners();
            this.createKeyboard();
            this.createVisualizer();
            this.startVisualizerAnimation();
            this.updateStatus('Audio system initialized! Click any chord to start.');
        } catch (error) {
            console.error('Audio initialization failed:', error);
            this.updateStatus('Audio not available. Click to enable audio.');
        }
    }
    
    updateStatus(message) {
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            statusDisplay.innerHTML = message;
        }
    }
    
    setupEventListeners() {
        // Chord buttons
        document.querySelectorAll('.chord-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectChord(e.target.dataset.chord);
                this.updateActiveChord(e.target);
                this.playChord();
            });
        });
        
        // Pattern controls
        const sequencerBtn = document.getElementById('sequencerBtn');
        const arpeggioBtn = document.getElementById('arpeggioBtn');
        
        if (sequencerBtn) sequencerBtn.addEventListener('click', () => this.toggleSequencer());
        if (arpeggioBtn) arpeggioBtn.addEventListener('click', () => this.toggleArpeggio());
        
        // Master volume control
        const masterVol = document.getElementById('masterVolume');
        if (masterVol) {
            masterVol.addEventListener('input', (e) => {
                if (this.gainNode) {
                    this.gainNode.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
                }
            });
        }
        
        // Drum volume control
        const drumVol = document.getElementById('drumVolume');
        if (drumVol) {
            drumVol.addEventListener('input', (e) => {
                if (this.drumGain) {
                    this.drumGain.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
                }
            });
        }
        
        // Drum pads
        document.querySelectorAll('.drum-pad').forEach(pad => {
            pad.addEventListener('click', (e) => {
                this.playDrum(e.target.dataset.drum);
                e.target.classList.add('active');
                setTimeout(() => e.target.classList.remove('active'), 100);
            });
        });
        
        // Drum sequencer
        const drumSeqBtn = document.getElementById('drumSequencerBtn');
        if (drumSeqBtn) drumSeqBtn.addEventListener('click', () => this.toggleDrumSequencer());
        
        // BPM control
        const bpmSlider = document.getElementById('bpmSlider');
        if (bpmSlider) {
            bpmSlider.addEventListener('input', (e) => {
                this.bpm = parseInt(e.target.value);
                const bpmDisplay = document.getElementById('bpmDisplay');
                if (bpmDisplay) bpmDisplay.textContent = `${this.bpm} BPM`;
                this.updateSequencerTiming();
            });
        }
        
        // Emergency stop - spacebar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.emergencyStop();
            }
        });
        
        // Computer keyboard for drums (number keys)
        document.addEventListener('keydown', (e) => {
            const drumMap = {
                'Digit1': 'kick', 'Digit2': 'snare', 'Digit3': 'hihat', 'Digit4': 'openhat',
                'Digit5': 'crash', 'Digit6': 'clap', 'Digit7': 'ride', 'Digit8': 'perc'
            };
            
            if (drumMap[e.code] && !e.repeat) {
                this.playDrum(drumMap[e.code]);
                const pad = document.querySelector(`[data-drum="${drumMap[e.code]}"]`);
                if (pad) {
                    pad.classList.add('active');
                    setTimeout(() => pad.classList.remove('active'), 100);
                }
            }
        });
        
        // Keyboard event listeners for notes
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Click anywhere to enable audio context
        document.addEventListener('click', async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                this.updateStatus('Audio enabled! Ready to play.');
            }
        }, { once: true });
    }
    
    createKeyboard() {
        const keyboard = document.getElementById('keyboard');
        if (!keyboard) return;
        
        keyboard.innerHTML = '';
        
        const keysContainer = document.createElement('div');
        keysContainer.className = 'keys-container';
        
        const whiteKeys = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
        const blackKeys = ['C#3', 'D#3', 'F#3', 'G#3', 'A#3', 'C#4', 'D#4'];
        
        // Create white keys
        whiteKeys.forEach((note) => {
            const key = document.createElement('div');
            key.className = 'key white';
            key.dataset.note = note;
            key.textContent = note.replace('3', '').replace('4', '');
            
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(note);
            });
            key.addEventListener('mouseup', () => this.stopNote(note));
            key.addEventListener('mouseleave', () => this.stopNote(note));
            
            keysContainer.appendChild(key);
        });
        
        // Create black keys
        blackKeys.forEach((note) => {
            const key = document.createElement('div');
            key.className = 'key black';
            key.dataset.note = note;
            key.textContent = note.replace('3', '').replace('4', '');
            
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(note);
            });
            key.addEventListener('mouseup', () => this.stopNote(note));
            key.addEventListener('mouseleave', () => this.stopNote(note));
            
            keysContainer.appendChild(key);
        });
        
        keyboard.appendChild(keysContainer);
    }
    
    selectChord(chordName) {
        this.selectedChord = chordName;
        const selectedChord = document.getElementById('selectedChord');
        if (selectedChord) selectedChord.textContent = `${chordName}`;
        this.updateStatus(`Selected chord: ${chordName} - Click to play!`);
    }
    
    updateActiveChord(activeBtn) {
        document.querySelectorAll('.chord-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }
    
    async playChord() {
        if (!this.selectedChord || !this.chordDefinitions[this.selectedChord]) return;
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        const frequencies = this.chordDefinitions[this.selectedChord];
        this.playTechnoChord(frequencies);
    }
    
    playNote(note) {
        if (this.currentNote === note) return;
        
        this.stopCurrentNote();
        this.currentNote = note;
        
        const frequency = this.noteFrequencies[note];
        if (!frequency) return;
        
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) key.classList.add('active');
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.playTechnoNote(frequency);
    }
    
    stopNote(note) {
        if (this.currentNote !== note) return;
        
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) key.classList.remove('active');
        
        this.stopCurrentNote();
    }
    
    stopCurrentNote() {
        if (this.currentOscillators.length > 0) {
            const now = this.audioContext.currentTime;
            this.currentOscillators.forEach(item => {
                if (item && typeof item.stop === 'function') {
                    try {
                        if (item.gain) {
                            item.gain.gain.setValueAtTime(item.gain.gain.value, now);
                            item.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                        }
                        item.stop(now + 0.05);
                    } catch (e) {
                        // Already stopped
                    }
                }
            });
            this.currentOscillators = [];
        }
        this.currentNote = null;
    }
    
    playTechnoNote(frequency) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const cutoff = document.getElementById('cutoffSlider')?.value || 2000;
        const resonance = Math.min(document.getElementById('resonanceSlider')?.value || 3, 15);
        const distortion = Math.min(document.getElementById('distortionSlider')?.value || 5, 30);
        
        this.stopCurrentNote();
        
        const oscillator = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, now);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, now);
        filter.Q.setValueAtTime(resonance, now);
        
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        
        oscillator.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.limiter);
        
        oscillator.start(now);
        
        this.currentOscillators = [oscillator, { gain: noteGain, stop: () => {} }];
    }
    
    playTechnoChord(frequencies) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const cutoff = document.getElementById('cutoffSlider')?.value || 2000;
        const resonance = Math.min(document.getElementById('resonanceSlider')?.value || 3, 15);
        const distortion = Math.min(document.getElementById('distortionSlider')?.value || 5, 30);
        
        this.stopCurrentNote();
        
        frequencies.forEach((freq) => {
            const oscillator = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq, now);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(cutoff, now);
            filter.Q.setValueAtTime(resonance, now);
            
            const noteVolume = 0.2 / frequencies.length;
            noteGain.gain.setValueAtTime(0, now);
            noteGain.gain.linearRampToValueAtTime(noteVolume, now + 0.01);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            
            oscillator.connect(filter);
            filter.connect(noteGain);
            noteGain.connect(this.limiter);
            
            oscillator.start(now);
            oscillator.stop(now + 0.8);
        });
    }
    
    handleKeyDown(e) {
        const keyMap = {
            'KeyA': 'C3', 'KeyW': 'C#3', 'KeyS': 'D3', 'KeyE': 'D#3', 'KeyD': 'E3',
            'KeyF': 'F3', 'KeyT': 'F#3', 'KeyG': 'G3', 'KeyY': 'G#3', 'KeyH': 'A3',
            'KeyU': 'A#3', 'KeyJ': 'B3', 'KeyK': 'C4', 'KeyO': 'C#4', 'KeyL': 'D4'
        };
        
        if (keyMap[e.code] && !e.repeat) {
            this.playNote(keyMap[e.code]);
        }
    }
    
    handleKeyUp(e) {
        const keyMap = {
            'KeyA': 'C3', 'KeyW': 'C#3', 'KeyS': 'D3', 'KeyE': 'D#3', 'KeyD': 'E3',
            'KeyF': 'F3', 'KeyT': 'F#3', 'KeyG': 'G3', 'KeyY': 'G#3', 'KeyH': 'A3',
            'KeyU': 'A#3', 'KeyJ': 'B3', 'KeyK': 'C4', 'KeyO': 'C#4', 'KeyL': 'D4'
        };
        
        if (keyMap[e.code]) {
            this.stopNote(keyMap[e.code]);
        }
    }
    
    // Drum Machine Methods
    playDrum(drumType) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        switch (drumType) {
            case 'kick':
                this.createKick(now);
                break;
            case 'snare':
                this.createSnare(now);
                break;
            case 'hihat':
                this.createHiHat(now);
                break;
            case 'openhat':
                this.createOpenHat(now);
                break;
            case 'crash':
                this.createCrash(now);
                break;
            case 'clap':
                this.createClap(now);
                break;
            case 'ride':
                this.createRide(now);
                break;
            case 'perc':
                this.createPerc(now);
                break;
        }
    }
    
    createKick(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, time);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.drumGain);
        
        osc.start(time);
        osc.stop(time + 0.5);
    }
    
    createSnare(time) {
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);
        
        noiseGain.gain.setValueAtTime(0.8, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.drumGain);
        
        noise.start(time);
        noise.stop(time + 0.2);
    }
    
    createHiHat(time) {
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        
        const noise = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.drumGain);
        
        noise.start(time);
        noise.stop(time + 0.1);
    }
    
    createOpenHat(time) {
        this.createHiHat(time);
    }
    
    createCrash(time) {
        const bufferSize = this.audioContext.sampleRate * 1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
        }
        
        const noise = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, time);
        filter.Q.setValueAtTime(1, time);
        
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.drumGain);
        
        noise.start(time);
        noise.stop(time + 1);
    }
    
    createClap(time) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createSnare(time + i * 0.01);
            }, i * 10);
        }
    }
    
    createRide(time) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(800, time);
        osc2.frequency.setValueAtTime(1200, time);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.Q.setValueAtTime(5, time);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.drumGain);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.3);
        osc2.stop(time + 0.3);
    }
    
    createPerc(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(200, time + 0.1);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(gain);
        gain.connect(this.drumGain);
        
        osc.start(time);
        osc.stop(time + 0.1);
    }
    
    toggleSequencer() {
        const btn = document.getElementById('sequencerBtn');
        if (!btn) return;
        
        if (this.sequencerPlaying) {
            this.stopSequencer();
            btn.textContent = 'Chord Seq';
            btn.classList.remove('active');
        } else {
            this.startSequencer();
            btn.textContent = 'Stop Seq';
            btn.classList.add('active');
        }
    }
    
    startSequencer() {
        if (!this.selectedChord) {
            this.updateStatus('Select a chord first!');
            return;
        }
        
        this.sequencerPlaying = true;
        const pattern = [1, 0, 0, 0, 1, 0, 1, 0];
        let stepIndex = 0;
        const stepTime = (60 / this.bpm / 4) * 1000;
        
        this.sequencerInterval = setInterval(() => {
            if (pattern[stepIndex] && this.selectedChord) {
                this.playChord();
            }
            stepIndex = (stepIndex + 1) % pattern.length;
        }, stepTime);
    }
    
    stopSequencer() {
        this.sequencerPlaying = false;
        if (this.sequencerInterval) {
            clearInterval(this.sequencerInterval);
            this.sequencerInterval = null;
        }
    }
    
    toggleArpeggio() {
        const btn = document.getElementById('arpeggioBtn');
        if (!btn) return;
        
        if (this.arpeggioPlaying) {
            this.stopArpeggio();
            btn.textContent = 'Arpeggio';
            btn.classList.remove('active');
        } else {
            this.startArpeggio();
            btn.textContent = 'Stop Arp';
            btn.classList.add('active');
        }
    }
    
    startArpeggio() {
        if (!this.selectedChord) {
            this.updateStatus('Select a chord first!');
            return;
        }
        
        this.arpeggioPlaying = true;
        const frequencies = this.chordDefinitions[this.selectedChord];
        let noteIndex = 0;
        const noteTime = (60 / this.bpm / 4) * 1000;
        
        this.arpeggioInterval = setInterval(() => {
            this.playTechnoNote(frequencies[noteIndex]);
            noteIndex = (noteIndex + 1) % frequencies.length;
        }, noteTime);
    }
    
    stopArpeggio() {
        this.arpeggioPlaying = false;
        if (this.arpeggioInterval) {
            clearInterval(this.arpeggioInterval);
            this.arpeggioInterval = null;
        }
    }
    
    toggleDrumSequencer() {
        const btn = document.getElementById('drumSequencerBtn');
        if (!btn) return;
        
        if (this.drumSequencerPlaying) {
            this.stopDrumSequencer();
            btn.textContent = 'Start Drums';
            btn.classList.remove('active');
        } else {
            this.startDrumSequencer();
            btn.textContent = 'Stop Drums';
            btn.classList.add('active');
        }
    }
    
    startDrumSequencer() {
        this.drumSequencerPlaying = true;
        const pattern = [
            {kick: 1, snare: 0, hihat: 1},
            {kick: 0, snare: 0, hihat: 1},
            {kick: 0, snare: 1, hihat: 1},
            {kick: 0, snare: 0, hihat: 1},
            {kick: 1, snare: 0, hihat: 1},
            {kick: 0, snare: 0, hihat: 1},
            {kick: 0, snare: 1, hihat: 1},
            {kick: 0, snare: 0, hihat: 1}
        ];
        
        let stepIndex = 0;
        const stepTime = (60 / this.bpm / 4) * 1000;
        
        this.drumSequencerInterval = setInterval(() => {
            const step = pattern[stepIndex];
            if (step.kick) this.playDrum('kick');
            if (step.snare) this.playDrum('snare');
            if (step.hihat) this.playDrum('hihat');
            
            stepIndex = (stepIndex + 1) % pattern.length;
        }, stepTime);
    }
    
    stopDrumSequencer() {
        this.drumSequencerPlaying = false;
        if (this.drumSequencerInterval) {
            clearInterval(this.drumSequencerInterval);
            this.drumSequencerInterval = null;
        }
    }
    
    updateSequencerTiming() {
        if (this.sequencerPlaying) {
            this.stopSequencer();
            this.startSequencer();
        }
        if (this.arpeggioPlaying) {
            this.stopArpeggio();
            this.startArpeggio();
        }
        if (this.drumSequencerPlaying) {
            this.stopDrumSequencer();
            this.startDrumSequencer();
        }
    }
    
    emergencyStop() {
        this.stopCurrentNote();
        this.stopSequencer();
        this.stopArpeggio();
        this.stopDrumSequencer();
        
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext.currentTime);
            this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            setTimeout(() => {
                const masterVol = document.getElementById('masterVolume');
                if (masterVol && this.gainNode) {
                    this.gainNode.gain.setValueAtTime(parseFloat(masterVol.value), this.audioContext.currentTime);
                }
            }, 200);
        }
        
        this.updateStatus('Emergency stop activated!');
    }
    
    createVisualizer() {
        const visualizer = document.getElementById('visualizer');
        if (!visualizer) return;
        
        for (let i = 0; i < 32; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            visualizer.appendChild(bar);
        }
    }
    
    startVisualizerAnimation() {
        const bars = document.querySelectorAll('.bar');
        
        setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 50 + 10;
                bar.style.height = height + 'px';
            });
        }, 100);
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    new TechnoWorkstation();
});
