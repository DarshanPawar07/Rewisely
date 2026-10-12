import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RevisionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { RevisionsService } from './revisions.service';
class CreateRevisionDto { @IsString() topicId!: string; @IsOptional() @IsDateString() scheduledAt?: string; @IsOptional() @IsDateString() studyAt?: string; @IsOptional() @IsInt() @Min(1) @Max(365) intervalDays?: number; @IsOptional() @IsString() notes?: string; }
class CompleteRevisionDto { @IsInt() @Min(1) @Max(5) confidence!: number; @IsOptional() @IsString() notes?: string; }
class RescheduleRevisionDto { @IsDateString() scheduledAt!: string; }
class UpdateRevisionDto { @IsOptional() @IsDateString() scheduledAt?: string; @IsOptional() @IsString() notes?: string; }
class CreateRevisionPlanDto { @IsString() topicName!: string; @IsOptional() @IsString() subjectId?: string; @IsDateString() completedStudyAt!: string; @IsDateString() firstRevisionAt!: string; @IsInt() @Min(1) @Max(100) revisionCount!: number; @IsInt() @Min(1) @Max(365) gapDays!: number; @IsOptional() reminderEnabled?: boolean; @IsOptional() @IsString() description?: string; }
@Controller('revisions') @UseGuards(JwtAuthGuard)
export class RevisionsController {
  constructor(private readonly revisions: RevisionsService) {}
  @Get() async list(@CurrentUser() user: AuthenticatedUser, @Query('topic') topic?: string, @Query('from') from?: string, @Query('to') to?: string, @Query('status') status?: RevisionStatus) { return { success: true, data: await this.revisions.list(user.id, { topic, from, to, status }) }; }
  @Post() async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateRevisionDto) { return { success: true, data: await this.revisions.create(user.id, body) }; }
  @Post('plan') async createPlan(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateRevisionPlanDto) { return { success: true, data: await this.revisions.createPlan(user.id, body) }; }
  @Get(':id') async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.revisions.get(user.id, id) }; }
  @Patch(':id/complete') async complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: CompleteRevisionDto) { return { success: true, data: await this.revisions.complete(user.id, id, body.confidence, body.notes) }; }
  @Patch(':id/reschedule') async reschedule(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: RescheduleRevisionDto) { return { success: true, data: await this.revisions.reschedule(user.id, id, body.scheduledAt) }; }
  @Patch(':id') async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateRevisionDto) { return { success: true, data: await this.revisions.update(user.id, id, body) }; }
  @Delete(':id') async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.revisions.remove(user.id, id) }; }
}
