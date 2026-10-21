import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarDays, Check, Loader2, MoreHorizontal, Pencil, Plus, Target, Trash2, Type, X } from 'lucide-react';
import { apiRequest } from '../services/api';

const shortDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function WeeklyTargetsPage({ targets, token, refresh, createRequested, closeCreate }: { targets: any[]; token: string; refresh: () => Promise<void>; createRequested: boolean; closeCreate: () => void }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false), [creatingBusy, setCreatingBusy] = useState(false), [tasks, setTasks] = useState(['']), [menu, setMenu] = useState<string | null>(null);
  const [error, setError] = useState(''), [editing, setEditing] = useState<any>(null), [editName, setEditName] = useState(''), [deleting, setDeleting] = useState<any>(null), [actionBusy, setActionBusy] = useState(false);
  useEffect(() => { const closeMenu = () => setMenu(null); document.addEventListener('click', closeMenu); return () => document.removeEventListener('click', closeMenu); }, []);
  const showForm = creating || createRequested;
  const close = () => { setCreating(false); closeCreate(); };
  const create = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (creatingBusy) return; setCreatingBusy(true); setError(''); const form = new FormData(event.currentTarget); try { const result = await apiRequest<any>('/weekly-targets', token, { method: 'POST', body: JSON.stringify({ name: String(form.get('name') || `Week ${targets.length + 1}`), weekStart: new Date(String(form.get('weekStart')) + 'T00:00:00').toISOString(), tasks: tasks.map(task => task.trim()).filter(Boolean) }) }); close(); setTasks(['']); navigate(`/weekly-targets/${result.data.id}`); void refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create weekly target'); } finally { setCreatingBusy(false); } };
  const remove = async () => { if (!deleting || actionBusy) return; setActionBusy(true); setError(''); try { await apiRequest(`/weekly-targets/${deleting.id}`, token, { method: 'DELETE' }); setDeleting(null); setMenu(null); await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete weekly target'); } finally { setActionBusy(false); } };
  const rename = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!editing || !editName.trim() || actionBusy) return; setActionBusy(true); setError(''); try { await apiRequest(`/weekly-targets/${editing.id}`, token, { method: 'PATCH', body: JSON.stringify({ name: editName.trim() }) }); setEditing(null); setMenu(null); await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not rename weekly target'); } finally { setActionBusy(false); } };
  const now = Date.now();

  return (
    <section className="panel full weekly-panel">
      <div className="task-page-head">
        <div>
          <h2>Weekly targets</h2>
          <p>Set meaningful goals and complete them one week at a time.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {showForm && (
        <section className="create-target">
          <div className="panel-title">
            <h2 className="title-with-icon"><span className="title-icon"><Target size={17} /></span>Create weekly target</h2>
          </div>
          <form onSubmit={event => void create(event)}>
            <Field label="Week name" name="name" icon={Type} defaultValue={`Week ${targets.length + 1}`} maxLength={80} />
            <Field label="Week starts" name="weekStart" type="date" icon={CalendarDays} defaultValue={new Date().toISOString().slice(0, 10)} />
          <div className="field">
              Tasks
              {tasks.map((task, index) => (
                <div className="task-draft" key={index}>
                  <span>Task {index + 1}</span>
                  <input required maxLength={160} value={task} onChange={event => setTasks(values => values.map((value, position) => position === index ? event.target.value : value))} placeholder="e.g. Maths topic 1 till topic 3" />
                  {tasks.length > 1 && <button type="button" className="delete" onClick={() => setTasks(values => values.filter((_, position) => position !== index))}><X size={13} /> Remove</button>}
                </div>
              ))}
              <button type="button" className="soft add-task-row" disabled={tasks.length >= 50} onClick={() => setTasks(values => values.length < 50 ? [...values, ''] : values)}><Plus size={14} /> {tasks.length >= 50 ? 'Maximum 50 tasks' : 'Add another task'}</button>
            </div>
            <div className="actions">
              <button className="primary" disabled={creatingBusy}>{creatingBusy ? <><Loader2 size={16} className="spin" /> Creating…</> : <><Check size={16} /> Create target</>}</button>
              <button type="button" className="soft" onClick={close}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <div className="plan-grid">
        {targets.map(target => {
          const done = target.tasks.filter((task: any) => task.completed).length, total = target.tasks.length, percent = total ? Math.round(done / total * 100) : 0;
          const current = new Date(target.weekStart).getTime() <= now && now <= new Date(target.weekEnd).getTime() + 86400000;
          return (
            <article className="revision-plan-card target-card" key={target.id}>
              <div className="card-menu">
                <button className="icon-button" aria-label="Target options" onClick={event => { event.stopPropagation(); setMenu(menu === target.id ? null : target.id); }}><MoreHorizontal size={18} /></button>
                <div className={'menu-popover' + (menu === target.id ? ' show' : '')}>
                  <button onClick={() => { setEditing(target); setEditName(target.name); setError(''); }}><Pencil size={14} /> Edit target</button>
                  <button className="danger" onClick={() => { setDeleting(target); setError(''); }}><Trash2 size={14} /> Delete target</button>
                </div>
              </div>
              <div className="plan-head">
                <span className="plan-icon"><Target size={19} /></span>
                <div><h2>{target.name}</h2><p>{shortDate(target.weekStart)} – {shortDate(target.weekEnd)}</p></div>
              </div>
              <div className="plan-meta">
                <span>{done}/{total} tasks complete</span>
                {percent === 100 && total > 0 ? <em className="badge completed">Completed</em> : current ? <em className="badge upcoming">This week</em> : null}
              </div>
              <div className="progress"><i style={{ width: percent + '%' }} /></div>
              <div className="plan-foot">
                <b>{percent}% done</b>
                <button className="soft" onClick={() => navigate(`/weekly-targets/${target.id}`)}>Open <ArrowRight size={14} /></button>
              </div>
            </article>
          );
        })}
        {!targets.length && !showForm && (
          <div className="empty-state polished-empty">
            <b>No weekly targets yet</b>
            <p>Create your first weekly target to organise the tasks you want to complete.</p>
            <button className="primary" onClick={() => setCreating(true)}><Plus size={16} /> Add a target</button>
          </div>
        )}
      </div>
      {(editing || deleting) && <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget && !actionBusy) { setEditing(null); setDeleting(null); } }}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="weekly-target-dialog-title">
          <div className="modal-head"><h2 id="weekly-target-dialog-title">{editing ? 'Rename weekly target' : 'Delete weekly target?'}</h2><button className="icon-button" aria-label="Close dialog" disabled={actionBusy} onClick={() => { setEditing(null); setDeleting(null); }}><X size={18} /></button></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {editing ? <form onSubmit={event => void rename(event)}><label className="field">Target name<input autoFocus maxLength={80} value={editName} onChange={event => setEditName(event.target.value)} required /></label><div className="actions"><button className="primary" disabled={actionBusy || !editName.trim()}>{actionBusy ? 'Saving…' : 'Save name'}</button><button type="button" className="soft" disabled={actionBusy} onClick={() => setEditing(null)}>Cancel</button></div></form>
            : <><p>This will permanently remove “{deleting?.name}” and all of its tasks.</p><div className="actions"><button className="delete" disabled={actionBusy} onClick={() => void remove()}>{actionBusy ? 'Deleting…' : 'Delete target'}</button><button className="soft" disabled={actionBusy} onClick={() => setDeleting(null)}>Keep target</button></div></>}
        </div>
      </div>}
    </section>
  );
}

function Field({ label, name, type = 'text', defaultValue, icon: Icon, maxLength }: { label: string; name: string; type?: string; defaultValue?: string; icon: LucideIcon; maxLength?: number }) {
  return (
    <label className="field">
      {label}
      <span className="input-icon"><Icon size={17} /><input required name={name} type={type} defaultValue={defaultValue} maxLength={maxLength} /></span>
    </label>
  );
}
