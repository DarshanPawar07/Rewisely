import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CalendarClock, Check, CheckCircle2, Inbox, LayoutGrid, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Revision } from '../types/models';
import { apiRequest } from '../services/api';

type Props = { revisions: Revision[]; complete: (id: string | number) => void; remove: (id: string | number) => void; add: () => void };

const statusClass = (status: string) => status.toLowerCase().replace(' ', '-');
const shortDate = (date: string) => new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function RevisionsPage({ revisions, complete, remove, add }: Props) {
  const navigate = useNavigate(), location = useLocation();
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => { const close = () => setMenu(null); document.addEventListener('click', close); return () => document.removeEventListener('click', close); }, []);

  const topicSegment = location.pathname.split('/')[3];
  const topic = location.pathname.includes('/track/') && topicSegment ? decodeURIComponent(topicSegment) : null;
  const view = location.pathname.includes('/upcoming') ? 'upcoming' : location.pathname.includes('/completed') ? 'completed' : 'plans';
  const grouped = Object.values(revisions.reduce((all, revision) => { (all[revision.topic] ??= []).push(revision); return all; }, {} as Record<string, Revision[]>));
  const plan = topic ? grouped.find(items => items[0].topic === topic) : undefined;
  const upcoming = revisions.filter(item => item.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date));
  const completed = revisions.filter(item => item.status === 'Completed').sort((a, b) => b.date.localeCompare(a.date));
  const track = (name: string) => navigate('/revisions/track/' + encodeURIComponent(name));

  return (
    <section className="panel full">
      <div className="task-page-head">
        <div>
          <h2>{topic || (view === 'plans' ? 'Revision plans' : view === 'upcoming' ? 'Upcoming revisions' : 'Completed revisions')}</h2>
          <p>{topic ? 'Your schedule, history, and progress.' : 'Create a topic plan, then track each revision here.'}</p>
        </div>
        <div className="task-tabs">
          <button className={view === 'plans' ? 'selected' : ''} onClick={() => navigate('/revisions')}><LayoutGrid size={15} /> My plans</button>
          <button className={view === 'upcoming' ? 'selected' : ''} onClick={() => navigate('/revisions/upcoming')}><CalendarClock size={15} /> Upcoming</button>
          <button className={view === 'completed' ? 'selected' : ''} onClick={() => navigate('/revisions/completed')}><CheckCircle2 size={15} /> Completed</button>
        </div>
      </div>

      {plan ? (
        <Tracking items={plan} complete={complete} remove={remove} back={() => navigate('/revisions')} />
      ) : view === 'plans' ? (
        <div className="plan-grid">
          {grouped.map(items => {
            const done = items.filter(item => item.status === 'Completed').length;
            const percent = Math.round(done / items.length * 100);
            const name = items[0].topic;
            const overdueCount = items.filter(item => item.status === 'Overdue').length;
            const next = items.filter(item => item.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date))[0];
            return (
              <article className="revision-plan-card target-card" key={name}>
                <div className="card-menu">
                  <button className="icon-button" aria-label="Plan options" onClick={event => { event.stopPropagation(); setMenu(menu === name ? null : name); }}><MoreHorizontal size={18} /></button>
                  <div className={'menu-popover' + (menu === name ? ' show' : '')}>
                    <button onClick={() => track(name)}><ArrowRight size={14} /> Track revision</button>
                    <button className="danger" onClick={() => items.forEach(item => remove(item.id))}><Trash2 size={14} /> Delete revision</button>
                  </div>
                </div>
                <div className="plan-head">
                  <span className="plan-icon"><BookOpen size={19} /></span>
                  <div><h2>{name}</h2><p>{items[0].subject || 'Revision topic'}</p></div>
                </div>
                <div className="plan-meta">
                  <span>{done}/{items.length} completed</span>
                  {overdueCount > 0
                    ? <em className="badge overdue">{overdueCount} overdue</em>
                    : next
                      ? <span className="plan-next"><CalendarClock size={13} /> Next: {shortDate(next.date)}</span>
                      : <em className="badge completed">All done</em>}
                </div>
                <div className="progress"><i style={{ width: percent + '%' }} /></div>
                <div className="plan-foot">
                  <b>{percent}% complete</b>
                  <button className="soft" onClick={() => track(name)}>Track <ArrowRight size={14} /></button>
                </div>
              </article>
            );
          })}
          {!grouped.length && (
            <div className="empty-state polished-empty">
              <b>No revision plans yet</b>
              <p>Build your first topic schedule and Rewisely will organise every revision date for you.</p>
              <button className="primary" onClick={add}><Plus size={16} /> Add revision</button>
            </div>
          )}
        </div>
      ) : (
        <RevisionTable items={view === 'completed' ? completed : upcoming} complete={complete} remove={remove} />
      )}
    </section>
  );
}

