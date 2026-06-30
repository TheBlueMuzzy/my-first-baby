import { useRef, useState } from 'react'
import {
  addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, startOfDay,
} from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useStoreVersion } from '../lib/useStore'
import { buildSchedule, DatedItem } from '../lib/schedule'
import { getDueDate } from '../lib/pregnancy'
import { setTaskState, updateEvent } from '../lib/storage'
import { showToast } from '../lib/toast'
import EventModal from '../components/EventModal'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function key(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export default function CalendarView() {
  useStoreVersion()
  const navigate = useNavigate()
  const today = startOfDay(new Date())
  const [selected, setSelected] = useState<Date | null>(today)
  const [adding, setAdding] = useState(false)
  const [moving, setMoving] = useState<DatedItem | null>(null)

  // Long-press to "pick up" an item, then tap a day to drop it there.
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
  function openItem(d: DatedItem) {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    navigate(d.isEvent && d.event ? '/event/' + d.event.id : '/task/' + d.item.id)
  }

  function moveTo(day: Date) {
    if (!moving) return
    const iso = key(day)
    const label = `Moved to ${format(day, 'MMM d')}`
    if (moving.isEvent && moving.event) {
      const eid = moving.event.id
      const prev = moving.event.date
      updateEvent(eid, { date: iso })
      showToast(label, () => updateEvent(eid, { date: prev }))
    } else {
      const itemId = moving.item.id
      const prev = moving.state.customDate
      setTaskState(itemId, { customDate: iso })
      showToast(label, () => setTaskState(itemId, { customDate: prev }))
    }
    setSelected(startOfDay(day))
    setMoving(null)
  }

  function onDayClick(day: Date) {
    if (moving) {
      moveTo(day)
      return
    }
    setSelected((cur) => (cur && isSameDay(cur, day) ? null : startOfDay(day)))
  }

  const schedule = buildSchedule()
  const byDay = new Map<string, DatedItem[]>()
  for (const d of schedule) {
    const k = key(d.date)
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(d)
  }

  // Show every month from this one through the last scheduled item (and at least
  // through the due date), as one long vertical scroll.
  const latest = schedule.reduce((m, d) => (d.date > m ? d.date : m), getDueDate())
  const firstMonth = startOfMonth(today)
  const months: Date[] = []
  let m = firstMonth
  for (let i = 0; i < 30 && m <= startOfMonth(addMonths(latest, 1)); i++) {
    months.push(m)
    m = addMonths(m, 1)
  }

  const selectedItems = selected ? byDay.get(key(selected)) || [] : []

  return (
    <div className="view">
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

      {months.map((month) => {
        const gridStart = startOfWeek(startOfMonth(month))
        const gridEnd = endOfWeek(endOfMonth(month))
        const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
        const weeks: Date[][] = []
        for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

        return (
          <section key={key(month)} className="cal-month">
            <h2 className="cal-month__title">{format(month, 'MMMM yyyy')}</h2>
            <div className="cal-grid cal-grid--head">
              {DOW.map((d, i) => (
                <div key={i} className="cal-dow">{d}</div>
              ))}
            </div>

            {weeks.map((week, wi) => {
              const expandHere =
                selected && week.some((day) => isSameMonth(day, month) && isSameDay(day, selected))
              return (
                <div key={wi}>
                  <div className={'cal-grid' + (moving ? ' cal-grid--moving' : '')}>
                    {week.map((day) => {
                      const items = byDay.get(key(day)) || []
                      const muted = !isSameMonth(day, month)
                      return (
                        <button
                          key={day.toISOString()}
                          className={
                            'cal-cell' +
                            (muted ? ' cal-cell--muted' : '') +
                            (selected && isSameDay(day, selected) ? ' cal-cell--sel' : '') +
                            (isSameDay(day, today) ? ' cal-cell--today' : '')
                          }
                          onClick={() => onDayClick(day)}
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

                  {expandHere && selected && (
                    <div className="cal-expand">
                      <div className="page-head">
                        <h3 className="section-title">{format(selected, 'EEEE, MMMM d')}</h3>
                        <button className="addbtn" onClick={() => setAdding(true)}>+ Add</button>
                      </div>
                      {selectedItems.length === 0 && <p className="muted small">Nothing here yet.</p>}
                      <div className="list">
                        {selectedItems.map((d) => (
                          <div
                            key={d.item.id}
                            className="row"
                            onClick={() => openItem(d)}
                            onPointerDown={() => startPress(d)}
                            onPointerUp={cancelPress}
                            onPointerLeave={cancelPress}
                            onPointerMove={cancelPress}
                          >
                            <span className={'dot dot--' + d.item.category} />
                            <div className="row__body">
                              <div className={'row__title' + (d.state.status === 'done' ? ' strike' : '')}>
                                {d.item.title}
                              </div>
                            </div>
                            {d.isEvent && <span className="pill pill--mine">yours</span>}
                            <span className="row__chev">›</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}

      {adding && selected && (
        <EventModal initialDate={key(selected)} onClose={() => setAdding(false)} />
      )}
    </div>
  )
}
