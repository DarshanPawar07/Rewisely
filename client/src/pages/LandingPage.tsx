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
      <SeoMeta title="Study Planner & Revision Tracker for Exam Prep | Rewisely" description="Plan study sessions, schedule revisions, and track subjects and chapters in one study planner. Build a routine for JEE, NEET, UPSC, MPSC, or any exam." path="/" />
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
              <div className="preview-event"><span className="preview-event-icon purple"><RefreshCw size={15} /></span><div><b>Revise: Quadratic Equations</b><small><Clock3 size={12} /> Today · 10:30 AM</small></div><span className="preview-status">Revision</span></div>
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

        <section className="landing-exam-plans" aria-labelledby="exam-plans-title">
          <div className="landing-section-heading"><span>YOUR EXAM, YOUR SYLLABUS</span><h2 id="exam-plans-title">A study planner that fits what you’re preparing for.</h2><p>Bring your own subjects and chapters. Rewisely helps you turn them into a routine you can follow and revise.</p></div>
          <div className="landing-exam-grid">
            <article><span>JEE</span><h3>Physics, Chemistry, Maths</h3><p>Plan a chapter, add practice, and schedule a return to tricky concepts.</p></article>
            <article><span>NEET</span><h3>Biology, Chemistry, Physics</h3><p>Organise topics across subjects and keep revision from slipping through the week.</p></article>
            <article><span>UPSC · MPSC</span><h3>Polity, History, Geography</h3><p>Break a broad syllabus into manageable topics and track what you’ve covered.</p></article>
          </div>
          <p className="landing-exam-note">These are examples to get started—you can use Rewisely for any subject, syllabus, or exam.</p>
        </section>

        <section className="landing-faq" aria-labelledby="landing-faq-title">
          <div className="landing-section-heading"><span>QUICK ANSWERS</span><h2 id="landing-faq-title">A few things students ask.</h2></div>
          <div className="landing-faq-list">
            <details><summary>Can I use Rewisely for JEE, NEET, UPSC, or MPSC preparation?</summary><p>Yes. Add the subjects, chapters, and topics from your own syllabus, then organise study tasks and revisions around your schedule.</p></details>
            <details><summary>Does Rewisely provide exam notes or a fixed syllabus?</summary><p>Rewisely is a planning and progress-tracking workspace. You bring your own learning materials and syllabus; it helps you organise what to study and revisit.</p></details>
            <details><summary>Can I plan revisions as well as daily study tasks?</summary><p>Yes. Keep revision sessions, daily tasks, and weekly targets together so it’s easier to see what’s next.</p></details>
          </div>
        </section>

        <section className="landing-bottom-cta"><div><span>YOUR STUDY SPACE IS READY</span><h2>Start with one topic.</h2><p>Build a routine that helps your learning stick.</p></div><Link className="landing-signup landing-cta" to="/signup">Get started for free <ArrowRight size={17} /></Link></section>
      </main>
      <footer className="landing-footer"><Link className="landing-brand" to="/" aria-label="Rewisely home"><img src="/rewisely-icon.png" alt="" /><span>Rewi<span>sely</span></span></Link><small>Plan a little. Remember a lot.</small><nav className="landing-footer-links" aria-label="More about Rewisely"><Link className="landing-guides-link" to="/guides">Study guides</Link><Link className="landing-guides-link" to="/about">About</Link><Link className="landing-guides-link" to="/contact">Contact</Link></nav></footer>
    </div>
  );
}
