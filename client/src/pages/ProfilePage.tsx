import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Briefcase, CalendarDays, CheckCircle2, Layers, ListChecks, Loader2, LogOut, Mail, Phone, RefreshCw, Save, ShieldCheck, User } from 'lucide-react';
import { apiRequest } from '../services/api';

type ProfileData = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  occupation?: string | null;
  phone?: string | null;
  createdAt?: string;
  stats?: { totalTopics?: number; totalRevisions?: number; tasksCompleted?: number; overdueRevisions?: number };
};

export function ProfilePage({ data, onSaved }: { data: ProfileData; onSaved?: (value: ProfileData) => void }) {
  const [saved, setSaved] = useState(''), [ok, setOk] = useState(true), [busy, setBusy] = useState(false);
  const firstName = data?.firstName || data?.name?.split(' ')[0] || '';
  const lastName = data?.lastName || data?.name?.split(' ').slice(1).join(' ') || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Your profile';
  const initials = [firstName, lastName].filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'R';
  const detailsComplete = [firstName, lastName, data?.occupation, data?.phone].filter(value => !!value?.trim()).length;
  const profilePercent = Math.round(detailsComplete / 4 * 100);
  const occupationOptions = ['Student', 'Working professional', 'Teacher', 'Freelancer', 'Other'];
  const customOccupation = data?.occupation && !occupationOptions.includes(data.occupation) ? data.occupation : '';

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setSaved('');
    try {
      const result = await apiRequest<ProfileData>('/profile', localStorage.getItem('reviseme_token') || '', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: form.get('firstName'), lastName: form.get('lastName'), occupation: form.get('occupation'), phone: form.get('phone') }),
      });
      onSaved?.({ ...data, ...result.data, stats: data?.stats });
      setOk(true);
      setSaved('Your profile has been saved.');
    } catch (error) {
      setOk(false);
      setSaved(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => { localStorage.removeItem('reviseme_token'); window.location.assign('/login'); };

  return (
    <section className="panel profile profile-page">
      <div className="profile-cover"><span><ShieldCheck size={15} /> Your account</span></div>
      <div className="profile-body">
        <div className="profile-hero">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div className="profile-identity">
            <h2>{name}</h2>
            <div className="profile-meta">
              <span><Briefcase size={14} /> {data?.occupation || 'Add what you do'}</span>
              {data?.email && <span><Mail size={14} /> {data.email}</span>}
              {data?.createdAt && <span><CalendarDays size={14} /> Member since {new Date(data.createdAt).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>

        <div className="profile-completeness" aria-label={`Profile details ${profilePercent}% complete`}>
          <div className="profile-completeness-label"><b>Profile details</b><span>{detailsComplete} of 4 added</span></div>
          <div className="progress"><i style={{ width: `${profilePercent}%` }} /></div>
          <small>{profilePercent === 100 ? 'Your contact details are up to date.' : 'Add a few details to make your profile easier to recognise.'}</small>
        </div>

        <div className="profile-stats">
          <ProfileStat icon={<Layers size={20} />} tone="violet" value={data?.stats?.totalTopics || 0} label="Topics" />
          <ProfileStat icon={<RefreshCw size={20} />} tone="blue" value={data?.stats?.totalRevisions || 0} label="Planned revisions" />
          <ProfileStat icon={<ListChecks size={20} />} tone="green" value={data?.stats?.tasksCompleted || 0} label="Tasks completed" />
          <ProfileStat icon={<AlertTriangle size={20} />} tone="rose" value={data?.stats?.overdueRevisions || 0} label="Overdue revisions" />
        </div>

        <form className="profile-form" onSubmit={save}>
          <div className="profile-form-heading"><div><h3>Personal details</h3><p>Keep your account information current.</p></div><span><ShieldCheck size={14} /> Private to your account</span></div>
          <div className="profile-fields">
            <Field label="First name" name="firstName" icon={User} defaultValue={firstName} />
            <Field label="Last name" name="lastName" icon={User} defaultValue={lastName} />
            <Field label="Email address" name="email" icon={Mail} defaultValue={data?.email || ''} disabled />
            <label className="field">What do you do?
              <span className="input-icon"><Briefcase size={17} />
                <select name="occupation" defaultValue={customOccupation || data?.occupation || 'Student'}>
                  {customOccupation && <option>{customOccupation}</option>}
                  {occupationOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </span>
            </label>
            <Field label="Phone number" name="phone" type="tel" icon={Phone} defaultValue={data?.phone || ''} required={false} />
          </div>
          <div className="profile-actions">
            <button className="primary" disabled={busy}>{busy ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Save size={16} /> Save profile</>}</button>
            <button type="button" className="logout" onClick={logout}><LogOut size={15} /> Log out</button>
            {saved && <small role="status" className={'save-msg ' + (ok ? 'ok' : 'err')}>{ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {saved}</small>}
          </div>
        </form>
      </div>
    </section>
  );
}

function ProfileStat({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: number; label: string }) {
  return <div className="profile-stat"><div className={'stat-icon ' + tone}>{icon}</div><div><b>{value}</b><span>{label}</span></div></div>;
}

function Field({ label, name, defaultValue, type = 'text', disabled = false, required = true, icon: Icon }: { label: string; name: string; defaultValue?: string; type?: string; disabled?: boolean; required?: boolean; icon: LucideIcon }) {
  return (
    <label className="field">
      {label}
      <span className="input-icon"><Icon size={17} /><input required={required} disabled={disabled} name={name} type={type} defaultValue={defaultValue} /></span>
    </label>
  );
}
