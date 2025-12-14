/**
 * Blog Post Viewer
 * Dynamically loads blog post content from localStorage based on slug
 */

import * as THREE from 'three';
import './style.css';
import './blog-post.css';

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

        const interactives = document.querySelectorAll('a, button');
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
// THREE.JS SCENE (Subtle background)
// ============================================================

class BlogPostScene {
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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;
    }

    createParticles() {
        const count = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const c1 = new THREE.Color(0x5de4c7);
        const c2 = new THREE.Color(0x89ddff);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;

            const c = Math.random() < 0.5 ? c1 : c2;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.4
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const t = this.clock.getElapsedTime();

        if (this.particles) {
            this.particles.rotation.y = t * 0.02;
        }

        this.camera.position.x = this.mouse.x * 2;
        this.camera.position.y = this.mouse.y * 1;

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================
// BLOG POST LOADER
// ============================================================

// ============================================================
// BLOG POST LOADER
// ============================================================

import { getBlogBySlug } from './utils/blog-loader.js';

function loadBlogPost() {
    const container = document.getElementById('blogPostContainer');
    if (!container) return;

    // Get slug from URL
    let slug = null;
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('slug')) {
        slug = urlParams.get('slug');
    } else {
        const path = window.location.pathname;
        const match = path.match(/\/blog\/([^/]+)\.html$/);
        if (match) {
            slug = match[1];
        }
    }

    if (!slug) {
        showError('Post Not Found', 'No blog post specified.');
        return;
    }

    const blog = getBlogBySlug(slug);

    if (!blog) {
        showError('Post Not Found', "The article you're looking for doesn't exist or has been removed.");
        return;
    }

    if (blog.status !== 'published') {
        showError('Post Unavailable', 'This article is not currently published.');
        return;
    }

    // Format date
    const date = new Date(blog.date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Helper to estimate read time
    const readTime = blog.readTime || Math.ceil(blog.content.split(' ').length / 200);

    // Render Blog Post
    const contentHTML = typeof marked !== 'undefined' ? marked.parse(blog.content) : blog.content;

    // Update page title
    document.title = `${blog.title} — Vijay Adithya B K`;

    container.innerHTML = `
        <article class="blog-article">
            <header class="article-header">
                <div class="article-meta">
                    <span class="article-category">${blog.category || 'General'}</span>
                    <span class="meta-dot">•</span>
                    <span class="article-date">${formattedDate}</span>
                    <span class="meta-dot">•</span>
                    <span class="article-read-time">${readTime} min read</span>
                </div>
                <h1 class="article-title">${blog.title}</h1>
            </header>
            
            <div class="article-content">
                ${contentHTML}
            </div>
            
            <footer class="article-footer">
                <div class="share-links">
                    <span>Share this article:</span>
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener">Twitter</a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener">LinkedIn</a>
                </div>
            </footer>
        </article>
    `;
}

function showError(title, message) {
    const container = document.getElementById('blogPostContainer');
    if (container) {
        container.innerHTML = `
            <div class="blog-post-error">
                <h1>${title}</h1>
                <p>${message}</p>
                <a href="blog.html" class="back-link">← Back to all articles</a>
            </div>
        `;
    }
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    new CustomCursor();
    new BlogPostScene();
    loadBlogPost();
});
