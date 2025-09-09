

// Variables globales del carrito
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

// Función para mostrar modal personalizado
function showLoginModal() {
    // Crear el modal si no existe
    if (!document.getElementById('login-modal')) {
        const modalHTML = `
            <div class="custom-modal" id="login-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Iniciar Sesión Requerido</h3>
                    </div>
                    <div class="modal-body">
                        <div class="modal-icon">
                            <i class="fas fa-user-lock"></i>
                        </div>
                        <p>Por favor inicia sesión para agregar productos al carrito y disfrutar de todas nuestras ofertas.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-primary" id="modal-login-btn">Iniciar Sesión</button>
                        <button class="modal-btn modal-btn-secondary" id="modal-cancel-btn">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar event listeners
        document.getElementById('modal-login-btn').addEventListener('click', function() {
            window.location.href = 'login.html';
        });
        
        document.getElementById('modal-cancel-btn').addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'none';
        });
        
        // Cerrar modal al hacer clic fuera
        document.getElementById('login-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Mostrar el modal
    document.getElementById('login-modal').style.display = 'flex';
}

// Actualizar contador del carrito
function updateCartCount(count) {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = count;
    }
}

// Renderizar items del carrito
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    if (!cartItemsContainer) return;
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        if (cartTotalPrice) cartTotalPrice.textContent = '$0';
        return;
    }
    
    let total = 0;
    cartItemsContainer.innerHTML = '';
    
    cartItems.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toLocaleString()}</p>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                <span class="item-quantity">${item.quantity}</span>
                <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                <button class="remove-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    if (cartTotalPrice) cartTotalPrice.textContent = `$${total.toLocaleString()}`;
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const action = this.dataset.action;
            
            if (action === 'increase') {
                cartItems[index].quantity += 1;
            } else if (action === 'decrease' && cartItems[index].quantity > 1) {
                cartItems[index].quantity -= 1;
            }
            
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
            renderCartItems();
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            cartItems.splice(index, 1);
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
            renderCartItems();
        });
    });
}

// Inicializar funcionalidad del carrito
function initCart() {
    // Inicializar contador del carrito
    updateCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
    
    // Configurar botón de carrito si existe
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', function(e) {
            document.body.classList.add('modal-hidden');
            e.preventDefault();
            document.getElementById('cart-overlay').style.display = 'flex';
            renderCartItems();
        });
    }
    
    // Configurar botón de cerrar carrito
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', function() {
            document.getElementById('cart-overlay').style.display = 'none';
        });
    }
    
    // Cerrar carrito al hacer clic fuera
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                document.body.classList.remove('modal-hidden');
                document.getElementById('cart-overlay').style.display = 'none';
            }
        });
    }
    
    // Configurar botones "Add to Cart"
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            // Verificar si el usuario ha iniciado sesión
            const user = localStorage.getItem('pizzeriaUser');
            if (!user) {
                showLoginModal();
                return;
            }
            
            const id = this.dataset.id;
            const name = this.dataset.name;
            const price = parseInt(this.dataset.price);
            
            // Verificar si el producto ya está en el carrito
            const existingItemIndex = cartItems.findIndex(item => item.id === id);
            
            if (existingItemIndex >= 0) {
                // Incrementar cantidad si ya existe
                cartItems[existingItemIndex].quantity += 1;
            } else {
                // Agregar nuevo item al carrito
                cartItems.push({
                    id,
                    name,
                    price,
                    quantity: 1
                });
            }
            
            // Guardar en localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            
            // Actualizar contador
            updateCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
            
            // Mostrar mensaje de confirmación
            const originalText = this.textContent;
            this.textContent = '¡Agregado! ✓';
            this.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))';
            }, 1500);
        });
    });
    
    // Configurar botón de finalizar compra
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartItems.length === 0) {
                showModal('Carrito Vacío', 'Tu carrito está vacío. Agrega algunos productos primero.', 'info');
                return;
            }
            
            showModal('¡Pedido Realizado!', 'Tu pedido ha sido procesado con éxito. Será entregado pronto.', 'success');
            cartItems = [];
            localStorage.removeItem('cartItems');
            updateCartCount(0);
            renderCartItems();
            document.getElementById('cart-overlay').style.display = 'none';
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initCart);