import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { TopicsService } from './topics.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
@Controller('topics') @UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}
  @Get() async list(@CurrentUser() user: AuthenticatedUser, @Query('subject') subject?: string, @Query('difficulty') difficulty?: Difficulty, @Query('search') search?: string) { return { success: true, data: await this.topics.list(user.id, { subject, difficulty, search }) }; }
  @Post() async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTopicDto) { return { success: true, data: await this.topics.create(user.id, body) }; }
  @Get(':id') async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.topics.get(user.id, id) }; }
  @Patch(':id') async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateTopicDto) { return { success: true, data: await this.topics.update(user.id, id, body) }; }
  @Delete(':id') async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.topics.remove(user.id, id) }; }
}
