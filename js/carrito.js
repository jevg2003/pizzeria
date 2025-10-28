// js/carrito.js - Extensión para la página del carrito
document.addEventListener('DOMContentLoaded', function() {
    initializeCartPage();
});

async function initializeCartPage() {
    // Verificar autenticación
    const user = checkActiveSession();
    if (!user) {
        showModal('Error', 'Debes iniciar sesión para ver tu carrito', 'error', true, 'login.html');
        return;
    }

    // Esperar a que cartManager esté disponible
    if (!window.cartManager) {
        setTimeout(initializeCartPage, 100);
        return;
    }

    setupEventListeners();
    await loadCartItems();
    await loadUserAddresses();
    updateOrderButton();
}

function setupEventListeners() {
    // Métodos de pago
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', handlePaymentMethodChange);
    });

    // Botón de confirmar pedido
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }

    // Botones para agregar dirección
    const addAddressBtns = document.querySelectorAll('#add-new-address, #add-first-address');
    addAddressBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', showAddressModal);
    });

    // Modal de dirección
    const addressModal = document.getElementById('address-modal');
    const closeModal = document.getElementById('close-address-modal');
    const cancelAddress = document.getElementById('cancel-address');
    const confirmAddress = document.getElementById('confirm-address');

    if (closeModal) closeModal.addEventListener('click', hideAddressModal);
    if (cancelAddress) cancelAddress.addEventListener('click', hideAddressModal);
    if (confirmAddress) confirmAddress.addEventListener('click', redirectToShipping);

    // Event delegation para los controles de cantidad y eliminar
    const orderItemsContainer = document.getElementById('order-items');
    if (orderItemsContainer) {
        orderItemsContainer.addEventListener('click', (e) => {
            const target = e.target.closest('.quantity-btn') || e.target.closest('.remove-item');
            if (!target) return;

            const index = parseInt(target.dataset.index);
            
            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                handleQuantityChange(index, action);
            } else if (target.classList.contains('remove-item')) {
                handleRemoveItem(index);
            }
        });
    }
}

async function loadCartItems() {
    if (!window.cartManager) {
        console.error('cartManager no está disponible');
        return;
    }

    const cartItems = window.cartManager.getCart();
    const orderItemsContainer = document.getElementById('order-items');
    
    if (!orderItemsContainer) return;

    if (cartItems.length === 0) {
        orderItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <p>Tu carrito está vacío</p>
                <a href="index.html" class="btn-primary">Ir a Comprar</a>
            </div>
        `;
        updateTotals(0);
        return;
    }

    let subtotal = 0;
    orderItemsContainer.innerHTML = '';

    cartItems.forEach((item, index) => {
        subtotal += item.price * item.quantity;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-card';
        
        // Determinar si es una pizza personalizada
        const isCustomPizza = item.isCustom || item.id.includes('custom');
        
        itemElement.innerHTML = `
            <div class="item-image">
                <img src="${getItemImage(item)}" alt="${item.name}" 
                     onerror="this.src='img/pizza-placeholder.jpg'">
                ${isCustomPizza ? '<div class="custom-pizza-indicator" title="Pizza Personalizada"><i class="fas fa-star"></i></div>' : ''}
            </div>
            <div class="item-details">
                <h4>
                    ${item.name}
                    ${isCustomPizza ? '<span class="pizza-custom-badge">PERSONALIZADA</span>' : ''}
                </h4>
                ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                
                ${isCustomPizza && item.ingredients ? `
                    <div class="ingredients-preview">
                        ${item.ingredients.slice(0, 4).map(ing => {
                            const displayName = ing.displayName || ing.name || ing;
                            return `<span class="ingredient-tag">${displayName}</span>`;
                        }).join('')}
                        ${item.ingredients.length > 4 ? `<span class="ingredient-tag">+${item.ingredients.length - 4} más</span>` : ''}
                    </div>
                ` : ''}
                
                ${!isCustomPizza && item.ingredients ? `<p class="item-ingredients">${getIngredientsText(item.ingredients)}</p>` : ''}
            </div>
            <div class="item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                </div>
                <div class="item-price">$${(item.price * item.quantity).toLocaleString()}</div>
                <button class="remove-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        orderItemsContainer.appendChild(itemElement);
    });

    updateTotals(subtotal);
}

