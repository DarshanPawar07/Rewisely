import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarDays, Check, Loader2, MoreHorizontal, Pencil, Plus, Target, Trash2, Type, X } from 'lucide-react';
import { apiRequest } from '../services/api';

const shortDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function WeeklyTargetsPage({ targets, token, refresh, createRequested, closeCreate }: { targets: any[]; token: string; refresh: () => Promise<void>; createRequested: boolean; closeCreate: () => void }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false), [creatingBusy, setCreatingBusy] = useState(false), [tasks, setTasks] = useState(['']), [menu, setMenu] = useState<string | null>(null);
  useEffect(() => { const closeMenu = () => setMenu(null); document.addEventListener('click', closeMenu); return () => document.removeEventListener('click', closeMenu); }, []);
  const showForm = creating || createRequested;
  const close = () => { setCreating(false); closeCreate(); };
  const create = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (creatingBusy) return; setCreatingBusy(true); const form = new FormData(event.currentTarget); try { const result = await apiRequest<any>('/weekly-targets', token, { method: 'POST', body: JSON.stringify({ name: String(form.get('name') || `Week ${targets.length + 1}`), weekStart: new Date(String(form.get('weekStart')) + 'T00:00:00').toISOString(), tasks: tasks.map(task => task.trim()).filter(Boolean) }) }); close(); setTasks(['']); navigate(`/weekly-targets/${result.data.id}`); void refresh(); } catch (error) { window.alert(error instanceof Error ? error.message : 'Could not create weekly target'); } finally { setCreatingBusy(false); } };
  const remove = async (id: string) => { if (!window.confirm('Delete this weekly target?')) return; await apiRequest(`/weekly-targets/${id}`, token, { method: 'DELETE' }); setMenu(null); await refresh(); };
  const rename = async (target: any) => { const name = window.prompt('Target name', target.name); if (!name?.trim()) return; await apiRequest(`/weekly-targets/${target.id}`, token, { method: 'PATCH', body: JSON.stringify({ name: name.trim() }) }); await refresh(); };
  const now = Date.now();

  return (
    <section className="panel full weekly-panel">
      <div className="task-page-head">
        <div>
          <h2>Weekly targets</h2>
          <p>Set meaningful goals and complete them one week at a time.</p>
        </div>
      </div>

      {showForm && (
        <section className="create-target">
          <div className="panel-title">
            <h2 className="title-with-icon"><span className="title-icon"><Target size={17} /></span>Create weekly target</h2>
          </div>
          <form onSubmit={event => void create(event)}>
            <Field label="Week name" name="name" icon={Type} defaultValue={`Week ${targets.length + 1}`} />
            <Field label="Week starts" name="weekStart" type="date" icon={CalendarDays} defaultValue={new Date().toISOString().slice(0, 10)} />
            <div className="field">
              Tasks
              {tasks.map((task, index) => (
                <div className="task-draft" key={index}>
                  <span>Task {index + 1}</span>
                  <input required value={task} onChange={event => setTasks(values => values.map((value, position) => position === index ? event.target.value : value))} placeholder="e.g. Maths topic 1 till topic 3" />
                  {tasks.length > 1 && <button type="button" className="delete" onClick={() => setTasks(values => values.filter((_, position) => position !== index))}><X size={13} /> Remove</button>}
                </div>
              ))}
              <button type="button" className="soft add-task-row" onClick={() => setTasks(values => [...values, ''])}><Plus size={14} /> Add another task</button>
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
                  <button onClick={() => void rename(target)}><Pencil size={14} /> Edit target</button>
                  <button className="danger" onClick={() => void remove(target.id)}><Trash2 size={14} /> Delete target</button>
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
    </section>
  );
}

function Field({ label, name, type = 'text', defaultValue, icon: Icon }: { label: string; name: string; type?: string; defaultValue?: string; icon: LucideIcon }) {
  return (
    <label className="field">
      {label}
      <span className="input-icon"><Icon size={17} /><input required name={name} type={type} defaultValue={defaultValue} /></span>
    </label>
  );
}
