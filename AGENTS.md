# AGENTS.md - Egeo AI Waitlist

## 📋 Project Overview

**Egeo AI Waitlist** is a full-stack TypeScript application with:

- **Frontend**: React 18 + Vite 5 (SPA with animated landing page)
- **Backend**: Express 5 with TypeScript (REST API)
- **Database**: Supabase PostgreSQL
- **Email Service**: Resend for welcome emails
- **Validation**: Zod schema validation
- **Rate Limiting**: 5 requests/IP/hour

**Architecture**: Clean separation of concerns with services, middleware, and routes.

---

## 🚀 Quick Start Commands

### Development

```bash
# Install dependencies
npm install

# Start frontend (Vite dev server on http://localhost:5173)
npm run dev

# Start backend (Express server on http://localhost:5000)
npm run server

# Start backend with watch mode (auto-restart on file changes)
npm run server:dev
```

### Testing & Quality

```bash
# Type checking (ensures TypeScript types are correct)
npm run typecheck

# Linting (ensures code style consistency)
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Test Individual Files

```bash
# Typecheck specific file (using tsc with specific paths)
npx tsc --noEmit server/services/supabase.ts
npx tsc --noEmit server/routes/waitlist.ts
npx tsc --noEmit src/App.tsx

# Lint specific file
npx eslint server/services/supabase.ts
npx eslint server/routes/waitlist.ts
npx eslint src/App.tsx
```

---

## 📐 Code Style Guidelines

### Import/Export Conventions

**ES6 Imports** (use named imports, not default exports for services):
```typescript
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export class SupabaseService { }
```

**Avoid mixed imports**:
```typescript
// ❌ DON'T: Mix named and default exports
import express, { Router } from 'express';

// ✅ DO: Use consistent style
import express from 'express';
import { Router } from 'express';
```

### Naming Conventions

**Variables and Functions**: `camelCase`
```typescript
const supabaseUrl = process.env.SUPABASE_URL || '';
const sendWelcomeEmail = async (name: string) => { };
```

**Classes and Interfaces**: `PascalCase`
```typescript
export class SupabaseService { }
export interface WaitlistResponse { }
```

**Constants**: `UPPER_SNAKE_CASE`
```typescript
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const PORT = process.env.PORT || 5000;
```

### File Organization

**Backend Structure**:
```
server/
├── server.ts              # Express app setup, middleware configuration
├── routes/
│   └── waitlist.ts       # Route handlers
├── services/
│   ├── supabase.ts        # Database operations
│   └── email.ts            # Email service
└── middleware/
    ├── validate.ts         # Zod validation middleware
    └── rateLimit.ts        # Rate limiting middleware