function getItemImage(item) {
    // Si es pizza personalizada y tiene imagen generada
    if ((item.isCustom || item.id.includes('custom')) && item.image) {
        return item.image;
    }
    
    // Mapear IDs de pizza a imágenes
    const imageMap = {
        '1': 'img/pizzaMediterranea.jpg',
        '2': 'img/Mortadella & Basil Bliss.jpg', 
        '3': 'img/pizzaPeperoni.jpg'
    };
    
    return item.image || imageMap[item.id] || 'img/pizza-placeholder.jpg';
}

function getIngredientsText(ingredients) {
    if (typeof ingredients === 'string') return ingredients;
    if (Array.isArray(ingredients)) {
        return ingredients.map(ing => ing.displayName || ing.name || ing).join(', ');
    }
    return 'Ingredientes personalizados';
}

function handleQuantityChange(index, action) {
    if (!window.cartManager) return;

    const cartItems = window.cartManager.getCart();
    
    if (cartItems[index]) {
        if (action === 'increase') {
            cartItems[index].quantity += 1;
        } else if (action === 'decrease' && cartItems[index].quantity > 1) {
            cartItems[index].quantity -= 1;
        }
        
        window.cartManager.saveCart(cartItems);
        window.cartManager.updateCartUI();
        loadCartItems(); // Recargar la vista
    }
}

function handleRemoveItem(index) {
    if (!window.cartManager) return;

    const cartItems = window.cartManager.getCart();
    cartItems.splice(index, 1);
    window.cartManager.saveCart(cartItems);
    window.cartManager.updateCartUI();
    loadCartItems(); // Recargar la vista
}

function updateTotals(subtotal) {
    const shippingCost = 5000; // Costo fijo de envío
    const total = subtotal + shippingCost;

    const subtotalElement = document.getElementById('subtotal-price');
    const shippingElement = document.getElementById('shipping-cost');
    const totalElement = document.getElementById('total-price');

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
    if (shippingElement) shippingElement.textContent = `$${shippingCost.toLocaleString()}`;
    if (totalElement) totalElement.textContent = `$${total.toLocaleString()}`;
}

function calculateTotal() {
    if (!window.cartManager) return 0;
    
    const cartItems = window.cartManager.getCart();
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = 5000;
    return subtotal + shippingCost;
}

// Funciones de direcciones
async function loadUserAddresses() {
    try {
        const user = checkActiveSession();
        if (!user) return;

        // Simular carga de direcciones (luego se conectará a Supabase)
        const addresses = await getUserAddressesFromStorage();
        displayAddresses(addresses);
        
    } catch (error) {
        console.error('Error cargando direcciones:', error);
    }
}

// Función temporal para simular direcciones
async function getUserAddressesFromStorage() {
    // Por ahora, usar localStorage. Luego se cambiará por Supabase
    const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
    
    // Si no hay direcciones, crear una de ejemplo
    if (addresses.length === 0) {
        const exampleAddress = {
            id: 'addr-1',
            neighborhood: 'Valle del Lili',
            property_type: 'Casa',
            address: 'Calle 123 #45-67',
            municipality: 'Cali',
            city: 'Valle del Cauca',
            phone: '300 123 4567',
            additional_info: 'Casa blanca con portón negro',
            is_default: true
        };
        return [exampleAddress];
    }
    
    return addresses;
}

