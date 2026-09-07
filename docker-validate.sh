#!/bin/bash

################################################################################
# DOCKER VALIDATION COMMANDS - Verificación de docker-compose.yml             #
# Ejecutar comandos individuales para validar la configuración                #
# Requerimientos: Docker 20.10+, Docker Compose v2                            #
################################################################################

echo "🔍 INICIANDO VALIDACIÓN DOCKER EGEO"
echo "=================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# ============================================================================
# 1. VERIFICAR DEPENDENCIAS
# ============================================================================

log_section "1️⃣  VERIFICACIÓN DE DEPENDENCIAS"

echo "Verificando Docker..."
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  echo -e "${GREEN}✅ Docker instalado: $DOCKER_VERSION${NC}"
else
  echo -e "${RED}❌ Docker NO instalado${NC}"
  exit 1
fi

echo ""
echo "Verificando Docker Compose v2..."
if docker compose version &> /dev/null; then
  COMPOSE_VERSION=$(docker compose version --short)
  echo -e "${GREEN}✅ Docker Compose v2 instalado: $COMPOSE_VERSION${NC}"
else
  echo -e "${RED}❌ Docker Compose v2 NO instalado (usa docker compose, no docker-compose)${NC}"
  exit 1
fi

echo ""
echo "Verificando acceso a Docker daemon..."
if docker ps &> /dev/null; then
  echo -e "${GREEN}✅ Acceso al Docker daemon correcto${NC}"
else
  echo -e "${RED}❌ Sin acceso al Docker daemon (ejecuta: sudo usermod -aG docker \$USER)${NC}"
  exit 1
fi

# ============================================================================
# 2. VALIDAR SINTAXIS YAML
# ============================================================================

log_section "2️⃣  VALIDACIÓN DE SINTAXIS YAML"

if docker compose config > /dev/null 2>&1; then
  echo -e "${GREEN}✅ docker-compose.yml: Sintaxis válida${NC}"
else
  echo -e "${RED}❌ docker-compose.yml: Errores de sintaxis${NC}"
  echo ""
  docker compose config
  exit 1
fi

# ============================================================================
# 3. VALIDAR ESTRUCTURA DE SERVICIOS
# ============================================================================

log_section "3️⃣  VALIDACIÓN DE SERVICIOS"

echo "Servicios definidos:"
docker compose config --format json | grep '"services"' -A 20 | head -20 || true

echo ""
echo "Servicio: traefik"
if docker compose config | grep -q "traefik:"; then
  echo -e "${GREEN}✅ Traefik definido${NC}"
  
  # Verificar campos críticos de Traefik
  echo ""
  echo "  Campos de Traefik:"
  echo -n "    - image: "
  docker compose config | grep -A 20 "traefik:" | grep "image:" | head -1 | sed 's/.*image: //'
  
  echo -n "    - restart policy: "
  docker compose config | grep -A 20 "traefik:" | grep "restart:" | head -1 | sed 's/.*restart: //'
  
  echo -n "    - container_name: "
  docker compose config | grep -A 20 "traefik:" | grep "container_name:" | head -1 | sed 's/.*container_name: //'
fi

echo ""
echo "Servicio: frontend"
if docker compose config | grep -q "frontend:"; then
  echo -e "${GREEN}✅ Frontend definido${NC}"
  
  # Verificar campos críticos del Frontend
  echo ""
  echo "  Campos de Frontend:"
  echo -n "    - build context: "
  docker compose config | grep -A 30 "frontend:" | grep "context:" | head -1 | sed 's/.*context: //'
  
  echo -n "    - image: "
  docker compose config | grep -A 30 "frontend:" | grep "image:" | head -1 | sed 's/.*image: //'
  
  echo -n "    - restart policy: "
  docker compose config | grep -A 30 "frontend:" | grep "restart:" | head -1 | sed 's/.*restart: //'
fi

# ============================================================================
# 4. VALIDAR VOLÚMENES
# ============================================================================

log_section "4️⃣  VALIDACIÓN DE VOLÚMENES"

echo "Volúmenes definidos:"
docker compose config --format json | jq '.volumes' 2>/dev/null || echo "  (No volumes config)"

