// Cargar información del usuario
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupEventListeners();
    
    // Actualizar el enlace de autenticación
    if (typeof checkAuthStatus === 'function') {
        checkAuthStatus();
    }
});

// Cargar datos del usuario desde localStorage
function loadUserData() {
    const user = localStorage.getItem('pizzeriaUser');
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            
            // Actualizar elementos de la página con los datos del usuario
            document.getElementById('userName').textContent = userData.name;
            document.getElementById('userAvatar').textContent = userData.name.charAt(0).toUpperCase();
            document.getElementById('userFullName').textContent = userData.name;
            document.getElementById('userEmail').textContent = userData.email;
            
            // Establecer fecha de miembro (simulada)
            const joinDate = new Date();
            document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });
            
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            // Redirigir al login si hay error
            window.location.href = 'login.html';
        }
    } else {
        // Si no hay usuario, redirigir al login
        window.location.href = 'login.html';
    }
}

// Configurar event listeners para la página de perfil
function setupEventListeners() {
    // Botones de filtro de pedidos
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            // Aquí iría la lógica para filtrar los pedidos
            filterOrders(this.textContent);
        });
    });
    
    // Botones de edición
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Determinar qué se está editando según el contexto
            const card = this.closest('.detail-card');
            if (card.querySelector('h3').textContent.includes('Información Personal')) {
                editPersonalInfo();
            } else if (card.querySelector('h3').textContent.includes('Dirección de Entrega')) {
                editAddress();
            }
        });
    });
}

// Filtrar pedidos (función de ejemplo)
function filterOrders(filter) {
    console.log('Filtrando pedidos por:', filter);
    // Aquí iría la lógica real para filtrar los pedidos
    // Por ahora es solo una simulación
}

// Editar información personal (función de ejemplo)
function editPersonalInfo() {
    const newName = prompt('Ingresa tu nuevo nombre:', document.getElementById('userFullName').textContent);
    if (newName && newName.trim() !== '') {
        // Actualizar en la página
        document.getElementById('userFullName').textContent = newName;
        document.getElementById('userName').textContent = newName;
        document.getElementById('userAvatar').textContent = newName.charAt(0).toUpperCase();
        
        // Actualizar en localStorage
        const user = JSON.parse(localStorage.getItem('pizzeriaUser'));
        user.name = newName;
        localStorage.setItem('pizzeriaUser', JSON.stringify(user));
        
        // Actualizar barra de navegación
        if (typeof checkAuthStatus === 'function') {
            checkAuthStatus();
        }
        
        alert('Información actualizada correctamente');
    }
}

// Editar dirección (función de ejemplo)
function editAddress() {
    alert('Funcionalidad de edición de dirección en desarrollo');
    // Aquí iría un formulario modal para editar la dirección
}

// Función para mostrar un modal de edición (ejemplo)
function showEditModal(title, fields, onSubmit) {
    // Aquí iría el código para crear y mostrar un modal de edición
    console.log('Mostrando modal para:', title);
}