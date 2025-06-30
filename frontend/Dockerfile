# Usar nginx como imagen base
FROM nginx:alpine

# Copiar archivos estáticos
COPY . /usr/share/nginx/html/

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Crear directorio para uploads
RUN mkdir -p /usr/share/nginx/html/uploads

# Exponer puerto
EXPOSE 80

# Comando para ejecutar nginx
CMD ["nginx", "-g", "daemon off;"] 