```

**Frontend Structure**:
```
src/
├── App.tsx              # Main component
└── main.tsx             # Entry point
```

### Error Handling

**Always use try-catch blocks** for async operations:
```typescript
router.post('/waitlist', rateLimiter, validateWaitlistRequest, async (req, res) => {
  try {
    const result = await supabaseService.addToWaitlist({ name, email });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add to waitlist',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});
```

**Consistent error response format**:
```typescript
// Success response
{
  success: true,
  message: 'Successfully added to waitlist',
  data: { id, name, email, subscribed_at }
}

// Error response
{
  success: false,
  error: 'Failed to add to waitlist',
  message: 'Error description here',
  timestamp: '2025-01-21T...'
}
```

### Logging

**Use structured logging with timestamps**:
```typescript
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
console.error('Error details:', error);
```

**Log levels**:
- `console.log()` - Normal operation logging
- `console.warn()` - Non-critical issues (email failed but user registered)
- `console.error()` - Errors and critical issues

### Type Safety

**Always define interfaces** for complex objects:
```typescript
interface WaitlistRequest {
  name: string;
  email: string;
}

interface WaitlistResponse {
  id: string;
  name: string;
  email: string;
  subscribed_at: string;
}
```

**Use generics properly**:
```typescript
export class SupabaseService {
  async addToWaitlist(data: { name: string; email: string }): Promise<WaitlistResponse> { }
}
```

### Middleware Order

**Express middleware must be applied in this order**:
```typescript
app.use(cors(...));              // 1. CORS - First!
app.use(express.json());          // 2. JSON parsing
app.use(express.urlencoded(...));  // 3. URL encoding
app.use(loggingMiddleware);     // 4. Request logging (custom)
app.use('/api', waitlistRouter);    // 5. API routes
app.get('/health', ...);         // 6. Health check
app.get('/', ...);               // 7. Root endpoint
app.use(errorHandler);           // 8. Error handling (MUST have 4 params)
app.use(notFoundHandler);         // 9. 404 handler (MUST have 3 params)
```

**Critical**: Error handler MUST have 4 parameters `(err, req, res, next)` and 404 handler MUST have 3 parameters `(req, res)`.

### Environment Variables

**Required variables** in `.env`:
```bash
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=welcome@egeo.ai
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Environment variable loading**:
- Use `dotenv.config()` once at entry point (server/server.ts)
- Never call `dotenv.config()` in imported modules (routes/waitlist.ts)
- Cache service instances to avoid re-initialization

### Services Pattern

**Lazy service initialization** to avoid timing issues:
```typescript
interface ServicesCache {
  supabaseService: SupabaseService;
  emailService: EmailService;
}

let _cachedServices: ServicesCache | null = null;

const getServices = (): ServicesCache => {
  if (!_cachedServices) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
    _cachedServices = {
      supabaseService: new SupabaseService(supabaseUrl, supabaseKey),
      emailService: new EmailService(process.env.RESEND_API_KEY || '', process.env.EMAIL_FROM || 'welcome@egeo.ai')
    };
  }
  return _cachedServices;
};
```

### React Component Patterns

**Functional components with hooks**:
```typescript
const Component = () => {
  const [state, setState] = useState({ value: '' });
  
  return <div>{state.value}</div>;
};
```

**Event handlers**:
```typescript
const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  setIsSubmitting(true);
  // ... async logic
  setIsSubmitting(false);
};
```

### API Response Codes

**Use appropriate HTTP status codes**:
- `200` - GET requests (successful retrieval)
- `201` - POST requests (successful creation)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🗂️ File Structure & Conventions

### Backend Files

**server/server.ts** - Main Express application
- Imports all necessary packages
- Configures middleware
- Defines all routes
- Implements graceful shutdown (SIGTERM, SIGINT)

**server/routes/waitlist.ts** - API routes
- POST /api/waitlist - Add user to waitlist
- Includes rate limiting and validation middleware
- Uses SupabaseService and EmailService

**server/services/supabase.ts** - Database service
- `SupabaseService` class with `addToWaitlist()` method
- Uses `@supabase/supabase-js` SDK
- Handles connection and query errors

**server/services/email.ts** - Email service
- `EmailService` class with `sendWelcomeEmail()` method
- Uses `resend` SDK
- Gracefully handles missing API key

**server/middleware/validate.ts** - Validation middleware
- Uses Zod schema validation
- Returns 400 on validation failure

**server/middleware/rateLimit.ts** - Rate limiting
- Express rate-limit configuration
- 5 requests per IP per hour

### Frontend Files

**src/App.tsx** - Main React component
- Canvas 2D animation
- Countdown timer
- Waitlist form with validation
- Status feedback UI
- Uses fetch to call backend API

**src/main.tsx** - Application entry point
- Renders App component to DOM

---

## 🧪 Testing Guidelines

### Before Committing

1. **Run typecheck** - ensures no TypeScript errors
2. **Run lint** - ensures no style violations
3. **Test critical paths manually** - verify endpoints work

### Manual Testing

**Test backend endpoints**:
```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/

# Add to waitlist
curl -X POST http://localhost:5000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

**Test frontend**:
```bash
# Start frontend and verify form submits to backend
npm run dev
```

### Common Issues & Solutions

**Issue**: `res.status is not a function`
- Cause: Wrong middleware order or incorrect error handler parameters
- Fix: Ensure error handler has 4 params `(err, req, res, next)`

**Issue**: `supabaseUrl is required`
- Cause: Environment variables not loaded
- Fix: Check `.env` file exists and contains required variables

**Issue**: Rate limiting blocks legitimate requests
- Cause: Exceeded 5 requests/IP/hour
- Fix: Wait 1 hour or clear rate limiter cache

---

## 🔧 Development Workflow

### Adding New Features

1. **Update services** - Add method to service class
2. **Update routes** - Create new route or modify existing
3. **Add middleware** if validation/rate limiting needed
4. **Update types** if new interfaces required
5. **Test** - Verify new functionality works
6. **Lint & typecheck** - Ensure code quality
7. **Commit** with descriptive message

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] No `any` types without justification
- [ ] Error handling is comprehensive
- [ ] Logging is present and useful
- [ ] Code follows established patterns
- [ ] Environment variables are documented
- [ ] Rate limiting is appropriate
- [ ] CORS is configured correctly
- [ ] Services are properly initialized
- [ ] API responses are consistent

---

## 📚 Important Notes

1. **Supabase Setup Required**: 
   - Project must be created in Supabase dashboard
   - `waitlist` table must exist with columns: id (uuid), name (text), email (text), subscribed_at (timestamptz)
   - Row Level Security policies must allow inserts

2. **Resend Setup Required**:
   - Domain must be verified in Resend dashboard
   - Sender email must match verified domain

3. **Port Conflicts**: 
   - Frontend uses port 5173
   - Backend uses port 5000
   - No conflicts expected

4. **Production Deployment**:
   - Set `NODE_ENV=production` in deployment environment
   - Configure production Supabase URL (not development URL)
   - Set production FRONTEND_URL
   - Use `npm run build` and deploy dist/ folder

---

## 🎯 Best Practices Summary

✅ **Type Safety**: Always use TypeScript, no implicit any
✅ **Error Handling**: Try-catch all async operations, return consistent error format
✅ **Logging**: Use structured logging with timestamps, differentiate log/warn/error
✅ **Validation**: Validate inputs early, fail fast with clear error messages
✅ **Security**: Never expose secrets in logs, use environment variables
✅ **Rate Limiting**: Protect against abuse, provide clear error messages
✅ **Code Organization**: Separate concerns (services, middleware, routes)
✅ **Consistent Naming**: camelCase for variables/functions, PascalCase for classes
✅ **Middleware Order**: CORS → JSON → URL encoding → Logging → Routes → Error handlers
✅ **Graceful Shutdown**: Handle SIGTERM/SIGINT, close connections before exit

---

*Last Updated: 2025-01-21*
