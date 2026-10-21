import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, Info, Loader2, Plus, RotateCcw, Save, Settings2, Undo2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { STUDY_FEATURE_LABEL } from './labels';
import { MAX_STEPS, MAX_STEP_NAME, STEP_COLOURS, formatWorth, isStepDone, nameKey, normaliseName, stepStyle, subjectTotals } from './studyHelpers';
import type { StudyStep, StudySubject } from './studyTypes';

type DraftStep = { uid: string; id?: string; name: string; colour: string };
let counter = 0;
const uid = () => `draft-${Date.now().toString(36)}-${counter++}`;
const fromSaved = (step: StudyStep): DraftStep => ({ uid: step.id, id: step.id, name: step.name, colour: step.colour });
const preset = (names: string[], colours: number[]): DraftStep[] => names.map((name, index) => ({ uid: uid(), name, colour: STEP_COLOURS[colours[index]] }));
const PRESETS: { label: string; hint: string; build: () => DraftStep[] }[] = [
  { label: 'Classic', hint: '4 steps', build: () => preset(['Learn', 'Short notes', 'Revise', 'Mock test'], [0, 1, 2, 3]) },
  { label: 'Exam sprint', hint: '3 steps', build: () => preset(['Learn', 'Revise', 'Mock test'], [0, 2, 3]) },
  { label: 'Deep study', hint: '6 steps', build: () => preset(['Learn', 'Prepare notes', 'Short notes', 'Revise', 'Practice questions', 'Mock interview'], [0, 1, 2, 3, 4, 5]) },
];

type Impact = { subject: StudySubject; removed: StudyStep[]; added: number; hiddenTicks: number; dropping: number; before: number; after: number };

