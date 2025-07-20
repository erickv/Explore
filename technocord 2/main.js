
// main.js — Synth + Drum + Visualizer

const synth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, release: 0.8 } }).toDestination();
const masterGain = new Tone.Volume(0).toDestination();
synth.connect(masterGain);

document.getElementById("cutoffSlider").oninput = e => {
  synth.filter = new Tone.Filter(parseFloat(e.target.value), "lowpass").toDestination();
};
document.getElementById("attackSlider").oninput = e => {
  synth.envelope.attack = parseFloat(e.target.value);
};
document.getElementById("releaseSlider").oninput = e => {
  synth.envelope.release = parseFloat(e.target.value);
};
document.getElementById("masterVolume").oninput = e => {
  masterGain.volume.value = Tone.gainToDb(parseFloat(e.target.value));
};

const chords = ["Cm", "Fm", "Gm", "Am", "Dm", "Em", "Cm7", "Fm7", "Bdim"];
const chordNotes = {
  Cm: ["C4", "D#4", "G4"], Fm: ["F4", "G#4", "C5"], Gm: ["G3", "A#3", "D4"],
  Am: ["A3", "C4", "E4"], Dm: ["D3", "F3", "A3"], Em: ["E3", "G3", "B3"],
  Cm7: ["C4", "D#4", "G4", "A#4"], Fm7: ["F3", "G#3", "C4", "D#4"],
  Bdim: ["B3", "D4", "F4"]
};
const chordContainer = document.querySelector(".chord-buttons");
const selectedChordLabel = document.getElementById("selectedChord");

chords.forEach(chord => {
  const btn = document.createElement("button");
  btn.classList.add("chord-btn");
  btn.textContent = chord;
  btn.onclick = () => {
    document.querySelectorAll(".chord-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedChordLabel.textContent = chord;
    chordNotes[chord].forEach((note, i) => synth.triggerAttackRelease(note, "8n", Tone.now() + i * 0.05));
  };
  chordContainer.appendChild(btn);
});

const drumSounds = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination(),
  hihat: new Tone.Player("samples/hihat.wav").toDestination(),
  openhat: new Tone.Player("samples/openhat.wav").toDestination(),
  crash: new Tone.Player("samples/crash.wav").toDestination(),
  clap: new Tone.Player("samples/clap.wav").toDestination(),
  ride: new Tone.Player("samples/ride.wav").toDestination(),
  perc: new Tone.Player("samples/perc.wav").toDestination()
};
const drumPadContainer = document.getElementById("drumPads");
Object.keys(drumSounds).forEach(key => {
  const btn = document.createElement("button");
  btn.classList.add("drum-pad");
  btn.textContent = key.toUpperCase();
  btn.onclick = () => {
    drumSounds[key].start();
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 150);
  };
  drumPadContainer.appendChild(btn);
});

const visualizer = document.getElementById("visualizer");
for (let i = 0; i < 40; i++) {
  const bar = document.createElement("div");
  bar.classList.add("bar");
  visualizer.appendChild(bar);
}
setInterval(() => {
  document.querySelectorAll(".bar").forEach(bar => {
    bar.style.height = `${Math.random() * 50 + 10}px`;
  });
}, 100);
