import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { WeeklyTargetsService } from './weekly-targets.service';
import { AddWeeklyTargetTaskDto, CompleteWeeklyTargetTaskDto, CreateWeeklyTargetDto, UpdateWeeklyTargetDto } from './dto/weekly-target.dto';
@Controller('weekly-targets') @UseGuards(JwtAuthGuard)
export class WeeklyTargetsController {
  constructor(private readonly targets: WeeklyTargetsService) {}
  @Get() async list(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.targets.list(user.id) }; }
  @Post() async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateWeeklyTargetDto) { return { success: true, data: await this.targets.create(user.id, body) }; }
  @Get(':id') async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.targets.get(user.id, id) }; }
  @Patch(':id') async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateWeeklyTargetDto) { return { success: true, data: await this.targets.update(user.id, id, body) }; }
  @Delete(':id') async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.targets.remove(user.id, id) }; }
  @Post(':id/tasks') async addTask(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: AddWeeklyTargetTaskDto) { return { success: true, data: await this.targets.addTask(user.id, id, body.title) }; }
  @Patch(':id/tasks/:taskId') async complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('taskId') taskId: string, @Body() body: CompleteWeeklyTargetTaskDto) { return { success: true, data: await this.targets.completeTask(user.id, id, taskId, body.completed) }; }
}
