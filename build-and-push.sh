#!/bin/bash

# Script para construir y subir imágenes a Harbor
set -e

# Configuración
REGISTRY="harbor.unicen.edu.ar"
NAMESPACE="web"
BACKEND_IMAGE="apptv-backend"
FRONTEND_IMAGE="apptv-frontend"
TAG="latest"

echo "🏗️  Construyendo imágenes Docker..."

# Construir imagen del backend
echo "📦 Construyendo backend..."
cd backend
docker build -t ${REGISTRY}/${NAMESPACE}/${BACKEND_IMAGE}:${TAG} .
cd ..

# Construir imagen del frontend
echo "📦 Construyendo frontend..."
cd frontend
docker build -t ${REGISTRY}/${NAMESPACE}/${FRONTEND_IMAGE}:${TAG} .
cd ..

echo "🔐 Autenticando con Harbor..."
# Nota: Asegúrate de estar logueado en Harbor
# docker login harbor.unicen.edu.ar

echo "📤 Subiendo imágenes a Harbor..."

# Subir backend
echo "📤 Subiendo backend..."
docker push ${REGISTRY}/${NAMESPACE}/${BACKEND_IMAGE}:${TAG}

# Subir frontend
echo "📤 Subiendo frontend..."
docker push ${REGISTRY}/${NAMESPACE}/${FRONTEND_IMAGE}:${TAG}

echo "✅ Imágenes subidas exitosamente!"
echo "🔗 Backend: ${REGISTRY}/${NAMESPACE}/${BACKEND_IMAGE}:${TAG}"
echo "🔗 Frontend: ${REGISTRY}/${NAMESPACE}/${FRONTEND_IMAGE}:${TAG}" 