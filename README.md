# SAT Reading and Writing — practice platform

Built from the seventeen PDFs in `Sat_files.zip` and `sat_maths.zip`. Every question in the
app came out of those files; nothing was written or invented to fill gaps.

## Running it

Two ways, depending on whether you want to edit anything.

**Just use it.** Open `standalone/sat-practice.html` in any browser. One file, no install,
works offline and off a USB stick. Progress saves to that browser's local storage.

**Work on it.**

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build` (writes `dist/`), `npm run standalone` (rebuilds the
single-file version).

## What's in the bank

1,441 questions: 1,014 Reading and Writing and 427 Math.

| Section | Skill | Questions | Verified answer |
|---|---|---:|---:|
| R&W | Central Ideas and Details | 66 | 0 |
| R&W | Command of Evidence | 151 | 0 |
| R&W | Inference | 74 | 0 |
| R&W | Cross-Text Connections | 43 | 43 |
| R&W | Text Structure and Purpose | 72 | 0 |
| R&W | Words in Context | 130 | 130 |
| R&W | Rhetorical Synthesis | 103 | 0 |
| R&W | Transitions | 86 | 86 |
| R&W | Boundaries | 148 | 148 |
| R&W | Form, Structure, and Sense | 141 | 141 |
| Math | Nonlinear functions | 178 | 0 |
| Math | Nonlinear equations and systems | 62 | 0 |
| Math | Equivalent expressions | 34 | 0 |
| Math | Mixed geometry | 70 | 0 |
| Math | Lines, angles, and triangles | 28 | 0 |
| Math | Area and volume | 21 | 0 |
| Math | Circles | 17 | 0 |
| Math | Right triangles and trigonometry | 17 | 0 |
| **Total** | | **1,441** | **548** |

The source PDFs carry no answer key. Every one of the 548 verified answers was solved from
the question itself and given a written explanation. The other 893 are extracted and fully
usable but carry `needsReview: true`: they are labelled on screen, excluded from practice
and tests unless you switch them on, and never counted in your accuracy.

A useful sanity signal on the verified set: correct answers fall A 127 / B 131 / C 136 /
D 154, the spread you'd expect from genuine solving rather than pattern-guessing.

### Math questions are images, deliberately

In the math PDFs every equation, diagram, and answer choice is drawn as an image rather
than stored as text. Pulling text out of them produces sentences with the mathematics
missing — "How many times does the graph of the given equation cross the x-axis, where ,
, and are positive constants such that and ?" is a real extraction result. Rather than
guess at the missing symbols, each math question is rendered from its source page as an
image and displayed whole, so what you see is exactly what the PDF shows.

Metadata (skill, difficulty, multiple-choice versus grid-in) is read from the surrounding
text where the PDF provides it. Two sources are scans with no text layer at all
(`OrxanMath-Functions`, `SAT Must-Solve Geometry`), so their format is recorded as
`unknown` and the app offers both lettered buttons and a typing box.

## Modes

**Practice** — one question at a time. Choose an answer, press Check answer, and the
verdict, the correct answer, and the reasoning appear immediately. Previous, Skip, and a
flag button are always available. Grid-in questions take a typed answer, compared loosely
so `0.5`, `.50`, and ` 0.5 ` all match.

**Test** — a countdown timer, free navigation, a numbered jump grid showing which
questions are answered and which are flagged, and no feedback at all until you submit.
Submitting (or running out of time) shows the score and opens every question with its
explanation.

**Review** — filter what you've answered by got-wrong, got-right, left-blank, flagged,
unverified, or everything, and narrow further by skill.

**Progress** — overall accuracy, accuracy by domain and by skill, recent form, current and
best correct-answer streaks, questions seen, and your weakest and strongest skills. Stored
in `localStorage` under `sat-rw-progress-v1`, so a refresh doesn't lose it.

## Adding more questions later

Content is completely separate from the interface. `src/data/questions.json` is a flat
array; each entry looks like this:

```json
{
  "id": "de55ec71",
  "section": "Reading and Writing",
  "domain": "Standard English Conventions",
  "topic": "Boundaries",
  "difficulty": null,
  "format": "mcq",
  "passage": [{ "t": "Generations of mystery and horror ______ have been…", "i": 0 }],
  "stem": "Which choice completes the text so that it conforms to…",
  "choices": { "A": "writers", "B": "writers,", "C": "writers—", "D": "writers;" },
  "correctAnswer": "A",
  "explanation": "No punctuation belongs between a subject and its verb…",
  "needsReview": false,
  "sourceFile": "Boundaries.pdf",
  "sourceQuestionNumber": 1,
  "figure": "optional-file.png"
}
```

A math question instead carries `"format": "mcq" | "spr" | "unknown"`, an empty `passage`
and `stem`, empty `choices`, and `"image": "abc123.png"` naming a file in
`public/figures/math`. For grid-ins, `correctAnswer` is the typed value rather than a
letter.

`passage` is a list of blocks; `i` is `0` for flush-left prose and `1` for an indented
block — a notes list, verse, or the Text 1 / Text 2 halves of a cross-text pair. `figure`
names a PNG in `public/figures`. Set `correctAnswer` and `explanation` to `null` and
`needsReview` to `true` for anything unsolved. Append new entries and the skill filters,
counts, and dashboards all pick them up with no code changes.

To fill in the remaining 509, set `correctAnswer`, write the `explanation`, and flip
`needsReview` to `false`. Nothing else needs touching.

## How the PDFs were read

Worth knowing if you add more files from the same source, because two things break a naive
parser:

- **Choice labels sit on the wrong line.** In multi-line choices the "A." label is
  vertically centred, so a plain text extract attaches it to the choice's *second* line.
  The parser uses pypdf for reading order and pdfplumber for geometry to put them back
  together.
- **Passage text can look like a choice.** A passage mentioning "C. David de Santana"
  matches a naive `^C\.` test. Choices are located by scanning backwards from D.

Also handled: ligature normalisation (the raw text contains "inﬂuenced", "oﬃcials"),
questions that span a page break, and paragraph reconstruction from line geometry so
indentation survives. The 67 questions with a graph or table had their figures cropped out
of the source pages and saved as PNGs, because the chart text extracts as unreadable
strings of axis labels.

All 1,014 questions parsed with zero failures, and question wording, answer choices, and
ordering are reproduced verbatim.

## Layout

```
src/
  data/questions.json      the bank — no code, no imports
  lib/types.ts             Question, Attempt, Progress
  lib/bank.ts              loading, grouping by domain and skill, filtering
  lib/store.ts             localStorage persistence and derived statistics
  components/Question.tsx  passage, choices, verdict — shared by all three modes
  components/Setup.tsx     skill and length picker
  components/Practice.tsx  Practice mode
  components/TestMode.tsx  Test mode and results
  components/Review.tsx    Review mode
  components/Dashboard.tsx Progress
  App.tsx                  shell, navigation, overview
public/figures/            67 R&W graph and table images
public/figures/math/       427 rendered math questions
```

React 18, TypeScript, Vite, hand-written CSS with custom properties. No UI framework and
no runtime dependencies beyond React. Light and dark themes, keyboard focus rings,
`prefers-reduced-motion` respected, and a layout that works down to phone width.
