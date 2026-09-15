import raw from '../data/vocabulary.json'

export interface Word {
  id: string
  word: string
  pos: string | null
  definition: string
  example: string | null
  synonym: string | null
  antonym: string | null
  difficulty: 'Easy' | 'Medium' | 'Hard'
  source: string
}

/** One answered vocabulary prompt. */
export interface WordAttempt {
  id: string
  correct: boolean
  ts: number
}

export const WORDS = raw as Word[]
export const WORD_BY_ID = new Map(WORDS.map((w) => [w.id, w]))
export const SOURCES = [...new Set(WORDS.map((w) => w.source))]

export type Mastery = 'Learning' | 'Familiar' | 'Strong' | 'Mastered'
export const MASTERY: Mastery[] = ['Learning', 'Familiar', 'Strong', 'Mastered']

export interface WordRecord {
  seen: number
  right: number
  wrong: number
  streak: number
  last: number
  mastery: Mastery
  /** when this word is next worth showing, in ms since epoch */
  due: number
}

/**
 * Spaced repetition, deliberately simple: each consecutive correct answer
 * moves the word up a level and pushes the next sighting further out; a wrong
 * answer drops it a level and brings it back almost immediately. The effect is
 * that missed words recur often and solid ones fade into the background.
 */
const INTERVALS: Record<Mastery, number> = {
  Learning: 10 * 60 * 1000, // 10 minutes
  Familiar: 24 * 60 * 60 * 1000, // a day
  Strong: 4 * 24 * 60 * 60 * 1000, // four days
  Mastered: 14 * 24 * 60 * 60 * 1000, // a fortnight
}

function levelFor(streak: number, wrong: number): Mastery {
  if (streak >= 5 && wrong === 0) return 'Mastered'
  if (streak >= 4) return 'Mastered'
  if (streak >= 3) return 'Strong'
  if (streak >= 2) return 'Familiar'
  if (streak >= 1) return 'Learning'
  return 'Learning'
}

export function buildRecords(attempts: WordAttempt[]): Map<string, WordRecord> {
  const m = new Map<string, WordRecord>()
  for (const a of attempts) {
    const r =
      m.get(a.id) ??
      ({ seen: 0, right: 0, wrong: 0, streak: 0, last: 0, mastery: 'Learning', due: 0 } as WordRecord)
    r.seen += 1
    r.last = a.ts
    if (a.correct) {
      r.right += 1
      r.streak += 1
    } else {
      r.wrong += 1
      r.streak = 0
    }
    r.mastery = a.correct ? levelFor(r.streak, r.wrong) : 'Learning'
    r.due = a.ts + INTERVALS[r.mastery]
    m.set(a.id, r)
  }
  return m
}

/** Undefined means the word has no history yet. */
export function masteryOf(records: Map<string, WordRecord>, id: string): Mastery | undefined {
  return records.get(id)?.mastery
}

/** Words worth showing now: overdue first, then never-seen. */
export function dueWords(records: Map<string, WordRecord>, now = Date.now()): Word[] {
  const overdue: { w: Word; due: number }[] = []
  const fresh: Word[] = []
  for (const w of WORDS) {
    const r = records.get(w.id)
    if (!r) fresh.push(w)
    else if (r.due <= now) overdue.push({ w, due: r.due })
  }
  overdue.sort((a, b) => a.due - b.due)
  return [...overdue.map((o) => o.w), ...fresh]
}

/** Simple fuzzy search over word, definition and synonym. */
export function searchWords(query: string, limit = 60): Word[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored: { w: Word; s: number }[] = []
  for (const w of WORDS) {
    const word = w.word.toLowerCase()
    let s = -1
    if (word === q) s = 0
    else if (word.startsWith(q)) s = 1
    else if (word.includes(q)) s = 2
    else if (w.definition.toLowerCase().includes(q)) s = 3
    else if ((w.synonym ?? '').toLowerCase().includes(q)) s = 4
    if (s >= 0) scored.push({ w, s })
  }
  scored.sort((a, b) => (a.s === b.s ? a.w.word.localeCompare(b.w.word) : a.s - b.s))
  return scored.slice(0, limit).map((x) => x.w)
}

/** Build one multiple-choice prompt: the word, with three plausible decoys. */
export function buildPrompt(target: Word, pool: Word[] = WORDS) {
  const sameDifficulty = pool.filter((w) => w.id !== target.id && w.difficulty === target.difficulty)
  const source = sameDifficulty.length >= 3 ? sameDifficulty : pool.filter((w) => w.id !== target.id)
  const picked = new Set<string>()
  const decoys: Word[] = []
  let guard = 0
  while (decoys.length < 3 && guard++ < 400) {
    const c = source[Math.floor(Math.random() * source.length)]
    if (!c || picked.has(c.id)) continue
    picked.add(c.id)
    decoys.push(c)
  }
  const options = [target, ...decoys]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { target, options, answer: options.findIndex((o) => o.id === target.id) }
}


/**
 * One word to meet on each visit. Chosen from those without history, and
 * stable for the whole visit so it doesn't change as you move around.
 */
export function wordOfTheVisit(records: Map<string, WordRecord>): Word {
  const fresh = WORDS.filter((w) => !records.has(w.id))
  const pool = fresh.length ? fresh : WORDS
  return pool[Math.floor(Math.random() * pool.length)]
}
