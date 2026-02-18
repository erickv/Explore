export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isInitialized: boolean = false;

  // Synthesizer state
  private synthPresets: Record<string, SynthPreset> = {};
  private currentPreset: SynthPreset | null = null;
  
  // Drum machine state
  private drumSamples: Record<string, AudioBuffer | null> = {};
  
  // Effects
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  constructor() {
    this.initializeSynthPresets();
  }

  /**
   * Initialize the audio context and master chain
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master audio chain
      this.masterGain = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      
      // Configure compressor for musical response
      this.compressor.threshold.setValueAtTime(-18, this.context.currentTime);
      this.compressor.knee.setValueAtTime(12, this.context.currentTime);
      this.compressor.ratio.setValueAtTime(3, this.context.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.context.currentTime);
      
      // Create effects
      await this.initializeEffects();
      
      // Connect master chain
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.context.destination);
      
      // Initialize drum samples
      await this.initializeDrumSamples();
      
      this.isInitialized = true;
      console.log('Audio Engine initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Audio Engine:', error);
      throw error;
    }
  }

  /**
   * Initialize effects nodes
   */
  private async initializeEffects(): Promise<void> {
    if (!this.context) return;

    // Create reverb impulse response
    this.reverbNode = this.context.createConvolver();
    const reverbBuffer = this.createReverbImpulse(2, 3, false);
    this.reverbNode.buffer = reverbBuffer;
    
    // Create delay
    this.delayNode = this.context.createDelay(1);
    this.delayNode.delayTime.setValueAtTime(0.3, this.context.currentTime);
    
    // Create filter
    this.filterNode = this.context.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(5000, this.context.currentTime);
    this.filterNode.Q.setValueAtTime(1, this.context.currentTime);
  }

  /**
   * Create impulse response for reverb
   */
  private createReverbImpulse(duration: number, decay: number, reverse: boolean): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      }
    }
    
    return impulse;
  }

  /**
   * Initialize synthesizer presets
   */
  private initializeSynthPresets(): void {
    this.synthPresets = {
      acidBass: {
        waveform: 'sawtooth',
        filter: { type: 'lowpass', frequency: 800, Q: 8 },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 },
        distortion: 0.3,
        volume: 0.7
      },
      leadPluck: {
        waveform: 'square',
        filter: { type: 'lowpass', frequency: 2000, Q: 2 },
        envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 1.0 },
        distortion: 0.1,
        volume: 0.6
      },
      warmPad: {
        waveform: 'sine',
        filter: { type: 'lowpass', frequency: 1500, Q: 1 },
        envelope: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 2.0 },
        distortion: 0.05,
        volume: 0.5
      },
      analogBrass: {
        waveform: 'sawtooth',
        filter: { type: 'lowpass', frequency: 1200, Q: 3 },
        envelope: { attack: 0.1, decay: 0.6, sustain: 0.7, release: 0.8 },
        distortion: 0.25,
        volume: 0.65
      },
      digitalLead: {
        waveform: 'triangle',
        filter: { type: 'lowpass', frequency: 3000, Q: 5 },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.5 },
        distortion: 0.4,
        volume: 0.6
      },
      fatBass: {
        waveform: 'sawtooth',
        filter: { type: 'lowpass', frequency: 600, Q: 6 },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.8, release: 0.7 },
        distortion: 0.5,
        volume: 0.8
      }
    };
  }

  /**
   * Initialize drum samples using synthesis
   */
  private async initializeDrumSamples(): Promise<void> {
    if (!this.context) return;

    // We'll create synthetic drum samples since we can't load external files
    this.drumSamples = {
      kick: await this.createKickSample(),
      snare: await this.createSnareSample(),
      hihat: await this.createHiHatSample(),
      openhat: await this.createOpenHatSample(),
      crash: await this.createCrashSample(),
      clap: await this.createClapSample(),
      ride: await this.createRideSample(),
      perc: await this.createPercSample()
    };
  }

  /**
   * Create kick drum sample
   */
  private async createKickSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.5;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      const frequency = 60 * Math.exp(-t * 20);
      const sine = Math.sin(2 * Math.PI * frequency * t);
      const click = Math.random() * 0.1 * Math.exp(-t * 50);
      data[i] = (sine + click) * envelope * 0.8;
    }
    
    return buffer;
  }

  /**
   * Create snare drum sample
   */
  private async createSnareSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.2;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15);
      const tone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.7;
      data[i] = (tone + noise) * envelope * 0.5;
    }
    
    return buffer;
  }

  /**
   * Create hi-hat sample
   */
  private async createHiHatSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.1;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 25);
      const noise = (Math.random() * 2 - 1);
      // High-pass filter simulation
      const filtered = noise * (1 - Math.exp(-t * 100));
      data[i] = filtered * envelope * 0.3;
    }
    
    return buffer;
  }

  /**
   * Create open hat sample
   */
  private async createOpenHatSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.3;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      const noise = (Math.random() * 2 - 1);
      const metallic = Math.sin(2 * Math.PI * 3000 * t) * 0.2;
      data[i] = (noise + metallic) * envelope * 0.4;
    }
    
    return buffer;
  }

  /**
   * Create crash sample
   */
  private async createCrashSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 1.0;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      const noise = (Math.random() * 2 - 1);
      const shimmer = Math.sin(2 * Math.PI * 5000 * t) * 0.3;
      data[i] = (noise + shimmer) * envelope * 0.6;
    }
    
    return buffer;
  }

  /**
   * Create clap sample
   */
  private async createClapSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.15;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create multiple quick bursts for clap effect
    const burstTimes = [0, 0.01, 0.03, 0.05];
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      for (const burstTime of burstTimes) {
        if (t >= burstTime && t < burstTime + 0.02) {
          const burstT = t - burstTime;
          const envelope = Math.exp(-burstT * 100);
          const noise = (Math.random() * 2 - 1);
          sample += noise * envelope;
        }
      }
      
      data[i] = sample * 0.4;
    }
    
    return buffer;
  }

  /**
   * Create ride sample
   */
  private async createRideSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.8;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      const bell = Math.sin(2 * Math.PI * 2000 * t) * 0.4;
      const sizzle = (Math.random() * 2 - 1) * 0.3;
      data[i] = (bell + sizzle) * envelope * 0.5;
    }
    
    return buffer;
  }

  /**
   * Create percussion sample
   */
  private async createPercSample(): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const sampleRate = this.context.sampleRate;
    const duration = 0.3;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 12);
      const tone = Math.sin(2 * Math.PI * 400 * t);
      const wood = (Math.random() * 2 - 1) * 0.2;
      data[i] = (tone + wood) * envelope * 0.6;
    }
    
    return buffer;
  }

  /**
   * Play drum sound
   */
  playDrum(drumType: string, velocity: number = 1.0): void {
    if (!this.context || !this.masterGain || !this.isInitialized) {
      console.warn('Audio engine not initialized');
      return;
    }

    const sample = this.drumSamples[drumType];
    if (!sample) {
      console.warn(`Drum sample not found: ${drumType}`);
      return;
    }

    try {
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      
      source.buffer = sample;
      gain.gain.setValueAtTime(velocity * 0.8, this.context.currentTime);
      
      source.connect(gain);
      gain.connect(this.masterGain);
      
      source.start();
      
    } catch (error) {
      console.error('Error playing drum:', error);
    }
  }

  /**
   * Load synthesizer preset
   */
  loadSynthPreset(presetName: string): void {
    const preset = this.synthPresets[presetName];
    if (preset) {
      this.currentPreset = { ...preset };
    } else {
      console.warn(`Preset not found: ${presetName}`);
    }
  }

  /**
   * Play synthesizer note
   */
  playNote(frequency: number, duration: number = 1.0, velocity: number = 1.0): void {
    if (!this.context || !this.masterGain || !this.currentPreset || !this.isInitialized) {
      console.warn('Audio engine or preset not ready');
      return;
    }

    try {
      const { waveform, filter, envelope, distortion, volume } = this.currentPreset;
      const now = this.context.currentTime;
      
      // Create oscillator
      const osc = this.context.createOscillator();
      osc.type = waveform as OscillatorType;
      osc.frequency.setValueAtTime(frequency, now);
      
      // Create filter
      const filterNode = this.context.createBiquadFilter();
      filterNode.type = filter.type as BiquadFilterType;
      filterNode.frequency.setValueAtTime(filter.frequency, now);
      filterNode.Q.setValueAtTime(filter.Q, now);
      
      // Create distortion
      const waveshaper = this.context.createWaveShaper();
      waveshaper.curve = this.createDistortionCurve(distortion);
      
      // Create envelope
      const gain = this.context.createGain();
      const sustainLevel = envelope.sustain * velocity * volume;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(velocity * volume, now + envelope.attack);
      gain.gain.linearRampToValueAtTime(sustainLevel, now + envelope.attack + envelope.decay);
      gain.gain.setValueAtTime(sustainLevel, now + duration - envelope.release);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      // Connect audio graph
      osc.connect(filterNode);
      filterNode.connect(waveshaper);
      waveshaper.connect(gain);
      gain.connect(this.masterGain);
      
      // Schedule start and stop
      osc.start(now);
      osc.stop(now + duration);
      
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  /**
   * Create distortion curve
   */
  private createDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  /**
   * Play a chord (multiple notes simultaneously)
   */
  playChord(notes: string[], duration: number = 1.0, velocity: number = 0.7): void {
    for (const note of notes) {
      const frequency = this.noteToFrequency(note);
      if (frequency) {
        this.playNote(frequency, duration, velocity);
      }
    }
  }

  /**
   * Convert note name (e.g. "C4") to frequency
   */
  private noteToFrequency(note: string): number | null {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const match = note.match(/^([A-Ga-g][#b]?)(\d)$/);
    if (!match) return null;

    const noteName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const octave = parseInt(match[2], 10);
    const semitone = noteMap[noteName];
    if (semitone === undefined) return null;

    return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
  }

  /**
   * Update synthesizer parameters
   */
  updateSynthParam(param: string, value: number): void {
    if (!this.currentPreset) return;
    
    switch (param) {
      case 'cutoff':
        this.currentPreset.filter.frequency = value * 50 + 100; // Map 0-100 to 100-5100 Hz
        break;
      case 'resonance':
        this.currentPreset.filter.Q = value * 0.3; // Map 0-100 to 0-30
        break;
      case 'distortion':
        this.currentPreset.distortion = value / 100;
        break;
      case 'volume':
        this.currentPreset.volume = value / 100;
        break;
      case 'attack':
        this.currentPreset.envelope.attack = (value / 100) * 2;
        break;
      case 'decay':
        this.currentPreset.envelope.decay = (value / 100) * 2;
        break;
      case 'sustain':
        this.currentPreset.envelope.sustain = value / 100;
        break;
      case 'release':
        this.currentPreset.envelope.release = (value / 100) * 3;
        break;
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume / 100, this.context?.currentTime || 0);
    }
  }

  /**
   * Get available drum types
   */
  getDrumTypes(): string[] {
    return Object.keys(this.drumSamples);
  }

  /**
   * Get available synth presets
   */
  getSynthPresets(): string[] {
    return Object.keys(this.synthPresets);
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.context !== null;
  }

  /**
   * Resume audio context (required for user interaction)
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Play an FX sound by name
   */
  playFx(fxName: string): void {
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;

    switch (fxName) {
      case 'SWEEP': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(8000, now + 0.15);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        filter.Q.setValueAtTime(10, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'NOISE': {
        const bufferSize = this.context.sampleRate * 0.15;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / this.context.sampleRate) * 20);
        }
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        source.buffer = noiseBuffer;
        gain.gain.setValueAtTime(0.35, now);
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(now);
        break;
      }
      case 'LASER': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3000, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'ZAPPER': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'RING': {
        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gain = this.context.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(530, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
        break;
      }
      case 'SUB': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
    }
  }

  /**
   * Load a user-provided audio file and return a decoded AudioBuffer
   */
  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.context) throw new Error('Audio context not initialized');
    const arrayBuffer = await file.arrayBuffer();
    return this.context.decodeAudioData(arrayBuffer);
  }

  /**
   * Play an AudioBuffer (for user-uploaded samples)
   */
  playSample(buffer: AudioBuffer, volume: number = 1.0): AudioBufferSourceNode | null {
    if (!this.context || !this.masterGain) return null;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    return source;
  }

  /**
   * Generate a drum and bass sample (approx 8 bars at 174 BPM)
   */
  generateDnBSample(): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');

    const sr = this.context.sampleRate;
    const bpm = 174;
    const beatLen = 60 / bpm; // seconds per beat
    const bars = 8;
    const duration = bars * 4 * beatLen;
    const totalSamples = Math.ceil(sr * duration);
    const buffer = this.context.createBuffer(2, totalSamples, sr);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const writeAt = (time: number, gen: (t: number) => number, len: number, vol: number, pan = 0) => {
      const start = Math.floor(time * sr);
      const count = Math.floor(len * sr);
      const lVol = vol * Math.min(1, 1 - pan);
      const rVol = vol * Math.min(1, 1 + pan);
      for (let i = 0; i < count && (start + i) < totalSamples; i++) {
        const s = gen(i / sr);
        left[start + i] += s * lVol;
        right[start + i] += s * rVol;
      }
    };

    // --- Kick ---
    const kick = (t: number) => {
      const env = Math.exp(-t * 10);
      const freq = 55 * Math.exp(-t * 15) + 45;
      return Math.sin(2 * Math.PI * freq * t) * env;
    };

    // --- Snare ---
    const snare = (t: number) => {
      const env = Math.exp(-t * 18);
      const tone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.7;
      return (tone + noise) * env;
    };

    // --- Hi-hat ---
    const hihat = (t: number) => {
      const env = Math.exp(-t * 40);
      return (Math.random() * 2 - 1) * env;
    };

    // --- Sub bass (reese-style) ---
    const bass = (t: number, freq: number, len: number) => {
      const env = Math.min(1, t * 20) * Math.min(1, (len - t) * 10);
      const saw1 = ((t * freq) % 1) * 2 - 1;
      const saw2 = ((t * (freq * 1.005)) % 1) * 2 - 1; // slight detune
      const lfo = Math.sin(2 * Math.PI * 3 * t) * 0.3;
      return (saw1 + saw2) * 0.35 * env * (1 + lfo * 0.2);
    };

    // --- DnB pattern per bar ---
    // Classic Amen-style pattern: kick on 1, snare on 2 & 4, hats throughout
    for (let bar = 0; bar < bars; bar++) {
      const barStart = bar * 4 * beatLen;

      // 16 sixteenths per bar
      for (let s = 0; s < 16; s++) {
        const t = barStart + s * (beatLen / 4);

        // Kick pattern: 1, &-of-2, 3 (varied per half)
        if (s === 0 || s === 6 || s === 8 || (bar % 2 === 1 && s === 10)) {
          writeAt(t, kick, 0.3, 0.85);
        }

        // Snare on beats 2 and 4 (steps 4 and 12)
        if (s === 4 || s === 12) {
          writeAt(t, snare, 0.2, 0.7);
        }
        // Ghost snares
        if (s === 7 || s === 14) {
          writeAt(t, snare, 0.12, 0.3);
        }

        // Hi-hats on every other sixteenth
        if (s % 2 === 0) {
          writeAt(t, hihat, 0.06, 0.25, 0.3);
        }
        // Offbeat hats (quieter)
        if (s % 4 === 2) {
          writeAt(t, hihat, 0.04, 0.15, -0.3);
        }
      }

      // Bass notes - alternating root and fifth, one per half-bar
      const bassNotes = [
        { freq: 55, start: barStart, len: 2 * beatLen },          // A1
        { freq: 55 * 1.5, start: barStart + 2 * beatLen, len: 1.5 * beatLen }, // E2
      ];
      // Every other bar, vary the progression
      if (bar % 4 >= 2) {
        bassNotes[0].freq = 65.41; // C2
        bassNotes[1].freq = 49;    // G1
      }

      for (const note of bassNotes) {
        writeAt(note.start, (t) => bass(t, note.freq, note.len), note.len, 0.6);
      }
    }

    // Soft-clip to prevent distortion
    for (let i = 0; i < totalSamples; i++) {
      left[i] = Math.tanh(left[i]);
      right[i] = Math.tanh(right[i]);
    }

    return buffer;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.context) {
      this.context.close();
      this.context = null;
      this.masterGain = null;
      this.compressor = null;
      this.isInitialized = false;
    }
  }
}

// Type definitions
interface SynthPreset {
  waveform: string;
  filter: {
    type: string;
    frequency: number;
    Q: number;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  distortion: number;
  volume: number;
}

// Export singleton instance
export const audioEngine = new AudioEngine();