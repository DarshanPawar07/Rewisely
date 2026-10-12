import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock3, Loader2, Save, Target } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { pctStyle, stepStyle } from './studyHelpers';
import type { StudyChapterDetail, StudyProgress } from './studyTypes';

type Detail = StudyChapterDetail;
type Message = { text: string; ok: boolean };
const suggestedDates = (from: string) => [1, 7, 30].map(days => { const date = new Date(from); date.setDate(date.getDate() + days); return { days, date }; });
const NOTES_LIMIT = 10000;

export function StudyChapterPage({ token }: { token: string }) {
  const { chapterId = '' } = useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<Message | null>(null);

  const apply = (result: Detail) => {
    const chapter = result.chapter;
    setDetail(result); setNotes(chapter.notes || ''); setSavedNotes(chapter.notes || '');
    setStepNotes(Object.fromEntries(chapter.progress.map(item => [item.stepId, item.notes || ''])));
    setScores(Object.fromEntries(chapter.progress.map(item => [item.stepId, item.score == null ? '' : String(item.score)])));
  };
  const refresh = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { apply((await apiRequest<Detail>(`/study/chapters/${chapterId}`, token)).data); }
    catch (reason) { setMessage({ text: reason instanceof Error ? reason.message : 'Could not load chapter', ok: false }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [chapterId, token]);
  useEffect(() => { if (!message?.ok) return; const timer = window.setTimeout(() => setMessage(null), 3000); return () => window.clearTimeout(timer); }, [message]);

  const saveNotes = async () => {
    setBusy('notes');
    try { await apiRequest(`/study/chapters/${chapterId}`, token, { method: 'PATCH', body: JSON.stringify({ notes }) }); setSavedNotes(notes); setMessage({ text: 'Chapter notes saved', ok: true }); }
    catch (reason) { setMessage({ text: reason instanceof Error ? reason.message : 'Could not save notes', ok: false }); }
    finally { setBusy(''); }
  };

  const mergeProgress = (stepId: string, patch: Partial<StudyProgress>) => setDetail(current => current ? {
    ...current,
    chapter: {
      ...current.chapter,
      progress: current.chapter.progress.some(item => item.stepId === stepId)
        ? current.chapter.progress.map(item => item.stepId === stepId ? { ...item, ...patch } : item)
        : [...current.chapter.progress, { id: `local-${stepId}`, stepId, done: false, step: current.steps.find(step => step.id === stepId)!, ...patch }],
    },
  } : current);

  const updateProgress = async (stepId: string, value: Record<string, unknown>) => {
    if (!detail) return false;
    const before = detail.chapter.progress.find(item => item.stepId === stepId);
    if (typeof value.done === 'boolean') mergeProgress(stepId, { done: value.done, completedAt: value.done ? new Date().toISOString() : null });
    try {
      const saved = (await apiRequest<StudyProgress>(`/study/chapters/${chapterId}/steps/${stepId}`, token, { method: 'PATCH', body: JSON.stringify(value) })).data;
      mergeProgress(stepId, { id: saved.id, done: saved.done, completedAt: saved.completedAt, score: saved.score, notes: saved.notes });
      return true;
    } catch (reason) {
      mergeProgress(stepId, { done: !!before?.done, completedAt: before?.completedAt ?? null });
      setMessage({ text: reason instanceof Error ? reason.message : 'Could not update this step', ok: false });
      return false;
    }
  };

  const saveStepDetails = async (stepId: string) => {
    const raw = (scores[stepId] ?? '').trim();
    const score = raw === '' ? null : Number(raw);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100 || !/^\d+(?:\.\d{1,2})?$/.test(raw))) { setMessage({ text: 'Scores must be between 0 and 100 with at most two decimal places.', ok: false }); return; }
    setBusy(stepId);
    if (await updateProgress(stepId, { notes: stepNotes[stepId] || null, score })) setMessage({ text: 'Step details saved', ok: true });
    setBusy('');
  };

  if (loading) return <section className="study-page" aria-busy="true"><div className="study-skeleton study-skeleton-banner" /><div className="study-skeleton" /></section>;
  if (!detail) return <div className="study-error"><AlertTriangle size={17} /> {message?.text || 'Chapter not found'} <Link to="/study">Back to subjects</Link></div>;

  const { chapter, steps } = detail;
  const find = (stepId: string) => chapter.progress.find(item => item.stepId === stepId);
  const done = steps.filter(step => find(step.id)?.done).length;
  const pct = steps.length ? Math.round(done / steps.length * 100) : 0;
  const nextStep = steps.find(step => !find(step.id)?.done);
  const reviseStep = steps.find(step => /revise|review/i.test(step.name));
  const reviseProgress = reviseStep && find(reviseStep.id);
  const planDates = suggestedDates(reviseProgress?.completedAt || chapter.createdAt);
  const lastDone = steps.reduce((last, step, index) => find(step.id)?.done ? index : last, -1);
  const fraction = steps.length > 1 ? Math.max(0, lastDone) / (steps.length - 1) : 0;

  return (
    <section className="study-page study-chapter-page">
      <div className="study-breadcrumb"><Link to={`/study/subjects/${chapter.subjectId}`}><ArrowLeft size={15} /> {detail.subject}</Link><span>/</span><span>{chapter.title}</span></div>

      <header className="study-chapter-hero">
        <div className="study-ring" style={pctStyle(pct)} role="img" aria-label={`${pct}% complete`}><b>{pct}%</b><small>complete</small></div>
        <div><span className="study-eyebrow">{detail.subject} · Chapter details</span><h2>{chapter.title}</h2><p>{done} of {steps.length} steps complete. Your notes and study record, all in one place.</p></div>
        {nextStep ? <button className="study-primary" onClick={() => void updateProgress(nextStep.id, { done: true })}><Check size={16} /> Mark “{nextStep.name}” done</button> : <span className="study-all-done"><Check size={16} /> All steps complete</span>}
      </header>

      {message && <p className={'study-toast ' + (message.ok ? 'ok' : 'err')} role="status">{message.ok ? <Check size={16} /> : <AlertTriangle size={16} />} {message.text}</p>}

      <section className="study-chapter-progress" aria-label="Step path">
        <div className="study-path-track" style={{ '--n': steps.length, '--frac': fraction } as CSSProperties}>
          <div className="study-path-line"><i /></div>
          {steps.map((step, index) => {
            const item = find(step.id);
            return (
              <div className="study-path-step" key={step.id}>
                <button aria-label={`${step.name}: ${item?.done ? 'completed. Tap to undo' : 'tap to mark complete'}`} aria-pressed={!!item?.done} className={item?.done ? 'done' : ''} style={stepStyle(step.colour)} onClick={() => void updateProgress(step.id, { done: !item?.done })}>{item?.done ? <Check size={18} /> : index + 1}</button>
                <b>{step.name}</b>
                <small>{item?.done ? (item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'Complete') : 'Not started'}</small>
              </div>
            );
          })}
        </div>
      </section>

      <div className="study-detail-grid">
        <section className="study-editor-card study-notes-card">
          <div className="study-section-heading"><div><h3>Chapter notes</h3><p>Keep key ideas, questions and reminders close to the work.</p></div></div>
          <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={9} maxLength={NOTES_LIMIT} placeholder="Write or paste your notes for this chapter…" aria-label="Chapter notes" />
          <div className="study-notes-footer"><small>{notes.length.toLocaleString()}/{NOTES_LIMIT.toLocaleString()} characters{notes !== savedNotes && <em> · unsaved changes</em>}</small><button className="study-primary" disabled={busy === 'notes' || notes === savedNotes} onClick={() => void saveNotes()}>{busy === 'notes' ? <Loader2 className="spin" size={15} /> : <Save size={15} />} Save notes</button></div>
        </section>

        <aside className="study-editor-card study-auto-plan">
          <div className="study-section-heading"><div><h3><Clock3 size={18} /> Automatic revision plan</h3><p>Suggested follow-ups from your {reviseStep?.name || 'study'} milestone.</p></div></div>
          <div className="study-review-list">
            {planDates.map(({ days, date }) => (
              <div key={days}>
                <span className={reviseProgress?.done ? 'review-date-ready' : ''}>{days}d</span>
                <p><b>{days === 1 ? 'Quick recall' : days === 7 ? 'Weekly review' : 'Long-term check'}</b><small>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {reviseProgress?.done ? 'Planned from your completed revision' : 'Estimated from chapter start'}</small></p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="study-editor-card study-records">
        <div className="study-section-heading"><div><h3><Target size={18} /> Step notes &amp; results</h3><p>Notes and scores stay attached to their step, even if you reorder your workflow.</p></div></div>
        <div className="study-record-grid">
          {steps.map(step => {
            const item = find(step.id);
            const scoreStep = /mock|interview|test|score|exam|quiz/i.test(step.name) || item?.score != null;
            return (
              <article key={step.id} className="study-record-card" style={stepStyle(step.colour)}>
                <header><span /> <b>{step.name}</b>{item?.done && <small><Check size={13} /> Done</small>}</header>
                <textarea rows={3} maxLength={NOTES_LIMIT} aria-label={`Notes for ${step.name}`} value={stepNotes[step.id] || ''} onChange={event => setStepNotes(current => ({ ...current, [step.id]: event.target.value }))} placeholder={`Notes about ${step.name.toLowerCase()}…`} />
                {scoreStep && <label>Score / result<input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={scores[step.id] || ''} onChange={event => setScores(current => ({ ...current, [step.id]: event.target.value }))} placeholder="Optional, 0–100" /></label>}
                <button className="study-quiet" disabled={busy === step.id} onClick={() => void saveStepDetails(step.id)}>{busy === step.id ? <Loader2 className="spin" size={14} /> : <Save size={14} />} Save details</button>
              </article>
            );
          })}
        </div>
      </section>
      <Link className="study-back-link" to={`/study/subjects/${chapter.subjectId}`}>Back to diary <ArrowRight size={14} /></Link>
    </section>
  );
}
