# EGEO Waitlist Backend

Backend Express.js para la landing page de espera de EGEO AI.

## Estructura del Proyecto

```
server/
├── middleware/
│   └── validate.ts          # Middleware de validación con Zod
├── services/
│   └── pocketbase.ts        # Servicio de comunicación con PocketBase
├── routes/
│   └── waitlist.ts          # Rutas de la API
├── types/
│   └── index.d.ts           # Definiciones TypeScript
└── server.ts                # Punto de entrada del servidor
```

## Configuración

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Configura las variables de entorno en `.env`:
```
PORT=5000
POCKETBASE_URL=http://pocketbase.ainsophic.com
POCKETBASE_COLLECTION=waitlist
POCKETBASE_ADMIN_EMAIL=tu_email_admin@dominio.com
POCKETBASE_ADMIN_PASSWORD=tu_password_admin
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Instalación

```bash
npm install
```

## Uso

### Desarrollo

Para ejecutar el servidor con hot reload:
```bash
npm run server:dev
```

### Producción

Para ejecutar el servidor en modo producción:
```bash
npm run server
```

## API Endpoints

### POST /api/waitlist

Agrega un nuevo usuario a la lista de espera.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Successfully added to waitlist",
  "data": {
    "id": "record_id",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "subscribed_at": "2024-01-14T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "message": "Email is required"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to add to waitlist",
  "message": "Detailed error message"
}
```

### GET /health

Endpoint de healthcheck.

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Validaciones

El endpoint `/api/waitlist` valida los datos de entrada usando Zod:

- **name**: Mínimo 2 caracteres, obligatorio
- **email**: Formato de email válido, obligatorio

## Notas de Seguridad

- Las credenciales de administrador de PocketBase deben configurarse en variables de entorno, no en el código
- El servidor usa CORS para proteger contra peticiones de orígenes no autorizados
- La autenticación con PocketBase se realiza automáticamente cuando la colección requiere permisos de administrador
- Nunca commits el archivo `.env` al repositorio
