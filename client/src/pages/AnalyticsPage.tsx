import type { ReactNode } from 'react';
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, ListChecks, TrendingUp } from 'lucide-react';

const barColors = [
  'linear-gradient(90deg,#7b6cff,#9b5cf6)',
  'linear-gradient(90deg,#10b981,#34d399)',
  'linear-gradient(90deg,#3b82f6,#60a5fa)',
  'linear-gradient(90deg,#f59e0b,#fbbf24)',
  'linear-gradient(90deg,#ec4899,#f472b6)',
  'linear-gradient(90deg,#06b6d4,#22d3ee)'
];

export function AnalyticsPage({ data }: { data: any }) {
  const revisions = data?.revisions, tasks = data?.tasks;
  const rate = revisions?.completionRate || 0;
  const subjectProgress: any[] = data?.subjectProgress || [];
  return (
    <>
      <section className="stats">
        <Stat value={revisions?.total || 0} label="Total revisions" icon={<BookOpen />} tone="blue" />
        <Stat value={rate + '%'} label="Completion rate" icon={<CheckCircle2 />} tone="violet" />
        <Stat value={tasks?.completed || 0} label="Tasks completed" icon={<ListChecks />} tone="green" />
        <Stat value={revisions?.overdue || 0} label="Overdue revisions" icon={<AlertTriangle />} tone="rose" />
      </section>

      <section className="grid">
        <div className="panel span2">
          <div className="panel-title"><h2 className="title-with-icon"><span className="title-icon"><BarChart3 size={17} /></span>Subject progress</h2></div>
          <div className="subject-progress">
            {subjectProgress.map((item: any, index: number) => (
              <div key={item.subject}>
                <span><em className="rank">{index + 1}</em>{item.subject}<b>{item.progress}%</b></span>
                <div className="progress"><i style={{ width: item.progress + '%', background: barColors[index % barColors.length] }} /></div>
              </div>
            ))}
            {!subjectProgress.length && <div className="empty-state"><span className="empty-art"><BarChart3 size={26} /></span><p>Add subjects and revisions to see your progress here.</p></div>}
          </div>
        </div>

        <div className="panel live-progress">
          <div className="panel-title"><h2 className="title-with-icon"><span className="title-icon"><TrendingUp size={17} /></span>Overall completion</h2></div>
          <div className="goal analytics-goal">
            <div className="ring ring-large" style={{ background: `conic-gradient(var(--primary) ${rate}%, var(--surface-3) 0)` }}><b>{rate}%</b><small>of revisions</small></div>
            <p><b>{revisions?.total || 0} revisions in total</b><br /><small>{revisions?.overdue || 0} overdue · {tasks?.completed || 0} tasks completed</small></p>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label, icon, tone }: { value: string | number; label: string; icon: ReactNode; tone: string }) {
  return <div className="stat"><span className={'stat-icon ' + tone}>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;
}
