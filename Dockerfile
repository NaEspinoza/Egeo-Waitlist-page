# Dockerfile para Frontend EGEO (Vite + React)
# Construcción y ejecución de aplicación React compilada con Vite
# El servidor integrado de Vite (preview) corre en puerto 3000
# Traefik maneja SSL, compresión GZIP y enrutamiento HTTPS

FROM node:18-alpine

# Metadatos del contenedor
LABEL maintainer="Ainsophic"
LABEL description="EGEO AI Waitlist Frontend - Vite + React"

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias (package.json y lock file)
COPY package.json package-lock.json ./

# Instalar dependencias con npm ci (reproducible, ignora package-lock.json)
# Usa caché de Docker layer si package.json no cambió
RUN npm ci --prefer-offline --no-audit --loglevel debug

# Copiar código fuente y archivos de configuración
COPY . .

# Compilar aplicación React con Vite
# Vite lee automáticamente .env.production y genera la carpeta dist/
# Incluye optimizaciones de producción (minificación, tree-shaking, etc.)
RUN npm run build

# Verificar que la compilación fue exitosa
RUN test -d dist || { echo "ERROR: Build folder not created"; exit 1; }

# Health check: Verifica que el servidor Node responda en puerto 3000
# Intervalo de 30s, timeout de 3s, reinicia si falla 3 veces consecutivas
RUN apk add --no-cache wget

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Documentar puerto de escucha (no expone automáticamente en host)
EXPOSE 3000

# Iniciar servidor: npm run preview sirve los archivos buildados en puerto 3000
# El modo preview es optimizado para producción (sin hot reload)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
