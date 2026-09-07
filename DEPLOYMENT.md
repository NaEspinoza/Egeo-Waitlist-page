# DEPLOYMENT GUIDE - EGEO Frontend + Traefik + Docker Compose

## Requisitos

- Docker 20.10+ con Docker Compose v2 (sintaxis: `docker compose`)
- Docker Compose integrado en Docker (sin necesidad del plugin)
- Dominio apuntando a tu servidor (DNS A record)
- Email válido para Let's Encrypt

## Pre-deployment Checklist

1. **Actualizar dominios en `docker-compose.yml`**:
   - Reemplazar `egeo.tudominio.com` por tu dominio real
   - Reemplazar `pocketbase.tudominio.com` por tu dominio real
   - Actualizar email en certificados Let's Encrypt

2. **Actualizar `.env.production`** (opcional si cambió):
   ```bash
   VITE_POCKETBASE_URL=https://pocketbase.tudominio.com
   VITE_POCKETBASE_COLLECTION=waitlist
   ```

3. **Crear carpeta `letsencrypt`**:
   ```bash
   mkdir -p letsencrypt
   chmod 600 letsencrypt
   ```

4. **Cambiar contraseña del dashboard Traefik** (seguridad):
   ```bash
   # Generar hash bcrypt para usuario admin
   docker run --rm httpd:2.4-alpine htpasswd -nbB admin tucontraseña | sed 's/\$/\$\$/g'
   ```
   Reemplazar el valor en el label `traefik.http.middlewares.auth.basicauth.users`

## Despliegue

### Opción 1: Desarrollo Local (sin SSL)

```bash
# En la carpeta del proyecto
docker-compose up --build

# Frontend disponible en: http://localhost
# Dashboard Traefik: http://localhost:8080/dashboard/
# PocketBase: http://localhost:8090/admin/
```

### Opción 2: Producción (con SSL via Let's Encrypt)

```bash
# 1. Actualizar docker-compose.yml con dominios reales

# 2. Build y start con background
docker compose up --build -d

# 3. Verificar logs
docker compose logs -f traefik
docker compose logs -f frontend

# 4. Esperar 30-60s para que Traefik obtenga el certificado SSL

# 5. Acceder:
# - Frontend: https://egeo.tudominio.com
# - PocketBase Admin: https://pocketbase.tudominio.com/admin/
# - Traefik Dashboard: https://traefik.tudominio.com/dashboard/ (credenciales: admin/admin)
```

## Comandos útiles

### Levantar servicios
```bash
docker compose up --build -d
```

### Ver logs
```bash
docker compose logs -f frontend
docker compose logs -f traefik
docker compose logs -f pocketbase
```

### Detener todo
```bash
docker compose down
```

### Detener y limpiar volúmenes (CUIDADO: borra datos)
```bash
docker compose down -v
```

### Reconstruir solo frontend
```bash
docker compose up --build -d frontend
```

### Ejecutar comando en contenedor
```bash
docker compose exec frontend sh
docker compose exec pocketbase sh
```

## Estructura de directorios esperada

```
project/
├── .env.production          (variables de entorno Vite)
├── .dockerignore           (archivos que ignora Docker)
├── Dockerfile              (build frontend)
├── docker-compose.yml      (orquestación de servicios)
├── nginx.conf              (config de nginx dentro del contenedor)
├── letsencrypt/            (certificados SSL - se crea automático)
├── pocketbase-data/        (datos de PocketBase - si está en docker)
├── src/                    (código fuente frontend)
├── package.json
├── vite.config.ts
└── ... otros archivos
```

## Health Checks

### Frontend
```bash
curl http://localhost:3000/
```

### PocketBase
```bash
curl http://localhost:8090/api/health
```

### Traefik
```bash
docker compose exec traefik wget -O- http://localhost/api/entrypoints
```

## Troubleshooting

### El certificado SSL no se obtiene
```bash
# Verificar logs de Traefik
docker compose logs traefik | grep -i "acme\|cert"

# Asegurar que puerto 80 está abierto (para validación HTTP)
netstat -tuln | grep ":80"

# Revisar que el DNS resuelve correctamente
nslookup egeo.tudominio.com
```

### Frontend no se comunica con PocketBase
```bash
# Verificar URL en .env.production
cat .env.production

# Verificar conectividad entre contenedores
docker compose exec frontend curl http://pocketbase:8090/api/health

# Revisar CORS en PocketBase admin
# https://pocketbase.tudominio.com/admin/
# Settings → CORS Origins
```

### Traefik redirige pero no encuentra servicio
```bash
# Verificar que frontend está en red correcta
docker compose exec traefik wget -O- http://egeo-frontend:3000/

# Verificar labels en docker-compose.yml están correctamente indentados
docker compose config
```

## Performance & Optimization

### Cache del frontend
- Assets versionados (JS/CSS con hash) → cache 1 año
- HTML → cache 0 (siempre refresca)
- Se configura en `nginx.conf`

### Compresión Gzip
- Activa en nginx.conf para texto, JSON, JS
- Traefik middleware compress adicional

### Escalado
Para múltiples instancias de frontend:
```yaml
deploy:
  replicas: 3
```
Traefik automáticamente balancea carga.

## Actualizaciones

### Actualizar código del frontend
```bash
# 1. Cambiar código
git pull

# 2. Rebuild y restart
docker compose up --build -d frontend

# 3. Verificar
docker compose logs -f frontend
```

### Actualizar versión de PocketBase
```bash
docker compose up --build -d pocketbase
```

### Actualizar Traefik
```bash
# Solo cambiar versión en docker-compose.yml
# traefik:v2.10 → traefik:v2.11
docker compose up --build -d traefik
```

## Seguridad

1. **Cambiar credenciales Traefik dashboard** (ver sección Pre-deployment)
2. **HTTPS obligatorio** (Traefik redirige HTTP → HTTPS)
3. **CORS en PocketBase** → Solo dominio del frontend
4. **Firewall**: Abrir solo puertos 80, 443 en servidor
5. **Backups**: Usar volumen Docker para `pocketbase-data` con backup automático

## Monitoring (opcional)

### Ver uso de recursos
```bash
docker stats
```

### Alertas Traefik (Prometheus)
```bash
curl http://localhost:8080/metrics
```

---

**Última actualización**: 14 Enero 2026
**Rama**: Production
