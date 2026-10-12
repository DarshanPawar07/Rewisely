import { BadRequestException, ConflictException, ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createHmac, randomInt, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
export type JwtUser = { id: string; email: string; name: string };
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}
  private secret() { const secret = process.env.JWT_SECRET; if (!secret) throw new Error('JWT_SECRET is not configured'); return secret; }
  private publicUser(user: { id: string; name: string; email: string; emailVerified?: boolean; createdAt: Date; avatarUrl?: string | null }, verifiedFallback = false) { return { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified ?? verifiedFallback, avatarUrl: user.avatarUrl ?? null, createdAt: user.createdAt }; }
  private token(user: JwtUser) { return jwt.sign(user, this.secret(), { expiresIn: '7d' }); }

  private async ensureOtpSchema() {
    try {
      await this.prisma.$queryRaw`SELECT "emailVerified", "emailVerificationTokenHash", "emailVerificationExpiresAt", "emailVerificationSentAt", "emailVerificationAttempts", "emailLoginCodeHash", "emailLoginCodeExpiresAt", "emailLoginCodeSentAt", "emailLoginCodeAttempts" FROM "User" LIMIT 0`;
    } catch (error) {
      const detail = error instanceof Error ? `${error.message} ${(error as any).meta?.message || ''}` : String(error);
      if (/42703|column .* does not exist/i.test(detail)) {
        throw new ServiceUnavailableException('Email sign-in is not set up in the database yet. Stop the app, then run “npm run prisma:generate --workspace server” and “npm run prisma:migrate --workspace server”, then restart it. No account data was changed by this check.');
      }
      throw error;
    }
  }

  private codeHash(purpose: 'signup' | 'login', userId: string, code: string) {
    return createHmac('sha256', this.secret()).update(`${purpose}:${userId}:${code}`).digest('hex');
  }

  private async issueVerificationCode(user: { id: string; email: string; name: string }) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = this.codeHash('signup', user.id, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.$executeRaw`UPDATE "User" SET "emailVerified" = FALSE, "emailVerificationTokenHash" = ${codeHash}, "emailVerificationExpiresAt" = ${expiresAt}, "emailVerificationSentAt" = NOW(), "emailVerificationAttempts" = 0 WHERE id = ${user.id}`;
    return this.emailService.sendOtp(user.email, user.name, code, 'verification');
  }

  async register(name: string, email: string, password: string) {
    this.emailService.assertConfigured();
    await this.ensureOtpSchema();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.$queryRaw<Array<{ id: string; email: string; name: string; emailVerified: boolean; googleId: string | null; sentAt: Date | null }>>`SELECT id, email, name, "emailVerified", "googleId", "emailVerificationSentAt" AS "sentAt" FROM "User" WHERE email = ${normalizedEmail} LIMIT 1`;
    if (existing[0]) {
      const user = existing[0];
      if (!user.emailVerified && !user.googleId) {
        const retryAfter = (user.sentAt?.getTime() || 0) + 60_000 - Date.now();
        if (retryAfter <= 0) {
          const delivery = await this.issueVerificationCode(user);
          return { requiresEmailVerification: true, email: user.email, delivery };
        }
        return { requiresEmailVerification: true, email: user.email, delivery: 'email', retryAfterSeconds: Math.ceil(retryAfter / 1000) };
      }
      throw new ConflictException('An account with this email already exists. Sign in instead, or use “Email me a sign-in code”.');
    }
    const user = await this.prisma.user.create({ data: { name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), settings: { create: { timezone: 'UTC' } } } });
    const delivery = await this.issueVerificationCode(user);
    return { requiresEmailVerification: true, email: user.email, delivery };
  }

  async login(email: string, password: string) {
    await this.ensureOtpSchema();
    const user = await (this.prisma.user as any).findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    const verification = await this.prisma.$queryRaw<Array<{ emailVerified: boolean }>>`SELECT "emailVerified" FROM "User" WHERE id = ${user.id}`;
    if (!verification[0]?.emailVerified) throw new ForbiddenException('Please verify your email address before signing in.');
    return { user: this.publicUser(user, true), token: this.token(user) };
  }

  async verifyEmail(email: string, code: string) {
    await this.ensureOtpSchema();
    const normalizedEmail = email.trim().toLowerCase();
    const userRows = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM "User" WHERE email = ${normalizedEmail} AND "emailVerified" = FALSE LIMIT 1`;
    const userId = userRows[0]?.id;
    if (!userId) throw new BadRequestException('That code is invalid or expired. Request a new code and try again.');
    const codeHash = this.codeHash('signup', userId, code);
    const matches = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM "User" WHERE id = ${userId} AND "emailVerificationTokenHash" = ${codeHash} AND "emailVerificationExpiresAt" > NOW() AND "emailVerified" = FALSE AND "emailVerificationAttempts" < 5 LIMIT 1`;
    const user = matches[0];
    if (!user) {
      await this.prisma.$executeRaw`UPDATE "User" SET "emailVerificationAttempts" = "emailVerificationAttempts" + 1 WHERE id = ${userId} AND "emailVerified" = FALSE AND "emailVerificationExpiresAt" > NOW() AND "emailVerificationAttempts" < 5`;
      throw new BadRequestException('That code is invalid, expired, or locked after too many tries. Request a new code and try again.');
    }
    const updated = await this.prisma.$executeRaw`UPDATE "User" SET "emailVerified" = TRUE, "emailVerifiedAt" = NOW(), "emailVerificationTokenHash" = NULL, "emailVerificationExpiresAt" = NULL, "emailVerificationSentAt" = NULL, "emailVerificationAttempts" = 0 WHERE id = ${user.id} AND "emailVerificationTokenHash" = ${codeHash} AND "emailVerificationExpiresAt" > NOW() AND "emailVerified" = FALSE AND "emailVerificationAttempts" < 5`;
    if (updated !== 1) {
      await this.prisma.$executeRaw`UPDATE "User" SET "emailVerificationAttempts" = "emailVerificationAttempts" + 1 WHERE id = ${user.id} AND "emailVerified" = FALSE AND "emailVerificationExpiresAt" > NOW() AND "emailVerificationAttempts" < 5`;
      throw new BadRequestException('That code is invalid, expired, or locked after too many tries. Request a new code and try again.');
    }
    const verifiedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return { user: this.publicUser(verifiedUser, true), token: this.token(verifiedUser) };
  }

  async resendVerification(email: string) {
    await this.ensureOtpSchema();
    const normalizedEmail = email.trim().toLowerCase();
    this.emailService.assertConfigured();
    const matches = await this.prisma.$queryRaw<Array<{ id: string; email: string; name: string; emailVerified: boolean; googleId: string | null; sentAt: Date | null }>>`SELECT id, email, name, "emailVerified", "googleId", "emailVerificationSentAt" AS "sentAt" FROM "User" WHERE email = ${normalizedEmail} LIMIT 1`;
    const user = matches[0];
    if (!user || user.emailVerified || user.googleId) return;
    const retryAfter = (user.sentAt?.getTime() || 0) + 60_000 - Date.now();
    if (retryAfter > 0) return;
    await this.issueVerificationCode(user);
  }

  async requestLoginCode(email: string) {
    await this.ensureOtpSchema();
    const normalizedEmail = email.trim().toLowerCase();
    this.emailService.assertConfigured();
    const users = await this.prisma.$queryRaw<Array<{ id: string; email: string; name: string; emailVerified: boolean; googleId: string | null; sentAt: Date | null }>>`SELECT id, email, name, "emailVerified", "googleId", "emailLoginCodeSentAt" AS "sentAt" FROM "User" WHERE email = ${normalizedEmail} LIMIT 1`;
    const user = users[0];
    if (!user || !user.emailVerified) return;
    const retryAfter = (user.sentAt?.getTime() || 0) + 60_000 - Date.now();
    if (retryAfter > 0) return;
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const hash = this.codeHash('login', user.id, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.$executeRaw`UPDATE "User" SET "emailLoginCodeHash" = ${hash}, "emailLoginCodeExpiresAt" = ${expiresAt}, "emailLoginCodeSentAt" = NOW(), "emailLoginCodeAttempts" = 0 WHERE id = ${user.id}`;
    await this.emailService.sendOtp(user.email, user.name, code, 'login');
  }

  async loginWithCode(email: string, code: string) {
    await this.ensureOtpSchema();
    const normalizedEmail = email.trim().toLowerCase();
    const users = await this.prisma.$queryRaw<Array<{ id: string; email: string; name: string; emailVerified: boolean; createdAt: Date }>>`SELECT id, email, name, "emailVerified", "createdAt" FROM "User" WHERE email = ${normalizedEmail} LIMIT 1`;
    const user = users[0];
    if (!user || !user.emailVerified) throw new UnauthorizedException('The code is invalid or expired. Request a new one and try again.');
    const hash = this.codeHash('login', user.id, code);
    const used = await this.prisma.$executeRaw`UPDATE "User" SET "emailLoginCodeHash" = NULL, "emailLoginCodeExpiresAt" = NULL, "emailLoginCodeSentAt" = NULL, "emailLoginCodeAttempts" = 0 WHERE id = ${user.id} AND "emailLoginCodeHash" = ${hash} AND "emailLoginCodeExpiresAt" > NOW() AND "emailVerified" = TRUE AND "emailLoginCodeAttempts" < 5`;
    if (used !== 1) {
      await this.prisma.$executeRaw`UPDATE "User" SET "emailLoginCodeAttempts" = "emailLoginCodeAttempts" + 1 WHERE id = ${user.id} AND "emailLoginCodeExpiresAt" > NOW() AND "emailLoginCodeAttempts" < 5`;
      throw new UnauthorizedException('The code is invalid, expired, or locked after too many tries. Request a new one and try again.');
    }
    return { user: this.publicUser(user, true), token: this.token(user) };
  }
  async me(id: string) {
    await this.ensureOtpSchema();
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException();
    const verification = await this.prisma.$queryRaw<Array<{ emailVerified: boolean }>>`SELECT "emailVerified" FROM "User" WHERE id = ${id}`;
    return this.publicUser(user, verification[0]?.emailVerified ?? false);
  }
  verify(token: string): JwtUser { try { return jwt.verify(token, this.secret()) as JwtUser; } catch { throw new UnauthorizedException('Your session is invalid or has expired'); } }
  googleAuthorizationUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID, callback = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId || !callback) throw new BadRequestException('Google sign-in is not configured');
    const state = jwt.sign({ flow: 'google-oauth' }, this.secret(), { expiresIn: '10m' });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' }).toString();
  }
  async googleCallback(code: string, state: string) {
    await this.ensureOtpSchema();
    try { const value = jwt.verify(state, this.secret()) as { flow?: string }; if (value.flow !== 'google-oauth') throw new Error('Invalid state'); } catch { throw new UnauthorizedException('Google sign-in expired. Please try again.'); }
    const clientId = process.env.GOOGLE_CLIENT_ID, clientSecret = process.env.GOOGLE_CLIENT_SECRET, callback = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId || !clientSecret || !callback) throw new BadRequestException('Google sign-in is not configured');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callback, grant_type: 'authorization_code' }) });
    if (!tokenResponse.ok) throw new UnauthorizedException('Google could not authenticate this request');
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new UnauthorizedException('Google did not return an access token');
    const infoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!infoResponse.ok) throw new UnauthorizedException('Could not retrieve your Google profile');
    const info = await infoResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!info.sub || !info.email || !info.email_verified) throw new UnauthorizedException('A verified Google email is required');
    const email = info.email.toLowerCase();
    const users = this.prisma.user as any;
    let user = await users.findFirst({ where: { OR: [{ googleId: info.sub }, { email }] } });
    if (user) user = await users.update({ where: { id: user.id }, data: { googleId: info.sub, avatarUrl: info.picture ?? null, ...(user.name === email && info.name ? { name: info.name } : {}) } });
    else user = await users.create({ data: { name: info.name || email.split('@')[0], email, googleId: info.sub, avatarUrl: info.picture ?? null, passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12), settings: { create: { timezone: 'UTC' } } } });
    await this.prisma.$executeRaw`UPDATE "User" SET "emailVerified" = TRUE, "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()), "emailVerificationTokenHash" = NULL, "emailVerificationExpiresAt" = NULL, "emailVerificationSentAt" = NULL WHERE id = ${user.id}`;
    return { user: this.publicUser(user, true), token: this.token(user) };
  }
}
