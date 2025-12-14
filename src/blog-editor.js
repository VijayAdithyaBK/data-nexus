/**
 * Blog Editor with subtle Three.js background
 */

import * as THREE from 'three';
import { getBlogById, createBlog, updateBlog, deleteBlog, getImages, addImage, deleteImage } from './blog-data.js';
import './editor-styles.css';

// ============================================================
// SESSION
// ============================================================

const SESSION_KEY = 'admin_session';
function getSession() {
    const s = sessionStorage.getItem(SESSION_KEY);
    if (!s) return null;
    try { const session = JSON.parse(s); return Date.now() > session.expires ? (sessionStorage.removeItem(SESSION_KEY), null) : session; }
    catch { return null; }
}
function isAuthenticated() { return getSession() !== null; }

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
        this.mouse = { ...this.pos };

        document.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
        document.querySelectorAll('a, button, input, select, textarea, .toolbar-btn, .gallery-item, .upload-area').forEach(el => {
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
// SUBTLE THREE.JS
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
        const count = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const c1 = new THREE.Color(0x5de4c7), c2 = new THREE.Color(0xfae4fc), c3 = new THREE.Color(0x89ddff);

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
                    gl_FragColor = vec4(vColor, alpha * vAlpha * 0.6);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFloatingRings() {
        this.rings = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(10 + Math.random() * 10, 0.08, 16, 100),
                new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5de4c7 : 0x89ddff, transparent: true, opacity: 0.12 })
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
// EDITOR STATE
// ============================================================

let currentBlogId = null, isNewBlog = true, insertingForCover = false;
let savedSelection = null;

// Save the current selection before opening modals
function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0).cloneRange();
    }
}

// Restore the saved selection
function restoreSelection() {
    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }
}

function init() {
    if (!isAuthenticated()) { window.location.href = 'admin.html'; return; }
    new CustomCursor();
    new AdminScene();

    const params = new URLSearchParams(window.location.search);
    currentBlogId = params.get('id');
    isNewBlog = !currentBlogId;

    if (!isNewBlog) { loadBlog(currentBlogId); document.getElementById('deleteBtn').style.display = 'block'; }

    setupToolbar();
    document.getElementById('saveBtn').addEventListener('click', saveBlog);
    document.getElementById('deleteBtn').addEventListener('click', () => {
        if (confirm('Delete this blog post?')) { deleteBlog(currentBlogId); window.location.href = 'admin-dashboard.html'; }
    });
    setupModals();
    setupImageGallery();
    document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveBlog(); } });
    document.getElementById('previewBtn')?.addEventListener('click', () => { saveBlog(); if (currentBlogId) window.open(`blog-post.html?slug=${getBlogById(currentBlogId).slug}`, '_blank'); });

    setupPasteHandler();
    setupMarkdownImport();
    setupColorPicker();
    setupImportModal();
    setupEditorMode();
}

function loadBlog(id) {
    const blog = getBlogById(id);
    if (!blog) { alert('Blog not found'); window.location.href = '/admin-dashboard.html'; return; }
    document.getElementById('blogTitle').value = blog.title;
    document.getElementById('blogCategory').value = blog.category;
    document.getElementById('blogExcerpt').value = blog.excerpt;
    document.getElementById('blogStatus').value = blog.status;

    // Handle Content Type
    const modeSelect = document.getElementById('editorMode');
    if (blog.contentType === 'markdown') {
        modeSelect.value = 'markdown';
        document.getElementById('markdownEditor').value = blog.content;
        toggleEditorMode('markdown');
    } else {
        modeSelect.value = 'visual';
        document.getElementById('editorBody').innerHTML = blog.content;
        toggleEditorMode('visual');
    }

    document.title = `Edit: ${blog.title} | Admin`;
    if (blog.coverImage) document.getElementById('coverPreview').innerHTML = `<img src="${blog.coverImage}" alt="Cover" />`;
}

