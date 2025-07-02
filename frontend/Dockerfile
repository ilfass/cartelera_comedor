# Usar nginx como imagen base
FROM nginx:alpine

# Copiar archivos estáticos
COPY . /usr/share/nginx/html/

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar script de entrada
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Crear directorio para uploads
RUN mkdir -p /usr/share/nginx/html/uploads

# Exponer puerto
EXPOSE 80

# Usar script de entrada
CMD ["/entrypoint.sh"] 