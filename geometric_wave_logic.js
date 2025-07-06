// Geometric Wave Music Experience - Interactive Audio-Visual App
console.log('Loading Geometric Wave Experience...');

// Global variables
let scene, camera, renderer, analyser;
let geometricObjects = [];
let waveLines = [];
let particleSystem = null;
let isPlaying = false;
let animationSpeed = 1;
let complexity = 6;
let currentTempo = 120;
let currentMusicStyle = 'ambient';
let currentShapeStyle = 'lines';
let customAudio = null;
let audioSource = null;

// Audio components
let synth, basssynth, reverb, filter, compressor;
let sequence, bassSequence;

// Interaction variables
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let interactionPoints = [];
let touchSynth;
let isInteracting = false;

// Music styles
const musicStyles = {
    ambient: {
        notes: ["C4", "E4", "G4", "B4", "D5"],
        bassNotes: ["C2", "F2", "G2"],
        rhythm: "2n",
        bassRhythm: "1n",
        synthType: "triangle"
    },
    electronic: {
        notes: ["C4", "D4", "F4", "G4", "A4", "C5"],
        bassNotes: ["C2", "F2", "G2", "A2"],
        rhythm: "8n",
        bassRhythm: "4n",
        synthType: "sawtooth"
    },
    minimal: {
        notes: ["C4", "G4", "C5"],
        bassNotes: ["C2", "G2"],
        rhythm: "1n",
        bassRhythm: "2n",
        synthType: "sine"
    },
    cosmic: {
        notes: ["C4", "D4", "E4", "F#4", "G4", "A4", "B4"],
        bassNotes: ["C2", "D2", "E2", "F#2"],
        rhythm: "4n.",
        bassRhythm: "2n",
        synthType: "triangle"
    }
};

// Initialize Three.js
function initThree() {
    console.log('Initializing Three.js...');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000011);
    document.body.appendChild(renderer.domElement);
    
    camera.position.z = 40;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    console.log('Three.js initialized');
}

// Initialize Audio
function initAudio() {
    console.log('Initializing audio...');
    
    // Create audio effects chain
    reverb = new Tone.Reverb(3).toDestination();
    filter = new Tone.Filter(1000, "lowpass").connect(reverb);
    compressor = new Tone.Compressor(-20, 3).connect(filter);
    
    // Create synthesizers
    synth = new Tone.PolySynth(Tone.Synth).connect(compressor);
    basssynth = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
    }).connect(compressor);
    
    // Create touch interaction synth
    touchSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }
    }).connect(compressor);
    
    // Set up audio analysis
    analyser = new Tone.Analyser("fft", 32);
    compressor.connect(analyser);
    
    createSequences();
    console.log('Audio initialized');
}

// Create musical sequences
function createSequences() {
    // Stop existing sequences
    if (sequence) sequence.dispose();
    if (bassSequence) bassSequence.dispose();
    
    const style = musicStyles[currentMusicStyle];
    
    // Update synth type
    synth.set({ oscillator: { type: style.synthType } });
    
    // Create sequences
    sequence = new Tone.Sequence((time, note) => {
        synth.triggerAttackRelease(note, "8n", time);
    }, style.notes, style.rhythm);
    
    bassSequence = new Tone.Sequence((time, note) => {
        basssynth.triggerAttackRelease(note, "4n", time);
    }, style.bassNotes, style.bassRhythm);
}

// Create geometric objects based on style
function createGeometricObjects() {
    // Clear existing objects
    geometricObjects.forEach(obj => scene.remove(obj));
    geometricObjects = [];
    
    if (particleSystem) {
        scene.remove(particleSystem);
        particleSystem = null;
    }
    
    switch (currentShapeStyle) {
        case 'lines':
            createLineShapes();
            break;
        case 'waves':
            createWaveShapes();
            break;
        case 'wireframe':
            createWireframeShapes();
            break;
        case 'particles':
            createParticleSystem();
            break;
    }
}

