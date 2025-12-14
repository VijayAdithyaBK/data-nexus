/**
 * Blog Pages JavaScript
 * Subtle Three.js background for blog pages - designed for readability
 */

import * as THREE from 'three';
import './style.css';

// Custom Cursor for blog pages
class CustomCursor {
    constructor() {
        this.cursor = document.getElementById('cursor');
        if (!this.cursor) {
            this.createCursor();
        }

        this.dot = this.cursor?.querySelector('.cursor-dot');
        this.outline = this.cursor?.querySelector('.cursor-outline');

        if (!this.cursor) return;

        this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.mouse = { x: this.pos.x, y: this.pos.y };

        this.init();
    }

    createCursor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        this.cursor.id = 'cursor';
        this.cursor.innerHTML = `
      <div class="cursor-dot"></div>
      <div class="cursor-outline"></div>
    `;
        document.body.appendChild(this.cursor);
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        const interactives = document.querySelectorAll('a, button, .blog-card');
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

class BlogScene {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.createParticles();
        this.createFloatingRings();
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
        this.camera.position.z = 50;
    }

    // Subtle particles - small dots, not cubes
    createParticles() {
        const count = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const color1 = new THREE.Color(0x5de4c7);
        const color2 = new THREE.Color(0xfae4fc);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Position particles around edges, not center
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 60;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (Math.random() - 0.5) * 80;
            positions[i3 + 2] = -30 + Math.random() * -50;

            const mixFactor = Math.random();
            const color = color1.clone().lerp(color2, mixFactor);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // Elegant floating rings at edges
    createFloatingRings() {
        this.rings = new THREE.Group();

        const ringPositions = [
            { x: -60, y: 20, z: -40 },
            { x: 70, y: -30, z: -50 },
            { x: -50, y: -50, z: -60 },
            { x: 80, y: 40, z: -45 }
        ];

        ringPositions.forEach((pos, i) => {
            const geometry = new THREE.TorusGeometry(8 + i * 2, 0.1, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x5de4c7 : 0x89ddff,
                transparent: true,
                opacity: 0.15
            });

            const ring = new THREE.Mesh(geometry, material);
            ring.position.set(pos.x, pos.y, pos.z);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;

            ring.userData = {
                rotSpeed: 0.001 + Math.random() * 0.002,
                floatOffset: Math.random() * Math.PI * 2
            };

            this.rings.add(ring);
        });

        this.scene.add(this.rings);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        // Subtle particle rotation
        if (this.particles) {
            this.particles.rotation.y = elapsedTime * 0.02;
        }

        // Animate rings
        if (this.rings) {
            this.rings.children.forEach((ring, i) => {
                ring.rotation.z += ring.userData.rotSpeed;
                ring.position.y += Math.sin(elapsedTime * 0.5 + ring.userData.floatOffset) * 0.01;
            });
        }

        // Subtle camera movement based on mouse
        this.camera.position.x = this.mouse.x * 3;
        this.camera.position.y = this.mouse.y * 2;

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================
// PUBLISHED BLOGS LOADER
// ============================================================

// ============================================================
// PUBLISHED BLOGS LOADER
// ============================================================

import { getAllBlogs } from './utils/blog-loader.js';

function loadPublishedBlogs() {
    const grid = document.querySelector('.blog-grid');
    if (!grid) return;

    const blogs = getAllBlogs();
    const publishedBlogs = blogs.filter(blog => blog.status === 'published');

    // If no published blogs, show empty state
    if (publishedBlogs.length === 0) {
        grid.innerHTML = `
            <div class="blog-empty-state">
                <h3>No published articles yet</h3>
                <p>Check back soon for insights on data engineering.</p>
            </div>
        `;
        return;
    }

    // Format date helper
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Render published blogs
    grid.innerHTML = publishedBlogs.map(blog => `
        <article class="blog-card">
            <div class="blog-card-meta">
                <span class="blog-category">${blog.category || 'General'}</span>
                <span class="blog-date">${formatDate(blog.date)}</span>
            </div>
            <h2 class="blog-card-title">${blog.title}</h2>
            <p class="blog-card-excerpt">${blog.excerpt || ''}</p>
            <div class="blog-card-footer">
                <span class="read-time">${blog.readTime || 5} min read</span>
                <a href="blog-post.html?slug=${blog.slug}" class="blog-card-link">
                    Read Article
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                </a>
            </div>
        </article>
    `).join('');

    // Re-attach hover events for new cards
    document.querySelectorAll('.blog-card').forEach(card => {
        const cursor = document.getElementById('cursor');
        if (cursor) {
            card.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            card.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new CustomCursor();
    new BlogScene();
    loadPublishedBlogs(); // Load only published blogs
});
