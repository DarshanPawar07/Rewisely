import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpenCheck, CalendarDays, Clock3, RefreshCw, Sparkles } from 'lucide-react';
import './guides.css';

const SITE_URL = 'https://www.rewisely.online';

type Guide = {
  slug: string;
  title: string;
  cardTitle: string;
  description: string;
  readTime: string;
  category: string;
  icon: typeof RefreshCw;
  sections: { id: string; heading: string; content: string[] }[];
};

export const guides: Guide[] = [
  {
    slug: 'spaced-revision', title: 'A practical guide to spaced revision', cardTitle: 'How to use spaced revision to remember more',
    description: 'Learn how spaced revision works, how to plan useful review sessions, and how to build a repeatable revision routine around what you have studied.',
    readTime: '6 min read', category: 'Revision methods', icon: RefreshCw,
    sections: [
      { id: 'what-is-spaced-revision', heading: 'What is spaced revision?', content: [
        'Spaced revision means returning to information more than once, with time between sessions. Instead of rereading a chapter repeatedly in one evening, you review it again over the following days or weeks. The small effort of bringing an idea back to mind helps you notice what you still know and what needs attention.',
        'It is not a magic timetable that works identically for everyone. A useful schedule gives you repeat opportunities to retrieve important ideas, while leaving enough room for sleep, classes, assignments, and other subjects.'
      ] },
      { id: 'start-with-retrieval', heading: 'Start with retrieval, not rereading', content: [
        'Before opening your notes, pause and try to explain the topic from memory. Write down a formula, draw a process, solve a representative problem, or answer a few questions. Then compare your attempt with your notes and correct any gaps. This makes a revision session active: you are checking what you can produce, not just what looks familiar on the page.',
        'Keep a short record of the points you missed. Those are better targets for the next session than copying the entire chapter again.'
      ] },
      { id: 'choose-an-interval', heading: 'Choose an interval you can sustain', content: [
        'A practical first schedule might be a short review the next day, another several days later, and a further review the following week. Adjust the gaps to the difficulty of the material and your upcoming exam dates. If a concept is still shaky, bring it back sooner; if you can explain and apply it reliably, give it more time before the next check.',
        'The best schedule is one you can actually follow. Start with a modest number of reviews, then change the interval when your results show that you need more or less practice.'
      ] },
      { id: 'make-each-session-useful', heading: 'Make every review session specific', content: [
        'Give each session a clear task: solve three problems without notes, list the main arguments, label a diagram, or teach the idea aloud in two minutes. A specific task is easier to start and easier to evaluate than “study chapter 4.”',
        'Finish by recording what felt difficult and one next action. Rewisely can help keep the dates and topic list organised, while your session itself stays focused on remembering and applying the material.'
      ] }
    ]
  },
  {
    slug: 'weekly-study-planning', title: 'How to make a weekly study plan you can follow', cardTitle: 'Plan a realistic study week',
    description: 'Build a weekly study plan around your real commitments, split large goals into clear tasks, and leave room to adjust when the week changes.',
    readTime: '5 min read', category: 'Planning', icon: CalendarDays,
    sections: [
      { id: 'begin-with-fixed-commitments', heading: 'Begin with the week you actually have', content: [
        'Before adding study blocks, note the fixed parts of your week: classes, work, travel, meals, sleep, and existing commitments. This gives you an honest view of the time that remains. A plan built around imaginary free time usually becomes discouraging by Tuesday.',
        'Choose a few realistic study windows and protect breaks between them. Short, repeatable sessions are often easier to keep than a single long block that leaves no flexibility.'
      ] },
      { id: 'turn-outcomes-into-tasks', heading: 'Turn broad goals into finishable tasks', content: [
        '“Study chemistry” does not tell you when you are finished. Replace it with an observable outcome: review reaction mechanisms, solve ten equilibrium questions, or make a one-page summary of a lecture. A clear task reduces the energy needed to get started and makes progress visible.',
        'For a large goal, split the work across the week. Keep each task small enough to fit the time you have actually allocated.'
      ] },
      { id: 'balance-the-week', heading: 'Balance new learning and revision', content: [
        'A study week needs room for both upcoming learning and previously covered material. Reserve a few sessions for current coursework and a few smaller slots for recall practice or problem solving from earlier topics. This prevents revision from being postponed until an exam is close.',
        'Prioritise using deadlines, difficulty, and what you currently find uncertain. Do not fill every available minute; a little buffer makes the plan resilient when a class runs late or a task takes longer than expected.'
      ] },
      { id: 'review-and-adjust', heading: 'Review the plan without treating it as a score', content: [
        'At the end of the week, look at what was completed and what moved. Ask whether the tasks were too large, the time estimates were unrealistic, or an unexpected commitment appeared. Then carry forward only what still matters and make next week’s plan more specific.',
        'A weekly target is a guide, not a promise that every day will go exactly to plan. The goal is to make the next useful action clear and keep returning to it.'
      ] }
    ]
  },
  {
    slug: 'active-recall', title: 'Active recall: a simple way to test what you know', cardTitle: 'Use active recall for deeper learning',
    description: 'A practical introduction to active recall: how to test yourself, check your understanding, and use mistakes to guide your next study session.',
    readTime: '5 min read', category: 'Learning techniques', icon: BookOpenCheck,
    sections: [
      { id: 'what-active-recall-means', heading: 'What active recall means', content: [
        'Active recall is the effort of bringing information to mind without looking at the answer first. You might answer a question from memory, reproduce a diagram, explain a proof, or work through a problem with your notes closed. The attempt gives you evidence about what you can retrieve on your own.',
        'Reading can still be useful when you are first learning something or correcting an error. The key is to add a moment where you try to produce the idea yourself.'
      ] },
      { id: 'simple-recall-prompts', heading: 'Use simple prompts', content: [
        'After a section, close the book and ask: What were the main ideas? How would I explain this to someone new? Which steps does this method require? When would this formula not apply? For a language, try recalling vocabulary in both directions. For a technical subject, solve a fresh example rather than memorising a worked solution.',
        'Prompts should match the kind of performance you need later. If the assessment asks you to solve problems, practise solving; if it asks for explanations, practise explaining.'
      ] },
      { id: 'check-correct-reflect', heading: 'Check, correct, and try again', content: [
        'After your attempt, compare it with a reliable source. Mark what was correct, what was incomplete, and what was mistaken. Correct the answer in your own words, then move on. Avoid turning the check into an extended rereading session; the goal is to use the result to choose the next practice task.',
        'A mistake is useful when it changes what you do next. Keep a short list of recurring errors, confusing distinctions, or steps you tend to skip.'
      ] },
      { id: 'combine-with-spacing', heading: 'Combine recall with spaced revision', content: [
        'Try recalling the material after a short delay, then return to it again later. Each review can use a different prompt: explain the concept today, solve a problem later in the week, and compare two related ideas after that. Varying the task helps you check whether you understand the topic beyond one memorised answer.',
        'Keep sessions manageable. A handful of well-chosen questions followed by careful feedback is more useful than a long list you rush through without checking.'
      ] }
    ]
  },
  {
    slug: 'competitive-exam-study-plan', title: 'How to make a realistic study plan for competitive exams', cardTitle: 'Make a competitive-exam study plan',
    description: 'A practical way to turn a JEE, NEET, UPSC, or MPSC syllabus into weekly study blocks, revision sessions, and clear next steps.',
    readTime: '7 min read', category: 'Exam preparation', icon: CalendarDays,
    sections: [
      { id: 'map-the-syllabus', heading: 'Map the syllabus before filling a calendar', content: [
        'Write down the subjects and topics you need to cover, then mark each topic as not started, in progress, or ready for review. Use your official syllabus and current materials as the source of truth. This simple inventory makes it easier to spot what is urgent without treating every chapter as equally difficult.',
        'Keep the first version small: list the topics you plan to study this week, not every task for the months ahead. A plan should help you make the next decision, not become a second syllabus to maintain.'
      ] },
      { id: 'prioritise-with-evidence', heading: 'Prioritise using evidence, not panic', content: [
        'Choose work based on exam relevance, upcoming classes or tests, and what your own practice shows you have not mastered. A low mock-test score can point to a topic to revisit, but look at the errors: was it a concept gap, a calculation slip, or time pressure? Each cause suggests a different next task.',
        'Avoid spending the whole week only on weak areas or only on new chapters. Reserve time for current learning, problem practice, and short returns to older material.'
      ] },
      { id: 'build-a-repeatable-week', heading: 'Build a week you can repeat', content: [
        'Start with fixed commitments such as school, coaching, travel, meals, and sleep. Put study blocks into the time that remains and leave some buffer for tasks that run long. Give every block a finish line, such as “solve and review 12 problems on motion,” instead of “do physics.”',
        'Mix subjects across the week in a way that fits your timetable and attention. Shorter focused sessions can be easier to restart than a single exhausting block. If you miss one, move the important task deliberately rather than trying to repay every missed hour at once.'
      ] },
      { id: 'include-revision-and-review', heading: 'Schedule revision and a weekly reset', content: [
        'When you finish a topic, decide when you will test yourself on it again. Start with a manageable next review and adjust based on how well you can recall or apply the material. Use questions, blank-page explanations, diagrams, or worked problems instead of relying only on rereading.',
        'At the end of the week, check what was completed and what needs to move. Keep the unfinished work that still matters, reduce tasks that were too large, and make next week’s plan from the time you actually have. Rewisely can keep topics, revision dates, daily tasks, and weekly targets together.'
      ] }
    ]
  },
  {
    slug: 'catch-up-study-backlog', title: 'How to catch up on a study backlog without burning out', cardTitle: 'Reset a study backlog calmly',
    description: 'Missed study targets happen. Use this step-by-step reset to sort unfinished work, choose what matters, and restart a study routine without cramming everything.',
    readTime: '6 min read', category: 'Study habits', icon: BookOpenCheck,
    sections: [
      { id: 'stop-the-growing-list', heading: 'Stop treating every missed task as equally urgent', content: [
        'A backlog can feel like one giant problem because old tasks and current work sit in the same list. First, collect the unfinished items in one place. Remove duplicates and tasks that are no longer useful, then label what is tied to an upcoming class, test, or prerequisite.',
        'Do not automatically copy every missed task into tomorrow. That makes the new plan impossible before the day begins and hides the few actions that would actually help.'
      ] },
      { id: 'pick-the-next-three', heading: 'Choose a small set of next actions', content: [
        'Pick one task that protects current learning, one important older topic to revisit, and—if time allows—one short task that clears friction. Make each action specific enough to finish: read a defined section and answer questions, solve a short set and review mistakes, or outline one topic from memory.',
        'If you are unsure what to prioritise, ask what will block the next lesson or what your recent practice shows is most uncertain. A teacher, course plan, or official syllabus can help resolve conflicts.'
      ] },
      { id: 'use-realistic-blocks', heading: 'Restart with realistic study blocks', content: [
        'Plan around the hours you genuinely have after sleep, meals, classes, and other responsibilities. Begin with a block you can complete and a clear break afterwards. A consistent restart is more useful than an extreme catch-up day that leaves you too tired to continue.',
        'When a task takes longer than expected, decide whether to finish it, split it, or move a lower-priority item. That is normal adjustment, not failure.'
      ] },
      { id: 'review-without-guilt', heading: 'Review the system, not your character', content: [
        'After a few days, check whether the plan fit your actual schedule. If tasks repeatedly roll over, they may be too broad, too numerous, or placed at the wrong time. Break them down and reduce the weekly load until it is workable.',
        'Keep a separate short list for later work so it does not compete with today’s priorities. Rewisely can help organise daily tasks, weekly targets, and topic revisions in one place; the goal is a clear next step, not a perfect streak.'
      ] }
    ]
  },
  {
    slug: 'study-multiple-subjects', title: 'How to study multiple subjects in one week', cardTitle: 'Balance several subjects in a study week',
    description: 'Learn how to divide study time across subjects, alternate focused sessions, and keep revision moving when your syllabus has many topics.',
    readTime: '5 min read', category: 'Planning', icon: RefreshCw,
    sections: [
      { id: 'list-subject-work', heading: 'List the actual work for each subject', content: [
        'Start by writing the next concrete task for each subject. “Maths” is too broad; “review quadratic equations and solve a short mixed set” is easier to schedule. Include deadlines, upcoming lessons, and topics that need revision so your plan reflects more than just new chapters.',
        'This list helps reveal when one subject is taking all the available time. It also makes it easier to move a task without losing sight of what it involves.'
      ] },
      { id: 'choose-weekly-allocation', heading: 'Allocate time by need, not by equal slices', content: [
        'Subjects may need different amounts of time this week. Consider exam dates, class pace, task size, and how confidently you can solve or explain the material. Give more attention where there is a real need, while keeping a small regular touchpoint with other important subjects.',
        'Avoid changing the entire schedule every time you feel behind. Make a weekly plan, then adjust only when new information—such as a test result or class deadline—makes a change worthwhile.'
      ] },
      { id: 'alternate-session-types', heading: 'Alternate the kind of work you do', content: [
        'A week can include learning new material, solving problems, recalling older topics, and reviewing mistakes. Switching the type of effort can make a full week feel less repetitive, but keep each individual session focused on one clear outcome.',
        'For example, a physics session might focus on solving problems while a biology session uses a diagram from memory. Match the activity to the way you need to use the knowledge later.'
      ] },
      { id: 'leave-room-to-adjust', heading: 'Leave room to adjust', content: [
        'Do not schedule every available minute. A buffer helps when a topic is harder than expected or a commitment changes. At the end of the week, carry forward only tasks that remain important and resize anything that did not fit.',
        'Track the next revision date as well as the next new topic. Rewisely lets you keep subject workflows, revision sessions, and weekly targets together so you can see the balance at a glance.'
      ] }
    ]
  }
];

