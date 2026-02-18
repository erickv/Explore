// Enhanced type definitions for the music synthesizer

export interface AudioGenerationParams {
  tags: string[];
  bpm: number | null;
  key: string | null;
  length: string;
  genre: string;
  mood: string;
  instruments: string[];
  energy: 'low' | 'medium' | 'high';
  format: string;
  effects?: string[];
  styleReferences?: string[];
  audio_generation_instructions: string;
  confidence?: number;
}

export interface DrumPattern {
  [step: number]: {
    [track: string]: boolean;
  };
}

export interface LoopState {
  isRecording: boolean;
  isPlaying: boolean;
  hasContent: boolean;
  pattern?: DrumPattern;
  bpm?: number;
  length?: number;
}

export interface SynthPreset {
  name: string;
  waveform: OscillatorType;
  filter: {
    type: BiquadFilterType;
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
  effects?: EffectSettings;
}

export interface EffectSettings {
  reverb?: {
    enabled: boolean;
    roomSize: number;
    decay: number;
    wetLevel: number;
  };
  delay?: {
    enabled: boolean;
    time: number;
    feedback: number;
    wetLevel: number;
  };
  filter?: {
    enabled: boolean;
    type: BiquadFilterType;
    frequency: number;
    Q: number;
  };
  distortion?: {
    enabled: boolean;
    amount: number;
    type: 'overdrive' | 'fuzz' | 'bitcrush';
  };
}

export interface ChordProgression {
  key: string;
  scale: string;
  chords: ChordInfo[];
}

export interface ChordInfo {
  root: number;
  type: ChordType;
  name: string;
  notes: string[];
  frequencies: number[];
}

export type ChordType = 
  | 'major' 
  | 'minor' 
  | 'dim' 
  | 'aug' 
  | 'sus2' 
  | 'sus4' 
  | 'maj7' 
  | 'min7' 
  | 'dom7'
  | '9th'
  | '11th'
  | '13th';

export interface MusicalScale {
  name: string;
  intervals: number[];
  modes?: string[];
}

export interface DrumTrack {
  name: string;
  key: string;
  color: string;
  velocity: number;
  muted: boolean;
  solo: boolean;
  effects?: EffectSettings;
}

export interface SequencerState {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  timeSignature: [number, number];
  swing: number;
  pattern: DrumPattern;
  tracks: Record<string, DrumTrack>;
  selectedTrack: string;
}

export interface VisualizerData {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  peakLevel: number;
  rmsLevel: number;
  isClipping: boolean;
}

export interface MIDINote {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
}

export interface AudioSettings {
  masterVolume: number;
  sampleRate: number;
  bufferSize: number;
  latency: number;
  enableEffects: boolean;
  enableCompression: boolean;
}

export interface ProjectState {
  name: string;
  version: string;
  createdAt: Date;
  lastModified: Date;
  bpm: number;
  key: string;
  timeSignature: [number, number];
  sequencer: SequencerState;
  synthesizer: {
    currentPreset: string;
    presets: Record<string, SynthPreset>;
    parameters: Record<string, number>;
  };
  loops: Record<string, LoopState>;
  effects: EffectSettings;
  audioSettings: AudioSettings;
}

export interface PromptCategory {
  name: string;
  description: string;
  examples: string[];
  tags: string[];
}

export interface AIResponse {
  success: boolean;
  data?: AudioGenerationParams;
  error?: string;
  suggestions?: string[];
  processingTime?: number;
}

export interface KeyBinding {
  key: string;
  action: string;
  description: string;
  category: 'drum' | 'synth' | 'transport' | 'general';
}

// Musical constants and utilities
export const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 
  'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

export const MUSICAL_SCALES: Record<string, MusicalScale> = {
  major: {
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    modes: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian']
  },
  minor: {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10]
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10]
  },
  mixolydian: {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10]
  },
  pentatonic: {
    name: 'Pentatonic',
    intervals: [0, 2, 4, 7, 9]
  },
  blues: {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10]
  },
  harmonic_minor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11]
  },
  melodic_minor: {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11]
  }
};

export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  '9th': [0, 4, 7, 10, 14],
  '11th': [0, 4, 7, 10, 14, 17],
  '13th': [0, 4, 7, 10, 14, 17, 21]
};

