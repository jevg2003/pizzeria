
function showModal(title, message, type = 'info', redirect = false, redirectUrl = 'index.html') {
    // Crear o obtener el modal
    let modal = document.getElementById('custom-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.className = 'custom-modal';
        document.body.appendChild(modal);
    }
    
    // Iconos según el tipo
    let icon = '';
    switch(type) {
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '❌';
            break;
        case 'info':
            icon = 'ℹ️';
            break;
        default:
            icon = '💡';
    }
    
    // Contenido del modal
    modal.innerHTML = `
        <div class="modal-content ${type ? 'modal-' + type : ''}">
            <div class="modal-header">
                <h3>${icon} ${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-primary" id="modal-ok-btn">
                    Aceptar
                </button>
            </div>
        </div>
    `;
    
    // Mostrar modal
    modal.style.display = 'flex';
    document.body.classList.add('modal-hidden');
    
    // Configurar event listeners
    const okBtn = modal.querySelector('#modal-ok-btn');
    const closeModalHandler = function() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-hidden');
        
        if (redirect) {
            window.location.href = redirectUrl;
        }
    };
    
    okBtn.addEventListener('click', closeModalHandler);
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalHandler();
        }
    });
    
    // Cerrar con tecla Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeModalHandler();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    
    document.addEventListener('keydown', escapeHandler);
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-hidden');
    }
}