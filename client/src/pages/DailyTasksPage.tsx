import React from 'react';
import { CalendarDays, Check, History, Plus, Sun, Sunrise } from 'lucide-react';
import type { Task } from '../types/models';

export function DailyTasksPage({ tasks, toggle }: { tasks: Task[]; toggle: (id: string | number) => void }) {
  const [view, setView] = React.useState<'Today' | 'Tomorrow'>('Today');
  const isToday = (task: Task) => task.due.startsWith('Today');
  const isTomorrow = (task: Task) => task.due === 'Tomorrow';
  const shown = tasks.filter(task => view === 'Today' ? isToday(task) : isTomorrow(task));
  const doneCount = shown.filter(task => task.done).length;
  const percent = shown.length ? Math.round(doneCount / shown.length * 100) : 0;
  const add = () => { localStorage.setItem('revisely_task_due', view); (document.querySelector('.header-actions .primary') as HTMLButtonElement | null)?.click(); };
  const groups = Object.entries(tasks.reduce((all, task) => { const date = task.due || 'No due date'; (all[date] ??= []).push(task); return all; }, {} as Record<string, Task[]>));

  return (
    <section className="panel full daily-tasks-panel">
      <div className="task-page-head">
        <div>
          <h2>{view === 'Today' ? "Today's daily tasks" : "Tomorrow's daily tasks"}</h2>
          <p>{doneCount} of {shown.length} completed</p>
        </div>
        <div className="task-tabs">
          <button className={view === 'Today' ? 'selected' : ''} onClick={() => setView('Today')}><Sun size={15} /> Today <span className="tab-count">{tasks.filter(isToday).length}</span></button>
          <button className={view === 'Tomorrow' ? 'selected' : ''} onClick={() => setView('Tomorrow')}><Sunrise size={15} /> Tomorrow <span className="tab-count">{tasks.filter(isTomorrow).length}</span></button>
        </div>
      </div>

      {shown.length > 0 && (
        <div className="day-progress-row">
          <div className="progress task-progress"><i style={{ width: percent + '%' }} /></div>
          <b>{percent}%</b>
        </div>
      )}

      {shown.length ? <TaskList tasks={shown} toggle={toggle} /> : (
        <div className="empty-state polished-empty task-empty">
          <b>No tasks planned for {view.toLowerCase()}</b>
          <p>{view === 'Today' ? 'Create a focused task for today.' : 'Plan ahead—tomorrow’s tasks will automatically appear in Today when the date arrives.'}</p>
          <button className="primary" onClick={add}><Plus size={16} /> Add task for {view.toLowerCase()}</button>
        </div>
      )}

      <section className="task-history">
        <div className="task-page-head">
          <div>
            <h2 className="title-with-icon"><span className="title-icon"><History size={17} /></span>Task history by date</h2>
            <p>See what was completed and what still needs attention.</p>
          </div>
        </div>
        {groups.map(([date, items]) => {
          const done = items.filter(task => task.done).length;
          return (
            <div className="history-day" key={date}>
              <div className="history-top">
                <b><CalendarDays size={14} /> {date}</b>
                <span>{done}/{items.length} completed</span>
                <div className="progress mini task-progress"><i style={{ width: Math.round(done / items.length * 100) + '%' }} /></div>
              </div>
              <div className="history-chips">
                {items.map(task => <small className={task.done ? 'history-done' : 'history-open'} key={task.id}>{task.done ? <Check size={12} /> : <i />}{task.title}</small>)}
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
}

function TaskList({ tasks, toggle }: { tasks: Task[]; toggle: (id: string | number) => void }) {
  return (
    <div className="task-list">
      {tasks.map(task => (
        <div className={'task task-row ' + (task.done ? 'done' : '')} key={task.id}>
          <button className={'task-complete ' + (task.done ? 'is-done' : '')} aria-label={'Toggle ' + task.title + ' completion'} onClick={() => toggle(task.id)}>
            {task.done ? <><Check size={14} /> Completed</> : <><span /> Mark complete</>}
          </button>
          <div className="grow"><b>{task.title}</b><small>{task.category} · {task.due}</small></div>
          <span className={'priority ' + task.priority.toLowerCase()}>{task.priority}</span>
        </div>
      ))}
    </div>
  );
}
