#!/bin/bash

# Script completo para desplegar AppTV en Kubernetes
set -e

echo "🚀 Iniciando despliegue de AppTV en Kubernetes..."

# Verificar que kubectl esté disponible
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl no está instalado"
    exit 1
fi

# Verificar que estés conectado al cluster (más permisivo)
if ! kubectl get namespaces &> /dev/null; then
    echo "❌ Error: No estás conectado al cluster de Kubernetes"
    exit 1
fi

echo "📋 Verificando acceso al cluster..."
kubectl get namespaces | grep web-comedor-apptv || echo "⚠️  Namespace web-comedor-apptv no encontrado"

# Paso 1: Crear namespace
echo "📦 Creando namespace..."
kubectl apply -f k8s-namespace.yaml

# Paso 2: Configurar Vault (si no está configurado)
echo "🔐 Configurando autenticación de Vault..."
kubectl apply -f k8s-vaultAuth.yaml

# Paso 3: Crear External Secret para sincronizar Vault → Kubernetes
echo "🔑 Creando External Secret..."
kubectl apply -f k8s-external-secret.yaml

# Esperar a que se cree el Secret
echo "⏳ Esperando a que se cree el Secret..."
sleep 10

# Verificar que el Secret se creó
if kubectl get secret apptv-backend-env -n web-comedor-apptv &> /dev/null; then
    echo "✅ Secret creado exitosamente"
else
    echo "❌ Error: No se pudo crear el Secret"
    echo "🔍 Verificando External Secret..."
    kubectl get externalsecret -n web-comedor-apptv
    kubectl describe externalsecret apptv-backend-secrets -n web-comedor-apptv
    exit 1
fi

# Paso 4: Crear Persistent Volume Claims
echo "💾 Creando Persistent Volume Claims..."
kubectl apply -f k8s-pvc.yaml

# Paso 5: Desplegar aplicaciones
echo "🚀 Desplegando backend..."
kubectl apply -f k8s-deployment-backend.yaml

echo "🚀 Desplegando frontend..."
kubectl apply -f k8s-deployment-frontend.yaml

# Paso 6: Crear servicios
echo "🔗 Creando servicios..."
kubectl apply -f k8s-services.yaml

# Paso 7: Configurar Ingress
echo "🌐 Configurando Ingress..."
kubectl apply -f k8s-ingress.yaml

# Esperar a que los pods estén listos
echo "⏳ Esperando a que los pods estén listos..."
kubectl wait --for=condition=ready pod -l app=apptv-backend -n web-comedor-apptv --timeout=300s
kubectl wait --for=condition=ready pod -l app=apptv-frontend -n web-comedor-apptv --timeout=300s

# Mostrar estado final
echo "✅ Despliegue completado!"
echo ""
echo "📊 Estado de los recursos:"
echo "=========================="

echo "📦 Pods:"
kubectl get pods -n web-comedor-apptv

echo ""
echo "🔗 Servicios:"
kubectl get services -n web-comedor-apptv

echo ""
echo "🌐 Ingress:"
kubectl get ingress -n web-comedor-apptv

echo ""
echo "💾 PVCs:"
kubectl get pvc -n web-comedor-apptv

echo ""
echo "🔑 Secrets:"
kubectl get secrets -n web-comedor-apptv

echo ""
echo "🎉 ¡AppTV desplegada exitosamente!"
echo "🌐 URL: http://apptv.local (o la URL configurada en tu Ingress)"
echo "👤 Usuario admin: admcomedor"
echo "🔑 Contraseña: adm.comedor.2025" 