import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { CreateStudyChapterDto, CreateStudySubjectDto, SaveStudyStepsDto, UpdateChapterStepDto, UpdateStudyChapterDto } from './dto/track-study.dto';
import { StudyService } from './track-study.service';

@Controller('study')
@UseGuards(JwtAuthGuard)
export class StudyController {
  constructor(private readonly study: StudyService) {}

  @Get() async list(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.study.list(user.id) }; }
  @Post('subjects') async createSubject(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateStudySubjectDto) { return { success: true, data: await this.study.createSubject(user.id, body) }; }
  @Get('subjects/:subjectId') async subject(@CurrentUser() user: AuthenticatedUser, @Param('subjectId') subjectId: string) { return { success: true, data: await this.study.getSubject(user.id, subjectId) }; }
  @Get('chapters/:chapterId') async chapter(@CurrentUser() user: AuthenticatedUser, @Param('chapterId') chapterId: string) { return { success: true, data: await this.study.getChapterView(user.id, chapterId) }; }
  @Put('subjects/:subjectId/steps') async saveSteps(@CurrentUser() user: AuthenticatedUser, @Param('subjectId') subjectId: string, @Body() body: SaveStudyStepsDto) { return { success: true, data: await this.study.saveSteps(user.id, subjectId, body) }; }
  @Post('subjects/:subjectId/chapters') async createChapter(@CurrentUser() user: AuthenticatedUser, @Param('subjectId') subjectId: string, @Body() body: CreateStudyChapterDto) { return { success: true, data: await this.study.createChapter(user.id, subjectId, body) }; }
  @Patch('chapters/:chapterId') async updateChapter(@CurrentUser() user: AuthenticatedUser, @Param('chapterId') chapterId: string, @Body() body: UpdateStudyChapterDto) { return { success: true, data: await this.study.updateChapter(user.id, chapterId, body) }; }
  @Delete('chapters/:chapterId') async deleteChapter(@CurrentUser() user: AuthenticatedUser, @Param('chapterId') chapterId: string) { return { success: true, data: await this.study.deleteChapter(user.id, chapterId) }; }
  @Patch('chapters/:chapterId/steps/:stepId') async updateStep(@CurrentUser() user: AuthenticatedUser, @Param('chapterId') chapterId: string, @Param('stepId') stepId: string, @Body() body: UpdateChapterStepDto) { return { success: true, data: await this.study.updateChapterStep(user.id, chapterId, stepId, body) }; }
}
