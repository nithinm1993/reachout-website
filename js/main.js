/* ============================================
   Main JS — Lenis, GSAP, Navigation, Cursor
   ============================================ */
import { ParticleScene } from './three-scene.js';

// ---- Wait for DOM ----
document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // 0. REGISTER GSAP PLUGINS FIRST
  // ============================================
  gsap.registerPlugin(ScrollTrigger);

  // ============================================
  // 1. LENIS SMOOTH SCROLL
  // ============================================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false
  });

  // Use GSAP ticker as the single animation loop for Lenis
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // ============================================
  // 2. THREE.JS SCENES
  // ============================================
  const isMobile = window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let globalScene = null;

  if (!prefersReducedMotion) {
    globalScene = new ParticleScene('global-canvas', {
      particleCount: isMobile ? 10000 : 24000,
      spread: isMobile ? 3.0 : 4.5,
      baseSize: isMobile ? 9.0 : 12.0
    });
  }

  // ============================================
  // 3. SCROLL PROGRESS BAR
  // ============================================
  const progressBar = document.querySelector('.scroll-progress');
  const heroEl = document.getElementById('hero');

  lenis.on('scroll', ({ scroll }) => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scroll / docHeight : 0;
    progressBar.style.width = (progress * 100) + '%';

    // Hero particle dispersal
    if (globalScene && heroEl) {
      const heroProgress = Math.min(1, scroll / heroEl.offsetHeight);
      globalScene.setScroll(heroProgress);
    }
  });

  // ============================================
  // 4. CUSTOM CURSOR
  // ============================================
  const cursor = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');

  if (cursor && follower && !isMobile) {
    let cx = -100, cy = -100, fx = -100, fy = -100;

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
    });

    function updateCursor() {
      fx += (cx - fx) * 0.12;
      fy += (cy - fy) * 0.12;

      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      follower.style.left = fx + 'px';
      follower.style.top = fy + 'px';

      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('a, button, .product-card, .capability-card, .linkedin-btn');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovering');
        follower.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
        follower.classList.remove('hovering');
      });
    });
  }

  // ============================================
  // 5. NAVIGATION
  // ============================================
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  const mobileLinks = document.querySelectorAll('.nav-mobile a');
  const sections = document.querySelectorAll('section[id]');

  // Scroll state for navbar background
  lenis.on('scroll', ({ scroll }) => {
    navbar.classList.toggle('scrolled', scroll > 60);
  });

  // Active section tracking
  function updateActiveNav() {
    let current = '';
    const triggerPoint = window.innerHeight * 0.35;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= triggerPoint) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  lenis.on('scroll', updateActiveNav);
  updateActiveNav();

  // Smooth scroll to section
  function scrollToSection(href) {
    const target = document.querySelector(href);
    const offset = href === '#about' ? 50 : -60;
    if (target) lenis.scrollTo(target, { offset: offset, duration: 1.5 });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(link.getAttribute('href'));
    });
  });

  // Logo click => scroll to top
  document.querySelector('.nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    lenis.scrollTo(0, { duration: 1.5 });
  });

  // Mobile nav
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      if (isOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        lenis.start();

        // Let Lenis natively resolve target element position after the menu starts closing
        setTimeout(() => {
          const offset = href === '#about' ? 50 : -60;
          lenis.scrollTo(href, { offset: offset, duration: 1.2 });
        }, 150);
      });
    });
  }

  // ============================================
  // 6. GSAP SCROLL ANIMATIONS
  // ============================================

  // -- Hero content entrance --
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    gsap.from(heroContent.children, {
      opacity: 0,
      y: 50,
      duration: 1,
      stagger: 0.15,
      delay: 0.5,
      ease: 'power3.out'
    });
  }

  // -- Hero fade on scroll --
  gsap.to('.hero-content', {
    opacity: 0,
    y: -60,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '60% top',
      scrub: true
    }
  });

  // -- About section reveals --
  const aboutTl = gsap.timeline({
    scrollTrigger: { trigger: '#about', start: 'top 80%' }
  });
  aboutTl
    .from('.about-label', { opacity: 0, y: 30, duration: 0.6 })
    .from('.about-heading', { opacity: 0, y: 40, duration: 0.7 }, '-=0.3')
    .from('.about-text', { opacity: 0, y: 30, duration: 0.6 }, '-=0.3')
    .from('.capability-card', {
      opacity: 0, y: 40, duration: 0.6, stagger: 0.1
    }, '-=0.2');

  // -- Products heading reveal --
  const prodTl = gsap.timeline({
    scrollTrigger: { trigger: '.products-header', start: 'top 80%' }
  });
  prodTl
    .from('.products-label', { opacity: 0, y: 30, duration: 0.6 })
    .from('.products-heading', { opacity: 0, y: 40, duration: 0.7 }, '-=0.3')
    .from('.products-subtext', { opacity: 0, y: 30, duration: 0.6 }, '-=0.3');

  // -- Horizontal Scroll for Products (desktop only) --
  if (!isMobile) {
    const track = document.querySelector('.products-track');
    if (track) {
      // Wait a tick for layout to settle
      requestAnimationFrame(() => {
        const scrollAmount = track.scrollWidth - window.innerWidth + 96 + 800;

        const horizontalScroll = gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth + 96),
          ease: 'none',
          scrollTrigger: {
            trigger: '#products',
            start: 'top -100px',
            end: () => '+=' + scrollAmount,
            pin: true,
            scrub: 1.2,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });

        // Animate individual cards as they come into view during horizontal scroll
        const cards = track.querySelectorAll('.product-card');
        cards.forEach((card, i) => {
          gsap.from(card, {
            opacity: 0,
            y: 30,
            scale: 0.95,
            duration: 0.5,
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontalScroll,
              start: 'left 85%',
              toggleActions: 'play none none reverse'
            }
          });
        });
      });
    }
  } else {
    // Mobile: simple reveal for product cards
    document.querySelectorAll('.product-card').forEach((card, i) => {
      gsap.from(card, {
        opacity: 0, y: 40, duration: 0.6,
        delay: i * 0.05,
        scrollTrigger: { trigger: card, start: 'top 90%' }
      });
    });
  }

  // -- Contact section reveals --
  // Use a timeline with explicit elements to avoid hiding issues
  const contactElements = document.querySelectorAll('.contact-content > *');
  
  // Set initial state explicitly
  gsap.set(contactElements, { opacity: 0, y: 40 });
  
  // Create the reveal timeline
  const contactTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 90%',
      once: true,
      onEnter: () => {
        // Fallback: ensure elements become visible even if animation glitches
        setTimeout(() => {
          contactElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        }, 2000);
      }
    }
  });
  
  contactTl.to(contactElements, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out'
  });

  // ============================================
  // 7. SCROLL INDICATOR HIDE
  // ============================================
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    lenis.on('scroll', ({ scroll }) => {
      scrollIndicator.style.opacity = scroll > 100 ? '0' : '0.5';
      scrollIndicator.style.transition = 'opacity 0.4s';
    });
  }

  // ============================================
  // 8. THEME TOGGLE (Light / Dark)
  // ============================================
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Apply saved theme or default to dark
  const savedTheme = localStorage.getItem('reach-out-theme');
  if (savedTheme === 'light') {
    html.setAttribute('data-theme', 'light');
  }

  // Add smooth transition to body after initial load (prevents flash)
  requestAnimationFrame(() => {
    document.body.style.transition = 'background 0.5s ease, color 0.5s ease';
  });

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = html.getAttribute('data-theme') === 'light';
      const newTheme = isLight ? 'dark' : 'light';

      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('reach-out-theme', newTheme);

      // Update particle colors and blending for the new theme
      const blending = newTheme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending;
      if (globalScene && globalScene.particles) {
        updateParticleColors(globalScene, newTheme);
        globalScene.particles.material.blending = blending;
      }
    });
  }

  function updateParticleColors(scene, theme) {
    const colors = scene.particles.geometry.attributes.aColor.array;
    const positions = scene.particles.geometry.attributes.position.array;
    const count = colors.length / 3;
    const spread = scene.spread;

    const violet = new THREE.Color('#8b5cf6');
    const cyan = new THREE.Color('#2dd4bf');
    // In light mode, use deeper versions for contrast
    const violetL = new THREE.Color(theme === 'light' ? '#7c3aed' : '#8b5cf6');
    const cyanL = new THREE.Color(theme === 'light' ? '#14b8a6' : '#2dd4bf');

    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const mix = (y / spread + 1) * 0.5;
      const col = violetL.clone().lerp(cyanL, mix * 0.8 + Math.random() * 0.2);
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    scene.particles.geometry.attributes.aColor.needsUpdate = true;
  }

});
