import { useState } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
  MeasuringStrategy, DragStartEvent, DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStoreVersion } from '../lib/useStore'
import { buildSchedule, DatedItem } from '../lib/schedule'
import { setTaskState, updateEvent } from '../lib/storage'
import { showToast } from '../lib/toast'
import { getDueDate, lmpFromDue, getProgress, dateForWeek } from '../lib/pregnancy'
import { Category, CATEGORY_LABEL } from '../data/timeline'
import TaskRow from '../components/TaskRow'
import EventModal from '../components/EventModal'

const CATEGORIES: Category[] = ['medical', 'health', 'admin', 'prep', 'partner']

type Row = { kind: 'header'; wk: number } | { kind: 'item'; d: DatedItem }

export default function Agenda() {
  useStoreVersion()
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const due = getDueDate()
  const lmp = lmpFromDue(due)
  const currentWeek = getProgress(due).week

  const schedule = buildSchedule().filter((d) => filter === 'all' || d.item.category === filter)

  // Group by effective gestational week (same as before).
  const groups = new Map<number, DatedItem[]>()
  for (const d of schedule) {
    const wk = Math.floor(differenceInCalendarDays(d.date, lmp) / 7)
    if (!groups.has(wk)) groups.set(wk, [])
    groups.get(wk)!.push(d)
  }
  const weeks = [...groups.keys()].sort((a, b) => a - b)

  // Flatten to a single list of rows (week headers + items) for drag-and-drop.
  const rows: Row[] = []
  for (const wk of weeks) {
    rows.push({ kind: 'header', wk })
    for (const d of groups.get(wk)!) rows.push({ kind: 'item', d })
  }
  const itemIds = schedule.map((d) => d.item.id)
  const byId = new Map(schedule.map((d) => [d.item.id, d]))
  const activeItem = activeId ? byId.get(activeId) : null

  // Long-press (hold ~220ms) to pick up; a quick tap still opens/checks the item.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
    if (navigator.vibrate) navigator.vibrate(15)
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const moved = byId.get(String(active.id))
    const target = byId.get(String(over.id))
    if (!moved || !target) return

    // Reschedule to the day it landed on, with an Undo that restores the old date.
    const iso = format(target.date, 'yyyy-MM-dd')
    if (moved.isEvent && moved.event) {
      const prev = moved.event.date
      updateEvent(moved.event.id, { date: iso })
      showToast(`Moved to ${format(target.date, 'MMM d')}`, () => updateEvent(moved.event!.id, { date: prev }))
    } else {
      const prev = moved.state.customDate
      setTaskState(moved.item.id, { customDate: iso })
      showToast(`Moved to ${format(target.date, 'MMM d')}`, () => setTaskState(moved.item.id, { customDate: prev }))
    }
  }

  return (
    <div className="view">
      <div className="page-head">
        <h1 className="page-title">Schedule</h1>
        <button className="addbtn" onClick={() => setAdding(true)}>+ Add your own</button>
      </div>
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

      <p className="muted small cal-hint">Press and hold a card to drag it to another day.</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {rows.map((row) =>
            row.kind === 'header' ? (
              <WeekHeader key={'h' + row.wk} wk={row.wk} date={dateForWeek(due, row.wk)} isCurrent={row.wk === currentWeek} />
            ) : (
              <SortableRow key={row.d.item.id} d={row.d} />
            ),
          )}
        </SortableContext>
        <DragOverlay>
          {activeItem ? (
            <div className="row--overlay">
              <span className={'dot dot--' + activeItem.item.category} />
              <div className="row__body">
                <div className="row__title">{activeItem.item.title}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {adding && <EventModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function WeekHeader({ wk, date, isCurrent }: { wk: number; date: Date; isCurrent: boolean }) {
  return (
    <div className={'weekgroup__head' + (isCurrent ? ' weekgroup__head--current' : '')}>
      <span className="weekgroup__num">Week {wk}</span>
      <span className="weekgroup__date muted">{format(date, 'MMM d')}</span>
      {isCurrent && <span className="pill pill--now">you are here</span>}
    </div>
  )
}

function SortableRow({ d }: { d: DatedItem }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: d.item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  // While lifted, the floating overlay shows the (tilted) card; the source slot
  // becomes a dashed placeholder that slides to where the card will drop.
  if (isDragging) {
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="row--placeholder" />
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="sortable-row">
      <TaskRow d={d} />
    </div>
  )
}
