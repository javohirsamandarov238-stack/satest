import { useState } from 'react'
import type { Filter } from './lib/bank'
import { QUESTIONS, SECTION_GROUPS, TOTALS, selectQuestions, shuffle } from './lib/bank'
import { computeStats, pct, useProgress } from './lib/store'
import type { Letter, Question } from './lib/types'
import Setup from './components/Setup'
import Practice from './components/Practice'
import TestMode from './components/TestMode'
import Review from './components/Review'
import Dashboard from './components/Dashboard'
import {
  IconMoon,
  IconOverview,
  IconPractice,
  IconProgress,
  IconReview,
  IconSun,
  IconTest,
  Monogram,
} from './components/Icons'

type View = 'home' | 'practice' | 'test' | 'review' | 'progress'

const NAV: { key: View; label: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { key: 'home', label: 'Overview', Icon: IconOverview },
  { key: 'practice', label: 'Practice', Icon: IconPractice },
  { key: 'test', label: 'Test', Icon: IconTest },
  { key: 'review', label: 'Review', Icon: IconReview },
  { key: 'progress', label: 'Progress', Icon: IconProgress },
]

interface Session {
  questions: Question[]
  minutes: number
}

export default function App() {
  const { progress, record, toggleFlag, toggleTheme, reset } = useProgress()
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<Session | null>(null)
  const [presetTopics, setPresetTopics] = useState<string[]>([])

  const stats = computeStats(progress.attempts)

  function goto(v: View) {
    setSession(null)
    setPresetTopics([])
    setView(v)
  }

  function start(filter: Filter, length: number, minutes: number) {
    const pool = shuffle(selectQuestions(filter)).slice(0, length)
    setSession({ questions: pool, minutes })
  }

  function practiseTopic(topic: string) {
    setPresetTopics([topic])
    setSession(null)
    setView('practice')
  }

  return (
    <div className="shell">
      <nav className="rail">
        <div className="brand">
          <Monogram />
          <div className="brand-text">
            <div className="brand-name">SAT practice</div>
            <div className="brand-meta tabular">{TOTALS.all.toLocaleString()} questions</div>
          </div>
        </div>
        <div className="nav">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              className="nav-item"
              aria-current={view === key ? 'page' : undefined}
              onClick={() => goto(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        <div className="rail-foot">
          <button className="btn btn-sm btn-quiet" onClick={toggleTheme} style={{ width: '100%' }}>
            {progress.theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
            {progress.theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </nav>

      <main className="main">
        {view === 'home' && <Home stats={stats} onPractise={practiseTopic} onGoto={goto} />}

        {view === 'practice' &&
          (session ? (
            <Practice
              questions={session.questions}
              flagged={progress.flagged}
              onToggleFlag={toggleFlag}
              onRecord={(id, choice) => record(id, choice, 'practice')}
              onExit={() => goto('progress')}
            />
          ) : (
            <Setup mode="practice" initialTopics={presetTopics} onStart={start} />
          ))}

        {view === 'test' &&
          (session ? (
            <TestMode
              questions={session.questions}
              minutes={session.minutes}
              flagged={progress.flagged}
              onToggleFlag={toggleFlag}
              onRecord={(id, choice) => record(id, choice, 'test')}
              onExit={() => goto('progress')}
            />
          ) : (
            <Setup mode="test" onStart={start} />
          ))}

        {view === 'review' && (
          <Review attempts={progress.attempts} flagged={progress.flagged} onToggleFlag={toggleFlag} />
        )}

        {view === 'progress' && <Dashboard attempts={progress.attempts} onReset={reset} />}
      </main>

      <nav className="tabbar">
        {NAV.map(({ key, label, Icon }) => (
          <button key={key} aria-current={view === key ? 'page' : undefined} onClick={() => goto(key)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

/* ---------- overview ---------- */

function Home({
  stats,
  onPractise,
  onGoto,
}: {
  stats: ReturnType<typeof computeStats>
  onPractise: (topic: string) => void
  onGoto: (v: View) => void
}) {
  const seen = new Map(stats.byTopic.map((b) => [b.name, b]))

  return (
    <div className="wrap">
      <h1>{TOTALS.all.toLocaleString()} questions, drawn from your own files</h1>
      <p className="lede" style={{ marginTop: 14 }}>
        Every one of the {QUESTIONS.filter((q) => q.section === 'Reading and Writing').length.toLocaleString()}{' '}
        Reading and Writing questions is checked against the official key, {TOTALS.explained} of them with a
        written explanation. The {TOTALS.unverified} Math questions are there to practise but stay out of
        your accuracy until their answers are checked.
      </p>

      {stats.attempted > 0 && (
        <div className="stats" style={{ gap: 44 }}>
          <div>
            <div className="stat-value">{pct(stats.accuracy)}</div>
            <div className="stat-label">accuracy</div>
          </div>
          <div>
            <div className="stat-value tabular">{stats.distinctQuestions}</div>
            <div className="stat-label">questions seen</div>
          </div>
          <div>
            <div className="stat-value tabular">{stats.streak}</div>
            <div className="stat-label">correct in a row</div>
          </div>
        </div>
      )}

      <div className="row" style={{ marginTop: 26 }}>
        <button className="btn btn-primary" onClick={() => onGoto('practice')}>
          Start practising
        </button>
        <button className="btn" onClick={() => onGoto('test')}>
          Take a timed test
        </button>
      </div>

      <hr className="rule" />

      <div className="ledger">
        {SECTION_GROUPS.map((g) => (
          <section key={g.section}>
            <div className="section-head">
              <h2>{g.section}</h2>
              <span className="meta tabular">
                {g.verified === g.total ? 'all answers checked' : `${g.verified} of ${g.total} answered`}
              </span>
            </div>
            {g.domains.map((d) => (
          <div key={d.domain}>
            <div className="domain-head">{d.domain}</div>
            {d.topics.map((t) => {
              const b = seen.get(t.topic)
              return (
                <button className="ledger-row" key={t.topic} onClick={() => onPractise(t.topic)}>
                  <div>
                    <div className="ledger-name">{t.topic}</div>
                    <div className="ledger-sub tabular">
                      {t.verified === t.total
                        ? `every answer checked · ${t.explained} of ${t.total} explained`
                        : `${t.verified} of ${t.total} with a checked answer`}
                      {b ? ` · ${b.correct}/${b.attempted} correct so far` : ''}
                    </div>
                  </div>
                  <div className="bar-cell">
                    <div className={`bar ${b ? 'bar-done' : 'bar-idle'}`}>
                      <i style={{ width: `${(b ? (b.accuracy ?? 0) : t.verified / t.total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="ledger-num tabular">{b ? pct(b.accuracy) : `${t.total}`}</div>
                </button>
              )
            })}
          </div>
            ))}
          </section>
        ))}
      </div>

      <p className="meta" style={{ marginTop: 22, maxWidth: '58ch', lineHeight: 1.6 }}>
        Each bar shows your accuracy once you've answered questions in that skill. Before that, it shows
        how much of the skill has a verified answer. Select any skill to practise it on its own.
      </p>
    </div>
  )
}
