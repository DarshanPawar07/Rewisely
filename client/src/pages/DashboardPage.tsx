import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpen, CalendarClock, Check, Inbox, ListChecks, Sparkles, TrendingUp } from 'lucide-react';
import type { Revision, Task } from '../types/models';

type Props = {
  revisions: Revision[];
  tasks: Task[];
  complete: (id: string | number) => void;
  toggle: (id: string | number) => void;
};

const statusClass = (status: string) => status.toLowerCase().replace(' ', '-');

export function DashboardPage({ revisions, tasks, complete, toggle }: Props) {
  const navigate = useNavigate();
  const due = revisions.filter(item => item.status === 'Due today');
  const overdue = revisions.filter(item => item.status === 'Overdue');
  const upcoming = revisions.filter(item => item.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const revisionDone = revisions.filter(item => item.status === 'Completed').length;
  const revisionRate = revisions.length ? Math.round(revisionDone / revisions.length * 100) : 0;
  const taskDone = tasks.filter(item => item.done).length;
  const taskRate = tasks.length ? Math.round(taskDone / tasks.length * 100) : 0;
  const openTasks = tasks.length - taskDone;
  const todayTasks = tasks.filter(item => item.due.startsWith('Today'));
  const attention = due.length + overdue.length;

  const headline = attention
    ? `${attention} revision${attention > 1 ? 's' : ''} waiting for you`
    : openTasks
      ? `Revisions are clear. ${openTasks} task${openTasks > 1 ? 's' : ''} to go`
      : 'You are all caught up';
  const subline = attention
    ? 'Finish them today to keep your memory curve strong.'
    : 'Great consistency. Add a new topic to keep the momentum going.';

  return (
    <>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-kicker"><Sparkles size={14} /> Today's focus</span>
          <h2>{headline}</h2>
          <p>{subline}</p>
        </div>
        <button className="hero-button" onClick={() => navigate(attention ? '/revisions' : '/daily-tasks')}>
          {attention ? 'Start revising' : 'View tasks'} <ArrowRight size={17} />
        </button>
      </section>

      <section className="stats">
        <Stat value={due.length} label="Due today" tone="orange" icon={<CalendarClock />} />
        <Stat value={overdue.length} label="Overdue revisions" tone="rose" icon={<AlertTriangle />} />
        <Stat value={openTasks} label="Open tasks" tone="blue" icon={<ListChecks />} />
        <Stat value={revisionRate + '%'} label="Revision completion" tone="green" icon={<TrendingUp />} />
      </section>

      <section className="grid dashboard-grid">
        <div className="panel span2">
          <PanelTitle title="Today's revisions" icon={<BookOpen size={17} />} action="View all" onAction={() => navigate('/revisions')} />
          {due.length ? (
            <div className="schedule">
              {due.map(item => (
                <div className="schedule-item" key={item.id}>
                  <time>{item.time}</time>
                  <div className="line" />
                  <div className="topic-icon"><BookOpen size={17} /></div>
                  <div className="grow">
                    <b>{item.topic}</b>
                    <small>{item.subject} · <em className={'badge ' + statusClass(item.status)}>{item.status}</em></small>
                  </div>
                  <button className="soft" onClick={() => complete(item.id)}><Check size={14} /> Complete</button>
                </div>
              ))}
            </div>
          ) : <Empty text="No revisions due today. Enjoy the breathing room." />}
        </div>

        <ProgressCard title="Revision progress" completed={revisionDone} total={revisions.length} rate={revisionRate} tone="revision" />

        <div className="panel span2">
          <PanelTitle title="Today's daily tasks" icon={<ListChecks size={17} />} action="View all" onAction={() => navigate('/daily-tasks')} />
          {todayTasks.length ? (
            <div className="task-list">
              {todayTasks.slice(0, 5).map(item => (
                <div className={'task task-row ' + (item.done ? 'done' : '')} key={item.id}>
                  <button className={'task-complete ' + (item.done ? 'is-done' : '')} onClick={() => toggle(item.id)}>
                    {item.done ? <><Check size={14} /> Completed</> : <><span /> Mark complete</>}
                  </button>
                  <div className="grow"><b>{item.title}</b><small>{item.category} · {item.due}</small></div>
                  <span className={'priority ' + item.priority.toLowerCase()}>{item.priority}</span>
                </div>
              ))}
            </div>
          ) : <Empty text="No tasks due today." />}
        </div>

        <ProgressCard title="Daily task progress" completed={taskDone} total={tasks.length} rate={taskRate} tone="task" />

        <div className="panel span2">
          <PanelTitle title="Upcoming revisions" icon={<CalendarClock size={17} />} action="Open calendar" onAction={() => navigate('/calendar')} />
          {upcoming.length ? (
            <div className="mini-list">
              {upcoming.map(item => (
                <div key={item.id}>
                  <span className="date-box">
                    <b>{item.date.slice(-2)}</b>
                    <small>{new Date(item.date + 'T00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small>
                  </span>
                  <p><b>{item.topic}</b><small>{item.subject} · Revision {item.number || 1}</small></p>
                  <em className={'badge ' + statusClass(item.status)} style={{ marginLeft: 'auto' }}>{item.status}</em>
                </div>
              ))}
            </div>
          ) : <Empty text="No upcoming revisions." />}
        </div>
      </section>
    </>
  );
}

function Stat({ value, label, tone, icon }: { value: string | number; label: string; tone: string; icon: ReactNode }) {
  return <div className="stat"><span className={'stat-icon ' + tone}>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;
}

function ProgressCard({ title, completed, total, rate, tone }: { title: string; completed: number; total: number; rate: number; tone: 'revision' | 'task' }) {
  const color = tone === 'task' ? 'var(--success)' : 'var(--primary)';
  return (
    <div className="panel live-progress">
      <PanelTitle title={title} icon={<TrendingUp size={17} />} />
      <div className="goal">
        <div className="ring" style={{ background: `conic-gradient(${color} ${rate}%, var(--surface-3) 0)` }}>
          <b>{rate}%</b><small>complete</small>
        </div>
        <p>
          <b>{completed} of {total} {tone === 'task' ? 'tasks' : 'revisions'}</b><br />
          <small>Live progress from your saved {tone === 'task' ? 'daily tasks' : 'revision plans'}.</small>
        </p>
      </div>
      <div className={'progress ' + (tone === 'task' ? 'task-progress' : '')}><i style={{ width: rate + '%' }} /></div>
    </div>
  );
}

function PanelTitle({ title, icon, action, onAction }: { title: string; icon?: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="panel-title">
      <h2 className="title-with-icon">{icon && <span className="title-icon">{icon}</span>}{title}</h2>
      {action && <button className="text-button" onClick={onAction}>{action} <ArrowRight size={14} /></button>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty-state"><span className="empty-art"><Inbox size={26} /></span><p>{text}</p></div>;
}

