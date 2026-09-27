import { useEffect, useState } from 'react'
import type { Letter, Question } from '../lib/types'
import { AnswerInput, QuestionBody, QuestionHeader, SourceNote, Verdict } from './Question'

interface Props {
  questions: Question[]
  flagged: string[]
  onToggleFlag: (id: string) => void
  onRecord: (id: string, choice: Letter | string | null) => void
  onAdvance?: (index: number, answered: number) => void
  onExit: () => void
}

export default function Practice({ questions, flagged, onToggleFlag, onRecord, onAdvance, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Record<string, Letter | string>>({})
  const [checked, setChecked] = useState<Record<string, true>>({})
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    onAdvance?.(index, Object.keys(checked).length)
  }, [index, checked, onAdvance])

  const q = questions[index]
  const selected = picked[q.id] ?? null
  const isChecked = Boolean(checked[q.id])
  const last = index === questions.length - 1

  function check() {
    if (!selected) return
    setChecked((c) => ({ ...c, [q.id]: true }))
    onRecord(q.id, selected)
  }

  function go(delta: number) {
    setIsTransitioning(true)
    setTimeout(() => {
      setIndex((i) => Math.min(questions.length - 1, Math.max(0, i + delta)))
      setIsTransitioning(false)
    }, 200)
  }

  return (
    <div className="wrap-read">
      <div className={isTransitioning ? 'question-container transitioning' : 'question-container'} key={q.id}>
        <QuestionHeader
          q={q}
          index={index}
          total={questions.length}
          flagged={flagged.includes(q.id)}
          onToggleFlag={() => onToggleFlag(q.id)}
        />

        <QuestionBody q={q} />

        <AnswerInput
          q={q}
          selected={selected}
          onSelect={(a) => setPicked((p) => ({ ...p, [q.id]: a }))}
          revealed={isChecked}
        />

        {isChecked && <Verdict q={q} selected={selected} />}
      </div>

      <div className="actions">
        {!isChecked ? (
          <button className="btn btn-primary" disabled={!selected} onClick={check}>
            Check answer
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        ) : last ? (
          <button className="btn btn-primary" onClick={onExit}>
            Finish
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => go(1)}>
            Next question
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        )}
        <button className="btn btn-quiet" onClick={() => go(-1)} disabled={index === 0 || isTransitioning}>
          Previous
        </button>
        {!last && !isChecked && (
          <button className="btn btn-quiet" onClick={() => go(1)} disabled={isTransitioning}>
            Skip
          </button>
        )}
        <button className="btn btn-quiet" onClick={onExit} style={{ marginLeft: 'auto' }}>
          End run
        </button>
      </div>

      <SourceNote q={q} />
    </div>
  )
}
