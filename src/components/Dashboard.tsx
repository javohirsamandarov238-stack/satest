import type { Attempt } from '../lib/types'
import { TOTALS } from '../lib/bank'
import { computeStats, pct } from '../lib/store'

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
        <h1>Progress</h1>
        <p className="lede" style={{ marginTop: 8, marginBottom: 22 }}>
          Nothing recorded yet.
        </p>
        <div className="empty">
          Your accuracy, your strongest and weakest skills, and your recent form all appear here once
          you've answered a few questions. Progress is stored in this browser, so it survives a refresh.
        </div>
      </div>
    )
  }

  const weakest = s.byTopic.filter((t) => t.attempted >= 3).slice(-3).reverse()
  const strongest = s.byTopic.filter((t) => t.attempted >= 3).slice(0, 3)
  const graded = s.recent.filter((a) => a.correct !== null)

  return (
    <div className="wrap">
      <h1>Progress</h1>

      <div className="stat-strip" style={{ marginTop: 20 }}>
        <div>
          <div className="stat-value">{pct(s.accuracy)}</div>
          <div className="stat-label">overall accuracy</div>
        </div>
        <div>
          <div className="stat-value tabular">{s.correct}</div>
          <div className="stat-label">correct</div>
        </div>
        <div>
          <div className="stat-value tabular">{s.incorrect}</div>
          <div className="stat-label">incorrect</div>
        </div>
        <div>
          <div className="stat-value tabular">{s.unanswered}</div>
          <div className="stat-label">left blank</div>
        </div>
        <div>
          <div className="stat-value tabular">{s.streak}</div>
          <div className="stat-label">correct in a row now, best {s.bestStreak}</div>
        </div>
        <div>
          <div className="stat-value tabular">
            {s.distinctQuestions}
            <span style={{ color: 'var(--muted)', fontSize: '1rem' }}>/{TOTALS.all}</span>
          </div>
          <div className="stat-label">questions seen</div>
        </div>
      </div>

      {graded.length > 0 && (
        <>
          <hr className="divider" />
          <h2>Recent form</h2>
          <p className="eyebrow" style={{ marginTop: 6, marginBottom: 10 }}>
            Your last {graded.length} graded answers, oldest on the left.
          </p>
          <div className="sparks">
            {graded.map((a, i) => (
              <i key={i} className={a.correct ? 'hit' : 'miss'} style={{ height: a.correct ? 26 : 13 }} />
            ))}
          </div>
        </>
      )}

      <hr className="divider" />
      <h2>By domain</h2>
      <div className="ledger" style={{ marginTop: 10 }}>
        {s.byDomain.map((b) => (
          <div className="ledger-row" key={b.name} style={{ cursor: 'default' }}>
            <div>
              <div className="ledger-name">{b.name}</div>
              <div className="ledger-sub tabular">
                {b.correct} of {b.attempted} correct
              </div>
            </div>
            <div className="bar-cell">
              <div className="bar bar-correct">
                <i style={{ width: `${(b.accuracy ?? 0) * 100}%` }} />
              </div>
            </div>
            <div className="ledger-num tabular">{pct(b.accuracy)}</div>
          </div>
        ))}
      </div>

      <hr className="divider" />
      <h2>By skill</h2>
      <div className="ledger" style={{ marginTop: 10 }}>
        {s.byTopic.map((b) => (
          <div className="ledger-row" key={b.name} style={{ cursor: 'default' }}>
            <div>
              <div className="ledger-name">{b.name}</div>
              <div className="ledger-sub tabular">
                {b.correct} of {b.attempted} correct
              </div>
            </div>
            <div className="bar-cell">
              <div className="bar bar-correct">
                <i style={{ width: `${(b.accuracy ?? 0) * 100}%` }} />
              </div>
            </div>
            <div className="ledger-num tabular">{pct(b.accuracy)}</div>
          </div>
        ))}
      </div>

      {(weakest.length > 0 || strongest.length > 0) && (
        <>
          <hr className="divider" />
          <h2>Where to spend your time</h2>
          <div className="row" style={{ alignItems: 'flex-start', gap: 44, marginTop: 12 }}>
            {weakest.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 6 }}>Weakest</h3>
                {weakest.map((t) => (
                  <p key={t.name} style={{ margin: '0 0 4px', fontSize: '0.9375rem' }}>
                    {t.name} <span className="eyebrow tabular">{pct(t.accuracy)}</span>
                  </p>
                ))}
              </div>
            )}
            {strongest.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 6 }}>Strongest</h3>
                {strongest.map((t) => (
                  <p key={t.name} style={{ margin: '0 0 4px', fontSize: '0.9375rem' }}>
                    {t.name} <span className="eyebrow tabular">{pct(t.accuracy)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          <p className="eyebrow" style={{ marginTop: 10 }}>
            Skills with at least three graded answers.
          </p>
        </>
      )}

      <hr className="divider" />
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
