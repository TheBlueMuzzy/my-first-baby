import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStoreVersion } from '../lib/useStore'
import { getEvent, updateEvent, deleteEvent, addEvent } from '../lib/storage'
import { showToast } from '../lib/toast'
import { Category, CATEGORY_LABEL } from '../data/timeline'

const CATEGORIES: Category[] = ['medical', 'health', 'admin', 'prep', 'partner']

export default function EventDetail() {
  useStoreVersion()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ev = getEvent(id)

  if (!ev) {
    return (
      <div className="view view--fab">
        <p className="muted">That item no longer exists.</p>
        <button className="fab fab--left fab--back" onClick={() => navigate(-1)} aria-label="Back">‹</button>
      </div>
    )
  }

  const current = ev
  const [confirmDelete, setConfirmDelete] = useState(false)

  function remove() {
    deleteEvent(id)
    showToast('Event deleted', () =>
      addEvent({
        title: current.title,
        date: current.date,
        notes: current.notes,
        category: current.category,
        isAppointment: current.isAppointment,
        done: current.done,
      }),
    )
    navigate(-1)
  }

  function toggleDone() {
    updateEvent(id, { done: !current.done })
    showToast(current.done ? 'Marked not done' : 'Marked done', () => updateEvent(id, { done: current.done }))
  }

  return (
    <div className="view view--fab">
      <div className="detail-head">
        <span className={'dot dot--' + ev.category} />
        <span className="muted small">{CATEGORY_LABEL[ev.category]}</span>
        <span className="pill pill--mine">yours</span>
        {ev.isAppointment && <span className="pill">appointment</span>}
      </div>

      <div className="actions">
        <button className={'btn' + (ev.done ? ' btn--on' : '')} onClick={toggleDone}>
          {ev.done ? '✓ Done' : 'Mark done'}
        </button>
        {confirmDelete ? (
          <>
            <button className="btn btn--danger" onClick={remove}>Delete for good</button>
            <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </>
        ) : (
          <button className="btn" onClick={() => setConfirmDelete(true)}>Delete</button>
        )}
      </div>

      <div className="field">
        <label>Title</label>
        <input value={ev.title} onChange={(e) => updateEvent(id, { title: e.target.value })} />
      </div>
      <div className="field">
        <label>Date</label>
        <input type="date" value={ev.date} onChange={(e) => e.target.value && updateEvent(id, { date: e.target.value })} />
      </div>
      <div className="field">
        <label>Category</label>
        <select value={ev.category} onChange={(e) => updateEvent(id, { category: e.target.value as Category })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>
      <label className="checkrow">
        <input
          type="checkbox"
          checked={ev.isAppointment}
          onChange={(e) => updateEvent(id, { isAppointment: e.target.checked })}
        />
        This is an appointment
      </label>
      <div className="field">
        <label>Notes</label>
        <textarea
          rows={5}
          value={ev.notes}
          onChange={(e) => updateEvent(id, { notes: e.target.value })}
          placeholder="Anything to remember…"
        />
      </div>

      <button className="fab fab--left fab--back" onClick={() => navigate(-1)} aria-label="Back">‹</button>
    </div>
  )
}
