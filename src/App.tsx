import { useState } from 'react'
import type { Filter } from './lib/bank'
import { QUESTIONS, SECTION_GROUPS, TOTALS, selectQuestions, shuffle } from './lib/bank'
import { computeStats, pct, useProgress } from './lib/store'
import { stagger, useCountUp } from './lib/motion'
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
      <header className="topbar">
        <span className="wordmark">
          SATest<i />
        </span>
        <nav className="nav">
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              className="nav-item"
              aria-current={view === key ? 'page' : undefined}
              onClick={() => goto(key)}
            >
              {label}
            </button>
          ))}
          <button className="themer" onClick={toggleTheme} aria-label="Toggle theme">
            {progress.theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        </nav>
      </header>

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
  const seenCount = useCountUp(stats.distinctQuestions)
  const seenShare = stats.distinctQuestions / TOTALS.all

  return (
    <div className="wrap">
      <div className="hero">
        <div>
          <h1 className="hero-line rise">
            Your SAT practice.
            <em>Getting sharper.</em>
          </h1>
          <p className="hero-meta rise" style={{ animationDelay: '80ms' }}>
            <b>{TOTALS.all.toLocaleString()} questions</b> · Reading &amp; Writing + Math ·{' '}
            <b>{TOTALS.explained.toLocaleString()}</b> with a written explanation. Drawn from your
            own files.
          </p>
          <div className="row rise" style={{ marginTop: 40, animationDelay: '160ms' }}>
            <button className="btn btn-primary" onClick={() => onGoto('practice')}>
              {stats.attempted > 0 ? 'Continue practicing' : 'Start practicing'}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button className="btn btn-ghost" onClick={() => onGoto('test')}>
              Take a timed test
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>

        <div className="ring rise" style={{ animationDelay: '240ms' }}>
          <svg viewBox="0 0 268 268" aria-hidden="true">
            <circle className="ring-track" cx="134" cy="134" r="128" />
            <circle
              className="ring-fill"
              cx="134"
              cy="134"
              r="128"
              strokeDasharray={2 * Math.PI * 128}
              strokeDashoffset={2 * Math.PI * 128 * (1 - seenShare)}
            />
          </svg>
          <div>
            <div className="ring-figure">
              {seenCount.toLocaleString()}
              <span>/{TOTALS.all.toLocaleString()}</span>
            </div>
            <div className="ring-label">
              questions
              <br />
              practiced so far
            </div>
          </div>
        </div>
      </div>

      <hr className="rule" />

      {stats.attempted > 0 && (
        <>
          <span className="h-sub">Your progress</span>
          <div className="stats" style={{ marginTop: 28 }}>
            <div>
              <div className="stat-figure">{pct(stats.accuracy)}</div>
              <div className="stat-label">overall accuracy</div>
            </div>
            <div>
              <div className="stat-figure tabular">{stats.correct.toLocaleString()}</div>
              <div className="stat-label">correct answers</div>
            </div>
            <div>
              <div className="stat-figure tabular">{stats.streak}</div>
              <div className="stat-label">current streak</div>
            </div>
          </div>
          <hr className="rule" />
        </>
      )}

      <div className="ledger">
        {SECTION_GROUPS.map((g) => (
          <section className="ledger-section" key={g.section}>
            <div className="ledger-head">
              <h2 className="h-sec">{g.section}</h2>
              <span className="meta tabular">
                {g.verified === g.total ? 'all answers checked' : `${g.verified} of ${g.total} answered`}
              </span>
            </div>
            {g.domains.map((d) => (
          <div className="ledger-group" key={d.domain}>
            <span className="h-sub">{d.domain}</span>
            {d.topics.map((t) => {
              const b = seen.get(t.topic)
              return (
                <button className="ledger-row" key={t.topic} onClick={() => onPractise(t.topic)}>
                  <div className="ledger-top">
                    <span className="ledger-name">{t.topic}</span>
                    <span className="ledger-num">
                      {b ? pct(b.accuracy) : `${Math.round((t.explained / t.total) * 100)}%`}
                    </span>
                  </div>
                  <div className={`bar ${b ? 'bar-good' : ''}`}>
                    <i
                      style={{
                        width: `${(b ? (b.accuracy ?? 0) : t.explained / t.total) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="ledger-sub tabular">
                    {t.total} questions
                    {b ? ` · ${b.correct}/${b.attempted} correct` : ` · ${t.explained} explained`}
                  </div>
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
