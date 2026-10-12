import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../common/auth';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
@Controller('subjects') @UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}
  @Get() async list(@CurrentUser() user: AuthenticatedUser) { return { success: true, data: await this.subjects.list(user.id) }; }
  @Post() async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateSubjectDto) { return { success: true, data: await this.subjects.create(user.id, body) }; }
  @Get(':id') async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.subjects.get(user.id, id) }; }
  @Patch(':id') async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateSubjectDto) { return { success: true, data: await this.subjects.update(user.id, id, body) }; }
  @Delete(':id') async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return { success: true, data: await this.subjects.remove(user.id, id) }; }
}
