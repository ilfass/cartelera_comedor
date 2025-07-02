// Configuración dinámica de URLs para diferentes entornos
(function() {
    // Detectar el entorno y configurar la URL del backend
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isKubernetes = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    let API_URL;
    
    if (isLocalhost) {
        // Desarrollo local
        API_URL = 'http://localhost:3000';
    } else if (isKubernetes) {
        // Kubernetes - usar rutas relativas que funcionan con el Ingress
        API_URL = '/api';
    } else {
        // Fallback
        API_URL = '/api';
    }
    
    // Exponer configuración globalmente
    window.APP_CONFIG = {
        API_URL: API_URL,
        WEATHER_API_KEY: '79bf01c7bef5ed9d9aeda331a0d552bf',
        WEATHER_CITY: 'Tandil',
        ENVIRONMENT: isLocalhost ? 'development' : 'production'
    };
    
    console.log('🔧 Configuración cargada:', {
        API_URL: API_URL,
        ENVIRONMENT: window.APP_CONFIG.ENVIRONMENT,
        HOSTNAME: window.location.hostname
    });
})(); 