import { useState } from 'react'
import type { Filter } from './lib/bank'
import { SECTION_GROUPS, TOTALS, selectQuestions, shuffle } from './lib/bank'
import { computeStats, pct, useProgress } from './lib/store'
import type { Letter, Question } from './lib/types'
import Setup from './components/Setup'
import Practice from './components/Practice'
import TestMode from './components/TestMode'
import Review from './components/Review'
import Dashboard from './components/Dashboard'

type View = 'home' | 'practice' | 'test' | 'review' | 'progress'

const NAV: { key: View; label: string }[] = [
  { key: 'home', label: 'Overview' },
  { key: 'practice', label: 'Practice' },
  { key: 'test', label: 'Test' },
  { key: 'review', label: 'Review' },
  { key: 'progress', label: 'Progress' },
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
        <div className="rail-mark">
          Reading and Writing
          <span>{TOTALS.all} questions from your files</span>
        </div>
        {NAV.map((n) => (
          <button key={n.key} aria-current={view === n.key ? 'page' : undefined} onClick={() => goto(n.key)}>
            {n.label}
          </button>
        ))}
        <div className="rail-foot">
          <button className="btn btn-sm btn-quiet" onClick={toggleTheme}>
            {progress.theme === 'dark' ? 'Light theme' : 'Dark theme'}
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
        {NAV.map((n) => (
          <button key={n.key} aria-current={view === n.key ? 'page' : undefined} onClick={() => goto(n.key)}>
            {n.label}
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
      <h1>{TOTALS.all} questions from your files</h1>
      <p className="lede" style={{ marginTop: 8 }}>
        Reading and Writing plus Math, pulled from the PDFs you uploaded. {TOTALS.verified} questions have
        a checked answer and a written explanation; the remaining {TOTALS.unverified} are available to
        practise but are marked on screen and never counted in your accuracy.
      </p>

      <div className="row" style={{ marginTop: 22 }}>
        <button className="btn btn-primary" onClick={() => onGoto('practice')}>
          Practise
        </button>
        <button className="btn" onClick={() => onGoto('test')}>
          Take a timed test
        </button>
        {stats.attempted > 0 && (
          <span className="eyebrow tabular">
            {pct(stats.accuracy)} across {stats.correct + stats.incorrect} graded answers so far
          </span>
        )}
      </div>

      <hr className="divider" />

      <div className="ledger">
        {SECTION_GROUPS.map((g) => (
          <section key={g.section}>
            <h2 style={{ marginTop: 26 }}>{g.section}</h2>
            <p className="eyebrow tabular" style={{ marginTop: 4 }}>
              {g.total} questions · {g.verified} with a checked answer
            </p>
            {g.domains.map((d) => (
          <div className="ledger-group" key={d.domain}>
            <h3>{d.domain}</h3>
            {d.topics.map((t) => {
              const b = seen.get(t.topic)
              return (
                <button className="ledger-row" key={t.topic} onClick={() => onPractise(t.topic)}>
                  <div>
                    <div className="ledger-name">{t.topic}</div>
                    <div className="ledger-sub tabular">
                      {t.verified} of {t.total} with a checked answer
                      {b ? ` · ${b.correct}/${b.attempted} correct so far` : ''}
                    </div>
                  </div>
                  <div className="bar-cell">
                    <div className={`bar ${b ? 'bar-correct' : ''}`}>
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

      <p className="eyebrow" style={{ marginTop: 18 }}>
        The bar shows your accuracy once you've answered questions in a skill; before that it shows how
        much of the skill has a checked answer. Choose any skill to practise it on its own.
      </p>
    </div>
  )
}
