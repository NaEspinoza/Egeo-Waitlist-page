# Backend Architecture

## Overview

El backend de EGEO Waitlist es una API RESTful construida con Express.js y TypeScript que actúa como intermediario entre el frontend de React y PocketBase.

## Flujo de Arquitectura

```
Frontend (React) → Express API (localhost:5000) → PocketBase (pocketbase.ainsophic.com)
```

## Componentes

### 1. Server (server/server.ts)
- Punto de entrada de la aplicación
- Configura middleware global (CORS, JSON, logging)
- Define rutas de la API
- Maneja errores globales
- Escucha en el puerto configurado (default: 5000)

### 2. Routes (server/routes/waitlist.ts)
- Define el endpoint POST /api/waitlist
- Aplica middleware de validación
- Maneja lógica de negocio para agregar usuarios a la waitlist
- Retorna respuestas HTTP apropiadas

### 3. Middleware (server/middleware/validate.ts)
- Valida los datos de entrada usando Zod
- Verifica formato de email y longitud del nombre
- Retorna errores de validación HTTP 400

### 4. Service (server/services/pocketbase.ts)
- Encapsula la lógica de comunicación con PocketBase
- Maneja autenticación de administrador cuando es necesario
- Retries con autenticación en caso de error 403
- Proporciona una interfaz limpia para el resto del backend

### 5. Types (server/types/index.d.ts)
- Define interfaces TypeScript para toda la aplicación
- Asegura type safety en todo el backend
- Documenta la estructura de datos esperada

## Características Principales

### Type Safety
- Todo el backend usa TypeScript
- Interfaces definidas en `types/index.d.ts`
- Validación de tipos en compile-time

### Validación Robusta
- Zod para validación de esquemas
- Validación a nivel de middleware
- Mensajes de error claros y descriptivos

### Manejo de Errores
- Try-catch en todos los endpoints
- Error handling global
- Logging de errores en consola
- Mensajes de error específicos

### Seguridad
- CORS configurado para permitir requests del frontend
- Variables de entorno para credenciales sensibles
- Autenticación opcional con PocketBase

### Logging
- Logging automático de todas las peticiones
- Timestamps ISO en logs
- Detalle de método y path

## Patrones de Diseño Utilizados

### Service Layer Pattern
- La lógica de comunicación con PocketBase está encapsulada en una clase de servicio
- Permite fácil testing y reutilización
- Separa responsabilidades claramente

### Middleware Pattern
- Validación implementada como middleware Express
- Reutilizable en múltiples rutas
- Separa lógica de validación de lógica de negocio

### Error Handling Centralizado
- Handler global de errores en server.ts
- Respuestas consistentes de error
- Fácil de mantener y extender

## Consideraciones de Producción

### Variables de Entorno
Todas las configuraciones sensibles deben estar en variables de entorno:
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`
- `POCKETBASE_URL`
- `POCKETBASE_COLLECTION`

### CORS
El frontend URL debe configurarse correctamente en `FRONTEND_URL` para producción.

### Rate Limiting
Considerar agregar rate limiting en producción para prevenir abuso.

### Health Monitoring
El endpoint `/health` permite monitorear el estado del servidor.

## Escalabilidad

El backend está diseñado para ser fácilmente escalable:

1. **Agregar nuevas rutas**: Crear archivos en `routes/` y montar en `server.ts`
2. **Agregar nuevos servicios**: Crear servicios en `services/`
3. **Agregar middleware**: Crear middleware en `middleware/`
4. **Agregar tipos**: Definir en `types/index.d.ts`

## Testing

Para probar el backend:

```bash
# Iniciar el servidor
npm run server

# Probar el endpoint
curl -X POST http://localhost:5000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

## Documentación de PocketBase

El backend se conecta a PocketBase usando su API REST. Para más información:
- PocketBase REST API: https://pocketbase.io/docs/api-overview/
- Collection Records: https://pocketbase.io/docs/api-overview/#records

## Logs

Los logs incluyen:
- Timestamp ISO
- Método HTTP
- Path solicitado
- Errores con stack traces

Ejemplo de log:
```
[2024-01-14T19:21:42.401Z] POST /api/waitlist
Error adding to waitlist: Error: Only admins can perform this action.
```
