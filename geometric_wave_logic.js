let scene, camera, renderer, analyser, dataArray;
let geometricObjects = [], waveLines = [], particleSystem;
let isPlaying = false, animationSpeed = 1, complexity = 5, currentTempo = 120, currentShapeStyle = 'wireframe';
let customAudio = null, audioSource = null;

let synth, basssynth, drumsynth, reverb, filter, compressor;
let sequence, bassSequence, drumSequence;
let currentMusicStyle = 'ambient';

const musicStyles = {
  ambient: {
    notes: ["C4", "E4", "G4", "B4", "D5", "F4", "A4", "C5"],
    bassNotes: ["C2", "F2", "G2", "C2"],
    rhythm: "4n",
    bassRhythm: "1n",
    synthType: "triangle",
    effects: { reverb: 6, filter: 1200 }
  },
  electronic: {
    notes: ["C4", "D4", "F4", "G4", "A4", "C5", "D5", "F5"],
    bassNotes: ["C2", "C2", "F2", "F2", "G2", "G2", "A2", "A2"],
    rhythm: "8n",
    bassRhythm: "4n",
    synthType: "sawtooth",
    effects: { reverb: 2, filter: 800 }
  }
  // Add more styles if needed
};

function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  document.getElementById('container').appendChild(renderer.domElement);
  camera.position.z = 50;

  scene.add(new THREE.AmbientLight(0x404040, 0.4));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
}

function initAudio() {
  reverb = new Tone.Reverb(4).toDestination();
  filter = new Tone.Filter(800, "lowpass").connect(reverb);
  compressor = new Tone.Compressor(-30, 3).connect(filter);

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
  }).connect(compressor);

  basssynth = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
  }).connect(compressor);

  drumsynth = new Tone.MembraneSynth().connect(compressor);
  analyser = new Tone.Analyser("fft", 32);
  compressor.connect(analyser);

  createSequences();
}

function createSequences() {
  sequence?.dispose();
  bassSequence?.dispose();
  drumSequence?.dispose();

  const style = musicStyles[currentMusicStyle];
  synth.set({ oscillator: { type: style.synthType } });
  reverb.roomSize.value = style.effects.reverb;
  filter.frequency.value = style.effects.filter;

  sequence = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(note, "8n", time);
  }, style.notes, style.rhythm);

  bassSequence = new Tone.Sequence((time, note) => {
    basssynth.triggerAttackRelease(note, "2n", time);
  }, style.bassNotes, style.bassRhythm);

  if (currentMusicStyle === 'electronic') {
    drumSequence = new Tone.Sequence((time, note) => {
      if (note) drumsynth.triggerAttackRelease(note, "16n", time);
    }, ["C1", null, "C1", null], "4n");
  }
}

function createGeometricObjects() {
  geometricObjects.forEach(obj => scene.remove(obj));
  geometricObjects = [];
  if (particleSystem) scene.remove(particleSystem);

  for (let i = 0; i < complexity; i++) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
      wireframe: true, transparent: true, opacity: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    );
    scene.add(mesh);
    geometricObjects.push(mesh);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (analyser) dataArray = analyser.getValue();

  geometricObjects.forEach((obj, i) => {
    obj.rotation.x += 0.01 * animationSpeed;
    obj.rotation.y += 0.01 * animationSpeed;
    if (dataArray?.[i]) {
      const scale = 1 + Math.abs(dataArray[i]) * 0.01;
      obj.scale.setScalar(scale);
    }
  });

  renderer.render(scene, camera);
}

function bindUIEvents() {
  document.getElementById("playBtn").addEventListener("click", async () => {
    await Tone.start();
    Tone.Transport.bpm.value = currentTempo;
    Tone.Transport.start();
    sequence.start();
    bassSequence.start();
    drumSequence?.start();
    isPlaying = true;
    document.getElementById("playBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
  });

  document.getElementById("stopBtn").addEventListener("click", () => {
    Tone.Transport.stop();
    sequence.stop();
    bassSequence.stop();
    drumSequence?.stop();
    isPlaying = false;
    document.getElementById("playBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
  });

  document.getElementById("volumeSlider").addEventListener("input", e => {
    Tone.Destination.volume.value = Tone.gainToDb(e.target.value);
  });

  document.getElementById("speedSlider").addEventListener("input", e => {
    animationSpeed = parseFloat(e.target.value);
  });

  document.getElementById("complexitySlider").addEventListener("input", e => {
    complexity = parseInt(e.target.value);
    createGeometricObjects();
  });

  document.getElementById("musicStyle").addEventListener("change", e => {
    currentMusicStyle = e.target.value;
    createSequences();
    if (isPlaying) {
      Tone.Transport.stop();
      sequence.stop();
      bassSequence.stop();
      drumSequence?.stop();
      Tone.Transport.start();
      sequence.start();
      bassSequence.start();
      drumSequence?.start();
    }
  });

  document.getElementById("tempoSlider").addEventListener("input", e => {
    currentTempo = parseInt(e.target.value);
    document.getElementById("tempoValue").textContent = `${currentTempo} BPM`;
    Tone.Transport.bpm.value = currentTempo;
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initThree();
  initAudio();
  createGeometricObjects();
  bindUIEvents();
  animate();
});
