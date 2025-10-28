// profile.js - Versión con datos reales y funcionalidad completa
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupEventListeners();
    
    if (typeof checkAuthStatus === 'function') {
        checkAuthStatus();
    }
});

function setupEventListeners() {
    // Botón de editar información personal
    const editBtn = document.getElementById('editPersonalInfo');
    if (editBtn) {
        editBtn.addEventListener('click', showEditModal);
    }
    
    // Modal de edición
    const editModal = document.getElementById('edit-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEdit = document.getElementById('cancel-edit');
    const saveEdit = document.getElementById('save-edit');
    
    if (closeEditModal) closeEditModal.addEventListener('click', hideEditModal);
    if (cancelEdit) cancelEdit.addEventListener('click', hideEditModal);
    if (saveEdit) saveEdit.addEventListener('click', savePersonalInfo);
    
    // Filtros de pedidos
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Filtrar pedidos
            const filter = this.dataset.filter;
            filterOrders(filter);
        });
    });
}

// Cargar datos del usuario desde Supabase
async function loadUserData() {
    const user = checkActiveSession();
    
    if (user) {
        try {
            // Actualizar elementos de la página
            document.getElementById('userName').textContent = user.name || user.full_name;
            document.getElementById('userAvatar').textContent = (user.name || user.full_name).charAt(0).toUpperCase();
            document.getElementById('userFullName').textContent = user.full_name || user.name;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userPhone').textContent = user.phone || 'No especificado';
            
            // Establecer fecha de miembro
            const joinDate = new Date(user.loginDate || Date.now());
            document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });
            
            // Cargar direcciones y pedidos
            await loadUserAddresses();
            await loadOrderHistory();
            
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            showModal('Error', 'Error al cargar los datos del perfil', 'error');
        }
    } else {
        window.location.href = 'login.html';
    }
}

