import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const waitlistSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

export const validateWaitlistRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    waitlistSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
      });
    }
  }
};
