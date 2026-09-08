import raw from '../data/questions.json'
import type { Question } from './types'

export const QUESTIONS = raw as unknown as Question[]

export const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

/** Domains and the skills inside them, in College Board's own order. */
const DOMAIN_ORDER = [
  'Information and Ideas',
  'Craft and Structure',
  'Expression of Ideas',
  'Standard English Conventions',
  'Algebra',
  'Advanced Math',
  'Problem-Solving and Data Analysis',
  'Geometry and Trigonometry',
]

export const SECTIONS = ['Reading and Writing', 'Math']

export interface TopicInfo {
  topic: string
  domain: string
  section: string
  total: number
  verified: number
  explained: number
}

export const TOPICS: TopicInfo[] = (() => {
  const map = new Map<string, TopicInfo>()
  for (const q of QUESTIONS) {
    let e = map.get(q.topic)
    if (!e) {
      e = { topic: q.topic, domain: q.domain, section: q.section, total: 0, verified: 0, explained: 0 }
      map.set(q.topic, e)
    }
    e.total += 1
    if (!q.needsReview) e.verified += 1
    if (q.explanation) e.explained += 1
  }
  return [...map.values()].sort((a, b) => {
    const d = DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain)
    return d !== 0 ? d : b.total - a.total
  })
})()

export const DOMAINS: { domain: string; section: string; topics: TopicInfo[] }[] = DOMAIN_ORDER.map(
  (domain) => ({
    domain,
    section: TOPICS.find((t) => t.domain === domain)?.section ?? '',
    topics: TOPICS.filter((t) => t.domain === domain),
  })
).filter((d) => d.topics.length > 0)

export const SECTION_GROUPS = SECTIONS.map((section) => ({
  section,
  domains: DOMAINS.filter((d) => d.section === section),
  total: QUESTIONS.filter((q) => q.section === section).length,
  verified: QUESTIONS.filter((q) => q.section === section && !q.needsReview).length,
  explained: QUESTIONS.filter((q) => q.section === section && q.explanation).length,
})).filter((g) => g.domains.length > 0)

export const TOTALS = {
  all: QUESTIONS.length,
  verified: QUESTIONS.filter((q) => !q.needsReview).length,
  explained: QUESTIONS.filter((q) => q.explanation).length,
  get unverified() {
    return this.all - this.verified
  },
}

export interface Filter {
  /** empty array means every topic */
  topics: string[]
  /** empty string means both sections */
  section: string
  includeUnverified: boolean
}

export function selectQuestions(filter: Filter): Question[] {
  const set = new Set(filter.topics)
  return QUESTIONS.filter((q) => {
    if (filter.section && q.section !== filter.section) return false
    if (set.size > 0 && !set.has(q.topic)) return false
    if (!filter.includeUnverified && q.needsReview) return false
    return true
  })
}

/** Fisher–Yates, seeded off the clock. Used for practice and test ordering. */
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function shortStem(q: Question, max = 110): string {
  const s = q.stem.replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s
}
