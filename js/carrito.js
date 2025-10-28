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
                     onerror="this.src='${generatePizzaPlaceholderImage(item.ingredients || [])}'">
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
    console.log('🖼️ Obteniendo imagen para:', item.name, item);
    
    // Si es pizza personalizada
    if (item.isCustom || (item.id && item.id.includes('custom'))) {
        console.log('🔧 Es una pizza personalizada');
        
        // Si tiene imagen generada (data URL)
        if (item.image && item.image.startsWith('data:image')) {
            console.log('✅ Usando imagen generada existente');
            return item.image;
        }
        
        // Si no tiene imagen válida, generar placeholder
        console.log('🔄 Generando nueva imagen para pizza personalizada');
        return generatePizzaPlaceholderImage(item.ingredients || []);
    }
    
    // Para pizzas predefinidas
    console.log('🍕 Es una pizza predefinida');
    
    const defaultImages = {
        '1': 'img/pizzaMediterranea.jpg',
        '2': 'img/Mortadella & Basil Bliss.jpg', 
        '3': 'img/pizzaPeperoni.jpg',
    };
    
    const imagePath = item.image || defaultImages[item.id];
    
    if (imagePath) {
        console.log('📍 Usando imagen mapeada:', imagePath);
        return imagePath;
    }
    
    console.log('🔄 Usando placeholder genérico');
    return generatePizzaPlaceholderImage([]);
}

// Función para generar imagen placeholder de pizza
function generatePizzaPlaceholderImage(ingredients) {
    console.log('🎨 Generando placeholder para ingredientes:', ingredients);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    // Fondo
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pizza base con gradiente
    const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 80);
    gradient.addColorStop(0, '#f8d7a4');
    gradient.addColorStop(1, '#e0b080');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // Borde
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Salsa
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(100, 100, 70, 0, Math.PI * 2);
    ctx.fill();
    
    // Queso
    ctx.fillStyle = 'rgba(255, 255, 240, 0.7)';
    ctx.beginPath();
    ctx.arc(100, 100, 65, 0, Math.PI * 2);
    ctx.fill();
    
    // Ingredientes genéricos (puntos de colores)
    const colors = ['#e74c3c', '#27ae60', '#f5b7b1', '#a569bd', '#f9e79f'];
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 15 + Math.random() * 45;
        const x = 100 + Math.cos(angle) * distance;
        const y = 100 + Math.sin(angle) * distance;
        const size = 4 + Math.random() * 4;
        
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Texto
    ctx.fillStyle = '#fada08';
    ctx.font = 'bold 12px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText('PIZZA PERSONALIZADA', 100, 190);
    
    console.log('✅ Placeholder generado exitosamente');
    return canvas.toDataURL('image/png');
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

        // Cargar direcciones de Supabase
        const { data: addresses, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando direcciones:', error);
            // Fallback a direcciones temporales
            const tempAddresses = await getTemporaryAddresses();
            displayAddresses(tempAddresses);
            return;
        }

        if (addresses && addresses.length > 0) {
            displayAddresses(addresses);
        } else {
            // Si no hay direcciones, mostrar opción para agregar
            const tempAddresses = await getTemporaryAddresses();
            displayAddresses(tempAddresses);
        }
        
    } catch (error) {
        console.error('Error cargando direcciones:', error);
        // Fallback a direcciones temporales
        const tempAddresses = await getTemporaryAddresses();
        displayAddresses(tempAddresses);
    }
}

