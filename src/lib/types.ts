export type Letter = 'A' | 'B' | 'C' | 'D'

/**
 * mcq      four lettered choices
 * spr      student-produced response — the student types a value
 * unknown  image-only source where the format can't be read from the PDF text,
 *          so both input methods are offered
 */
export type Format = 'mcq' | 'spr' | 'unknown'

export interface PassageBlock {
  /** text of the block */
  t: string
  /** 0 = flush left prose, 1 = indented block (notes list, quoted verse, Text 1 / Text 2) */
  i: 0 | 1
}

export interface Question {
  id: string
  section: string
  domain: string
  topic: string
  difficulty: string | null
  format: Format
  passage: PassageBlock[]
  stem: string
  choices: Record<Letter, string>
  /** null when the answer has not been verified yet */
  /** a letter for multiple choice, a typed value for grid-ins, null when unverified */
  correctAnswer: Letter | string | null
  explanation: string | null
  needsReview: boolean
  sourceFile: string
  sourceQuestionNumber: number
  /** filename under /figures for a graph or table beside a Reading and Writing passage */
  figure?: string
  /** filename under /figures/math — the whole question, rendered from the source PDF */
  image?: string
}

export interface Attempt {
  id: string
  topic: string
  domain: string
  choice: Letter | string | null
  correct: boolean | null   // null when the question is unverified
  mode: 'practice' | 'test'
  ts: number
}

export interface Progress {
  attempts: Attempt[]
  flagged: string[]
  theme: 'light' | 'dark'
}
