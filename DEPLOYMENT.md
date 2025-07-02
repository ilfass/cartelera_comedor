# 🚀 Guía de Despliegue - AppTV

Esta guía te ayudará a desplegar AppTV en Kubernetes con Vault para la gestión de secretos.

## 📋 Prerrequisitos

### Herramientas Necesarias
- ✅ `kubectl` configurado y conectado al cluster
- ✅ `docker` instalado y configurado
- ✅ `vault` CLI instalado y autenticado
- ✅ Acceso al registro Harbor (`harbor.unicen.edu.ar`)
- ✅ External Secrets Operator instalado en el cluster

### Verificar Prerrequisitos
```bash
# Verificar kubectl
kubectl cluster-info

# Verificar docker
docker --version

# Verificar vault
vault status

# Verificar acceso a Harbor
docker login harbor.unicen.edu.ar
```

## 🏗️ Paso 1: Construir y Subir Imágenes

```bash
# Ejecutar script de construcción
./build-and-push.sh
```

**Nota**: Asegúrate de estar logueado en Harbor antes de ejecutar este script.

## 🔐 Paso 2: Configurar Secretos en Vault

```bash
# Ejecutar script de configuración de Vault
./setup-vault-secrets.sh
```

Este script creará los siguientes secretos:
- `JWT_SECRET`: Clave para firmar tokens JWT
- `ADMIN_USERNAME`: Usuario administrador (`admcomedor`)
- `ADMIN_PASSWORD`: Contraseña administrador (`adm.comedor.2025`)

## 🚀 Paso 3: Desplegar en Kubernetes

```bash
# Ejecutar script de despliegue completo
./deploy-to-k8s.sh
```

Este script realizará automáticamente:
1. ✅ Crear namespace `web-comedor-apptv`
2. ✅ Configurar autenticación de Vault
3. ✅ Crear External Secret para sincronizar Vault → Kubernetes
4. ✅ Crear Persistent Volume Claims
5. ✅ Desplegar backend y frontend
6. ✅ Crear servicios
7. ✅ Configurar Ingress
8. ✅ Verificar que todo esté funcionando

## 📊 Verificar el Despliegue

### Verificar Pods
```bash
kubectl get pods -n web-comedor-apptv
```

### Verificar Servicios
```bash
kubectl get services -n web-comedor-apptv
```

### Verificar Ingress
```bash
kubectl get ingress -n web-comedor-apptv
```

### Verificar Logs
```bash
# Logs del backend
kubectl logs -f deployment/apptv-backend -n web-comedor-apptv

# Logs del frontend
kubectl logs -f deployment/apptv-frontend -n web-comedor-apptv
```

## 🌐 Acceso a la Aplicación

### URLs
- **Frontend**: `http://apptv.local` (o la URL configurada en tu Ingress)
- **Backend API**: `http://apptv.local/api`

### Credenciales de Administración
- **Usuario**: `admcomedor`
- **Contraseña**: `adm.comedor.2025`
- **URL de Admin**: `http://apptv.local/admin.html`

## 🔧 Configuración del Ingress

El Ingress está configurado para:
- **Ruta `/`**: Sirve el frontend (Nginx)
- **Ruta `/api`**: Redirige al backend (Node.js)

### Personalizar la URL
Si necesitas cambiar la URL, edita `k8s-ingress.yaml`:

```yaml
spec:
  rules:
  - host: tu-dominio.com  # Cambiar aquí
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: apptv-frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: apptv-backend-service
            port:
              number: 3000
```

## 🔄 Actualización de la Aplicación

### Actualizar Imágenes
```bash
# 1. Construir nuevas imágenes
./build-and-push.sh

# 2. Reiniciar deployments
kubectl rollout restart deployment/apptv-backend -n web-comedor-apptv
kubectl rollout restart deployment/apptv-frontend -n web-comedor-apptv
```

### Actualizar Configuración
```bash
# Aplicar cambios en los manifiestos
kubectl apply -f k8s-deployment-backend.yaml
kubectl apply -f k8s-deployment-frontend.yaml
```

## 🗑️ Desinstalación

Para eliminar completamente la aplicación:

```bash
# Eliminar todos los recursos
kubectl delete namespace web-comedor-apptv

# Eliminar secretos de Vault (opcional)
vault kv delete secret/apptv-backend
```

## 🐛 Solución de Problemas

### Problema: Pods no se inician
```bash
# Verificar eventos
kubectl get events -n web-comedor-apptv

# Verificar logs
kubectl logs deployment/apptv-backend -n web-comedor-apptv
kubectl logs deployment/apptv-frontend -n web-comedor-apptv
```

### Problema: Secretos no se crean
```bash
# Verificar External Secret
kubectl get externalsecret -n web-comedor-apptv
kubectl describe externalsecret apptv-backend-secrets -n web-comedor-apptv

# Verificar Vault
vault kv get secret/apptv-backend
```

### Problema: Ingress no funciona
```bash
# Verificar Ingress Controller
kubectl get pods -n ingress-nginx

# Verificar configuración
kubectl describe ingress apptv-ingress -n web-comedor-apptv
```

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. ✅ Verifica todos los prerrequisitos
2. ✅ Revisa los logs de los pods
3. ✅ Verifica la configuración de Vault
4. ✅ Confirma que External Secrets Operator esté funcionando

---

**¡AppTV está lista para producción!** 🎉 