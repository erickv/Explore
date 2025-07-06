// Geometric Wave Music Experience - Working Version
console.log('Loading Geometric Wave Experience...');

// Check if libraries loaded
if (typeof THREE === 'undefined') {
    console.error('THREE.js not loaded!');
    alert('THREE.js library failed to load. Please refresh the page.');
}

if (typeof Tone === 'undefined') {
    console.error('Tone.js not loaded!');
    alert('Tone.js library failed to load. Please refresh the page.');
}

// Global variables
let scene, camera, renderer, analyser;
let geometricObjects = [];
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
    
    try {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000022); // Slightly lighter for visibility
        
        // Append to body
        document.body.appendChild(renderer.domElement);
        
        camera.position.z = 30; // Closer camera
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);
        
        console.log('Three.js initialized successfully');
        
        // Create initial shapes immediately
        createGeometricObjects();
        
    } catch (error) {
        console.error('Error initializing Three.js:', error);
    }
}

// Initialize Audio
function initAudio() {
    console.log('Initializing audio...');
    
    try {
        // Create audio effects chain
        reverb = new Tone.Reverb(2).toDestination();
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
        console.log('Audio initialized successfully');
        
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

// Create musical sequences
function createSequences() {
    try {
        // Stop existing sequences
        if (sequence) sequence.dispose();
        if (bassSequence) bassSequence.dispose();
        
        const style = musicStyles[currentMusicStyle];
        
        // Update synth type
        if (synth) {
            synth.set({ oscillator: { type: style.synthType } });
        }
        
        // Create sequences
        sequence = new Tone.Sequence((time, note) => {
            if (synth) {
                synth.triggerAttackRelease(note, "8n", time);
            }
        }, style.notes, style.rhythm);
        
        bassSequence = new Tone.Sequence((time, note) => {
            if (basssynth) {
                basssynth.triggerAttackRelease(note, "4n", time);
            }
        }, style.bassNotes, style.bassRhythm);
        
    } catch (error) {
        console.error('Error creating sequences:', error);
    }
}

// Create geometric objects
function createGeometricObjects() {
    console.log('Creating geometric objects...');
    
    try {
        // Clear existing objects
        geometricObjects.forEach(obj => {
            if (scene && obj) {
                scene.remove(obj);
            }
        });
        geometricObjects = [];
        
        // Create objects based on style
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
            default:
                createLineShapes();
        }
        
        console.log(`Created ${geometricObjects.length} objects`);
        
    } catch (error) {
        console.error('Error creating geometric objects:', error);
    }
}

function createLineShapes() {
    for (let i = 0; i < complexity; i++) {
        try {
            const points = [];
            const sides = 3 + Math.floor(Math.random() * 5); // 3-7 sides
            
            for (let j = 0; j <= sides; j++) {
                const angle = (j / sides) * Math.PI * 2;
                const radius = 1 + Math.random() * 2;
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
            
            // Position in circle around origin
            const angle = (i / complexity) * Math.PI * 2;
            const radius = 8 + Math.random() * 5;
            line.position.x = Math.cos(angle) * radius;
            line.position.y = Math.sin(angle) * radius;
            line.position.z = (Math.random() - 0.5) * 10;
            
            // Store original data
            line.userData = {
                originalPosition: line.position.clone(),
                phase: Math.random() * Math.PI * 2,
                frequency: 0.5 + Math.random() * 1.5,
                forces: []
            };
            
            scene.add(line);
            geometricObjects.push(line);
            
        } catch (error) {
            console.error('Error creating line shape:', error);
        }
    }
}

function createWaveShapes() {
    for (let i = 0; i < complexity; i++) {
        try {
            const points = [];
            
            for (let j = 0; j < 50; j++) {
                const x = (j - 25) * 0.5;
                const y = Math.sin(j * 0.2) * 2;
                const z = (i - complexity/2) * 3;
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(i / complexity, 1, 0.6),
                transparent: true,
                opacity: 0.7
            });
            
            const line = new THREE.Line(geometry, material);
            line.userData = {
                phase: i * Math.PI / 4,
                frequency: 0.05 + i * 0.02,
                amplitude: 1 + Math.random() * 2
            };
            
            scene.add(line);
            geometricObjects.push(line);
            
        } catch (error) {
            console.error('Error creating wave shape:', error);
        }
    }
}

function createWireframeShapes() {
    const geometries = [
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.SphereGeometry(1.5, 8, 8),
        new THREE.ConeGeometry(1, 2, 6),
        new THREE.OctahedronGeometry(1.5)
    ];
    
    for (let i = 0; i < complexity; i++) {
        try {
            const geometry = geometries[i % geometries.length];
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(i / complexity, 0.8, 0.6),
                wireframe: true,
                transparent: true,
                opacity: 0.7
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position in circle
            const angle = (i / complexity) * Math.PI * 2;
            const radius = 8 + Math.random() * 5;
            mesh.position.x = Math.cos(angle) * radius;
            mesh.position.y = Math.sin(angle) * radius;
            mesh.position.z = (Math.random() - 0.5) * 10;
            
            mesh.userData = {
                originalPosition: mesh.position.clone(),
                phase: Math.random() * Math.PI * 2,
                frequency: 0.5 + Math.random() * 1.5,
                forces: []
            };
            
            scene.add(mesh);
            geometricObjects.push(mesh);
            
        } catch (error) {
            console.error('Error creating wireframe shape:', error);
        }
    }
}

function createParticleSystem() {
    try {
        const particleCount = complexity * 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 30;
            positions[i3 + 1] = (Math.random() - 0.5) * 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 20;
            
            const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);
        geometricObjects.push(particleSystem);
        
    } catch (error) {
        console.error('Error creating particle system:', error);
    }
}