function createLineShapes() {
    for (let i = 0; i < complexity; i++) {
        const points = [];
        const sides = 3 + Math.floor(Math.random() * 6); // 3-8 sides
        
        for (let j = 0; j <= sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(i / complexity, 1, 0.6),
            transparent: true,
            opacity: 0.8
        });
        
        const line = new THREE.Line(geometry, material);
        
        // Position in circle
        const angle = (i / complexity) * Math.PI * 2;
        const radius = 12 + Math.random() * 8;
        line.position.x = Math.cos(angle) * radius;
        line.position.y = Math.sin(angle) * radius;
        line.position.z = (Math.random() - 0.5) * 15;
        
        line.userData = {
            originalPosition: line.position.clone(),
            phase: Math.random() * Math.PI * 2,
            frequency: 0.5 + Math.random() * 1.5
        };
        
        scene.add(line);
        geometricObjects.push(line);
    }
}

function createWaveShapes() {
    for (let i = 0; i < complexity * 2; i++) {
        const points = [];
        
        for (let j = 0; j < 80; j++) {
            const x = (j - 40) * 0.6;
            const y = Math.sin(j * 0.1) * 2;
            const z = (i - complexity) * 4;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(i / (complexity * 2), 1, 0.6),
            transparent: true,
            opacity: 0.7
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = {
            phase: i * Math.PI / 6,
            frequency: 0.05 + i * 0.02,
            amplitude: 2 + Math.random() * 4
        };
        
        scene.add(line);
        geometricObjects.push(line);
    }
}

function createWireframeShapes() {
    const geometries = [
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.ConeGeometry(2, 4, 6),
        new THREE.OctahedronGeometry(2.5)
    ];
    
    for (let i = 0; i < complexity; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        const angle = (i / complexity) * Math.PI * 2;
        const radius = 15 + Math.random() * 10;
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.y = Math.sin(angle) * radius;
        mesh.position.z = (Math.random() - 0.5) * 20;
        
        mesh.userData = {
            originalPosition: mesh.position.clone(),
            phase: Math.random() * Math.PI * 2,
            frequency: 0.5 + Math.random() * 1.5
        };
        
        scene.add(mesh);
        geometricObjects.push(mesh);
    }
}

function createParticleSystem() {
    const particleCount = complexity * 300;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 60;
        positions[i3 + 1] = (Math.random() - 0.5) * 40;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;
        
        const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// Handle interaction (touch/mouse)
function handleInteraction(x, y, isStart = false) {
    // Convert screen coordinates to normalized device coordinates
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    // Create interaction point
    const interactionPoint = {
        x: mouse.x * 40, // Scale to world coordinates
        y: mouse.y * 30,
        z: 0,
        intensity: 1,
        time: Date.now(),
        decay: 0.02
    };
    
    interactionPoints.push(interactionPoint);
    
    // Play touch sound
    if (isStart && touchSynth) {
        const note = Tone.Frequency(200 + (mouse.y + 1) * 400, "hz").toNote();
        touchSynth.triggerAttackRelease(note, "8n");
    }
    
    // Create ripple effect for nearby objects
    geometricObjects.forEach(obj => {
        const distance = obj.position.distanceTo(new THREE.Vector3(interactionPoint.x, interactionPoint.y, obj.position.z));
        if (distance < 20) {
            // Add force to object
            if (!obj.userData.forces) obj.userData.forces = [];
            obj.userData.forces.push({
                direction: obj.position.clone().sub(new THREE.Vector3(interactionPoint.x, interactionPoint.y, obj.position.z)).normalize(),
                strength: (20 - distance) / 20 * 2,
                decay: 0.05
            });
        }
    });
    
    // Limit interaction points
    if (interactionPoints.length > 10) {
        interactionPoints.shift();
    }
}

// Update interaction effects
function updateInteractionEffects() {
    // Update and remove old interaction points
    interactionPoints = interactionPoints.filter(point => {
        point.intensity -= point.decay;
        return point.intensity > 0;
    });
    
    // Update object forces
    geometricObjects.forEach(obj => {
        if (obj.userData.forces) {
            obj.userData.forces = obj.userData.forces.filter(force => {
                // Apply force
                const forceVector = force.direction.clone().multiplyScalar(force.strength);
                obj.position.add(forceVector.multiplyScalar(0.1));
                
                // Decay force
                force.strength *= (1 - force.decay);
                return force.strength > 0.01;
            });
        }
        
        // Return to original position gradually
        if (obj.userData.originalPosition) {
            const returnForce = obj.userData.originalPosition.clone().sub(obj.position).multiplyScalar(0.02);
            obj.position.add(returnForce);
        }
    });
    
    // Create wave distortions from interaction points
    if (currentShapeStyle === 'waves') {
        geometricObjects.forEach(obj => {
            if (obj.geometry && obj.geometry.attributes.position) {
                const positions = obj.geometry.attributes.position.array;
                
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i];
                    const y = positions[i + 1];
                    
                    // Apply interaction effects
                    interactionPoints.forEach(point => {
                        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                        if (distance < 15) {
                            const influence = (15 - distance) / 15 * point.intensity;
                            const wave = Math.sin(distance * 0.5 - (Date.now() - point.time) * 0.01) * influence * 3;
                            positions[i + 1] += wave;
                        }
                    });
                }
                
                obj.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
}

// Load custom audio
function loadCustomAudio(file) {
    console.log('Loading custom audio:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        Tone.context.rawContext.decodeAudioData(e.target.result)
            .then(buffer => {
                customAudio = buffer;
                document.getElementById('info').textContent = `Loaded: ${file.name} - Click Play to start!`;
            })
            .catch(error => {
                console.error('Error loading audio:', error);
                document.getElementById('info').textContent = 'Error loading audio file';
            });
    };
    reader.readAsArrayBuffer(file);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update interaction effects
    updateInteractionEffects();
    
    if (isPlaying && analyser) {
        const dataArray = analyser.getValue();
        
        // Calculate audio energy
        let totalEnergy = 0;
        for (let i = 0; i < dataArray.length; i++) {
            totalEnergy += Math.abs(dataArray[i]);
        }
        const avgEnergy = totalEnergy / dataArray.length;
        const energyScale = Math.max(0.1, avgEnergy * 0.02);
        const time = Date.now() * 0.001 * animationSpeed;
        
        // Update objects based on style
        if (currentShapeStyle === 'particles' && particleSystem) {
            const positions = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const freqIndex = Math.floor((i / positions.length) * dataArray.length);
                const freqValue = Math.abs(dataArray[freqIndex]) * 0.1;
                positions[i + 1] += Math.sin(time + i * 0.01) * 0.1 * (1 + freqValue);
                
                // Add interaction effects to particles
                interactionPoints.forEach(point => {
                    const distance = Math.sqrt((positions[i] - point.x) ** 2 + (positions[i + 1] - point.y) ** 2);
                    if (distance < 10) {
                        const influence = (10 - distance) / 10 * point.intensity;
                        positions[i] += (point.x - positions[i]) * influence * 0.1;
                        positions[i + 1] += (point.y - positions[i + 1]) * influence * 0.1;
                    }
                });
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        } else {
            geometricObjects.forEach((obj, index) => {
                const userData = obj.userData;
                if (!userData) return;
                
                const wave = Math.sin(time * userData.frequency + userData.phase) * 4;
                
                if (currentShapeStyle === 'waves') {
                    // Update wave lines
                    if (obj.geometry && obj.geometry.attributes.position) {
                        const positions = obj.geometry.attributes.position.array;
                        for (let i = 0; i < positions.length; i += 3) {
                            const x = positions[i];
                            const freqIndex = Math.floor(((i / 3) / (positions.length / 3)) * dataArray.length);
                            const freqValue = Math.abs(dataArray[freqIndex]) * 0.1;
                            
                            const wavePattern = Math.sin(x * userData.frequency + time + userData.phase) * userData.amplitude;
                            const audioWave = Math.sin(x * 0.1 + time * 3) * freqValue * 6;
                            
                            // Reset to base wave pattern first
                            positions[i + 1] = wavePattern + audioWave;
                        }
                        // Interaction effects are applied in updateInteractionEffects()
                    }
                } else {
                    // Standard object animation
                    if (userData.originalPosition && !userData.forces?.length) {
                        obj.position.y = userData.originalPosition.y + wave;
                    }
                    
                    obj.rotation.x += 0.01 * animationSpeed * (1 + energyScale);
                    obj.rotation.y += 0.02 * animationSpeed * (1 + energyScale);
                    
                    // Scale based on audio
                    const freqIndex = Math.floor((index / geometricObjects.length) * dataArray.length);
                    const freqValue = Math.abs(dataArray[freqIndex]) * 0.2;
                    const scale = 1 + freqValue;
                    if (obj.scale) obj.scale.setScalar(scale);
                }
                
                // Color animation
                const hue = (time * 0.1 + index * 0.1) % 1;
                if (obj.material && obj.material.color) {
                    obj.material.color.setHSL(hue, 0.8, 0.6 + energyScale * 0.4);
                }
            });
        }
    }
    
    renderer.render(scene, camera);
}

// Event listeners
function setupEventListeners() {
    // Play button
    document.getElementById('playBtn').addEventListener('click', async () => {
        console.log('Starting playback...');
        
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        
        if (customAudio) {
            // Play custom audio
            audioSource = new Tone.Player(customAudio).toDestination();
            audioSource.connect(analyser);
            audioSource.start();
        } else {
            // Play synthesized music
            Tone.Transport.bpm.value = currentTempo;
            Tone.Transport.start();
            sequence.start();
            bassSequence.start();
        }
        
        isPlaying = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('info').textContent = `Playing ${currentMusicStyle} style music - Touch screen to create waves!`;
    });
    
    // Stop button
    document.getElementById('stopBtn').addEventListener('click', () => {
        console.log('Stopping playback...');
        
        Tone.Transport.stop();
        if (sequence) sequence.stop();
        if (bassSequence) bassSequence.stop();
        if (audioSource) {
            audioSource.stop();
            audioSource.dispose();
            audioSource = null;
        }
        
        isPlaying = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('info').textContent = 'Stopped. Click "Play Music" to restart.';
    });
    
    // Music style
    document.getElementById('musicStyle').addEventListener('change', (e) => {
        currentMusicStyle = e.target.value;
        createSequences();
        console.log('Music style changed to:', currentMusicStyle);
    });
    
    // Shape style
    document.getElementById('shapeStyle').addEventListener('change', (e) => {
        currentShapeStyle = e.target.value;
        createGeometricObjects();
        console.log('Shape style changed to:', currentShapeStyle);
    });
    
    // Tempo
    document.getElementById('tempoSlider').addEventListener('input', (e) => {
        currentTempo = parseInt(e.target.value);
        document.getElementById('tempoValue').textContent = currentTempo + ' BPM';
        Tone.Transport.bpm.value = currentTempo;
    });
    
    // Complexity
    document.getElementById('complexitySlider').addEventListener('input', (e) => {
        complexity = parseInt(e.target.value);
        createGeometricObjects();
    });
    
    // Speed
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        animationSpeed = parseFloat(e.target.value);
    });
    
    // Volume
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        Tone.Destination.volume.value = Tone.gainToDb(e.target.value);
    });
    
    // File upload
    document.getElementById('audioFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadCustomAudio(file);
    });
    
    // Mouse interactions
    renderer.domElement.addEventListener('mousedown', (event) => {
        isInteracting = true;
        handleInteraction(event.clientX, event.clientY, true);
    });
    
    renderer.domElement.addEventListener('mousemove', (event) => {
        if (isInteracting) {
            handleInteraction(event.clientX, event.clientY, false);
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isInteracting = false;
    });
    
    // Touch interactions
    renderer.domElement.addEventListener('touchstart', (event) => {
        event.preventDefault();
        isInteracting = true;
        const touch = event.touches[0];
        handleInteraction(touch.clientX, touch.clientY, true);
    });
    
    renderer.domElement.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (isInteracting) {
            const touch = event.touches[0];
            handleInteraction(touch.clientX, touch.clientY, false);
        }
    });
    
    renderer.domElement.addEventListener('touchend', (event) => {
        event.preventDefault();
        isInteracting = false;
    });
    
    // Disable context menu on canvas
    renderer.domElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize everything
function init() {
    console.log('Initializing application...');
    
    initThree();
    initAudio();
    createGeometricObjects();
    setupEventListeners();
    animate();
    
    console.log('Application ready!');
    document.getElementById('info').textContent = 'Ready! Click "Play Music" to start - then touch the screen to create waves!';
}

// Start when page loads
window.addEventListener('load', init);
