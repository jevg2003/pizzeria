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

// Función para mostrar modal
function showModal(title, message, type = 'info', redirect = false, redirectUrl = 'index.html') {
    // Crear modal simple
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a1a1a;
        padding: 2rem;
        border-radius: 10px;
        text-align: center;
        border: 2px solid ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#fada08'};
        max-width: 400px;
        width: 90%;
    `;
    
    modalContent.innerHTML = `
        <h3 style="color: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#fada08'}; margin-bottom: 1rem;">
            ${title}
        </h3>
        <p style="color: #ccc; margin-bottom: 1.5rem;">${message}</p>
        <button onclick="this.closest('.modal-container').remove(); ${redirect ? `window.location.href='${redirectUrl}'` : ''}" 
                style="background: #fada08; color: black; border: none; padding: 0.8rem 2rem; border-radius: 5px; cursor: pointer; font-weight: bold;">
            Aceptar
        </button>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.appendChild(modal);
    modalContainer.appendChild(modalContent);
    
    document.body.appendChild(modalContainer);
    
    // Auto-cerrar después de 3 segundos si es éxito
    if (type === 'success' && redirect) {
        setTimeout(() => {
            modalContainer.remove();
            window.location.href = redirectUrl;
        }, 3000);
    }
}

// Hacer disponible globalmente
window.showModal = showModal;