// Función temporal para direcciones de ejemplo
async function getTemporaryAddresses() {
    const user = checkActiveSession();
    if (!user) return [];

    // Crear una dirección temporal basada en datos del usuario
    return [{
        id: 'temp-addr-1',
        neighborhood: 'Valle del Lili',
        property_type: 'Casa',
        address: 'Calle 123 #45-67',
        municipality: 'Cali',
        city: 'Valle del Cauca',
        phone: user.phone || '300 123 4567',
        additional_info: 'Casa blanca con portón negro',
        is_default: true,
        is_temporary: true // Marcar como temporal
    }];
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
        
        const addFirstAddress = document.getElementById('add-first-address');
        if (addFirstAddress) {
            addFirstAddress.addEventListener('click', showAddressModal);
        }
        return;
    }

    addressOptions.innerHTML = addresses.map((address, index) => `
        <div class="address-card ${index === 0 ? 'selected' : ''}" 
             data-address-id="${address.id}"
             data-is-temporary="${address.is_temporary || false}">
            <div class="address-header">
                <div class="address-title">
                    ${address.neighborhood} - ${address.property_type}
                    ${address.is_temporary ? '<span style="color: #ffa726; margin-left: 0.5em;">(Temporal)</span>' : ''}
                </div>
                ${address.is_default ? '<span class="address-default">PREDETERMINADA</span>' : ''}
            </div>
            <div class="address-details">
                <p><i class="fas fa-map-marker-alt"></i> ${address.address}</p>
                <p><i class="fas fa-city"></i> ${address.municipality}, ${address.city}</p>
                <p><i class="fas fa-phone"></i> ${address.phone}</p>
                ${address.additional_info ? `<p><i class="fas fa-info-circle"></i> ${address.additional_info}</p>` : ''}
            </div>
            ${address.is_temporary ? `
            <div class="address-warning">
                <small><i class="fas fa-exclamation-triangle"></i> Esta es una dirección temporal. Agrega una dirección real para mejores resultados.</small>
            </div>
            ` : ''}
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

// Función auxiliar para validar UUID
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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

        // Calcular totales
        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shippingCost = 5000;
        const total = subtotal + shippingCost;

        const user = checkActiveSession();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener la dirección real de Supabase
        const addressId = selectedAddress.dataset.addressId;
        
        // Si la dirección no es un UUID válido, usar null y guardar la dirección en notes
        let shippingAddressId = null;
        let addressNotes = '';
        
        if (isValidUUID(addressId)) {
            shippingAddressId = addressId;
        } else {
            // Si es una dirección temporal, guardar la información en notes
            const addressText = selectedAddress.querySelector('.address-details').textContent;
            addressNotes = `Dirección: ${addressText}. ${orderNotes || ''}`;
        }

        // 1. Crear el pedido en Supabase
        const orderNumber = 'ORD-' + Date.now();
        
        const orderData = {
            user_id: user.id,
            order_number: orderNumber,
            subtotal: subtotal,
            shipping_cost: shippingCost,
            total: total,
            payment_method: paymentMethod.value,
            status: 'pending',
            payment_status: 'pending',
            notes: addressNotes || orderNotes
        };

        // Solo agregar shipping_address_id si es un UUID válido
        if (shippingAddressId) {
            orderData.shipping_address_id = shippingAddressId;
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            console.error('Error creando pedido:', orderError);
            throw new Error('Error al crear el pedido: ' + orderError.message);
        }

        // 2. Crear los items del pedido
        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            product_description: item.description || getIngredientsText(item.ingredients),
            product_price: item.price,
            quantity: item.quantity,
            is_custom: item.isCustom || false,
            custom_ingredients: item.ingredients || null,
            image_url: item.image || null
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creando items:', itemsError);
            throw new Error('Error al guardar los items del pedido');
        }

        console.log('✅ Pedido creado exitosamente:', order.id);

        // 3. Limpiar carrito
        window.cartManager.clearCart();

        showModal(
            '¡Pedido Confirmado!', 
            `Tu pedido #${orderNumber} ha sido recibido y está siendo preparado. Total: $${total.toLocaleString()}`,
            'success',
            true,
            'index.html'
        );

    } catch (error) {
        console.error('💥 Error procesando pedido:', error);
        
        let errorMessage = 'Hubo un problema al procesar tu pedido. Intenta nuevamente.';
        
        if (error.message.includes('network') || error.message.includes('Internet')) {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        } else if (error.message.includes('autenticado')) {
            errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else if (error.message.includes('uuid')) {
            errorMessage = 'Error en la dirección de envío. Por favor, actualiza tus datos de envío.';
        }
        
        showModal('Error', errorMessage, 'error');
        
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