// Cargar direcciones del usuario
async function loadUserAddresses() {
    try {
        const user = checkActiveSession();
        const { data: addresses, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        displayUserAddresses(addresses || []);
    } catch (error) {
        console.error('Error cargando direcciones:', error);
    }
}

function displayUserAddresses(addresses) {
    const container = document.getElementById('addresses-container');
    if (!container) return;

    if (addresses.length === 0) {
        container.innerHTML = `
            <div class="no-address-message">
                <i class="fas fa-map-marker-alt"></i>
                <p>No tienes direcciones guardadas</p>
                <button class="btn-small" onclick="location.href='datos-envio.html'">
                    <i class="fas fa-plus"></i> Agregar Dirección
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = addresses.map(address => `
        <div class="address-item ${address.is_default ? 'default-address' : ''}">
            <div class="address-header">
                <div class="address-title">
                    ${address.neighborhood} - ${address.property_type}
                    ${address.is_default ? '<span class="address-default">PREDETERMINADA</span>' : ''}
                </div>
            </div>
            <div class="address-details">
                <p><i class="fas fa-map-marker-alt"></i> ${address.address}</p>
                <p><i class="fas fa-city"></i> ${address.municipality}, ${address.city}</p>
                <p><i class="fas fa-phone"></i> ${address.phone}</p>
                ${address.additional_info ? `<p><i class="fas fa-info-circle"></i> ${address.additional_info}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Cargar historial de pedidos
async function loadOrderHistory() {
    try {
        const user = checkActiveSession();
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*),
                shipping_addresses (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        displayOrderHistory(orders || []);
    } catch (error) {
        console.error('Error cargando historial:', error);
        displayOrderHistory([]);
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="no-orders-message">
                <i class="fas fa-shopping-bag"></i>
                <p>Aún no has realizado ningún pedido</p>
                <a href="index.html" class="btn-primary">Realizar mi primer pedido</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const orderDate = new Date(order.created_at);
        const formattedDate = orderDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const total = order.total || (order.subtotal + order.shipping_cost);
        
        return `
            <div class="order-item" data-date="${order.created_at}">
                <div class="order-header">
                    <span class="order-id">#${order.order_number}</span>
                    <span class="order-date">${formattedDate}</span>
                    <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-details">
                    ${order.order_items ? order.order_items.map(item => `
                        <div class="order-pizza">
                            <span class="pizza-name">
                                ${item.product_name}
                                ${item.is_custom ? '<span class="custom-badge">PERSONALIZADA</span>' : ''}
                            </span>
                            <span class="pizza-quantity">${item.quantity}x</span>
                            <span class="pizza-price">$${(item.product_price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('') : ''}
                </div>
                <div class="order-total">
                    <strong>Total: $${total.toLocaleString()}</strong>
                </div>
                <div class="order-actions">
                    <button class="btn-small" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    ${order.status === 'pending' ? `
                    <button class="btn-small btn-cancel" onclick="cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i> Cancelar Pedido
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado',
        'preparing': 'En Preparación',
        'ready': 'Listo para Entrega',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function filterOrders(filter) {
    const orders = document.querySelectorAll('.order-item');
    const now = new Date();
    
    orders.forEach(order => {
        const orderDate = new Date(order.dataset.date);
        let show = true;
        
        switch(filter) {
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                show = orderDate >= monthAgo;
                break;
            case 'quarter':
                const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                show = orderDate >= quarterAgo;
                break;
            default:
                show = true;
        }
        
        order.style.display = show ? 'block' : 'none';
    });
}

// Funciones para el modal de edición
function showEditModal() {
    const user = checkActiveSession();
    if (!user) return;
    
    document.getElementById('edit-name').value = user.full_name || user.name;
    document.getElementById('edit-phone').value = user.phone || '';
    
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'flex';
    document.body.classList.add('modal-hidden');
}

function hideEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'none';
    document.body.classList.remove('modal-hidden');
}

async function savePersonalInfo() {
    const user = checkActiveSession();
    if (!user) return;
    
    const newName = document.getElementById('edit-name').value.trim();
    const newPhone = document.getElementById('edit-phone').value.trim();
    
    if (!newName) {
        showModal('Error', 'El nombre no puede estar vacío', 'error');
        return;
    }
    
    try {
        // Actualizar en Supabase
        const { error } = await supabase
            .from('users')
            .update({
                full_name: newName,
                phone: newPhone,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (error) throw error;
        
        // Actualizar localStorage
        user.full_name = newName;
        user.name = newName;
        user.phone = newPhone;
        localStorage.setItem('pizzeriaUser', JSON.stringify(user));
        
        // Actualizar UI
        document.getElementById('userFullName').textContent = newName;
        document.getElementById('userName').textContent = newName;
        document.getElementById('userAvatar').textContent = newName.charAt(0).toUpperCase();
        document.getElementById('userPhone').textContent = newPhone || 'No especificado';
        
        // Actualizar barra de navegación
        if (typeof checkAuthStatus === 'function') {
            checkAuthStatus();
        }
        
        hideEditModal();
        showModal('¡Éxito!', 'Información actualizada correctamente', 'success');
        
    } catch (error) {
        console.error('Error actualizando información:', error);
        showModal('Error', 'Error al actualizar la información', 'error');
    }
}

// Funciones para manejar pedidos
async function viewOrderDetails(orderId) {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*),
                shipping_addresses (*)
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;
        
        // Mostrar detalles del pedido en un modal
        showOrderDetailsModal(order);
        
    } catch (error) {
        console.error('Error cargando detalles del pedido:', error);
        showModal('Error', 'Error al cargar los detalles del pedido', 'error');
    }
}

function showOrderDetailsModal(order) {
    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const itemsHtml = order.order_items.map(item => `
        <div class="order-detail-item">
            <div class="item-info">
                <h4>${item.product_name}</h4>
                ${item.is_custom && item.custom_ingredients ? `
                    <p class="ingredients">Ingredientes: ${getIngredientsText(item.custom_ingredients)}</p>
                ` : ''}
                <p class="item-price">$${item.product_price.toLocaleString()} c/u</p>
            </div>
            <div class="item-quantity">
                <span>Cantidad: ${item.quantity}</span>
                <span class="item-total">$${(item.product_price * item.quantity).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
    
    const modalHtml = `
        <div class="modal-overlay" id="order-details-modal" style="display: flex;">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-receipt"></i> Detalles del Pedido #${order.order_number}</h3>
                    <button class="close-modal" onclick="document.getElementById('order-details-modal').remove(); document.body.classList.remove('modal-hidden');">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="order-info-section">
                        <h4>Información del Pedido</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Fecha:</span>
                                <span class="info-value">${formattedDate}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Estado:</span>
                                <span class="info-value status-${order.status}">${getStatusText(order.status)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Método de Pago:</span>
                                <span class="info-value">${order.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Total:</span>
                                <span class="info-value">$${order.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-items-section">
                        <h4>Items del Pedido</h4>
                        <div class="order-items-list">
                            ${itemsHtml}
                        </div>
                    </div>
                    
                    ${order.shipping_addresses ? `
                    <div class="shipping-info-section">
                        <h4>Dirección de Entrega</h4>
                        <div class="address-info">
                            <p><i class="fas fa-map-marker-alt"></i> ${order.shipping_addresses.address}</p>
                            <p><i class="fas fa-city"></i> ${order.shipping_addresses.municipality}, ${order.shipping_addresses.city}</p>
                            <p><i class="fas fa-phone"></i> ${order.shipping_addresses.phone}</p>
                            ${order.shipping_addresses.additional_info ? `<p><i class="fas fa-info-circle"></i> ${order.shipping_addresses.additional_info}</p>` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${order.notes ? `
                    <div class="order-notes-section">
                        <h4>Notas del Pedido</h4>
                        <p class="order-notes">${order.notes}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="document.getElementById('order-details-modal').remove(); document.body.classList.remove('modal-hidden');">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.classList.add('modal-hidden');
}

async function cancelOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('orders')
            .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;
        
        showModal('Éxito', 'Pedido cancelado correctamente', 'success');
        
        // Recargar historial
        setTimeout(() => {
            loadOrderHistory();
        }, 1000);
        
    } catch (error) {
        console.error('Error cancelando pedido:', error);
        showModal('Error', 'Error al cancelar el pedido', 'error');
    }
}

function getIngredientsText(ingredients) {
    if (typeof ingredients === 'string') return ingredients;
    if (Array.isArray(ingredients)) {
        return ingredients.map(ing => ing.displayName || ing.name || ing).join(', ');
    }
    return 'Ingredientes personalizados';
}