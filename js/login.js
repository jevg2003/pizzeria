// js/login.js - Versión con tabla personalizada
document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal system ready');
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