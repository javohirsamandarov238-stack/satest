import { useCallback, useEffect, useState } from 'react'
import type { Attempt, Letter, OpenSession, Progress } from './types'
import { BY_ID } from './bank'
import { isCorrect } from '../components/Question'

const KEY = 'sat-rw-progress-v1'

const EMPTY: Progress = { attempts: [], flagged: [], theme: 'dark', open: null }

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      open: (parsed.open as OpenSession | null) ?? null,
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

  const setOpen = useCallback((open: OpenSession | null) => {
    setProgress((p) => ({ ...p, open }))
  }, [])

  const advanceOpen = useCallback((index: number, answered: number) => {
    setProgress((p) => (p.open ? { ...p, open: { ...p.open, index, answered } } : p))
  }, [])

  const reset = useCallback(() => {
    setProgress((p) => ({ attempts: [], flagged: [], theme: p.theme, open: null }))
  }, [])

  return { progress, record, toggleFlag, toggleTheme, reset, setOpen, advanceOpen }
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


/* ---------- sessions, derived from the attempt log ---------- */

export interface SessionSummary {
  at: number
  mode: 'practice' | 'test'
  total: number
  correct: number
  graded: number
  topics: string[]
}

/** Attempts more than 30 minutes apart are treated as separate sittings. */
export function recentSessions(attempts: Attempt[], gapMs = 30 * 60 * 1000): SessionSummary[] {
  const out: SessionSummary[] = []
  let cur: Attempt[] = []
  const flush = () => {
    if (!cur.length) return
    const graded = cur.filter((a) => a.correct !== null)
    out.push({
      at: cur[cur.length - 1].ts,
      mode: cur[0].mode,
      total: cur.length,
      graded: graded.length,
      correct: graded.filter((a) => a.correct).length,
      topics: [...new Set(cur.map((a) => a.topic))],
    })
    cur = []
  }
  for (const a of attempts) {
    if (cur.length && (a.ts - cur[cur.length - 1].ts > gapMs || a.mode !== cur[0].mode)) flush()
    cur.push(a)
  }
  flush()
  return out.reverse()
}

/** Questions answered wrong on the most recent attempt. */
export function outstandingMistakes(attempts: Attempt[]): string[] {
  const latest = latestByQuestion(attempts)
  return [...latest.values()].filter((a) => a.correct === false).map((a) => a.id)
}

export function relativeDay(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const days = Math.floor((+new Date(today.toDateString()) - +new Date(d.toDateString())) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
