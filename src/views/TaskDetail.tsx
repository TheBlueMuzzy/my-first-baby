import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useStoreVersion } from '../lib/useStore'
import { itemById, CATEGORY_LABEL } from '../data/timeline'
import { getTaskState, setTaskState } from '../lib/storage'
import { showToast } from '../lib/toast'
import { getDueDate, dateForWeek } from '../lib/pregnancy'

export default function TaskDetail() {
  useStoreVersion()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const item = itemById(id)

  if (!item) {
    return (
      <div className="view">
        <p className="muted">That item no longer exists.</p>
        <BackFab onBack={() => navigate(-1)} />
      </div>
    )
  }

  const state = getTaskState(id)
  const due = getDueDate()
  const suggested = dateForWeek(due, item.weekStart)
  const effective = state.customDate ? parseISO(state.customDate) : suggested

  function setStatus(next: 'todo' | 'done' | 'skipped', undoLabel: string) {
    const prev = state.status
    setTaskState(id, { status: next })
    showToast(undoLabel, () => setTaskState(id, { status: prev }))
  }

  return (
    <div className="view view--fab">
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
          onClick={() =>
            setStatus(state.status === 'done' ? 'todo' : 'done', state.status === 'done' ? 'Marked not done' : 'Marked done')
          }
        >
          {state.status === 'done' ? '✓ Done' : 'Mark done'}
        </button>
        <button
          className={'btn' + (state.status === 'skipped' ? ' btn--on' : '')}
          onClick={() =>
            setStatus(state.status === 'skipped' ? 'todo' : 'skipped', state.status === 'skipped' ? 'Un-skipped' : 'Skipped')
          }
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

      <BackFab onBack={() => navigate(-1)} />
    </div>
  )
}

function BackFab({ onBack }: { onBack: () => void }) {
  return (
    <button className="fab fab--left fab--back" onClick={onBack} aria-label="Back">
      ‹
    </button>
  )
}
