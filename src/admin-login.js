/**
 * Admin Login Page
 * Includes subtle Three.js background and custom cursor (same as homepage)
 */

import * as THREE from 'three';
import './style.css';

// ============================================================
// CONFIGURATION
// ============================================================

const VALID_USERNAME = 'sendhelp';
const VALID_PASSWORD = 'Strongword@123';
const SESSION_KEY = 'admin_session';
const SESSION_DURATION = 3600000;

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

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.querySelectorAll('a, button, input').forEach(el => {
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
// THREE.JS SCENE - SUBTLE LIKE HOMEPAGE
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
        const count = 800;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorPrimary = new THREE.Color(0x5de4c7);
        const colorSecondary = new THREE.Color(0xfae4fc);
        const colorTertiary = new THREE.Color(0x89ddff);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Spread across view
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 80;
            positions[i3 + 2] = (Math.random() - 0.5) * 50 - 20;

            // Small varied sizes
            sizes[i] = Math.random() * 1.5 + 0.5;

            // Color mix
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

        // Using shader material for soft glowing dots
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
                    pos.y += sin(uTime * 0.3 + position.x * 0.1) * 1.0;
                    pos.x += cos(uTime * 0.2 + position.z * 0.1) * 0.8;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
                    gl_PointSize = clamp(gl_PointSize, 1.0, 8.0);
                    vAlpha = smoothstep(80.0, 20.0, -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    float glow = exp(-dist * 4.0) * 0.5;
                    alpha = max(alpha, glow);
                    gl_FragColor = vec4(vColor, alpha * vAlpha * 0.7);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFloatingRings() {
        this.rings = new THREE.Group();

        for (let i = 0; i < 4; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(10 + Math.random() * 12, 0.08, 16, 100),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0x5de4c7 : 0x89ddff,
                    transparent: true,
                    opacity: 0.15
                })
            );
            ring.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 60,
                -25 - Math.random() * 25
            );
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            ring.userData.rotSpeed = 0.001 + Math.random() * 0.002;
            this.rings.add(ring);
        }

        this.scene.add(this.rings);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.particles) {
            this.particles.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const elapsed = this.clock.getElapsedTime();

        if (this.particles) {
            this.particles.material.uniforms.uTime.value = elapsed;
            this.particles.rotation.y = elapsed * 0.015;
        }

        if (this.rings) {
            this.rings.children.forEach(ring => {
                ring.rotation.z += ring.userData.rotSpeed;
            });
        }

        // Subtle camera movement
        this.camera.position.x += (this.mouse.x * 3 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.02;

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function createSession() {
    const session = { token: crypto.randomUUID(), expires: Date.now() + SESSION_DURATION };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function getSession() {
    const sessionStr = sessionStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
        const session = JSON.parse(sessionStr);
        if (Date.now() > session.expires) {
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    } catch { return null; }
}

function isAuthenticated() { return getSession() !== null; }

function handleLogin(username, password) {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        createSession();
        return true;
    }
    return false;
}

function initLoginPage() {
    if (isAuthenticated()) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        errorDiv.classList.remove('show');

        await new Promise(r => setTimeout(r, 400));

        if (handleLogin(username, password)) {
            window.location.href = 'admin-dashboard.html';
        } else {
            errorDiv.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });
}

export { isAuthenticated, getSession };
export function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

document.addEventListener('DOMContentLoaded', () => {
    new CustomCursor();
    new AdminScene();
    initLoginPage();
});
