import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { StudyStep } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudyChapterDto, CreateStudySubjectDto, SaveStudyStepsDto, UpdateChapterStepDto, UpdateStudyChapterDto } from './dto/track-study.dto';

export const DEFAULT_STEPS = [
  { name: 'Learn', colour: '#4f8ef7' },
  { name: 'Short notes', colour: '#f59e0b' },
  { name: 'Revise', colour: '#8b5cf6' },
  { name: 'Mock test', colour: '#14b8a6' },
];
export const MAX_STEPS = 10;

// Collapse stray whitespace so "Short  notes " and "short notes" are treated as the same name.
const clean = (value: string) => value.trim().replace(/\s+/g, ' ');
const nameKey = (value: string) => clean(value).toLowerCase();
const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const stepSelect = { id: true, name: true, position: true, colour: true, active: true };
// Only progress for *active* steps is returned. Rows for removed (archived) steps stay in the
// database untouched, so notes and scores come back if the step is ever re-added.
const progressInclude = { where: { step: { active: true } }, include: { step: { select: stepSelect } } };
const subjectInclude = {
  studySteps: { where: { active: true }, orderBy: { position: 'asc' as const } },
  studyChapters: {
    // id is a tie-breaker so chapters created in the same millisecond keep their pasted order.
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    include: { progress: progressInclude },
  },
};
const chapterInclude = { subject: true, progress: progressInclude };

