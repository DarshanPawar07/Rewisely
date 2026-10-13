import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, Clock3, Flame, ListChecks, RefreshCw, Sparkles, Target } from 'lucide-react';
import { SeoMeta } from './GuidePages';

type Props = { theme: 'light' | 'dark'; onToggleTheme: () => void };

const features = [
  { icon: RefreshCw, tone: 'violet', title: 'Revision, right on time', text: 'Plan a topic once. Rewisely lays out the revision dates so you can return to what you learned before it fades.' },
  { icon: ListChecks, tone: 'green', title: 'A clearer day and week', text: 'Keep daily tasks and weekly targets together, then check them off as you make progress.' },
  { icon: BookOpen, tone: 'blue', title: 'Follow every chapter', text: 'Build a study workflow that fits each subject and see which chapters are ready for the next step.' },
  { icon: CalendarDays, tone: 'orange', title: 'See your study at a glance', text: 'Your revisions and tasks come together in a calendar, with progress and upcoming work easy to spot.' },
];

export function LandingPage({ theme, onToggleTheme }: Props) {
  return (
    <div className="landing-page">
      <SeoMeta title="Rewisely — Plan revisions and build better study habits" description="Plan spaced revision, organise study tasks, and track your progress across subjects with Rewisely, a calmer study-planning workspace." path="/" />
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="Rewisely home"><img src="/rewisely-icon.png" alt="" /><span>Rewi<span>sely</span></span></Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">Features</a><a href="#how-it-works">How it works</a><Link to="/guides">Study guides</Link>
        </nav>
        <div className="landing-actions">
          <button className="landing-theme" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? '☀' : '☾'}</button>
          <Link className="landing-login" to="/login">Log in</Link>
          <Link className="landing-signup" to="/signup">Sign up <ArrowRight size={16} /></Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-kicker"><Sparkles size={14} /> A calmer way to study</div>
            <h1>Make what you learn <span>stay with you.</span></h1>
            <p className="landing-lede">Plan revisions, organise your study tasks, and track every chapter’s progress—all in one focused workspace.</p>
            <div className="landing-hero-actions"><Link className="landing-signup landing-cta" to="/signup">Get started for free <ArrowRight size={17} /></Link><Link className="landing-secondary" to="/login">I already have an account</Link></div>
            <div className="landing-proof"><span><CheckCircle2 size={16} /> Your own study plan</span><span><CheckCircle2 size={16} /> Flexible subject workflows</span></div>
          </div>

          <div className="landing-preview-wrap" aria-label="Illustration of a study dashboard">
            <div className="landing-orb landing-orb-one" /><div className="landing-orb landing-orb-two" />
            <div className="landing-preview">
              <div className="preview-top"><div><span className="preview-eyebrow">YOUR STUDY SPACE</span><h2>Today’s focus</h2></div><span className="preview-avatar">S</span></div>
              <div className="preview-focus"><div className="preview-focus-icon"><Target size={19} /></div><div><b>Small steps add up.</b><small>Your plan, ready when you are.</small></div><span className="preview-spark">✦</span></div>
              <div className="preview-section-head"><b>Coming up</b><span>This week</span></div>
              <div className="preview-event"><span className="preview-event-icon purple"><RefreshCw size={15} /></span><div><b>Revise: Binary Search</b><small><Clock3 size={12} /> Today · 10:30 AM</small></div><span className="preview-status">Revision</span></div>
              <div className="preview-event"><span className="preview-event-icon green"><Check size={15} /></span><div><b>Finish practice questions</b><small><CalendarDays size={12} /> Today · Daily task</small></div><span className="preview-status task">Task</span></div>
              <div className="preview-progress"><div><span>Study workflow</span><b>3 of 5 steps</b></div><div className="preview-progress-track"><i /></div><div className="preview-steps"><span className="done">Learn</span><span className="done">Notes</span><span className="done">Revise</span><span>Practice</span><span>Review</span></div></div>
            </div>
            <div className="preview-float"><span><Flame size={17} /></span><div><b>Keep your momentum</b><small>One session at a time</small></div></div>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="landing-section-heading"><span>MADE FOR THE WAY YOU STUDY</span><h2>One home for your learning routine.</h2><p>Bring your plans and progress into focus, without making studying feel like another project to manage.</p></div>
          <div className="landing-feature-grid">{features.map(({ icon: Icon, tone, title, text }) => <article className="landing-feature" key={title}><span className={'landing-feature-icon ' + tone}><Icon size={19} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="landing-how" id="how-it-works">
          <div className="landing-how-copy"><span>YOUR NEXT STUDY SESSION</span><h2>Know what to do next.</h2><p>Add a topic or task, choose a plan that works for you, and let Rewisely keep the details organised while you focus on learning.</p><Link className="landing-inline-link" to="/signup">Create your free account <ArrowRight size={16} /></Link></div>
          <div className="landing-how-steps"><div><span>01</span><div><b>Add what you’re studying</b><small>Create topics, chapters, tasks, or a weekly target.</small></div></div><div><span>02</span><div><b>Choose your rhythm</b><small>Set revision dates and shape a workflow for each subject.</small></div></div><div><span>03</span><div><b>Keep moving forward</b><small>Track completed work and see what’s coming up next.</small></div></div></div>
        </section>

        <section className="landing-bottom-cta"><div><span>YOUR STUDY SPACE IS READY</span><h2>Start with one topic.</h2><p>Build a routine that helps your learning stick.</p></div><Link className="landing-signup landing-cta" to="/signup">Get started for free <ArrowRight size={17} /></Link></section>
      </main>
      <footer className="landing-footer"><Link className="landing-brand" to="/" aria-label="Rewisely home"><img src="/rewisely-icon.png" alt="" /><span>Rewi<span>sely</span></span></Link><small>Plan a little. Remember a lot.</small><Link className="landing-guides-link" to="/guides">Study guides</Link></footer>
    </div>
  );
}
