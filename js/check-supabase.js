// js/check-supabase.js
async function checkSupabaseConnection() {
    console.log('🔍 Verificando conexión con Supabase...');
    
    // Verificar que Supabase esté cargado
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase no está cargado');
        return false;
    }
    console.log('✅ Supabase cargado correctamente');
    
    try {
        // Intentar una operación simple
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Error en getSession:', error);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        console.log('📊 Datos de sesión:', data);
        
        // Verificar que la URL y KEY sean correctas
        console.log('🔗 Supabase URL:', supabase.supabaseUrl);
        console.log('🔑 Supabase KEY:', supabase.supabaseKey ? '✅ Presente' : '❌ Faltante');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error grave en conexión:', error);
        return false;
    }
}

// Función para probar la base de datos
async function testDatabaseConnection() {
    console.log('🗄️ Probando conexión con la base de datos...');
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Error en consulta a BD:', error);
            return false;
        }
        
        console.log('✅ Conexión a base de datos exitosa');
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba de BD:', error);
        return false;
    }
}

// Ejecutar verificaciones cuando se cargue la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando verificación de Supabase...');
    
    const connectionOk = await checkSupabaseConnection();
    const dbOk = await testDatabaseConnection();
    
    if (connectionOk && dbOk) {
        console.log('🎉 ¡Todas las verificaciones pasaron! Supabase está funcionando correctamente.');
        // Mostrar mensaje en la página (opcional)
        showConnectionStatus('success', 'Conexión con Supabase establecida correctamente');
    } else {
        console.error('💥 Hay problemas con la conexión a Supabase');
        showConnectionStatus('error', 'Problemas con la conexión a Supabase. Revisa la consola.');
    }
});

function showConnectionStatus(type, message) {
    // Crear un elemento para mostrar el estado
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 10000;
        max-width: 300px;
        font-weight: bold;
        ${type === 'success' ? 'background: #4CAF50;' : 'background: #f44336;'}
    `;
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        statusDiv.remove();
    }, 5000);
}