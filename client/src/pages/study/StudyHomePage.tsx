import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Layers, ListChecks, MoreHorizontal, Pencil, Plus, Settings2, Sparkles, TrendingUp, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { STUDY_FEATURE_LABEL } from './labels';
import { findNextUpAcrossSubjects, stepTotals, subjectTotals, toneStyle } from './studyHelpers';
import type { StudySubject } from './studyTypes';

export function StudyHomePage({ token }: { token: string }) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<StudySubject | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<StudySubject | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    apiRequest<StudySubject[]>('/study', token)
      .then(result => { if (live) setSubjects(result.data); })
      .catch(reason => { if (live) setError(reason instanceof Error ? reason.message : 'Could not load your study subjects'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token]);

  const next = findNextUpAcrossSubjects(subjects);
  const chapterCount = subjects.reduce((sum, subject) => sum + subject.studyChapters.length, 0);
  const totals = subjects.reduce((sum, subject) => { const item = subjectTotals(subject.studyChapters, subject.studySteps); return { done: sum.done + item.done, total: sum.total + item.total }; }, { done: 0, total: 0 });
  const overall = totals.total ? Math.round(totals.done / totals.total * 100) : 0;

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const result = await apiRequest<StudySubject>('/study/subjects', token, { method: 'POST', body: JSON.stringify({ name: String(form.get('name') || '').trim(), description: String(form.get('description') || '').trim() }) });
      navigate(`/study/subjects/${result.data.id}/steps`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create this subject');
      setBusy(false);
    }
  };

  const updateSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const description = String(form.get('description') || '').trim();
    if (!name) { setError('Subject name is required'); return; }
    setSavingEdit(true); setError('');
    try {
      await apiRequest(`/subjects/${editing.id}`, token, { method: 'PATCH', body: JSON.stringify({ name, description }) });
      setSubjects(current => current.map(item => item.id === editing.id ? { ...item, name, description } : item));
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update subject');
    } finally { setSavingEdit(false); }
  };

  const deleteSubject = async () => {
    if (!deleting) return;
    const subject = deleting;
    setDeletingBusy(true);
    setError('');
    try {
      await apiRequest(`/subjects/${subject.id}`, token, { method: 'DELETE' });
      setSubjects(current => current.filter(item => item.id !== subject.id));
      setDeleting(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete subject');
    } finally { setDeletingBusy(false); }
  };

  if (loading) return <section className="study-page" aria-busy="true"><div className="study-skeleton study-skeleton-banner" /><div className="study-subject-grid"><div className="study-skeleton" /><div className="study-skeleton" /><div className="study-skeleton" /></div></section>;

  return (
    <section className="study-page">
      <header className="hero-banner">
        <div className="hero-copy">
          <span className="hero-kicker"><Sparkles size={14} /> Your learning roadmap</span>
          <h2>{STUDY_FEATURE_LABEL}</h2>
          <p>Turn every subject into a clear, chapter-by-chapter path, and tick off each step as you go.</p>
        </div>
        <button className="hero-button" onClick={() => setCreating(value => !value)}><Plus size={17} /> New subject</button>
      </header>

      {error && <p className="study-error" role="alert"><AlertTriangle size={17} /> {error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></p>}

      {subjects.length > 0 && (
        <div className="stats study-stats">
          <Stat icon={<BookOpen />} tone="violet" value={subjects.length} label={subjects.length === 1 ? 'Subject' : 'Subjects'} />
          <Stat icon={<Layers />} tone="blue" value={chapterCount} label={chapterCount === 1 ? 'Chapter' : 'Chapters'} />
          <Stat icon={<ListChecks />} tone="green" value={`${totals.done}/${totals.total}`} label="Steps completed" />
          <Stat icon={<TrendingUp />} tone="orange" value={`${overall}%`} label="Overall progress" />
        </div>
      )}

      {next && (
        <button className="study-next" onClick={() => navigate(`/study/chapters/${next.chapter.id}`)}>
          <span className="study-next-icon"><ArrowRight size={20} /></span>
          <span className="study-next-text"><small>Next up · {next.subject.name}</small><b>{next.chapter.title}</b><em>Continue with <i style={{ background: next.step.colour }} />{next.step.name}</em></span>
          <ArrowRight className="study-next-arrow" size={20} />
        </button>
      )}

      {creating && (
        <form className="study-create" onSubmit={create}>
          <label>Subject name<input name="name" required maxLength={80} autoFocus placeholder="e.g. Biology" /></label>
          <label>Short description<input name="description" maxLength={500} placeholder="Optional" /></label>
          <div><button className="study-primary" disabled={busy}><Plus size={16} /> {busy ? 'Creating…' : 'Create subject'}</button><button type="button" className="study-quiet" onClick={() => setCreating(false)}>Cancel</button></div>
        </form>
      )}

      {!subjects.length ? (
        <div className="study-empty"><span><BookOpen size={28} /></span><h3>Your study plan starts here</h3><p>Add a subject to build a chapter roadmap and track progress as you learn.</p><button className="study-primary" onClick={() => setCreating(true)}><Plus size={17} /> New subject</button></div>
      ) : (
        <div className="study-subject-grid">
          {subjects.map((subject, index) => <SubjectCard key={subject.id} subject={subject} index={index} onOpen={() => navigate(`/study/subjects/${subject.id}`)} onCustomize={() => navigate(`/study/subjects/${subject.id}/steps`)} onEdit={() => setEditing(subject)} onDelete={() => setDeleting(subject)} />)}
        </div>
      )}
      {editing && <SubjectEditDialog subject={editing} busy={savingEdit} onClose={() => setEditing(null)} onSave={updateSubject} />}
      {deleting && <SubjectDeleteDialog subject={deleting} busy={deletingBusy} onClose={() => setDeleting(null)} onConfirm={() => void deleteSubject()} />}
    </section>
  );
}

function Stat({ icon, tone, value, label }: { icon: ReactNode; tone: string; value: string | number; label: string }) {
  return <div className="stat"><span className={'stat-icon ' + tone}>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;
}

function SubjectCard({ subject, index, onOpen, onCustomize, onEdit, onDelete }: { subject: StudySubject; index: number; onOpen: () => void; onCustomize: () => void; onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const chapters = subject.studyChapters || [], steps = subject.studySteps || [];
  const { done, total, pct } = subjectTotals(chapters, steps);
  return (
    <article className="study-subject-card" style={toneStyle(index)}>
      <div className="study-card-menu">
        <button type="button" className="icon-button" aria-label={`Options for ${subject.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><MoreHorizontal size={19} /></button>
        {menuOpen && <div className="menu-popover show study-subject-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(); }}><Pencil size={14} /> Edit subject</button>
          <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onDelete(); }}><Trash2 size={14} /> Delete subject</button>
        </div>}
      </div>
      <button className="study-card-main" onClick={onOpen}>
        <span className="study-card-icon"><BookOpen size={20} /></span>
        <span className="study-card-title"><b>{subject.name}</b><small>{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} · {steps.length} steps</small></span>
        <ArrowRight size={18} />
      </button>

      <div className="study-big-progress">
        <div><b>{pct}%</b><span>overall progress · {done}/{total} steps</span></div>
        <div className="study-bar" role="progressbar" aria-label={`${subject.name} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="study-step-bars">
        {steps.map(step => {
          const item = stepTotals(chapters, step);
          return (
            <div key={step.id}>
              <span><i style={{ background: step.colour }} />{step.name}<small>{item.done}/{item.total}</small></span>
              <div className="study-bar thin"><i style={{ width: `${item.pct}%`, background: step.colour }} /></div>
            </div>
          );
        })}
      </div>

      <div className="study-card-actions">
        <button className="study-link" onClick={onCustomize}><Settings2 size={15} /> Customize steps</button>
        <button className="study-quiet" onClick={onOpen}>Open subject <ArrowRight size={14} /></button>
      </div>
    </article>
  );
}

function SubjectEditDialog({ subject, busy, onClose, onSave }: { subject: StudySubject; busy: boolean; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="study-dialog-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <form className="study-dialog study-subject-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-study-subject-title" onSubmit={onSave}>
      <span className="study-dialog-icon"><BookOpen size={21} /></span>
      <h3 id="edit-study-subject-title">Edit subject</h3>
      <p>Update the name or description. Your chapters and revision progress will stay linked.</p>
      <label className="study-dialog-field">Subject name<input name="name" required maxLength={80} defaultValue={subject.name} autoFocus /></label>
      <label className="study-dialog-field">Description<input name="description" maxLength={500} defaultValue={subject.description || ''} placeholder="Optional" /></label>
      <div><button type="button" className="study-quiet" disabled={busy} onClick={onClose}>Cancel</button><button className="study-primary" disabled={busy}>{busy ? 'Saving…' : 'Save subject'}</button></div>
    </form>
  </div>;
}

function SubjectDeleteDialog({ subject, busy, onClose, onConfirm }: { subject: StudySubject; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="study-dialog-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="study-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-study-subject-title">
      <span className="study-dialog-icon"><Trash2 size={21} /></span>
      <h3 id="delete-study-subject-title">Delete {subject.name}?</h3>
      <p>This permanently removes this subject, its chapters and step progress, and linked revision topics. This cannot be undone.</p>
      <div><button className="study-quiet" disabled={busy} onClick={onClose}>Keep subject</button><button className="study-danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete subject'}</button></div>
    </div>
  </div>;
}
