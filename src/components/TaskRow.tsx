import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { DatedItem } from '../lib/schedule'
import { setTaskState, updateEvent } from '../lib/storage'
import { showToast } from '../lib/toast'

export default function TaskRow({ d, showDate = true }: { d: DatedItem; showDate?: boolean }) {
  const navigate = useNavigate()
  const { item, state, date } = d
  const done = state.status === 'done'
  const skipped = state.status === 'skipped'

  function open() {
    navigate(d.isEvent && d.event ? '/event/' + d.event.id : '/task/' + item.id)
  }

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    const label = done ? 'Marked not done' : 'Marked done'
    if (d.isEvent && d.event) {
      const id = d.event.id
      updateEvent(id, { done: !done })
      showToast(label, () => updateEvent(id, { done }))
    } else {
      const prev = state.status
      setTaskState(item.id, { status: done ? 'todo' : 'done' })
      showToast(label, () => setTaskState(item.id, { status: prev }))
    }
  }

  return (
    <div
      className={'row' + (done ? ' row--done' : '') + (skipped ? ' row--skipped' : '')}
      onClick={open}
    >
      <button
        className={'check' + (done ? ' check--on' : '')}
        onClick={toggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
      >
        {done ? '✓' : ''}
      </button>
      <span className={'dot dot--' + item.category} />
      <div className="row__body">
        <div className="row__title">{item.title}</div>
        <div className="row__meta">
          {showDate && <span>{format(date, 'EEE, MMM d')}</span>}
          {item.appointment && <span className="pill">appointment</span>}
          {d.isEvent && <span className="pill pill--mine">yours</span>}
          {skipped && <span className="pill pill--muted">skipped</span>}
          {d.custom && <span className="pill pill--muted">moved</span>}
        </div>
      </div>
      <span className="row__chev">›</span>
    </div>
  )
}
