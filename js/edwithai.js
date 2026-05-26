// EdwithAI Specific 3D Interactive Design - Cognitive Memory Architecture
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  initEdwithAIScene();
}

function initEdwithAIScene() {
  const container = document.getElementById('edwithai-canvas-container');
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
  const brainGroup = new THREE.Group();
  scene.add(brainGroup);

  // ──────────────────────────────────────────────
  // 1. The Core (AI Cognitive Brain)
  // ──────────────────────────────────────────────
  const coreGroup = new THREE.Group();
  brainGroup.add(coreGroup);

  // Brain Core — wireframe icosahedron
  const brainCoreGeo = new THREE.IcosahedronGeometry(2.5, 2);
  const brainCoreMat = new THREE.MeshPhysicalMaterial({
    color: 0x8b5cf6,
    emissive: 0x4c1d95,
    emissiveIntensity: 0.6,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
  });
  const brainCore = new THREE.Mesh(brainCoreGeo, brainCoreMat);
  coreGroup.add(brainCore);

  // Inner glow sphere (solid, soft)
  const glowGeo = new THREE.IcosahedronGeometry(1.8, 1);
  const glowMat = new THREE.MeshPhysicalMaterial({
    color: 0x8b5cf6,
    emissive: 0x7c3aed,
    emissiveIntensity: 1.0,
    wireframe: false,
    transparent: true,
    opacity: 0.15,
  });
  const glowSphere = new THREE.Mesh(glowGeo, glowMat);
  coreGroup.add(glowSphere);

  // ──────────────────────────────────────────────
  // 2. Three Memory Rings (Working / Episodic / Semantic)
  // ──────────────────────────────────────────────
  const ringMaterial = new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.3 });
  const rings = [];
  const ringRadii = [4.5, 6.5, 9]; // Working, Episodic, Semantic
  const ringTilts = [
    { x: Math.PI / 2, y: 0.12 },
    { x: Math.PI / 2, y: -0.18 },
    { x: Math.PI / 2, y: 0.08 },
  ];

  ringRadii.forEach((radius, i) => {
    const ringGeo = new THREE.RingGeometry(radius, radius + 0.05, 80);
    const edges = new THREE.EdgesGeometry(ringGeo);
    const ring = new THREE.LineSegments(edges, ringMaterial.clone());
    ring.rotation.x = ringTilts[i].x;
    ring.rotation.y = ringTilts[i].y;
    coreGroup.add(ring);
    rings.push(ring);
  });

  // Secondary subtle rings for depth
  ringRadii.forEach((radius, i) => {
    const ringGeo2 = new THREE.RingGeometry(radius - 0.3, radius - 0.25, 80);
    const edges2 = new THREE.EdgesGeometry(ringGeo2);
    const mat2 = ringMaterial.clone();
    mat2.opacity = 0.12;
    const ring2 = new THREE.LineSegments(edges2, mat2);
    ring2.rotation.x = ringTilts[i].x + 0.25;
    ring2.rotation.y = ringTilts[i].y + 0.1;
    coreGroup.add(ring2);
  });

  // ──────────────────────────────────────────────
  // 3. Knowledge Nodes — small spheres orbiting each memory layer
  // ──────────────────────────────────────────────
  const nodeCount = 18; // 6 per ring
  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const nodeMat = new THREE.MeshPhysicalMaterial({
    color: 0x2dd4bf,
    emissive: 0x0f766e,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.9,
    metalness: 0.7,
    roughness: 0.3,
  });

  for (let i = 0; i < nodeCount; i++) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    const ringIndex = Math.floor(i / 6); // 0, 1, or 2
    const angleOffset = (i % 6) / 6 * Math.PI * 2;
    const radius = ringRadii[ringIndex];
    const speed = 0.3 + Math.random() * 0.4;

    node.userData = {
      angle: angleOffset,
      radius: radius,
      speed: speed,
      ringIndex: ringIndex,
      yOffset: (Math.random() - 0.5) * 1.5,
    };
    brainGroup.add(node);
    nodes.push(node);
  }

  // ──────────────────────────────────────────────
  // 4. Particle Streams (Learning data flowing between core and nodes)
  // ──────────────────────────────────────────────
  const particleCount = 180;
  const particlesGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleData = [];

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = 0;
    particlePositions[i * 3 + 1] = 0;
    particlePositions[i * 3 + 2] = 0;

    particleData.push({
      nodeIndex: Math.floor(Math.random() * nodeCount),
      progress: Math.random(),
      speed: 0.008 + Math.random() * 0.015,
      direction: Math.random() > 0.5 ? 1 : -1,
    });
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.12,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const particleSystem = new THREE.Points(particlesGeo, particleMat);
  brainGroup.add(particleSystem);

  // ──────────────────────────────────────────────
  // 5. Floating Documents (small quads drifting outward)
  // ──────────────────────────────────────────────
  const docCount = 12;
  const docs = [];
  const docGeo = new THREE.PlaneGeometry(0.6, 0.8);
  const docMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < docCount; i++) {
    const doc = new THREE.Mesh(docGeo, docMat.clone());
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 8;
    doc.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 10,
      Math.sin(angle) * radius
    );
    doc.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    doc.userData = {
      driftSpeed: 0.002 + Math.random() * 0.004,
      rotSpeed: 0.003 + Math.random() * 0.005,
      angle: angle,
      baseRadius: radius,
    };
    brainGroup.add(doc);
    docs.push(doc);
  }

  // ──────────────────────────────────────────────
  // 6. Ambient Neural Dust (background particles)
  // ──────────────────────────────────────────────
  const dustCount = 100;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 40;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x8b5cf6,
    size: 0.08,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const dustSystem = new THREE.Points(dustGeo, dustMat);
  brainGroup.add(dustSystem);

  // ──────────────────────────────────────────────
  // Interaction
  // ──────────────────────────────────────────────
  let mouseX = 0;
  let mouseY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
  });

  // ──────────────────────────────────────────────
  // Theme Support
  // ──────────────────────────────────────────────
  const html = document.documentElement;
  function updateThemeColors() {
    const isLight = html.getAttribute('data-theme') === 'light';

    const colorCore = isLight ? 0x4338ca : 0x8b5cf6;
    const emCore = isLight ? 0x312e81 : 0x4c1d95;
    const colorNode = isLight ? 0x0ea5e9 : 0x2dd4bf;
    const emNode = isLight ? 0x0369a1 : 0x0f766e;

    brainCoreMat.color.setHex(colorCore);
    brainCoreMat.emissive.setHex(emCore);

    glowMat.color.setHex(colorCore);
    glowMat.emissive.setHex(isLight ? 0x4338ca : 0x7c3aed);

    ringMaterial.color.setHex(colorNode);
    rings.forEach((ring) => {
      ring.material.color.setHex(colorNode);
    });

    nodeMat.color.setHex(colorNode);
    nodeMat.emissive.setHex(emNode);

    particleMat.color.setHex(isLight ? 0x0ea5e9 : 0xffffff);
    particleMat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;

    dustMat.color.setHex(colorCore);
    dustMat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;

    docs.forEach((doc) => {
      doc.material.color.setHex(colorNode);
    });
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

  // ──────────────────────────────────────────────
  // Animation Loop
  // ──────────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 1. Animate Brain Core
    brainCore.rotation.y = time * 0.15;
    brainCore.rotation.x = time * 0.08;
    const pulse = 1 + Math.sin(time * 1.8) * 0.06;
    brainCore.scale.set(pulse, pulse, pulse);

    // Inner glow counter-rotation
    glowSphere.rotation.y = -time * 0.1;
    glowSphere.rotation.z = time * 0.05;
    const glowPulse = 0.15 + Math.sin(time * 2.5) * 0.05;
    glowMat.opacity = glowPulse;

    // 2. Animate Memory Rings
    rings.forEach((ring, i) => {
      ring.rotation.z = time * (0.08 + i * 0.04);
      // Gentle breathing on ring opacity
      ring.material.opacity = 0.25 + Math.sin(time * 1.5 + i * 1.2) * 0.1;
    });

    // 3. Animate Knowledge Nodes
    nodes.forEach((node, i) => {
      node.userData.angle += node.userData.speed * 0.008;
      const x = Math.cos(node.userData.angle) * node.userData.radius;
      const z = Math.sin(node.userData.angle) * node.userData.radius;
      const y = node.userData.yOffset + Math.sin(time * 0.8 + i * 0.7) * 1.2;

      node.position.set(x, y, z);
      node.rotation.y += 0.015;
      node.rotation.x += 0.01;

      // Subtle scale pulse per node
      const nPulse = 1 + Math.sin(time * 2 + i) * 0.12;
      node.scale.set(nPulse, nPulse, nPulse);
    });

    // 4. Animate Particle Streams
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const data = particleData[i];
      data.progress += data.speed * data.direction;

      if (data.progress > 1) {
        data.progress = 0;
        data.nodeIndex = Math.floor(Math.random() * nodeCount);
      } else if (data.progress < 0) {
        data.progress = 1;
        data.nodeIndex = Math.floor(Math.random() * nodeCount);
      }

      const node = nodes[data.nodeIndex];

      // Arcing path between core and node
      const curveY = Math.sin(data.progress * Math.PI) * 1.8;
      const curveX = Math.sin(data.progress * Math.PI * 0.5) * 0.5;

      positions[i * 3] = node.position.x * data.progress + curveX;
      positions[i * 3 + 1] = node.position.y * data.progress + curveY;
      positions[i * 3 + 2] = node.position.z * data.progress;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    // 5. Animate Floating Documents
    docs.forEach((doc) => {
      doc.userData.angle += doc.userData.driftSpeed;
      const r = doc.userData.baseRadius + Math.sin(time * 0.3) * 0.5;
      doc.position.x = Math.cos(doc.userData.angle) * r;
      doc.position.z = Math.sin(doc.userData.angle) * r;
      doc.position.y += Math.sin(time * 0.5 + doc.userData.angle) * 0.003;

      doc.rotation.x += doc.userData.rotSpeed;
      doc.rotation.y += doc.userData.rotSpeed * 0.7;

      // Gentle opacity breathing
      doc.material.opacity = 0.15 + Math.sin(time + doc.userData.angle * 2) * 0.08;
    });

    // 6. Rotate Neural Dust slowly
    dustSystem.rotation.y = time * 0.02;
    dustSystem.rotation.x = time * 0.01;

    // Mouse Parallax
    brainGroup.rotation.y += (mouseX - brainGroup.rotation.y) * 0.05;
    brainGroup.rotation.x += (mouseY - brainGroup.rotation.x) * 0.05;

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