export const DRUM_TRACK_DEFAULTS: Record<string, DrumTrack> = {
  kick: { name: 'Kick', key: '1', color: '#ff0080', velocity: 1.0, muted: false, solo: false },
  snare: { name: 'Snare', key: '2', color: '#00ff88', velocity: 0.8, muted: false, solo: false },
  hihat: { name: 'Hi-Hat', key: '3', color: '#ffff00', velocity: 0.6, muted: false, solo: false },
  openhat: { name: 'Open Hat', key: '4', color: '#ff8800', velocity: 0.7, muted: false, solo: false },
  crash: { name: 'Crash', key: '5', color: '#8800ff', velocity: 0.9, muted: false, solo: false },
  clap: { name: 'Clap', key: '6', color: '#00ffff', velocity: 0.8, muted: false, solo: false },
  ride: { name: 'Ride', key: '7', color: '#ff4400', velocity: 0.7, muted: false, solo: false },
  perc: { name: 'Perc', key: '8', color: '#44ff00', velocity: 0.6, muted: false, solo: false }
};

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  // Drum machine
  { key: '1', action: 'playDrum:kick', description: 'Play Kick', category: 'drum' },
  { key: '2', action: 'playDrum:snare', description: 'Play Snare', category: 'drum' },
  { key: '3', action: 'playDrum:hihat', description: 'Play Hi-Hat', category: 'drum' },
  { key: '4', action: 'playDrum:openhat', description: 'Play Open Hat', category: 'drum' },
  { key: '5', action: 'playDrum:crash', description: 'Play Crash', category: 'drum' },
  { key: '6', action: 'playDrum:clap', description: 'Play Clap', category: 'drum' },
  { key: '7', action: 'playDrum:ride', description: 'Play Ride', category: 'drum' },
  { key: '8', action: 'playDrum:perc', description: 'Play Percussion', category: 'drum' },
  
  // Piano keys
  { key: 'a', action: 'playNote:C4', description: 'Play C4', category: 'synth' },
  { key: 'w', action: 'playNote:C#4', description: 'Play C#4', category: 'synth' },
  { key: 's', action: 'playNote:D4', description: 'Play D4', category: 'synth' },
  { key: 'e', action: 'playNote:D#4', description: 'Play D#4', category: 'synth' },
  { key: 'd', action: 'playNote:E4', description: 'Play E4', category: 'synth' },
  { key: 'f', action: 'playNote:F4', description: 'Play F4', category: 'synth' },
  { key: 't', action: 'playNote:F#4', description: 'Play F#4', category: 'synth' },
  { key: 'g', action: 'playNote:G4', description: 'Play G4', category: 'synth' },
  { key: 'y', action: 'playNote:G#4', description: 'Play G#4', category: 'synth' },
  { key: 'h', action: 'playNote:A4', description: 'Play A4', category: 'synth' },
  { key: 'u', action: 'playNote:A#4', description: 'Play A#4', category: 'synth' },
  { key: 'j', action: 'playNote:B4', description: 'Play B4', category: 'synth' },
  { key: 'k', action: 'playNote:C5', description: 'Play C5', category: 'synth' },
  
  // Transport
  { key: ' ', action: 'togglePlay', description: 'Play/Pause', category: 'transport' },
  { key: 'r', action: 'record', description: 'Record', category: 'transport' },
  { key: 'Escape', action: 'stop', description: 'Stop', category: 'transport' },
  
  // Octave control
  { key: '-', action: 'octaveDown', description: 'Octave Down', category: 'synth' },
  { key: '=', action: 'octaveUp', description: 'Octave Up', category: 'synth' },
  
  // General
  { key: 'Tab', action: 'nextPreset', description: 'Next Preset', category: 'general' },
  { key: 'c', action: 'clearPattern', description: 'Clear Pattern', category: 'drum' },
  { key: 'x', action: 'randomPattern', description: 'Random Pattern', category: 'drum' }
];

// Utility type for note frequencies
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
  'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
  'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50
};

// Export commonly used types
export type MusicalKey = typeof MUSICAL_KEYS[number];
export type ScaleName = keyof typeof MUSICAL_SCALES;
export type DrumTrackName = keyof typeof DRUM_TRACK_DEFAULTS;