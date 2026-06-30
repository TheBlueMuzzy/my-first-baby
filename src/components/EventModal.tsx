import { useState } from 'react'
import { format } from 'date-fns'
import { addEvent } from '../lib/storage'
import { Category, CATEGORY_LABEL } from '../data/timeline'

const CATEGORIES: Category[] = ['medical', 'health', 'admin', 'prep', 'partner']

/** Quick form for adding your own appointment / reminder. */
export default function EventModal({ initialDate, onClose }: { initialDate?: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState<Category>('medical')
  const [isAppointment, setIsAppointment] = useState(false)
  const [notes, setNotes] = useState('')

  function save() {
    if (!title.trim() || !date) return
    addEvent({ title: title.trim(), date, category, isAppointment, notes: notes.trim(), done: false })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Add your own</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="field">
          <label>What is it?</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Glucose test, baby shower, hospital tour…"
            autoFocus
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <label className="checkrow">
          <input type="checkbox" checked={isAppointment} onChange={(e) => setIsAppointment(e.target.checked)} />
          This is an appointment
        </label>
        <div className="field">
          <label>Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember…" />
        </div>

        <div className="actions">
          <button className="btn btn--on" onClick={save} disabled={!title.trim() || !date}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
