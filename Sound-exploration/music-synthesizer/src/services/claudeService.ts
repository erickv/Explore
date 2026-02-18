import { AudioGenerationParams } from './types';

export class ClaudeService {
  /**
   * Enhanced prompt parsing with sophisticated musical intelligence
   */
  static async parsePrompt(prompt: string): Promise<AudioGenerationParams> {
    // Clean and normalize the input
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    // Enhanced BPM detection with common dance music tempos
    const bpmMatch = normalizedPrompt.match(/(\d+)\s*(?:bpm|beats?\s*per\s*minute)/i);
    let detectedBpm = bpmMatch ? parseInt(bpmMatch[1]) : null;
    
    // If no explicit BPM, infer from genre
    if (!detectedBpm) {
      detectedBpm = this.inferBpmFromGenre(normalizedPrompt);
    }

    // Enhanced key detection with major/minor and enharmonic equivalents
    const keyPattern = /\b([ABCDEFG](?:#|♯|b|♭)?)\s*(?:(major|minor|maj|min|m|M)\b)?/i;
    const keyMatch = normalizedPrompt.match(keyPattern);
    let detectedKey = null;
    if (keyMatch) {
      const note = keyMatch[1].replace('♯', '#').replace('♭', 'b');
      const quality = keyMatch[2];
      detectedKey = this.normalizeKey(note, quality);
    }

    // Sophisticated genre detection with subgenres
    const detectedGenre = this.detectGenre(normalizedPrompt);
    
    // Advanced mood analysis with emotional context
    const detectedMood = this.analyzeMood(normalizedPrompt);
    
    // Comprehensive instrument detection
    const detectedInstruments = this.detectInstruments(normalizedPrompt);
    
    // Energy level analysis
    const energyLevel = this.analyzeEnergyLevel(normalizedPrompt);
    
    // Format detection (loop, one-shot, sample, etc.)
    const formatType = this.detectFormat(normalizedPrompt);
    
    // Length detection
    const lengthInfo = this.detectLength(normalizedPrompt);
    
    // Effects and processing detection
    const detectedEffects = this.detectEffects(normalizedPrompt);
    
    // Musical style and reference detection
    const styleReferences = this.detectStyleReferences(normalizedPrompt);
    
    // Generate comprehensive tags
    const tags = this.generateTags(
      detectedGenre,
      detectedMood,
      detectedInstruments,
      energyLevel,
      detectedEffects,
      styleReferences
    );

    // Create detailed audio generation instructions
    const instructions = this.generateInstructions(prompt, {
      genre: detectedGenre,
      mood: detectedMood,
      instruments: detectedInstruments,
      energy: energyLevel,
      effects: detectedEffects,
      bpm: detectedBpm,
      key: detectedKey,
      format: formatType,
      length: lengthInfo
    });

    return {
      tags,
      bpm: detectedBpm,
      key: detectedKey,
      length: lengthInfo,
      genre: detectedGenre,
      mood: detectedMood,
      instruments: detectedInstruments,
      energy: energyLevel,
      format: formatType,
      effects: detectedEffects,
      styleReferences,
      audio_generation_instructions: instructions,
      confidence: this.calculateConfidence(normalizedPrompt)
    };
  }

  /**
   * Infer BPM from genre context
   */
  private static inferBpmFromGenre(prompt: string): number | null {
    const genreBpmMap: Record<string, [number, number]> = {
      'techno': [120, 135],
      'house': [120, 130],
      'trance': [128, 140],
      'dubstep': [140, 150],
      'trap': [140, 160],
      'drum.?n.?bass|dnb': [160, 180],
      'garage': [130, 140],
      'ambient': [60, 90],
      'downtempo': [80, 110],
      'breakbeat': [120, 140],
      'hip.?hop': [80, 120],
      'jazz': [90, 140],
      'funk': [100, 120],
      'disco': [110, 130]
    };

    for (const [genre, [min, max]] of Object.entries(genreBpmMap)) {
      if (new RegExp(genre, 'i').test(prompt)) {
        return Math.floor((min + max) / 2); // Return average BPM for genre
      }
    }
    return null;
  }

  /**
   * Normalize key notation
   */
  private static normalizeKey(note: string, quality?: string): string {
    const normalizedNote = note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
    
    if (!quality) return normalizedNote;
    
    const isMinor = /min|m/i.test(quality) && !/maj/i.test(quality);
    return isMinor ? `${normalizedNote}m` : normalizedNote;
  }

  /**
   * Advanced genre detection with subgenres
   */
  private static detectGenre(prompt: string): string {
    const genrePatterns: Record<string, RegExp> = {
      'minimal techno': /minimal\s+techno|minimalistic\s+techno/i,
      'acid techno': /acid\s+techno/i,
      'berlin techno': /berlin\s+techno|german\s+techno/i,
      'deep house': /deep\s+house/i,
      'tech house': /tech\s+house/i,
      'progressive house': /progressive\s+house|prog\s+house/i,
      'psytrance': /psy\s*trance|psychedelic\s+trance/i,
      'uplifting trance': /uplifting\s+trance|uplifting/i,
      'future bass': /future\s+bass/i,
      'liquid dnb': /liquid\s+(?:drum.?n.?bass|dnb)|liquid\s+d&b/i,
      'neurofunk': /neurofunk|neuro\s+(?:drum.?n.?bass|dnb)/i,
      'uk garage': /uk\s+garage|2.?step/i,
      'lo-fi hip hop': /lo.?fi\s+hip.?hop|lofi\s+hip.?hop/i,
      'trap': /trap(?:\s+music)?/i,
      'dubstep': /dubstep|dub\s+step/i,
      'techno': /\btechno\b/i,
      'house': /\bhouse\b/i,
      'trance': /\btrance\b/i,
      'ambient': /\bambient\b/i,
      'drum and bass': /drum.?n.?bass|dnb|d&b/i,
      'breakbeat': /breakbeat|break\s+beat/i,
      'garage': /\bgarage\b/i,
      'downtempo': /downtempo|down\s+tempo/i,
      'chillout': /chill\s*out|chillout/i,
      'electronic': /electronic|electro(?!nic)/i
    };

    for (const [genre, pattern] of Object.entries(genrePatterns)) {
      if (pattern.test(prompt)) {
        return genre;
      }
    }
    return 'electronic';
  }

  /**
   * Advanced mood analysis with emotional context
   */
  private static analyzeMood(prompt: string): string {
    const moodPatterns: Record<string, RegExp[]> = {
      'dark': [
        /\b(?:dark|sinister|evil|ominous|menacing|brooding|gloomy|shadowy|noir)\b/i,
        /\b(?:underground|industrial|harsh|brutal|intense)\b/i
      ],
      'bright': [
        /\b(?:bright|happy|cheerful|uplifting|euphoric|sunny|positive|joyful)\b/i,
        /\b(?:energetic|vibrant|lively|bouncy)\b/i
      ],
      'chill': [
        /\b(?:chill|relaxed|calm|peaceful|mellow|laid.?back|smooth|tranquil)\b/i,
        /\b(?:ambient|atmospheric|dreamy|floating)\b/i
      ],
      'aggressive': [
        /\b(?:aggressive|hard|intense|brutal|powerful|heavy|driving|punchy)\b/i,
        /\b(?:banging|pumping|slamming|crushing)\b/i
      ],
      'melancholic': [
        /\b(?:melancholic|sad|emotional|deep|introspective|contemplative)\b/i,
        /\b(?:nostalgic|wistful|yearning)\b/i
      ],
      'hypnotic': [
        /\b(?:hypnotic|mesmerizing|trance.?like|repetitive|meditative)\b/i,
        /\b(?:groove|rhythmic|pulsing)\b/i
      ],
      'futuristic': [
        /\b(?:futuristic|sci.?fi|cyberpunk|digital|synthetic|robotic)\b/i,
        /\b(?:space|cosmic|alien|technological)\b/i
      ]
    };

    for (const [mood, patterns] of Object.entries(moodPatterns)) {
      if (patterns.some(pattern => pattern.test(prompt))) {
        return mood;
      }
    }
    return 'neutral';
  }

  /**
   * Comprehensive instrument detection
   */
  private static detectInstruments(prompt: string): string[] {
    const instrumentPatterns: Record<string, RegExp> = {
      'kick': /\b(?:kick|bass\s+drum|808|909\s+kick|bd)\b/i,
      'snare': /\b(?:snare|sd|clap|snap)\b/i,
      'hi-hat': /\b(?:hi.?hat|hihat|hh|cymbals?)\b/i,
      'open hat': /\b(?:open\s+hat|oh|crash)\b/i,
      'bass': /\b(?:bass|sub|low.?end|bassline|wobble)\b/i,
      'lead': /\b(?:lead|melody|synth\s+lead|solo)\b/i,
      'pad': /\b(?:pad|strings|ambient|atmosphere|choir)\b/i,
      'arp': /\b(?:arp|arpeggio|arpeggiated|sequence)\b/i,
      'vocal': /\b(?:vocal|voice|singing|chant|spoken)\b/i,
      'piano': /\b(?:piano|keys|keyboard|electric\s+piano)\b/i,
      'guitar': /\b(?:guitar|strum|riff)\b/i,
      'brass': /\b(?:brass|trumpet|trombone|horn|sax)\b/i,
      'perc': /\b(?:percussion|perc|bongo|conga|shaker)\b/i,
      'fx': /\b(?:fx|effects?|sweep|riser|impact)\b/i
    };

    const detectedInstruments: string[] = [];
    for (const [instrument, pattern] of Object.entries(instrumentPatterns)) {
      if (pattern.test(prompt)) {
        detectedInstruments.push(instrument);
      }
    }
    return detectedInstruments;
  }

  /**
   * Energy level analysis
   */
  private static analyzeEnergyLevel(prompt: string): 'low' | 'medium' | 'high' {
    const highEnergyPatterns = [
      /\b(?:intense|energetic|powerful|driving|pumping|banging|hard|aggressive)\b/i,
      /\b(?:peak.?time|club|dancefloor|rave|festival)\b/i
    ];
    
    const lowEnergyPatterns = [
      /\b(?:minimal|quiet|soft|gentle|subtle|calm|peaceful|ambient)\b/i,
      /\b(?:chill|downtempo|slow|relaxed|mellow)\b/i
    ];

    if (highEnergyPatterns.some(pattern => pattern.test(prompt))) {
      return 'high';
    }
    if (lowEnergyPatterns.some(pattern => pattern.test(prompt))) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Format detection
   */
  private static detectFormat(prompt: string): string {
    const formatPatterns: Record<string, RegExp> = {
      'loop': /\b(?:loop|looping|repeat|cycle)\b/i,
      'one-shot': /\b(?:one.?shot|hit|stab|impact)\b/i,
      'sample': /\b(?:sample|clip|snippet)\b/i,
      'full track': /\b(?:full\s+track|song|complete|arrangement)\b/i,
      'pattern': /\b(?:pattern|sequence|groove)\b/i
    };

    for (const [format, pattern] of Object.entries(formatPatterns)) {
      if (pattern.test(prompt)) {
        return format;
      }
    }
    return 'loop';
  }

  /**
   * Length detection
   */
  private static detectLength(prompt: string): string {
    const lengthMatch = prompt.match(/(\d+)\s*(?:bar|measure|beat|second|minute)s?/i);
    if (lengthMatch) {
      const number = lengthMatch[1];
      const unit = lengthMatch[0].toLowerCase();
      if (unit.includes('bar') || unit.includes('measure')) {
        return `${number} bars`;
      }
      if (unit.includes('beat')) {
        return `${number} beats`;
      }
      if (unit.includes('second')) {
        return `${number} seconds`;
      }
      if (unit.includes('minute')) {
        return `${number} minutes`;
      }
    }
    return '8 bars';
  }

  /**
   * Effects detection
   */
  private static detectEffects(prompt: string): string[] {
    const effectPatterns: Record<string, RegExp> = {
      'reverb': /\b(?:reverb|echo|hall|room|space)\b/i,
      'delay': /\b(?:delay|echo|ping.?pong)\b/i,
      'distortion': /\b(?:distortion|overdrive|saturation|crunch)\b/i,
      'filter': /\b(?:filter|cutoff|resonance|sweep)\b/i,
      'compression': /\b(?:compression|compress|punch|tight)\b/i,
      'chorus': /\b(?:chorus|modulation|wide)\b/i,
      'phaser': /\b(?:phaser|phase|sweep)\b/i,
      'bitcrush': /\b(?:bitcrush|lo.?fi|digital|crushed)\b/i,
      'vinyl': /\b(?:vinyl|analog|warm|tape|crackle)\b/i
    };

    const detectedEffects: string[] = [];
    for (const [effect, pattern] of Object.entries(effectPatterns)) {
      if (pattern.test(prompt)) {
        detectedEffects.push(effect);
      }
    }
    return detectedEffects;
  }

  /**
   * Style references detection
   */
  private static detectStyleReferences(prompt: string): string[] {
    const stylePatterns: Record<string, RegExp> = {
      'berlin': /\b(?:berlin|german|berghain|tresor)\b/i,
      'uk': /\b(?:uk|british|london|manchester)\b/i,
      'detroit': /\b(?:detroit|motor\s+city)\b/i,
      'chicago': /\b(?:chicago|warehouse)\b/i,
      'ibiza': /\b(?:ibiza|balearic)\b/i,
      'underground': /\b(?:underground|indie|alternative)\b/i,
      'commercial': /\b(?:commercial|mainstream|radio)\b/i,
      'vintage': /\b(?:vintage|retro|classic|old.?school)\b/i,
      'modern': /\b(?:modern|contemporary|current|new.?school)\b/i
    };

    const detectedStyles: string[] = [];
    for (const [style, pattern] of Object.entries(stylePatterns)) {
      if (pattern.test(prompt)) {
        detectedStyles.push(style);
      }
    }
    return detectedStyles;
  }

  /**
   * Generate comprehensive tags
   */
  private static generateTags(
    genre: string,
    mood: string,
    instruments: string[],
    energy: string,
    effects: string[],
    styles: string[]
  ): string[] {
    const tags = [genre, mood, energy];
    tags.push(...instruments);
    tags.push(...effects);
    tags.push(...styles);
    
    // Remove duplicates and empty values
    return [...new Set(tags.filter(tag => tag && tag.trim()))];
  }

  /**
   * Generate detailed audio generation instructions
   */
  private static generateInstructions(
    originalPrompt: string,
    params: any
  ): string {
    const { genre, mood, instruments, energy, effects, bpm, key, format, length } = params;
    
    let instructions = `Generate ${originalPrompt}. `;
    
    if (genre && genre !== 'electronic') {
      instructions += `Focus on ${genre} style characteristics. `;
    }
    
    if (mood && mood !== 'neutral') {
      instructions += `Emphasize ${mood} mood and atmosphere. `;
    }
    
    if (energy) {
      instructions += `Maintain ${energy} energy level throughout. `;
    }
    
    if (instruments.length > 0) {
      instructions += `Include ${instruments.join(', ')} elements. `;
    }
    
    if (effects.length > 0) {
      instructions += `Apply ${effects.join(', ')} processing. `;
    }
    
    if (bpm) {
      instructions += `Tempo: ${bpm} BPM. `;
    }
    
    if (key) {
      instructions += `Key: ${key}. `;
    }
    
    if (format) {
      instructions += `Format as ${format}. `;
    }
    
    if (length) {
      instructions += `Length: ${length}. `;
    }
    
    return instructions.trim();
  }

  /**
   * Calculate confidence score based on detection accuracy
   */
  private static calculateConfidence(prompt: string): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for longer, more detailed prompts
    if (prompt.length > 50) confidence += 0.2;
    if (prompt.length > 100) confidence += 0.1;
    
    // Higher confidence for specific musical terms
    const musicalTerms = [
      /\b(?:bpm|tempo|key|scale|chord|progression)\b/i,
      /\b(?:kick|snare|bass|lead|pad|arp)\b/i,
      /\b(?:reverb|delay|filter|compression)\b/i,
      /\b(?:techno|house|trance|ambient|dubstep)\b/i
    ];
    
    musicalTerms.forEach(pattern => {
      if (pattern.test(prompt)) confidence += 0.05;
    });
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Validate parsed audio generation parameters
   */
  static validateParams(params: AudioGenerationParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.bpm && (params.bpm < 20 || params.bpm > 300)) {
      errors.push(`BPM ${params.bpm} is outside the typical range (20-300)`);
    }

    if (!params.genre) {
      errors.push('No genre detected — defaulting to electronic');
    }

    if (!params.instruments || params.instruments.length === 0) {
      errors.push('No instruments detected — consider specifying instruments');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate smart prompt suggestions based on context
   */
  static generateSuggestions(category: string = 'all'): string[] {
    const suggestions: Record<string, string[]> = {
      drums: [
        "Heavy 808 kick pattern with rolling hi-hats at 140 BPM, trap style",
        "Jazz-influenced breakbeat with vinyl crackle and swing, 85 BPM",
        "Aggressive techno kick with industrial percussion, Berlin underground style",
        "Minimal house groove with subtle ghost snares, 124 BPM",
        "Afrobeat polyrhythmic pattern with traditional percussion, 120 BPM",
        "UK garage shuffle with crisp snares and chopped hi-hats, 130 BPM",
        "Drum and bass break with jungle influences, 174 BPM",
        "Lo-fi hip hop beat with dusty samples and laid-back groove, 90 BPM"
      ],
      bass: [
        "Deep wobbling dubstep bass with LFO modulation and distortion",
        "Vintage Moog-style bass line in C minor with filter sweep",
        "Funky slap bass simulation with harmonics and groove, 110 BPM",
        "Dark minimal techno sub bass with heavy compression, 128 BPM",
        "Acid house TB-303 style bass with resonance and envelope",
        "Future bass wobbles with pitch bends and glitch effects",
        "Liquid drum and bass rolling bassline with warmth, 170 BPM",
        "Neurofunk distorted bass with complex modulation, 174 BPM"
      ],
      melody: [
        "Dreamy ambient pad with long reverb tail in A minor",
        "Staccato trance lead with arpeggiator, uplifting progression",
        "Warm analog strings with slow attack, orchestral arrangement",
        "Plucky house piano with jazz chords and subtle chorus",
        "Ethereal choir pad with formant filtering, celestial atmosphere",
        "Vintage synth lead with portamento and analog warmth",
        "Emotional progressive trance melody with builds and breakdowns",
        "Minimal techno sequence with hypnotic repetition, 127 BPM"
      ],
      effects: [
        "Add vintage tape saturation with wow and flutter characteristics",
        "Apply cathedral reverb with 4-second decay and early reflections",
        "Bitcrush effect for lo-fi digital distortion and character",
        "Analog delay with feedback modulation and vintage warmth",
        "Phaser sweep effect with variable rate and deep modulation",
        "Vinyl simulation with crackle, pop, and frequency roll-off",
        "Chorus ensemble with wide stereo imaging and movement",
        "Compressor with vintage character and musical punch"
      ],
      genre: [
        "Create authentic Berlin minimal techno with industrial elements",
        "Generate UK garage rhythm with syncopated percussion and bass",
        "Build progressive trance arrangement with emotional breakdown",
        "Design trap beat with 808 slides and rapid-fire hi-hats",
        "Compose deep house groove with soulful chord progressions",
        "Craft drum and bass track with jungle breaks and sub bass",
        "Produce ambient soundscape with field recordings and drones",
        "Make future bass drop with heavy wobbles and vocal chops"
      ]
    };

    if (category === 'all') {
      return Object.values(suggestions).flat().slice(0, 12);
    }
    
    return suggestions[category] || suggestions.drums;
  }
}