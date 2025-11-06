// js/auth-utils.js - Utilidades para autenticación personalizada

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'pizzeria-salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Función para verificar contraseña
async function verifyPassword(password, hashedPassword) {
    const testHash = await hashPassword(password);
    return testHash === hashedPassword;
}

// Función para generar token de sesión simple
function generateSessionToken(userId) {
    return btoa(JSON.stringify({
        userId: userId,
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2)
    }));
}

// Función para validar token de sesión
function validateSessionToken(token) {
    try {
        const sessionData = JSON.parse(atob(token));
        const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000;
        return !isExpired ? sessionData : null;
    } catch {
        return null;
    }
}

// Guardar sesión en localStorage
function saveUserSession(userData) {
    const sessionData = {
        user: userData,
        token: generateSessionToken(userData.id),
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('pizzeriaSession', JSON.stringify(sessionData));
    localStorage.setItem('pizzeriaUser', JSON.stringify(userData));
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('pizzeriaSession');
    localStorage.removeItem('pizzeriaUser');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('pizzeriaDraftPizza');
    window.location.href = 'index.html';
}

// Verificar si hay sesión activa
function checkActiveSession() {
    const session = localStorage.getItem('pizzeriaSession');
    if (!session) return null;
    
    try {
        const sessionData = JSON.parse(session);
        const validSession = validateSessionToken(sessionData.token);
        return validSession ? sessionData.user : null;
    } catch {
        return null;
    }
}