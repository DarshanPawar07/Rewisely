import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RevisionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class RevisionsService {
  constructor(private readonly prisma: PrismaService) {}
  private normalizeStatus(status: RevisionStatus, scheduledAt: Date) {
    if (status === RevisionStatus.COMPLETED) return status;
    return scheduledAt.getTime() < Date.now() ? RevisionStatus.OVERDUE : status;
  }
  async list(userId: string, filters: { topic?: string; from?: string; to?: string; status?: RevisionStatus }) {
    const revisions = await this.prisma.revision.findMany({ where: { userId, ...(filters.topic && { topicId: filters.topic }), ...(filters.from || filters.to ? { scheduledAt: { ...(filters.from && { gte: new Date(filters.from) }), ...(filters.to && { lte: new Date(filters.to) }) } } : {}), ...(filters.status && { status: filters.status }) }, include: { topic: { include: { subject: { select: { name: true } } } } }, orderBy: { scheduledAt: 'asc' } });
    return Promise.all(revisions.map(async r => { const status = this.normalizeStatus(r.status, r.scheduledAt); if (status !== r.status) return this.prisma.revision.update({ where: { id: r.id }, data: { status }, include: { topic: { include: { subject: { select: { name: true } } } } } }); return r; }));
  }
  async get(userId: string, id: string) { const revision = await this.prisma.revision.findFirst({ where: { id, userId }, include: { topic: { include: { subject: true } } } }); if (!revision) throw new NotFoundException('Revision not found'); return revision; }
  async create(userId: string, data: { topicId: string; scheduledAt?: string; studyAt?: string; intervalDays?: number; notes?: string }) {
    const topic = await this.prisma.topic.findFirst({ where: { id: data.topicId, userId } }); if (!topic) throw new NotFoundException('Topic not found');
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    const interval = data.intervalDays ?? settings?.defaultRevisionInterval ?? 15;
    if (!Number.isInteger(interval) || interval < 1 || interval > 365) throw new BadRequestException('Revision interval must be between 1 and 365 days');
    let scheduledAt: Date;
    if (data.scheduledAt) scheduledAt = new Date(data.scheduledAt);
    else { const studyAt = data.studyAt ? new Date(data.studyAt) : new Date(); if (Number.isNaN(studyAt.getTime())) throw new BadRequestException('Invalid study date'); scheduledAt = new Date(studyAt); scheduledAt.setUTCDate(scheduledAt.getUTCDate() + interval); }
    if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduled date');
    const revisionNumber = (await this.prisma.revision.count({ where: { topicId: topic.id } })) + 1;
    return this.prisma.revision.create({ data: { userId, topicId: topic.id, revisionNumber, scheduledAt, notes: data.notes?.trim() || null }, include: { topic: { include: { subject: true } } } });
  }
  async createPlan(userId: string, data: { topicName: string; subjectId?: string; completedStudyAt: string; firstRevisionAt: string; revisionCount: number; gapDays: number; reminderEnabled?: boolean; description?: string }) {
    const completedStudyAt = new Date(data.completedStudyAt), firstRevisionAt = new Date(data.firstRevisionAt);
    if (Number.isNaN(completedStudyAt.getTime()) || Number.isNaN(firstRevisionAt.getTime())) throw new BadRequestException('Completion date and first revision date must be valid');
    if (!Number.isInteger(data.revisionCount) || data.revisionCount < 1 || data.revisionCount > 100) throw new BadRequestException('Number of revisions must be between 1 and 100');
    if (!Number.isInteger(data.gapDays) || data.gapDays < 1 || data.gapDays > 365) throw new BadRequestException('Revision gap must be between 1 and 365 days');
    let subjectId = data.subjectId;
    if (subjectId) { const owned = await this.prisma.subject.findFirst({ where: { id: subjectId, userId } }); if (!owned) throw new NotFoundException('Subject not found'); }
    else {
      let general = await this.prisma.subject.findFirst({ where: { userId, name: 'Revision Topics' } });
      if (!general) general = await this.prisma.subject.create({ data: { userId, name: 'Revision Topics', description: 'Topics added directly to revision planning' } });
      subjectId = general.id;
    }
    const plan = await this.prisma.$transaction(async tx => {
      const topic = await tx.topic.create({ data: { userId, subjectId: subjectId!, title: data.topicName.trim(), description: data.description?.trim() || null, completedStudyAt, plannedRevisionCount: data.revisionCount, revisionGapDays: data.gapDays, reminderEnabled: data.reminderEnabled ?? true } as any });
      const schedule = Array.from({ length: data.revisionCount }, (_, index) => { const date = new Date(firstRevisionAt); date.setUTCDate(date.getUTCDate() + index * data.gapDays); return { userId, topicId: topic.id, revisionNumber: index + 1, scheduledAt: date }; });
      await tx.revision.createMany({ data: schedule });
      return tx.topic.findUniqueOrThrow({ where: { id: topic.id }, include: { subject: true, revisions: { orderBy: { revisionNumber: 'asc' } } } });
    });
    return plan;
  }
  async complete(userId: string, id: string, confidence: number, notes?: string) {
    if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) throw new BadRequestException('Confidence must be between 1 and 5');
    await this.get(userId, id);
    return this.prisma.revision.update({ where: { id }, data: { status: RevisionStatus.COMPLETED, completedAt: new Date(), confidence, ...(notes !== undefined && { notes: notes.trim() || null }) }, include: { topic: true } });
  }
  async reschedule(userId: string, id: string, scheduledAt: string) { await this.get(userId, id); const value = new Date(scheduledAt); if (Number.isNaN(value.getTime())) throw new BadRequestException('Invalid scheduled date'); return this.prisma.revision.update({ where: { id }, data: { scheduledAt: value, status: RevisionStatus.SCHEDULED } }); }
  async update(userId: string, id: string, data: { scheduledAt?: string; notes?: string }) {
    await this.get(userId, id);
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : undefined;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduled date');
    return this.prisma.revision.update({ where: { id }, data: { ...(scheduledAt && { scheduledAt, status: RevisionStatus.SCHEDULED }), ...(data.notes !== undefined && { notes: data.notes.trim() || null }) }, include: { topic: { include: { subject: true } } } });
  }
  async remove(userId: string, id: string) { await this.get(userId, id); await this.prisma.revision.delete({ where: { id } }); return { id }; }
}
