import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useStoreVersion } from '../lib/useStore'
import { itemById, CATEGORY_LABEL } from '../data/timeline'
import { getTaskState, setTaskState } from '../lib/storage'
import { getDueDate, dateForWeek } from '../lib/pregnancy'

export default function TaskDetail() {
  useStoreVersion()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const item = itemById(id)

  if (!item) {
    return (
      <div className="view">
        <button className="linkbtn" onClick={() => navigate(-1)}>‹ Back</button>
        <p className="muted">That item no longer exists.</p>
      </div>
    )
  }

  const state = getTaskState(id)
  const due = getDueDate()
  const suggested = dateForWeek(due, item.weekStart)
  const effective = state.customDate ? parseISO(state.customDate) : suggested

  return (
    <div className="view">
      <button className="linkbtn" onClick={() => navigate(-1)}>‹ Back</button>

      <div className="detail-head">
        <span className={'dot dot--' + item.category} />
        <span className="muted small">{CATEGORY_LABEL[item.category]}</span>
        {item.appointment && <span className="pill">appointment</span>}
      </div>
      <h1 className="detail-title">{item.title}</h1>

      <p className="window">
        Usually around <strong>weeks {item.weekStart}{item.weekEnd !== item.weekStart ? `–${item.weekEnd}` : ''}</strong>
        {' · '}
        <span className="muted">currently set for {format(effective, 'EEE, MMM d, yyyy')}</span>
      </p>

      <p className="detail-body">{item.detail}</p>
      {item.guide && <p className="muted small">Based on your guide: pregnancy-guide/{item.guide}</p>}

      <div className="actions">
        <button
          className={'btn' + (state.status === 'done' ? ' btn--on' : '')}
          onClick={() => setTaskState(id, { status: state.status === 'done' ? 'todo' : 'done' })}
        >
          {state.status === 'done' ? '✓ Done' : 'Mark done'}
        </button>
        <button
          className={'btn' + (state.status === 'skipped' ? ' btn--on' : '')}
          onClick={() => setTaskState(id, { status: state.status === 'skipped' ? 'todo' : 'skipped' })}
        >
          {state.status === 'skipped' ? 'Skipped (N/A)' : 'Skip (N/A)'}
        </button>
      </div>

      <div className="field">
        <label>Reschedule</label>
        <input
          type="date"
          value={format(effective, 'yyyy-MM-dd')}
          onChange={(e) => e.target.value && setTaskState(id, { customDate: e.target.value })}
        />
        {state.customDate && (
          <button className="linkbtn" onClick={() => setTaskState(id, { customDate: null })}>
            Reset to suggested ({format(suggested, 'MMM d')})
          </button>
        )}
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea
          rows={5}
          placeholder="What the doctor said, results, questions, anything to remember…"
          value={state.notes}
          onChange={(e) => setTaskState(id, { notes: e.target.value })}
        />
      </div>

      <p className="muted small">Photos for this item turn on with the gallery in the next step.</p>
    </div>
  )
}
