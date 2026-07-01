import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  KickSession, Contraction,
  getKickSessions, addKickSession, clearKickSessions,
  getContractions, saveContractions,
} from '../lib/tools'

function now() {
  return Date.now()
}

/** "3m 05s" / "45s" */
function fmtDur(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`
}
function fmtClock(ts: number): string {
  return format(new Date(ts), 'h:mm a')
}

export default function Tools() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'kicks' | 'contractions'>('kicks')

  return (
    <div className="view view--fab">
      <h1 className="page-title">Tools</h1>
      <div className="chips">
        <button className={'chip' + (tab === 'kicks' ? ' chip--on' : '')} onClick={() => setTab('kicks')}>
          Kick counter
        </button>
        <button className={'chip' + (tab === 'contractions' ? ' chip--on' : '')} onClick={() => setTab('contractions')}>
          Contractions
        </button>
      </div>

      {tab === 'kicks' ? <KickCounter /> : <ContractionTimer />}

      <p className="footer-note muted small">
        A helper, not medical advice — follow your OB or midwife's guidance on counting and when to call.
      </p>

      <button className="fab fab--left fab--back" onClick={() => navigate(-1)} aria-label="Back">‹</button>
    </div>
  )
}

const GOAL = 10

function KickCounter() {
  const [count, setCount] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [, setTick] = useState(0)
  const [sessions, setSessions] = useState<KickSession[]>(getKickSessions())
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  // Tick every second so the elapsed time updates while counting.
  useEffect(() => {
    if (startedAt == null) return
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  function kick() {
    const t = now()
    const start = startedAt ?? t
    if (startedAt == null) setStartedAt(t)
    setDoneMsg(null)
    if (navigator.vibrate) navigator.vibrate(10)
    const next = count + 1
    if (next >= GOAL) {
      addKickSession({ id: crypto.randomUUID(), endedAt: t, kicks: next, durationMs: t - start })
      setSessions(getKickSessions())
      setDoneMsg(`You felt ${GOAL} movements in ${fmtDur(t - start)}.`)
      setCount(0)
      setStartedAt(null)
    } else {
      setCount(next)
    }
  }

  function reset() {
    setCount(0)
    setStartedAt(null)
    setDoneMsg(null)
  }

  function clearHistory() {
    clearKickSessions()
    setSessions([])
  }

  const elapsed = startedAt ? now() - startedAt : 0

  return (
    <div>
      <p className="tool-hint">
        Tap each time you feel a movement. Many providers suggest noting how long it takes to feel {GOAL} — often
        within about 2 hours. If it's much slower than usual, call your provider.
      </p>

      <div className="tool-count">{count}<span className="tool-count__goal"> / {GOAL}</span></div>
      <div className="tool-timer">{startedAt ? fmtDur(elapsed) : 'not started'}</div>

      <button className="tool-bigbtn" onClick={kick}>
        {startedAt ? 'Felt a movement' : 'Start · felt a movement'}
      </button>
      {startedAt != null && (
        <button className="linkbtn linkbtn--dark tool-reset" onClick={reset}>Reset this session</button>
      )}
      {doneMsg && <p className="auth__msg auth__msg--ok">{doneMsg}</p>}

      {sessions.length > 0 && (
        <>
          <div className="page-head" style={{ marginTop: 20 }}>
            <h2 className="section-title">Recent counts</h2>
            <button className="linkbtn linkbtn--dark" onClick={clearHistory}>Clear</button>
          </div>
          <div className="list">
            {sessions.map((s) => (
              <div key={s.id} className="tool-row">
                <span>{format(new Date(s.endedAt), 'EEE, MMM d · h:mm a')}</span>
                <span className="muted">{s.kicks} in {fmtDur(s.durationMs)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ContractionTimer() {
  const [log, setLog] = useState<Contraction[]>(getContractions())
  const [activeStart, setActiveStart] = useState<number | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (activeStart == null) return
    const t = setInterval(() => setTick((n) => n + 1), 250)
    return () => clearInterval(t)
  }, [activeStart])

  function toggle() {
    const t = now()
    if (activeStart == null) {
      setActiveStart(t)
      if (navigator.vibrate) navigator.vibrate(10)
    } else {
      const next = [{ id: crypto.randomUUID(), start: activeStart, end: t }, ...log]
      setLog(next)
      saveContractions(next)
      setActiveStart(null)
    }
  }

  function clearAll() {
    setLog([])
    saveContractions([])
  }

  // Stats over the last hour (log is newest-first).
  const hourAgo = now() - 3600_000
  const recent = log.filter((c) => c.start >= hourAgo)
  const avgDur = recent.length ? recent.reduce((s, c) => s + (c.end - c.start), 0) / recent.length : 0
  const gaps: number[] = []
  for (let i = 0; i < recent.length - 1; i++) gaps.push(recent[i].start - recent[i + 1].start)
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0

  const active = activeStart != null
  const activeElapsed = active ? now() - (activeStart as number) : 0

  return (
    <div>
      <p className="tool-hint">
        Tap to start when a contraction begins, tap again when it ends. A common guide is <strong>“5-1-1”</strong> —
        contractions about 5 minutes apart, lasting about 1 minute, for 1 hour — but your provider's instructions come
        first.
      </p>

      <div className="tool-timer tool-timer--big">{active ? fmtDur(activeElapsed) : '—'}</div>
      <button className={'tool-bigbtn' + (active ? ' tool-bigbtn--stop' : '')} onClick={toggle}>
        {active ? 'Stop (contraction ended)' : 'Start contraction'}
      </button>

      {recent.length > 0 && (
        <p className="tool-summary muted small">
          Last hour: {recent.length} contraction{recent.length === 1 ? '' : 's'} · avg {fmtDur(avgDur)} long
          {avgGap > 0 && <> · about every {fmtDur(avgGap)}</>}
        </p>
      )}

      {log.length > 0 && (
        <>
          <div className="page-head" style={{ marginTop: 16 }}>
            <h2 className="section-title">History</h2>
            <button className="linkbtn linkbtn--dark" onClick={clearAll}>Clear</button>
          </div>
          <div className="list">
            {log.map((c, i) => {
              const nextOlder = log[i + 1]
              const gap = nextOlder ? c.start - nextOlder.start : null
              return (
                <div key={c.id} className="tool-row">
                  <span>{fmtClock(c.start)}</span>
                  <span className="muted">
                    {fmtDur(c.end - c.start)} long{gap != null && <> · {fmtDur(gap)} apart</>}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
