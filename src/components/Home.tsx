import { useEffect, useMemo, useRef, useState } from 'react'
import { DOMAINS, QUESTIONS, SECTION_GROUPS, TOPICS, TOTALS } from '../lib/bank'
import {
  computeStats,
  latestByQuestion,
  outstandingMistakes,
  pct,
  recentSessions,
  relativeDay,
} from '../lib/store'
import type { Attempt, OpenSession } from '../lib/types'
import { WORDS, buildRecords, dueWords } from '../lib/vocab'
import type { WordAttempt } from '../lib/vocab'
import { useCountUp, useScrollReveal } from '../lib/motion'
import {
  IconArrow,
  IconBookOpen,
  IconCheck,
  IconFlame,
  IconFlag,
  IconLayers,
  IconPractice,
  IconReview,
  IconTarget,
  IconTest,
  IconTrendingUp,
  IconZap,
} from './Icons'

type View = 'home' | 'practice' | 'vocabulary' | 'test' | 'review' | 'progress'

interface Props {
  attempts: Attempt[]
  flagged: string[]
  open: OpenSession | null
  words: WordAttempt[]
  onGoto: (v: View) => void
  onPractise: (topic: string) => void
  onResume: () => void
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formattedToday(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Home({
  attempts,
  flagged,
  open,
  words,
  onGoto,
  onPractise,
  onResume,
}: Props) {
  const [domainFilter, setDomainFilter] = useState<'all' | 'Reading and Writing' | 'Math'>('all')

  const stats = useMemo(() => computeStats(attempts), [attempts])
  const seen = useMemo(() => latestByQuestion(attempts), [attempts])
  const mistakes = useMemo(() => outstandingMistakes(attempts), [attempts])
  const sessions = useMemo(() => recentSessions(attempts), [attempts])
  const unseen = Math.max(0, TOTALS.all - stats.distinctQuestions)
  const wordRecords = useMemo(() => buildRecords(words), [words])
  const wordsDue = useMemo(() => dueWords(wordRecords).length, [wordRecords])

  useScrollReveal('.rise-scroll, .bento-grid, .domain-cards-grid')

  /* ── Parallax background ─────────────────────────────────────── */
  const parallaxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = parallaxRef.current
    if (!el) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const items = Array.from(el.querySelectorAll<HTMLElement>('.px-item'), (item) => ({
      item,
      speed: Number(item.dataset.speed),
    }))
    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      items.forEach(({ item, speed }) => {
        const offset = mq.matches ? 0 : Math.max(-180, Math.min(180, y * speed))
        item.style.transform = `translate3d(0, ${offset}px, 0)`
      })
    }
    const onScroll = () => {
      if (!frame && !mq.matches && !document.hidden) frame = requestAnimationFrame(update)
    }
    const syncMotion = () => {
      cancelAnimationFrame(frame)
      frame = 0
      if (!document.hidden) update()
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    mq.addEventListener('change', syncMotion)
    document.addEventListener('visibilitychange', syncMotion)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      mq.removeEventListener('change', syncMotion)
      document.removeEventListener('visibilitychange', syncMotion)
    }
  }, [])

  const wordsMastered = useMemo(
    () => Array.from(wordRecords.values()).filter((w) => w.mastery === 'Mastered').length,
    [wordRecords]
  )

  const solved = useCountUp(stats.correct + stats.incorrect)
  const accuracyNum = stats.accuracy !== null ? Math.round(stats.accuracy * 100) : null

  const qTotal = useCountUp(TOTALS.all)
  const qExplained = useCountUp(TOTALS.explained)
  const domainNum = useCountUp(DOMAINS.length)
  const accuracyCount = useCountUp(accuracyNum ?? 0)
  const vocabCount = useCountUp(WORDS.length)

  const weak = useMemo(
    () =>
      stats.byTopic
        .filter((t) => t.attempted >= 4)
        .slice(-4)
        .reverse(),
    [stats.byTopic]
  )

  const weakest = weak[0]?.name

  const domainCards = useMemo(() => {
    return DOMAINS.map((d) => {
      const b = stats.byDomain.find((item) => item.name === d.domain)
      const domainTotal = d.topics.reduce((acc, t) => acc + t.total, 0)
      const domainAttempted = b?.attempted ?? 0
      const domainCorrect = b?.correct ?? 0
      const domainAccuracy = b?.accuracy ?? null
      const firstTopic = d.topics[0]?.topic ?? ''

      return {
        domain: d.domain,
        section: d.section,
        totalQuestions: domainTotal,
        attempted: domainAttempted,
        correct: domainCorrect,
        accuracy: domainAccuracy,
        topicsCount: d.topics.length,
        firstTopic,
      }
    })
  }, [stats.byDomain])

  const filteredDomains = useMemo(() => {
    if (domainFilter === 'all') return domainCards
    return domainCards.filter((d) => d.section === domainFilter)
  }, [domainCards, domainFilter])

  const radius = 38
  const circumference = 2 * Math.PI * radius
  const coverageRatio = Math.min(1, stats.distinctQuestions / TOTALS.all)
  const coverageOffset = circumference - coverageRatio * circumference
  const accuracyRatio = stats.accuracy ?? 0
  const accuracyOffset = circumference - accuracyRatio * circumference

  return (
    <div className="wrap instrument-page">

      {/* ── Parallax Background Layer ── */}
      <div className="px-bg" ref={parallaxRef} aria-hidden="true">
        <i className="px-item px-circle" data-speed="-0.06" style={{ left: '8%', top: '4%' }} />
        <i className="px-item px-line-h" data-speed="0.04" style={{ left: '76%', top: '7%' }} />
        <i className="px-item px-dot" data-speed="0.12" style={{ left: '4%', top: '16%' }} />
        <i className="px-item px-cross" data-speed="-0.08" style={{ left: '93%', top: '3%' }} />
        <i className="px-item px-ring" data-speed="0.18" style={{ left: '84%', top: '20%' }} />
        <i className="px-item px-line-v" data-speed="-0.05" style={{ left: '2%', top: '28%' }} />
        <i className="px-item px-dot-lg" data-speed="0.09" style={{ left: '95%', top: '36%' }} />
        <i className="px-item px-square" data-speed="-0.14" style={{ left: '8%', top: '42%' }} />
        <i className="px-item px-line-h" data-speed="0.07" style={{ left: '78%', top: '48%' }} />
        <i className="px-item px-circle" data-speed="-0.11" style={{ left: '3%', top: '57%' }} />
        <i className="px-item px-cross" data-speed="0.15" style={{ left: '92%', top: '62%' }} />
        <i className="px-item px-dot" data-speed="-0.03" style={{ left: '6%', top: '71%' }} />
        <i className="px-item px-ring" data-speed="0.06" style={{ left: '85%', top: '79%' }} />
        <i className="px-item px-line-v" data-speed="-0.10" style={{ left: '4%', top: '88%' }} />
        <i className="px-item px-square" data-speed="0.13" style={{ left: '94%', top: '93%' }} />
      </div>

      {/* ── 1. Hero Statement ── */}
      <section className="hero-command rise-eager">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">
              {greeting()} · {formattedToday()}
            </span>
            {stats.streak > 0 && (
              <span className="eyebrow-streak">
                <IconFlame size={13} />
                <b>{stats.streak}</b> streak
              </span>
            )}
          </div>

          <div className="hero-statement-row">
            <h1 className="hero-title">
              Your SAT practice{' '}
              <span className="hero-title-accent">command center.</span>
            </h1>

            {/* Accuracy Dial — inline instrument badge */}
            <div className="hero-gauge-card">
              <div className="dial-visual">
                <svg className="dial-svg" viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="dial-track" cx="50" cy="50" r={radius} strokeWidth="7" fill="none" />
                  <circle
                    className="dial-coverage"
                    cx="50" cy="50" r={radius} strokeWidth="7" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={coverageOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  {stats.attempted > 0 && (
                    <circle
                      className="dial-accuracy"
                      cx="50" cy="50" r={radius - 8} strokeWidth="5" fill="none"
                      strokeDasharray={2 * Math.PI * (radius - 8)}
                      strokeDashoffset={
                        2 * Math.PI * (radius - 8) -
                        accuracyRatio * (2 * Math.PI * (radius - 8))
                      }
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  )}
                </svg>
                <div className="dial-center">
                  <span className="dial-readout">
                    {accuracyNum !== null ? `${accuracyNum}%` : `${Math.round(coverageRatio * 100)}%`}
                  </span>
                  <span className="dial-label">
                    {accuracyNum !== null ? 'accuracy' : 'bank seen'}
                  </span>
                </div>
              </div>
              <div className="dial-stats">
                <div className="dial-stat">
                  <span className="dial-stat-val">{stats.distinctQuestions.toLocaleString()}</span>
                  <span className="dial-stat-lbl">of {TOTALS.all.toLocaleString()} seen</span>
                </div>
                <div className="dial-stat">
                  <span className="dial-stat-val">{solved.toLocaleString()}</span>
                  <span className="dial-stat-lbl">solved</span>
                </div>
              </div>
            </div>
          </div>

          <p className="hero-desc">
            {TOTALS.all.toLocaleString()} official College Board questions ·{' '}
            <span className="text-highlight">{TOTALS.explained.toLocaleString()}</span> with
            step-by-step reasoning.
          </p>

          <div className="hero-actions">
            {open ? (
              <button className="btn btn-primary btn-hero" onClick={onResume}>
                <IconZap size={16} />
                <span>Continue {open.label}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                className="btn btn-primary btn-hero"
                onClick={() => (weakest ? onPractise(weakest) : onGoto('practice'))}
              >
                <IconPractice size={16} />
                <span>{weakest ? `Practice ${weakest}` : 'Start Practice'}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            )}
            <button className="btn btn-hero-secondary" onClick={() => onGoto('test')}>
              <IconTest size={15} />
              <span>Timed Test</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 1b. Metric Strip ── */}
      <section className="stat-strip rise-scroll" aria-label="Platform statistics">
        <div className="stat-strip-grid">
          <div className="stat-cell">
            <span className="stat-val">{qTotal.toLocaleString()}</span>
            <span className="stat-lbl">Questions</span>
          </div>
          <div className="stat-cell">
            <span className="stat-val">{qExplained.toLocaleString()}</span>
            <span className="stat-lbl">Explained</span>
          </div>
          <div className="stat-cell">
            <span className="stat-val">{domainNum}</span>
            <span className="stat-lbl">Domains</span>
          </div>
          <div className="stat-cell">
            <span className="stat-val">
              {stats.attempted > 0 ? `${accuracyCount}%` : vocabCount.toLocaleString()}
            </span>
            <span className="stat-lbl">
              {stats.attempted > 0 ? 'Accuracy' : 'Words'}
            </span>
          </div>
        </div>
      </section>

      {/* ── 2. Action Matrix ── */}
      <section className="section-head-instrument">
        <div className="section-label-row">
          <span className="mono-label">Quick Actions</span>
          <h2 className="section-title">Today&apos;s Focus</h2>
        </div>
        <span className="meta">Click any card to launch</span>
      </section>

      <div className="bento-grid">
        {/* Practice Sprint */}
        <button className="bento-card bento-card-practice" onClick={() => onGoto('practice')}>
          <span className="bento-icon bento-icon-practice"><IconZap size={18} /></span>
          <span className="bento-chip">Fresh</span>
          <div className="bento-body">
            <span className="bento-figure">{unseen.toLocaleString()}</span>
            <span className="bento-title">Unseen Questions</span>
            <p className="bento-sub">Untouched items from your active pool</p>
          </div>
          <div className="bento-cta">
            <span>Start practice</span>
            <span className="arrow" aria-hidden="true">→</span>
          </div>
        </button>

        {/* Vocabulary */}
        <button className="bento-card bento-card-vocab" onClick={() => onGoto('vocabulary')}>
          <span className="bento-icon bento-icon-vocab"><IconBookOpen size={18} /></span>
          <span className="bento-chip">
            {wordsDue > 0 ? `${wordsDue} Due` : 'Up to date'}
          </span>
          <div className="bento-body">
            <span className="bento-figure">
              {Math.min(wordsDue, WORDS.length).toLocaleString()}
            </span>
            <span className="bento-title">Vocabulary Words</span>
            <p className="bento-sub">
              {wordsMastered > 0
                ? `${wordsMastered} mastered with spaced repetition`
                : 'High-frequency SAT vocabulary drill'}
            </p>
          </div>
          <div className="bento-cta">
            <span>Review cards</span>
            <span className="arrow" aria-hidden="true">→</span>
          </div>
        </button>

        {/* Mistakes */}
        <button
          className="bento-card bento-card-mistakes"
          onClick={() => onGoto('review')}
          disabled={mistakes.length === 0}
        >
          <span className="bento-icon bento-icon-mistakes"><IconTarget size={18} /></span>
          <span className={`bento-chip ${mistakes.length > 0 ? 'bento-chip-warn' : 'bento-chip-good'}`}>
            {mistakes.length > 0 ? 'Needs action' : 'All clear'}
          </span>
          <div className="bento-body">
            <span className="bento-figure">{mistakes.length}</span>
            <span className="bento-title">Mistake Vault</span>
            <p className="bento-sub">
              {mistakes.length > 0
                ? 'Past incorrect items awaiting redemption'
                : 'Zero outstanding errors. Great job!'}
            </p>
          </div>
          <div className="bento-cta">
            <span>{mistakes.length > 0 ? 'Revisit mistakes' : 'No errors'}</span>
            <span className="arrow" aria-hidden="true">→</span>
          </div>
        </button>

        {/* Flagged */}
        <button
          className="bento-card bento-card-flagged"
          onClick={() => onGoto('review')}
          disabled={flagged.length === 0}
        >
          <span className="bento-icon bento-icon-flagged"><IconFlag size={18} filled={flagged.length > 0} /></span>
          <span className="bento-chip">Bookmarked</span>
          <div className="bento-body">
            <span className="bento-figure">{flagged.length}</span>
            <span className="bento-title">Flagged Items</span>
            <p className="bento-sub">
              {flagged.length > 0
                ? 'Questions bookmarked for deeper study'
                : 'Flag questions during practice to review later'}
            </p>
          </div>
          <div className="bento-cta">
            <span>{flagged.length > 0 ? 'Open bookmarked' : 'None saved'}</span>
            <span className="arrow" aria-hidden="true">→</span>
          </div>
        </button>
      </div>

      {/* ── 3. Resume Strip ── */}
      {open && (
        <section className="resume-strip rise-scroll">
          <div className="resume-strip-info">
            <div className="resume-strip-tag">
              <span className="pulse-dot" />
              <span>In-Progress Session</span>
            </div>
            <div className="resume-strip-title">{open.label}</div>
            <div className="resume-strip-meta">
              Question <b>{Math.min(open.index + 1, open.ids.length)}</b> of {open.ids.length} ·{' '}
              {Math.round(((open.index + 1) / open.ids.length) * 100)}% complete
            </div>
            <div className="rail resume-bar">
              <i style={{ '--pct': ((open.index + 1) / open.ids.length) } as React.CSSProperties} />
            </div>
          </div>
          <button className="btn btn-primary btn-resume" onClick={onResume}>
            <span>Resume session</span>
            <span className="arrow" aria-hidden="true">→</span>
          </button>
        </section>
      )}

      {/* ── 4. Domain Matrix ── */}
      <section className="domain-matrix-section rise-scroll">
        <div className="section-head-instrument">
          <div className="section-label-row">
            <span className="mono-label">College Board Mastery</span>
            <h2 className="section-title">8 SAT Domains</h2>
          </div>
          <div className="domain-filter-pills">
            <button
              className={`pill-btn ${domainFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDomainFilter('all')}
            >
              All (8)
            </button>
            <button
              className={`pill-btn ${domainFilter === 'Reading and Writing' ? 'active' : ''}`}
              onClick={() => setDomainFilter('Reading and Writing')}
            >
              Reading &amp; Writing (4)
            </button>
            <button
              className={`pill-btn ${domainFilter === 'Math' ? 'active' : ''}`}
              onClick={() => setDomainFilter('Math')}
            >
              Math (4)
            </button>
          </div>
        </div>

        <div className="domain-cards-grid">
          {filteredDomains.map((d) => {
            const hasAttempts = d.attempted > 0
            const accPct = d.accuracy !== null ? Math.round(d.accuracy * 100) : null

            return (
              <div
                key={d.domain}
                className="domain-card"
                onClick={() => onPractise(d.firstTopic)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onPractise(d.firstTopic)}
              >
                <div className="domain-card-header">
                  <span className="domain-section-tag">
                    {d.section === 'Reading and Writing' ? 'R&W' : 'Math'}
                  </span>
                  <span className="domain-items-count">{d.totalQuestions} questions</span>
                </div>

                <h3 className="domain-name">{d.domain}</h3>

                <div className="domain-stats-row">
                  <span className="domain-accuracy">
                    {accPct !== null ? `${accPct}% accuracy` : 'Not tested yet'}
                  </span>
                  <span className="domain-solved-count">
                    {d.attempted > 0 ? `${d.correct}/${d.attempted} correct` : `${d.topicsCount} skills`}
                  </span>
                </div>

                <div className="rail domain-bar">
                  <i
                    style={
                      {
                        '--pct': hasAttempts ? (d.accuracy ?? 0) : 0,
                        backgroundColor:
                          (d.accuracy ?? 0) >= 0.8
                            ? 'var(--accent)'
                            : (d.accuracy ?? 0) >= 0.6
                              ? 'var(--gold)'
                              : 'var(--rose)',
                      } as React.CSSProperties
                    }
                  />
                </div>

                <div className="domain-hover-cta">
                  <span>Drill this domain</span>
                  <span className="arrow" aria-hidden="true">→</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. Coaching Split ── */}
      <section className="coaching-split rise-scroll">
        {/* Weak Areas */}
        <div className="panel">
          <div className="panel-head">
            <span className="bento-icon bento-icon-mistakes"><IconTrendingUp size={16} /></span>
            <div>
              <span className="mono-label">Targeted Drill</span>
              <h3 className="panel-title">Areas Needing Attention</h3>
            </div>
          </div>

          {weak.length === 0 ? (
            <div className="panel-empty">
              <p className="support">
                Answer 4 or more questions across various skills, and your highest-impact score
                boost opportunities will automatically appear here.
              </p>
              <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={() => onGoto('practice')}>
                Take diagnostic practice
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <>
              <div className="weak-list">
                {weak.map((t) => (
                  <button key={t.name} className="weak-interactive-row" onClick={() => onPractise(t.name)}>
                    <div className="weak-info">
                      <span className="weak-title">{t.name}</span>
                      <span className="weak-score">{pct(t.accuracy)}</span>
                    </div>
                    <div className="rail weak-bar">
                      <i style={{ '--pct': t.accuracy ?? 0 } as React.CSSProperties} />
                    </div>
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 20 }}
                onClick={() => onPractise(weak[0].name)}
              >
                Drill lowest: {weak[0].name}
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="panel">
          <div className="panel-head">
            <span className="bento-icon bento-icon-practice"><IconLayers size={16} /></span>
            <div>
              <span className="mono-label">History</span>
              <h3 className="panel-title">Recent Activity</h3>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="panel-empty">
              <p className="support">
                No completed sessions yet. Each practice run and timed test you finish records your
                score and accuracy timeline here.
              </p>
            </div>
          ) : (
            <div className="recent-activity-list">
              {sessions.slice(0, 5).map((s) => (
                <button key={s.at} className="activity-interactive-row" onClick={() => onGoto('review')}>
                  <div className="activity-main">
                    <span className="activity-badge-mode">
                      {s.mode === 'test' ? 'Timed Test' : 'Practice'}
                    </span>
                    <span className="activity-skill-list">
                      {s.topics.slice(0, 2).join(', ')}
                      {s.topics.length > 2 ? ` +${s.topics.length - 2}` : ''}
                    </span>
                  </div>
                  <div className="activity-metrics">
                    <span className="activity-score-pill">
                      {s.graded > 0 ? `${s.correct}/${s.graded} (${pct(s.correct / s.graded)})` : `${s.total} items`}
                    </span>
                    <span className="activity-timestamp">{relativeDay(s.at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Ledger Footer ── */}
      <footer className="bank-ledger-footer rise-scroll">
        <div className="bank-ledger-content">
          <div>
            <span className="mono-label">Authentic Question Bank</span>
            <div className="bank-ledger-heading">
              100% Extracted from Official College Board Exams
            </div>
            <p className="support" style={{ maxWidth: '60ch', marginTop: 6 }}>
              {QUESTIONS.filter((q) => q.section === 'Reading and Writing').length.toLocaleString()} Reading &amp;
              Writing questions and {QUESTIONS.filter((q) => q.section === 'Math').length.toLocaleString()} Math
              questions. All verified answers correspond directly to official answer keys.
            </p>
          </div>
          <button className="btn btn-quiet" onClick={() => onGoto('progress')}>
            Detailed stats breakdown
            <span className="arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
