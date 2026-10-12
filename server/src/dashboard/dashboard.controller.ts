import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { DashboardService } from './dashboard.service';
@Controller() @UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('dashboard') async getDashboard(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.dashboard.dashboard(user.id) }; }
  @Get('calendar') async getCalendar(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) { if (!from || !to || Number.isNaN(new Date(from).getTime()) || Number.isNaN(new Date(to).getTime())) throw new BadRequestException('Valid from and to dates are required'); return { success: true, data: await this.dashboard.calendar(user.id, from, to) }; }
}
