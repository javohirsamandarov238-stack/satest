import { QUESTIONS, TOTALS } from '../lib/bank'
import {
  computeStats,
  latestByQuestion,
  outstandingMistakes,
  pct,
  recentSessions,
  relativeDay,
} from '../lib/store'
import type { Attempt, OpenSession } from '../lib/types'
import { useCountUp } from '../lib/motion'

type View = 'home' | 'practice' | 'test' | 'review' | 'progress'

interface Props {
  attempts: Attempt[]
  flagged: string[]
  open: OpenSession | null
  onGoto: (v: View) => void
  onPractise: (topic: string) => void
  onResume: () => void
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({
  attempts,
  flagged,
  open,
  onGoto,
  onPractise,
  onResume,
}: Props) {
  const stats = computeStats(attempts)
  const seen = latestByQuestion(attempts)
  const mistakes = outstandingMistakes(attempts)
  const sessions = recentSessions(attempts)
  const unseen = TOTALS.all - stats.distinctQuestions
  const solved = useCountUp(stats.correct + stats.incorrect)

  // Weak areas: skills with enough attempts to mean something, worst first.
  const weak = stats.byTopic
    .filter((t) => t.attempted >= 4)
    .slice(-4)
    .reverse()

  const weakest = weak[0]?.name

  return (
    <div className="wrap dash">
      {/* ── welcome: compact, two actions, nothing else ── */}
      <section className="dash-welcome">
        <div>
          <span className="label">{greeting()}</span>
          <h1 className="d-md" style={{ marginTop: 10 }}>
            Your SAT practice is ready.
          </h1>
          <p className="support" style={{ marginTop: 10 }}>
            {TOTALS.all.toLocaleString()} questions · {TOTALS.explained.toLocaleString()} with
            written explanations
          </p>
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={open ? onResume : () => onGoto('practice')}>
            {open ? 'Continue practice' : 'Start practice'}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
          <button className="btn" onClick={() => onGoto('test')}>
            Start timed test
          </button>
        </div>
      </section>

      {/* ── today ── */}
      <section className="dash-block">
        <span className="label">Today</span>
        <div className="today">
          <button className="today-item" onClick={() => onGoto('practice')}>
            <span className="label">Practice</span>
            <span className="today-figure figure-num">{unseen.toLocaleString()}</span>
            <span className="today-note">questions you haven't seen</span>
            <span className="today-go">Start →</span>
          </button>

          <button
            className="today-item"
            onClick={() => onGoto('review')}
            disabled={mistakes.length === 0}
          >
            <span className="label">Review</span>
            <span className="today-figure figure-num">{mistakes.length}</span>
            <span className="today-note">
              {mistakes.length === 1 ? 'mistake to revisit' : 'mistakes to revisit'}
            </span>
            <span className="today-go">{mistakes.length ? 'Revisit →' : 'Nothing yet'}</span>
          </button>

          <button
            className="today-item"
            onClick={() => onGoto('review')}
            disabled={flagged.length === 0}
          >
            <span className="label">Flagged</span>
            <span className="today-figure figure-num">{flagged.length}</span>
            <span className="today-note">
              {flagged.length === 1 ? 'question set aside' : 'questions set aside'}
            </span>
            <span className="today-go">{flagged.length ? 'Open →' : 'Nothing yet'}</span>
          </button>
        </div>
      </section>

      {/* ── continue, or a recommendation ── */}
      <section className="dash-block">
        {open ? (
          <>
            <span className="label">Continue</span>
            <div className="continue">
              <div>
                <div className="d-sm">{open.label}</div>
                <p className="meta" style={{ marginTop: 6 }}>
                  Question {Math.min(open.index + 1, open.ids.length)} of {open.ids.length} ·{' '}
                  {Math.round(((open.index + 1) / open.ids.length) * 100)}% through
                </p>
                <div className="bar" style={{ marginTop: 14, maxWidth: 420 }}>
                  <i style={{ width: `${((open.index + 1) / open.ids.length) * 100}%` }} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={onResume}>
                Continue
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="label">Ready to practice?</span>
            <div className="continue">
              <p className="support" style={{ maxWidth: '52ch', margin: 0 }}>
                {weakest
                  ? `You've been least accurate on ${weakest} lately. A focused run there would be the most useful next step.`
                  : 'Nothing in progress. Pick a skill, a difficulty and a length, and the session is built for you.'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => (weakest ? onPractise(weakest) : onGoto('practice'))}
              >
                {weakest ? `Practice ${weakest}` : 'Start practice'}
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </>
        )}
      </section>

      <hr className="rule" />

      {/* ── progress + weak areas, side by side ── */}
      <section className="dash-split">
        <div>
          <span className="label">Your progress</span>
          {stats.attempted === 0 ? (
            <p className="support" style={{ marginTop: 16, maxWidth: '46ch' }}>
              Nothing recorded yet. Answer a few questions and your accuracy, streak and weakest
              skills appear here — stored in this browser, so a refresh won't lose them.
            </p>
          ) : (
            <div className="figures">
              <div>
                <span className="figure-num lead">{pct(stats.accuracy)}</span>
                <span className="label">overall accuracy</span>
              </div>
              <div>
                <span className="figure-num lead tabular">{solved.toLocaleString()}</span>
                <span className="label">questions solved</span>
              </div>
              <div>
                <span className="figure-num tabular">{stats.distinctQuestions.toLocaleString()}</span>
                <span className="label">of {TOTALS.all.toLocaleString()} seen</span>
              </div>
              <div>
                <span className="figure-num tabular">{stats.streak}</span>
                <span className="label">in a row · best {stats.bestStreak}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="label">Weak areas</span>
          {weak.length === 0 ? (
            <p className="support" style={{ marginTop: 16, maxWidth: '40ch' }}>
              Once you've answered four or more questions in a skill, the ones needing work show
              up here.
            </p>
          ) : (
            <>
              <div style={{ marginTop: 16 }}>
                {weak.map((t) => (
                  <button key={t.name} className="weak-row" onClick={() => onPractise(t.name)}>
                    <span className="weak-name">{t.name}</span>
                    <span className="weak-num tabular">{pct(t.accuracy)}</span>
                    <span className="bar weak-bar">
                      <i style={{ width: `${(t.accuracy ?? 0) * 100}%` }} />
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="btn btn-sm"
                style={{ marginTop: 20 }}
                onClick={() => onPractise(weak[0].name)}
              >
                Practice weak areas
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </>
          )}
        </div>
      </section>

      <hr className="rule" />

      {/* ── recent activity ── */}
      <section className="dash-block">
        <span className="label">Recent activity</span>
        {sessions.length === 0 ? (
          <p className="support" style={{ marginTop: 16, maxWidth: '46ch' }}>
            No sessions yet. Each practice run and test you finish is listed here with its score.
          </p>
        ) : (
          <div style={{ marginTop: 16 }}>
            {sessions.slice(0, 6).map((s) => (
              <button key={s.at} className="activity" onClick={() => onGoto('review')}>
                <span className="activity-name">
                  {s.mode === 'test' ? 'Timed test' : 'Practice'} ·{' '}
                  <span className="activity-topics">
                    {s.topics.slice(0, 2).join(', ')}
                    {s.topics.length > 2 ? ` +${s.topics.length - 2}` : ''}
                  </span>
                </span>
                <span className="activity-score tabular">
                  {s.graded > 0 ? `${s.correct} / ${s.graded} · ${pct(s.correct / s.graded)}` : `${s.total} questions`}
                </span>
                <span className="activity-when">{relativeDay(s.at)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <hr className="rule" />

      {/* ── the bank itself, demoted to the bottom ── */}
      <section className="dash-block">
        <div className="ledger-head">
          <span className="label">Your question bank</span>
          <span className="meta tabular">
            {QUESTIONS.filter((q) => q.section === 'Reading and Writing').length.toLocaleString()}{' '}
            Reading &amp; Writing ·{' '}
            {QUESTIONS.filter((q) => q.section === 'Math').length.toLocaleString()} Math
          </span>
        </div>
        <p className="support" style={{ maxWidth: '52ch' }}>
          Drawn from your own files. Every answer is checked against the official key.
        </p>
        <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={() => onGoto('progress')}>
          See the full breakdown
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
      </section>
    </div>
  )
}
