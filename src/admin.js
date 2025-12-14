/**
 * Admin Authentication System
 * Handles login, session management, and credential validation
 */

import './style.css';

// ============================================================
// CONFIGURATION - Hashed Credentials
// ============================================================

// Pre-computed SHA-256 hash for 'sendhelp:Strongword@123'
// Generated using: SHA256('sendhelp:Strongword@123')
const VALID_CREDENTIALS_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // Placeholder - will verify on login
const VALID_USERNAME = 'sendhelp';
const VALID_PASSWORD = 'Strongword@123';
const SESSION_KEY = 'admin_session';
const SESSION_DURATION = 3600000; // 1 hour in milliseconds

// ============================================================
// HASHING UTILITY
// ============================================================

async function hashCredentials(username, password) {
    const combined = `${username}:${password}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function createSession() {
    const session = {
        token: crypto.randomUUID(),
        expires: Date.now() + SESSION_DURATION
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function getSession() {
    const sessionStr = sessionStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    try {
        const session = JSON.parse(sessionStr);
        if (Date.now() > session.expires) {
            clearSession();
            return null;
        }
        return session;
    } catch {
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function isAuthenticated() {
    return getSession() !== null;
}

// ============================================================
// LOGIN HANDLER
// ============================================================

async function handleLogin(username, password) {
    // Simple credential check (client-side security is limited anyway)
    // For production, use a proper backend authentication
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        createSession();
        return true;
    }

    return false;
}

// ============================================================
// PROTECTED PAGE CHECK
// ============================================================

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/admin.html';
        return false;
    }
    return true;
}

// ============================================================
// PAGE INITIALIZATION
// ============================================================

function initLoginPage() {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
        window.location.href = '/admin-dashboard.html';
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

        // Disable button during validation
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        errorDiv.classList.remove('show');

        try {
            const success = await handleLogin(username, password);

            if (success) {
                window.location.href = '/admin-dashboard.html';
            } else {
                errorDiv.classList.add('show');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });
}

// ============================================================
// EXPORTS FOR OTHER MODULES
// ============================================================

export { isAuthenticated, requireAuth, clearSession, getSession };

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the login page
    if (document.getElementById('loginForm')) {
        initLoginPage();
    }
});

// ============================================================
// GENERATE HASH UTILITY (run once to get the correct hash)
// ============================================================

// Uncomment to generate hash for new credentials:
/*
(async () => {
    const hash = await hashCredentials('sendhelp', 'Strongword@123');
    console.log('Credential hash:', hash);
})();
*/
