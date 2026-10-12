import { Body, Controller, Get, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
class RegisterDto { @IsString() @MinLength(1) name!: string; @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(1) password!: string; }
class VerifyEmailDto { @IsEmail() email!: string; @IsString() @Matches(/^\d{6}$/) code!: string; }
class ResendVerificationDto { @IsEmail() email!: string; }
class LoginCodeDto { @IsEmail() email!: string; }
class VerifyLoginCodeDto { @IsEmail() email!: string; @IsString() @Matches(/^\d{6}$/) code!: string; }
class RequestPasswordResetDto { @IsEmail() email!: string; }
class ResetPasswordDto { @IsEmail() email!: string; @IsString() @Matches(/^\d{6}$/) code!: string; @IsString() @MinLength(8) @MaxLength(128) password!: string; }
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') async register(@Body() body: RegisterDto) { return { success: true, data: await this.auth.register(body.name, body.email, body.password) }; }
  @Post('login') async login(@Body() body: LoginDto) { return { success: true, data: await this.auth.login(body.email, body.password) }; }
  @Post('verify-email') async verifyEmail(@Body() body: VerifyEmailDto) { return { success: true, data: await this.auth.verifyEmail(body.email, body.code) }; }
  @Post('resend-verification') async resendVerification(@Body() body: ResendVerificationDto) { await this.auth.resendVerification(body.email); return { success: true, data: { message: 'If this address needs verification, a new email will be sent shortly.' } }; }
  @Post('login-code') async loginCode(@Body() body: LoginCodeDto) { await this.auth.requestLoginCode(body.email); return { success: true, data: { message: 'If an eligible account exists, a sign-in code will be sent shortly.' } }; }
  @Post('login-code/verify') async verifyLoginCode(@Body() body: VerifyLoginCodeDto) { return { success: true, data: await this.auth.loginWithCode(body.email, body.code) }; }
  @Post('password-reset/request') async requestPasswordReset(@Body() body: RequestPasswordResetDto) { await this.auth.requestPasswordReset(body.email); return { success: true, data: { message: 'If an eligible account exists, a password reset code will be sent shortly.' } }; }
  @Post('password-reset/confirm') async resetPassword(@Body() body: ResetPasswordDto) { await this.auth.resetPassword(body.email, body.code, body.password); return { success: true, data: { message: 'Password updated. You can now sign in.' } }; }
  @Get('google') @Redirect() google() { return { url: this.auth.googleAuthorizationUrl() }; }
  @Get('google/callback') @Redirect() async googleCallback(@Query('code') code?: string, @Query('state') state?: string) { if (!code || !state) return { url: `${process.env.CLIENT_URL}/?oauth_error=missing_google_response` }; try { const result = await this.auth.googleCallback(code, state); return { url: `${process.env.CLIENT_URL}/?oauth_token=${encodeURIComponent(result.token)}` }; } catch { return { url: `${process.env.CLIENT_URL}/?oauth_error=google_sign_in_failed` }; } }
  @Get('me') @UseGuards(JwtAuthGuard) async me(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.auth.me(user.id) }; }
}
