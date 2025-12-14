/**
 * VIJAY ADITHYA B K - DATA ENGINEER PORTFOLIO
 * Enhanced Three.js Background - More Visible
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// CONFIGURATION - Enhanced for visibility
// ============================================================

const CONFIG = {
    particles: {
        count: 1500,
        size: 3
    },
    colors: {
        primary: 0x5de4c7,
        secondary: 0xfae4fc,
        tertiary: 0x89ddff
    }
};

// ============================================================
// CUSTOM CURSOR
// ============================================================

class CustomCursor {
    constructor() {
        this.cursor = document.getElementById('cursor');
        if (!this.cursor) return;

        this.dot = this.cursor.querySelector('.cursor-dot');
        this.outline = this.cursor.querySelector('.cursor-outline');

        this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.mouse = { x: this.pos.x, y: this.pos.y };

        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        const interactives = document.querySelectorAll('a, button, .work-item, .journal-item');
        interactives.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });

        this.render();
    }

    render() {
        this.pos.x += (this.mouse.x - this.pos.x) * 0.15;
        this.pos.y += (this.mouse.y - this.pos.y) * 0.15;

        if (this.dot) {
            this.dot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px) translate(-50%, -50%)`;
        }
        if (this.outline) {
            this.outline.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) translate(-50%, -50%)`;
        }

        requestAnimationFrame(() => this.render());
    }
}

// ============================================================
// PRELOADER
// ============================================================

class Preloader {
    constructor(onComplete) {
        this.preloader = document.getElementById('preloader');
        this.counter = document.getElementById('counter');
        this.progress = document.getElementById('progress');
        this.onComplete = onComplete;
        this.count = 0;

        if (this.preloader) {
            this.animate();
        } else if (onComplete) {
            onComplete();
        }
    }

    animate() {
        const duration = 1500;
        const interval = 20;
        const steps = duration / interval;
        const increment = 100 / steps;

        const timer = setInterval(() => {
            this.count += increment;
            if (this.count >= 100) {
                this.count = 100;
                clearInterval(timer);
                this.complete();
            }

            if (this.counter) {
                this.counter.textContent = Math.floor(this.count);
            }
            if (this.progress) {
                this.progress.style.width = `${this.count}%`;
            }
        }, interval);
    }

    complete() {
        setTimeout(() => {
            if (this.preloader) {
                this.preloader.classList.add('loaded');
            }
            if (this.onComplete) {
                this.onComplete();
            }
        }, 200);
    }
}

// ============================================================
// THREE.JS SCENE - ENHANCED VISIBILITY
// ============================================================

class PortfolioScene {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) {
            console.warn('No webgl-canvas found');
            return;
        }

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.createParticleField();
        this.createFloatingGeometry();
        this.createGlowingSpheres();
        this.setupEventListeners();
        this.animate();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 30;
    }

    // Main particle field - spread across entire view
    createParticleField() {
        const { count, size } = CONFIG.particles;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorPrimary = new THREE.Color(CONFIG.colors.primary);
        const colorSecondary = new THREE.Color(CONFIG.colors.secondary);
        const colorTertiary = new THREE.Color(CONFIG.colors.tertiary);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Spread across entire view
            positions[i3] = (Math.random() - 0.5) * 120;
            positions[i3 + 1] = (Math.random() - 0.5) * 120;
            positions[i3 + 2] = (Math.random() - 0.5) * 60 - 20;

            // Varied sizes
            sizes[i] = Math.random() * size + 1;

            // Tri-color scheme
            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.5) color = colorPrimary;
            else if (colorChoice < 0.8) color = colorSecondary;
            else color = colorTertiary;

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: this.renderer.getPixelRatio() }
            },
            vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          // Gentle floating animation
          pos.y += sin(uTime * 0.3 + position.x * 0.1) * 1.5;
          pos.x += cos(uTime * 0.2 + position.z * 0.1) * 1.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (150.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 25.0);
          
          vAlpha = smoothstep(100.0, 20.0, -mvPosition.z);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
          
          // Add glow
          float glow = exp(-dist * 3.0) * 0.8;
          alpha = max(alpha, glow);
          
          gl_FragColor = vec4(vColor, alpha * vAlpha * 0.9);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // Floating geometric shapes
    createFloatingGeometry() {
        this.geometries = new THREE.Group();

        // Larger, more visible rings
        for (let i = 0; i < 6; i++) {
            const radius = 10 + Math.random() * 15;
            const geometry = new THREE.TorusGeometry(radius, 0.15, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? CONFIG.colors.primary : CONFIG.colors.tertiary,
                transparent: true,
                opacity: 0.4
            });

            const ring = new THREE.Mesh(geometry, material);
            ring.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 60,
                -20 - Math.random() * 40
            );
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;

            ring.userData = {
                rotSpeed: 0.002 + Math.random() * 0.003,
                floatOffset: Math.random() * Math.PI * 2,
                originalY: ring.position.y
            };

            this.geometries.add(ring);
        }

        // Wireframe shapes
        for (let i = 0; i < 5; i++) {
            const shapeType = Math.floor(Math.random() * 3);
            let geometry;

            if (shapeType === 0) {
                geometry = new THREE.IcosahedronGeometry(3 + Math.random() * 3, 0);
            } else if (shapeType === 1) {
                geometry = new THREE.OctahedronGeometry(3 + Math.random() * 3, 0);
            } else {
                geometry = new THREE.TetrahedronGeometry(4 + Math.random() * 3, 0);
            }

            const material = new THREE.MeshBasicMaterial({
                color: CONFIG.colors.secondary,
                wireframe: true,
                transparent: true,
                opacity: 0.35
            });

            const shape = new THREE.Mesh(geometry, material);
            shape.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 70,
                -15 - Math.random() * 35
            );

            shape.userData = {
                rotSpeed: {
                    x: (Math.random() - 0.5) * 0.008,
                    y: (Math.random() - 0.5) * 0.008,
                    z: (Math.random() - 0.5) * 0.005
                },
                floatOffset: Math.random() * Math.PI * 2,
                originalY: shape.position.y
            };

            this.geometries.add(shape);
        }

        this.scene.add(this.geometries);
    }

    // Glowing spheres for extra visual interest
    createGlowingSpheres() {
        this.spheres = new THREE.Group();

        const sphereData = [
            { x: -40, y: 20, z: -35, size: 4, color: CONFIG.colors.primary },
            { x: 45, y: -25, z: -40, size: 3, color: CONFIG.colors.tertiary },
            { x: -30, y: -35, z: -30, size: 3.5, color: CONFIG.colors.secondary },
            { x: 50, y: 30, z: -45, size: 2.5, color: CONFIG.colors.primary }
        ];

        sphereData.forEach((data, i) => {
            const geometry = new THREE.SphereGeometry(data.size, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.25
            });

            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(data.x, data.y, data.z);

            // Add outer glow ring
            const glowGeo = new THREE.RingGeometry(data.size * 1.2, data.size * 1.8, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.copy(sphere.position);

            sphere.userData = {
                floatOffset: i * 0.7,
                originalY: data.y,
                glow: glow
            };

            this.spheres.add(sphere);
            this.spheres.add(glow);
        });

        this.scene.add(this.spheres);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (this.particles) {
            this.particles.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        // Animate particles
        if (this.particles) {
            this.particles.material.uniforms.uTime.value = elapsedTime;
            this.particles.rotation.y = elapsedTime * 0.02;

            // Mouse parallax
            this.particles.rotation.x += (this.mouse.y * 0.1 - this.particles.rotation.x) * 0.02;
        }

        // Animate geometries
        if (this.geometries) {
            this.geometries.children.forEach(mesh => {
                const { rotSpeed, floatOffset, originalY } = mesh.userData;

                if (typeof rotSpeed === 'number') {
                    mesh.rotation.z += rotSpeed;
                } else if (rotSpeed) {
                    mesh.rotation.x += rotSpeed.x;
                    mesh.rotation.y += rotSpeed.y;
                    mesh.rotation.z += rotSpeed.z || 0;
                }

                mesh.position.y = originalY + Math.sin(elapsedTime * 0.4 + floatOffset) * 3;
            });

            // Mouse parallax for geometries
            this.geometries.rotation.y += (this.mouse.x * 0.05 - this.geometries.rotation.y) * 0.02;
        }

        // Animate spheres
        if (this.spheres) {
            this.spheres.children.forEach((mesh, i) => {
                if (mesh.userData.originalY !== undefined) {
                    mesh.position.y = mesh.userData.originalY + Math.sin(elapsedTime * 0.5 + mesh.userData.floatOffset) * 2;

                    // Update glow position
                    if (mesh.userData.glow) {
                        mesh.userData.glow.position.y = mesh.position.y;
                        mesh.userData.glow.rotation.z = elapsedTime * 0.2;
                    }
                }
            });
        }

        // Camera movement
        this.camera.position.x += (this.mouse.x * 5 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouse.y * 3 - this.camera.position.y) * 0.02;

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================
// SCROLL ANIMATIONS
// ============================================================

class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        setTimeout(() => {
            this.setupNavigation();
            this.animateSections();
        }, 100);
    }

    setupNavigation() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);

                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        const header = document.querySelector('.header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    header.style.mixBlendMode = 'normal';
                    header.style.background = 'rgba(12, 12, 12, 0.9)';
                    header.style.backdropFilter = 'blur(10px)';
                } else {
                    header.style.mixBlendMode = 'difference';
                    header.style.background = 'transparent';
                    header.style.backdropFilter = 'none';
                }
            });
        }
    }

    animateSections() {
        gsap.utils.toArray('.section-header, .about-intro').forEach(section => {
            gsap.from(section, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                },
                opacity: 0,
                y: 50,
                duration: 0.8,
                ease: 'power3.out'
            });
        });

        gsap.utils.toArray('.work-item').forEach((item, i) => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 90%'
                },
                opacity: 0,
                y: 60,
                duration: 0.6,
                ease: 'power3.out',
                delay: i * 0.1
            });
        });

        gsap.utils.toArray('.expertise-category').forEach((cat, i) => {
            gsap.from(cat, {
                scrollTrigger: { trigger: cat, start: 'top 90%' },
                opacity: 0,
                y: 40,
                duration: 0.5,
                delay: i * 0.08
            });
        });

        gsap.utils.toArray('.journal-item').forEach((item, i) => {
            gsap.from(item, {
                scrollTrigger: { trigger: item, start: 'top 90%' },
                opacity: 0,
                y: 40,
                duration: 0.5,
                delay: i * 0.08
            });
        });
    }
}

// ============================================================
// FEATURED BLOGS LOADER
// ============================================================

function loadFeaturedBlogs() {
    const grid = document.getElementById('featuredBlogsGrid');
    if (!grid) return;

    // Default featured blogs (shown when localStorage is empty)
    const DEFAULT_FEATURED = [
        {
            title: 'Optimizing Snowflake Queries at Scale',
            slug: 'optimizing-snowflake-queries',
            category: 'Performance',
            excerpt: 'Learn how I reduced warehouse costs by 40% using clustering keys, materialized views, and query profiling.',
            createdAt: '2024-12-01T00:00:00Z',
            featured: true,
            status: 'published'
        },
        {
            title: 'Building Fault-Tolerant Data Pipelines',
            slug: 'fault-tolerant-pipelines',
            category: 'Architecture',
            excerpt: 'A comprehensive guide to implementing retry logic, dead letter queues, and alerting for resilient ETL systems.',
            createdAt: '2024-11-15T00:00:00Z',
            featured: true,
            status: 'published'
        },
        {
            title: 'SQL Server to Snowflake: A Deep Dive',
            slug: 'sql-server-to-snowflake',
            category: 'Migration',
            excerpt: 'Step-by-step guide to migrating legacy data warehouses to Snowflake.',
            createdAt: '2024-10-20T00:00:00Z',
            featured: true,
            status: 'published'
        }
    ];

    // Get blogs from localStorage
    const BLOG_STORAGE_KEY = 'portfolio_blogs';
    let blogs = [];

    try {
        const stored = localStorage.getItem(BLOG_STORAGE_KEY);
        if (stored) blogs = JSON.parse(stored);
    } catch (e) {
        console.error('Error loading blogs:', e);
    }

    // Filter for featured and published blogs
    let featuredBlogs = blogs
        .filter(blog => blog.featured && blog.status === 'published')
        .slice(0, 3);

    // If no featured blogs from storage, use defaults
    if (featuredBlogs.length === 0) {
        featuredBlogs = DEFAULT_FEATURED;
    }

    // Format date helper
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Render featured blogs
    grid.innerHTML = featuredBlogs.map(blog => `
        <article class="journal-item">
            <div class="journal-meta">
                <span class="journal-category">${blog.category || 'General'}</span>
                <span class="journal-date">${formatDate(blog.createdAt)}</span>
            </div>
            <h3 class="journal-title">${blog.title}</h3>
            <p class="journal-excerpt">${blog.excerpt || ''}</p>
            <a href="/blog-post.html?slug=${blog.slug}" class="journal-link">
                <span>Read Article</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
            </a>
        </article>
    `).join('');

    // No animation to ensure immediate visibility
    ScrollTrigger.refresh();
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    new CustomCursor();

    // Load featured blogs immediately (before preloader finishes)
    // Use setTimeout to ensure DOM is fully parsed
    setTimeout(() => {
        loadFeaturedBlogs();
    }, 0);

    new Preloader(() => {
        new PortfolioScene();
        new ScrollAnimations();
        // Also reload featured blogs after preloader in case they weren't ready
        loadFeaturedBlogs();
    });
});
