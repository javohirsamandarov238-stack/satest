import { useMemo, useState } from 'react'
import { SECTIONS, SECTION_GROUPS, selectQuestions } from '../lib/bank'
import type { Filter } from '../lib/bank'

interface Props {
  mode: 'practice' | 'test'
  initialTopics?: string[]
  onStart: (filter: Filter, length: number, minutes: number) => void
}

export default function Setup({ mode, initialTopics = [], onStart }: Props) {
  const [topics, setTopics] = useState<string[]>(initialTopics)
  const [section, setSection] = useState<string>('')
  const includeUnverified = true // every question in the bank now has a checked answer
  const [length, setLength] = useState(mode === 'test' ? 27 : 25)
  const [minutes, setMinutes] = useState(32)

  const filter: Filter = { topics, section, includeUnverified }
  const pool = useMemo(() => selectQuestions(filter).length, [topics, section])

  const toggle = (t: string) =>
    setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  return (
    <div className="wrap">
      <h1 className="h-page">{mode === 'test' ? 'Set up a timed test' : 'Set up a practice run'}</h1>
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
                    SECTION_GROUPS.find((g) => g.section === sec)
                      ?.domains.some((d) => d.topics.some((x) => x.topic === t))
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
        <label>Skills — pick any number, or leave them all off to draw from everything</label>
        {SECTION_GROUPS.filter((g) => !section || g.section === section).map((g) =>
          g.domains.map((d) => (
            <div key={d.domain} style={{ marginBottom: 14 }}>
              <div className="domain-head">{d.domain}</div>
              <div className="chips">
                {d.topics.map((t) => (
                  <button
                    key={t.topic}
                    type="button"
                    className="chip"
                    aria-pressed={topics.includes(t.topic)}
                    onClick={() => toggle(t.topic)}
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
        <label htmlFor="len">How many questions</label>
        <div className="row">
          <input
            id="len"
            type="number"
            min={1}
            max={Math.max(1, pool)}
            value={length}
            onChange={(e) => setLength(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 90 }}
          />
          <span className="meta tabular">{pool} available</span>
        </div>
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
            style={{ width: 90 }}
          />
        </div>
      )}

      <button
        className="btn btn-primary"
        disabled={pool === 0}
        onClick={() => onStart(filter, Math.min(length, pool), minutes)}
      >
        {mode === 'test' ? 'Start the test' : 'Start practising'}
      </button>
      {pool === 0 && (
        <p className="meta" style={{ marginTop: 12 }}>
          No questions match. Pick another skill.
        </p>
      )}
    </div>
  )
}
