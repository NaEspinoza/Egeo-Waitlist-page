#!/bin/bash

################################################################################
# Script de despliegue para EGEO Frontend + Traefik + Docker Compose          #
# Automatiza operaciones comunes: levantar, detener, ver logs, reconstruir    #
# Sintaxis moderna: docker compose (v2, no docker-compose legacy)             #
# Requisitos: Docker Engine 20.10+, Docker Compose v2, acceso al socket      #
# Uso: ./deploy.sh [up|down|logs|rebuild|clean|health|ps|config]            #
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="egeo"

# Función para logging
log_info() {
  echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

# Validar que Docker está instalado
if ! command -v docker &> /dev/null; then
  log_error "Docker no está instalado o no está en PATH"
  exit 1
fi

# Validar que docker compose v2 está disponible
if ! docker compose version &> /dev/null; then
  log_error "Docker Compose v2 no está disponible"
  exit 1
fi

# Validar que docker-compose.yml existe
if [ ! -f "$COMPOSE_FILE" ]; then
  log_error "Archivo $COMPOSE_FILE no encontrado"
  exit 1
fi

COMMAND="${1:-up}"

case $COMMAND in
  up)
    log_info "Levantando servicios (build + start)..."
    docker compose up --build -d
    log_success "Servicios levantados correctamente"
    echo ""
    log_info "Esperando a que los servicios estén listos..."
    sleep 3
    echo ""
    log_info "Estado de servicios:"
    docker compose ps
    echo ""
    log_info "Accesos:"
    echo "  🌐 Frontend:  https://egeo.tudominio.com"
    echo "  📊 Traefik Dashboard: https://traefik.tudominio.com/dashboard/"
    echo ""
    log_warn "Reemplaza 'tudominio.com' con tu dominio en docker-compose.yml"
    echo ""
    log_info "Los certificados SSL pueden tardar 30-60 segundos en obtenerse..."
    sleep 2
    log_info "Primeros logs de Traefik:"
    docker compose logs traefik | head -20
    ;;

  down)
    log_info "Deteniendo servicios..."
    docker compose down
    log_success "Servicios detenidos correctamente"
    ;;

  logs)
    log_info "Mostrando logs de Traefik (última 50 líneas, presiona Ctrl+C para salir)..."
    docker compose logs -f traefik
    ;;

  logs-frontend)
    log_info "Mostrando logs de Frontend (presiona Ctrl+C para salir)..."
    docker compose logs -f frontend
    ;;

  logs-all)
    log_info "Mostrando logs de todos los servicios (presiona Ctrl+C para salir)..."
    docker compose logs -f
    ;;

  rebuild)
    log_info "Reconstruyendo imagen de Frontend (sin cache)..."
    docker compose build --no-cache frontend
    log_success "Imagen reconstruida"
    echo ""
    log_info "Reiniciando servicio de Frontend..."
    docker compose up -d frontend
    log_success "Frontend reiniciado"
    echo ""
    log_info "Mostrando logs de Frontend:"
    docker compose logs -f frontend
    ;;

  restart)
    log_info "Reiniciando todos los servicios..."
    docker compose restart
    log_success "Servicios reiniciados"
    docker compose ps
    ;;

  ps)
    log_info "Estado de servicios:"
    docker compose ps
    echo ""
    log_info "Estadísticas de contenedores:"
    docker compose stats --no-stream
    ;;

  config)
    log_info "Validando sintaxis de docker-compose.yml..."
    docker compose config > /dev/null
    log_success "Configuración válida"
    echo ""
    log_info "Mostrando configuración procesada:"
    docker compose config
    ;;

  clean)
    log_warn "PELIGROSO: Esto detendrá servicios y borrará volúmenes"
    read -p "¿Estás seguro? Escribe 'SÍ' para confirmar: " -r
    echo
    if [ "$REPLY" = "SÍ" ]; then
      log_info "Deteniendo servicios y eliminando volúmenes..."
      docker compose down -v
      log_success "Servicios detenidos y volúmenes eliminados"
      log_info "Los certificados SSL también fueron eliminados y se regenerarán"
    else
      log_info "Operación cancelada"
    fi
    ;;

  health)
    log_info "Verificando salud de servicios..."
    echo ""
    
    # Verificar Frontend
    log_info "🌐 Frontend:"
    if docker compose exec frontend wget -q -O /dev/null http://localhost:3000 2>/dev/null; then
      log_success "Frontend responde en puerto 3000"
    else
      log_error "Frontend no responde"
    fi
    echo ""
    
    # Verificar Traefik
    log_info "🔄 Traefik:"
    if docker compose exec traefik traefik healthcheck --ping 2>/dev/null; then
      log_success "Traefik está sano"
    else
      log_error "Traefik no responde al health check"
    fi
    echo ""
    
    # Mostrar estado de contenedores
    log_info "Estado de contenedores:"
    docker compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    ;;

  logs-traefik-full)
    log_info "Mostrando todos los logs de Traefik desde el inicio..."
    docker compose logs traefik
    ;;

  prune)
    log_warn "Limpiando recursos no usados de Docker..."
    docker system prune -f
    log_success "Limpieza completada"
    ;;

  *)
    echo "Uso: ./deploy.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo ""
    echo "  Operaciones principales:"
    echo "    up              - Levantar y compilar todos los servicios"
    echo "    down            - Detener todos los servicios"
    echo "    restart         - Reiniciar servicios (sin reconstruir)"
    echo ""
    echo "  Monitoreo y logs:"
    echo "    logs            - Ver logs de Traefik en tiempo real"
    echo "    logs-frontend   - Ver logs de Frontend en tiempo real"
    echo "    logs-all        - Ver logs de todos los servicios"
    echo "    logs-traefik-full - Ver todos los logs históricos de Traefik"
    echo "    ps              - Ver estado y estadísticas de contenedores"
    echo "    health          - Verificar salud de todos los servicios"
    echo ""
    echo "  Mantenimiento:"
    echo "    rebuild         - Reconstruir imagen de Frontend (sin cache)"
    echo "    config          - Validar y mostrar configuración de compose"
    echo "    clean           - ELIMINAR TODOS LOS SERVICIOS Y VOLÚMENES ⚠️"
    echo "    prune           - Limpiar recursos no usados de Docker"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy.sh up                  # Levantar todo"
    echo "  ./deploy.sh logs                # Ver logs de Traefik"
    echo "  ./deploy.sh rebuild && ./deploy.sh logs-frontend  # Reconstruir y ver logs"
esac
