import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import waitlistRouter from './routes/waitlist';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api', waitlistRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Egeo Waitlist API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Egeo Waitlist API',
    version: '1.0.0',
    description: 'API para la lista de espera de Egeo.ai - Inteligencia Artificial Argentina',
    endpoints: {
      health: 'GET /health - Verificar estado del API',
      waitlist: 'POST /api/waitlist - Agregar email a la lista de espera'
    },
    documentation: 'https://github.com/ainsophic/egeo-waitlist',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `La ruta ${req.method} ${req.path} no existe`,
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error('=== UNHANDLED ERROR ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('URL:', req.url);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('================================');

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
});

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════╗');
  console.log('║       🚀 EGEO WAITLIST API INICIADA              ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log('║ CONFIGURACIÓN:                                    ║');
  console.log(`║   Puerto: ${PORT}                                  ║`);
  console.log(`║   Frontend: ${FRONTEND_URL}                           ║`);
  console.log(`║   Supabase: ${process.env.SUPABASE_URL ? '✓ Configurada' : '✗ NO CONFIGURADA'}      ║`);
  console.log(`║   Email Service: ${process.env.RESEND_API_KEY ? '✓ Configurada' : '✗ NO CONFIGURADA'}   ║`);
  console.log(`║   Ambiente: ${process.env.NODE_ENV || 'development'}                  ║`);
  console.log('╠═══════════════════════════════════════╣');
  console.log('║ ENDPOINTS:                                       ║');
  console.log('║   GET  /health      - Verificar estado del API     ║');
  console.log('║   GET  /            - Información del API             ║');
  console.log('║   POST /api/waitlist- Agregar a lista de espera       ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Servidor listo para recibir solicitudes');
  console.log('');
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}
