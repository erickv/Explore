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
            this.updateStatus('Audio system initialized! Ready to play.');
        } catch (error) {
            console.error('Audio initialization failed:', error);
            this.updateStatus('Audio not available. Please check browser settings.');
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
        document.getElementById('sequencerBtn').addEventListener('click', () => this.toggleSequencer());
        document.getElementById('arpeggioBtn').addEventListener('click', () => this.toggleArpeggio());
        
        // Master volume control
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            if (this.gainNode) {
                this.gainNode.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            }
        });
        
        // Drum volume control
        document.getElementById('drumVolume').addEventListener('input', (e) => {
            if (this.drumGain) {
                this.drumGain.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            }
        });
        
        // Drum pads
        document.querySelectorAll('.drum-pad').forEach(pad => {
            pad.addEventListener('click', (e) => {
                this.playDrum(e.target.dataset.drum);
                e.target.classList.add('active');
                setTimeout(() => e.target.classList.remove('active'), 100);
            });
        });
        
        // Drum sequencer
        document.getElementById('drumSequencerBtn').addEventListener('click', () => this.toggleDrumSequencer());
        
        // BPM control
        document.getElementById('bpmSlider').addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            document.getElementById('bpmDisplay').textContent = `${this.bpm} BPM`;
            this.updateSequencerTiming();
        });
        
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
                'Digit5': 'crash', 'Digit6': 'clap', 'Digit7': 'ride', 'Digit8': 'perc
