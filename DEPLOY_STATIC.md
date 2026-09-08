# Deploy estático (Vite) a Nginx

Este documento resume cómo buildar el frontend y desplegar la carpeta `dist/` a un servidor Nginx que sirva la SPA.

1) Preparar variables de entorno para Vite

Crea `.env.production` (NO commitear con credenciales reales) basado en `.env.production.example` y agrega tu `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Ejemplo de `.env.production`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key_here
```

2) Buildar localmente

```bash
npm ci
npm run build
```

3) Subir `dist/` al servidor (ejemplo con `scp`)

```bash
scp -r dist/* usuario@tu-server:/var/www/egeo-waitlist/dist/
```

4) Configurar Nginx

Asegúrate de que el `root` en la configuración de Nginx apunte a la carpeta donde copiaste `dist/` (ej: `/var/www/egeo-waitlist/dist`). Si usas el `nginx.conf` incluido, actualiza la directiva `root`.

Ejemplo simplificado:

```
server {
  listen 80;
  server_name example.com;
  root /var/www/egeo-waitlist/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

5) Permisos y caching

- Asegúrate que el usuario de Nginx pueda leer los archivos (`chown -R www-data:www-data /var/www/egeo-waitlist/dist` o equivalente).
- Los assets versionados pueden cachearse largo plazo (ya configurado en `nginx.conf`).

6) Rollback

Mantén una copia anterior de `dist/` por si necesitas revertir rápidamente.

7) Script de despliegue

Puedes usar `deploy-dist.sh` incluido para automatizar build + scp (requiere `npm` y `ssh` configurado con clave o contraseña). Reemplaza variables de entorno `SERVER_USER`, `SERVER_HOST`, `SERVER_PATH` antes de ejecutar.
