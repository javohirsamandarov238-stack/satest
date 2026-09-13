import { useEffect, useMemo, useState } from 'react'
import { DIFFICULTIES, SECTIONS, SECTION_GROUPS, selectQuestions } from '../lib/bank'
import type { Filter, Order } from '../lib/bank'

interface Props {
  mode: 'practice' | 'test'
  initialTopics?: string[]
  onStart: (filter: Filter, length: number, minutes: number, order: Order) => void
}

const ORDERS: { key: Order; label: string }[] = [
  { key: 'mixed', label: 'Shuffled' },
  { key: 'easy-first', label: 'Easiest first' },
  { key: 'hard-first', label: 'Hardest first' },
]

export default function Setup({ mode, initialTopics = [], onStart }: Props) {
  const [topics, setTopics] = useState<string[]>(initialTopics)
  const [section, setSection] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [order, setOrder] = useState<Order>('mixed')
  const [minutes, setMinutes] = useState(32)

  /**
   * The count is held as the raw string the user is typing, so the field can
   * legitimately be empty or briefly hold an out-of-range value. It is only
   * normalised when editing ends — on blur, or when the session starts.
   */
  const [count, setCount] = useState(mode === 'test' ? '27' : '25')
  const [notice, setNotice] = useState<string | null>(null)

  const filter: Filter = { topics, section, difficulties, includeUnverified: true }
  const pool = useMemo(
    () => selectQuestions(filter).length,
    [topics, section, difficulties]
  )

  // If the pool shrinks below the chosen count, say so rather than silently editing.
  useEffect(() => {
    const n = Number(count)
    setNotice(pool > 0 && Number.isFinite(n) && n > pool ? `Only ${pool.toLocaleString()} questions are available.` : null)
  }, [pool, count])

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

  /** Clamp to 1..pool. Called on blur and on start, never while typing. */
  function normalise(): number {
    const n = Math.floor(Number(count))
    const safe = !Number.isFinite(n) || n < 1 ? 1 : Math.min(n, Math.max(1, pool))
    setCount(String(safe))
    setNotice(n > pool ? `Only ${pool.toLocaleString()} questions are available.` : null)
    return safe
  }

  return (
    <div className="wrap">
      <h1 className="d-lg">{mode === 'test' ? 'Set up a timed test' : 'Set up a practice run'}</h1>
      <p className="lede" style={{ marginTop: 12 }}>
        {mode === 'test'
          ? 'Answers stay hidden until you submit, exactly like the real module.'
          : 'One question at a time, with the answer and the reasoning the moment you check.'}
      </p>

      <hr className="rule" />

      <div className="field">
        <label>Section</label>
        <div className="chips">
          <button className="chip" aria-pressed={section === ''} onClick={() => setSection('')}>
            Both
          </button>
          {SECTIONS.map((sec) => (
            <button
              key={sec}
              className="chip"
              aria-pressed={section === sec}
              onClick={() => {
                setSection(sec)
                setTopics((cur) =>
                  cur.filter((t) =>
                    SECTION_GROUPS.find((g) => g.section === sec)?.domains.some((d) =>
                      d.topics.some((x) => x.topic === t)
                    )
                  )
                )
              }}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Difficulty</label>
        <div className="chips">
          <button
            className="chip"
            aria-pressed={difficulties.length === 0}
            onClick={() => setDifficulties([])}
          >
            Any
          </button>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className="chip"
              aria-pressed={difficulties.includes(d)}
              onClick={() => toggle(difficulties, setDifficulties, d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Order</label>
        <div className="chips">
          {ORDERS.map((o) => (
            <button
              key={o.key}
              className="chip"
              aria-pressed={order === o.key}
              onClick={() => setOrder(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Skills — pick any number, or leave them all off to draw from everything</label>
        {SECTION_GROUPS.filter((g) => !section || g.section === section).map((g) =>
          g.domains.map((d) => (
            <div key={d.domain} style={{ marginBottom: 20 }}>
              <div className="label" style={{ marginBottom: 10 }}>
                {d.domain}
              </div>
              <div className="chips">
                {d.topics.map((t) => (
                  <button
                    key={t.topic}
                    className="chip"
                    aria-pressed={topics.includes(t.topic)}
                    onClick={() => toggle(topics, setTopics, t.topic)}
                  >
                    {t.topic} <span className="tabular">({t.total})</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="field">
        <label htmlFor="count">How many questions</label>
        <div className="row">
          <input
            id="count"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, pool)}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            onBlur={normalise}
            style={{ width: 110 }}
          />
          <span className="meta tabular">{pool.toLocaleString()} available</span>
        </div>
        {notice && (
          <p className="meta" style={{ marginTop: 10, color: 'var(--gold)' }}>
            {notice}
          </p>
        )}
      </div>

      {mode === 'test' && (
        <div className="field">
          <label htmlFor="mins">Time limit, in minutes</label>
          <input
            id="mins"
            type="number"
            min={1}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 110 }}
          />
        </div>
      )}

      <button
        className="btn btn-primary"
        disabled={pool === 0}
        onClick={() => onStart(filter, normalise(), minutes, order)}
      >
        {mode === 'test' ? 'Start the test' : 'Start practicing'}
        <span className="arrow" aria-hidden="true">
          →
        </span>
      </button>
      {pool === 0 && (
        <p className="meta" style={{ marginTop: 12 }}>
          No questions match those filters. Try widening the difficulty or skill selection.
        </p>
      )}
    </div>
  )
}
