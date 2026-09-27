# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAT Reading & Writing practice platform built from 17 PDFs containing 1,441 questions (1,014 Reading & Writing, 427 Math). Content is 100% extracted from official sources—nothing invented or filled in. 548 questions are verified with written explanations; the remaining 893 carry `needsReview: true` and are excluded from practice by default.

**Key constraint**: Questions are immutable data extracted from PDFs. The interface adapts to the data, never vice versa.

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server at http://localhost:5173
npm run build            # TypeScript compile + Vite build → dist/
npm run preview          # Preview production build
npm run standalone       # Build single-file bundle → standalone/sat-practice.html
npm run standalone:flat  # Build flat bundle (math images in sibling math/ folder)
```

### Testing (Playwright)

```bash
npm test                 # Run all tests headlessly
npm run test:ui          # Interactive UI mode
npm run test:headed      # Run with browser visible
npm run test:debug       # Debug mode
npm run test:codegen     # Record browser actions, generate test code
npm run test:report      # View last test report
```

### Design Quality (Impeccable)

Impeccable is installed as AI coding skills. Use these commands in Claude Code or GitHub Copilot:

- `/impeccable` - Main design/UX/UI workflow
- `/critique` - Evaluate design from UX perspective
- `/audit` - Technical quality checks (a11y, performance, theming)
- `/polish` - Final quality pass (alignment, spacing, consistency)
- `/typeset` - Typography improvements
- `/adapt` - Responsive design across screen sizes
- `/harden` - Production-ready error handling, i18n, text overflow

Run `/impeccable init` to set up design context for the project.

## Architecture

### Data Model

**Questions are pure data** loaded from `src/data/questions.json`. No code changes needed to add questions—just append to the JSON array. The app discovers skills, domains, and counts dynamically.

- **Reading & Writing questions**: `passage`, `stem`, `choices` (A/B/C/D), optional `figure` (PNG filename)
- **Math questions**: Empty passage/stem, `image` field (entire question as PNG), `format: "mcq" | "spr" | "unknown"`
  - `spr` = student-produced response (grid-in, typed answer)
  - `unknown` = scanned PDF with no text layer, so both MCQ buttons and text input offered
- **Unverified questions**: `needsReview: true`, `correctAnswer: null`, `explanation: null`

All questions have: `id`, `section`, `domain`, `topic`, `difficulty`, `sourceFile`, `sourceQuestionNumber`

### State Management

**Single source of truth**: `localStorage` under key `sat-rw-progress-v1`, loaded by `src/lib/store.ts`.

```typescript
interface Progress {
  attempts: Attempt[]           // Full attempt log (id, choice, correct, mode, timestamp)
  words: { id, correct, ts }[]  // Vocabulary quiz attempts
  flagged: string[]             // Flagged question IDs
  theme: 'light' | 'dark'
  open: OpenSession | null      // In-progress session that survives refresh
}
```

**Attempts are append-only**. Never mutate or delete. All statistics derive from the log:
- Latest attempt per question determines Review mode filtering
- 30-minute gaps split attempts into separate sessions
- Streaks, accuracy by domain/topic, and recent form computed on-demand

`OpenSession` persists session state (question IDs, current index, answered count, timer) so a refresh doesn't lose progress.

### Question Bank (src/lib/bank.ts)

- `QUESTIONS`: All 1,441 questions loaded from JSON
- `BY_ID`: Map for O(1) lookup
- `TOPICS`, `DOMAINS`, `SECTION_GROUPS`: Precomputed hierarchies in College Board order
- `selectQuestions(filter)`: Filters by section, topics, difficulty, and `includeUnverified`
- `shuffle()`, `orderQuestions()`: Fisher-Yates shuffle + optional easy-first/hard-first sort

**Domain order is fixed** per College Board:
1. Information and Ideas
2. Craft and Structure
3. Expression of Ideas
4. Standard English Conventions
5. Algebra
6. Advanced Math
7. Problem-Solving and Data Analysis
8. Geometry and Trigonometry

### Modes

Three primary modes, each a separate component:

**Practice** (`components/Practice.tsx`): One question at a time, immediate feedback. Previous/Skip/Flag always available. Verdict and explanation shown on "Check answer."

**Test** (`components/TestMode.tsx`): Countdown timer, free navigation, numbered grid showing answered/flagged status, zero feedback until submit. Submitting (or timeout) shows score and opens all explanations.

**Review** (`components/Review.tsx`): Filters attempts by outcome (wrong/right/blank/flagged/unverified) and topic. Uses `latestByQuestion()` to show only the most recent attempt per question.

### Navigation and Session Flow

`App.tsx` orchestrates the shell:
1. User picks mode and filter in `Setup.tsx`
2. `start()` draws questions, shuffles, orders, creates `Session` and `OpenSession`
3. Mode component renders questions from `session.questions[]`
4. `resume()` rebuilds session from `progress.open.ids` after refresh
5. `finish()` clears `OpenSession`, navigates to Progress

**Session creation**:
- `selectQuestions()` filters the bank
- `shuffle()` randomizes the pool
- `.slice(0, length)` caps to requested count
- `orderQuestions()` applies easy-first/hard-first if requested
- `OpenSession` stores IDs (not full question objects) to keep localStorage lean

### Theming

Dark mode by default. Theme stored in `progress.theme`, applied via `document.documentElement.dataset.theme = 'light' | 'dark'`. CSS uses custom properties that flip on `html[data-theme]`.

Header tucks away on scroll down, returns on scroll up. State tracked via `lastY.current` and `window.scrollY` delta.

### Standalone Build

`npm run standalone` inlines CSS, JS, and the 67 R&W figure PNGs into a single HTML file. Math images (427 files, ~12 MB) are copied alongside as `figures/math/` to keep load time reasonable on mobile.

The bundle:
- Works offline and from a USB stick (file:// protocol)
- Stores progress in browser localStorage (same key as dev mode)
- Uses `window.__FIGS` global for inlined figures
- Two variants: standard (`figures/math/`) and flat (`math/` sibling folder)

## Component Architecture

```
App.tsx                  Shell, navigation, session lifecycle, scroll behavior
├─ Home.tsx              Overview: recent sessions, outstanding mistakes, resume button
├─ Setup.tsx             Skill picker, length/time/order controls
├─ Practice.tsx          Single-question mode with immediate feedback
├─ TestMode.tsx          Timed mode with jump grid and delayed feedback
├─ Review.tsx            Filter and replay past attempts
├─ Dashboard.tsx         Stats, accuracy by domain/topic, streaks
├─ Vocabulary.tsx        Separate vocab quiz mode
└─ Question.tsx          Shared rendering: passage, choices, verdict, explanation
```

`Question.tsx` is mode-agnostic. Receives `question`, `onChoose`, `verdict`, `showExplanation` props. Handles both MCQ and grid-in formats. Uses `isCorrect()` utility for loose string matching on grid-ins (ignores whitespace, leading zeros).

## Working with Questions

### Adding new questions

Append to `src/data/questions.json`. The schema:

```json
{
  "id": "unique-8-char-hex",
  "section": "Reading and Writing" | "Math",
  "domain": "one of the 8 fixed domains",
  "topic": "skill name matching PDF headers",
  "difficulty": "Easy" | "Medium" | "Hard" | null,
  "format": "mcq" | "spr" | "unknown",
  "passage": [{ "t": "text", "i": 0|1|2 }],
  "stem": "question text",
  "choices": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correctAnswer": "A" | "typed-value" | null,
  "explanation": "reasoning" | null,
  "needsReview": true | false,
  "sourceFile": "Boundaries.pdf",
  "sourceQuestionNumber": 1,
  "figure": "optional-rw-graph.png",  // R&W only, in public/figures/
  "image": "abc123.png"               // Math only, in public/figures/math/
}
```

**Passage blocks**: `i: 0` = prose, `i: 1` = indented (notes, verse), `i: 2` = "Text 1" label  
**Math questions**: Leave `passage` and `stem` empty, populate `image`  
**Unverified**: Set `correctAnswer: null`, `explanation: null`, `needsReview: true`

No code changes required. Filters, counts, and dropdowns update automatically.

### Verifying questions

To mark a question verified:
1. Solve it, determine the correct answer
2. Write an explanation (1-3 sentences, focus on reasoning not mechanics)
3. Set `"correctAnswer"` and `"explanation"` in questions.json
4. Set `"needsReview": false`

The 548 verified answers have an A/B/C/D distribution of 127/131/136/154—a spread consistent with genuine solving, not pattern-guessing.

## CSS and Styling

Hand-written CSS with custom properties. No Tailwind, no CSS-in-JS. Styles live in `src/styles.css`.

**Accessibility**: Keyboard focus rings, `prefers-reduced-motion` respected, mobile-first layout down to 320px width. Light/dark themes via `html[data-theme]`.

**Ambient decoration**: `.ambient` div with 4 child elements (`<i>` × 3 + `<u>`) creates the background gradient animation. Decorative only, `aria-hidden="true"`.

## File Locations

```
src/data/questions.json      The 1,441-question bank (no imports, pure data)
src/lib/types.ts             Question, Attempt, Progress, OpenSession
src/lib/bank.ts              Loading, filtering, shuffling, domain hierarchy
src/lib/store.ts             localStorage persistence, statistics derivation
src/lib/motion.ts            useCountUp, stagger (animation utilities)
src/lib/vocab.ts             Vocabulary quiz words and definitions
public/figures/              67 R&W graphs/tables (PNGs)
public/figures/math/         427 rendered math questions (PNGs)
build-standalone.mjs         Bundles dist/ into offline-capable HTML
```

## Key Implementation Details

### Grid-in answer checking

`isCorrect()` in `Question.tsx` does loose matching for student-produced responses:
- Strips whitespace
- Ignores leading zeros
- `0.5`, `.50`, ` 0.5 ` all match

### Session resume after refresh

`OpenSession` stores question IDs and current state. On mount, `App` calls `resume()` which:
1. Maps `open.ids` back to `Question[]` via `BY_ID`
2. Rebuilds `session` object
3. Restores `view` to the in-progress mode

This survives page refresh but not localStorage clear.

### Statistics computation

All stats derive from `attempts[]` array in O(n):
- `computeStats()` runs on every render (memoized in practice by React)
- Domain/topic buckets built via grouping + filtering where `correct !== null`
- Streaks: scan backward for current, scan forward for best
- Recent sessions: split on 30-minute gaps

### Math question rendering

Math PDFs have no extractable text (equations and diagrams are images). Each question is rendered as a full-page screenshot at question-number granularity and stored as PNG. This preserves exact visual fidelity to the source.

Two sources (`OrxanMath-Functions`, `SAT Must-Solve Geometry`) are scans with no text layer, so `format: "unknown"` offers both MCQ buttons and a text input—the student chooses which to use.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build and dev server
- **Playwright** for E2E testing
- Zero runtime dependencies beyond React
- No UI framework, no state library, no CSS framework

Build output: `dist/` for standard deployment, `standalone/` for offline use.
