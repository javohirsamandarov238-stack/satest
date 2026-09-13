import type { Attempt } from '../lib/types'
import { QUESTIONS, TOTALS } from '../lib/bank'
import { computeStats, pct } from '../lib/store'

const SECTION_OF = new Map(QUESTIONS.map((q) => [q.id, q.section]))

export default function Dashboard({
  attempts,
  onReset,
}: {
  attempts: Attempt[]
  onReset: () => void
}) {
  const s = computeStats(attempts)

  if (s.attempted === 0) {
    return (
      <div className="wrap">
        <h1 className="d-lg">Progress</h1>
        <p className="lede" style={{ marginTop: 12, marginBottom: 28 }}>
          Nothing recorded yet.
        </p>
        <div className="empty">
          Answer a few questions and this page fills in: how accurate you are overall, which skills are
          carrying you, which ones need the work, and how the last few sessions went. Everything is kept
          in this browser, so a refresh won't lose it.
        </div>
      </div>
    )
  }

  const bySection = ['Reading and Writing', 'Math'].map((name) => {
    const rows = attempts.filter((a) => SECTION_OF.get(a.id) === name && a.correct !== null)
    const correct = rows.filter((a) => a.correct).length
    return { name, attempted: rows.length, correct, accuracy: rows.length ? correct / rows.length : null }
  })

  const ranked = s.byTopic.filter((t) => t.attempted >= 3)
  const weakest = ranked.slice(-3).reverse()
  const strongest = ranked.slice(0, 3)
  const graded = s.recent.filter((a) => a.correct !== null)

  return (
    <div className="wrap">
      <h1 className="d-lg">Progress</h1>

      <div className="stat-line">
        <div>
          <div className="figure-num">{pct(s.accuracy)}</div>
          <div className="label">accuracy</div>
        </div>
        <div>
          <div className="figure-num tabular">
            {s.correct}
            <small>/{s.correct + s.incorrect}</small>
          </div>
          <div className="label">correct answers</div>
        </div>
        <div>
          <div className="figure-num tabular">{s.streak}</div>
          <div className="label">in a row now · best {s.bestStreak}</div>
        </div>
        <div>
          <div className="figure-num tabular">
            {s.distinctQuestions}
            <small>/{TOTALS.all}</small>
          </div>
          <div className="label">questions seen</div>
        </div>
      </div>

      {graded.length > 0 && (
        <>
          <hr className="rule" />
          <h2 className="d-md">Recent form</h2>
          <p className="meta" style={{ marginTop: 6, marginBottom: 14 }}>
            Your last {graded.length} graded answers, oldest first
          </p>
          <div className="sparks">
            {graded.map((a, i) => (
              <i key={i} className={a.correct ? 'hit' : 'miss'} />
            ))}
          </div>
        </>
      )}

      {bySection.some((b) => b.attempted > 0) && (
        <>
          <hr className="rule" />
          <h2 className="d-md">By section</h2>
          <div style={{ marginTop: 10 }}>
            {bySection
              .filter((b) => b.attempted > 0)
              .map((b) => (
                <div className="ledger-row" key={b.name}>
                  <div>
                    <div className="ledger-name">{b.name}</div>
                    <div className="ledger-sub tabular">
                      {b.correct} of {b.attempted} correct
                    </div>
                  </div>
                  <div className="bar-cell">
                    <div className="bar bar-done">
                      <i style={{ width: `${(b.accuracy ?? 0) * 100}%` }} />
                    </div>
                  </div>
                  <div className="ledger-num tabular">{pct(b.accuracy)}</div>
                </div>
              ))}
          </div>
        </>
      )}

      <hr className="rule" />
      <h2 className="d-md">By skill</h2>
      <div style={{ marginTop: 10 }}>
        {s.byTopic.map((b) => (
          <div className="ledger-row" key={b.name}>
            <div>
              <div className="ledger-name">{b.name}</div>
              <div className="ledger-sub tabular">
                {b.correct} of {b.attempted} correct
              </div>
            </div>
            <div className="bar-cell">
              <div className="bar bar-done">
                <i style={{ width: `${(b.accuracy ?? 0) * 100}%` }} />
              </div>
            </div>
            <div className="ledger-num tabular">{pct(b.accuracy)}</div>
          </div>
        ))}
      </div>

      {ranked.length > 0 && (
        <>
          <hr className="rule" />
          <h2 className="d-md">Where to spend your time</h2>
          <div className="row" style={{ alignItems: 'flex-start', gap: 56, marginTop: 16 }}>
            {weakest.length > 0 && (
              <div>
                <h3 className="d-sm" style={{ marginBottom: 8 }}>Weakest</h3>
                {weakest.map((t) => (
                  <p key={t.name} style={{ margin: '0 0 5px', fontSize: '0.875rem' }}>
                    {t.name} <span className="meta tabular">{pct(t.accuracy)}</span>
                  </p>
                ))}
              </div>
            )}
            {strongest.length > 0 && (
              <div>
                <h3 className="d-sm" style={{ marginBottom: 8 }}>Strongest</h3>
                {strongest.map((t) => (
                  <p key={t.name} style={{ margin: '0 0 5px', fontSize: '0.875rem' }}>
                    {t.name} <span className="meta tabular">{pct(t.accuracy)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          <p className="meta" style={{ marginTop: 14 }}>
            Skills with at least three graded answers
          </p>
        </>
      )}

      <hr className="rule" />
      <button
        className="btn"
        onClick={() => {
          if (confirm('Erase every recorded answer and flag? This cannot be undone.')) onReset()
        }}
      >
        Erase all progress
      </button>
    </div>
  )
}
