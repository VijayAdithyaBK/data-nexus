/**
 * Blog Post Viewer
 * Dynamically loads blog post content from localStorage based on slug
 */

import * as THREE from 'three';
import './style.css';

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

function loadBlogPost() {
    const container = document.getElementById('blogPostContainer');
    if (!container) return;

    // Get slug from URL - support both /blog/slug.html and /blog-post.html?slug=slug
    let slug = null;
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('slug')) {
        slug = urlParams.get('slug');
    } else {
        // Try to extract from path like /blog/slug.html
        const path = window.location.pathname;
        const match = path.match(/\/blog\/([^/]+)\.html$/);
        if (match) {
            slug = match[1];
        }
    }

    if (!slug) {
        container.innerHTML = `
            <div class="blog-post-error">
                <h1>Post Not Found</h1>
                <p>No blog post specified.</p>
                <a href="/blog.html" class="back-link">← Back to all articles</a>
            </div>
        `;
        return;
    }

    // Get blogs from localStorage
    const BLOG_STORAGE_KEY = 'portfolio_blogs';
    let blogs = [];

    try {
        const stored = localStorage.getItem(BLOG_STORAGE_KEY);
        if (stored) blogs = JSON.parse(stored);
    } catch (e) {
        console.error('Error loading blogs:', e);
    }

    // Find the blog by slug
    const blog = blogs.find(b => b.slug === slug || b.id === slug);

    if (!blog) {
        container.innerHTML = `
            <div class="blog-post-error">
                <h1>Post Not Found</h1>
                <p>The article you're looking for doesn't exist or has been removed.</p>
                <a href="/blog.html" class="back-link">← Back to all articles</a>
            </div>
        `;
        return;
    }

    // Check if published
    if (blog.status !== 'published') {
        container.innerHTML = `
            <div class="blog-post-error">
                <h1>Post Unavailable</h1>
                <p>This article is not currently published.</p>
                <a href="/blog.html" class="back-link">← Back to all articles</a>
            </div>
        `;
        return;
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Update page title
    document.getElementById('pageTitle').textContent = `${blog.title} — Vijay Adithya B K`;

    // Prepare content based on type
    let contentHtml = blog.content || '<p>No content available.</p>';
    if (blog.contentType === 'markdown' && typeof marked !== 'undefined') {
        contentHtml = marked.parse(blog.content);
    }

    // Render blog post
    container.innerHTML = `
        <header class="blog-post-header">
            <div class="blog-post-meta">
                <span class="blog-post-category">${blog.category || 'General'}</span>
                <span class="blog-post-date">${formatDate(blog.createdAt)}</span>
                <span class="blog-post-read">${blog.readTime || 5} min read</span>
            </div>
            <h1 class="blog-post-title">${blog.title}</h1>
            ${blog.excerpt ? `<p class="blog-post-excerpt">${blog.excerpt}</p>` : ''}
        </header>
        
        ${blog.coverImage ? `<div class="blog-post-cover"><img src="${blog.coverImage}" alt="${blog.title}"></div>` : ''}
        
        <div class="blog-post-content">
            ${contentHtml}
        </div>
    `;

    // Add styles for blog post if not already present
    if (!document.getElementById('blog-post-styles')) {
        const styles = document.createElement('style');
        styles.id = 'blog-post-styles';
        styles.textContent = `
            .blog-post-page {
                position: relative;
                z-index: 1;
                min-height: 100vh;
                padding: 120px 2rem 4rem;
                background: rgba(12, 12, 12, 0.85);
            }
            
            .blog-post-container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            .blog-post-header {
                margin-bottom: 3rem;
                text-align: center;
            }
            
            .blog-post-meta {
                display: flex;
                justify-content: center;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
                font-family: var(--font-mono);
                font-size: 0.85rem;
                color: var(--color-text-muted);
            }
            
            .blog-post-category {
                color: var(--color-accent);
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }
            
            .blog-post-title {
                font-family: var(--font-display);
                font-size: clamp(2rem, 5vw, 3.5rem);
                font-weight: 700;
                line-height: 1.2;
                margin-bottom: 1rem;
                color: var(--color-text);
            }
            
            .blog-post-excerpt {
                font-size: 1.25rem;
                color: var(--color-text-secondary);
                max-width: 600px;
                margin: 0 auto;
            }
            
            .blog-post-cover {
                margin: 2rem 0 3rem;
                border-radius: 12px;
                overflow: hidden;
            }
            
            .blog-post-cover img {
                width: 100%;
                height: auto;
                display: block;
            }
            
            .blog-post-content {
                font-size: 1.1rem;
                line-height: 1.8;
                color: var(--color-text-secondary);
            }
            
            .blog-post-content h2 {
                font-family: var(--font-display);
                font-size: 1.75rem;
                color: var(--color-text);
                margin: 2.5rem 0 1rem;
            }
            
            .blog-post-content h3 {
                font-family: var(--font-display);
                font-size: 1.35rem;
                color: var(--color-text);
                margin: 2rem 0 0.75rem;
            }
            
            .blog-post-content p {
                margin-bottom: 1.5rem;
            }
            
            .blog-post-content ul, .blog-post-content ol {
                margin: 1.5rem 0;
                padding-left: 1.5rem;
            }
            
            .blog-post-content li {
                margin-bottom: 0.5rem;
            }
            
            .blog-post-content pre {
                background: rgba(0, 0, 0, 0.5);
                padding: 1.5rem;
                border-radius: 8px;
                overflow-x: auto;
                margin: 1.5rem 0;
                font-family: var(--font-mono);
                font-size: 0.9rem;
            }
            
            .blog-post-content code {
                font-family: var(--font-mono);
                background: rgba(93, 228, 199, 0.1);
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                color: var(--color-accent);
            }
            
            .blog-post-content pre code {
                background: none;
                padding: 0;
            }
            
            .blog-post-content blockquote {
                border-left: 3px solid var(--color-accent);
                padding-left: 1.5rem;
                margin: 1.5rem 0;
                font-style: italic;
                color: var(--color-text-muted);
            }
            
            .blog-post-content img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 1.5rem 0;
            }
            
            .blog-post-error {
                text-align: center;
                padding: 4rem 2rem;
            }
            
            .blog-post-error h1 {
                font-family: var(--font-display);
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            
            .blog-post-error p {
                color: var(--color-text-muted);
                margin-bottom: 2rem;
            }
            
            .back-link {
                color: var(--color-accent);
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .blog-footer {
                position: relative;
                z-index: 1;
                background: rgba(12, 12, 12, 0.95);
                padding: 2rem;
            }
            
            .blog-footer .footer-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .back-to-blog {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--color-accent);
                text-decoration: none;
                font-size: 0.9rem;
                transition: opacity 0.3s;
            }
            
            .back-to-blog:hover {
                opacity: 0.8;
            }
            
            .blog-post-loading {
                text-align: center;
                padding: 4rem;
                color: var(--color-text-muted);
            }
            
            @media (max-width: 768px) {
                .blog-post-page {
                    padding: 100px 1rem 3rem;
                }
                
                .blog-post-meta {
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }
                
                .blog-footer .footer-content {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(styles);
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
