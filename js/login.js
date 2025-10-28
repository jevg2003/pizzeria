// js/login.js - Versión con tabla personalizada
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Iniciando sesión...';
            submitBtn.disabled = true;
            
            const formData = new FormData(this);
            const credentials = {
                email: formData.get('usuario').toLowerCase().trim(),
                password: formData.get('clave')
            };
            
            // Validaciones básicas
            if (!credentials.email) {
                showModal('Error', 'Por favor ingresa tu correo electrónico', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (!credentials.password) {
                showModal('Error', 'Por favor ingresa tu contraseña', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            try {
                console.log('🔐 Iniciando sesión con tabla personalizada...');
                
                // Buscar usuario en la tabla personalizada
                const { data: user, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .eq('is_active', true)
                    .single();
                
                if (userError) {
                    if (userError.code === 'PGRST116') { // No encontrado
                        throw new Error('Usuario no encontrado');
                    }
                    throw userError;
                }
                
                if (!user) {
                    throw new Error('Usuario no encontrado');
                }
                
                // Verificar contraseña
                const isPasswordValid = await verifyPassword(credentials.password, user.password_hash);
                
                if (!isPasswordValid) {
                    throw new Error('Contraseña incorrecta');
                }
                
                console.log('✅ Login exitoso:', user.id);
                
                // Actualizar último login
                await supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', user.id);
                
                // Crear sesión
                const userSession = {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    full_name: user.full_name,
                    phone: user.phone,
                    loginDate: new Date().toISOString()
                };
                
                saveUserSession(userSession);
                
                // Verificar si hay una pizza en borradores
                const hasPizzaDraft = localStorage.getItem('pizzeriaDraftPizza');
                
                if (hasPizzaDraft) {
                    showModal('¡Éxito!', '¡Inicio de sesión exitoso! Tu pizza personalizada ha sido recuperada.', 'success', true, 'crear-pizza.html');
                } else {
                    showModal('¡Éxito!', '¡Inicio de sesión exitoso! Bienvenido a Pizzeria El Sinú', 'success', true, 'index.html');
                }
                
            } catch (error) {
                console.error('💥 Error en login:', error);
                
                let errorMessage = 'Error al iniciar sesión';
                
                if (error.message.includes('no encontrado') || error.message.includes('contraseña incorrecta')) {
                    errorMessage = 'Email o contraseña incorrectos';
                } else {
                    errorMessage = error.message || 'Error al iniciar sesión';
                }
                
                showModal('Error', errorMessage, 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Función para mostrar modal personalizado (modificada para aceptar URL personalizada)
function showModal(title, message, type = 'info', redirect = false, redirectUrl = 'index.html') {
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
            window.location.href = redirectUrl;
        };
    } else {
        modalOkBtn.onclick = closeModal;
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