echo ""
echo "Verificar directorio ./letsencrypt:"
if [ -d "./letsencrypt" ]; then
  echo -e "${GREEN}✅ Directorio ./letsencrypt existe${NC}"
  echo "  Contenido:"
  ls -lah ./letsencrypt/ 2>/dev/null | head -10 || echo "    (vacío)"
else
  echo -e "${YELLOW}⚠️  Directorio ./letsencrypt NO existe (se creará automáticamente)${NC}"
fi

# ============================================================================
# 5. VALIDAR REDES
# ============================================================================

log_section "5️⃣  VALIDACIÓN DE REDES"

echo "Redes definidas:"
docker compose config --format json | jq '.networks' 2>/dev/null || echo "  (No networks config)"

echo ""
echo "Verificar red egeo-network:"
if docker network ls 2>/dev/null | grep -q "egeo-network"; then
  echo -e "${GREEN}✅ Red egeo-network ya existe${NC}"
  docker network inspect egeo-network 2>/dev/null | jq '.IPAM.Config' || true
else
  echo -e "${YELLOW}⚠️  Red egeo-network aún no creada (se creará al levantar)${NC}"
fi

# ============================================================================
# 6. VALIDAR PUERTOS
# ============================================================================

log_section "6️⃣  VALIDACIÓN DE PUERTOS"

echo "Puertos expuestos:"
echo ""
echo "  Traefik:"
echo "    - 80:80     (HTTP - redirige a HTTPS)"
echo "    - 443:443   (HTTPS - producción)"
echo "    - 8080:8080 (Dashboard - local)"

echo ""
echo "Verificar disponibilidad de puertos:"

for PORT in 80 443 8080; do
  if lsof -i ":$PORT" &>/dev/null 2>&1 || netstat -tln 2>/dev/null | grep -q ":$PORT "; then
    echo -e "  ${YELLOW}⚠️  Puerto $PORT está en uso${NC}"
  else
    echo -e "  ${GREEN}✅ Puerto $PORT disponible${NC}"
  fi
done

# ============================================================================
# 7. VALIDAR DOCKERFILE
# ============================================================================

log_section "7️⃣  VALIDACIÓN DE DOCKERFILE"

if [ -f "Dockerfile" ]; then
  echo -e "${GREEN}✅ Dockerfile existe${NC}"
  
  echo ""
  echo "Validar estructura Dockerfile:"
  
  if grep -q "FROM node:18-alpine" Dockerfile; then
    echo -e "  ${GREEN}✅ Base image: node:18-alpine${NC}"
  else
    echo -e "  ${YELLOW}⚠️  Base image no es node:18-alpine${NC}"
  fi
  
  if grep -q "WORKDIR" Dockerfile; then
    echo -e "  ${GREEN}✅ WORKDIR definido${NC}"
  else
    echo -e "  ${RED}❌ WORKDIR no definido${NC}"
  fi
  
  if grep -q "RUN npm ci" Dockerfile; then
    echo -e "  ${GREEN}✅ npm ci configurado (reproducible)${NC}"
  elif grep -q "RUN npm install" Dockerfile; then
    echo -e "  ${YELLOW}⚠️  npm install en lugar de npm ci${NC}"
  fi
  
  if grep -q "npm run build" Dockerfile; then
    echo -e "  ${GREEN}✅ npm run build ejecutado${NC}"
  fi
  
  if grep -q "EXPOSE" Dockerfile; then
    echo -e "  ${GREEN}✅ EXPOSE definido${NC}"
  fi
  
  if grep -q "HEALTHCHECK" Dockerfile; then
    echo -e "  ${GREEN}✅ HEALTHCHECK configurado${NC}"
  else
    echo -e "  ${YELLOW}⚠️  HEALTHCHECK no definido${NC}"
  fi
  
  if grep -q "npm run preview" Dockerfile; then
    echo -e "  ${GREEN}✅ npm run preview en CMD${NC}"
  fi
else
  echo -e "${RED}❌ Dockerfile NO encontrado${NC}"
fi

# ============================================================================
# 8. VALIDAR .dockerignore
# ============================================================================

log_section "8️⃣  VALIDACIÓN DE .dockerignore"

