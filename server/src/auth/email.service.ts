import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  assertConfigured() {
    const user = process.env.GMAIL_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD;
    if ((user && !appPassword) || (!user && appPassword)) {
      throw new ServiceUnavailableException('Gmail email delivery needs both GMAIL_USER and GMAIL_APP_PASSWORD configured.');
    }
    if (!user && process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('Email delivery is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to the server environment.');
    }
  }

  async sendOtp(email: string, name: string, code: string, purpose: 'verification' | 'login' | 'password-reset'): Promise<'email' | 'console'> {
    const user = process.env.GMAIL_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD;
    if (!user || !appPassword) {
      this.assertConfigured();
      this.logger.warn(`Email delivery is in development mode. ${purpose === 'verification' ? 'Signup verification' : purpose === 'password-reset' ? 'Password reset' : 'Login'} code for ${email}: ${code}`);
      return 'console';
    }

    const safeName = name.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
    const verification = purpose === 'verification';
    const passwordReset = purpose === 'password-reset';
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass: appPassword.replace(/\s+/g, '') },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || { name: 'Rewisely', address: user },
        to: email,
        subject: verification ? 'Your Rewisely verification code' : passwordReset ? 'Reset your Rewisely password' : 'Your Rewisely sign-in code',
        text: `Hi ${name},\n\nYour ${verification ? 'signup verification' : passwordReset ? 'password reset' : 'sign-in'} code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#22213a"><div style="padding:28px;border-radius:18px;background:#f5f3ff"><p style="color:#6a5cf5;font-size:13px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase">Rewisely</p><h1 style="font-size:24px">${verification ? 'Verify your email' : passwordReset ? 'Reset your password' : 'Sign in to Rewisely'}</h1><p>Hi ${safeName}, use this one-time code to ${verification ? 'activate your account' : passwordReset ? 'reset your password' : 'sign in'}:</p><p style="margin:28px 0;padding:16px;border-radius:12px;background:#fff;text-align:center;font-size:32px;font-weight:bold;letter-spacing:.28em;color:#5b45d6">${code}</p><p style="font-size:13px;color:#67657a">This code expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.</p></div></div>`,
      });
      return 'email';
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Gmail SMTP delivery failed: ${detail}`);
      throw new ServiceUnavailableException('We could not send the email code. Check the Gmail App Password and try again.');
    } finally { transporter.close(); }
  }
}
