import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { AnalyticsService } from './analytics.service';
@Controller('analytics') @UseGuards(JwtAuthGuard)
export class AnalyticsController { constructor(private readonly analytics: AnalyticsService) {} @Get() async get(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.analytics.get(user.id) }; } }
