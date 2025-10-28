// js/supabase.js - Versión corregida
console.log('🔧 Inicializando Supabase...');

// Verificar que la librería esté cargada
if (typeof supabase === 'undefined') {
    console.error('❌ La librería Supabase no está cargada. Revisa el CDN.');
} else {
    console.log('✅ Librería Supabase cargada correctamente');
}

// Tus credenciales - REEMPLAZA CON LAS TUYAS
const SUPABASE_URL = 'https://ydtbzwulmqrfjkbdunyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdGJ6d3VsbXFyZmprYmR1bnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjk4NDUsImV4cCI6MjA3NjgwNTg0NX0.NDN527W9x-2qOtee1Dox70B-sQ4pFHhYHKXTBnevh_s';

// Inicializar Supabase
let supabaseClient;

try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Cliente Supabase inicializado correctamente');
    console.log('📊 URL:', SUPABASE_URL);
    console.log('🔑 Clave presente:', !!SUPABASE_ANON_KEY);
} catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    supabaseClient = null;
}

// Hacer disponible globalmente
window.supabase = supabaseClient;

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = supabaseClient;
}