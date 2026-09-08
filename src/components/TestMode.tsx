import { useEffect, useMemo, useRef, useState } from 'react'
import type { Letter, Question } from '../lib/types'
import { AnswerInput, QuestionBody, QuestionHeader, Verdict, isCorrect } from './Question'
import { pct } from '../lib/store'

interface Props {
  questions: Question[]
  minutes: number
  flagged: string[]
  onToggleFlag: (id: string) => void
  onRecord: (id: string, choice: Letter | string | null) => void
  onExit: () => void
}

function clock(seconds: number) {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function TestMode({
  questions,
  minutes,
  flagged,
  onToggleFlag,
  onRecord,
  onExit,
}: Props) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Record<string, Letter | string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [left, setLeft] = useState(minutes * 60)
  const submittedRef = useRef(false)

  function submit() {
    if (submittedRef.current) return
    submittedRef.current = true
    for (const q of questions) onRecord(q.id, picked[q.id] ?? null)
    setSubmitted(true)
  }

  useEffect(() => {
    if (submitted) return
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t)
          submit()
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [submitted])

  const answeredCount = Object.keys(picked).length

  const results = useMemo(() => {
    const graded = questions.filter((q) => q.correctAnswer !== null)
    const right = graded.filter((q) => isCorrect(q, picked[q.id] ?? null) === true).length
    return {
      graded: graded.length,
      right,
      wrong: graded.filter((q) => isCorrect(q, picked[q.id] ?? null) === false).length,
      blank: questions.filter((q) => !picked[q.id]).length,
      ungraded: questions.length - graded.length,
      accuracy: graded.length ? right / graded.length : null,
    }
  }, [submitted, questions, picked])

  /* ---------- results screen ---------- */

  if (submitted && reviewIndex === null) {
    return (
      <div className="wrap">
        <h1>Test finished</h1>
        <div className="stat-strip" style={{ marginTop: 18 }}>
          <div>
            <div className="stat-value">{pct(results.accuracy)}</div>
            <div className="stat-label">accuracy on graded questions</div>
          </div>
          <div>
            <div className="stat-value tabular">
              {results.right}<span style={{ color: 'var(--muted)' }}>/{results.graded}</span>
            </div>
            <div className="stat-label">correct</div>
          </div>
          <div>
            <div className="stat-value tabular">{results.blank}</div>
            <div className="stat-label">left blank</div>
          </div>
          {results.ungraded > 0 && (
            <div>
              <div className="stat-value tabular">{results.ungraded}</div>
              <div className="stat-label">unverified, not graded</div>
            </div>
          )}
        </div>

        <hr className="divider" />
        <h2>Every question</h2>
        <p className="eyebrow" style={{ marginTop: 6, marginBottom: 12 }}>
          Open any one to read the passage again with the answer and reasoning.
        </p>
        <div>
          {questions.map((q, i) => {
            const choice = picked[q.id]
            const state =
              q.correctAnswer === null
                ? 'unverified'
                : !choice
                  ? 'blank'
                  : isCorrect(q, choice)
                    ? 'correct'
                    : 'wrong'
            return (
              <div className="reviewitem" key={q.id}>
                <div className="reviewitem-meta">
                  <span className="tabular">{i + 1}</span>
                  <span>{q.topic}</span>
                  <span
                    className={
                      state === 'correct' ? 'mark-correct' : state === 'wrong' ? 'mark-wrong' : undefined
                    }
                  >
                    {state === 'correct' && `correct (${choice})`}
                    {state === 'wrong' && `you chose ${choice}, answer is ${q.correctAnswer}`}
                    {state === 'blank' && 'left blank'}
                    {state === 'unverified' && 'answer not verified'}
                  </span>
                </div>
                <div className="reviewitem-q">{q.stem || `${q.topic} — see question image`}</div>
                <button className="btn btn-sm" onClick={() => setReviewIndex(i)}>
                  Open question
                </button>
              </div>
            )
          })}
        </div>
        <hr className="divider" />
        <button className="btn btn-primary" onClick={onExit}>
          Back to overview
        </button>
      </div>
    )
  }

  /* ---------- post-test single question ---------- */

  if (submitted && reviewIndex !== null) {
    const q = questions[reviewIndex]
    return (
      <div className="wrap">
        <QuestionHeader
          q={q}
          index={reviewIndex}
          total={questions.length}
          flagged={flagged.includes(q.id)}
          onToggleFlag={() => onToggleFlag(q.id)}
        />
        <QuestionBody q={q} />
        <AnswerInput q={q} selected={picked[q.id] ?? null} onSelect={() => {}} revealed disabled />
        <Verdict q={q} selected={picked[q.id] ?? null} />
        <div className="actions">
          <button className="btn" disabled={reviewIndex === 0} onClick={() => setReviewIndex(reviewIndex - 1)}>
            Previous
          </button>
          <button
            className="btn"
            disabled={reviewIndex === questions.length - 1}
            onClick={() => setReviewIndex(reviewIndex + 1)}
          >
            Next
          </button>
          <button className="btn btn-quiet" onClick={() => setReviewIndex(null)}>
            Back to results
          </button>
        </div>
      </div>
    )
  }

  /* ---------- taking the test ---------- */

  const q = questions[index]

  return (
    <div className="wrap">
      <div className="testbar">
        <div className={`clock ${left < 300 ? 'low' : ''}`}>{clock(left)}</div>
        <div className="eyebrow tabular">
          {answeredCount} of {questions.length} answered
        </div>
        <button className="btn btn-sm btn-primary" onClick={submit}>
          Submit test
        </button>
      </div>

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
        selected={picked[q.id] ?? null}
        onSelect={(a) => setPicked((p) => ({ ...p, [q.id]: a }))}
        revealed={false}
      />

      <div className="actions">
        <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Previous
        </button>
        <button
          className="btn btn-primary"
          disabled={index === questions.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Next
        </button>
        <button
          className="btn btn-quiet"
          onClick={() => setPicked((p) => {
            const next = { ...p }
            delete next[q.id]
            return next
          })}
          disabled={!picked[q.id]}
        >
          Clear this answer
        </button>
      </div>

      <hr className="divider" />
      <div className="eyebrow">Jump to a question</div>
      <div className="navgrid">
        {questions.map((item, i) => (
          <button
            key={item.id}
            aria-current={i === index}
            className={`${picked[item.id] ? 'answered' : ''} ${flagged.includes(item.id) ? 'flagged' : ''}`}
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
