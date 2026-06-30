import { useParams, useNavigate } from 'react-router-dom'
import { useStoreVersion } from '../lib/useStore'
import { getEvent, updateEvent, deleteEvent } from '../lib/storage'
import { Category, CATEGORY_LABEL } from '../data/timeline'

const CATEGORIES: Category[] = ['medical', 'health', 'admin', 'prep', 'partner']

export default function EventDetail() {
  useStoreVersion()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ev = getEvent(id)

  if (!ev) {
    return (
      <div className="view">
        <button className="linkbtn linkbtn--dark" onClick={() => navigate(-1)}>‹ Back</button>
        <p className="muted">That item no longer exists.</p>
      </div>
    )
  }

  function remove() {
    deleteEvent(id)
    navigate(-1)
  }

  return (
    <div className="view">
      <button className="linkbtn linkbtn--dark" onClick={() => navigate(-1)}>‹ Back</button>

      <div className="detail-head">
        <span className={'dot dot--' + ev.category} />
        <span className="muted small">{CATEGORY_LABEL[ev.category]}</span>
        <span className="pill pill--mine">yours</span>
        {ev.isAppointment && <span className="pill">appointment</span>}
      </div>

      <div className="actions">
        <button
          className={'btn' + (ev.done ? ' btn--on' : '')}
          onClick={() => updateEvent(id, { done: !ev.done })}
        >
          {ev.done ? '✓ Done' : 'Mark done'}
        </button>
        <button className="btn" onClick={remove}>
          Delete
        </button>
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
    </div>
  )
}
