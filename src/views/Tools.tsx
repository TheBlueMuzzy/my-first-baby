import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  KickSession, Contraction, BabyName, WeightEntry,
  getKickSessions, addKickSession, clearKickSessions,
  getContractions, saveContractions,
  getChecks, toggleCheck, getNote, setNote,
  getNames, saveNames,
  getWeights, saveWeights,
  PlanItem, getPlanItems, savePlanItems,
} from '../lib/tools'

function now() {
  return Date.now()
}
function fmtDur(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`
}
function fmtClock(ts: number): string {
  return format(new Date(ts), 'h:mm a')
}

type Tab = 'kicks' | 'contractions' | 'names' | 'bag' | 'birthplan' | 'weight'
const TABS: { id: Tab; label: string }[] = [
  { id: 'kicks', label: 'Kicks' },
  { id: 'contractions', label: 'Contractions' },
  { id: 'names', label: 'Names' },
  { id: 'bag', label: 'Hospital bag' },
  { id: 'birthplan', label: 'Birth plan' },
  { id: 'weight', label: 'Weight' },
]

export default function Tools() {
  const [tab, setTab] = useState<Tab>('kicks')

  return (
    <div className="view">
      <h1 className="page-title">Tools</h1>
      <div className="chips">
        {TABS.map((t) => (
          <button key={t.id} className={'chip' + (tab === t.id ? ' chip--on' : '')} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kicks' && <KickCounter />}
      {tab === 'contractions' && <ContractionTimer />}
      {tab === 'names' && <NameList />}
      {tab === 'bag' && <HospitalBag />}
      {tab === 'birthplan' && <BirthPlan />}
      {tab === 'weight' && <WeightTracker />}

      <p className="footer-note muted small">
        Helpers, not medical advice — follow your OB or midwife's guidance.
      </p>
    </div>
  )
}

// ============================ Kick counter ============================
const GOAL = 10

function KickCounter() {
  const [count, setCount] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [, setTick] = useState(0)
  const [sessions, setSessions] = useState<KickSession[]>(getKickSessions())
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

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

  const elapsed = startedAt ? now() - startedAt : 0

  return (
    <div>
      <p className="tool-hint">
        Tap each time you feel a movement. Many providers suggest noting how long it takes to feel {GOAL} — often
        within about 2 hours. If it's much slower than usual, call your provider.
      </p>
      <div className="tool-count">{count}<span className="tool-count__goal"> / {GOAL}</span></div>
      <div className="tool-timer">{startedAt ? fmtDur(elapsed) : 'not started'}</div>
      <button className="tool-bigbtn" onClick={kick}>{startedAt ? 'Felt a movement' : 'Start · felt a movement'}</button>
      {startedAt != null && (
        <button className="linkbtn linkbtn--dark tool-reset" onClick={() => { setCount(0); setStartedAt(null); setDoneMsg(null) }}>
          Reset this session
        </button>
      )}
      {doneMsg && <p className="auth__msg auth__msg--ok">{doneMsg}</p>}
      {sessions.length > 0 && (
        <>
          <div className="page-head" style={{ marginTop: 20 }}>
            <h2 className="section-title">Recent counts</h2>
            <button className="linkbtn linkbtn--dark" onClick={() => { clearKickSessions(); setSessions([]) }}>Clear</button>
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

// ============================ Contraction timer ============================
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
        about 5 minutes apart, lasting about 1 minute, for 1 hour — but your provider's instructions come first.
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
            <button className="linkbtn linkbtn--dark" onClick={() => { setLog([]); saveContractions([]) }}>Clear</button>
          </div>
          <div className="list">
            {log.map((c, i) => {
              const older = log[i + 1]
              const gap = older ? c.start - older.start : null
              return (
                <div key={c.id} className="tool-row">
                  <span>{fmtClock(c.start)}</span>
                  <span className="muted">{fmtDur(c.end - c.start)} long{gap != null && <> · {fmtDur(gap)} apart</>}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ============================ Baby names ============================
function NameList() {
  const [sex, setSex] = useState<'boy' | 'girl'>('girl')
  const [names, setNames] = useState<BabyName[]>(getNames())
  const [input, setInput] = useState('')

  function add() {
    const n = input.trim()
    if (!n) return
    const next = [...names, { id: crypto.randomUUID(), name: n, sex, fav: false }]
    setNames(next)
    saveNames(next)
    setInput('')
  }
  function update(next: BabyName[]) {
    setNames(next)
    saveNames(next)
  }

  const list = names
    .filter((n) => n.sex === sex)
    .sort((a, b) => (a.fav === b.fav ? a.name.localeCompare(b.name) : a.fav ? -1 : 1))

  return (
    <div>
      <p className="tool-hint">Jot down name ideas and tap the heart for favorites. (On this device for now.)</p>
      <div className="chips">
        <button className={'chip' + (sex === 'girl' ? ' chip--on' : '')} onClick={() => setSex('girl')}>Girl</button>
        <button className={'chip' + (sex === 'boy' ? ' chip--on' : '')} onClick={() => setSex('boy')}>Boy</button>
      </div>
      <form
        className="name-add"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Add a ${sex} name…`} />
        <button className="btn btn--on" type="submit" disabled={!input.trim()}>Add</button>
      </form>
      {list.length === 0 && <p className="muted small">No {sex} names yet.</p>}
      <div className="list">
        {list.map((n) => (
          <div key={n.id} className="tool-row">
            <button
              className={'namefav' + (n.fav ? ' namefav--on' : '')}
              onClick={() => update(names.map((x) => (x.id === n.id ? { ...x, fav: !x.fav } : x)))}
              aria-label={n.fav ? 'Unfavorite' : 'Favorite'}
            >
              {n.fav ? '♥' : '♡'}
            </button>
            <span className="name-text">{n.name}</span>
            <button className="linkbtn linkbtn--dark" onClick={() => update(names.filter((x) => x.id !== n.id))}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================ Hospital bag ============================
const BAG: { group: string; items: string[] }[] = [
  { group: 'Mom', items: [
    'Going-home outfit (loose, comfy)', 'Robe / nightgown / labor gown', 'Nursing bras + pads',
    'Non-slip socks & slippers', 'Toiletries + glasses/contacts', 'Phone + extra-long charger',
    'Own pillow (non-white case)', 'Snacks & drinks',
  ] },
  { group: 'Baby', items: [
    'Car seat installed & inspected', 'Going-home outfit + backup size', '2–3 onesies, socks, hat, mittens', 'Swaddle blanket',
  ] },
  { group: 'Partner', items: [
    'Clothes for 1–2+ days (layers)', 'Toiletries', 'Snacks + cash/card', 'Phone, charger, headphones',
    'Pillow & blanket', 'Something for downtime',
  ] },
  { group: 'Documents', items: [
    'Photo IDs (both of you)', 'Insurance card', 'Pre-registration confirmation', 'Birth plan (printed copies)',
    "Pediatrician's name + contact", 'OB notes / records',
  ] },
]

function HospitalBag() {
  const [checks, setChecks] = useState(getChecks('bag'))
  const total = BAG.reduce((n, g) => n + g.items.length, 0)
  const done = Object.values(checks).filter(Boolean).length

  return (
    <div>
      <p className="tool-hint">Pack by ~week 35–36. The hospital usually provides diapers, wipes, pads &amp; peri bottle — confirm with yours. {done}/{total} packed.</p>
      {BAG.map((g) => (
        <section key={g.group} style={{ marginBottom: 14 }}>
          <h2 className="section-title">{g.group}</h2>
          {g.items.map((item) => {
            const id = g.group + ':' + item
            return (
              <label key={id} className="checkrow checkrow--item">
                <input type="checkbox" checked={!!checks[id]} onChange={() => setChecks(toggleCheck('bag', id))} />
                <span className={checks[id] ? 'strike muted' : ''}>{item}</span>
              </label>
            )
          })}
        </section>
      ))}
    </div>
  )
}

// ============================ Birth plan ============================
const PLAN: { group: string; items: string[] }[] = [
  { group: 'Atmosphere', items: ['Dim lights', 'My own music', 'Freedom to move / walk', 'Minimal interruptions'] },
  { group: 'Pain & labor', items: ['Prefer unmedicated', 'Open to an epidural', 'Water / shower for comfort', 'Intermittent monitoring if possible'] },
  { group: 'Delivery', items: ['Partner stays with me throughout', 'Mirror to watch', 'Partner cuts the cord'] },
  { group: 'Right after birth', items: ['Immediate skin-to-skin', 'Delayed cord clamping', 'Delay the first bath', 'Partner announces the sex'] },
  { group: 'Feeding', items: ['Plan to breastfeed', 'Plan to bottle-feed', 'Open to both'] },
  { group: 'If a C-section is needed', items: ['Partner present in the OR', 'Skin-to-skin in the OR if possible', 'Explain steps as they happen'] },
]

function BirthPlan() {
  const [checks, setChecks] = useState(getChecks('birthplan'))
  const [notes, setNotes] = useState(getNote('birthplan'))
  const [custom, setCustom] = useState<PlanItem[]>(getPlanItems())
  const [addingGroup, setAddingGroup] = useState<string | null>(null)
  const [addText, setAddText] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function addItem(group: string) {
    const text = addText.trim()
    if (!text) return
    const next = [...custom, { id: crypto.randomUUID(), group, text }]
    setCustom(next)
    savePlanItems(next)
    setAddText('')
    setAddingGroup(null)
  }
  function removeItem(id: string) {
    setCustom((cur) => {
      const next = cur.filter((c) => c.id !== id)
      savePlanItems(next)
      return next
    })
    if (getChecks('birthplan')[id]) setChecks(toggleCheck('birthplan', id))
    setConfirmId(null)
  }

  return (
    <div>
      <p className="tool-hint">Check the preferences that matter to you, and add your own to any section. A starting point to talk through with your provider — birth rarely goes exactly to plan.</p>
      {PLAN.map((g) => {
        const mine = custom.filter((c) => c.group === g.group)
        return (
          <section key={g.group} style={{ marginBottom: 16 }}>
            <h2 className="section-title">{g.group}</h2>

            {g.items.map((item) => {
              const id = g.group + ':' + item
              return (
                <label key={id} className="checkrow checkrow--item">
                  <input type="checkbox" checked={!!checks[id]} onChange={() => setChecks(toggleCheck('birthplan', id))} />
                  <span>{item}</span>
                </label>
              )
            })}

            {mine.map((c) => (
              <div key={c.id} className="checkrow checkrow--item checkrow--custom">
                <input
                  id={'cb-' + c.id}
                  type="checkbox"
                  checked={!!checks[c.id]}
                  onChange={() => setChecks(toggleCheck('birthplan', c.id))}
                />
                <label htmlFor={'cb-' + c.id} className="plan-custom__text">{c.text}</label>
                {confirmId === c.id ? (
                  <span className="row-confirm">
                    <button className="row-confirm__yes" onClick={() => removeItem(c.id)}>Remove</button>
                    <button className="row-confirm__no" onClick={() => setConfirmId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button className="row-x" onClick={() => setConfirmId(c.id)} aria-label="Remove item">✕</button>
                )}
              </div>
            ))}

            {addingGroup === g.group ? (
              <form className="name-add" onSubmit={(e) => { e.preventDefault(); addItem(g.group) }}>
                <input value={addText} onChange={(e) => setAddText(e.target.value)} placeholder="Add your own…" autoFocus />
                <button className="btn btn--on" type="submit" disabled={!addText.trim()}>Add</button>
              </form>
            ) : (
              <button className="plan-add" onClick={() => { setAddingGroup(g.group); setAddText('') }}>+ Add your own</button>
            )}
          </section>
        )
      })}

      <div className="field">
        <label>Anything else</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNote('birthplan', e.target.value) }}
          placeholder="Other wishes, allergies, who to call…"
        />
      </div>
    </div>
  )
}

// ============================ Weight tracker ============================
function WeightTracker() {
  const [entries, setEntries] = useState<WeightEntry[]>(getWeights())
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [lbs, setLbs] = useState('')

  function add(e: React.FormEvent) {
    e.preventDefault()
    const v = parseFloat(lbs)
    if (!date || isNaN(v)) return
    const next = [...entries.filter((x) => x.date !== date), { id: crypto.randomUUID(), date, lbs: v }]
    next.sort((a, b) => a.date.localeCompare(b.date))
    setEntries(next)
    saveWeights(next)
    setLbs('')
  }
  function remove(id: string) {
    const next = entries.filter((x) => x.id !== id)
    setEntries(next)
    saveWeights(next)
  }

  const asc = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const first = asc[0]
  const last = asc[asc.length - 1]
  const gained = first && last ? last.lbs - first.lbs : 0

  return (
    <div>
      <p className="tool-hint">Log your weight over the weeks. (On this device for now.)</p>
      <form className="weight-add" onSubmit={add}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="number" inputMode="decimal" step="0.1" value={lbs} onChange={(e) => setLbs(e.target.value)} placeholder="lbs" />
        <button className="btn btn--on" type="submit" disabled={!lbs}>Add</button>
      </form>

      {asc.length >= 2 && (
        <>
          <Sparkline pts={asc.map((e) => e.lbs)} />
          <p className="tool-summary muted small">
            {gained >= 0 ? '+' : ''}{gained.toFixed(1)} lbs since {format(parseISO(first.date), 'MMM d')} · now {last.lbs} lbs
          </p>
        </>
      )}

      {asc.length === 0 && <p className="muted small">No entries yet.</p>}
      <div className="list">
        {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
          <div key={e.id} className="tool-row">
            <span>{format(parseISO(e.date), 'EEE, MMM d')}</span>
            <span className="muted">{e.lbs} lbs</span>
            <button className="linkbtn linkbtn--dark" onClick={() => remove(e.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sparkline({ pts }: { pts: number[] }) {
  const w = 300, h = 80, pad = 8
  const min = Math.min(...pts), max = Math.max(...pts)
  const range = max - min || 1
  const step = (w - pad * 2) / (pts.length - 1)
  const coords = pts
    .map((v, i) => `${(pad + i * step).toFixed(1)},${(pad + (h - pad * 2) * (1 - (v - min) / range)).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={coords} fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
