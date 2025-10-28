// js/auth.js - Versión con tabla personalizada

// Función para verificar el estado de autenticación
function checkAuthStatus() {
    const authLink = document.getElementById('auth-link');
    const cartNavItem = document.getElementById('cart-nav-item');
    
    const activeUser = checkActiveSession();
    
    if (activeUser) {
        // Usuario autenticado
        authLink.innerHTML = `
        <div class="user-profile">
            <a href="perfil.html" class="user-name">${activeUser.name}</a>
            <button onclick="logout()" class="btn-logout">Cerrar Sesión</button>
        </div>
        `;
        if (cartNavItem) cartNavItem.style.display = 'block';
    } else {
        // No autenticado
        authLink.innerHTML = '<a href="login.html" class="btn-login">INICIAR SESIÓN</a>';
        if (cartNavItem) cartNavItem.style.display = 'none';
    }
}

// Hacer logout disponible globalmente
window.logout = logout;

// Verificar estado al cargar la página
document.addEventListener('DOMContentLoaded', checkAuthStatus);