function saveBlog() {
    const title = document.getElementById('blogTitle').value.trim();
    if (!title) { alert('Please enter a title'); return; }

    const mode = document.getElementById('editorMode').value;
    const content = mode === 'markdown'
        ? document.getElementById('markdownEditor').value
        : document.getElementById('editorBody').innerHTML;

    const blogData = {
        title,
        category: document.getElementById('blogCategory').value.trim() || 'General',
        excerpt: document.getElementById('blogExcerpt').value.trim(),
        status: document.getElementById('blogStatus').value,
        content: content,
        contentType: mode, // 'markdown' or 'visual' (html)
        coverImage: document.getElementById('coverPreview').querySelector('img')?.src || ''
    };

    try {
        if (isNewBlog) {
            const newBlog = createBlog(blogData);
            currentBlogId = newBlog.id; isNewBlog = false;
            window.history.replaceState({}, '', `/admin-editor.html?id=${newBlog.id}`);
            document.getElementById('deleteBtn').style.display = 'block';
        } else {
            updateBlog(currentBlogId, blogData);
        }
        const btn = document.getElementById('saveBtn');
        btn.textContent = 'Saved!'; btn.style.background = '#27ae60';
        setTimeout(() => { btn.textContent = 'Save'; btn.style.background = ''; }, 2000);
    } catch (e) { console.error(e); alert('Error saving'); }
}

// ============================================================
// TOOLBAR
// ============================================================

function setupToolbar() {
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.execCommand(btn.dataset.command, false, btn.dataset.value || null);
            document.getElementById('editorBody').focus();
        });
    });
    document.getElementById('insertLinkBtn').addEventListener('click', openLinkModal);
    document.getElementById('insertImageBtn').addEventListener('click', () => openImageModal(false));
    document.getElementById('insertCodeBtn').addEventListener('click', openCodeModal);
}

// ============================================================
// MODALS
// ============================================================

