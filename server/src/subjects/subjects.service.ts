import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.subject.findMany({ where: { userId }, include: { _count: { select: { topics: true } } }, orderBy: { name: 'asc' } }); }
  async get(userId: string, id: string) { const subject = await this.prisma.subject.findFirst({ where: { id, userId }, include: { topics: true } }); if (!subject) throw new NotFoundException('Subject not found'); return subject; }
  create(userId: string, data: { name: string; description?: string }) { return this.prisma.subject.create({ data: { userId, name: data.name.trim(), description: data.description?.trim() || null } }); }
  async update(userId: string, id: string, data: { name?: string; description?: string }) { await this.get(userId, id); return this.prisma.subject.update({ where: { id }, data: { ...(data.name !== undefined && { name: data.name.trim() }), ...(data.description !== undefined && { description: data.description.trim() || null }) } }); }
  async remove(userId: string, id: string) { await this.get(userId, id); await this.prisma.subject.delete({ where: { id } }); return { id }; }
}
