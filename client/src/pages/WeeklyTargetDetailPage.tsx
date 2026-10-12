import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Loader2, Plus, Target } from 'lucide-react';
import { apiRequest } from '../services/api';

const shortDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function WeeklyTargetDetailPage({ token }: { token: string }) {
  const { targetId = '' } = useParams();
  const navigate = useNavigate();
  const [target, setTarget] = useState<any>(null);
  const [task, setTask] = useState('');
  const [error, setError] = useState('');
  const load = async () => { try { const result = await apiRequest<any>(`/weekly-targets/${targetId}`, token); setTarget(result.data); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load weekly target'); } };
  useEffect(() => { void load(); }, [targetId, token]);
  const toggle = async (item: any) => { await apiRequest(`/weekly-targets/${targetId}/tasks/${item.id}`, token, { method: 'PATCH', body: JSON.stringify({ completed: !item.completed }) }); await load(); };
  const add = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!task.trim()) return; await apiRequest(`/weekly-targets/${targetId}/tasks`, token, { method: 'POST', body: JSON.stringify({ title: task }) }); setTask(''); await load(); };

  if (error) return (
    <section className="panel full weekly-panel">
      <div className="empty-state">
        <span className="empty-art"><Target size={26} /></span>
        <p>{error}</p>
        <p><button className="soft" onClick={() => navigate('/weekly-targets')}><ArrowLeft size={14} /> Back to weekly targets</button></p>
      </div>
    </section>
  );
  if (!target) return (
    <section className="panel full weekly-panel">
      <div className="empty-state"><span className="empty-art"><Loader2 size={26} className="spin" /></span><p>Loading this weekly target…</p></div>
    </section>
  );

  const done = target.tasks.filter((item: any) => item.completed).length;
  const total = target.tasks.length;
  const percent = total ? Math.round(done / total * 100) : 0;

  return (
    <section className="panel full weekly-panel">
      <div className="task-page-head">
        <div>
          <h2 className="title-with-icon"><span className="title-icon"><Target size={17} /></span>Tasks for {target.name}</h2>
          <p><CalendarDays size={13} style={{ verticalAlign: '-2px' }} /> {shortDate(target.weekStart)} – {shortDate(target.weekEnd)} · {done} of {total} completed</p>
        </div>
        <button className="soft" onClick={() => navigate('/weekly-targets')}><ArrowLeft size={14} /> All targets</button>
      </div>

      {total > 0 && (
        <div className="day-progress-row">
          <div className="progress task-progress"><i style={{ width: percent + '%' }} /></div>
          <b>{percent}%</b>
        </div>
      )}

      <div className="weekly-task-list">
        {target.tasks.map((item: any) => (
          <button className={'weekly-task ' + (item.completed ? 'checked' : '')} onClick={() => void toggle(item)} key={item.id}>
            <span>{item.completed && <Check size={15} />}</span>
            <b>{item.title}</b>
            <small>{item.completed ? 'Completed' : 'Mark complete'}</small>
          </button>
        ))}
        {!total && <div className="empty-state"><span className="empty-art"><Plus size={26} /></span><p>No tasks yet. Add your first task below.</p></div>}
      </div>

      <form className="inline-form" onSubmit={add}>
        <input value={task} onChange={event => setTask(event.target.value)} placeholder={'Add a task to ' + target.name} />
        <button className="primary"><Plus size={16} /> Add task</button>
      </form>
    </section>
  );
}