export function StudyStepsPage({ token }: { token: string }) {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [scope, setScope] = useState<'subject' | 'all'>('subject');
  const [loading, setLoading] = useState(true);
  const [allSubjectsLoaded, setAllSubjectsLoaded] = useState(false);
  const [allSubjectsLoading, setAllSubjectsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [focusUid, setFocusUid] = useState('');

  const subject = subjects.find(item => item.id === subjectId) || null;

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    apiRequest<StudySubject>(`/study/subjects/${subjectId}`, token)
      .then(result => {
        if (!live) return;
        setSubjects([result.data]);
        setAllSubjectsLoaded(false);
        setSteps(result.data.studySteps.map(fromSaved));
      })
      .catch(reason => { if (live) setError(reason instanceof Error ? reason.message : 'Could not load subject steps'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [subjectId, token]);

  useEffect(() => {
    if (!focusUid) return;
    const input = document.getElementById(`study-step-${focusUid}`) as HTMLInputElement | null;
    input?.focus(); input?.select(); setFocusUid('');
  }, [focusUid, steps]);

  // ---- validation, shown live next to each row ----
  const rowErrors = useMemo(() => steps.map((step, index) => {
    const name = normaliseName(step.name);
    if (!name) return 'Give this step a name';
    if (steps.some((other, i) => i !== index && nameKey(other.name) === nameKey(name))) return 'Another step already uses this name';
    return '';
  }), [steps]);
  const valid = steps.length >= 1 && steps.length <= MAX_STEPS && rowErrors.every(item => !item);

  const savedSteps = subject?.studySteps || [];
  const changed = steps.length !== savedSteps.length || steps.some((step, index) => step.id !== savedSteps[index]?.id || normaliseName(step.name) !== normaliseName(savedSteps[index]?.name || '') || step.colour !== savedSteps[index]?.colour);
  const dirty = changed || scope === 'all';

  // ---- what will happen to existing progress (mirrors how the server matches steps) ----
  const impacts: Impact[] = useMemo(() => {
    if (!subject || !valid) return [];
    const sourceNames = new Map(subject.studySteps.map(step => [step.id, nameKey(step.name)]));
    const targets = scope === 'all' ? subjects : [subject];
    return targets.map(target => {
      const used = new Set<string>();
      const take = (match: (step: StudyStep) => boolean) => { const found = target.studySteps.find(step => !used.has(step.id) && match(step)); if (found) used.add(found.id); return found; };
      const mapped = steps.map(step => {
        let found: StudyStep | undefined;
        if (step.id) found = target.id === subject.id ? take(item => item.id === step.id) : take(item => nameKey(item.name) === sourceNames.get(step.id!));
        return found || take(item => nameKey(item.name) === nameKey(step.name));
      });
      const removed = target.studySteps.filter(step => !used.has(step.id));
      const chapters = target.studyChapters;
      const before = subjectTotals(chapters, target.studySteps);
      const afterDone = chapters.reduce((sum, chapter) => sum + mapped.filter(step => step && isStepDone(chapter, step.id)).length, 0);
      const afterTotal = chapters.length * steps.length;
      const hiddenTicks = chapters.reduce((sum, chapter) => sum + removed.filter(step => isStepDone(chapter, step.id)).length, 0);
      const dropping = target.studySteps.length ? chapters.filter(chapter => target.studySteps.every(step => isStepDone(chapter, step.id)) && !mapped.every(Boolean)).length : 0;
      return { subject: target, removed, added: mapped.filter(item => !item).length, hiddenTicks, dropping, before: before.pct, after: afterTotal ? Math.round(afterDone / afterTotal * 100) : 0 };
    });
  }, [subject, subjects, steps, scope, valid]);
  const own = impacts.find(item => item.subject.id === subject?.id);
  const affected = impacts.filter(item => item.removed.length || item.added || item.before !== item.after);
  const needsReview = changed || scope === 'all' ? affected.some(item => item.removed.length || item.dropping || item.before !== item.after) : false;
  const removedSaved = own?.removed || [];

  // ---- editing ----
  const touch = () => { setSaved(false); setError(''); };
  const insert = (at: number) => {
    if (steps.length >= MAX_STEPS) return;
    let name = 'New step', n = 2;
    while (steps.some(step => nameKey(step.name) === nameKey(name))) name = `New step ${n++}`;
    const colour = STEP_COLOURS.find(item => !steps.some(step => step.colour === item)) || STEP_COLOURS[at % STEP_COLOURS.length];
    const draft: DraftStep = { uid: uid(), name, colour };
    setSteps(current => [...current.slice(0, at), draft, ...current.slice(at)]);
    setFocusUid(draft.uid); touch();
  };
  const move = (index: number, direction: -1 | 1) => { setSteps(current => { const copy = [...current]; const target = index + direction; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; }); touch(); };
  const remove = (index: number) => { if (steps.length <= 1) return; setSteps(current => current.filter((_, i) => i !== index)); touch(); };
  const restore = (step: StudyStep) => { if (steps.length >= MAX_STEPS) return; setSteps(current => [...current, fromSaved(step)]); touch(); };
  const usePreset = (index: number) => {
    const currentByName = new Map(steps.filter(step => step.id).map(step => [nameKey(step.name), step]));
    const selected = PRESETS[index].build().map(step => {
      const existing = currentByName.get(nameKey(step.name));
      return existing ? { ...step, uid: existing.uid, id: existing.id } : step;
    });
    setSteps(selected); touch();
  };
  const rename = (index: number, value: string) => { setSteps(current => current.map((item, i) => i === index ? { ...item, name: value.slice(0, MAX_STEP_NAME) } : item)); touch(); };
  const activePreset = PRESETS.findIndex(item => { const built = item.build(); return built.length === steps.length && built.every((step, i) => nameKey(step.name) === nameKey(steps[i].name)); });

  const commit = async () => {
    setConfirming(false); setBusy(true); setError('');
    try {
      const payload = steps.map(step => ({ ...(step.id ? { id: step.id } : {}), name: normaliseName(step.name), colour: step.colour }));
      const result = await apiRequest<StudySubject>(`/study/subjects/${subjectId}/steps`, token, { method: 'PUT', body: JSON.stringify({ steps: payload, scope }) });
      if (scope === 'all') {
        const refreshed = await apiRequest<StudySubject[]>('/study', token);
        setSubjects(refreshed.data); setAllSubjectsLoaded(true);
      } else {
        setSubjects([result.data]); setAllSubjectsLoaded(false);
      }
      setSteps(result.data.studySteps.map(fromSaved));
      setSaved(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save steps'); }
    finally { setBusy(false); }
  };
  const save = () => { if (!valid || busy) return; if (needsReview) setConfirming(true); else void commit(); };
  const chooseScope = async (next: 'subject' | 'all') => {
    if (next === 'subject') { setScope(next); return; }
    if (allSubjectsLoaded) { setScope(next); return; }
    setAllSubjectsLoading(true); setError('');
    try {
      const result = await apiRequest<StudySubject[]>('/study', token);
      setSubjects(result.data); setAllSubjectsLoaded(true); setScope(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load other subjects for the progress preview');
    } finally { setAllSubjectsLoading(false); }
  };
  const cancel = () => { if (changed && !window.confirm('Leave without saving your changes?')) return; navigate(`/study/subjects/${subjectId}`); };

  if (loading) return <section className="study-page" aria-busy="true"><div className="study-skeleton study-skeleton-banner" /><div className="study-skeleton" /></section>;
  if (!subject) return <div className="study-error"><AlertTriangle size={17} /> {error || 'Subject not found'} <Link to="/study">Back to subjects</Link></div>;

  const atCap = steps.length >= MAX_STEPS;
  const worth = formatWorth(steps.length);
  return (
    <section className="study-page study-step-editor-page">
      <div className="study-breadcrumb"><Link to="/study"><ArrowLeft size={15} /> {STUDY_FEATURE_LABEL}</Link><span>/</span><Link to={`/study/subjects/${subject.id}`}>{subject.name}</Link><span>/</span><span>Customize steps</span></div>
      <header className="study-head"><div><span className="study-eyebrow"><Settings2 size={14} /> Your workflow</span><h2>Make the steps your own</h2><p>These steps define how you track every chapter in <b>{subject.name}</b>.</p></div></header>
      {error && <p className="study-error" role="alert"><AlertTriangle size={17} /> {error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></p>}
      {saved && <p className="study-toast ok" role="status"><Check size={16} /> Steps saved. Progress has been recalculated. <Link to={`/study/subjects/${subject.id}`}>Back to {subject.name}</Link></p>}

      <div className="study-editor-layout">
        <section className="study-editor-card">
          <div className="study-section-heading"><div><h3>Chapter steps</h3><p>Reorder, rename, add or remove. Each step keeps its colour when you move it.</p></div><span className={'study-count-badge' + (atCap ? ' full' : '')}>{steps.length}/{MAX_STEPS}</span></div>

          <div className="study-presets"><span>Quick start</span>{PRESETS.map((item, index) => <button key={item.label} className={activePreset === index ? 'active' : ''} onClick={() => usePreset(index)}>{item.label}<small>{item.hint}</small></button>)}</div>

          <div className="study-step-list">
            <InsertButton disabled={atCap} onClick={() => insert(0)} />
            {steps.map((step, index) => (
              <div className="study-step-item-wrap" key={step.uid}>
                <div className={'study-step-item' + (rowErrors[index] ? ' has-error' : '')}>
                  <span className="study-step-number" style={stepStyle(step.colour)}>{index + 1}</span>
                  <input id={`study-step-${step.uid}`} aria-label={`Step ${index + 1} name`} aria-invalid={!!rowErrors[index]} maxLength={MAX_STEP_NAME} value={step.name} onChange={event => rename(index, event.target.value)} />
                  {step.name.length >= MAX_STEP_NAME - 8 && <small className="study-char-count">{step.name.length}/{MAX_STEP_NAME}</small>}
                  <div className="study-step-controls">
                    <button aria-label={`Move ${step.name || 'step'} up`} title="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button>
                    <button aria-label={`Move ${step.name || 'step'} down`} title="Move down" disabled={index === steps.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button>
                    <button className="study-remove-step" aria-label={`Remove ${step.name || 'step'}`} title={steps.length === 1 ? 'At least one step is required' : 'Remove step'} disabled={steps.length === 1} onClick={() => remove(index)}><X size={17} /></button>
                  </div>
                </div>
                {rowErrors[index] && <p className="study-field-error">{rowErrors[index]}</p>}
                <InsertButton disabled={atCap} onClick={() => insert(index + 1)} />
              </div>
            ))}
          </div>
          {atCap && <p className="study-cap-note"><Info size={14} /> You have reached the limit of {MAX_STEPS} steps. Remove one to add another.</p>}

          {removedSaved.length > 0 && (
            <div className="study-removed"><b>Removed from this subject</b><p>Their notes and scores are kept safely. Re-add a step to bring them back.</p>
              <div>{removedSaved.map(step => <button key={step.id} onClick={() => restore(step)} disabled={atCap} style={stepStyle(step.colour)}><Undo2 size={14} /> {step.name}</button>)}</div>
            </div>
          )}

          {own && valid && changed && (own.removed.length > 0 || own.dropping > 0 || own.added > 0 || own.before !== own.after) && (
            <div className={'study-impact' + (own.removed.length || own.dropping ? ' warn' : '')} role="status">
              <span>{own.removed.length || own.dropping ? <AlertTriangle size={18} /> : <Info size={18} />}</span>
              <div>
                <b>Your progress will be recalculated</b>
                <ul>
                  {own.removed.length > 0 && <li>Removing {own.removed.map(step => `“${step.name}”`).join(', ')} hides {own.hiddenTicks} completed {own.hiddenTicks === 1 ? 'tick' : 'ticks'}. Notes and scores are kept.</li>}
                  {own.dropping > 0 && <li>{own.dropping} {own.dropping === 1 ? 'chapter is' : 'chapters are'} at 100% now and will drop below 100%.</li>}
                  {own.added > 0 && <li>{own.added} new {own.added === 1 ? 'step starts' : 'steps start'} as not done for every chapter.</li>}
                  <li>Subject progress: <b>{own.before}%</b> → <b>{own.after}%</b></li>
                </ul>
              </div>
            </div>
          )}

          <fieldset className="study-scope"><legend className="sr-only">Apply changes to</legend>
            <div><b>Apply changes to</b><small>Subjects can keep their own workflows.</small></div>
            <label className={scope === 'subject' ? 'on' : ''}><input type="radio" name="study-scope" checked={scope === 'subject'} onChange={() => void chooseScope('subject')} /> Just {subject.name}</label>
            <label className={scope === 'all' ? 'on' : ''}><input type="radio" name="study-scope" checked={scope === 'all'} disabled={allSubjectsLoading} onChange={() => void chooseScope('all')} /> {allSubjectsLoading ? 'Loading subjects…' : allSubjectsLoaded ? `All subjects (${subjects.length})` : 'All subjects'}</label>
          </fieldset>
          {scope === 'all' && subjects.length > 1 && (
            <div className="study-impact warn" role="status"><span><AlertTriangle size={18} /></span><div><b>This replaces the steps in every subject</b>
              <ul>{impacts.filter(item => item.subject.id !== subject.id).map(item => <li key={item.subject.id}><b>{item.subject.name}</b>: {item.before}% → {item.after}%{item.removed.length ? ` · ${item.removed.length} ${item.removed.length === 1 ? 'step' : 'steps'} hidden` : ''}</li>)}</ul></div></div>
          )}

          <div className="study-editor-actions">
            {dirty ? (
              <button className="study-primary" disabled={busy || !valid} onClick={save}>{busy ? <Loader2 className="spin" size={16} /> : <Save size={16} />} {busy ? 'Saving…' : !valid ? 'Fix steps to save' : 'Save steps'}</button>
            ) : (
              <button className="study-primary" onClick={() => navigate(`/study/subjects/${subject.id}`)}><Check size={16} /> Continue to {subject.name}</button>
            )}
            <button className="study-quiet" onClick={cancel}>Cancel</button>
            {!valid && <span className="study-hint">Fix the highlighted steps to save.</span>}
            {valid && !dirty && <span className="study-hint">Your steps are saved. Continue to your subject diary.</span>}
          </div>
        </section>

        <aside className="study-preview-card">
          <span className="study-eyebrow">Live preview</span>
          <h3>A chapter, step by step</h3>
          <p>This is how your workflow will look in the subject diary.</p>
          <div className="study-preview-chapter"><b>Sample chapter</b><small>1 of {steps.length} steps done</small></div>
          <div className="study-bar big"><i style={{ width: `${steps.length ? 100 / steps.length : 0}%` }} /></div>
          <div className="study-preview-chips">{steps.map((step, index) => <span key={step.uid} className={index === 0 ? 'done' : ''} style={stepStyle(step.colour)}>{index === 0 ? <Check size={13} /> : <i />}{normaliseName(step.name) || 'Unnamed'}</span>)}</div>
          <div className="study-preview-note"><span>{steps.length}</span><div><b>{steps.length} {steps.length === 1 ? 'step' : 'steps'} in your plan</b><small>Each step is worth {worth}% of a chapter.</small></div></div>
          <button className="study-preview-reset" onClick={() => usePreset(0)}><RotateCcw size={14} /> Reset to Classic</button>
        </aside>
      </div>

      {confirming && own && (
        <div className="study-dialog-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setConfirming(false); }}>
          <div className="study-dialog" role="dialog" aria-modal="true" aria-label="Review your changes">
            <span className="study-dialog-icon"><AlertTriangle size={22} /></span>
            <h3>Review before saving</h3>
            <p>Saving recalculates progress. Nothing is deleted: notes and scores for removed steps are kept.</p>
            <ul>
              {affected.map(item => <li key={item.subject.id}><b>{item.subject.name}</b>: progress {item.before}% → {item.after}%{item.removed.length ? `, hiding ${item.removed.map(step => `“${step.name}”`).join(', ')}` : ''}{item.dropping ? `, ${item.dropping} ${item.dropping === 1 ? 'chapter drops' : 'chapters drop'} below 100%` : ''}</li>)}
            </ul>
            <div><button className="study-quiet" onClick={() => setConfirming(false)}>Keep editing</button><button className="study-primary" onClick={() => void commit()}><Save size={16} /> Save steps</button></div>
          </div>
        </div>
      )}
    </section>
  );
}

function InsertButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return <button className="study-insert-step" disabled={disabled} onClick={onClick}><Plus size={15} /> Add a step here</button>;
}
