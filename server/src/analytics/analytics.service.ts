import { Injectable } from '@nestjs/common';
import { RevisionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}
  async get(userId: string) {
    const [topics, revisions, tasks, subjects] = await Promise.all([this.prisma.topic.count({ where: { userId } }), this.prisma.revision.groupBy({ by: ['status'], where: { userId }, _count: true }), this.prisma.task.groupBy({ by: ['completed'], where: { userId }, _count: true }), this.prisma.subject.findMany({ where: { userId }, include: { topics: { include: { revisions: { select: { status: true } } } } } })]);
    const revisionCount = revisions.reduce((n, x) => n + x._count, 0), completed = revisions.find(x => x.status === RevisionStatus.COMPLETED)?._count ?? 0, tasksCreated = tasks.reduce((n, x) => n + x._count, 0), tasksCompleted = tasks.find(x => x.completed)?._count ?? 0;
    return { revisions: { totalTopics: topics, total: revisionCount, completed, pending: revisions.find(x => x.status === RevisionStatus.PENDING)?._count ?? 0, overdue: revisions.find(x => x.status === RevisionStatus.OVERDUE)?._count ?? 0, completionRate: revisionCount ? Math.round(completed / revisionCount * 100) : 0 }, tasks: { created: tasksCreated, completed: tasksCompleted, remaining: tasksCreated - tasksCompleted, completionRate: tasksCreated ? Math.round(tasksCompleted / tasksCreated * 100) : 0 }, subjectProgress: subjects.flatMap(s => { const all = s.topics.flatMap(t => t.revisions); if (!all.length) return []; const done = all.filter(r => r.status === RevisionStatus.COMPLETED).length; return [{ subject: s.name, progress: Math.round(done / all.length * 100) }]; }) };
  }
}
