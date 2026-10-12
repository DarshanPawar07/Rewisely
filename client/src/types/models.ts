export type RevisionStatus = 'Upcoming' | 'Due today' | 'Overdue' | 'Completed';

export type Revision = {
  id: string | number;
  topic: string;
  subject: string;
  date: string;
  time: string;
  status: RevisionStatus;
  confidence?: number;
  number?: number;
  completedAt?: string;
  topicId?: string;
};

export type Task = {
  id: string | number;
  title: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  due: string;
  dateKey?: string;
  done: boolean;
};
