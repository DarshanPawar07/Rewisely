import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Check, Globe, Loader2, Palette, RefreshCw, SlidersHorizontal } from 'lucide-react';

type ThemePref = 'system' | 'light' | 'dark';

// Applies the chosen theme instantly; the app shell listens for this event.
const applyTheme = (pref: ThemePref) => {
  localStorage.setItem('revisely_theme_pref', pref);
  const resolved = pref === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pref;
  window.dispatchEvent(new CustomEvent('revisely-theme', { detail: resolved }));
};

export function SettingsPage({ data, save }: { data: any; save: (value: any) => Promise<void> }) {
  const [interval, setInterval] = useState(data?.defaultRevisionInterval || 15), [reminders, setReminders] = useState(data?.notificationEnabled ?? true), [saved, setSaved] = useState(''), [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<ThemePref>(() => (localStorage.getItem('revisely_theme_pref') as ThemePref) || data?.theme || 'system');
  useEffect(() => { setInterval(data?.defaultRevisionInterval || 15); setReminders(data?.notificationEnabled ?? true); }, [data]);
  useEffect(() => { if (!saved) return; const timer = window.setTimeout(() => setSaved(''), 2500); return () => window.clearTimeout(timer); }, [saved]);

  return (
    <section className="panel settings">
      <div className="panel-title"><h2 className="title-with-icon"><span className="title-icon"><SlidersHorizontal size={17} /></span>Preferences</h2></div>
      <div className="setting-list">
        <Row icon={<RefreshCw size={18} />} tone="violet" title="Default revision interval" hint="The gap between each repeat revision of a topic.">
          <select value={interval} onChange={event => setInterval(Number(event.target.value))}><option value="3">3 days</option><option value="7">7 days</option><option value="15">15 days</option><option value="30">30 days</option></select>
        </Row>
        <Row icon={<Globe size={18} />} tone="blue" title="Timezone" hint="Used to decide when a revision becomes due.">
          <select defaultValue={data?.timezone || 'UTC'}><option>Asia/Kolkata</option><option>UTC</option></select>
        </Row>
        <Row icon={<Bell size={18} />} tone="orange" title="Revision reminders" hint="Get a nudge when revisions are due." toggle>
          <input type="checkbox" checked={reminders} onChange={event => setReminders(event.target.checked)} aria-label="Revision reminders" />
        </Row>
        <Row icon={<Palette size={18} />} tone="pink" title="Theme" hint="Choose how Rewisely looks on this device.">
          <select value={theme} onChange={event => { const next = event.target.value as ThemePref; setTheme(next); applyTheme(next); }}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
        </Row>
      </div>
      <div className="settings-actions">
        <button className="primary" disabled={busy} onClick={async () => { setBusy(true); try { await save({ defaultRevisionInterval: interval, notificationEnabled: reminders }); setSaved('Saved'); } finally { setBusy(false); } }}>
          {busy ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Check size={16} /> Save changes</>}
        </button>
        {saved && <small className="save-msg ok"><Check size={15} /> {saved}</small>}
      </div>
    </section>
  );
}

function Row({ icon, tone, title, hint, children, toggle = false }: { icon: ReactNode; tone: string; title: string; hint: string; children: ReactNode; toggle?: boolean }) {
  return (
    <label className={'setting-row' + (toggle ? ' switchline' : '')}>
      <span className={'setting-icon ' + tone}>{icon}</span>
      <span className="setting-text"><b>{title}</b><small>{hint}</small></span>
      {children}
    </label>
  );
}
