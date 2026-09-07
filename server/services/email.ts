import { Resend } from 'resend';

export class EmailService {
  private resend: Resend | null;
  private fromEmail: string;
  private apiKey: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log('EmailService initialized with Resend API key');
    } else {
      this.resend = null;
      console.warn('EmailService initialized without API key. Email sending will be skipped.');
    }
  }

  async sendWelcomeEmail(name: string, email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.resend || !this.apiKey) {
      console.log('Email service not configured. Skipping email send to:', email);
      return { success: true };
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: '¡Bienvenido a la lista de espera de Egeo.ai!',
        text: `Hola ${name},

Gracias por tu interés en Egeo.ai. Estamos emocionados de tenerte en nuestra lista de espera.

Egeo es una inteligencia artificial argentina diseñada para adaptarse a tu estilo de pensamiento, entender verdaderamente tus necesidades y razonar con coherencia.

Próximamente recibirás acceso exclusivo a nuestra demo técnica.

Puedes acceder a la demo aquí: https://demo.egeo.ai

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
El equipo de Egeo.ai
https://egeo.ai`,
      });

      console.log('Email sent successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);

      if (error instanceof Error) {
        return { success: false, error: error.message };
      }

      return { success: false, error: 'Unknown error occurred' };
    }
  }
}