@Injectable()
export class StudyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Serialises work on one subject across requests (Postgres advisory lock, released at commit). */
  private async lock(tx: Prisma.TransactionClient, subjectId: string) {
    // Project a supported scalar instead of Prisma trying to deserialize PostgreSQL's `void` result.
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(hashtext(${'study:' + subjectId}))`;
  }

  /** Makes sure every active step has a progress row for every chapter of the subject. */
  private async backfillProgress(tx: Prisma.TransactionClient, subjectId: string) {
    const steps = await tx.studyStep.findMany({ where: { subjectId, active: true }, select: { id: true } });
    const chapters = await tx.studyChapter.findMany({ where: { subjectId }, select: { id: true } });
    if (!steps.length || !chapters.length) return;
    await tx.studyChapterProgress.createMany({
      data: chapters.flatMap(chapter => steps.map(step => ({ chapterId: chapter.id, stepId: step.id }))),
      skipDuplicates: true,
    });
  }

  /** True when a subject has no steps yet, or has revision topics that are not chapters yet. */
  private async needsSync(db: Prisma.TransactionClient, userId: string, subjectId: string) {
    const [stepCount, topics] = await Promise.all([
      db.studyStep.count({ where: { subjectId, active: true } }),
      db.topic.findMany({ where: { userId, subjectId }, select: { id: true } }),
    ]);
    if (!stepCount) return true;
    if (!topics.length) return false;
    const linked = await db.studyChapter.count({ where: { legacyTopicId: { in: topics.map(topic => topic.id) } } });
    return linked < topics.length;
  }

  private async syncSubject(tx: Prisma.TransactionClient, userId: string, subjectId: string) {
    await this.lock(tx, subjectId);
    // Re-check inside the lock: another request may have finished the same work while we waited.
    let steps = await tx.studyStep.findMany({ where: { subjectId, active: true }, orderBy: { position: 'asc' } });
    if (!steps.length) {
      await tx.studyStep.createMany({ data: DEFAULT_STEPS.map((step, position) => ({ ...step, subjectId, position })) });
      steps = await tx.studyStep.findMany({ where: { subjectId, active: true }, orderBy: { position: 'asc' } });
      await this.backfillProgress(tx, subjectId);
    }
    const topics = await tx.topic.findMany({ where: { userId, subjectId }, orderBy: { createdAt: 'asc' } });
    if (!topics.length) return;
    // legacyTopicId is unique across ALL subjects, so look it up globally. Otherwise a topic that
    // was moved to another subject would try to create a second chapter and fail forever.
    const linked = await tx.studyChapter.findMany({ where: { legacyTopicId: { in: topics.map(topic => topic.id) } }, select: { legacyTopicId: true } });
    const linkedIds = new Set(linked.map(item => item.legacyTopicId));
    for (const topic of topics.filter(item => !linkedIds.has(item.id))) {
      await tx.studyChapter.create({
        data: {
          subjectId,
          legacyTopicId: topic.id,
          title: topic.title,
          notes: topic.notes,
          description: topic.description,
          createdAt: topic.createdAt, // keeps the original topic order
          progress: { create: steps.map(step => ({ stepId: step.id })) },
        },
      });
    }
  }

  private async ensureSubject(userId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!subject) throw new NotFoundException('Subject not found');
    if (await this.needsSync(this.prisma, userId, subjectId)) {
      await this.prisma.$transaction(tx => this.syncSubject(tx, userId, subjectId), { timeout: 20000, maxWait: 10000 });
    }
    return subject;
  }

  async list(userId: string) {
    const subjects = await this.prisma.subject.findMany({ where: { userId }, select: { id: true }, orderBy: { name: 'asc' } });
    // Subjects are independent here. Serial checks make the study home wait on several
    // database round trips per subject, so validate/sync them concurrently instead.
    await Promise.all(subjects.map(subject => this.ensureSubject(userId, subject.id)));
    return this.prisma.subject.findMany({ where: { userId }, include: subjectInclude, orderBy: { name: 'asc' } });
  }

  async getSubject(userId: string, subjectId: string) {
    await this.ensureSubject(userId, subjectId);
    return this.prisma.subject.findFirstOrThrow({ where: { id: subjectId, userId }, include: subjectInclude });
  }

  async createSubject(userId: string, data: CreateStudySubjectDto) {
    const name = clean(data.name);
    if (!name) throw new BadRequestException('Subject name is required');
    const duplicate = await this.prisma.subject.findFirst({ where: { userId, name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
    if (duplicate) throw new ConflictException('You already have a subject with this name');
    try {
      // Subject and its default steps are created together, so a subject is never left without steps.
      const subject = await this.prisma.$transaction(async tx => {
        const created = await tx.subject.create({ data: { userId, name, description: data.description?.trim() || null } });
        await tx.studyStep.createMany({ data: DEFAULT_STEPS.map((step, position) => ({ ...step, subjectId: created.id, position })) });
        return created;
      });
      return this.getSubject(userId, subject.id);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('You already have a subject with this name');
      throw error;
    }
  }

  async createChapter(userId: string, subjectId: string, data: CreateStudyChapterDto) {
    await this.ensureSubject(userId, subjectId);
    const title = data.title.trim();
    if (!title) throw new BadRequestException('Chapter name is required');
    const steps = await this.prisma.studyStep.findMany({ where: { subjectId, active: true }, orderBy: { position: 'asc' } });
    return this.prisma.studyChapter.create({
      data: {
        subjectId, title, notes: data.notes?.trim() || null, description: data.description?.trim() || null,
        progress: { create: steps.map(step => ({ stepId: step.id })) },
      },
      include: { progress: progressInclude },
    });
  }

  private async getChapter(userId: string, chapterId: string) {
    const chapter = await this.prisma.studyChapter.findFirst({ where: { id: chapterId, subject: { userId } }, include: chapterInclude });
    if (!chapter) throw new NotFoundException('Chapter not found');
    return chapter;
  }

  async getChapterView(userId: string, chapterId: string) {
    const chapter = await this.getChapter(userId, chapterId);
    const steps = await this.prisma.studyStep.findMany({ where: { subjectId: chapter.subjectId, active: true }, orderBy: { position: 'asc' } });
    return { chapter, subject: chapter.subject.name, steps };
  }

  async updateChapter(userId: string, chapterId: string, data: UpdateStudyChapterDto) {
    await this.getChapter(userId, chapterId);
    const title = data.title?.trim();
    if (title !== undefined && !title) throw new BadRequestException('Chapter name is required');
    return this.prisma.studyChapter.update({
      where: { id: chapterId },
      data: {
        ...(title !== undefined && { title }),
        ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
        ...(data.description !== undefined && { description: data.description.trim() || null }),
      },
      include: chapterInclude,
    });
  }

  async deleteChapter(userId: string, chapterId: string) {
    await this.getChapter(userId, chapterId);
    await this.prisma.studyChapter.delete({ where: { id: chapterId } });
    return { id: chapterId };
  }

  private applyStepUpdate(chapterId: string, stepId: string, data: UpdateChapterStepDto) {
    return this.prisma.$transaction(async tx => {
      const prior = await tx.studyChapterProgress.findUnique({ where: { chapterId_stepId: { chapterId, stepId } } });
      const done = data.done ?? prior?.done ?? false;
      return tx.studyChapterProgress.upsert({
        where: { chapterId_stepId: { chapterId, stepId } },
        create: { chapterId, stepId, done, score: data.score, notes: data.notes?.trim() || null, completedAt: done ? new Date() : null },
        update: {
          ...(data.done !== undefined && { done, completedAt: done ? (prior?.done ? prior.completedAt : new Date()) : null }),
          ...(data.score !== undefined && { score: data.score }),
          ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        },
        include: { step: true },
      });
    });
  }

  async updateChapterStep(userId: string, chapterId: string, stepId: string, data: UpdateChapterStepDto) {
    const chapter = await this.getChapter(userId, chapterId);
    const step = await this.prisma.studyStep.findFirst({ where: { id: stepId, subjectId: chapter.subjectId, active: true } });
    if (!step) throw new NotFoundException('Study step not found');
    try { return await this.applyStepUpdate(chapterId, stepId, data); }
    catch (error) {
      // Two quick taps can race to create the same row; the second attempt simply updates it.
      if (isUniqueViolation(error)) return this.applyStepUpdate(chapterId, stepId, data);
      throw error;
    }
  }

  private validateSteps(steps: SaveStudyStepsDto['steps']) {
    const cleaned = steps.map(step => ({ ...step, name: clean(step.name) }));
    if (!cleaned.length || cleaned.length > MAX_STEPS) throw new BadRequestException(`Choose between 1 and ${MAX_STEPS} steps`);
    if (cleaned.some(step => !step.name)) throw new BadRequestException('Step names cannot be empty');
    const seen = new Set<string>();
    for (const step of cleaned) {
      const key = nameKey(step.name);
      if (seen.has(key)) throw new BadRequestException(`“${step.name}” is used more than once. Step names must be unique`);
      seen.add(key);
    }
    const ids = cleaned.map(step => step.id).filter((id): id is string => Boolean(id));
    if (new Set(ids).size !== ids.length) throw new BadRequestException('The same step was listed more than once');
    return cleaned;
  }

  async saveSteps(userId: string, subjectId: string, data: SaveStudyStepsDto) {
    await this.ensureSubject(userId, subjectId);
    const desired = this.validateSteps(data.steps);
    const owned = data.scope === 'all'
      ? await this.prisma.subject.findMany({ where: { userId }, select: { id: true } })
      : [{ id: subjectId }];
    const targetIds = owned.map(subject => subject.id).sort();
    for (const id of targetIds) if (id !== subjectId) await this.ensureSubject(userId, id);

    await this.prisma.$transaction(async tx => {
      // Lock every affected subject in a fixed order so two saves can never deadlock each other.
      for (const id of targetIds) await this.lock(tx, id);
      const sourceNames = new Map((await tx.studyStep.findMany({ where: { subjectId, active: true } })).map(step => [step.id, nameKey(step.name)]));

      for (const target of targetIds) {
        const active = await tx.studyStep.findMany({ where: { subjectId: target, active: true } });
        const archived = await tx.studyStep.findMany({ where: { subjectId: target, active: false } });
        const used = new Set<string>();
        const saved: StudyStep[] = [];
        const pick = (list: StudyStep[], match: (step: StudyStep) => boolean) => list.find(step => !used.has(step.id) && match(step));

        for (const [position, item] of desired.entries()) {
          let existing: StudyStep | undefined;
          // 1) the exact step the student edited (keeps its ticks, notes and scores through renames and moves)
          if (item.id) {
            if (target === subjectId) existing = pick(active, step => step.id === item.id);
            else { const original = sourceNames.get(item.id); if (original) existing = pick(active, step => nameKey(step.name) === original); }
          }
          // 2) an active step with the same name, 3) a previously removed step with the same name (restores its data)
          existing = existing ?? pick(active, step => nameKey(step.name) === nameKey(item.name));
          existing = existing ?? pick(archived, step => nameKey(step.name) === nameKey(item.name));

          let result: StudyStep;
          if (existing) {
            used.add(existing.id);
            result = await tx.studyStep.update({ where: { id: existing.id }, data: { name: item.name, position, active: true, colour: item.colour } });
          } else {
            result = await tx.studyStep.create({ data: { subjectId: target, name: item.name, position, colour: item.colour } });
            used.add(result.id);
          }
          saved.push(result);
        }

        // Steps that are no longer wanted are archived, never deleted: their notes and scores stay in the database.
        const toArchive = active.filter(step => !used.has(step.id));
        if (toArchive.length) await tx.studyStep.updateMany({ where: { id: { in: toArchive.map(step => step.id) } }, data: { active: false } });
        await this.backfillProgress(tx, target);
      }
    }, { timeout: 30000, maxWait: 10000 });
    return this.getSubject(userId, subjectId);
  }
}
