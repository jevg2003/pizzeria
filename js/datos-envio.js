// datos-envio.js - Manejo de datos de envío
document.addEventListener('DOMContentLoaded', function() {
    initializeShippingPage();
});

async function initializeShippingPage() {
    // Verificar autenticación
    const user = checkActiveSession();
    if (!user) {
        showModal('Error', 'Debes iniciar sesión para gestionar tus datos de envío', 'error', true, 'login.html');
        return;
    }

    setupEventListeners();
    await loadSavedAddresses();
}

function setupEventListeners() {
    const shippingForm = document.getElementById('shipping-form');
    if (shippingForm) {
        shippingForm.addEventListener('submit', handleShippingSubmit);
    }

    // Validación en tiempo real para teléfono
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        value = value.match(/.{1,3}/g).join(' ');
    }
    e.target.value = value;
}

async function handleShippingSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const shippingData = {
            city: formData.get('city').trim(),
            municipality: formData.get('municipality').trim(),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            neighborhood: formData.get('neighborhood').trim(),
            property_type: formData.get('property_type'),
            additional_info: formData.get('additional_info').trim()
        };

        // Validaciones
        if (!validateShippingData(shippingData)) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Guardar en Supabase
        const user = checkActiveSession();
        const { data, error } = await supabase
            .from('shipping_addresses')
            .insert([
                {
                    user_id: user.id,
                    ...shippingData,
                    is_default: true // Por simplicidad, hacerlo default
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error guardando dirección:', error);
            throw error;
        }

        console.log('✅ Dirección guardada:', data.id);
        
        showModal(
            '¡Éxito!', 
            'Tu dirección de envío ha sido guardada correctamente.', 
            'success', 
            true, 
            'index.html'
        );

    } catch (error) {
        console.error('💥 Error guardando dirección:', error);
        
        let errorMessage = 'Error al guardar la dirección';
        if (error.message.includes('violates foreign key')) {
            errorMessage = 'Error de usuario. Por favor, inicia sesión nuevamente.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Error de conexión. Verifica tu internet.';
        } else {
            errorMessage = error.message || 'Error al guardar la dirección';
        }
        
        showModal('Error', errorMessage, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function validateShippingData(data) {
    if (!data.city) {
        showModal('Error', 'Por favor ingresa la ciudad', 'error');
        return false;
    }
    if (!data.municipality) {
        showModal('Error', 'Por favor ingresa el municipio', 'error');
        return false;
    }
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
        showModal('Error', 'Por favor ingresa un número de celular válido (mínimo 10 dígitos)', 'error');
        return false;
    }
    if (!data.address || data.address.length < 10) {
        showModal('Error', 'Por favor ingresa una dirección completa (mínimo 10 caracteres)', 'error');
        return false;
    }
    if (!data.neighborhood) {
        showModal('Error', 'Por favor ingresa el barrio', 'error');
        return false;
    }
    if (!data.property_type) {
        showModal('Error', 'Por favor selecciona el tipo de propiedad', 'error');
        return false;
    }

    return true;
}

async function loadSavedAddresses() {
    try {
        const user = checkActiveSession();
        if (!user) return;

        const { data: addresses, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando direcciones:', error);
            return;
        }

        displaySavedAddresses(addresses || []);
        
    } catch (error) {
        console.error('Error cargando direcciones:', error);
    }
}

function displaySavedAddresses(addresses) {
    const container = document.getElementById('saved-addresses');
    const list = document.getElementById('addresses-list');
    
    if (!container || !list) return;

    if (addresses.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    
    list.innerHTML = addresses.map(address => `
        <div class="address-card" data-address-id="${address.id}">
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
            <div class="address-actions">
                <button class="btn-small btn-edit" onclick="editAddress('${address.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-small btn-delete" onclick="deleteAddress('${address.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                ${!address.is_default ? `
                <button class="btn-small" style="background: #4CAF50; color: white;" onclick="setDefaultAddress('${address.id}')">
                    <i class="fas fa-star"></i> Predeterminada
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Funciones para manejar direcciones (para implementar después)
async function editAddress(addressId) {
    showModal('Información', 'Funcionalidad de edición en desarrollo', 'info');
}

async function deleteAddress(addressId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('shipping_addresses')
            .delete()
            .eq('id', addressId);

        if (error) throw error;

        showModal('Éxito', 'Dirección eliminada correctamente', 'success');
        await loadSavedAddresses(); // Recargar la lista
        
    } catch (error) {
        console.error('Error eliminando dirección:', error);
        showModal('Error', 'Error al eliminar la dirección', 'error');
    }
}

async function setDefaultAddress(addressId) {
    try {
        const user = checkActiveSession();
        
        // Primero, quitar default de todas las direcciones
        await supabase
            .from('shipping_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);

        // Luego, establecer la nueva dirección como default
        const { error } = await supabase
            .from('shipping_addresses')
            .update({ is_default: true })
            .eq('id', addressId);

        if (error) throw error;

        showModal('Éxito', 'Dirección establecida como predeterminada', 'success');
        await loadSavedAddresses(); // Recargar la lista
        
    } catch (error) {
        console.error('Error estableciendo dirección predeterminada:', error);
        showModal('Error', 'Error al establecer dirección predeterminada', 'error');
    }
}