import type { Format, Letter, Question } from '../lib/types'

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
  // __FIGROOT lets a build point image paths somewhere other than /figures,
  // for hosting layouts where the folders sit elsewhere.
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

function offersLetters(f: Format) {
  return f === 'mcq' || f === 'unknown'
}
function offersTyping(f: Format) {
  return f === 'spr' || f === 'unknown'
}

/* ---------- the body of a question ---------- */

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
        {q.passage.map((block, i) => (
          <p key={i} className={block.i === 1 ? 'indent' : undefined}>
            {block.t}
          </p>
        ))}
      </div>
      <p className="stem">{q.stem}</p>
    </>
  )
}

/* ---------- answering ---------- */

interface AnswerProps {
  q: Question
  selected: Letter | string | null
  onSelect: (answer: Letter | string) => void
  /** true once the student has checked, or after a test is submitted */
  revealed: boolean
  disabled?: boolean
}

export function AnswerInput({ q, selected, onSelect, revealed, disabled }: AnswerProps) {
  const compact = Boolean(q.image) // the choice text lives inside the image
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
                <span className="choice-letter" aria-hidden="true">
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
            placeholder="e.g. 46, 3/4, -0.5"
            disabled={disabled || revealed}
            value={isLetter ? '' : String(selected ?? '')}
            onChange={(e) => onSelect(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

/* ---------- feedback ---------- */

export function Verdict({ q, selected }: { q: Question; selected: Letter | string | null }) {
  if (q.correctAnswer === null) {
    return (
      <div className="verdict verdict-unknown">
        <h3>Not verified yet</h3>
        <div className="verdict-body">
          <p>
            This question came out of the source PDF without an answer key, and its answer hasn't been
            worked out and checked yet. You answered {selected ? `"${selected}"` : 'nothing'}. Nothing is
            recorded against your accuracy for this one.
          </p>
        </div>
      </div>
    )
  }

  const right = isCorrect(q, selected)
  return (
    <div className={`verdict ${right ? 'verdict-correct' : 'verdict-wrong'}`}>
      <h3>{right ? 'Correct' : `Not quite — the answer is ${q.correctAnswer}`}</h3>
      <div className="verdict-body">
        <p>{q.explanation}</p>
      </div>
    </div>
  )
}

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
      <div className="qhead">
        <div>
          <div className="qhead-topic">{q.topic}</div>
          <div className="qhead-meta">
            {q.section} · {q.domain}
            {q.difficulty ? ` · ${q.difficulty.toLowerCase()}` : ''} · question {index + 1} of {total}
          </div>
        </div>
        <div className="row">
          {q.needsReview && <span className="pill pill-warn">Answer not verified</span>}
          <button className="btn btn-sm btn-quiet" onClick={onToggleFlag} aria-pressed={flagged}>
            {flagged ? 'Unflag' : 'Flag for later'}
          </button>
        </div>
      </div>
      <div className="progressline" aria-hidden="true">
        <i style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
    </>
  )
}
