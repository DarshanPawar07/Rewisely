import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class WeeklyTargetsService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return (this.prisma as any).weeklyTarget.findMany({ where: { userId }, include: { tasks: true }, orderBy: { weekStart: 'desc' } }); }
  async get(userId: string, id: string) { const target = await (this.prisma as any).weeklyTarget.findFirst({ where: { id, userId }, include: { tasks: { orderBy: { createdAt: 'asc' } } } }); if (!target) throw new NotFoundException('Weekly target not found'); return target; }
  async create(userId: string, data: { name: string; weekStart: string; tasks: string[] }) { const start = new Date(data.weekStart); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6); return (this.prisma as any).weeklyTarget.create({ data: { userId, name: data.name.trim(), weekStart: start, weekEnd: end, tasks: { create: data.tasks.filter(Boolean).map(title => ({ title: title.trim() })) } }, include: { tasks: true } }); }
  async update(userId: string, id: string, data: { name?: string; weekStart?: string }) { await this.get(userId, id); return (this.prisma as any).weeklyTarget.update({ where: { id }, data: { ...(data.name && { name: data.name.trim() }), ...(data.weekStart && { weekStart: new Date(data.weekStart) }) }, include: { tasks: true } }); }
  async remove(userId: string, id: string) { await this.get(userId, id); await (this.prisma as any).weeklyTarget.delete({ where: { id } }); return { id }; }
  async addTask(userId: string, id: string, title: string) { await this.get(userId, id); return (this.prisma as any).weeklyTargetTask.create({ data: { weeklyTargetId: id, title: title.trim() } }); }
  async completeTask(userId: string, id: string, taskId: string, completed: boolean) { await this.get(userId, id); const task = await (this.prisma as any).weeklyTargetTask.findFirst({ where: { id: taskId, weeklyTargetId: id } }); if (!task) throw new NotFoundException('Weekly target task not found'); return (this.prisma as any).weeklyTargetTask.update({ where: { id: taskId }, data: { completed, completedAt: completed ? new Date() : null } }); }
}
