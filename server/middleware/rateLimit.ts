import rateLimit from 'express-rate-limit';

export const createRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 5, 
    message: {
      success: false,
      error: 'Too many requests',
      message: 'Has excedido el límite de solicitudes. Por favor espera 1 hora antes de intentar nuevamente.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const userAgent = req.headers['user-agent'];
      if (!userAgent) {
        return true;
      }
      return false;
    },
  });
};
