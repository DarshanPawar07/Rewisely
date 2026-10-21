import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private isTransientSmtpFailure(error: unknown) {
    const smtpError = error as NodeJS.ErrnoException & { responseCode?: number };
    return ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNRESET', 'EPIPE', 'EHOSTUNREACH'].includes(smtpError?.code || '')
      || [421, 450, 451, 452].includes(smtpError?.responseCode || 0);
  }

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
    const message = {
      from: process.env.EMAIL_FROM || { name: 'Rewisely', address: user },
      to: email,
      subject: verification ? 'Your Rewisely verification code' : passwordReset ? 'Reset your Rewisely password' : 'Your Rewisely sign-in code',
      text: `Hi ${name},\n\nYour ${verification ? 'signup verification' : passwordReset ? 'password reset' : 'sign-in'} code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#22213a"><div style="padding:28px;border-radius:18px;background:#f5f3ff"><p style="color:#6a5cf5;font-size:13px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase">Rewisely</p><h1 style="font-size:24px">${verification ? 'Verify your email' : passwordReset ? 'Reset your password' : 'Sign in to Rewisely'}</h1><p>Hi ${safeName}, use this one-time code to ${verification ? 'activate your account' : passwordReset ? 'reset your password' : 'sign in'}:</p><p style="margin:28px 0;padding:16px;border-radius:12px;background:#fff;text-align:center;font-size:32px;font-weight:bold;letter-spacing:.28em;color:#5b45d6">${code}</p><p style="font-size:13px;color:#67657a">This code expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.</p></div></div>`,
    };

    // Render instances can briefly lose outbound SMTP connectivity after waking.
    // Retry a fresh connection once for transient transport/provider failures only.
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass: appPassword.replace(/\s+/g, '') },
        connectionTimeout: 8_000,
        greetingTimeout: 8_000,
        socketTimeout: 12_000,
      });
      try {
        const result = await transporter.sendMail(message);
        this.logger.log(`Gmail accepted ${purpose} email for ${email} (message ${result.messageId})`);
        return 'email';
      } catch (error) {
        const smtpError = error as NodeJS.ErrnoException & { responseCode?: number };
        const detail = error instanceof Error ? error.message : 'Unknown SMTP error';
        const willRetry = attempt === 1 && this.isTransientSmtpFailure(error);
        this.logger.error(`Gmail SMTP delivery attempt ${attempt}/2 failed for ${purpose} (${smtpError.code || smtpError.responseCode || 'unknown'}): ${detail}`);
        if (willRetry) {
          await new Promise(resolve => setTimeout(resolve, 750));
          continue;
        }
        if (smtpError.code === 'EAUTH' || smtpError.responseCode === 535 || smtpError.responseCode === 534) {
          throw new ServiceUnavailableException('Gmail rejected the SMTP login. Check that GMAIL_USER and its 16-character Gmail App Password belong to the same account.');
        }
        if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNRESET', 'EPIPE', 'ECONNREFUSED', 'EHOSTUNREACH'].includes(smtpError.code || '') || [421, 450, 451, 452].includes(smtpError.responseCode || 0)) {
          throw new ServiceUnavailableException('Gmail SMTP is temporarily unavailable. Please retry in a moment.');
        }
        throw new ServiceUnavailableException('Email delivery failed. Check the email configuration and the server logs for the SMTP error.');
      } finally {
        transporter.close();
      }
    }
    throw new ServiceUnavailableException('Gmail SMTP is temporarily unavailable. Please retry in a moment.');
  }
}
