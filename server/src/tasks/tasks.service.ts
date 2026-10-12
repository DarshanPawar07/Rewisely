import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Priority, Recurrence, TaskCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string, filters: { from?: string; to?: string; completed?: boolean; priority?: Priority; category?: TaskCategory }) {
    return this.prisma.task.findMany({ where: { userId, ...(filters.from || filters.to ? { dueDate: { ...(filters.from && { gte: new Date(filters.from) }), ...(filters.to && { lte: new Date(filters.to) }) } } : {}), ...(filters.completed !== undefined && { completed: filters.completed }), ...(filters.priority && { priority: filters.priority }), ...(filters.category && { category: filters.category }) }, orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }] });
  }
  async get(userId: string, id: string) { const task = await this.prisma.task.findFirst({ where: { id, userId } }); if (!task) throw new NotFoundException('Task not found'); return task; }
  async create(userId: string, data: { title: string; description?: string; dueDate?: string; priority?: Priority; category?: TaskCategory; recurrenceType?: Recurrence }) {
    const dueDate = data.dueDate ? new Date(data.dueDate) : null; if (dueDate && Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');
    const recurrenceType = data.recurrenceType ?? Recurrence.NONE;
    return this.prisma.task.create({ data: { userId, title: data.title.trim(), description: data.description?.trim() || null, dueDate, priority: data.priority ?? Priority.MEDIUM, category: data.category ?? TaskCategory.OTHER, recurrenceType, isRecurring: recurrenceType !== Recurrence.NONE } });
  }
  async update(userId: string, id: string, data: { title?: string; description?: string; dueDate?: string | null; priority?: Priority; category?: TaskCategory; recurrenceType?: Recurrence }) {
    await this.get(userId, id);
    const dueDate = data.dueDate === undefined ? undefined : data.dueDate === null ? null : new Date(data.dueDate);
    if (dueDate instanceof Date && Number.isNaN(dueDate.getTime())) throw new BadRequestException('Invalid due date');
    return this.prisma.task.update({ where: { id }, data: { ...(data.title !== undefined && { title: data.title.trim() }), ...(data.description !== undefined && { description: data.description.trim() || null }), ...(dueDate !== undefined && { dueDate }), ...(data.priority && { priority: data.priority }), ...(data.category && { category: data.category }), ...(data.recurrenceType && { recurrenceType: data.recurrenceType, isRecurring: data.recurrenceType !== Recurrence.NONE }) } });
  }
  async complete(userId: string, id: string, completed: boolean) {
    const task = await this.get(userId, id);
    const updated = await this.prisma.task.update({ where: { id }, data: { completed, completedAt: completed ? new Date() : null } });
    if (completed && task.isRecurring && task.dueDate) {
      const next = new Date(task.dueDate);
      if (task.recurrenceType === Recurrence.DAILY) next.setUTCDate(next.getUTCDate() + 1);
      if (task.recurrenceType === Recurrence.WEEKLY) next.setUTCDate(next.getUTCDate() + 7);
      if (task.recurrenceType === Recurrence.MONTHLY) next.setUTCMonth(next.getUTCMonth() + 1);
      if (task.recurrenceType !== Recurrence.NONE) await this.prisma.task.create({ data: { userId, title: task.title, description: task.description, dueDate: next, priority: task.priority, category: task.category, isRecurring: true, recurrenceType: task.recurrenceType } });
    }
    return updated;
  }
  async remove(userId: string, id: string) { await this.get(userId, id); await this.prisma.task.delete({ where: { id } }); return { id }; }
}
