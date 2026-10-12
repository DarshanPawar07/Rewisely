import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, Circle, ClipboardPaste, Plus, Settings2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { MAX_CHAPTER_TITLE, doneCount, findNextUp, parseChapterLines, pctStyle, stepStyle, stepTotals, subjectTotals } from './studyHelpers';
import type { StudyChapter, StudyProgress, StudySubject } from './studyTypes';
import { percentage } from './studyTypes';

type Filter = 'All chapters' | 'Missing notes' | 'Needs revision' | 'In progress' | 'Complete';
const FILTERS: Filter[] = ['All chapters', 'Missing notes', 'Needs revision', 'In progress', 'Complete'];

export function StudySubjectPage({ token }: { token: string }) {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<StudySubject | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All chapters');
  const [pasted, setPasted] = useState('');
  const [adding, setAdding] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef<StudySubject | null>(null);
  const requestVersion = useRef(0);
  latest.current = subject;

  const load = async (quiet = false) => {
    const version = ++requestVersion.current;
    if (!quiet) setLoading(true);
    try {
      const result = await apiRequest<StudySubject>(`/study/subjects/${subjectId}`, token);
      if (version === requestVersion.current) { setSubject(result.data); setError(''); }
    } catch (reason) {
      if (version === requestVersion.current) setError(reason instanceof Error ? reason.message : 'Could not load subject');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [subjectId, token]);

  const chapters = subject?.studyChapters || [], steps = subject?.studySteps || [];
  const totals = subjectTotals(chapters, steps);
  const next = findNextUp(chapters, steps);
  const reviseStep = steps.find(step => /revise|review/i.test(step.name));

  const matches = (chapter: StudyChapter, which: Filter) => {
    const pct = percentage(chapter, steps);
    if (which === 'Missing notes') return !chapter.notes?.trim();
    if (which === 'Needs revision') return reviseStep ? !chapter.progress.find(item => item.stepId === reviseStep.id)?.done : pct < 100;
    if (which === 'In progress') return pct > 0 && pct < 100;
    if (which === 'Complete') return pct === 100;
    return true;
  };
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(item => [item, chapters.filter(chapter => matches(chapter, item)).length])) as Record<Filter, number>, [chapters, steps]);
  const filtered = useMemo(() => chapters.filter(chapter => matches(chapter, filter)), [chapters, steps, filter]);

  // Ticks update instantly on screen, then sync with the server; a failed save is rolled back.
  const setProgress = (chapterId: string, stepId: string, patch: Partial<StudyProgress>) => setSubject(current => current ? {
    ...current,
    studyChapters: current.studyChapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const exists = chapter.progress.some(item => item.stepId === stepId);
      const step = current.studySteps.find(item => item.id === stepId);
      return { ...chapter, progress: exists ? chapter.progress.map(item => item.stepId === stepId ? { ...item, ...patch } : item) : step ? [...chapter.progress, { id: `local-${chapterId}-${stepId}`, stepId, done: false, step, ...patch }] : chapter.progress };
    }),
  } : current);

  const toggle = async (chapter: StudyChapter, stepId: string) => {
    const before = latest.current?.studyChapters.find(item => item.id === chapter.id)?.progress.find(item => item.stepId === stepId);
    const done = !before?.done;
    setProgress(chapter.id, stepId, { done, completedAt: done ? new Date().toISOString() : null });
    try {
      const saved = (await apiRequest<StudyProgress>(`/study/chapters/${chapter.id}/steps/${stepId}`, token, { method: 'PATCH', body: JSON.stringify({ done }) })).data;
      setProgress(chapter.id, stepId, { id: saved.id, done: saved.done, completedAt: saved.completedAt });
      setError('');
    } catch (reason) {
      setProgress(chapter.id, stepId, { done: !!before?.done, completedAt: before?.completedAt ?? null });
      setError(reason instanceof Error ? reason.message : 'Could not update this step');
    }
  };

  const titles = parseChapterLines(pasted);
  const tooLong = titles.filter(title => title.length > MAX_CHAPTER_TITLE).length;
  const addChapters = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject || !titles.length || tooLong) return;
    setAddBusy(true); setError('');
    let added = 0;
    try {
      for (const title of titles) { await apiRequest(`/study/subjects/${subject.id}/chapters`, token, { method: 'POST', body: JSON.stringify({ title }) }); added += 1; }
      setPasted(''); setAdding(false);
    } catch (reason) {
      setPasted(titles.slice(added).join('\n')); // keep only the lines that were not added yet
      setError(`${added ? `Added ${added} of ${titles.length} chapters. ` : ''}${reason instanceof Error ? reason.message : 'Could not add chapters'}`);
    } finally { setAddBusy(false); await load(true); }
  };

  if (loading) return <section className="study-page" aria-busy="true"><div className="study-skeleton study-skeleton-banner" /><div className="study-skeleton" /></section>;
  if (!subject) return <div className="study-error"><AlertTriangle size={17} /> {error || 'Subject not found'} <Link to="/study">Back to subjects</Link></div>;

  return (
    <section className="study-page study-diary-page">
      <div className="study-breadcrumb">
        <Link to="/study"><ArrowLeft size={15} /> All subjects</Link><span>/</span><span>{subject.name}</span>
        <Link className="study-customize" to={`/study/subjects/${subject.id}/steps`}><Settings2 size={15} /> Customize steps</Link>
      </div>

      <header className="study-head">
        <div><span className="study-eyebrow">Subject diary</span><h2>{subject.name}</h2><p>{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} · {steps.length} steps · Tap any step to update your progress.</p></div>
        <button className="study-primary" onClick={() => setAdding(value => !value)}><Plus size={17} /> <span className="study-btn-label">Add chapters</span></button>
      </header>

      {error && <p className="study-error" role="alert"><AlertTriangle size={17} /> {error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></p>}

      {next && (
        <button className="study-next" onClick={() => navigate(`/study/chapters/${next.chapter.id}`)}>
          <span className="study-next-icon"><ArrowRight size={20} /></span>
          <span className="study-next-text"><small>Next up</small><b>{next.chapter.title}</b><em>Continue with <i style={{ background: next.step.colour }} />{next.step.name}</em></span>
          <ArrowRight className="study-next-arrow" size={20} />
        </button>
      )}

      {adding && (
        <form className="study-paste-box" onSubmit={addChapters}>
          <label htmlFor="study-paste-chapters"><ClipboardPaste size={17} /> Paste or type your chapters <small>One chapter per line. Numbers and bullets are removed for you.</small></label>
          <textarea id="study-paste-chapters" rows={5} value={pasted} onChange={event => setPasted(event.target.value)} placeholder={'1. Cell structure\n2. Genetics\n3. Human physiology'} autoFocus />
          {titles.length > 0 && (
            <ul className="study-paste-preview" aria-label="Chapters that will be added">
              {titles.slice(0, 6).map((title, index) => <li key={index} className={title.length > MAX_CHAPTER_TITLE ? 'bad' : ''}><Check size={13} /> {title}</li>)}
              {titles.length > 6 && <li className="more">+ {titles.length - 6} more</li>}
            </ul>
          )}
          {tooLong > 0 && <p className="study-field-error">{tooLong} {tooLong === 1 ? 'line is' : 'lines are'} longer than {MAX_CHAPTER_TITLE} characters. Shorten {tooLong === 1 ? 'it' : 'them'} to continue.</p>}
          <div><button className="study-primary" disabled={addBusy || !titles.length || tooLong > 0}><Plus size={16} /> {addBusy ? 'Adding…' : `Add ${titles.length || ''} ${titles.length === 1 ? 'chapter' : 'chapters'}`}</button><button type="button" className="study-quiet" onClick={() => setAdding(false)}>Cancel</button></div>
        </form>
      )}

      {chapters.length > 0 && (
        <section className="study-overview">
          <div className="study-ring" style={pctStyle(totals.pct)} role="img" aria-label={`${totals.pct}% complete`}><b>{totals.pct}%</b><small>complete</small></div>
          <div className="study-overview-body">
            <div className="study-overview-head"><b>Overall progress</b><span>{totals.done} of {totals.total} steps done</span></div>
            <div className="study-bar big"><i style={{ width: `${totals.pct}%` }} /></div>
            <div className="study-step-bars compact">
              {steps.map(step => { const item = stepTotals(chapters, step); return <div key={step.id}><span><i style={{ background: step.colour }} />{step.name}<small>{item.done}/{item.total}</small></span><div className="study-bar thin"><i style={{ width: `${item.pct}%`, background: step.colour }} /></div></div>; })}
            </div>
          </div>
        </section>
      )}

      <div className="study-filters" role="tablist" aria-label="Filter chapters">
        {FILTERS.map(item => <button key={item} role="tab" aria-selected={filter === item} className={'study-pill' + (filter === item ? ' active' : '')} onClick={() => setFilter(item)}>{item}<span>{counts[item]}</span></button>)}
      </div>

      {filtered.length ? (
        <div className="study-diary-wrap">
          <div className="study-diary" style={{ '--study-columns': `minmax(210px, 1.3fr) repeat(${steps.length}, minmax(118px, 1fr)) minmax(104px, .6fr)`, minWidth: `${230 + steps.length * 122 + 110}px` } as CSSProperties}>
            <div className="study-diary-header"><span>Chapter</span>{steps.map(step => <span key={step.id}><i style={{ background: step.colour }} />{step.name}</span>)}<span>Progress</span></div>
            {filtered.map(chapter => {
              const pct = percentage(chapter, steps);
              return (
                <div className={'study-diary-row' + (pct === 100 ? ' is-complete' : '')} key={chapter.id}>
                  <button className="study-chapter-title" onClick={() => navigate(`/study/chapters/${chapter.id}`)}><b>{chapter.title}</b><small>{chapter.notes?.trim() ? 'Notes added' : 'Notes missing'} · View details</small></button>
                  <div className="study-chip-set">
                    {steps.map(step => {
                      const done = !!chapter.progress.find(item => item.stepId === step.id)?.done;
                      return (
                        <button key={step.id} className={'study-step-chip' + (done ? ' is-done' : '')} onClick={() => void toggle(chapter, step.id)} aria-label={`${chapter.title}: ${step.name} ${done ? 'complete' : 'not complete'}`} aria-pressed={done} style={stepStyle(step.colour)}>
                          {done ? <Check size={15} /> : <Circle size={15} />}<span className="chip-name">{step.name}</span><span className="chip-state">{done ? 'Done' : 'Mark done'}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button className="study-row-progress" onClick={() => navigate(`/study/chapters/${chapter.id}`)} aria-label={`${chapter.title}: ${doneCount(chapter, steps)} of ${steps.length} steps done`}><b>{pct}%</b><span className="study-bar thin"><i style={{ width: `${pct}%` }} /></span></button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="study-empty study-empty-inline">
          <span><BookOpen size={26} /></span>
          <h3>{filter === 'All chapters' ? 'No chapters yet' : `Nothing matches “${filter}”`}</h3>
          <p>{filter === 'All chapters' ? 'Paste your syllabus, one chapter per line, and your diary is ready.' : 'Try another filter, or go back to all chapters.'}</p>
          {filter === 'All chapters' ? <button className="study-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add chapters</button> : <button className="study-quiet" onClick={() => setFilter('All chapters')}>Show all chapters</button>}
        </div>
      )}
    </section>
  );
}