function openLinkModal() {
    saveSelection();
    document.getElementById('linkText').value = window.getSelection().toString();
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkModal').classList.add('show');
}
function closeLinkModal() { document.getElementById('linkModal').classList.remove('show'); }
function insertLink() {
    const url = document.getElementById('linkUrl').value.trim();
    const text = document.getElementById('linkText').value.trim() || url;
    if (!url) { alert('Enter a URL'); return; }
    closeLinkModal();
    document.getElementById('editorBody').focus();
    restoreSelection();
    document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${text}</a>`);
}

function openCodeModal() {
    saveSelection();
    document.getElementById('codeContent').value = '';
    document.getElementById('codeLanguage').value = 'sql';
    document.getElementById('codeModal').classList.add('show');
}
function closeCodeModal() { document.getElementById('codeModal').classList.remove('show'); }
function insertCode() {
    const code = document.getElementById('codeContent').value;
    const lang = document.getElementById('codeLanguage').value;
    if (!code.trim()) { alert('Enter code'); return; }
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    closeCodeModal();
    document.getElementById('editorBody').focus();
    restoreSelection();
    document.execCommand('insertHTML', false, `<pre><code class="language-${lang}">${escaped}</code></pre><p></p>`);
}

function openImageModal(forCover) {
    if (!forCover) saveSelection();
    insertingForCover = forCover;
    loadGalleryImages();
    document.getElementById('imageModal').classList.add('show');
}
function closeImageModal() { document.getElementById('imageModal').classList.remove('show'); }

function loadGalleryImages() {
    const gallery = document.getElementById('galleryGrid');
    const images = getImages();
    gallery.innerHTML = images.map(img => `
        <div class="gallery-item" data-url="${img.url}" data-id="${img.id}">
            <img src="${img.url}" alt="${img.name}" />
            <div class="gallery-item-overlay"><button class="gallery-item-delete" data-id="${img.id}">×</button></div>
        </div>
    `).join('');

    gallery.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', (e) => { if (!e.target.closest('.gallery-item-delete')) insertImageFromGallery(item.dataset.url); });
    });
    gallery.querySelectorAll('.gallery-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete?')) { deleteImage(btn.dataset.id); loadGalleryImages(); } });
    });
}

function insertImageFromGallery(url) {
    closeImageModal();
    if (insertingForCover) {
        document.getElementById('coverPreview').innerHTML = `<img src="${url}" alt="Cover" />`;
    } else {
        document.getElementById('editorBody').focus();
        restoreSelection();
        document.execCommand('insertHTML', false, `<img src="${url}" alt="" /><p></p>`);
    }
}

function setupImageGallery() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadInput = document.getElementById('imageUpload');
    uploadArea.addEventListener('click', () => uploadInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); });
    uploadInput.addEventListener('change', (e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); });
    document.getElementById('selectCoverBtn').addEventListener('click', () => openImageModal(true));
}

function handleUpload(file) {
    if (!file.type.startsWith('image/')) { alert('Select an image'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { addImage({ name: file.name, url: e.target.result, type: file.type }); loadGalleryImages(); };
    reader.readAsDataURL(file);
}

function setupModals() {
    document.getElementById('cancelLink').addEventListener('click', closeLinkModal);
    document.getElementById('insertLink').addEventListener('click', insertLink);
    document.getElementById('linkModal').addEventListener('click', (e) => { if (e.target.id === 'linkModal') closeLinkModal(); });
    document.getElementById('cancelCode').addEventListener('click', closeCodeModal);
    document.getElementById('insertCode').addEventListener('click', insertCode);
    document.getElementById('codeModal').addEventListener('click', (e) => { if (e.target.id === 'codeModal') closeCodeModal(); });
    document.getElementById('closeImageModal').addEventListener('click', closeImageModal);
    document.getElementById('closeImageModal').addEventListener('click', closeImageModal);
    document.getElementById('imageModal').addEventListener('click', (e) => { if (e.target.id === 'imageModal') closeImageModal(); });
}

// ============================================================
// PASTE HANDLER & MARKDOWN IMPORT
// ============================================================

function setupPasteHandler() {
    const editor = document.getElementById('editorBody');
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');

        if (html) {
            // Create a temp element to clean the HTML
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Remove background styles
            temp.querySelectorAll('*').forEach(el => {
                el.style.background = '';
                el.style.backgroundColor = '';
                el.style.color = ''; // Also reset color to avoid theme conflicts
            });

            document.execCommand('insertHTML', false, temp.innerHTML);
        } else {
            document.execCommand('insertText', false, text);
        }
    });
}

function setupColorPicker() {
    const picker = document.getElementById('bgColorPicker');
    if (!picker) return;

    picker.addEventListener('input', (e) => {
        document.execCommand('hiliteColor', false, e.target.value);
        document.getElementById('editorBody').focus();
    });
}

function setupImportModal() {
    const btn = document.getElementById('importMarkdownBtn');
    const modal = document.getElementById('confirmModal');
    const cancel = document.getElementById('cancelConfirm');
    const confirm = document.getElementById('confirmImport');
    const input = document.getElementById('markdownUpload');

    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    cancel.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    confirm.addEventListener('click', () => {
        modal.classList.remove('show');
        input.click();
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

function setupMarkdownImport() {
    const input = document.getElementById('markdownUpload');
    if (!input) return;

    // Note: The button click is now handled by setupImportModal

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const md = e.target.result;
            // Use marked.parse if available (which we added via CDN), otherwise fallback
            let html = '';
            if (typeof marked !== 'undefined') {
                html = marked.parse(md);
            } else {
                html = parseMarkdown(md);
            }

            // Insert based on mode
            const mode = document.getElementById('editorMode').value;
            if (mode === 'markdown') {
                // In markdown mode, insert raw markdown
                document.getElementById('markdownEditor').value = md;
            } else {
                // In visual mode, insert converted HTML
                document.getElementById('editorBody').innerHTML = html;
            }
            input.value = '';
        };
        reader.readAsText(file);
    });
}

function setupEditorMode() {
    const select = document.getElementById('editorMode');
    select.addEventListener('change', () => {
        toggleEditorMode(select.value);
    });
}

function toggleEditorMode(mode) {
    const visualEditor = document.getElementById('editorBody');
    const visualToolbar = document.querySelector('.editor-toolbar');
    const markdownEditor = document.getElementById('markdownEditor');

    if (mode === 'markdown') {
        visualEditor.style.display = 'none';
        visualToolbar.style.opacity = '0.5'; // Dim toolbar
        visualToolbar.style.pointerEvents = 'none'; // Disable toolbar buttons
        markdownEditor.style.display = 'block';
    } else {
        visualEditor.style.display = 'block';
        visualToolbar.style.opacity = '1';
        visualToolbar.style.pointerEvents = 'auto';
        markdownEditor.style.display = 'none';
    }
}

// Fallback simple parser if marked isn't loaded
function parseMarkdown(md) {
    if (!md) return '';
    let html = md;

    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    html = html.replace(/\n\n/g, '<br><br>');

    return html;
}

document.addEventListener('DOMContentLoaded', init);
