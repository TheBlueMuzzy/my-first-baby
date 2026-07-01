import { useState } from 'react'
import { format, startOfDay, differenceInCalendarDays } from 'date-fns'
import { useStoreVersion } from '../lib/useStore'
import { getDueDate, setDueDate, getProgress, babySize, trimesterForWeek } from '../lib/pregnancy'
import { touch, pushDueDate } from '../lib/storage'
import { buildSchedule } from '../lib/schedule'
import TaskRow from '../components/TaskRow'
import Emergency from '../components/Emergency'

export default function Home() {
  useStoreVersion()
  const [editDue, setEditDue] = useState(false)
  const due = getDueDate()
  const p = getProgress(due)
  const today = startOfDay(new Date())
  const schedule = buildSchedule()

  const nextAppt = schedule.find(
    (d) => d.item.appointment && d.state.status !== 'done' && differenceInCalendarDays(d.date, today) >= 0,
  )

  const comingUp = schedule
    .filter((d) => d.state.status === 'todo')
    .filter((d) => {
      const days = differenceInCalendarDays(d.date, today)
      return days >= -7 && days <= 28
    })
    .slice(0, 6)

  return (
    <div className="view">
      <header className="hero">
        <div className="hero__week">
          Week {p.week}<span className="hero__day"> + {p.day}d</span>
        </div>
        <div className="hero__sub">
          {p.daysToDue} days to go · Trimester {trimesterForWeek(p.week)}
        </div>
        <div className="hero__size">Baby is about the size of {babySize(p.week)} 🌱</div>
        <div className="progress">
          <div className="progress__fill" style={{ width: p.percent + '%' }} />
        </div>
        <button className="linkbtn" onClick={() => setEditDue((v) => !v)}>
          Due {format(due, 'MMM d, yyyy')} · adjust
        </button>
        {editDue && (
          <div className="due-edit">
            <input
              type="date"
              defaultValue={format(due, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  setDueDate(e.target.value)
                  pushDueDate(e.target.value)
                  touch()
                }
              }}
            />
            <p className="muted small">Update this after the dating ultrasound on the 13th — every milestone recalculates.</p>
          </div>
        )}
      </header>

      <Emergency />

      {nextAppt && (
        <section className="card card--accent">
          <div className="card__label">Next appointment</div>
          <div className="card__title">{nextAppt.item.title}</div>
          <div className="card__date">{format(nextAppt.date, 'EEEE, MMMM d')}</div>
        </section>
      )}

      <section>
        <h2 className="section-title">Coming up</h2>
        {comingUp.length === 0 && <p className="muted">Nothing in the next few weeks — you’re all caught up. 🎉</p>}
        <div className="list">
          {comingUp.map((d) => (
            <TaskRow key={d.item.id} d={d} />
          ))}
        </div>
      </section>

      <p className="footer-note muted small">
        Reference only — your OB, midwife, and pediatrician override anything here.
      </p>
    </div>
  )
}
