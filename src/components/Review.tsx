import { useMemo, useState } from 'react'
import type { Attempt, Question } from '../lib/types'
import { BY_ID, TOPICS } from '../lib/bank'
import { latestByQuestion } from '../lib/store'
import { AnswerInput, QuestionBody, QuestionHeader, Verdict } from './Question'

type Outcome = 'incorrect' | 'correct' | 'unanswered' | 'flagged' | 'unverified' | 'all'

const OUTCOMES: { key: Outcome; label: string }[] = [
  { key: 'incorrect', label: 'Got wrong' },
  { key: 'correct', label: 'Got right' },
  { key: 'unanswered', label: 'Left blank' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'unverified', label: 'Unverified' },
  { key: 'all', label: 'Everything seen' },
]

interface Props {
  attempts: Attempt[]
  flagged: string[]
  onToggleFlag: (id: string) => void
}

export default function Review({ attempts, flagged, onToggleFlag }: Props) {
  const [outcome, setOutcome] = useState<Outcome>('incorrect')
  const [topic, setTopic] = useState<string>('')
  const [open, setOpen] = useState<number | null>(null)

  const latest = useMemo(() => latestByQuestion(attempts), [attempts])

  const rows = useMemo(() => {
    const ids =
      outcome === 'flagged' ? flagged : [...latest.keys()]
    const out: { q: Question; attempt: Attempt | undefined }[] = []
    for (const id of ids) {
      const q = BY_ID.get(id)
      if (!q) continue
      const a = latest.get(id)
      if (topic && q.topic !== topic) continue
      const keep =
        outcome === 'all' ||
        outcome === 'flagged' ||
        (outcome === 'incorrect' && a?.correct === false) ||
        (outcome === 'correct' && a?.correct === true) ||
        (outcome === 'unanswered' && a?.choice === null) ||
        (outcome === 'unverified' && a?.correct === null)
      if (keep) out.push({ q, attempt: a })
    }
    return out.sort((x, y) => (y.attempt?.ts ?? 0) - (x.attempt?.ts ?? 0))
  }, [outcome, topic, latest, flagged])

  if (open !== null && rows[open]) {
    const { q, attempt } = rows[open]
    return (
      <div className="wrap">
        <QuestionHeader
          q={q}
          index={open}
          total={rows.length}
          flagged={flagged.includes(q.id)}
          onToggleFlag={() => onToggleFlag(q.id)}
        />
        <QuestionBody q={q} />
        <AnswerInput q={q} selected={attempt?.choice ?? null} onSelect={() => {}} revealed disabled />
        <Verdict q={q} selected={attempt?.choice ?? null} />
        <div className="actions">
          <button className="btn" disabled={open === 0} onClick={() => setOpen(open - 1)}>
            Previous
          </button>
          <button className="btn" disabled={open === rows.length - 1} onClick={() => setOpen(open + 1)}>
            Next
          </button>
          <button className="btn btn-quiet" onClick={() => setOpen(null)}>
            Back to the list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap">
      <h1>Review</h1>
      <p className="lede" style={{ marginTop: 8 }}>
        Everything you've answered, sorted with the most recent first.
      </p>

      <hr className="divider" />

      <div className="field">
        <label>Show</label>
        <div className="chips">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              className="chip"
              aria-pressed={outcome === o.key}
              onClick={() => {
                setOutcome(o.key)
                setOpen(null)
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="topicsel">Skill</label>
        <select id="topicsel" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Every skill</option>
          {TOPICS.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          Nothing here yet. Answer some questions in practice or take a test, and they'll show up in this
          list.
        </div>
      ) : (
        <>
          <p className="eyebrow tabular">{rows.length} questions</p>
          <div>
            {rows.map(({ q, attempt }, i) => (
              <div className="reviewitem" key={q.id}>
                <div className="reviewitem-meta">
                  <span>{q.topic}</span>
                  {attempt?.correct === true && <span className="mark-correct">correct ({attempt.choice})</span>}
                  {attempt?.correct === false && (
                    <span className="mark-wrong">
                      chose {attempt.choice ?? '—'}, answer is {q.correctAnswer}
                    </span>
                  )}
                  {attempt?.correct === null && <span>answer not verified</span>}
                  {!attempt && <span>not attempted</span>}
                  {flagged.includes(q.id) && <span style={{ color: 'var(--flag)' }}>flagged</span>}
                </div>
                <div className="reviewitem-q">{q.stem || `${q.topic} — see question image`}</div>
                <button className="btn btn-sm" onClick={() => setOpen(i)}>
                  Open question
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
