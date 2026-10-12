import { Injectable } from '@nestjs/common';
import { RevisionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  private range(date = new Date()) { const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); return { start, end }; }
  async dashboard(userId: string) {
    const { start, end } = this.range();
    await this.prisma.revision.updateMany({ where: { userId, status: { in: [RevisionStatus.SCHEDULED, RevisionStatus.PENDING] }, scheduledAt: { lt: start } }, data: { status: RevisionStatus.OVERDUE } });
    const [todayRevisions, todayTasks, overdueRevisions, upcomingRevisions, remainingTasks] = await Promise.all([
      this.prisma.revision.findMany({ where: { userId, scheduledAt: { gte: start, lt: end } }, include: { topic: { include: { subject: { select: { name: true } } } } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.task.findMany({ where: { userId, dueDate: { gte: start, lt: end } }, orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }] }),
      this.prisma.revision.findMany({ where: { userId, status: RevisionStatus.OVERDUE }, include: { topic: { include: { subject: { select: { name: true } } } } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.revision.findMany({ where: { userId, status: { in: [RevisionStatus.SCHEDULED, RevisionStatus.PENDING] }, scheduledAt: { gte: end } }, include: { topic: { include: { subject: { select: { name: true } } } } }, orderBy: { scheduledAt: 'asc' }, take: 10 }),
      this.prisma.task.count({ where: { userId, completed: false, OR: [{ dueDate: null }, { dueDate: { gte: start, lt: end } }] } })
    ]);
    const streak = await this.streak(userId);
    return { today: { revisions: todayRevisions, tasks: todayTasks }, overdueRevisions, upcomingRevisions, stats: { todayRevisionCount: todayRevisions.filter(r => r.status !== RevisionStatus.COMPLETED).length, overdueRevisionCount: overdueRevisions.length, remainingTasks, currentStreak: streak } };
  }
  async calendar(userId: string, from: string, to: string) {
    const start = new Date(from), end = new Date(to); end.setUTCDate(end.getUTCDate() + 1);
    return { revisions: await this.prisma.revision.findMany({ where: { userId, scheduledAt: { gte: start, lt: end } }, include: { topic: { include: { subject: { select: { name: true } } } } }, orderBy: { scheduledAt: 'asc' } }), tasks: await this.prisma.task.findMany({ where: { userId, dueDate: { gte: start, lt: end } }, orderBy: { dueDate: 'asc' } }) };
  }
  private async streak(userId: string) {
    const activities = await this.prisma.$queryRaw<{ date: Date }[]> `SELECT DISTINCT DATE(\"completedAt\") AS date FROM \"Revision\" WHERE \"userId\" = ${userId} AND \"completedAt\" IS NOT NULL UNION SELECT DISTINCT DATE(\"completedAt\") AS date FROM \"Task\" WHERE \"userId\" = ${userId} AND \"completedAt\" IS NOT NULL`;
    const dates = new Set(activities.map(a => new Date(a.date).toISOString().slice(0, 10))); let cursor = this.range().start; let count = 0; while (dates.has(cursor.toISOString().slice(0, 10))) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1); } return count;
  }
}