export function SeoMeta({ title, description, path, type = 'website', indexable = true }: { title: string; description: string; path: string; type?: 'website' | 'article'; indexable?: boolean }) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;
    document.title = title;
    setMeta('description', description);
    setMeta('robots', indexable ? 'index,follow' : 'noindex,follow');
    setMeta('og:type', type, 'property');
    setMeta('og:site_name', 'Rewisely', 'property');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:image', `${SITE_URL}/rewisely-icon.png`, 'property');
    setMeta('twitter:card', 'summary', 'name');
    setMeta('twitter:title', title, 'name');
    setMeta('twitter:description', description, 'name');
    setMeta('twitter:image', `${SITE_URL}/rewisely-icon.png`, 'name');
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    const structuredData = path === '/'
      ? [
          { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Rewisely', alternateName: ['Rewisely Online', 'rewisely.online'], url: `${SITE_URL}/` },
          { '@context': 'https://schema.org', '@type': 'Organization', name: 'Rewisely', url: `${SITE_URL}/`, logo: `${SITE_URL}/rewisely-icon.png` },
        ]
      : type === 'article'
        ? [
            { '@context': 'https://schema.org', '@type': 'Article', headline: title, description, mainEntityOfPage: canonicalUrl, author: { '@type': 'Organization', name: 'Rewisely' }, publisher: { '@type': 'Organization', name: 'Rewisely', logo: { '@type': 'ImageObject', url: `${SITE_URL}/rewisely-icon.png` } } },
            { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Study Guides', item: `${SITE_URL}/guides` },
              { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
            ] },
          ]
        : [];
    let schema = document.head.querySelector<HTMLScriptElement>('script[data-rewisely-schema]');
    if (structuredData.length) {
      if (!schema) { schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.dataset.rewiselySchema = ''; document.head.appendChild(schema); }
      schema.textContent = JSON.stringify(structuredData);
    } else schema?.remove();
    return () => { document.querySelector('script[data-rewisely-schema]')?.remove(); };
  }, [title, description, path, type, indexable]);
  return null;
}

