import { useCallback, useEffect, useState } from 'react'
import type { Attempt, Letter, Progress } from './types'
import { BY_ID } from './bank'
import { isCorrect } from '../components/Question'

const KEY = 'sat-rw-progress-v1'

const EMPTY: Progress = { attempts: [], flagged: [], theme: 'dark' }

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    }
  } catch {
    return EMPTY
  }
}

function write(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* quota or private mode — progress simply won't persist this session */
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(read)

  useEffect(() => {
    write(progress)
  }, [progress])

  useEffect(() => {
    document.documentElement.dataset.theme = progress.theme
  }, [progress.theme])

  const record = useCallback(
    (questionId: string, choice: Letter | string | null, mode: 'practice' | 'test') => {
      const q = BY_ID.get(questionId)
      if (!q) return
      const attempt: Attempt = {
        id: questionId,
        topic: q.topic,
        domain: q.domain,
        choice,
        correct: isCorrect(q, choice),
        mode,
        ts: Date.now(),
      }
      setProgress((p) => ({ ...p, attempts: [...p.attempts, attempt] }))
    },
    []
  )

  const toggleFlag = useCallback((questionId: string) => {
    setProgress((p) => ({
      ...p,
      flagged: p.flagged.includes(questionId)
        ? p.flagged.filter((f) => f !== questionId)
        : [...p.flagged, questionId],
    }))
  }, [])

  const toggleTheme = useCallback(() => {
    setProgress((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  const reset = useCallback(() => {
    setProgress((p) => ({ attempts: [], flagged: [], theme: p.theme }))
  }, [])

  return { progress, record, toggleFlag, toggleTheme, reset }
}

/* ---------- derived statistics ---------- */

export interface Bucket {
  name: string
  attempted: number
  correct: number
  accuracy: number | null
}

function bucket(name: string, rows: Attempt[]): Bucket {
  const graded = rows.filter((a) => a.correct !== null)
  const correct = graded.filter((a) => a.correct).length
  return {
    name,
    attempted: graded.length,
    correct,
    accuracy: graded.length ? correct / graded.length : null,
  }
}

export interface Stats {
  attempted: number
  correct: number
  incorrect: number
  unanswered: number
  unverifiedAttempts: number
  accuracy: number | null
  distinctQuestions: number
  byDomain: Bucket[]
  byTopic: Bucket[]
  recent: Attempt[]
  streak: number
  bestStreak: number
}

export function computeStats(attempts: Attempt[]): Stats {
  const graded = attempts.filter((a) => a.correct !== null)
  const correct = graded.filter((a) => a.correct).length
  const unanswered = attempts.filter((a) => a.choice === null).length

  const group = (key: (a: Attempt) => string) => {
    const m = new Map<string, Attempt[]>()
    for (const a of attempts) {
      const k = key(a)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(a)
    }
    return [...m.entries()]
      .map(([name, rows]) => bucket(name, rows))
      .filter((b) => b.attempted > 0)
      .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))
  }

  // Longest run of correct answers, and the run currently in progress.
  let streak = 0
  let bestStreak = 0
  let running = 0
  for (const a of graded) {
    running = a.correct ? running + 1 : 0
    if (running > bestStreak) bestStreak = running
  }
  for (let i = graded.length - 1; i >= 0; i--) {
    if (graded[i].correct) streak++
    else break
  }

  return {
    attempted: attempts.length,
    correct,
    incorrect: graded.length - correct,
    unanswered,
    unverifiedAttempts: attempts.length - graded.length,
    accuracy: graded.length ? correct / graded.length : null,
    distinctQuestions: new Set(attempts.map((a) => a.id)).size,
    byDomain: group((a) => a.domain),
    byTopic: group((a) => a.topic),
    recent: attempts.slice(-24),
    streak,
    bestStreak,
  }
}

/** Most recent outcome per question — what Review mode filters on. */
export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>()
  for (const a of attempts) m.set(a.id, a)
  return m
}

export function pct(v: number | null): string {
  return v === null ? '—' : `${Math.round(v * 100)}%`
}
