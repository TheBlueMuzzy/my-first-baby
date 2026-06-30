import { useState } from 'react'
import {
  addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, startOfDay,
} from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useStoreVersion } from '../lib/useStore'
import { buildSchedule, DatedItem } from '../lib/schedule'
import EventModal from '../components/EventModal'

export default function CalendarView() {
  useStoreVersion()
  const navigate = useNavigate()
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [selected, setSelected] = useState(startOfDay(new Date()))
  const [adding, setAdding] = useState(false)
  const today = startOfDay(new Date())

  function openItem(d: DatedItem) {
    navigate(d.isEvent && d.event ? '/event/' + d.event.id : '/task/' + d.item.id)
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
    <div className="view">
      <div className="cal-head">
        <button className="navbtn" onClick={() => setMonth(addMonths(month, -1))}>‹</button>
        <h1 className="page-title">{format(month, 'MMMM yyyy')}</h1>
        <button className="navbtn" onClick={() => setMonth(addMonths(month, 1))}>›</button>
      </div>

      <div className="cal-grid cal-grid--head">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="cal-dow">{d}</div>
        ))}
      </div>

      <div className="cal-grid">
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
              onClick={() => setSelected(startOfDay(day))}
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
        <div className="list">
          {selectedItems.map((d) => (
            <div key={d.item.id} className="row" onClick={() => openItem(d)}>
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
    </div>
  )
}
