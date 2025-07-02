// Script de inicialización para usar credenciales desde variables de entorno
(function() {
    // Las credenciales ya están disponibles desde env-config.js
    // Solo verificamos que estén disponibles
    if (window.ADMIN_USERNAME && window.ADMIN_PASSWORD) {
        window.ADMIN_CREDENTIALS = {
            username: window.ADMIN_USERNAME,
            password: window.ADMIN_PASSWORD
        };
        console.log('Credenciales de administrador cargadas desde variables de entorno');
    } else {
        console.warn('Credenciales no disponibles, usando valores por defecto');
        window.ADMIN_CREDENTIALS = {
            username: 'admcomedor',
            password: 'adm.comedor.2025'
        };
    }
})(); 