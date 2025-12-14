/**
 * Admin Dashboard
 * Handles blog list, filtering, actions with subtle Three.js background
 */

import * as THREE from 'three';
import {
    getBlogs, deleteBlog, archiveBlog, unarchiveBlog, publishBlog, unpublishBlog, toggleFeatured, formatDate
} from './blog-data.js';
import './admin-styles.css';

// ============================================================
// SESSION
// ============================================================

const SESSION_KEY = 'admin_session';

function getSession() {
    const s = sessionStorage.getItem(SESSION_KEY);
    if (!s) return null;
    try {
        const session = JSON.parse(s);
        return Date.now() > session.expires ? (sessionStorage.removeItem(SESSION_KEY), null) : session;
    } catch { return null; }
}

function isAuthenticated() { return getSession() !== null; }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

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

        document.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
        document.querySelectorAll('a, button, input, select, .filter-tab, .btn-icon').forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });
        this.render();
    }

    render() {
        this.pos.x += (this.mouse.x - this.pos.x) * 0.15;
        this.pos.y += (this.mouse.y - this.pos.y) * 0.15;
        if (this.dot) this.dot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px) translate(-50%, -50%)`;
        if (this.outline) this.outline.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) translate(-50%, -50%)`;
        requestAnimationFrame(() => this.render());
    }
}

// ============================================================
// SUBTLE THREE.JS SCENE
// ============================================================

class AdminScene {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();

