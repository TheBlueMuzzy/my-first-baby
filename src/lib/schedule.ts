import { TIMELINE, TimelineItem } from '../data/timeline'
import { getTaskState, getEvents, CustomEvent, TaskState } from './storage'
import { getDueDate, dateForWeek } from './pregnancy'
import { startOfDay, parseISO } from 'date-fns'

export interface DatedItem {
  item: TimelineItem
  state: TaskState
  date: Date // effective date: custom override, else start of the guidance window
  custom: boolean // a preset whose date the user moved
  isEvent?: boolean // a user-created event rather than a preset milestone
  event?: CustomEvent
}

/** Present a user-created event in the same shape the screens already render. */
function eventToDated(ev: CustomEvent): DatedItem {
  return {
    item: {
      id: 'event:' + ev.id,
      title: ev.title,
      category: ev.category,
      weekStart: 0,
      weekEnd: 0,
      detail: ev.notes,
      appointment: ev.isAppointment,
    },
    state: { status: ev.done ? 'done' : 'todo', notes: ev.notes, customDate: ev.date },
    date: startOfDay(parseISO(ev.date)),
    custom: false,
    isEvent: true,
    event: ev,
  }
}

export function buildSchedule(): DatedItem[] {
  const due = getDueDate()
  const presets = TIMELINE.map((item) => {
    const state = getTaskState(item.id)
    const custom = Boolean(state.customDate)
    const date = custom
      ? startOfDay(parseISO(state.customDate as string))
      : startOfDay(dateForWeek(due, item.weekStart))
    return { item, state, date, custom }
  })
  const events = getEvents().map(eventToDated)
  return [...presets, ...events].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function datedItem(id: string): DatedItem | undefined {
  return buildSchedule().find((d) => d.item.id === id)
}
