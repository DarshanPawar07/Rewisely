import { BookOpen, Check, Clock3, Plus, Star, Trash2 } from 'lucide-react';
import type { Revision } from '../types/models';

type Props = { topics: any[]; subjects: any[]; revisions: Revision[]; complete: (id: string | number) => void; remove: (id: string | number) => void; add: () => void; addSubject: () => void; addTopic: () => void };

const tones = ['blue', 'violet', 'green', 'orange', 'pink', 'cyan', 'rose'];
const statusClass = (status: string) => status.toLowerCase().replace(' ', '-');

export function SubjectsPage({ topics, subjects, revisions, complete, remove, add, addSubject, addTopic }: Props) {
  return (
    <section className="roadmap-list">
      <div className="roadmap-intro">
        <div>
          <h2>Topic revision roadmaps</h2>
          <p>Build subjects, then track every revision for each topic.</p>
        </div>
        <div className="actions">
          <button className="soft" onClick={addSubject}><Plus size={14} /> Add subject</button>
          <button className="primary" onClick={addTopic}><Plus size={16} /> Add topic</button>
        </div>
      </div>

      {!subjects.length && (
        <div className="empty-state polished-empty">
          <b>No subjects yet</b>
          <p>Create your first subject to begin building revision roadmaps.</p>
          <button className="primary" onClick={addSubject}><Plus size={16} /> Add subject</button>
        </div>
      )}

      {topics.map((topic, topicIndex) => {
        const records = revisions.filter(revision => revision.topic === topic.title);
        const subject = topic.subject?.name || subjects.find(item => item.id === topic.subjectId)?.name || 'Subject';
        const done = records.filter(revision => revision.status === 'Completed').length;
        const percent = records.length ? Math.round(done / records.length * 100) : 0;
        return (
          <article className="topic-roadmap" key={topic.id}>
            <div className="roadmap-title">
              <span className={'subject-icon ' + tones[topicIndex % tones.length]}><BookOpen size={18} /></span>
              <div className="roadmap-heading">
                <h2>{topic.title}</h2>
                <p>{subject} · {done}/{records.length} revisions completed</p>
              </div>
              {records.length > 0 && <div className="roadmap-progress"><b>{percent}%</b><div className="progress mini"><i style={{ width: percent + '%' }} /></div></div>}
              <button className="soft" onClick={add}><Plus size={14} /> Add revision</button>
            </div>
            <div className="roadmap-track">
              {records.length ? records.map((revision, index) => (
                <div className="roadmap-step" key={revision.id}>
                  <span className={revision.status === 'Completed' ? 'step-dot complete-dot' : 'step-dot'}>{revision.status === 'Completed' && <Check size={12} />}</span>
                  <div>
                    <b>Revision {index + 1} · {new Date(revision.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</b>
                    <small className="step-meta">
                      <span><Clock3 size={12} /> {revision.time}</span>
                      <em className={'badge ' + statusClass(revision.status)}>{revision.status}</em>
                      {revision.confidence && <span className="confidence-chip"><Star size={12} /> Confidence {revision.confidence}/5</span>}
                    </small>
                  </div>
                  <div className="actions">
                    {revision.status !== 'Completed' && <button className="soft" onClick={() => complete(revision.id)}><Check size={14} /> Mark completed</button>}
                    <button className="delete" onClick={() => remove(revision.id)}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              )) : <p className="no-revisions">No revisions yet. Add the first revision for this topic.</p>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
