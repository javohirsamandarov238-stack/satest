import { useEffect, useRef, useState } from 'react'
import type { Filter, Order } from './lib/bank'
import { BY_ID, orderQuestions, selectQuestions, shuffle } from './lib/bank'
import { computeStats, pct, useProgress } from './lib/store'
import { stagger, useCountUp } from './lib/motion'
import type { Letter, Question } from './lib/types'
import Setup from './components/Setup'
import Practice from './components/Practice'
import TestMode from './components/TestMode'
import Review from './components/Review'
import Dashboard from './components/Dashboard'
import Home from './components/Home'
import Vocabulary from './components/Vocabulary'
import {
  IconMoon,
  IconOverview,
  IconPractice,
  IconProgress,
  IconReview,
  IconSun,
  IconTest,
  Monogram,
} from './components/Icons'

type View = 'home' | 'practice' | 'vocabulary' | 'test' | 'review' | 'progress'

const NAV: { key: View; label: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { key: 'home', label: 'Overview', Icon: IconOverview },
  { key: 'practice', label: 'Practice', Icon: IconPractice },
  { key: 'vocabulary', label: 'Vocabulary', Icon: IconReview },
  { key: 'test', label: 'Test', Icon: IconTest },
  { key: 'review', label: 'Review', Icon: IconReview },
  { key: 'progress', label: 'Progress', Icon: IconProgress },
]

interface Session {
  questions: Question[]
  minutes: number
}

export default function App() {
  const { progress, record, recordWord, toggleFlag, toggleTheme, reset, setOpen, advanceOpen } =
    useProgress()
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<Session | null>(null)
  const [presetTopics, setPresetTopics] = useState<string[]>([])

  const stats = computeStats(progress.attempts)

  function goto(v: View) {
    setSession(null)
    setPresetTopics([])
    setView(v)
  }

  function start(filter: Filter, length: number, minutes: number, order: Order) {
    const drawn = shuffle(selectQuestions(filter)).slice(0, length)
    const questions = orderQuestions(drawn, order)
    setSession({ questions, minutes })
    const topics = [...new Set(questions.map((q) => q.topic))]
    setOpen({
      mode: view === 'test' ? 'test' : 'practice',
      ids: questions.map((q) => q.id),
      index: 0,
      answered: 0,
      minutes,
      startedAt: Date.now(),
      label: topics.length === 1 ? topics[0] : `${questions[0].section} · ${topics.length} skills`,
    })
  }

  /** Rebuild a session from the persisted id list after a refresh. */
  function resume() {
    const o = progress.open
    if (!o) return
    const questions = o.ids.map((id) => BY_ID.get(id)).filter(Boolean) as Question[]
    if (!questions.length) {
      setOpen(null)
      return
    }
    setSession({ questions, minutes: o.minutes })
    setView(o.mode)
  }

  function finish() {
    setOpen(null)
    goto('progress')
  }

  function practiseTopic(topic: string) {
    setPresetTopics([topic])
    setSession(null)
    setView('practice')
  }

  const focused = (view === 'practice' || view === 'test') && session !== null

  /* A refresh should land at the top, not wherever the browser left off. */
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  /* Changing page also returns to the top. */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view, session])

  /* The header tucks away while you scroll down and returns on the way up. */
  const [tucked, setTucked] = useState(false)
  const lastY = useRef(0)
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const down = y > lastY.current
      setTucked(down && y > 120)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={focused ? 'shell focused' : 'shell'}>
      <div className="ambient" aria-hidden="true">
        <i />
        <i />
        <i />
        <u />
      </div>
      <header className={tucked ? 'topbar tucked' : 'topbar'}>
        <button
          className="wordmark"
          onClick={() => goto('home')}
          aria-label="SATest, back to overview"
        >
          SATest<i />
        </button>
        <nav className="nav">
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              className="nav-item"
              aria-current={view === key ? 'page' : undefined}
              onClick={() => goto(key)}
            >
              {label}
            </button>
          ))}
          <button className="themer" onClick={toggleTheme} aria-label="Toggle theme">
            {progress.theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'home' && (
          <Home
            attempts={progress.attempts}
            flagged={progress.flagged}
            open={progress.open}
            words={progress.words}
            onGoto={goto}
            onPractise={practiseTopic}
            onResume={resume}
          />
        )}

        {view === 'practice' &&
          (session ? (
            <Practice
              questions={session.questions}
              flagged={progress.flagged}
              onToggleFlag={toggleFlag}
              onRecord={(id, choice) => record(id, choice, 'practice')}
              onAdvance={advanceOpen}
              onExit={finish}
            />
          ) : (
            <Setup mode="practice" initialTopics={presetTopics} onStart={start} />
          ))}

        {view === 'test' &&
          (session ? (
            <TestMode
              questions={session.questions}
              minutes={session.minutes}
              flagged={progress.flagged}
              onToggleFlag={toggleFlag}
              onRecord={(id, choice) => record(id, choice, 'test')}
              onExit={finish}
            />
          ) : (
            <Setup mode="test" onStart={start} />
          ))}

        {view === 'vocabulary' && (
          <Vocabulary attempts={progress.words} onRecord={recordWord} />
        )}

        {view === 'review' && (
          <Review attempts={progress.attempts} flagged={progress.flagged} onToggleFlag={toggleFlag} />
        )}

        {view === 'progress' && <Dashboard attempts={progress.attempts} onReset={reset} />}
      </main>

      <nav className="tabbar">
        {NAV.map(({ key, label, Icon }) => (
          <button key={key} aria-current={view === key ? 'page' : undefined} onClick={() => goto(key)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