function displayAddresses(addresses) {
    const addressOptions = document.getElementById('address-options');
    if (!addressOptions) return;

    if (addresses.length === 0) {
        addressOptions.innerHTML = `
            <div class="no-address-message">
                <i class="fas fa-map-marker-alt"></i>
                <p>No tienes direcciones guardadas</p>
                <button id="add-first-address" class="btn-primary">
                    <i class="fas fa-plus"></i> Agregar Primera Dirección
                </button>
            </div>
        `;
        
        // Re-asignar event listener
        const addFirstAddress = document.getElementById('add-first-address');
        if (addFirstAddress) {
            addFirstAddress.addEventListener('click', showAddressModal);
        }
        return;
    }

    addressOptions.innerHTML = addresses.map((address, index) => `
        <div class="address-card ${index === 0 ? 'selected' : ''}" data-address-id="${address.id}">
            <div class="address-header">
                <div class="address-title">
                    ${address.neighborhood} - ${address.property_type}
                </div>
                ${address.is_default ? '<span class="address-default">PREDETERMINADA</span>' : ''}
            </div>
            <div class="address-details">
                <p><i class="fas fa-map-marker-alt"></i> ${address.address}</p>
                <p><i class="fas fa-city"></i> ${address.municipality}, ${address.city}</p>
                <p><i class="fas fa-phone"></i> ${address.phone}</p>
                ${address.additional_info ? `<p><i class="fas fa-info-circle"></i> ${address.additional_info}</p>` : ''}
            </div>
        </div>
    `).join('');

    // Agregar event listeners a las tarjetas de dirección
    const addressCards = addressOptions.querySelectorAll('.address-card');
    addressCards.forEach(card => {
        card.addEventListener('click', () => selectAddress(card));
    });
}

function selectAddress(card) {
    // Remover selección anterior
    const previousSelected = document.querySelector('.address-card.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    
    // Agregar selección nueva
    card.classList.add('selected');
    updateOrderButton();
}

function handlePaymentMethodChange(e) {
    const cardInfo = document.getElementById('card-info');
    if (e.target.value === 'card') {
        cardInfo.style.display = 'block';
    } else {
        cardInfo.style.display = 'none';
    }
    updateOrderButton();
}

function updateOrderButton() {
    const placeOrderBtn = document.getElementById('place-order-btn');
    const hasItems = window.cartManager && window.cartManager.getCart().length > 0;
    const hasAddress = document.querySelector('.address-card.selected') !== null;

    if (placeOrderBtn) {
        placeOrderBtn.disabled = !hasItems || !hasAddress;
        
        if (!hasItems) {
            placeOrderBtn.title = 'Agrega productos al carrito primero';
        } else if (!hasAddress) {
            placeOrderBtn.title = 'Selecciona una dirección de envío';
        } else {
            placeOrderBtn.title = 'Confirmar pedido';
        }
    }
}

function showAddressModal() {
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-hidden');
    }
}

function hideAddressModal() {
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-hidden');
    }
}

function redirectToShipping() {
    window.location.href = 'datos-envio.html';
}

async function handlePlaceOrder() {
    if (!window.cartManager) {
        showModal('Error', 'Error del sistema. Intenta recargar la página.', 'error');
        return;
    }

    const cartItems = window.cartManager.getCart();
    const selectedAddress = document.querySelector('.address-card.selected');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    const orderNotes = document.getElementById('order-notes').value;

    if (cartItems.length === 0) {
        showModal('Error', 'Tu carrito está vacío', 'error');
        return;
    }

    if (!selectedAddress) {
        showModal('Error', 'Por favor selecciona una dirección de envío', 'error');
        return;
    }

    if (!paymentMethod) {
        showModal('Error', 'Por favor selecciona un método de pago', 'error');
        return;
    }

    try {
        // Mostrar loading
        const placeOrderBtn = document.getElementById('place-order-btn');
        const originalText = placeOrderBtn.textContent;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        placeOrderBtn.disabled = true;

        // Simular procesamiento del pedido
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Aquí irá la lógica para guardar en Supabase
        const orderData = {
            items: cartItems,
            address: selectedAddress.dataset.addressId,
            paymentMethod: paymentMethod.value,
            notes: orderNotes,
            total: calculateTotal(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        console.log('📦 Datos del pedido:', orderData);

        // Limpiar carrito usando el cartManager
        window.cartManager.clearCart();

        showModal(
            '¡Pedido Confirmado!', 
            'Tu pedido ha sido recibido y está siendo preparado. Te contactaremos pronto para confirmar la entrega.',
            'success',
            true,
            'index.html'
        );

    } catch (error) {
        console.error('Error procesando pedido:', error);
        showModal('Error', 'Hubo un problema al procesar tu pedido. Intenta nuevamente.', 'error');
        
        // Restaurar botón
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.textContent = 'Confirmar Pedido';
            placeOrderBtn.disabled = false;
        }
    }
}

// Hacer funciones disponibles globalmente
window.handleQuantityChange = handleQuantityChange;
window.handleRemoveItem = handleRemoveItem;