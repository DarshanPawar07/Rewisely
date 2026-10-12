import { PrismaClient, Difficulty, RevisionStatus, Priority, TaskCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash('DemoPassword123!', 12);
  const user = await prisma.user.upsert({ where: { email: 'demo@reviseme.app' }, update: {}, create: { name: 'Demo Student', email: 'demo@reviseme.app', passwordHash, settings: { create: { timezone: 'Asia/Kolkata' } } } });
  const dsa = await prisma.subject.upsert({ where: { id: 'demo-dsa' }, update: {}, create: { id: 'demo-dsa', userId: user.id, name: 'DSA', description: 'Data structures and algorithms' } });
  const binary = await prisma.topic.upsert({ where: { id: 'demo-binary-search' }, update: {}, create: { id: 'demo-binary-search', userId: user.id, subjectId: dsa.id, title: 'Binary Search', difficulty: Difficulty.MEDIUM, notes: 'Practice boundary conditions and duplicates.' } });
  if (await prisma.revision.count({ where: { topicId: binary.id } }) === 0) await prisma.revision.createMany({ data: [{ userId: user.id, topicId: binary.id, revisionNumber: 1, scheduledAt: new Date('2026-09-06T13:30:00Z'), completedAt: new Date('2026-09-06T14:00:00Z'), status: RevisionStatus.COMPLETED, confidence: 4 }, { userId: user.id, topicId: binary.id, revisionNumber: 2, scheduledAt: new Date('2026-09-21T13:30:00Z'), status: RevisionStatus.SCHEDULED }] });
  if (await prisma.task.count({ where: { userId: user.id } }) === 0) await prisma.task.create({ data: { userId: user.id, title: 'Solve 5 LeetCode problems', priority: Priority.MEDIUM, category: TaskCategory.DSA, dueDate: new Date('2026-09-22T14:30:00Z') } });
}
main().finally(() => prisma.$disconnect());
