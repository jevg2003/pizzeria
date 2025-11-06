document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de envío...');
    initializeShippingPage();
});

async function initializeShippingPage() {
    // Verificar autenticación
    const user = checkActiveSession();
    console.log('👤 Usuario en sesión:', user);
    
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
        console.log('✅ Formulario configurado');
    }

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        value = value.substring(0, 10);
        if (value.length > 3) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        if (value.length > 7) {
            value = value.substring(0, 7) + ' ' + value.substring(7);
        }
    }
    e.target.value = value;
}

async function handleShippingSubmit(e) {
    e.preventDefault();
    console.log('🔄 Iniciando guardado de dirección...');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;

    try {
        // Obtener datos del formulario
        const formData = new FormData(e.target);
        const shippingData = {
            city: formData.get('city')?.trim() || '',
            municipality: formData.get('municipality')?.trim() || '',
            phone: formData.get('phone')?.replace(/\s/g, '') || '',
            address: formData.get('address')?.trim() || '',
            neighborhood: formData.get('neighborhood')?.trim() || '',
            property_type: formData.get('property_type') || '',
            additional_info: formData.get('additional_info')?.trim() || ''
        };

        console.log('📦 Datos del formulario:', shippingData);

        // Validaciones
        if (!validateShippingData(shippingData)) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Verificar usuario
        const user = checkActiveSession();
        if (!user || !user.id) {
            throw new Error('Usuario no autenticado o ID inválido');
        }

        console.log('👤 Usuario ID:', user.id);

        // Verificar si ya existe una dirección por defecto
        console.log('🔍 Verificando direcciones existentes...');
        const { data: existingDefault, error: checkError } = await supabase
            .from('shipping_addresses')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no encontrado
            console.error('❌ Error verificando direcciones:', checkError);
        }

        const isDefault = !existingDefault;
        console.log('🏠 Será dirección por defecto:', isDefault);

        // Preparar datos para insertar
        const insertData = {
            user_id: user.id,
            city: shippingData.city,
            municipality: shippingData.municipality,
            phone: shippingData.phone,
            address: shippingData.address,
            neighborhood: shippingData.neighborhood,
            property_type: shippingData.property_type,
            additional_info: shippingData.additional_info || null,
            is_default: isDefault,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('🚀 Insertando en Supabase:', insertData);

        // Insertar en Supabase
        const { data, error } = await supabase
            .from('shipping_addresses')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw error;
        }

        console.log('✅ Dirección guardada exitosamente:', data);
        
        showModal(
            '¡Éxito!', 
            'Tu dirección de envío ha sido guardada correctamente.', 
            'success', 
            true, 
            'carrito.html'
        );

    } catch (error) {
        console.error('💥 Error completo:', error);
        
        let errorMessage = 'Error al guardar la dirección';
        
        if (error.message.includes('violates foreign key')) {
            errorMessage = 'Error: El usuario no existe en la base de datos.';
        } else if (error.message.includes('network') || error.message.includes('Internet')) {
            errorMessage = 'Error de conexión. Verifica tu internet.';
        } else if (error.message.includes('duplicate key')) {
            errorMessage = 'Ya existe una dirección con estos datos.';
        } else if (error.message.includes('check constraint')) {
            errorMessage = 'Tipo de propiedad inválido. Selecciona una opción de la lista.';
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
    console.log('🔍 Validando datos:', data);
    
    const errors = [];
    
    if (!data.city) errors.push('ciudad');
    if (!data.municipality) errors.push('municipio');
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errors.push('teléfono válido');
    if (!data.address || data.address.length < 5) errors.push('dirección completa');
    if (!data.neighborhood) errors.push('barrio');
    if (!data.property_type) errors.push('tipo de propiedad');

    if (errors.length > 0) {
        showModal('Error', `Por favor completa: ${errors.join(', ')}`, 'error');
        return false;
    }

    console.log('✅ Validación exitosa');
    return true;
}

async function loadSavedAddresses() {
    try {
        const user = checkActiveSession();
        if (!user) return;

        console.log('📥 Cargando direcciones para usuario:', user.id);

        const { data: addresses, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error cargando direcciones:', error);
            return;
        }

        console.log('✅ Direcciones cargadas:', addresses?.length || 0);
        displaySavedAddresses(addresses || []);
        
    } catch (error) {
        console.error('💥 Error cargando direcciones:', error);
    }
}

function displaySavedAddresses(addresses) {
    const container = document.getElementById('saved-addresses');
    const list = document.getElementById('addresses-list');
    
    if (!container || !list) {
        console.error('❌ No se encontraron elementos para mostrar direcciones');
        return;
    }

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
                <p><i class="fas fa-phone"></i> ${formatPhoneDisplay(address.phone)}</p>
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

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return phone;
}

// Funciones para manejar direcciones
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
        await loadSavedAddresses();
        
    } catch (error) {
        console.error('Error eliminando dirección:', error);
        showModal('Error', 'Error al eliminar la dirección', 'error');
    }
}

async function setDefaultAddress(addressId) {
    try {
        const user = checkActiveSession();
        
        await supabase
            .from('shipping_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);

        const { error } = await supabase
            .from('shipping_addresses')
            .update({ 
                is_default: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', addressId);

        if (error) throw error;

        showModal('Éxito', 'Dirección establecida como predeterminada', 'success');
        await loadSavedAddresses();
        
    } catch (error) {
        console.error('Error estableciendo dirección predeterminada:', error);
        showModal('Error', 'Error al establecer dirección predeterminada', 'error');
    }
}

// Hacer funciones disponibles globalmente
window.editAddress = editAddress;
window.deleteAddress = deleteAddress;
window.setDefaultAddress = setDefaultAddress;