# 🚀 QUICKSTART - EGEO Docker Compose + Traefik

## TL;DR (Desarrollo Local)

```bash
# 1. Clonar y entrar
cd /home/nespinoza/Documentos/Cxde/EGEO/waitlist/project

# 2. Levantar todo (automático build)
docker compose up --build -d

# 3. Acceder
# Frontend: http://localhost:3000
# PocketBase: http://localhost:8090
# Traefik Dashboard: http://localhost:8080/dashboard/

# 4. Ver logs
docker compose logs -f frontend
```

## Producción (con SSL via Let's Encrypt)

### Paso 1: Configurar dominios

Editar `docker-compose.yml` y reemplazar:
- `egeo.tudominio.com` → tu dominio real
- `pocketbase.tudominio.com` → tu dominio real
- Email en certificados

**Ejemplo:**
```yaml
- "--certificatesresolvers.letsencrypt.acme.email=tu@email.com"
- "traefik.http.routers.egeo-frontend.rule=Host(`tudominio.com`)"
```

### Paso 2: Variables de entorno

Verificar `.env.production`:
```bash
cat .env.production
# Debe tener URLs correctas apuntando a tus dominios
```

### Paso 3: Desplegar

```bash
# Opción A: Script automático (recomendado)
./deploy.sh up

# Opción B: Manual
docker compose up --build -d
docker compose logs -f traefik  # Esperar a que obtenga certificado
```

### Paso 4: Verificar

```bash
# Health checks
./deploy.sh health

# O manual:
curl https://tudominio.com/health
curl https://pocketbase.tudominio.com/api/health
```

## Comandos útiles

| Comando | Función |
|---------|---------|
| `docker compose up -d` | Levantar sin rebuild |
| `docker compose up --build -d` | Levantar + rebuild |
| `docker compose down` | Detener todo |
| `docker compose logs -f frontend` | Ver logs en vivo |
| `./deploy.sh rebuild` | Reconstruir frontend |
| `./deploy.sh health` | Chequear salud |

## Estructura generada

```
.
├── .env.production         ← Variables de entorno
├── .dockerignore          ← Archivos ignorados en build
├── Dockerfile             ← Build del frontend
├── docker-compose.yml     ← Orquestación (Traefik + Frontend + PocketBase)
├── nginx.conf             ← Config de nginx dentro del contenedor
├── deploy.sh              ← Script de despliegue automático
├── DEPLOYMENT.md          ← Guía completa
└── src/                   ← Código frontend

Creado automáticamente en runtime:
├── letsencrypt/           ← Certificados SSL (Let's Encrypt)
├── pocketbase-data/       ← Datos de PocketBase
└── node_modules/          ← Dependencias (dentro del contenedor)
```

## FAQ

### P: ¿Cómo cambio la URL de PocketBase?
R: Edita `.env.production` y `docker-compose.yml`, luego:
```bash
./deploy.sh rebuild
```

### P: ¿Cómo obtengo SSL automático?
R: Traefik se integra con Let's Encrypt. Abre puertos 80/443 y apunta DNS.

### P: ¿Puedo usar solo HTTP en desarrollo?
R: Sí, en desarrollo local funciona con HTTP. En producción usa HTTPS.

### P: ¿Cómo escalo a múltiples instancias?
R: En `docker-compose.yml`, en el servicio `frontend`:
```yaml
deploy:
  replicas: 3
```

### P: ¿Qué pasa si fallo el email de Let's Encrypt?
R: El certificado no se genera. Revisa logs:
```bash
docker-compose logs traefik | grep -i acme
```

## Seguridad Básica

1. **Cambiar contraseña Traefik**:
   ```bash
   docker run --rm httpd:2.4-alpine htpasswd -nbB admin tucontraseña
   # Copiar resultado a docker-compose.yml
   ```

2. **Firewall**:
   ```bash
   ufw allow 80
   ufw allow 443
   ufw allow 22  # SSH si es remoto
   ```

3. **CORS en PocketBase**: https://pocketbase.tudominio.com/admin/

---

📖 Guía completa: [DEPLOYMENT.md](DEPLOYMENT.md)