function Tracking({ items, complete, remove, back }: { items: Revision[]; complete: Props['complete']; remove: Props['remove']; back: () => void }) {
  const done = items.filter(item => item.status === 'Completed').length;
  const percent = items.length ? Math.round(done / items.length * 100) : 0;
  return (
    <div className="tracking">
      <button className="text-button back-link" onClick={back}><ArrowLeft size={15} /> Back to plans</button>
      <div className="tracking-summary">
        <div><b>{done} of {items.length}</b><small>revisions completed</small></div>
        <div><b>{items.length - done}</b><small>revisions remaining</small></div>
        <div><b>{percent}%</b><small>plan progress</small></div>
      </div>
      <div className="timeline-shell">
        <div className="timeline">
          <span className="timeline-completed" style={{ width: percent + '%' }} />
          <div className="timeline-step studied">
            <span className="timeline-dot"><BookOpen size={14} /></span>
            <b className="timeline-label">Topic studied</b>
            <small className="timeline-date">Starting point</small>
            <span className="timeline-tooltip">The topic was studied before this revision plan began.</span>
          </div>
          {items.map((item, index) => (
            <div className={'timeline-step ' + (item.status === 'Completed' ? 'done' : item.status === 'Overdue' ? 'overdue' : '')} key={item.id}>
              <span className="timeline-dot">{item.status === 'Completed' ? <Check size={14} /> : index + 1}</span>
              <b className="timeline-label">Revision {item.number || index + 1}</b>
              <small className="timeline-date">{shortDate(item.date)}</small>
              <span className="timeline-tooltip">
                Scheduled: {new Date(item.date + 'T00:00').toLocaleDateString()}<br />
                Status: {item.status}
                {item.completedAt && <><br />Completed: {new Date(item.completedAt).toLocaleDateString()}</>}
              </span>
            </div>
          ))}
        </div>
      </div>
      <RevisionTable items={items} complete={complete} remove={remove} />
    </div>
  );
}

function RevisionTable({ items, complete, remove }: { items: Revision[]; complete: Props['complete']; remove: Props['remove'] }) {
  const edit = async (item: Revision) => {
    const date = window.prompt('New revision date (YYYY-MM-DD)', item.date);
    if (!date) return;
    await apiRequest(`/revisions/${item.id}`, localStorage.getItem('reviseme_token') || '', { method: 'PATCH', body: JSON.stringify({ scheduledAt: new Date(date + 'T12:00:00').toISOString() }) });
    window.location.reload();
  };
  return (
    <div className="table revision-table">
      <div className="thead"><span>REVISION</span><span>SCHEDULED DATE</span><span>STATUS</span><span>COMPLETED ON / ACTION</span></div>
      {items.map(item => (
        <div className="tr" key={item.id}>
          <div><b>{item.topic}</b><small>Revision #{item.number || 1}</small></div>
          <span>{new Date(item.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span><em className={'badge ' + statusClass(item.status)}>{item.status}</em></span>
          <span className="actions">
            {item.status === 'Completed'
              ? <span className="confidence">{item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'Completed'}</span>
              : <button className="soft" onClick={() => complete(item.id)}><Check size={14} /> Complete</button>}
            <button className="edit" onClick={() => void edit(item)}><Pencil size={13} /> Edit</button>
            <button className="delete" onClick={() => remove(item.id)}><Trash2 size={13} /> Delete</button>
          </span>
        </div>
      ))}
      {!items.length && <div className="empty-state"><span className="empty-art"><Inbox size={26} /></span><p>Nothing to show here yet.</p></div>}
    </div>
  );
}
