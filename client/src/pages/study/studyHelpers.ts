import type { CSSProperties } from 'react';
import type { StudyChapter, StudyStep, StudySubject } from './studyTypes';

export const STEP_COLOURS = ['#4f8ef7', '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e', '#84934a'];
export const SUBJECT_TONES = ['#6a5cf5', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4'];
export const MAX_STEPS = 10;
export const MAX_STEP_NAME = 40;
export const MAX_CHAPTER_TITLE = 160;

/** Collapses stray spaces, so "Short notes " and "short notes" count as the same name. */
export const normaliseName = (value: string) => value.trim().replace(/\s+/g, ' ');
export const nameKey = (value: string) => normaliseName(value).toLowerCase();

export const isStepDone = (chapter: StudyChapter, stepId: string) => !!chapter.progress.find(item => item.stepId === stepId)?.done;
export const doneCount = (chapter: StudyChapter, steps: StudyStep[]) => steps.filter(step => isStepDone(chapter, step.id)).length;

/** Subject progress is always computed: steps done ÷ (chapters × steps). Nothing is stored. */
export const subjectTotals = (chapters: StudyChapter[], steps: StudyStep[]) => {
  const total = chapters.length * steps.length;
  const done = chapters.reduce((sum, chapter) => sum + doneCount(chapter, steps), 0);
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
};

export const stepTotals = (chapters: StudyChapter[], step: StudyStep) => {
  const done = chapters.filter(chapter => isStepDone(chapter, step.id)).length;
  return { done, total: chapters.length, pct: chapters.length ? Math.round(done / chapters.length * 100) : 0 };
};

/** The first unfinished step of the first unfinished chapter. */
export const findNextUp = (chapters: StudyChapter[], steps: StudyStep[]) => {
  for (const chapter of chapters) {
    const step = steps.find(item => !isStepDone(chapter, item.id));
    if (step) return { chapter, step };
  }
  return null;
};

export const findNextUpAcrossSubjects = (subjects: StudySubject[]) => {
  for (const subject of subjects) {
    const next = findNextUp(subject.studyChapters, subject.studySteps);
    if (next) return { subject, ...next };
  }
  return null;
};

/** Strips list markers people paste along with chapter names: "1. Cells", "- Genetics", "• Bio". */
export const cleanChapterLine = (line: string) => line.replace(/^\s*(?:[-*•●▪◦]|\(?\d{1,3}[.)\]:-])\s+/, '').trim();
export const parseChapterLines = (text: string) => text.split(/\r?\n/).map(cleanChapterLine).filter(Boolean);

export const formatWorth = (steps: number) => {
  if (!steps) return '0';
  const value = 100 / steps;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

export const stepStyle = (colour: string) => ({ '--step-colour': colour }) as CSSProperties;
export const toneStyle = (index: number) => ({ '--tone': SUBJECT_TONES[index % SUBJECT_TONES.length] }) as CSSProperties;
export const pctStyle = (pct: number) => ({ '--p': pct }) as CSSProperties;
