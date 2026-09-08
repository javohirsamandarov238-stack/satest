import { useState } from 'react'
import type { Letter, Question } from '../lib/types'
import { AnswerInput, QuestionBody, QuestionHeader, SourceNote, Verdict } from './Question'

interface Props {
  questions: Question[]
  flagged: string[]
  onToggleFlag: (id: string) => void
  onRecord: (id: string, choice: Letter | string | null) => void
  onExit: () => void
}

export default function Practice({ questions, flagged, onToggleFlag, onRecord, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Record<string, Letter | string>>({})
  const [checked, setChecked] = useState<Record<string, true>>({})

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
    setIndex((i) => Math.min(questions.length - 1, Math.max(0, i + delta)))
  }

  return (
    <div className="wrap">
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

      <div className="actions">
        {!isChecked ? (
          <button className="btn btn-primary" disabled={!selected} onClick={check}>
            Check answer
          </button>
        ) : last ? (
          <button className="btn btn-primary" onClick={onExit}>
            Finish
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => go(1)}>
            Next question
          </button>
        )}
        <button className="btn btn-quiet" onClick={() => go(-1)} disabled={index === 0}>
          Previous
        </button>
        {!last && !isChecked && (
          <button className="btn btn-quiet" onClick={() => go(1)}>
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
