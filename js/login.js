// login.js - Funcionalidad para la página de login con modal personalizado

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el evento de submit del formulario
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener valores del formulario
            const usernameInput = this.querySelector('input[name="usuario"]');
            const passwordInput = this.querySelector('input[name="clave"]');
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            // Validaciones básicas
            if (!username) {
                showModal('Error', 'Por favor ingresa tu usuario o correo electrónico', 'error');
                usernameInput.focus();
                return;
            }
            
            if (!password) {
                showModal('Error', 'Por favor ingresa tu contraseña', 'error');
                passwordInput.focus();
                return;
            }
            
            // Simular usuario (en un caso real, verificarías contra una base de datos)
            const userData = {
                name: username || 'Usuario',
                email: username + '@ejemplo.com',
                loginDate: new Date().toISOString()
            };
            
            // Guardar en localStorage
            localStorage.setItem('pizzeriaUser', JSON.stringify(userData));
            
            // Mostrar mensaje de éxito con redirección automática
            showModal('¡Éxito!', '¡Inicio de sesión exitoso! Bienvenido a Pizzeria El Sinú', 'success', true);
        });
    }
    
    // Configurar botones de toggle si existen
    const btnLogin = document.getElementById('btnLogin');
    const btnRegistro = document.getElementById('btnRegistro');
    
    if (btnLogin && btnRegistro) {
        btnLogin.addEventListener('click', function() {
            // Remover clase active de todos los botones
            btnLogin.classList.add('active');
            btnRegistro.classList.remove('active');
        });
        
        btnRegistro.addEventListener('click', function() {
            // Remover clase active de todos los botones
            btnRegistro.classList.add('active');
            btnLogin.classList.remove('active');
        });
    }
    
    // Configurar el modal si existe
    setupModal();
});

// Función para mostrar modal personalizado
function showModal(title, message, type = 'info', redirect = false) {
    // Crear o obtener el modal
    let modal = document.getElementById('custom-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title"></h3>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <p id="modal-message"></p>
                </div>
                <div class="modal-footer">
                    <button id="modal-ok-btn" class="modal-btn"></button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Configurar event listeners del modal
        const closeBtn = modal.querySelector('.modal-close');
        const okBtn = modal.querySelector('#modal-ok-btn');
        
        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);
        
        // Cerrar modal al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Configurar según el tipo de modal
    const modalTitle = modal.querySelector('#modal-title');
    const modalMessage = modal.querySelector('#modal-message');
    const modalOkBtn = modal.querySelector('#modal-ok-btn');
    const modalContent = modal.querySelector('.modal-content');
    
    // Establecer contenido
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOkBtn.textContent = 'Aceptar';
    
    // Estilos según el tipo
    modalContent.className = 'modal-content';
    if (type === 'success') {
        modalContent.classList.add('modal-success');
    } else if (type === 'error') {
        modalContent.classList.add('modal-error');
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Si es éxito y debe redirigir, configurar el botón
    if (redirect) {
        modalOkBtn.onclick = function() {
            window.location.href = 'index.html';
        };
    }
}

// Función para cerrar el modal
function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Configuración inicial del modal
function setupModal() {
    // Añadir estilos para el modal si no existen
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .custom-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .modal-content {
                background: #1a1a1a;
                border-radius: 12px;
                width: 90%;
                max-width: 400px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .modal-header {
                padding: 1.2rem;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(35, 35, 35, 0.9);
            }
            
            .modal-header h3 {
                margin: 0;
                color: #fada08;
                font-size: 1.3rem;
            }
            
            .modal-close {
                color: #aaa;
                font-size: 1.5rem;
                cursor: pointer;
                line-height: 1;
                transition: color 0.3s;
            }
            
            .modal-close:hover {
                color: white;
            }
            
            .modal-body {
                padding: 1.5rem;
                color: #ccc;
                line-height: 1.5;
            }
            
            .modal-footer {
                padding: 1rem 1.5rem;
                text-align: right;
                border-top: 1px solid #333;
                background: rgba(35, 35, 35, 0.5);
            }
            
            .modal-btn {
                background: linear-gradient(135deg, #fada08, #e0c700);
                border: none;
                color: #000;
                padding: 0.6rem 1.5rem;
                border-radius: 30px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .modal-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
            
            .modal-success .modal-header {
                background: rgba(76, 175, 80, 0.2);
                border-bottom: 1px solid rgba(76, 175, 80, 0.3);
            }
            
            .modal-success .modal-header h3 {
                color: #4caf50;
            }
            
            .modal-error .modal-header {
                background: rgba(244, 67, 54, 0.2);
                border-bottom: 1px solid rgba(244, 67, 54, 0.3);
            }
            
            .modal-error .modal-header h3 {
                color: #f44336;
            }
        `;
        document.head.appendChild(styles);
    }
}