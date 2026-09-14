import { useMemo, useState } from 'react'
import {
  MASTERY,
  WORDS,
  buildPrompt,
  buildRecords,
  dueWords,
  masteryOf,
  searchWords,
} from '../lib/vocab'
import type { Mastery, Word, WordAttempt } from '../lib/vocab'

interface Props {
  attempts: WordAttempt[]
  onRecord: (id: string, correct: boolean) => void
}

type Tab = 'review' | 'browse'

export default function Vocabulary({ attempts, onRecord }: Props) {
  const records = useMemo(() => buildRecords(attempts), [attempts])
  const due = useMemo(() => dueWords(records), [records])

  const [tab, setTab] = useState<Tab>('review')
  const [queue, setQueue] = useState<Word[] | null>(null)
  const [at, setAt] = useState(0)

  const counts = useMemo(() => {
    const c: Record<Mastery, number> = { New: 0, Learning: 0, Familiar: 0, Strong: 0, Mastered: 0 }
    for (const w of WORDS) c[masteryOf(records, w.id)] += 1
    return c
  }, [records])

  if (queue) {
    return (
      <VocabSession
        queue={queue}
        records={records}
        onRecord={onRecord}
        onDone={() => {
          setQueue(null)
          setAt(0)
        }}
      />
    )
  }

  /* ── the hub ── */

  return (
    <div className="wrap">
      <h1 className="d-lg">Vocabulary</h1>
      <p className="lede" style={{ marginTop: 12 }}>
        {WORDS.length.toLocaleString()} words from Vocabook. Words you miss come back quickly; words
        you know fade into the background.
      </p>

      <div className="row" style={{ marginTop: 28 }}>
        <button
          className="btn btn-primary"
          disabled={due.length === 0}
          onClick={() => {
            setQueue(due.slice(0, 20))
            setAt(0)
          }}
        >
          Review {Math.min(20, due.length)} due words
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
        <button className="btn" onClick={() => setTab(tab === 'browse' ? 'review' : 'browse')}>
          {tab === 'browse' ? 'Hide the list' : 'Browse all words'}
        </button>
      </div>

      <hr className="rule" />

      <span className="label">Mastery</span>
      <div className="figures" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
        {MASTERY.map((m) => (
          <div key={m}>
            <span className="figure-num tabular">{counts[m].toLocaleString()}</span>
            <span className="label">{m}</span>
          </div>
        ))}
      </div>

      {tab === 'browse' && <WordList records={records} />}
    </div>
  )
}

/* ── searchable list ── */

function WordList({ records }: { records: ReturnType<typeof buildRecords> }) {
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<Mastery | ''>('')

  const list = useMemo(() => {
    const base = q.trim() ? searchWords(q, 200) : WORDS
    const filtered = level ? base.filter((w) => masteryOf(records, w.id) === level) : base
    return filtered.slice(0, 120)
  }, [q, level, records])

  return (
    <>
      <hr className="rule" />
      <div className="field">
        <label htmlFor="wsearch">Search</label>
        <input
          id="wsearch"
          type="search"
          placeholder="a word, a meaning, a synonym…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="vsearch"
        />
      </div>

      <div className="chips" style={{ marginBottom: 24 }}>
        <button className="chip" aria-pressed={level === ''} onClick={() => setLevel('')}>
          All
        </button>
        {MASTERY.map((m) => (
          <button
            key={m}
            className="chip"
            aria-pressed={level === m}
            onClick={() => setLevel(level === m ? '' : m)}
          >
            {m}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="support">No words match that.</p>
      ) : (
        <div>
          {list.map((w) => (
            <div className="wordrow" key={w.id}>
              <div>
                <span className="wordrow-word">{w.word}</span>
                {w.pos && <span className="wordrow-pos"> {w.pos}</span>}
                <p className="wordrow-def">{w.definition}</p>
                {w.example && <p className="wordrow-ex">{w.example}</p>}
              </div>
              <span className="wordrow-state">{masteryOf(records, w.id)}</span>
            </div>
          ))}
          {list.length >= 120 && (
            <p className="meta" style={{ marginTop: 16 }}>
              Showing the first 120. Narrow the search to see more.
            </p>
          )}
        </div>
      )}
    </>
  )
}


/* ── one review session ── */

function VocabSession({
  queue,
  records,
  onRecord,
  onDone,
}: {
  queue: Word[]
  records: ReturnType<typeof buildRecords>
  onRecord: (id: string, correct: boolean) => void
  onDone: () => void
}) {
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const word = queue[at]
  const prompt = useMemo(() => buildPrompt(word), [word.id])
  const answered = picked !== null
  const right = picked === prompt.answer

  function choose(i: number) {
    if (answered) return
    setPicked(i)
    onRecord(word.id, i === prompt.answer)
  }

  function next() {
    setPicked(null)
    if (at + 1 >= queue.length) onDone()
    else setAt(at + 1)
  }

  return (
    <div className="wrap-read">
      <div className="qtop">
        <div>
          <div className="qlabel">
            Word <b>{String(at + 1).padStart(3, '0')}</b> / {String(queue.length).padStart(3, '0')}
          </div>
          <div className="qcrumb" style={{ marginTop: 8 }}>
            <span>{word.difficulty.toLowerCase()}</span>
            <i>·</i>
            <span>{masteryOf(records, word.id)}</span>
          </div>
        </div>
        <button className="flagbtn" onClick={onDone}>
          End review
        </button>
      </div>
      <div className="track" aria-hidden="true">
        <i style={{ width: `${((at + 1) / queue.length) * 100}%` }} />
      </div>

      <p className="label">Which word means</p>
      <p className="stem" style={{ marginTop: 12 }}>
        {word.definition}
      </p>

      <div className="answer">
        <div className="choices">
          {prompt.options.map((o, i) => {
            let cls = 'choice'
            if (answered) {
              if (i === prompt.answer) cls += ' is-correct'
              else if (i === picked) cls += ' is-wrong'
            }
            return (
              <button
                key={o.id}
                className={cls}
                aria-pressed={picked === i}
                disabled={answered}
                onClick={() => choose(i)}
              >
                <span className="bubble" aria-hidden="true">
                  {'ABCD'[i]}
                </span>
                <span>{o.word}</span>
              </button>
            )
          })}
        </div>
      </div>

      {answered && (
        <div className={`verdict ${right ? 'verdict-good' : 'verdict-bad'}`}>
          <div className="verdict-head">{right ? 'Correct' : 'Not quite'}</div>
          <p className="verdict-body">
            <strong style={{ color: 'var(--text)', fontWeight: 500 }}>{word.word}</strong>
            {word.pos ? ` · ${word.pos}` : ''} — {word.definition}
          </p>
          {word.example && (
            <p className="verdict-body" style={{ marginTop: 14, fontStyle: 'italic' }}>
              {word.example}
            </p>
          )}
          {(word.synonym || word.antonym) && (
            <p className="meta" style={{ marginTop: 14 }}>
              {word.synonym && <>Similar: {word.synonym}</>}
              {word.synonym && word.antonym && ' · '}
              {word.antonym && <>Opposite: {word.antonym}</>}
            </p>
          )}
        </div>
      )}

      <div className="actions">
        <button className="btn btn-primary" disabled={!answered} onClick={next}>
          {at + 1 >= queue.length ? 'Finish' : 'Next word'}
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  )
}
