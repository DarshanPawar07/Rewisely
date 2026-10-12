import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Revision, Task } from '../types/models';

const pad = (value: number) => String(value).padStart(2, '0');
const MAX_EVENTS = 3;

export function CalendarPage({ revisions, tasks }: { revisions: Revision[]; tasks: Task[] }) {
  const [month, setMonth] = useState(() => new Date());
  const year = month.getFullYear(), monthIndex = month.getMonth(), first = new Date(year, monthIndex, 1).getDay(), count = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: first + count }, (_, index) => index < first ? null : index - first + 1);
  const shift = (delta: number) => setMonth(value => new Date(value.getFullYear(), value.getMonth() + delta, 1));
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthKey = `${year}-${pad(monthIndex + 1)}`;
  const monthRevisions = revisions.filter(item => item.date.startsWith(monthKey));
  const monthTasks = tasks.filter(item => String(item.dateKey || '').startsWith(monthKey));
  const completed = monthRevisions.filter(item => item.status === 'Completed').length + monthTasks.filter(item => item.done).length;
  const agenda = [
    ...monthRevisions.map(item => ({ id: `revision-${item.id}`, date: item.date, title: `Revision ${item.number}: ${item.topic}`, detail: item.subject, done: item.status === 'Completed', kind: 'revision' })),
    ...monthTasks.filter(item => item.dateKey).map(item => ({ id: `task-${item.id}`, date: item.dateKey!, title: item.title, detail: 'Daily task', done: item.done, kind: 'task' })),
  ].sort((firstItem, secondItem) => firstItem.date.localeCompare(secondItem.date));

  return (
    <section className="panel full calendar">
      <div className="calendar-head">
        <h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <button className="soft" onClick={() => setMonth(new Date())}><CalendarDays size={14} /> Today</button>
        <select className="year-select" value={year} onChange={event => setMonth(new Date(Number(event.target.value), monthIndex, 1))} aria-label="Year">
          {Array.from({ length: 11 }, (_, index) => year - 5 + index).map(value => <option key={value}>{value}</option>)}
        </select>
        <button className="icon-button" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <button className="icon-button" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>

      <div className="calendar-summary">
        <span><b>{monthRevisions.length}</b> revisions</span>
        <span><b>{monthTasks.length}</b> daily tasks</span>
        <span className="ok"><b>{completed}</b> completed</span>
      </div>

      <div className="calendar-key"><span className="key done-key" /> Completed <span className="key todo-key" /> Needs attention <span className="key revision-key" /> Revision <span className="key task-key" /> Daily task</div>

      <div className="weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="days">
        {cells.map((day, index) => {
          if (!day) return <div className="empty" key={'empty' + index} />;
          const date = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
          const revisionItems = revisions.filter(item => item.date === date), taskItems = tasks.filter(item => item.dateKey === date);
          const activities = [...revisionItems.map(item => item.status === 'Completed'), ...taskItems.map(item => item.done)];
          const done = activities.filter(Boolean).length, progress = activities.length ? Math.round(done / activities.length * 100) : 0;
          const events = [
            ...revisionItems.map(item => ({ key: 'r' + item.id, cls: 'event revision-event ' + (item.status === 'Completed' ? 'done-event' : 'todo-event'), label: `Revision ${item.number}: ${item.topic}` })),
            ...taskItems.map(item => ({ key: 't' + item.id, cls: 'event daily-calendar-event ' + (item.done ? 'done-event' : 'todo-event'), label: `Task: ${item.title}` }))
          ];
          return (
            <div className={'day ' + (date === todayKey ? 'today' : '')} key={date}>
              <div className="day-top"><b>{day}</b>{activities.length > 0 && <span className="day-score">{progress === 100 ? '🔥' : `${progress}%`}</span>}</div>
              {events.slice(0, MAX_EVENTS).map(event => <span className={event.cls} title={event.label} key={event.key}>{event.label}</span>)}
              {events.length > MAX_EVENTS && <span className="more-events">+{events.length - MAX_EVENTS} more</span>}
            </div>
          );
        })}
      </div>

      <div className="calendar-agenda">
        <h3>This month’s schedule</h3>
        {agenda.length ? agenda.map(item => <div className="calendar-agenda-item" key={item.id}>
          <span className="calendar-agenda-date">{new Date(`${item.date}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span className={'calendar-agenda-kind ' + item.kind} />
          <span className="calendar-agenda-copy"><b>{item.title}</b><small>{item.detail}</small></span>
          <em className={item.done ? 'done' : ''}>{item.done ? 'Completed' : 'Planned'}</em>
        </div>) : <p>No revisions or daily tasks planned this month.</p>}
      </div>
    </section>
  );
}
