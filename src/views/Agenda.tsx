import { useState } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { useStoreVersion } from '../lib/useStore'
import { buildSchedule } from '../lib/schedule'
import { getDueDate, lmpFromDue, getProgress, dateForWeek } from '../lib/pregnancy'
import { Category, CATEGORY_LABEL } from '../data/timeline'
import TaskRow from '../components/TaskRow'

const CATEGORIES: Category[] = ['medical', 'health', 'admin', 'prep', 'partner']

export default function Agenda() {
  useStoreVersion()
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const due = getDueDate()
  const lmp = lmpFromDue(due)
  const currentWeek = getProgress(due).week

  const schedule = buildSchedule().filter((d) => filter === 'all' || d.item.category === filter)

  // Group by the effective gestational week.
  const groups = new Map<number, typeof schedule>()
  for (const d of schedule) {
    const wk = Math.floor(differenceInCalendarDays(d.date, lmp) / 7)
    if (!groups.has(wk)) groups.set(wk, [])
    groups.get(wk)!.push(d)
  }
  const weeks = [...groups.keys()].sort((a, b) => a - b)

  return (
    <div className="view">
      <h1 className="page-title">Schedule</h1>
      <div className="chips">
        <button className={'chip' + (filter === 'all' ? ' chip--on' : '')} onClick={() => setFilter('all')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className={'chip' + (filter === c ? ' chip--on' : '')} onClick={() => setFilter(c)}>
            <span className={'dot dot--' + c} /> {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {weeks.map((wk) => {
        const isCurrent = wk === currentWeek
        const start = dateForWeek(due, wk)
        return (
          <section key={wk} className={'weekgroup' + (isCurrent ? ' weekgroup--current' : '')}>
            <div className="weekgroup__head">
              <span className="weekgroup__num">Week {wk}</span>
              <span className="weekgroup__date muted">{format(start, 'MMM d')}</span>
              {isCurrent && <span className="pill pill--now">you are here</span>}
            </div>
            <div className="list">
              {groups.get(wk)!.map((d) => (
                <TaskRow key={d.item.id} d={d} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
