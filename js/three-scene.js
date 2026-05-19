/* ============================================
   Three.js Particle Scene for Hero & Contact
   ============================================ */
// THREE is loaded globally via CDN script tag

export class ParticleScene {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn('[ParticleScene] Canvas not found:', canvasId);
      return;
    }

    // Check WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('[ParticleScene] WebGL not available');
      return;
    }

    // Check THREE is loaded
    if (typeof THREE === 'undefined') {
      console.error('[ParticleScene] THREE.js not loaded — check CDN script tag');
      return;
    }

    this.particleCount = options.particleCount || 4000;
    this.spread = options.spread || 3.0;
    this.baseSize = options.baseSize || 3.0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollProgress = 0;
    this.isVisible = true;
    this.clock = new THREE.Clock();

    try {
      this._init();
      console.log('[ParticleScene] Initialized:', canvasId, '— particles:', this.particleCount);
    } catch (e) {
      console.error('[ParticleScene] Init failed:', e);
    }
  }

  _init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.canvas.parentElement.offsetWidth, this.canvas.parentElement.offsetHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65,
      this.canvas.parentElement.offsetWidth / this.canvas.parentElement.offsetHeight,
      0.1,
      100
    );
    this.camera.position.z = 5;

    this._createParticles();
    this._addListeners();
    this._animate();
  }

  _createParticles() {
    const count = this.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randoms = new Float32Array(count);

    const violet = new THREE.Color('#8b5cf6');
    const cyan = new THREE.Color('#2dd4bf');

    for (let i = 0; i < count; i++) {
      // Spherical distribution with organic noise
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.spread * (0.4 + Math.random() * 0.6);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Gradient color
      const mix = (positions[i * 3 + 1] / this.spread + 1) * 0.5; // y-based
      const col = violet.clone().lerp(cyan, mix * 0.8 + Math.random() * 0.2);
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = 0.3 + Math.random() * 0.7;
      randoms[i] = Math.random() * 6.2831;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: this.baseSize }
      },
      vertexShader: `
        attribute float aScale;
        attribute vec3 aColor;
        attribute float aRandom;

        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uScroll;
        uniform float uPixelRatio;
        uniform float uSize;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Organic flowing motion
          float t = uTime * 0.25;
          pos.x += sin(t + pos.y * 1.5 + aRandom) * 0.18;
          pos.y += cos(t * 0.8 + pos.x * 1.5 + aRandom) * 0.18;
          pos.z += sin(t * 0.6 + pos.z * 1.2 + aRandom) * 0.12;

          // Mouse reactivity — gentle push
          vec2 mouseOffset = pos.xy - uMouse * 2.5;
          float mouseDist = length(mouseOffset);
          vec2 push = normalize(mouseOffset) * smoothstep(2.0, 0.0, mouseDist) * 0.25;
          pos.xy += push;

          // Scroll: spread particles outward
          pos *= 1.0 + uScroll * 0.6;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = uSize * uPixelRatio * aScale * (1.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.0);

          vColor = aColor;
          vAlpha = (0.6 + aScale * 0.4) * (1.0 - uScroll * 0.7);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vAlpha;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  _addListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      const parent = this.canvas.parentElement;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  setScroll(progress) {
    this.scrollProgress = progress;
  }

  _animate() {
    if (!this.isVisible && this.scrollProgress > 0.9) {
      requestAnimationFrame(() => this._animate());
      return;
    }

    const elapsed = this.clock.getElapsedTime();

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Update uniforms
    const mat = this.particles.material;
    mat.uniforms.uTime.value = elapsed;
    mat.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
    mat.uniforms.uScroll.value = this.scrollProgress;

    // Gentle global rotation
    this.particles.rotation.y = elapsed * 0.04;
    this.particles.rotation.x = Math.sin(elapsed * 0.025) * 0.08;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this._animate());
  }

  dispose() {
    this.renderer.dispose();
    this.particles.geometry.dispose();
    this.particles.material.dispose();
  }
}
