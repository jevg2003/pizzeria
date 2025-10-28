// profile.js - Versión con datos reales
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupEventListeners();
    
    if (typeof checkAuthStatus === 'function') {
        checkAuthStatus();
    }
});

// Cargar datos del usuario desde Supabase
async function loadUserData() {
    const user = localStorage.getItem('pizzeriaUser');
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            
            // Actualizar elementos de la página
            document.getElementById('userName').textContent = userData.name;
            document.getElementById('userAvatar').textContent = userData.name.charAt(0).toUpperCase();
            document.getElementById('userFullName').textContent = userData.full_name || userData.name;
            document.getElementById('userEmail').textContent = userData.email;
            document.getElementById('userPhone').textContent = userData.phone || 'No especificado';
            
            // Establecer fecha de miembro
            const joinDate = new Date();
            document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });
            
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            window.location.href = 'login.html';
        }
    } else {
        window.location.href = 'login.html';
    }
}
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
        
        // Actualizar la UI con los pedidos
        displayOrderHistory(orders);
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

// Función para editar información personal
async function editPersonalInfo() {
    const user = JSON.parse(localStorage.getItem('pizzeriaUser'));
    
    const newName = prompt('Ingresa tu nuevo nombre:', user.full_name);
    const newPhone = prompt('Ingresa tu nuevo teléfono:', user.phone || '');
    
    if (newName && newName.trim() !== '') {
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
            
            alert('Información actualizada correctamente');
            
        } catch (error) {
            console.error('Error actualizando información:', error);
            alert('Error al actualizar la información');
        }
    }
}