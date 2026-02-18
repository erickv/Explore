import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import './TechnoWorkstation.css';

interface DrumPattern {
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
  openhat: boolean[];
  crash: boolean[];
  clap: boolean[];
  ride: boolean[];
  perc: boolean[];
}

interface UploadedTrack {
  id: string;
  name: string;
  buffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  isPlaying: boolean;
}

const TechnoWorkstation: React.FC = () => {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const sequencerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synth state
  const [activePreset, setActivePreset] = useState('acidBass');
  const [synthParams, setSynthParams] = useState({
    cutoff: 50,
    resonance: 30,
    distortion: 20,
    volume: 70,
  });

  // Drum state
  const [activeDrums, setActiveDrums] = useState<string[]>([]);
  const [drumPattern, setDrumPattern] = useState<DrumPattern>({
    kick:    [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
    snare:   [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
    hihat:   [false,false,true,false,false,false,true,false,false,false,true,false,false,false,true,false],
    openhat: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
    crash:   Array(16).fill(false),
    clap:    Array(16).fill(false),
    ride:    Array(16).fill(false),
    perc:    Array(16).fill(false),
  });

  // Synth sequencer: each step is a note name or null
  const synthNotes = ['C','D','E','F','G','A','B'];
  const [synthPattern, setSynthPattern] = useState<(string | null)[]>(Array(16).fill(null));

  // FX sequencer: each step is an fx name or null
  const fxNames = ['SWEEP','NOISE','LASER','ZAPPER','RING','SUB'];
  const [fxPattern, setFxPattern] = useState<(string | null)[]>(Array(16).fill(null));

  // Keep refs so the sequencer interval always reads the latest
  const drumPatternRef = useRef(drumPattern);
  useEffect(() => { drumPatternRef.current = drumPattern; }, [drumPattern]);

  const synthPatternRef = useRef(synthPattern);
  useEffect(() => { synthPatternRef.current = synthPattern; }, [synthPattern]);

  const fxPatternRef = useRef(fxPattern);
  useEffect(() => { fxPatternRef.current = fxPattern; }, [fxPattern]);

  // Keep a ref to isPlaying for keyboard shortcut
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Uploaded tracks
  const [tracks, setTracks] = useState<UploadedTrack[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(true);

  const presets = [
    { id: 'acidBass', name: 'Acid Bass' },
    { id: 'leadPluck', name: 'Lead Pluck' },
    { id: 'warmPad', name: 'Warm Pad' },
    { id: 'analogBrass', name: 'Analog Brass' },
    { id: 'digitalLead', name: 'Digital Lead' },
    { id: 'fatBass', name: 'Fat Bass' },
  ];

  const drumRows: { key: keyof DrumPattern; label: string; engineId: string }[] = [
    { key: 'kick', label: 'KICK', engineId: 'kick' },
    { key: 'snare', label: 'SNARE', engineId: 'snare' },
    { key: 'hihat', label: 'HI-HAT', engineId: 'hihat' },
    { key: 'openhat', label: 'OH', engineId: 'openhat' },
    { key: 'crash', label: 'CRASH', engineId: 'crash' },
    { key: 'clap', label: 'CLAP', engineId: 'clap' },
    { key: 'ride', label: 'RIDE', engineId: 'ride' },
    { key: 'perc', label: 'PERC', engineId: 'perc' },
  ];

  const drumPads = [
    { label: 'KICK', id: 'kick' },
    { label: 'SNARE', id: 'snare' },
    { label: 'HI-HAT', id: 'hihat' },
    { label: 'OPEN HAT', id: 'openhat' },
    { label: 'CRASH', id: 'crash' },
    { label: 'CLAP', id: 'clap' },
    { label: 'RIDE', id: 'ride' },
    { label: 'PERC', id: 'perc' },
  ];

  // --- Audio helpers ---

  const toggleSynthStep = (step: number) => {
    setSynthPattern(prev => {
      const next = [...prev];
      if (next[step] === null) {
        next[step] = 'C'; // default to C
      } else {
        // cycle through notes, then back to null
        const idx = synthNotes.indexOf(next[step]!);
        if (idx < synthNotes.length - 1) {
          next[step] = synthNotes[idx + 1];
        } else {
          next[step] = null;
        }
      }
      return next;
    });
  };

  const toggleFxStep = (step: number) => {
    setFxPattern(prev => {
      const next = [...prev];
      if (next[step] === null) {
        next[step] = fxNames[0];
      } else {
        const idx = fxNames.indexOf(next[step]!);
        if (idx < fxNames.length - 1) {
          next[step] = fxNames[idx + 1];
        } else {
          next[step] = null;
        }
      }
      return next;
    });
  };

  const triggerDrum = (name: string) => {
    if (!isAudioInitialized) return;
    setActiveDrums(prev => [...prev, name]);
    audioEngine.playDrum(name);
    setTimeout(() => setActiveDrums(prev => prev.filter(d => d !== name)), 100);
  };

  const toggleDrumStep = (drum: keyof DrumPattern, step: number) => {
    setDrumPattern(prev => ({
      ...prev,
      [drum]: prev[drum].map((v, i) => (i === step ? !v : v)),
    }));
  };

  // --- File upload ---

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!isAudioInitialized) return;
    const audioFiles = Array.from(files).filter(f =>
      f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a|webm)$/i.test(f.name)
    );
    for (const file of audioFiles) {
      try {
        const buffer = await audioEngine.decodeAudioFile(file);
        const track: UploadedTrack = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          buffer,
          source: null,
          isPlaying: false,
        };
        setTracks(prev => [...prev, track]);
      } catch (err) {
        console.error(`Failed to decode ${file.name}:`, err);
      }
    }
  }, [isAudioInitialized]);

  const playTrack = (id: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.isPlaying && t.source) {
        t.source.stop();
        return { ...t, source: null, isPlaying: false };
      }
      const source = audioEngine.playSample(t.buffer);
      if (source) {
        source.onended = () => {
          setTracks(curr => curr.map(tr =>
            tr.id === id ? { ...tr, source: null, isPlaying: false } : tr
          ));
        };
      }
      return { ...t, source, isPlaying: true };
    }));
  };

  const removeTrack = (id: string) => {
    setTracks(prev => {
      const track = prev.find(t => t.id === id);
      if (track?.isPlaying && track.source) track.source.stop();
      return prev.filter(t => t.id !== id);
    });
  };

  const formatDuration = (buffer: AudioBuffer) => {
    const s = Math.round(buffer.duration);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- Drag & drop ---

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // --- Init ---

  const initializeAudio = async () => {
    try {
      await audioEngine.initialize();
      audioEngine.loadSynthPreset(activePreset);
      setIsAudioInitialized(true);
    } catch (err) {
      console.error('Audio init failed:', err);
    }
  };

  // --- Sequencer ---

  const stopSequencer = useCallback(() => {
    if (sequencerRef.current) clearInterval(sequencerRef.current);
    sequencerRef.current = null;
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const startSequencer = useCallback(() => {
    if (sequencerRef.current) clearInterval(sequencerRef.current);
    setIsPlaying(true);
    const stepTime = 60000 / (bpm * 4);
    sequencerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % 16;
        const p = drumPatternRef.current;
        if (p.kick[next]) audioEngine.playDrum('kick');
        if (p.snare[next]) audioEngine.playDrum('snare');
        if (p.hihat[next]) audioEngine.playDrum('hihat');
        if (p.openhat[next]) audioEngine.playDrum('openhat');
        if (p.crash[next]) audioEngine.playDrum('crash');
        if (p.clap[next]) audioEngine.playDrum('clap');
        if (p.ride[next]) audioEngine.playDrum('ride');
        if (p.perc[next]) audioEngine.playDrum('perc');
        // FX
        const fx = fxPatternRef.current[next];
        if (fx) audioEngine.playFx(fx);
        // Synth melody
        const note = synthPatternRef.current[next];
        if (note) {
          const freqMap: Record<string, number> = {
            'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
            'G': 392.00, 'A': 440.00, 'B': 493.88,
          };
          audioEngine.playNote(freqMap[note], 0.3);
        }
        return next;
      });
    }, stepTime);
  }, [bpm]);

  const toggleSequencer = useCallback(() => {
    if (!isAudioInitialized) return;
    if (isPlayingRef.current) {
      stopSequencer();
    } else {
      startSequencer();
    }
  }, [isAudioInitialized, stopSequencer, startSequencer]);

  const generateDnB = () => {
    if (!isAudioInitialized) return;
    const buffer = audioEngine.generateDnBSample();
    const id = `dnb-${Date.now()}`;
    const source = audioEngine.playSample(buffer);
    const track: UploadedTrack = {
      id,
      name: `DnB Loop (174 BPM)`,
      buffer,
      source,
      isPlaying: true,
    };
    if (source) {
      source.onended = () => {
        setTracks(curr => curr.map(tr =>
          tr.id === id ? { ...tr, source: null, isPlaying: false } : tr
        ));
      };
    }
    setTracks(prev => [...prev, track]);
  };

  const selectPreset = (id: string) => {
    setActivePreset(id);
    if (isAudioInitialized) audioEngine.loadSynthPreset(id);
  };

  const updateParam = (param: string, value: number) => {
    setSynthParams(prev => ({ ...prev, [param]: value }));
    if (isAudioInitialized) audioEngine.updateSynthParam(param, value);
  };

  // --- Effects ---

  useEffect(() => {
    if (isAudioInitialized) audioEngine.setMasterVolume(synthParams.volume);
  }, [synthParams.volume, isAudioInitialized]);

  // Restart sequencer when BPM changes while playing
  useEffect(() => {
    if (isPlayingRef.current && isAudioInitialized) {
      startSequencer();
    }
  }, [bpm, startSequencer, isAudioInitialized]);

  useEffect(() => {
    return () => { if (sequencerRef.current) clearInterval(sequencerRef.current); };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isAudioInitialized) return;
      if (e.code === 'Space') { e.preventDefault(); toggleSequencer(); }
      const drumMap: Record<string, string> = {
        '1':'kick','2':'snare','3':'hihat','4':'openhat',
        '5':'crash','6':'clap','7':'ride','8':'perc',
      };
      if (drumMap[e.key]) triggerDrum(drumMap[e.key]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioInitialized, isPlaying, drumPattern]);

  // --- Render ---

  if (!isAudioInitialized) {
    return (
      <div className="workstation">
        <div className="init-screen" onClick={initializeAudio}>
          <h1>BEATFORGE</h1>
          <p>Click anywhere to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workstation">
      {/* Transport */}
      <header className="transport">
        <h1>BEATFORGE</h1>
        <div className="transport-controls">
          <button className={`play-btn ${isPlaying ? 'active' : ''}`} onClick={toggleSequencer}>
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
          <div className="bpm-control">
            <label>BPM</label>
            <input
              type="number" value={bpm} min={60} max={200}
              onChange={e => setBpm(parseInt(e.target.value) || 120)}
            />
          </div>
          <div className="volume-control">
            <label>VOL</label>
            <input
              type="range" min={0} max={100} value={synthParams.volume}
              onChange={e => updateParam('volume', parseInt(e.target.value))}
            />
          </div>
        </div>
      </header>

      {/* Audio Upload */}
      <section className="section">
        <div className="section-header">
          <button className="toggle-btn" onClick={() => setSamplesOpen(prev => !prev)}>
            {samplesOpen ? '\u25BC' : '\u25B6'} SAMPLES
          </button>
          <div className="sample-actions">
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              UPLOAD
            </button>
            <button className="generate-btn" onClick={generateDnB}>
              GENERATE DnB
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {samplesOpen && (
          <div
            className={`drop-zone ${isDragging ? 'drag-over' : ''} ${tracks.length > 0 ? 'has-tracks' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {tracks.length === 0 && (
              <div className="drop-hint">
                Drop audio files here (MP3, WAV, OGG, FLAC)
              </div>
            )}
            {tracks.map(track => (
              <div key={track.id} className="track-row">
                <button
                  className={`track-play ${track.isPlaying ? 'active' : ''}`}
                  onClick={() => playTrack(track.id)}
                >
                  {track.isPlaying ? 'STOP' : 'PLAY'}
                </button>
                <div className="track-info">
                  <span className="track-name">{track.name}</span>
                  <span className="track-meta">{formatDuration(track.buffer)}</span>
                </div>
                <button className="track-remove" onClick={() => removeTrack(track.id)}>X</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sequencer */}
      <section className="section">
        <div className="section-header">
          <h2>SEQUENCER</h2>
          <div className="section-actions">
            <button onClick={() => {
              setDrumPattern({
                kick: Array(16).fill(false), snare: Array(16).fill(false),
                hihat: Array(16).fill(false), openhat: Array(16).fill(false),
                crash: Array(16).fill(false), clap: Array(16).fill(false),
                ride: Array(16).fill(false), perc: Array(16).fill(false),
              });
              setSynthPattern(Array(16).fill(null));
              setFxPattern(Array(16).fill(null));
            }}>CLEAR</button>
            <button onClick={() => {
              setDrumPattern({
                kick: Array(16).fill(0).map((_, i) => i % 4 === 0 || Math.random() > 0.7),
                snare: Array(16).fill(0).map((_, i) => i % 8 === 4),
                hihat: Array(16).fill(0).map(() => Math.random() > 0.5),
                openhat: Array(16).fill(0).map(() => Math.random() > 0.9),
                crash: Array(16).fill(0).map(() => Math.random() > 0.95),
                clap: Array(16).fill(0).map((_, i) => i % 8 === 4 ? Math.random() > 0.4 : false),
                ride: Array(16).fill(0).map((_, i) => i % 2 === 0 ? Math.random() > 0.6 : false),
                perc: Array(16).fill(0).map(() => Math.random() > 0.85),
              });
              setSynthPattern(Array(16).fill(null).map(() =>
                Math.random() > 0.6 ? synthNotes[Math.floor(Math.random() * synthNotes.length)] : null
              ));
              setFxPattern(Array(16).fill(null).map(() =>
                Math.random() > 0.85 ? fxNames[Math.floor(Math.random() * fxNames.length)] : null
              ));
            }}>RANDOM</button>
          </div>
        </div>
        <div className="sequencer-grid">
          {drumRows.map(({ key, label }) => (
            <div key={key} className="seq-row">
              <span className="seq-label">{label}</span>
              <div className="seq-steps">
                {drumPattern[key].map((on, i) => (
                  <button
                    key={i}
                    className={`step ${on ? 'on' : ''} ${isPlaying && currentStep === i ? 'current' : ''} ${i % 4 === 0 ? 'downbeat' : ''}`}
                    onClick={() => toggleDrumStep(key, i)}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Synth melody row */}
          <div className="seq-row synth-row">
            <span className="seq-label synth-label">SYNTH</span>
            <div className="seq-steps">
              {synthPattern.map((note, i) => (
                <button
                  key={i}
                  className={`step synth-step ${note ? 'on' : ''} ${isPlaying && currentStep === i ? 'current' : ''} ${i % 4 === 0 ? 'downbeat' : ''}`}
                  onClick={() => toggleSynthStep(i)}
                >
                  {note || ''}
                </button>
              ))}
            </div>
          </div>
          {/* FX row */}
          <div className="seq-row fx-row">
            <span className="seq-label fx-label">FX</span>
            <div className="seq-steps">
              {fxPattern.map((fx, i) => (
                <button
                  key={i}
                  className={`step fx-step ${fx ? 'on' : ''} ${isPlaying && currentStep === i ? 'current' : ''} ${i % 4 === 0 ? 'downbeat' : ''}`}
                  onClick={() => toggleFxStep(i)}
                >
                  {fx ? fx.slice(0, 3) : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Drum Pads + Synth */}
      <div className="two-col">
        <section className="section">
          <h2>DRUM PADS</h2>
          <div className="pad-grid">
            {drumPads.map((drum, i) => (
              <button
                key={drum.id}
                className={`pad ${activeDrums.includes(drum.id) ? 'hit' : ''}`}
                onClick={() => triggerDrum(drum.id)}
              >
                <span className="pad-name">{drum.label}</span>
                <span className="pad-key">{i + 1}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>SYNTH</h2>
          <div className="preset-row">
            {presets.map(p => (
              <button
                key={p.id}
                className={`preset ${activePreset === p.id ? 'active' : ''}`}
                onClick={() => selectPreset(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="knobs">
            {(['cutoff','resonance','distortion'] as const).map(param => (
              <div key={param} className="knob">
                <label>{param.toUpperCase()}</label>
                <input
                  type="range" min={0} max={100}
                  value={synthParams[param]}
                  onChange={e => updateParam(param, parseInt(e.target.value))}
                />
                <span>{synthParams[param]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="shortcuts">
        SPACE = Play/Stop &middot; 1-8 = Drums
      </footer>
    </div>
  );
};

export default TechnoWorkstation;
