import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Priority, Recurrence, TaskCategory } from '@prisma/client';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { TasksService } from './tasks.service';
import { CompleteTaskDto, CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
@Controller('tasks') @UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}
  @Get() async list(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string, @Query('completed') completed?: string, @Query('priority') priority?: Priority, @Query('category') category?: TaskCategory) { return { success: true, data: await this.tasks.list(user.id, { from, to, completed: completed === undefined ? undefined : completed === 'true', priority, category }) }; }
  @Post() async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTaskDto) { return { success: true, data: await this.tasks.create(user.id, body) }; }
  @Get(':id') async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.tasks.get(user.id, id) }; }
  @Patch(':id') async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateTaskDto) { return { success: true, data: await this.tasks.update(user.id, id, body) }; }
  @Patch(':id/complete') async complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: CompleteTaskDto) { return { success: true, data: await this.tasks.complete(user.id, id, body.completed) }; }
  @Delete(':id') async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.tasks.remove(user.id, id) }; }
}
