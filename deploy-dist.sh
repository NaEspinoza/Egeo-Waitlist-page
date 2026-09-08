#!/usr/bin/env bash
# Script simple para construir frontend y copiar dist/ al servidor nginx vía scp
# Uso (LOCAL):
#   export SERVER_USER=usuario
#   export SERVER_HOST=tu-server.com
#   export SERVER_PATH=/var/www/egeo-waitlist/dist
#   ./deploy-dist.sh

set -euo pipefail

: "Ensure environment variables are set"
: "SERVER_USER, SERVER_HOST, SERVER_PATH"

if [ -z "${SERVER_USER:-}" ] || [ -z "${SERVER_HOST:-}" ] || [ -z "${SERVER_PATH:-}" ]; then
  echo "ERROR: Setea SERVER_USER, SERVER_HOST y SERVER_PATH antes de ejecutar"
  echo "Ejemplo: export SERVER_USER=usuario; export SERVER_HOST=example.com; export SERVER_PATH=/var/www/egeo-waitlist/dist"
  exit 1
fi

# Build step
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm no está instalado en este entorno. Ejecuta localmente: npm ci && npm run build"
  exit 1
fi

echo "Instalando dependencias..."
npm ci

echo "Construyendo la app (vite build)..."
npm run build

# Copy dist to server
echo "Subiendo contenido de dist/ a ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"
# Crea carpeta destino remoto y copia (usa scp -r)
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH} && chmod 755 $(dirname ${SERVER_PATH})"
scp -r dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo "Despliegue completado. Verifica nginx configuración y permisos en el servidor." 
