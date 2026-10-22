import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Check, CheckCheck, Clock3 } from 'lucide-react';
import { apiRequest } from '../services/api';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'REVISION_DUE' | 'REVISION_OVERDUE' | 'TASK_DUE' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
};

export function NotificationsMenu({ token }: { token: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const menuRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const unread = items.filter(item => !item.isRead).length;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    let mounted = true;
    const refresh = async (notifyNew = false) => {
      try {
        const result = await apiRequest<NotificationItem[]>('/notifications', token);
        if (!mounted) return;
        const next = result.data || [];
        const known = knownIds.current;
        if (notifyNew && known && Notification.permission === 'granted') {
          next.filter(item => !known.has(item.id) && !item.isRead).slice(0, 3).forEach(item => new Notification(item.title, { body: item.message, icon: '/rewisely-icon.png' }));
        }
        knownIds.current = new Set(next.map(item => item.id));
        setItems(next);
      } catch {
        // Keep the last successfully fetched list visible during brief network issues.
      }
    };
    knownIds.current = null;
    void refresh();
    const timer = window.setInterval(() => void refresh(true), 45_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [token]);

  const markRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    setItems(current => current.map(value => value.id === item.id ? { ...value, isRead: true } : value));
    try { await apiRequest(`/notifications/${encodeURIComponent(item.id)}/read`, token, { method: 'PATCH', body: JSON.stringify({ isRead: true }) }); }
    catch { setItems(current => current.map(value => value.id === item.id ? { ...value, isRead: false } : value)); }
  };

  const markAllRead = async () => {
    setItems(current => current.map(item => ({ ...item, isRead: true })));
    try { await apiRequest('/notifications/read-all', token, { method: 'PATCH' }); }
    catch { void apiRequest<NotificationItem[]>('/notifications', token).then(result => setItems(result.data)).catch(() => undefined); }
  };

  const enableBrowserAlerts = async () => {
    if (!('Notification' in window)) { setPermission('unsupported'); return; }
    const next = await Notification.requestPermission();
    setPermission(next);
  };

  return (
    <div className="notification-menu" ref={menuRef}>
      <button className="icon-button notification-trigger" onClick={() => setOpen(value => !value)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Bell size={19} />{unread > 0 && <i />}
      </button>
      {open && <section className="notification-popover" aria-label="Notifications">
        <div className="notification-head">
          <div><h2>Notifications</h2><p>{unread ? `${unread} unread` : 'You’re all caught up'}</p></div>
          {unread > 0 && <button className="notification-read-all" onClick={() => void markAllRead()}><CheckCheck size={14} /> Mark all read</button>}
        </div>
        {permission === 'default' && <button className="browser-alert-prompt" onClick={() => void enableBrowserAlerts()}><BellRing size={15} /> Enable desktop alerts</button>}
        {permission === 'denied' && <p className="notification-hint">Desktop alerts are blocked in browser settings. Your in-app inbox will still update.</p>}
        {permission === 'unsupported' && <p className="notification-hint">This browser does not support desktop alerts. Your in-app inbox will still update.</p>}
        <div className="notification-list">
          {items.map(item => <button className={`notification-item ${item.isRead ? 'read' : 'unread'}`} key={item.id} onClick={() => void markRead(item)}>
            <span className={`notification-type ${item.type.toLowerCase()}`}><Bell size={15} /></span>
            <span className="notification-copy"><b>{item.title}</b><span>{item.message}</span><small><Clock3 size={12} /> {new Date(item.createdAt).toLocaleString()}</small></span>
            {!item.isRead && <span className="notification-unread-dot" aria-label="Unread" />}
          </button>)}
          {!items.length && <div className="notification-empty"><span><Check size={20} /></span><b>No notifications yet</b><p>Upcoming revisions and tasks due soon will show up here.</p></div>}
        </div>
      </section>}
    </div>
  );
}