function setMeta(key: string, content: string, attribute: 'name' | 'property' = 'name') {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, key); document.head.appendChild(tag); }
  tag.content = content;
}

export function GuideIndexPage() {
  const description = 'Practical guides to exam study planning, spaced revision, active recall, managing a study backlog, and balancing subjects in a realistic week.';
  return (
    <div className="guides-page">
      <SeoMeta title="Study Guides for Better Revision and Planning | Rewisely" description={description} path="/guides" />
      <PublicHeader />
      <main className="guides-main">
        <div className="guides-hero"><span className="guide-kicker"><Sparkles size={14} /> THE REWISELY STUDY LIBRARY</span><h1>Practical study guides for your next step.</h1><p>Find realistic advice on exam planning, revision, active recall, study backlogs, and balancing several subjects. Use what fits your routine and leave the rest.</p></div>
        <section className="guide-grid" aria-label="Study guides">
          {guides.map(guide => { const Icon = guide.icon; return <article className="guide-card" key={guide.slug}><span className="guide-card-icon"><Icon size={20} /></span><div className="guide-card-meta">{guide.category}<span>·</span><span>{guide.readTime}</span></div><h2><Link to={`/guides/${guide.slug}`}>{guide.cardTitle}</Link></h2><p>{guide.description}</p><Link className="guide-link" to={`/guides/${guide.slug}`}>Read guide <ArrowRight size={15} /></Link></article>; })}
        </section>
        <section className="guides-cta"><div><span>PUT YOUR PLAN INTO PRACTICE</span><h2>Keep your study routine in one place.</h2><p>Plan revision dates, organise tasks, and follow progress across your subjects.</p></div><Link className="landing-signup" to="/signup">Try Rewisely free <ArrowRight size={16} /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

export function AboutPage() {
  const description = 'Learn what Rewisely is: a study-planning workspace for organising subjects, topics, revision sessions, daily tasks, and weekly targets.';
  return (
    <div className="guides-page">
      <SeoMeta title="About Rewisely | A Study Planner for Students" description={description} path="/about" />
      <PublicHeader />
      <main className="guide-article-main">
        <Link className="guide-back" to="/"><ArrowLeft size={15} /> Home</Link>
        <article className="guide-article">
          <header className="guide-article-head">
            <span className="guide-kicker"><Sparkles size={14} /> ABOUT REWISELY</span>
            <h1>A calmer place to organise your study routine.</h1>
            <p className="guide-dek">A focused workspace to plan what you’ll study, when you’ll revisit it, and how your routine is taking shape.</p>
          </header>
          <div className="guide-body">
            <section><h2>One home for your study plan</h2><p>Rewisely brings subjects, topics, revision sessions, daily tasks, and weekly targets together in one place—so it’s easier to see what to do next and keep moving at your own pace.</p></section>
            <section><h2>Made for your own syllabus</h2><p>Whether you’re preparing for JEE, NEET, UPSC, MPSC, school, or college exams, you can add your own subjects and topics and shape a workflow that fits your learning routine. Rewisely helps you organise your plan; it does not provide exam notes or promise a particular result.</p></section>
            <section><h2>Keep the next step visible</h2><p>Plan a topic, choose when to review it, and track what you complete. The aim is to make it easier to return to your learning consistently—not to make your study plan another source of pressure.</p></section>
          </div>
          <aside className="guide-callout"><Sparkles size={20} /><div><b>Start with one small step</b><p>Add a subject, choose a topic, and build a routine that works for you.</p><Link to="/signup">Start planning <ArrowRight size={15} /></Link></div></aside>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

export function ContactPage() {
  const description = 'Contact Rewisely with product feedback or bug reports through the public project support page.';
  return (
    <div className="guides-page">
      <SeoMeta title="Contact Rewisely | Help and Feedback" description={description} path="/contact" />
      <PublicHeader />
      <main className="guide-article-main">
        <Link className="guide-back" to="/"><ArrowLeft size={15} /> Home</Link>
        <article className="guide-article">
          <header className="guide-article-head">
            <span className="guide-kicker"><BookOpenCheck size={14} /> CONTACT REWISELY</span>
            <h1>Questions or feedback?</h1>
            <p className="guide-dek">We’d like to hear what’s working, what’s confusing, and what would make your study routine easier.</p>
          </header>
          <div className="guide-body">
            <section><h2>Get in touch</h2><p>For a bug report, feature suggestion, or question about Rewisely, use the project’s public support page. Include what you were trying to do and what happened so it’s easier to understand the issue.</p></section>
          </div>
          <aside className="guide-callout"><BookOpenCheck size={20} /><div><b>Keep your account details private</b><p>Please don’t post passwords, sign-in codes, or private study information in a public report.</p><a href="https://github.com/DarshanPawar07/Rewisely/issues" target="_blank" rel="noreferrer">Open the support page <ArrowRight size={15} /></a></div></aside>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

export function GuideArticlePage() {
  const { slug = '' } = useParams();
  const guide = guides.find(item => item.slug === slug);
  if (!guide) return <GuideNotFound />;
  const Icon = guide.icon;
  const description = guide.description;
  const path = `/guides/${guide.slug}`;
  return (
    <div className="guides-page">
      <SeoMeta title={`${guide.title} | Rewisely Study Guides`} description={description} path={path} type="article" />
      <PublicHeader />
      <main className="guide-article-main">
        <Link className="guide-back" to="/guides"><ArrowLeft size={15} /> All study guides</Link>
        <article className="guide-article">
          <header className="guide-article-head"><div className="guide-article-icon"><Icon size={21} /></div><div className="guide-card-meta">{guide.category}<span>·</span><Clock3 size={13} />{guide.readTime}</div><h1>{guide.title}</h1><p className="guide-dek">{guide.description}</p></header>
          <nav className="guide-toc" aria-label="On this page"><b>In this guide</b>{guide.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.heading}</a>)}</nav>
          <div className="guide-body">{guide.sections.map(section => <section id={section.id} key={section.id}><h2>{section.heading}</h2>{section.content.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
          <aside className="guide-callout"><BookOpenCheck size={20} /><div><b>Make the next session easy to start</b><p>Choose one topic, decide what you will try to recall, and put the next review on your calendar.</p><Link to="/signup">Build your study plan <ArrowRight size={15} /></Link></div></aside>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

function GuideNotFound() {
  return <div className="guides-page"><SeoMeta title="Guide not found | Rewisely" description="This Rewisely study guide could not be found." path="/guides" indexable={false} /><PublicHeader /><main className="guide-not-found"><BookOpenCheck size={30} /><h1>We couldn’t find that guide.</h1><p>Browse the study library to find a topic that helps.</p><Link className="guide-link" to="/guides">Browse study guides <ArrowRight size={15} /></Link></main><PublicFooter /></div>;
}

function PublicHeader() {
  return <header className="guides-header"><Link className="landing-brand" to="/" aria-label="Rewisely home"><img src="/rewisely-icon.png" alt="" /><span>Rewi<span>sely</span></span></Link><nav aria-label="Public navigation"><Link to="/guides">Study guides</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/#features">Features</Link></nav><div><Link className="landing-login" to="/login">Log in</Link><Link className="landing-signup" to="/signup">Sign up <ArrowRight size={15} /></Link></div></header>;
}

function PublicFooter() {
  return <footer className="guides-footer"><Link className="landing-brand" to="/" aria-label="Rewisely home"><img src="/rewisely-icon.png" alt="" /><span>Rewi<span>sely</span></span></Link><small>Practical ideas for a more thoughtful study routine.</small><Link to="/guides">Study guides</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></footer>;
}
