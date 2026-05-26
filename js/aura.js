// AURA Specific 3D Interactive Design - Intelligence Layer Architecture
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  initAuraScene();
}

function initAuraScene() {
  const container = document.getElementById('aura-canvas-container');
  if (!container) return;

  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 30;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Main Group
  const auraGroup = new THREE.Group();
  scene.add(auraGroup);

  // 1. The Core (Intelligence Layer)
  const coreGroup = new THREE.Group();
  auraGroup.add(coreGroup);

  // Inner Core
  const innerCoreGeo = new THREE.IcosahedronGeometry(2.5, 2);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x8b5cf6, // Violet
    emissive: 0x4c1d95,
    emissiveIntensity: 0.5,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
  });
  const innerCore = new THREE.Mesh(innerCoreGeo, coreMat);
  coreGroup.add(innerCore);

  // Memory Layers (Rings)
  const ringMaterial = new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.3 });
  const rings = [];
  [4.5, 6, 7.5].forEach((radius, i) => {
    const ringGeo = new THREE.RingGeometry(radius, radius + 0.05, 64);
    const edges = new THREE.EdgesGeometry(ringGeo);
    const ring = new THREE.LineSegments(edges, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    // slightly tilt rings
    ring.rotation.y = (i - 1) * 0.15;
    coreGroup.add(ring);
    rings.push(ring);
  });

  // 2. Agents (Orchestration)
  const agentCount = 6;
  const agents = [];
  const agentGeo = new THREE.OctahedronGeometry(0.8, 0);
  const agentMat = new THREE.MeshPhysicalMaterial({
    color: 0x2dd4bf,
    emissive: 0x0f766e,
    emissiveIntensity: 0.8,
    wireframe: false,
    transparent: true,
    opacity: 0.9,
    metalness: 0.8,
    roughness: 0.2
  });

  for (let i = 0; i < agentCount; i++) {
    const agent = new THREE.Mesh(agentGeo, agentMat);
    // Random initial angle and orbit radius
    const angle = (i / agentCount) * Math.PI * 2;
    const radius = 9 + Math.random() * 4; // between 9 and 13
    const speed = 0.5 + Math.random() * 0.5;
    
    agent.userData = { angle, radius, speed, yOffset: (Math.random() - 0.5) * 6 };
    auraGroup.add(agent);
    agents.push(agent);
  }

  // 3. Tokens (Data Streams)
  const tokenCount = 150;
  const tokensGeo = new THREE.BufferGeometry();
  const tokenPositions = new Float32Array(tokenCount * 3);
  const tokenData = []; // To store path data

  for (let i = 0; i < tokenCount; i++) {
    tokenPositions[i*3] = 0;
    tokenPositions[i*3+1] = 0;
    tokenPositions[i*3+2] = 0;
    
    // Assign each token to travel between core and a random agent
    tokenData.push({
      agentIndex: Math.floor(Math.random() * agentCount),
      progress: Math.random(), // 0 to 1
      speed: 0.01 + Math.random() * 0.02,
      direction: Math.random() > 0.5 ? 1 : -1 // 1 for core->agent, -1 for agent->core
    });
  }

  tokensGeo.setAttribute('position', new THREE.BufferAttribute(tokenPositions, 3));
  const tokenMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const tokenSystem = new THREE.Points(tokensGeo, tokenMat);
  auraGroup.add(tokenSystem);

  // Interaction
  let mouseX = 0;
  let mouseY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
  });

  // Theme Support
  const html = document.documentElement;
  function updateThemeColors() {
    const isLight = html.getAttribute('data-theme') === 'light';
    
    const colorCore = isLight ? 0x4338ca : 0x8b5cf6;
    const emCore = isLight ? 0x312e81 : 0x4c1d95;
    const colorAgent = isLight ? 0x0ea5e9 : 0x2dd4bf;
    const emAgent = isLight ? 0x0369a1 : 0x0f766e;

    coreMat.color.setHex(colorCore);
    coreMat.emissive.setHex(emCore);
    
    ringMaterial.color.setHex(colorAgent);
    agentMat.color.setHex(colorAgent);
    agentMat.emissive.setHex(emAgent);
    
    tokenMat.color.setHex(isLight ? 0x0ea5e9 : 0xffffff);
    tokenMat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        updateThemeColors();
      }
    });
  });
  
  observer.observe(html, { attributes: true });
  updateThemeColors();

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 1. Animate Core
    innerCore.rotation.y = time * 0.2;
    innerCore.rotation.x = time * 0.1;
    const pulse = 1 + Math.sin(time * 2) * 0.05;
    innerCore.scale.set(pulse, pulse, pulse);

    // Animate Rings
    rings.forEach((ring, i) => {
      ring.rotation.z = time * (0.1 + i * 0.05);
    });

    // 2. Animate Agents
    agents.forEach((agent, i) => {
      agent.userData.angle += agent.userData.speed * 0.01;
      const x = Math.cos(agent.userData.angle) * agent.userData.radius;
      const z = Math.sin(agent.userData.angle) * agent.userData.radius;
      const y = agent.userData.yOffset + Math.sin(time + i) * 1.5; // Bobbing motion

      agent.position.set(x, y, z);
      agent.rotation.y += 0.02;
      agent.rotation.x += 0.01;
    });

    // 3. Animate Tokens (Data Streams)
    const positions = tokenSystem.geometry.attributes.position.array;
    for (let i = 0; i < tokenCount; i++) {
      const data = tokenData[i];
      data.progress += data.speed * data.direction;

      // Wrap progress
      if (data.progress > 1) {
        data.progress = 0;
        data.agentIndex = Math.floor(Math.random() * agentCount); // Pick a new agent
      } else if (data.progress < 0) {
        data.progress = 1;
        data.agentIndex = Math.floor(Math.random() * agentCount);
      }

      const agent = agents[data.agentIndex];
      
      // Interpolate between core (0,0,0) and agent position
      // Add some curve using sine waves based on progress
      const curveY = Math.sin(data.progress * Math.PI) * 2; // Arcing path
      
      positions[i*3] = agent.position.x * data.progress;
      positions[i*3+1] = agent.position.y * data.progress + curveY;
      positions[i*3+2] = agent.position.z * data.progress;
    }
    tokenSystem.geometry.attributes.position.needsUpdate = true;

    // Mouse Parallax
    auraGroup.rotation.y += (mouseX - auraGroup.rotation.y) * 0.05;
    auraGroup.rotation.x += (mouseY - auraGroup.rotation.x) * 0.05;

    renderer.render(scene, camera);
  }

  animate();

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