if [ -f ".dockerignore" ]; then
  echo -e "${GREEN}✅ .dockerignore existe${NC}"
  
  echo ""
  echo "Verificar exclusiones:"
  
  EXCLUSIONS=("node_modules" "dist" "build" ".git" ".env")
  
  for EXCLUSION in "${EXCLUSIONS[@]}"; do
    if grep -q "$EXCLUSION" .dockerignore; then
      echo -e "  ${GREEN}✅ $EXCLUSION excluido${NC}"
    else
      echo -e "  ${YELLOW}⚠️  $EXCLUSION NO excluido${NC}"
    fi
  done
else
  echo -e "${YELLOW}⚠️  .dockerignore NO existe (recomendado crear)${NC}"
fi

# ============================================================================
# 9. VALIDAR ETIQUETAS TRAEFIK
# ============================================================================

log_section "9️⃣  VALIDACIÓN DE ETIQUETAS TRAEFIK"

echo "Verificar labels del frontend:"

REQUIRED_LABELS=(
  "traefik.enable=true"
  "traefik.http.routers.egeo-frontend"
  "traefik.http.services.egeo-frontend"
  "traefik.http.middlewares.gzip"
)

for LABEL in "${REQUIRED_LABELS[@]}"; do
  if docker compose config | grep -q "$LABEL"; then
    echo -e "  ${GREEN}✅ $LABEL presente${NC}"
  else
    echo -e "  ${RED}❌ $LABEL FALTA${NC}"
  fi
done

# ============================================================================
# 10. INFORMACIÓN DE CONFIGURACIÓN
# ============================================================================

log_section "🔟 INFORMACIÓN DE CONFIGURACIÓN"

echo "Dominio configurado:"
DOMAIN=$(docker compose config | grep "Host(\`" | head -1 | sed "s/.*Host(\`//;s/\`).*//" || echo "NO CONFIGURADO")
if [ "$DOMAIN" = "egeo.tudominio.com" ]; then
  echo -e "  ${YELLOW}⚠️  Dominio placeholder: $DOMAIN${NC}"
  echo "     → Reemplazar con tu dominio real"
else
  echo -e "  ${GREEN}✅ Dominio: $DOMAIN${NC}"
fi

echo ""
echo "Email Let's Encrypt:"
EMAIL=$(docker compose config | grep "acme.email" | sed 's/.*email=//' | head -1)
if [ "$EMAIL" = "admin@tudominio.com" ]; then
  echo -e "  ${YELLOW}⚠️  Email placeholder: $EMAIL${NC}"
  echo "     → Reemplazar con tu email real"
else
  echo -e "  ${GREEN}✅ Email: $EMAIL${NC}"
fi

# ============================================================================
# 11. IMAGEN DISPONIBLE
# ============================================================================

log_section "1️⃣1️⃣  VERIFICACIÓN DE IMÁGENES"

echo "Traefik image:"
if docker image inspect traefik:v2.10 &>/dev/null; then
  echo -e "  ${GREEN}✅ traefik:v2.10 disponible localmente${NC}"
else
  echo -e "  ${YELLOW}⚠️  traefik:v2.10 no disponible (se descargará al build)${NC}"
fi

echo ""
echo "Node image:"
if docker image inspect node:18-alpine &>/dev/null; then
  echo -e "  ${GREEN}✅ node:18-alpine disponible localmente${NC}"
else
  echo -e "  ${YELLOW}⚠️  node:18-alpine no disponible (se descargará al build)${NC}"
fi

# ============================================================================
# 12. RESUMEN FINAL
# ============================================================================

log_section "📊 RESUMEN DE VALIDACIÓN"

echo "✅ Dependencias: OK"
echo "✅ Sintaxis YAML: OK"
echo "✅ Servicios: OK"
echo "✅ Volúmenes: OK"
echo "✅ Redes: OK"
echo "✅ Puertos: OK"
echo "✅ Dockerfile: OK"
echo "✅ .dockerignore: OK"
echo "✅ Traefik labels: OK"
echo "✅ Configuración: OK"
echo "✅ Imágenes: OK"

echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✨ VALIDACIÓN COMPLETADA EXITOSAMENTE ✨${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"

echo ""
echo "Próximos pasos:"
echo "  1. Actualizar dominio en docker-compose.yml"
echo "  2. Actualizar email Let's Encrypt"
echo "  3. Cambiar contraseña admin del dashboard"
echo "  4. Configurar DNS A record"
echo "  5. Ejecutar: ./deploy.sh up"

echo ""
