import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, Bell, CalendarClock, Check, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, MailCheck, Moon, RefreshCw, Sun, User } from 'lucide-react';
import { apiRequest, API_URL } from '../services/api';

type Props = { onLogin: (token: string, name: string) => void; theme?: 'light' | 'dark'; onToggleTheme?: () => void };
type AuthResponse = { token?: string; user?: { name: string }; requiresEmailVerification?: boolean; email?: string; delivery?: 'email' | 'console'; retryAfterSeconds?: number };

export function AuthPage({ onLogin, theme, onToggleTheme }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isVerifyPage = location.pathname === '/verify-email';
  const [mode, setMode] = useState<'login' | 'register'>(() => window.location.pathname === '/signup' ? 'register' : 'login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationEmail, setVerificationEmail] = useState(new URLSearchParams(location.search).get('email') || '');
  const [signupPending, setSignupPending] = useState(isVerifyPage);
  const [loginCodePending, setLoginCodePending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [forgotView, setForgotView] = useState(false);
  const [code, setCode] = useState('');
  const [verificationHint, setVerificationHint] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendIsError, setResendIsError] = useState(false);

  useEffect(() => setMode(location.pathname === '/signup' ? 'register' : 'login'), [location.pathname]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const name = String(form.get('name') || '').trim();
    const password = String(form.get('password') || '');
    const invalid: Record<string, string> = {};
    if (mode === 'register' && !name) invalid.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.email = 'Enter a valid email address.';
    if (mode === 'register' && password.length < 8) invalid.password = 'Use at least 8 characters for your password.';
    if (mode === 'login' && !password) invalid.password = 'Enter your password, or choose email-code sign-in below.';
    setFieldErrors(invalid);
    if (Object.keys(invalid).length) { setBusy(false); return; }
    try {
      const result = await apiRequest<AuthResponse>(`/auth/${mode}`, '', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email, password: form.get('password') }) });
      if (mode === 'register' && result.data.requiresEmailVerification) {
        setVerificationEmail(result.data.email || email);
        setVerificationHint(result.data.delivery === 'console' ? 'For local development, the six-digit code was printed in the backend terminal.' : result.data.retryAfterSeconds ? `A code was sent recently. Check your inbox, or request another in ${result.data.retryAfterSeconds} seconds.` : 'We sent a six-digit verification code to your inbox.');
        setCode(''); setResendMessage(''); setSignupPending(true);
        return;
      }
      if (result.data.token && result.data.user) onLogin(result.data.token, result.data.user.name);
      else throw new Error('Authentication could not be completed. Please try again.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to sign in';
      setError(mode === 'register' && message.toLowerCase().includes('already exists') ? 'This email is already registered. Sign in with your password or choose email-code sign-in.' : message);
      if (mode === 'login' && message.toLowerCase().includes('verify')) setVerificationEmail(email);
    } finally { setBusy(false); }
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const endpoint = signupPending ? '/auth/verify-email' : '/auth/login-code/verify';
      const result = await apiRequest<{ token: string; user: { name: string } }>(endpoint, '', { method: 'POST', body: JSON.stringify({ email: verificationEmail.trim(), code }) });
      onLogin(result.data.token, result.data.user.name);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'That code could not be verified. Request a new code and try again.'); }
    finally { setBusy(false); }
  };

  const sendCode = async (email: string, purpose: 'verification' | 'login') => {
    if (!email.trim()) { setError('Enter your email address first.'); return false; }
    setResendBusy(true); setResendMessage(''); setResendIsError(false); setError('');
    try {
      const endpoint = purpose === 'verification' ? '/auth/resend-verification' : '/auth/login-code';
      await apiRequest(endpoint, '', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setVerificationEmail(email.trim()); setCode('');
      setResendMessage(purpose === 'verification' ? 'If this address needs verification, a new code will be sent shortly. Check your inbox and spam folder.' : 'If an eligible account exists, a sign-in code will be sent shortly. Check your inbox and spam folder.');
      if (purpose === 'login') setLoginCodePending(true);
      return true;
    } catch (reason) { setResendIsError(true); setResendMessage(reason instanceof Error ? reason.message : 'Could not send a code. Please try again.'); return false; }
    finally { setResendBusy(false); }
  };

  const requestLoginCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await sendCode(String(form.get('email') || ''), 'login');
  };

  const requestPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); setResendMessage('');
    const form = new FormData(event.currentTarget), email = String(form.get('resetEmail') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); setBusy(false); return; }
    try {
      await apiRequest('/auth/password-reset/request', '', { method: 'POST', body: JSON.stringify({ email }) });
      setVerificationEmail(email); setCode(''); setResetPending(true);
      setResendMessage('If an eligible account exists, a reset code has been sent. Check your inbox and spam folder.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not request a password reset. Please try again.'); }
    finally { setBusy(false); }
  };

  const confirmPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget), password = String(form.get('newPassword') || '');
    if (password.length < 8) { setError('Use at least 8 characters for your new password.'); setBusy(false); return; }
    try {
      await apiRequest('/auth/password-reset/confirm', '', { method: 'POST', body: JSON.stringify({ email: verificationEmail, code, password }) });
      setResetPending(false); setForgotView(false); setVerificationEmail(''); setCode(''); setError(''); setResendMessage('Password updated. Sign in with your new password.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not reset your password. Check the code and try again.'); }
    finally { setBusy(false); }
  };

  const changeMode = (next: 'login' | 'register') => { setMode(next); setError(''); setFieldErrors({}); setSignupPending(false); setLoginCodePending(false); setResetPending(false); setForgotView(false); setVerificationEmail(''); setCode(''); setResendMessage(''); navigate(next === 'login' ? '/login' : '/signup'); };

  const renderCodePanel = (signup: boolean) => (
    <div className="auth-fade">
      <div className="verify-icon"><MailCheck size={25} /></div>
      <h1>{signup ? 'Verify your email' : 'Check your inbox'}</h1>
      <p>{signup ? (verificationHint || 'Enter the six-digit code we sent to activate your account.') : 'Enter the six-digit sign-in code we sent to your email.'}</p>
      <div className="verify-address"><Mail size={16} /> {verificationEmail || 'Enter your email below'}</div>
      <form onSubmit={verifyCode}>
        {!verificationEmail && <Field label="Email address" name="verificationEmail" type="email" placeholder="you@example.com" icon={Mail} onChange={setVerificationEmail} />}
        <label className="field">Six-digit code
          <span className="input-icon"><MailCheck size={17} /><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></span>
        </label>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="primary submit" disabled={busy || code.length !== 6}>{busy ? <><Loader2 size={17} className="spin" /> Checking code…</> : <>Verify and continue <ArrowRight size={17} /></>}</button>
      </form>
      <button className="text-button resend-inline" disabled={resendBusy || !verificationEmail} onClick={() => void sendCode(verificationEmail, signup ? 'verification' : 'login')}>{resendBusy ? 'Sending…' : 'Send a new code'}</button>
      {resendMessage && <small className={'verify-feedback' + (resendIsError ? ' err' : '')} role="status">{resendMessage}</small>}
      <button className="text-button auth-switch" onClick={() => { setSignupPending(false); setLoginCodePending(false); setVerificationEmail(''); setCode(''); setError(''); }}>Back to sign in</button>
    </div>
  );

  return (
    <div className="auth-page">
      {onToggleTheme && <button className="icon-button auth-theme" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>}
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="brand"><span className="logo"><img src="/rewisely-icon.png" alt="" /></span><span>Rewi<span>sely</span></span></div>
          <h2>Remember more with <em>spaced revision</em>.</h2>
          <p>Add a topic once and Rewisely plans every repeat for you, so nothing you study ever slips away.</p>
          <ul className="auth-features">
            <li><span className="feature-icon violet"><RefreshCw size={18} /></span><div><b>Revisions on autopilot</b><small>Choose a gap and we schedule every repeat.</small></div></li>
            <li><span className="feature-icon orange"><Bell size={18} /></span><div><b>Never miss a due date</b><small>Due, overdue and upcoming, always clear.</small></div></li>
            <li><span className="feature-icon green"><BarChart3 size={18} /></span><div><b>See your progress grow</b><small>Dashboard, calendar and analytics together.</small></div></li>
          </ul>
          <div className="auth-preview" aria-hidden="true">
            <div className="preview-card one"><span className="topic-icon"><CalendarClock size={17} /></span><div><b>Normalization</b><small>DBMS · Revision 2</small></div><em className="badge due-today">Due today</em></div>
            <div className="preview-card two"><span className="topic-icon green"><Check size={17} /></span><div><b>Binary Search</b><small>DSA · Revision 3</small></div><em className="badge completed">Completed</em></div>
          </div>
        </section>

        <div className="auth-card">
          <div className="brand"><span className="logo"><img src="/rewisely-icon.png" alt="" /></span><span>Rewi<span>sely</span></span></div>
          {resetPending ? (
            <div className="auth-fade">
              <div className="verify-icon"><KeyRound size={25} /></div><h1>Reset your password</h1>
              <p>Enter the six-digit code sent to <b>{verificationEmail}</b> and choose a new password.</p>
              <form onSubmit={confirmPasswordReset}>
                <label className="field">Six-digit code<span className="input-icon"><MailCheck size={17} /><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></span></label>
                <Field label="New password" name="newPassword" type="password" placeholder="At least 8 characters" icon={Lock} />
                {error && <div className="auth-error" role="alert">{error}</div>}
                <button className="primary submit" disabled={busy || code.length !== 6}>{busy ? <><Loader2 size={17} className="spin" /> Updating…</> : <>Update password <ArrowRight size={17} /></>}</button>
              </form>
              {resendMessage && <small className="verify-feedback" role="status">{resendMessage}</small>}
              <button className="text-button auth-switch" onClick={() => { setResetPending(false); setCode(''); setError(''); }}>Back to sign in</button>
            </div>
          ) : forgotView ? (
            <div className="auth-fade">
              <div className="verify-icon"><MailCheck size={25} /></div><h1>Forgot your password?</h1>
              <p>We’ll email you a one-time code so you can choose a new password.</p>
              <form onSubmit={requestPasswordReset}>
                <Field label="Email address" name="resetEmail" type="email" placeholder="you@example.com" icon={Mail} defaultValue={verificationEmail} />
                {error && <div className="auth-error" role="alert">{error}</div>}
                <button className="primary submit" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Sending code…</> : <>Send reset code <ArrowRight size={17} /></>}</button>
              </form>
              <button className="text-button auth-switch" onClick={() => { setForgotView(false); setError(''); setResendMessage(''); }}>Back to sign in</button>
            </div>
          ) : signupPending ? renderCodePanel(true) : loginCodePending ? renderCodePanel(false) : isVerifyPage ? (
            <div className="auth-fade">
              <div className="verify-icon"><MailCheck size={25} /></div><h1>Verify your email</h1>
              <p>Enter your signup email to receive a fresh verification code.</p>
              <form onSubmit={async event => { event.preventDefault(); const form = new FormData(event.currentTarget); await sendCode(String(form.get('email') || ''), 'verification'); setSignupPending(true); }}>
                <Field label="Email address" name="email" type="email" placeholder="you@example.com" icon={Mail} defaultValue={verificationEmail} />
                <button className="primary submit" disabled={resendBusy}>{resendBusy ? 'Sending…' : 'Send verification code'} <ArrowRight size={17} /></button>
              </form>
              {resendMessage && <small className={'verify-feedback' + (resendIsError ? ' err' : '')} role="status">{resendMessage}</small>}
              <button className="text-button auth-switch" onClick={() => navigate('/login')}>Back to sign in</button>
            </div>
          ) : (
            <>
              <div className="auth-fade" key={mode}>
                <h1>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
                <p>{mode === 'login' ? 'Sign in to continue your revision plan.' : 'Start keeping your study history in one place.'}</p>
                <form onSubmit={submit} noValidate>
                  {mode === 'register' && <Field label="Name" name="name" placeholder="Your name" icon={User} error={fieldErrors.name} onChange={() => setFieldErrors(value => ({ ...value, name: '' }))} />}
                  <Field label="Email" name="email" type="email" placeholder="you@example.com" icon={Mail} error={fieldErrors.email} onChange={() => setFieldErrors(value => ({ ...value, email: '' }))} />
                  <Field label="Password" name="password" type="password" placeholder="At least 8 characters" icon={Lock} error={fieldErrors.password} onChange={() => setFieldErrors(value => ({ ...value, password: '' }))} />
                  {mode === 'login' && <button type="button" className="text-button forgot-password" onClick={() => { setError(''); setResendMessage(''); setResetPending(false); setVerificationEmail(''); setCode(''); setResendIsError(false); setSignupPending(false); setLoginCodePending(false); setMode('login'); setForgotView(true); }}>Forgot password?</button>}
                  {error && <div className="auth-error" role="alert">{error}</div>}
                  {mode === 'login' && verificationEmail && <button type="button" className="text-button resend-inline" disabled={resendBusy} onClick={async () => { if (await sendCode(verificationEmail, 'verification')) setSignupPending(true); }}>{resendBusy ? 'Sending…' : 'Send email verification code'}</button>}
                  <button className="primary submit" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Please wait…</> : <>{mode === 'login' ? 'Sign in with password' : 'Create account'} <ArrowRight size={17} /></>}</button>
                </form>
                {mode === 'login' && <>
                  <div className="oauth-divider"><span />or<span /></div>
                  <form className="email-code-form" onSubmit={requestLoginCode}>
                    <Field label="Sign in with an email code" name="email" type="email" placeholder="you@example.com" icon={Mail} />
                    <button type="submit" className="soft" disabled={resendBusy}>{resendBusy ? <><Loader2 size={15} className="spin" /> Sending…</> : <>Email me a sign-in code <ArrowRight size={15} /></>}</button>
                  </form>
                  {resendMessage && <small className={'verify-feedback' + (resendIsError ? ' err' : '')} role="status">{resendMessage}</small>}
                </>}
              </div>
              <div className="oauth-divider"><span />or continue with<span /></div>
              <button className="google-button" onClick={() => { window.location.href = API_URL + '/auth/google'; }}><b>G</b> Continue with Google</button>
              <button className="text-button auth-switch" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, placeholder, type = 'text', icon: Icon, defaultValue, onChange, error }: { label: string; name: string; placeholder?: string; type?: string; icon: LucideIcon; defaultValue?: string; onChange?: (value: string) => void; error?: string }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="field">
      {label}
      <span className="input-icon">
        <Icon size={17} />
        <input required name={name} type={isPassword && show ? 'text' : type} placeholder={placeholder} defaultValue={defaultValue} aria-invalid={!!error} onChange={event => onChange?.(event.target.value)} />
        {isPassword && <button type="button" className="reveal" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(value => !value)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
      </span>
      {error && <small className="field-error" role="alert">{error}</small>}
    </label>
  );
}
