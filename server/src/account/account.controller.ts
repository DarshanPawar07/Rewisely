import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { AccountService } from './account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
class UpdateSettingsDto { @IsOptional() @IsString() timezone?: string; @IsOptional() @IsInt() @Min(1) @Max(365) defaultRevisionInterval?: number; @IsOptional() @IsBoolean() notificationEnabled?: boolean; @IsOptional() @IsBoolean() emailNotificationEnabled?: boolean; @IsOptional() @IsString() theme?: string; }
class UpdateNotificationReadDto { @IsOptional() @IsBoolean() isRead?: boolean; }
@Controller() @UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}
  @Get('profile') async profile(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.account.profile(user.id) }; }
  @Patch('profile') async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateProfileDto) { return { success: true, data: await this.account.updateProfile(user.id, body) }; }
  @Get('notifications') async notifications(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.account.notifications(user.id) }; }
  @Patch('notifications/read-all') async markAllNotificationsRead(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.account.markAllNotificationsRead(user.id) }; }
  @Patch('notifications/:id/read') async markNotificationRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateNotificationReadDto) { return { success: true, data: await this.account.markNotificationRead(user.id, id, body.isRead ?? true) }; }
  @Get('settings') async settings(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.account.settings(user.id) }; }
  @Patch('settings') async updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateSettingsDto) { return { success: true, data: await this.account.updateSettings(user.id, body) }; }
}
