# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

High school students preparing for the SAT independently. They practice at their own pace without formal instruction, building skills through repeated exposure to authentic questions. Most sessions are solo study at home or in study spaces, using desktop/laptop for extended practice sessions and mobile for quick review or on-the-go work.

## Product Purpose

An SAT practice platform providing 1,441 authentic questions extracted verbatim from 17 source PDFs. Students drill Reading & Writing and Math skills through three modes: Practice (immediate feedback, one question at a time), Test (timed, no feedback until submit), and Review (filter past attempts by outcome and skill). The tool tracks accuracy by domain and skill, maintains streaks, and shows progress over time through localStorage persistence.

Success means students build confidence through repeated exposure to real SAT content, understand their weak areas through granular skill tracking, and improve accuracy through targeted practice on verified questions.

## Positioning

Every question came from official SAT source PDFs—nothing was written or invented to fill gaps. The 548 verified answers were solved from the questions themselves with written explanations; the remaining 893 are extracted but carry transparent "needs review" labels, excluded from practice by default and never counted in accuracy. This verification transparency is the mechanism: students see exactly which answers are confirmed and which aren't, something neighboring prep tools don't surface.

The platform also ships as a single offline-capable HTML file that works from a USB stick with no install, making authentic practice accessible in environments without reliable internet or installation permissions.

## Operating Context

Solo study sessions at home, school libraries, or coffee shops. Students may work through 10-50 questions in a sitting (Practice mode) or take full 32-minute or 64-minute timed tests (Test mode). The interface stays visible across sessions through browser localStorage—progress persists without accounts or sync.

Math questions are rendered as images because the source PDFs store equations and diagrams as graphics, not text. Two sources have no text layer at all, so those questions offer both multiple-choice buttons and a text input box.

Questions are grouped by College Board's eight domains: Information and Ideas, Craft and Structure, Expression of Ideas, Standard English Conventions (R&W), and Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry (Math).

## Capabilities and Constraints

**Capabilities:**
- 1,014 Reading & Writing questions and 427 Math questions
- Practice, Test, and Review modes
- Progress tracking: accuracy by domain/skill, streaks, recent form
- Flag questions for later review
- Vocabulary quiz mode with 500+ words
- Dark and light themes
- Responsive down to 320px mobile width
- Standalone offline version (single HTML file + math images folder)

**Constraints:**
- Questions are immutable data from `src/data/questions.json`—the interface adapts to the data, never vice versa
- No UI frameworks beyond React; zero runtime dependencies
- Standalone build must remain functional and lean
- Math questions stay as images to preserve exact visual fidelity to source PDFs
- Progress stored in browser localStorage only (no backend, no accounts)

**Terminology:**
- "Verified" questions have solved answers and explanations; "unverified" ones are extracted but not yet solved
- "Grid-in" or "SPR" (student-produced response) questions take typed numeric answers
- "MCQ" is multiple-choice (A/B/C/D)
- "Unknown" format means the source was a scan with no text layer

## Brand Commitments

No formal brand established. Working title "SATest" appears in the header. No logo, no tagline, no voice guidelines. The interface tone is functional and student-focused—no marketing language, no exaggeration of capabilities.

Three fonts in use: Fraunces (variable), Instrument Sans, and Newsreader—loaded from Google Fonts.

## Evidence on Hand

- 17 source PDFs containing all 1,441 questions (not in repo, referenced in README)
- 548 questions have verified correct answers with written explanations
- A/B/C/D distribution on verified set: 127/131/136/154 (natural spread, not pattern-guessed)
- 67 R&W figures extracted as PNGs in `public/figures/`
- 427 Math question images in `public/figures/math/`
- README documents extraction process, question format, and verification status
- No testimonials, no user studies, no published case studies

## Product Principles

1. **Authenticity over volume.** Ship only real SAT content extracted from source PDFs. Never invent questions to fill gaps. Surface verification status transparently so students know which answers are confirmed.

2. **Accessibility without compromise.** The standalone build works offline from a USB stick. No install, no account, no internet required. Progress persists in browser localStorage. Make SAT practice available in restrictive environments.

3. **Adapt to the data, never vice versa.** Questions are immutable. The interface discovers domains, skills, and counts dynamically from the JSON array. Adding questions requires zero code changes—append to the data file and the rest follows.

4. **Focused practice over feature sprawl.** Three modes (Practice, Test, Review) and clear skill tracking. No gamification, no social features, no distractions. Students drill, review mistakes, and track accuracy.

5. **Technical honesty.** Show unverified questions as unverified. Render math as images because that's what the PDFs are. Keep dependencies minimal. Ship a lean, offline-capable tool that does what it says.
