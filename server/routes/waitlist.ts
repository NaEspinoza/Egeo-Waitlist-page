import { Router } from 'express';
import { SupabaseService } from '../services/supabase';
import { EmailService } from '../services/email';
import { validateWaitlistRequest } from '../middleware/validate';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();
const rateLimiter = createRateLimiter();

interface ServicesCache {
  supabaseService: SupabaseService;
  emailService: EmailService;
}

let _cachedServices: ServicesCache | null = null;

const getServices = (): ServicesCache => {
  if (!_cachedServices) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
    
    console.log('=== INITIALIZANDO SERVICIOS ===');
    console.log(`SUPABASE_URL: "${supabaseUrl}"`);
    console.log(`SUPABASE_SERVICE_KEY: "${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'EMPTY'}"`);
    console.log(`EMAIL_FROM: "${process.env.EMAIL_FROM || ''}"`);
    console.log('================================');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY deben configurarse en .env');
    }
    
    _cachedServices = {
      supabaseService: new SupabaseService(supabaseUrl, supabaseKey),
      emailService: new EmailService(process.env.RESEND_API_KEY || '', process.env.EMAIL_FROM || 'welcome@egeo.ai')
    };
  }
  
  return _cachedServices;
};

router.post('/waitlist', rateLimiter, validateWaitlistRequest, async (req, res) => {
  try {
    const { name, email } = req.body;

    const { supabaseService, emailService } = getServices();

    const result = await supabaseService.addToWaitlist({ name, email });

    const emailResult = await emailService.sendWelcomeEmail(name, email);

    if (!emailResult.success && emailResult.error) {
      console.warn('Email sending failed but user was registered:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: 'Successfully added to waitlist',
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        subscribed_at: result.subscribed_at,
      },
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);

    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add to waitlist',
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add to waitlist',
        message: 'An unknown error occurred',
      });
    }
  }
});

export default router;
