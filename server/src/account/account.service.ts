import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}
  async profile(userId: string) {
    const [user, topics, revisions, tasks] = await Promise.all([(this.prisma.user as any).findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, firstName: true, lastName: true, occupation: true, phone: true, email: true, createdAt: true } }), this.prisma.topic.count({ where: { userId } }), this.prisma.revision.groupBy({ by: ['status'], where: { userId }, _count: true }), this.prisma.task.count({ where: { userId, completed: true } })]);
    const count = (status: string) => revisions.find(x => x.status === status)?._count ?? 0;
    return { ...user, stats: { totalTopics: topics, totalRevisions: revisions.reduce((sum, x) => sum + x._count, 0), completedRevisions: count('COMPLETED'), overdueRevisions: count('OVERDUE'), tasksCompleted: tasks } };
  }
  async updateProfile(userId: string, data: { name?: string; firstName?: string; lastName?: string; occupation?: string; phone?: string }) { const name=data.name?.trim() || [data.firstName?.trim(),data.lastName?.trim()].filter(Boolean).join(' ') || undefined; return (this.prisma.user as any).update({ where: { id: userId }, data: { ...(name&&{name}), ...(data.firstName!==undefined&&{firstName:data.firstName.trim()||null}), ...(data.lastName!==undefined&&{lastName:data.lastName.trim()||null}), ...(data.occupation!==undefined&&{occupation:data.occupation.trim()||null}), ...(data.phone!==undefined&&{phone:data.phone.trim()||null}) }, select: { id:true,name:true,firstName:true,lastName:true,occupation:true,phone:true,email:true,createdAt:true } }); }
  async notifications(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId }, select: { notificationEnabled: true } });
    if (settings?.notificationEnabled !== false) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 7);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const [tasks, revisions] = await Promise.all([
        this.prisma.task.findMany({ where: { userId, completed: false, dueDate: { gte: yesterday, lt: dayAfterTomorrow } }, select: { id: true, title: true, dueDate: true } }),
        this.prisma.revision.findMany({ where: { userId, status: { not: 'COMPLETED' }, scheduledAt: { gte: yesterday, lt: dayAfterTomorrow }, topic: { reminderEnabled: true } }, include: { topic: { select: { title: true } } } }),
      ]);
      const items = [
        ...tasks.map(task => {
          const overdue = task.dueDate! < today;
          return { id: `task-${task.id}`, type: NotificationType.TASK_DUE, title: overdue ? 'Task overdue' : 'Task reminder', message: `${task.title} is ${overdue ? 'overdue' : `due ${task.dueDate!.toLocaleDateString()}`}.` };
        }),
        ...revisions.map(revision => {
          const overdue = revision.scheduledAt < today;
          return { id: `revision-${revision.id}`, type: overdue ? NotificationType.REVISION_OVERDUE : NotificationType.REVISION_DUE, title: overdue ? 'Revision overdue' : 'Revision coming up', message: `${revision.topic.title} · Revision ${revision.revisionNumber} is ${overdue ? 'overdue' : `scheduled for ${revision.scheduledAt.toLocaleDateString()}`}.` };
        }),
      ];
      const activeIds = items.map(item => item.id);
      await Promise.all(items.map(item => this.prisma.notification.upsert({
        where: { id: item.id },
        create: { ...item, userId, isRead: false },
        update: { type: item.type, title: item.title, message: item.message },
      })));
      await this.prisma.notification.updateMany({
        where: {
          userId,
          type: { in: [NotificationType.TASK_DUE, NotificationType.REVISION_DUE, NotificationType.REVISION_OVERDUE] },
          ...(activeIds.length ? { id: { notIn: activeIds } } : {}),
          isRead: false,
        },
        data: { isRead: true },
      });
    }
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 });
  }
  async markNotificationRead(userId: string, id: string, isRead = true) {
    const result = await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead } });
    if (!result.count) throw new NotFoundException('Notification not found.');
    return { success: true };
  }
  markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
  settings(userId: string) { return this.prisma.userSettings.findUniqueOrThrow({ where: { userId } }); }
  updateSettings(userId: string, data: { timezone?: string; defaultRevisionInterval?: number; notificationEnabled?: boolean; emailNotificationEnabled?: boolean; theme?: string }) { return this.prisma.userSettings.update({ where: { userId }, data }); }
}
