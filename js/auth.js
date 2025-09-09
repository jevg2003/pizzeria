// Función para verificar el estado de autenticación
function checkAuthStatus() {
    // Verificar si hay un usuario en localStorage (simulando sesión)
    const user = localStorage.getItem('pizzeriaUser');
    const authLink = document.getElementById('auth-link');
    const cartNavItem = document.getElementById('cart-nav-item');
    
    if (user) {
        // Si hay usuario logueado, mostrar información del perfil y carrito
        const userData = JSON.parse(user);
        authLink.innerHTML = `
        <div class="user-profile">
            <a href="perfil.html" class="user-name">${userData.name}</a>
            <button onclick="logout()" class="btn-logout">Cerrar Sesión</button>
        </div>
        `;
        if (cartNavItem) cartNavItem.style.display = 'block';
    } else {
        // Si no hay usuario, mostrar botón de login y ocultar carrito
        authLink.innerHTML = '<a href="login.html" class="btn-login">INICIAR SESIÓN</a>';
        if (cartNavItem) cartNavItem.style.display = 'none';
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('pizzeriaDraftPizza');
    localStorage.removeItem('pizzeriaUser');
    localStorage.removeItem('cartItems');
    if (typeof updateCartCount === 'function') updateCartCount(0);
    checkAuthStatus(); // Actualizar la UI
}

// Verificar estado al cargar la página
document.addEventListener('DOMContentLoaded', checkAuthStatus);