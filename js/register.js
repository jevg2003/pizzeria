// js/register.js - Versión con tabla personalizada
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creando cuenta...';
            submitBtn.disabled = true;
            
            const formData = new FormData(this);
            const userData = {
                full_name: formData.get('nombre'),
                email: formData.get('email').toLowerCase().trim(),
                phone: formData.get('telefono'),
                password: formData.get('clave'),
                confirmPassword: formData.get('confirmar_clave')
            };
            
            // Validaciones
            if (userData.password !== userData.confirmPassword) {
                showModal('Error', 'Las contraseñas no coinciden', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (userData.password.length < 6) {
                showModal('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            try {
                console.log('📝 Registrando usuario en tabla personalizada...');
                
                // Verificar si el usuario ya existe
                const { data: existingUser, error: checkError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', userData.email)
                    .single();
                
                if (existingUser) {
                    throw new Error('Este email ya está registrado');
                }
                
                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no encontrado
                    throw checkError;
                }
                
                // Hashear contraseña
                const passwordHash = await hashPassword(userData.password);
                
                // Insertar usuario en la tabla personalizada
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            email: userData.email,
                            password_hash: passwordHash,
                            full_name: userData.full_name,
                            phone: userData.phone,
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('❌ Error insertando usuario:', insertError);
                    throw insertError;
                }
                
                console.log('✅ Usuario registrado en tabla personalizada:', newUser.id);
                
                // Crear sesión automáticamente
                const userSession = {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.full_name,
                    full_name: newUser.full_name,
                    phone: newUser.phone,
                    loginDate: new Date().toISOString()
                };
                
                saveUserSession(userSession);
                
                showModal(
                    '¡Cuenta Creada!', 
                    'Tu cuenta ha sido creada exitosamente. Bienvenido a Pizzeria El Sinú!', 
                    'success', 
                    true, 
                    'index.html'
                );
                
            } catch (error) {
                console.error('💥 Error en registro:', error);
                
                let errorMessage = 'Error al crear la cuenta';
                
                if (error.message.includes('ya está registrado')) {
                    errorMessage = 'Este email ya está registrado';
                } else if (error.message.includes('duplicate key')) {
                    errorMessage = 'Este email ya está registrado';
                } else if (error.message.includes('invalid email')) {
                    errorMessage = 'El formato del email es inválido';
                } else {
                    errorMessage = error.message || 'Error al crear la cuenta';
                }
                
                showModal('Error', errorMessage, 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});