import type { Format, Letter, Question } from '../lib/types'
import { IconCheck, IconClose, IconDoc, IconFlag } from './Icons'

const LETTERS: Letter[] = ['A', 'B', 'C', 'D']

/**
 * Figures normally load from /figures. The single-file build inlines them as
 * data URIs on window.__FIGS so the page works straight off the filesystem.
 */
function figureSrc(name: string): string {
  const w =
    typeof window === 'undefined'
      ? undefined
      : (window as unknown as { __FIGS?: Record<string, string>; __FIGROOT?: string })
  const root = w?.__FIGROOT ?? `${import.meta.env.BASE_URL}figures/`
  return w?.__FIGS?.[name] ?? root + name
}

/** Grid-in answers are compared loosely: "0.5", ".50" and " 0.5 " all match. */
export function normaliseTyped(value: string): string {
  const v = value.trim().replace(/\s+/g, '').toLowerCase()
  if (/^-?\d*\.?\d+$/.test(v)) {
    const n = Number(v)
    if (Number.isFinite(n)) return String(n)
  }
  return v
}

export function isCorrect(q: Question, answer: Letter | string | null): boolean | null {
  if (q.correctAnswer === null || answer === null || answer === '') return null
  if (q.format === 'mcq') return answer === q.correctAnswer
  return normaliseTyped(String(answer)) === normaliseTyped(String(q.correctAnswer))
}

const offersLetters = (f: Format) => f === 'mcq' || f === 'unknown'
const offersTyping = (f: Format) => f === 'spr' || f === 'unknown'

/* ── the question itself ─────────────────────────────────────────── */

export function QuestionBody({ q }: { q: Question }) {
  if (q.image) {
    return (
      <div className="qimage">
        <img src={figureSrc(`math/${q.image}`)} alt="Question, as printed in the source PDF" />
      </div>
    )
  }
  return (
    <>
      <div className="passage">
        {q.figure && (
          <div className="figure">
            <img src={figureSrc(q.figure)} alt="Graph or table accompanying this question" />
          </div>
        )}
        {q.passage.map((block, i) =>
          block.i === 2 ? (
            <p key={i} className="passage-label">
              {block.t}
            </p>
          ) : (
            <p key={i} className={block.i === 1 ? 'indent' : undefined}>
              {block.t}
            </p>
          )
        )}
      </div>
      <p className="stem">{q.stem}</p>
    </>
  )
}

/* ── answering ───────────────────────────────────────────────────── */

interface AnswerProps {
  q: Question
  selected: Letter | string | null
  onSelect: (answer: Letter | string) => void
  revealed: boolean
  disabled?: boolean
}

export function AnswerInput({ q, selected, onSelect, revealed, disabled }: AnswerProps) {
  const compact = Boolean(q.image) // choice text lives inside the image
  const isLetter = LETTERS.includes(selected as Letter)

  return (
    <div className="answer">
      {offersLetters(q.format) && (
        <div
          className={compact ? 'choices choices-compact' : 'choices'}
          role="group"
          aria-label="Answer choices"
        >
          {LETTERS.map((letter) => {
            let cls = 'choice'
            if (revealed && q.correctAnswer) {
              if (letter === q.correctAnswer) cls += ' is-correct'
              else if (letter === selected) cls += ' is-wrong'
            }
            return (
              <button
                key={letter}
                type="button"
                className={cls}
                aria-pressed={selected === letter}
                disabled={disabled || revealed}
                onClick={() => onSelect(letter)}
              >
                <span className="bubble" aria-hidden="true">
                  {letter}
                </span>
                {!compact && <span>{q.choices[letter]}</span>}
              </button>
            )
          })}
        </div>
      )}

      {offersTyping(q.format) && (
        <div className="typed">
          <label htmlFor={`typed-${q.id}`}>
            {q.format === 'unknown' ? 'Or type your answer' : 'Your answer'}
          </label>
          <input
            id={`typed-${q.id}`}
            type="text"
            autoComplete="off"
            placeholder="46, 3/4, −0.5"
            disabled={disabled || revealed}
            value={isLetter ? '' : String(selected ?? '')}
            onChange={(e) => onSelect(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

/* ── feedback ────────────────────────────────────────────────────── */

export function Verdict({ q, selected }: { q: Question; selected: Letter | string | null }) {
  if (q.correctAnswer === null) {
    return (
      <div className="verdict verdict-unknown">
        <div className="verdict-head">Answer not verified yet</div>
        <p className="verdict-body">
          This question came out of the source PDF without an answer key, and its answer hasn't been
          worked out and checked yet. Nothing is recorded against your accuracy for it.
        </p>
      </div>
    )
  }

  const right = isCorrect(q, selected)
  return (
    <div className={`verdict ${right ? 'verdict-correct' : 'verdict-wrong'}`}>
      <div className="verdict-head">
        {right ? <IconCheck size={14} /> : <IconClose size={14} />}
        {right ? 'Correct' : `The answer is ${q.correctAnswer}`}
      </div>
      <p className="verdict-body">
        {q.explanation ?? 'The answer is confirmed against the official key. A written explanation for this one is still being added.'}
      </p>
    </div>
  )
}

/* ── header ──────────────────────────────────────────────────────── */

export function QuestionHeader({
  q,
  index,
  total,
  flagged,
  onToggleFlag,
}: {
  q: Question
  index: number
  total: number
  flagged: boolean
  onToggleFlag: () => void
}) {
  return (
    <>
      <div className="qtop">
        <div className="qcrumb">
          <strong>{q.topic}</strong>
          <i>/</i>
          <span>{q.section}</span>
          {q.difficulty && (
            <>
              <i>/</i>
              <span>{q.difficulty.toLowerCase()}</span>
            </>
          )}
          {q.needsReview && <span className="tag tag-warn">Unverified</span>}
        </div>
        <div className="row" style={{ gap: 4 }}>
          <span className="qcount tabular">
            <b>{index + 1}</b> of {total}
          </span>
          <button className="flagbtn" onClick={onToggleFlag} aria-pressed={flagged}>
            <IconFlag size={14} filled={flagged} />
            {flagged ? 'Flagged' : 'Flag'}
          </button>
        </div>
      </div>
      <div className="track" aria-hidden="true">
        <i style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
    </>
  )
}

/* ── footer ──────────────────────────────────────────────────────── */

export function SourceNote({ q }: { q: Question }) {
  return (
    <div className="source">
      <IconDoc size={13} />
      {q.sourceFile.replace(/\.pdf$/i, '')} · question {q.sourceQuestionNumber} · {q.id}
    </div>
  )
}
