#!/bin/sh

# Script de entrada para inyectar variables de entorno en el frontend

# Crear archivo JavaScript con las variables de entorno
cat > /usr/share/nginx/html/env-config.js << EOF
// Configuración de variables de entorno inyectadas por Kubernetes
window.ADMIN_USERNAME = '${ADMIN_USERNAME:-admcomedor}';
window.ADMIN_PASSWORD = '${ADMIN_PASSWORD:-adm.comedor.2025}';
console.log('Variables de entorno cargadas para el frontend');
EOF

# Iniciar nginx
exec nginx -g "daemon off;" 