// Handle interaction
function handleInteraction(x, y, isStart = false) {
    try {
        // Convert to normalized coordinates
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        
        // Create interaction point
        const interactionPoint = {
            x: mouse.x * 20,
            y: mouse.y * 15,
            z: 0,
            intensity: 1,
            time: Date.now(),
            decay: 0.02
        };
        
        interactionPoints.push(interactionPoint);
        
        // Play touch sound
        if (isStart && touchSynth && Tone.context.state === 'running') {
            try {
                const frequency = 200 + (mouse.y + 1) * 300;
                const note = Tone.Frequency(frequency, "hz").toNote();
                touchSynth.triggerAttackRelease(note, "8n");
            } catch (error) {
                console.log('Could not play touch sound:', error);
            }
        }
        
        // Apply forces to nearby objects
        geometricObjects.forEach(obj => {
            if (obj && obj.position) {
                const distance = obj.position.distanceTo(new THREE.Vector3(interactionPoint.x, interactionPoint.y, obj.position.z));
                if (distance < 15) {
                    if (!obj.userData.forces) obj.userData.forces = [];
                    obj.userData.forces.push({
                        direction: obj.position.clone().sub(new THREE.Vector3(interactionPoint.x, interactionPoint.y, obj.position.z)).normalize(),
                        strength: (15 - distance) / 15 * 1.5,
                        decay: 0.05
                    });
                }
            }
        });
        
        // Limit interaction points
        if (interactionPoints.length > 8) {
            interactionPoints.shift();
        }
        
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
}

// Update interaction effects
function updateInteractionEffects() {
    try {
        // Update interaction points
        interactionPoints = interactionPoints.filter(point => {
            point.intensity -= point.decay;
            return point.intensity > 0;
        });
        
        // Update object forces
        geometricObjects.forEach(obj => {
            if (obj && obj.userData && obj.userData.forces) {
                obj.userData.forces = obj.userData.forces.filter(force => {
                    // Apply force
                    const forceVector = force.direction.clone().multiplyScalar(force.strength * 0.1);
                    obj.position.add(forceVector);
                    
                    // Decay force
                    force.strength *= (1 - force.decay);
                    return force.strength > 0.01;
                });
                
                // Return to original position
                if (obj.userData.originalPosition) {
                    const returnForce = obj.userData.originalPosition.clone().sub(obj.position).multiplyScalar(0.02);
                    obj.position.add(returnForce);
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating interaction effects:', error);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    try {
        // Update interaction effects
        updateInteractionEffects();
        
        // Update objects
        const time = Date.now() * 0.001 * animationSpeed;
        
        if (isPlaying && analyser) {
            try {
                const dataArray = analyser.getValue();
                
                // Calculate energy
                let totalEnergy = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    totalEnergy += Math.abs(dataArray[i]);
                }
                const avgEnergy = totalEnergy / dataArray.length;
                const energyScale = Math.max(0.1, avgEnergy * 0.02);
                
                // Update objects with audio
                geometricObjects.forEach((obj, index) => {
                    if (obj && obj.userData) {
                        const userData = obj.userData;
                        
                        // Wave animation
                        if (userData.frequency && userData.phase !== undefined) {
                            const wave = Math.sin(time * userData.frequency + userData.phase) * 2;
                            
                            if (currentShapeStyle === 'waves' && obj.geometry && obj.geometry.attributes.position) {
                                // Update wave lines
                                const positions = obj.geometry.attributes.position.array;
                                for (let i = 0; i < positions.length; i += 3) {
                                    const x = positions[i];
                                    const wavePattern = Math.sin(x * userData.frequency + time + userData.phase) * userData.amplitude;
                                    positions[i + 1] = wavePattern;
                                }
                                obj.geometry.attributes.position.needsUpdate = true;
                            } else {
                                // Standard object animation
                                if (userData.originalPosition && (!userData.forces || userData.forces.length === 0)) {
                                    obj.position.y = userData.originalPosition.y + wave;
                                }
                                
                                // Rotation
                                if (obj.rotation) {
                                    obj.rotation.x += 0.01 * animationSpeed * (1 + energyScale);
                                    obj.rotation.y += 0.02 * animationSpeed * (1 + energyScale);
                                }
                                
                                // Scale
                                if (obj.scale && index < dataArray.length) {
                                    const freqValue = Math.abs(dataArray[index]) * 0.1;
                                    const scale = 1 + freqValue;
                                    obj.scale.setScalar(scale);
                                }
                            }
                            
                            // Color
                            if (obj.material && obj.material.color) {
                                const hue = (time * 0.1 + index * 0.1) % 1;
                                obj.material.color.setHSL(hue, 0.8, 0.6 + energyScale * 0.4);
                            }
                        }
                    }
                });
                
            } catch (error) {
                console.error('Error in audio processing:', error);
            }
        } else {
            // Basic animation without audio
            geometricObjects.forEach((obj, index) => {
                if (obj && obj.userData) {
                    const userData = obj.userData;
                    
                    if (userData.frequency && userData.phase !== undefined) {
                        const wave = Math.sin(time * userData.frequency + userData.phase) * 2;
                        
                        if (userData.originalPosition && (!userData.forces || userData.forces.length === 0)) {
                            obj.position.y = userData.originalPosition.y + wave;
                        }
                        
                        if (obj.rotation) {
                            obj.rotation.x += 0.005 * animationSpeed;
                            obj.rotation.y += 0.01 * animationSpeed;
                        }
                        
                        if (obj.material && obj.material.color) {
                            const hue = (time * 0.05 + index * 0.1) % 1;
                            obj.material.color.setHSL(hue, 0.8, 0.6);
                        }
                    }
                }
            });
        }
        
        // Render
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
    } catch (error) {
        console.error('Error in animation loop:', error);
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

// Event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    try {
        // Play button
        const playBtn = document.getElementById('playBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) {
            playBtn.addEventListener('click', async () => {
                console.log('Play button clicked');
                
                try {
                    if (Tone.context.state !== 'running') {
                        await Tone.start();
                        console.log('Tone.js context started');
                    }
                    
                    if (customAudio) {
                        // Play custom audio
                        audioSource = new Tone.Player(customAudio).toDestination();
                        if (analyser) audioSource.connect(analyser);
                        audioSource.start();
                    } else {
                        // Play synthesized music
                        Tone.Transport.bpm.value = currentTempo;
                        Tone.Transport.start();
                        if (sequence) sequence.start();
                        if (bassSequence) bassSequence.start();
                    }
                    
                    isPlaying = true;
                    playBtn.disabled = true;
                    if (stopBtn) stopBtn.disabled = false;
                    
                    const infoEl = document.getElementById('info');
                    if (infoEl) {
                        infoEl.textContent = `Playing ${currentMusicStyle} music - Touch screen to create waves!`;
                    }
                    
                } catch (error) {
                    console.error('Error starting playback:', error);
                }
            });
        }
        
        // Stop button
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                console.log('Stop button clicked');
                
                try {
                    Tone.Transport.stop();
                    if (sequence) sequence.stop();
                    if (bassSequence) bassSequence.stop();
                    if (audioSource) {
                        audioSource.stop();
                        audioSource.dispose();
                        audioSource = null;
                    }
                    
                    isPlaying = false;
                    playBtn.disabled = false;
                    stopBtn.disabled = true;
                    
                    const infoEl = document.getElementById('info');
                    if (infoEl) {
                        infoEl.textContent = 'Stopped. Click "Play Music" to restart.';
                    }
                    
                } catch (error) {
                    console.error('Error stopping playback:', error);
                }
            });
        }
        
        // Music style
        const musicStyleSelect = document.getElementById('musicStyle');
        if (musicStyleSelect) {
            musicStyleSelect.addEventListener('change', (e) => {
                currentMusicStyle = e.target.value;
                createSequences();
                console.log('Music style changed to:', currentMusicStyle);
            });
        }
        
        // Shape style
        const shapeStyleSelect = document.getElementById('shapeStyle');
        if (shapeStyleSelect) {
            shapeStyleSelect.addEventListener('change', (e) => {
                currentShapeStyle = e.target.value;
                createGeometricObjects();
                console.log('Shape style changed to:', currentShapeStyle);
            });
        }
        
        // Tempo
        const tempoSlider = document.getElementById('tempoSlider');
        const tempoValue = document.getElementById('tempoValue');
        if (tempoSlider) {
            tempoSlider.addEventListener('input', (e) => {
                currentTempo = parseInt(e.target.value);
                if (tempoValue) tempoValue.textContent = currentTempo + ' BPM';
                Tone.Transport.bpm.value = currentTempo;
            });
        }
        
        // Complexity
        const complexitySlider = document.getElementById('complexitySlider');
        if (complexitySlider) {
            complexitySlider.addEventListener('input', (e) => {
                complexity = parseInt(e.target.value);
                createGeometricObjects();
            });
        }
        
        // Speed
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                animationSpeed = parseFloat(e.target.value);
            });
        }
        
        // Volume
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                Tone.Destination.volume.value = Tone.gainToDb(e.target.value);
            });
        }
        
        // File upload
        const audioFile = document.getElementById('audioFile');
        if (audioFile) {
            audioFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) loadCustomAudio(file);
            });
        }
        
        // Mouse and touch interactions
        if (renderer && renderer.domElement) {
            // Mouse events
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
            
            // Touch events
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
            
            // Disable context menu
            renderer.domElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }
        
        // Window resize
        window.addEventListener('resize', () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
        
        console.log('Event listeners set up successfully');
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Initialize everything
function init() {
    console.log('Initializing application...');
    
    try {
        initThree();
        initAudio();
        setupEventListeners();
        animate();
        
        console.log('Application initialized successfully');
        
        const infoEl = document.getElementById('info');
        if (infoEl) {
            infoEl.textContent = 'Ready! Click "Play Music" to start - then touch the screen to create waves!';
        }
        
    } catch (error) {
        console.error('Error during initialization:', error);
        alert('Error initializing the application. Please check the console for details.');
    }
}

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