        this.setupRenderer();
        this.setupCamera();
        this.createParticles();
        this.createFloatingRings();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        this.animate();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;
    }

    createParticles() {
        const count = 600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const c1 = new THREE.Color(0x5de4c7);
        const c2 = new THREE.Color(0xfae4fc);
        const c3 = new THREE.Color(0x89ddff);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;
            sizes[i] = Math.random() * 1.5 + 0.5;
            const c = Math.random() < 0.5 ? c1 : (Math.random() < 0.7 ? c2 : c3);
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uPixelRatio: { value: this.renderer.getPixelRatio() } },
            vertexShader: `
                attribute float size; attribute vec3 color;
                varying vec3 vColor; varying float vAlpha;
                uniform float uTime, uPixelRatio;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    pos.y += sin(uTime * 0.3 + position.x * 0.1) * 1.0;
                    pos.x += cos(uTime * 0.2 + position.z * 0.1) * 0.8;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = clamp(size * uPixelRatio * (80.0 / -mvPosition.z), 1.0, 8.0);
                    vAlpha = smoothstep(80.0, 20.0, -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor; varying float vAlpha;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    float alpha = max(1.0 - smoothstep(0.3, 0.5, dist), exp(-dist * 4.0) * 0.5);
                    gl_FragColor = vec4(vColor, alpha * vAlpha * 0.7);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFloatingRings() {
        this.rings = new THREE.Group();
        for (let i = 0; i < 4; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(10 + Math.random() * 12, 0.08, 16, 100),
                new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5de4c7 : 0x89ddff, transparent: true, opacity: 0.15 })
            );
            ring.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, -25 - Math.random() * 25);
            ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            ring.userData.rotSpeed = 0.001 + Math.random() * 0.002;
            this.rings.add(ring);
        }
        this.scene.add(this.rings);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.particles) this.particles.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const t = this.clock.getElapsedTime();
        if (this.particles) { this.particles.material.uniforms.uTime.value = t; this.particles.rotation.y = t * 0.015; }
        if (this.rings) this.rings.children.forEach(r => r.rotation.z += r.userData.rotSpeed);
        this.camera.position.x += (this.mouse.x * 3 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.02;
        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================
// DASHBOARD
// ============================================================

let currentFilter = 'all';
let blogToDelete = null;

function init() {
    if (!isAuthenticated()) { window.location.href = '/admin.html'; return; }
    new CustomCursor();
    new AdminScene();
    setupLogout();
    setupFilters();
    setupModals();
    setupNewBlogButtons();
    renderBlogList();
}

function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        window.location.href = '/admin.html';
    });
}

function setupFilters() {
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderBlogList();
        });
    });
}

function renderBlogList() {
    const tbody = document.getElementById('blogTableBody');
    const emptyState = document.getElementById('emptyState');
    const thead = document.querySelector('.blog-table thead');
    if (!tbody) return;

    let blogs = getBlogs();
    if (currentFilter !== 'all') blogs = blogs.filter(b => b.status === currentFilter);

    if (blogs.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (thead) thead.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (thead) thead.style.display = '';

    tbody.innerHTML = blogs.map(blog => `
        <tr>
            <td>
                <div class="blog-title-cell">
                    <span class="blog-title-text">${escapeHtml(blog.title)}</span>
                    <span class="blog-slug">/blog/${blog.slug}.html</span>
                </div>
            </td>
            <td><span class="category-badge">${escapeHtml(blog.category)}</span></td>
            <td><span class="status-badge ${blog.status}">${blog.status}</span></td>
            <td class="date-cell">${formatDate(blog.updatedAt)}</td>
            <td><div class="action-buttons">
                <button class="btn-icon ${blog.featured ? 'active' : ''}" data-action="feature" data-id="${blog.id}" title="${blog.featured ? 'Unfeature' : 'Feature'}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${blog.featured ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </button>
                <button class="btn-icon" data-action="edit" data-id="${blog.id}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                ${blog.status === 'archived'
            ? `<button class="btn-icon" data-action="unarchive" data-id="${blog.id}" title="Unarchive"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>`
            : `${blog.status === 'published'
                ? `<button class="btn-icon" data-action="unpublish" data-id="${blog.id}" title="Unpublish"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/></svg></button>`
                : `<button class="btn-icon" data-action="publish" data-id="${blog.id}" title="Publish"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg></button>`}
                    <button class="btn-icon" data-action="archive" data-id="${blog.id}" title="Archive"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg></button>`}
                <button class="btn-icon danger" data-action="delete" data-id="${blog.id}" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div></td>
        </tr>
    `).join('');

    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { action, id } = btn.dataset;
            if (action === 'edit') window.location.href = `/admin-editor.html?id=${id}`;
            else if (action === 'delete') showDeleteModal(id);
            else if (action === 'archive') { archiveBlog(id); showToast('Post archived', 'success'); renderBlogList(); }
            else if (action === 'unarchive') { unarchiveBlog(id); showToast('Post unarchived to drafts', 'success'); renderBlogList(); }
            else if (action === 'publish') { publishBlog(id); renderBlogList(); }
            else if (action === 'unpublish') { unpublishBlog(id); renderBlogList(); }
            else if (action === 'feature') {
                const result = toggleFeatured(id);
                if (!result.success) {
                    showToast(result.message, 'error');
                } else if (result.featured) {
                    showToast(result.message, 'success');
                }
                renderBlogList();
            }
        });
    });
}

function setupModals() {
    document.getElementById('cancelDelete')?.addEventListener('click', hideDeleteModal);
    document.getElementById('confirmDelete')?.addEventListener('click', () => { if (blogToDelete) { deleteBlog(blogToDelete); renderBlogList(); } hideDeleteModal(); });
    document.getElementById('deleteModal')?.addEventListener('click', (e) => { if (e.target.id === 'deleteModal') hideDeleteModal(); });
}

function showDeleteModal(id) {
    const blog = getBlogs().find(b => b.id === id);
    if (!blog) return;
    blogToDelete = id;
    document.getElementById('deleteTitle').textContent = blog.title;
    document.getElementById('deleteModal').classList.add('show');
}

function hideDeleteModal() { blogToDelete = null; document.getElementById('deleteModal').classList.remove('show'); }

function setupNewBlogButtons() {
    ['newBlogBtn', 'emptyNewBtn'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => { window.location.href = '/admin-editor.html'; });
    });
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'error') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'error' ? '⚠️' : type === 'success' ? '✓' : 'ℹ️'}
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">×</button>
    `;

    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .custom-toast {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                background: rgba(18, 18, 18, 0.98);
                border: 1px solid rgba(255, 193, 7, 0.5);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 10000;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                opacity: 0;
                animation: toastIn 0.3s ease forwards;
                max-width: 90%;
            }
            .custom-toast.toast-error {
                border-color: rgba(255, 193, 7, 0.6);
            }
            .custom-toast.toast-success {
                border-color: rgba(93, 228, 199, 0.6);
            }
            .toast-icon {
                font-size: 1.25rem;
            }
            .toast-message {
                color: #f0f0f0;
                font-size: 0.95rem;
                font-family: var(--font-display);
            }
            .toast-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0 0.25rem;
                margin-left: 0.5rem;
                transition: color 0.2s;
            }
            .toast-close:hover {
                color: #fff;
            }
            @keyframes toastIn {
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            @keyframes toastOut {
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
            .custom-toast.hiding {
                animation: toastOut 0.3s ease forwards;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

document.addEventListener('DOMContentLoaded', init);
