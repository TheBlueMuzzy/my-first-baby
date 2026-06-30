import { useRef, useState } from 'react'
import {
  addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, startOfDay,
} from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useStoreVersion } from '../lib/useStore'
import { buildSchedule, DatedItem } from '../lib/schedule'
import { setTaskState, updateEvent } from '../lib/storage'
import { showToast } from '../lib/toast'
import EventModal from '../components/EventModal'

export default function CalendarView() {
  useStoreVersion()
  const navigate = useNavigate()
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [selected, setSelected] = useState(startOfDay(new Date()))
  const [adding, setAdding] = useState(false)
  const [moving, setMoving] = useState<DatedItem | null>(null)
  const today = startOfDay(new Date())

  // Long-press to "pick up" an item, then tap a day to move it there.
  const pressTimer = useRef<number | null>(null)
  const longPressed = useRef(false)

  function startPress(d: DatedItem) {
    longPressed.current = false
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true
      setMoving(d)
      if (navigator.vibrate) navigator.vibrate(15)
    }, 450)
  }
  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }
  function rowClick(d: DatedItem) {
    if (longPressed.current) {
      longPressed.current = false
      return // the long-press already picked it up; don't open it
    }
    navigate(d.isEvent && d.event ? '/event/' + d.event.id : '/task/' + d.item.id)
  }

  function moveTo(day: Date) {
    if (!moving) return
    const iso = format(day, 'yyyy-MM-dd')
    const label = `Moved to ${format(day, 'MMM d')}`
    if (moving.isEvent && moving.event) {
      const id = moving.event.id
      const prev = moving.event.date
      updateEvent(id, { date: iso })
      showToast(label, () => updateEvent(id, { date: prev }))
    } else {
      const itemId = moving.item.id
      const prev = moving.state.customDate
      setTaskState(itemId, { customDate: iso })
      showToast(label, () => setTaskState(itemId, { customDate: prev }))
    }
    setSelected(startOfDay(day))
    setMoving(null)
  }

  const schedule = buildSchedule()
  const byDay = new Map<string, DatedItem[]>()
  for (const d of schedule) {
    const k = format(d.date, 'yyyy-MM-dd')
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(d)
  }

  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const selectedItems = byDay.get(format(selected, 'yyyy-MM-dd')) || []

  return (
    <div className="view view--fab">
      {moving && (
        <div className="move-banner">
          <span>
            Moving <strong>{moving.item.title}</strong> — tap a day
          </span>
          <button className="move-banner__cancel" onClick={() => setMoving(null)}>
            Cancel
          </button>
        </div>
      )}

      <h1 className="page-title cal-title">{format(month, 'MMMM yyyy')}</h1>

      <div className="cal-grid cal-grid--head">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="cal-dow">{d}</div>
        ))}
      </div>

      <div className={'cal-grid' + (moving ? ' cal-grid--moving' : '')}>
        {days.map((day) => {
          const items = byDay.get(format(day, 'yyyy-MM-dd')) || []
          const muted = !isSameMonth(day, month)
          return (
            <button
              key={day.toISOString()}
              className={
                'cal-cell' +
                (muted ? ' cal-cell--muted' : '') +
                (isSameDay(day, selected) ? ' cal-cell--sel' : '') +
                (isSameDay(day, today) ? ' cal-cell--today' : '')
              }
              onClick={() => (moving ? moveTo(day) : setSelected(startOfDay(day)))}
            >
              <span className="cal-num">{format(day, 'd')}</span>
              <span className="cal-dots">
                {items.slice(0, 3).map((d) => (
                  <span key={d.item.id} className={'dot dot--' + d.item.category} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="cal-day">
        <div className="page-head">
          <h2 className="section-title">{format(selected, 'EEEE, MMMM d')}</h2>
          <button className="addbtn" onClick={() => setAdding(true)}>+ Add</button>
        </div>
        {selectedItems.length === 0 && <p className="muted">Nothing scheduled.</p>}
        {selectedItems.length > 0 && !moving && (
          <p className="muted small cal-hint">Press and hold an item to move it to another day.</p>
        )}
        <div className="list">
          {selectedItems.map((d) => (
            <div
              key={d.item.id}
              className={'row' + (moving && moving.item.id === d.item.id ? ' row--lifted' : '')}
              onClick={() => rowClick(d)}
              onPointerDown={() => startPress(d)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerMove={cancelPress}
            >
              <span className={'dot dot--' + d.item.category} />
              <div className="row__body">
                <div className={'row__title' + (d.state.status === 'done' ? ' strike' : '')}>{d.item.title}</div>
              </div>
              {d.isEvent && <span className="pill pill--mine">yours</span>}
              <span className="row__chev">›</span>
            </div>
          ))}
        </div>
      </div>

      {adding && <EventModal initialDate={format(selected, 'yyyy-MM-dd')} onClose={() => setAdding(false)} />}

      <button className="fab fab--left" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
        ‹
      </button>
      <button className="fab fab--right" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
        ›
      </button>
    </div>
  )
}
