import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Briefcase, CalendarDays, Check, CheckCircle2, Layers, ListChecks, Loader2, LogOut, Mail, Phone, RefreshCw, Save, ShieldCheck, User, X } from 'lucide-react';
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
  const [saved, setSaved] = useState(''), [ok, setOk] = useState(true), [busy, setBusy] = useState(false), [confirmLogout, setConfirmLogout] = useState(false);
  const firstName = data?.firstName || data?.name?.split(' ')[0] || '';
  const lastName = data?.lastName || data?.name?.split(' ').slice(1).join(' ') || '';
  const [draft, setDraft] = useState({ firstName, lastName, occupation: data?.occupation || 'Student', phone: data?.phone || '' });
  useEffect(() => setDraft({ firstName, lastName, occupation: data?.occupation || 'Student', phone: data?.phone || '' }), [data?.firstName, data?.lastName, data?.name, data?.occupation, data?.phone]);
  const name = [draft.firstName, draft.lastName].map(value => value.trim()).filter(Boolean).join(' ') || 'Your profile';
  const initials = [draft.firstName, draft.lastName].map(value => value.trim()).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'R';
  const detailsComplete = [draft.firstName, draft.lastName, draft.occupation, draft.phone].filter(value => !!value?.trim()).length;
  const profilePercent = Math.round(detailsComplete / 4 * 100);
  const occupationOptions = ['Student', 'Working professional', 'Teacher', 'Freelancer', 'Other'];
  const customOccupation = data?.occupation && !occupationOptions.includes(data.occupation) ? data.occupation : '';
  const isDirty = draft.firstName !== firstName || draft.lastName !== lastName || draft.occupation !== (data?.occupation || 'Student') || draft.phone !== (data?.phone || '');

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !isDirty) return;
    setBusy(true);
    setSaved('');
    try {
      const result = await apiRequest<ProfileData>('/profile', localStorage.getItem('reviseme_token') || '', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), occupation: draft.occupation.trim(), phone: draft.phone.trim() }),
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
  const reset = () => { setDraft({ firstName, lastName, occupation: data?.occupation || 'Student', phone: data?.phone || '' }); setSaved(''); };
  const change = (key: keyof typeof draft, value: string) => { setDraft(current => ({ ...current, [key]: value })); setSaved(''); };

  return (
    <section className="panel profile profile-page">
      <div className="profile-cover"><span><ShieldCheck size={15} /> Your account</span></div>
      <div className="profile-body">
        <div className="profile-hero">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div className="profile-identity">
            <h2>{name}</h2>
            <div className="profile-meta">
              <span><Briefcase size={14} /> {draft.occupation || 'Add what you do'}</span>
              {data?.email && <span><Mail size={14} /> {data.email}</span>}
              {data?.createdAt && <span><CalendarDays size={14} /> Member since {new Date(data.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>}
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
          <div className="profile-form-heading"><div><h3>Personal details</h3><p>Keep your account information current.</p></div><span><ShieldCheck size={14} /> Only visible to you</span></div>
          <div className="profile-fields">
            <Field label="First name" name="firstName" icon={User} value={draft.firstName} onChange={value => change('firstName', value)} maxLength={80} autoComplete="given-name" />
            <Field label="Last name" name="lastName" icon={User} value={draft.lastName} onChange={value => change('lastName', value)} maxLength={80} autoComplete="family-name" />
            <Field label="Email address" name="email" icon={Mail} defaultValue={data?.email || ''} disabled />
            <label className="field">What do you do?
              <span className="input-icon"><Briefcase size={17} />
                <select name="occupation" value={customOccupation && draft.occupation === customOccupation ? customOccupation : occupationOptions.includes(draft.occupation) ? draft.occupation : 'Other'} onChange={event => change('occupation', event.target.value === 'Other' ? '' : event.target.value)}>
                  {customOccupation && <option>{customOccupation}</option>}
                  {occupationOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </span>
            </label>
            {(draft.occupation === '' || (draft.occupation === 'Other' && !customOccupation)) && <Field label="Your role" name="customOccupation" icon={Briefcase} value={draft.occupation} onChange={value => change('occupation', value)} maxLength={80} placeholder="e.g. Researcher" required={false} />}
            <Field label="Phone number" name="phone" type="tel" icon={Phone} value={draft.phone} onChange={value => change('phone', value)} required={false} maxLength={32} autoComplete="tel" placeholder="Optional" />
          </div>
          <div className="profile-actions">
            <button className="primary" disabled={busy || !isDirty}>{busy ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Save size={16} /> Save changes</>}</button>
            {isDirty && <button type="button" className="soft" disabled={busy} onClick={reset}><X size={15} /> Discard</button>}
            <button type="button" className="logout" disabled={busy} onClick={() => setConfirmLogout(true)}><LogOut size={15} /> Log out</button>
            {saved && <small role="status" aria-live="polite" className={'save-msg ' + (ok ? 'ok' : 'err')}>{ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {saved}</small>}
            {!saved && !isDirty && <small role="status" className="save-msg ok"><Check size={14} /> Your profile is up to date</small>}
          </div>
        </form>
      </div>
      {confirmLogout && <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmLogout(false); }}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-logout-title">
          <div className="modal-head"><h2 id="profile-logout-title">Log out of Rewisely?</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setConfirmLogout(false)}><X size={18} /></button></div>
          <p>You’ll need to sign in again to access your study workspace.</p>
          <div className="actions"><button type="button" className="logout" onClick={logout}><LogOut size={15} /> Log out</button><button type="button" className="soft" onClick={() => setConfirmLogout(false)}>Stay signed in</button></div>
        </div>
      </div>}
    </section>
  );
}

function ProfileStat({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: number; label: string }) {
  return <div className="profile-stat"><div className={'stat-icon ' + tone}>{icon}</div><div><b>{value}</b><span>{label}</span></div></div>;
}

function Field({ label, name, defaultValue, value, onChange, type = 'text', disabled = false, required = true, icon: Icon, maxLength, autoComplete, placeholder }: { label: string; name: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; type?: string; disabled?: boolean; required?: boolean; icon: LucideIcon; maxLength?: number; autoComplete?: string; placeholder?: string }) {
  return (
    <label className="field">
      {label}
      <span className="input-icon"><Icon size={17} /><input required={required} disabled={disabled} name={name} type={type} value={value} onChange={onChange ? event => onChange(event.target.value) : undefined} defaultValue={value === undefined ? defaultValue : undefined} maxLength={maxLength} autoComplete={autoComplete} placeholder={placeholder} /></span>
    </label>
  );
}
