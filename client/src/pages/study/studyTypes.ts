export type StudyStep = { id: string; name: string; position: number; colour: string; active: boolean };
export type StudyProgress = { id: string; stepId: string; done: boolean; score?: number | null; notes?: string | null; completedAt?: string | null; step: StudyStep };
export type StudyChapter = { id: string; subjectId: string; title: string; notes?: string | null; description?: string | null; createdAt: string; progress: StudyProgress[] };
export type StudySubject = { id: string; name: string; description?: string | null; studySteps: StudyStep[]; studyChapters: StudyChapter[] };
export type StudyChapterDetail = { chapter: StudyChapter; subject: string; steps: StudyStep[] };

export const percentage = (chapter: StudyChapter, steps: StudyStep[]) => steps.length
  ? Math.round(steps.filter(step => chapter.progress.find(item => item.stepId === step.id)?.done).length / steps.length * 100)
  : 0;
