import { Injectable, NotFoundException } from '@nestjs/common';
import { Difficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}
  async assertSubject(userId: string, subjectId: string) { const subject = await this.prisma.subject.findFirst({ where: { id: subjectId, userId } }); if (!subject) throw new NotFoundException('Subject not found'); return subject; }
  async list(userId: string, query: { subject?: string; difficulty?: Difficulty; search?: string }) {
    const where: Prisma.TopicWhereInput = { userId, ...(query.subject && { subjectId: query.subject }), ...(query.difficulty && { difficulty: query.difficulty }), ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }) };
    return this.prisma.topic.findMany({ where, include: { subject: { select: { id: true, name: true } }, _count: { select: { revisions: true } } }, orderBy: { updatedAt: 'desc' } });
  }
  async get(userId: string, id: string) { const topic = await this.prisma.topic.findFirst({ where: { id, userId }, include: { subject: true, revisions: { orderBy: { scheduledAt: 'asc' } } } }); if (!topic) throw new NotFoundException('Topic not found'); return topic; }
  async create(userId: string, data: { subjectId: string; title: string; description?: string; notes?: string; difficulty?: Difficulty }) { await this.assertSubject(userId, data.subjectId); return this.prisma.topic.create({ data: { userId, subjectId: data.subjectId, title: data.title.trim(), description: data.description?.trim() || null, notes: data.notes?.trim() || null, difficulty: data.difficulty ?? Difficulty.MEDIUM }, include: { subject: true } }); }
  async update(userId: string, id: string, data: { subjectId?: string; title?: string; description?: string; notes?: string; difficulty?: Difficulty }) { await this.get(userId, id); if (data.subjectId) await this.assertSubject(userId, data.subjectId); return this.prisma.topic.update({ where: { id }, data: { ...(data.subjectId && { subjectId: data.subjectId }), ...(data.title !== undefined && { title: data.title.trim() }), ...(data.description !== undefined && { description: data.description.trim() || null }), ...(data.notes !== undefined && { notes: data.notes.trim() || null }), ...(data.difficulty && { difficulty: data.difficulty }) } }); }
  async remove(userId: string, id: string) { await this.get(userId, id); await this.prisma.topic.delete({ where: { id } }); return { id }; }
}
