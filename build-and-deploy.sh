#!/bin/bash

# Script para construir y desplegar AppTV en Kubernetes

set -e

echo "🚀 Iniciando construcción y despliegue de AppTV..."

# Variables
REGISTRY="localhost:5000"
BACKEND_IMAGE="apptv-backend"
FRONTEND_IMAGE="apptv-frontend"
VERSION="latest"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no está corriendo. Por favor inicia Docker."
    exit 1
fi

# Verificar que kubectl esté disponible
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl no está instalado. Por favor instala kubectl."
    exit 1
fi

print_status "Construyendo imágenes Docker..."

# Construir imagen del backend
print_status "Construyendo imagen del backend..."
docker build -t ${BACKEND_IMAGE}:${VERSION} ./backend

# Construir imagen del frontend
print_status "Construyendo imagen del frontend..."
docker build -t ${FRONTEND_IMAGE}:${VERSION} ./frontend

print_status "Imágenes construidas exitosamente!"

# Aplicar configuración de Kubernetes
print_status "Aplicando configuración de Kubernetes..."

# Crear namespace si no existe
kubectl create namespace default --dry-run=client -o yaml | kubectl apply -f -

# Aplicar ConfigMap y Secret
kubectl apply -f k8s-configmap.yaml
kubectl apply -f k8s-secret.yaml

# Aplicar Persistent Volume Claims
kubectl apply -f k8s-pvc.yaml

# Aplicar Deployments
kubectl apply -f k8s-backend-deployment.yaml
kubectl apply -f k8s-frontend-deployment.yaml

# Aplicar Services
kubectl apply -f k8s-services.yaml

# Aplicar Ingress
kubectl apply -f k8s-ingress.yaml

print_status "Configuración de Kubernetes aplicada!"

# Esperar a que los pods estén listos
print_status "Esperando a que los pods estén listos..."
kubectl wait --for=condition=ready pod -l app=apptv-backend --timeout=300s
kubectl wait --for=condition=ready pod -l app=apptv-frontend --timeout=300s

print_status "¡Despliegue completado exitosamente!"

# Mostrar información del despliegue
echo ""
print_status "Información del despliegue:"
echo "----------------------------------------"
kubectl get pods -l app=apptv-backend
kubectl get pods -l app=apptv-frontend
echo "----------------------------------------"
kubectl get services
echo "----------------------------------------"
kubectl get ingress

print_status "Para acceder a la aplicación:"
print_warning "1. Agrega 'apptv.local' a tu archivo /etc/hosts"
print_warning "2. Accede a http://apptv.local"
print_warning "3. Para el panel de administración: http://apptv.local/admin.html"

echo ""
print_status "Para ver logs:"
echo "kubectl logs -f deployment/apptv-backend"
echo "kubectl logs -f deployment/apptv-frontend" 