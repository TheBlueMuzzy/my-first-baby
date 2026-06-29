import { TIMELINE, TimelineItem } from '../data/timeline'
import { getTaskState, TaskState } from './storage'
import { getDueDate, dateForWeek } from './pregnancy'
import { startOfDay, parseISO } from 'date-fns'

export interface DatedItem {
  item: TimelineItem
  state: TaskState
  date: Date // effective date: custom override, else start of the guidance window
  custom: boolean
}

export function buildSchedule(): DatedItem[] {
  const due = getDueDate()
  return TIMELINE.map((item) => {
    const state = getTaskState(item.id)
    const custom = Boolean(state.customDate)
    const date = custom
      ? startOfDay(parseISO(state.customDate as string))
      : startOfDay(dateForWeek(due, item.weekStart))
    return { item, state, date, custom }
  }).sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function datedItem(id: string): DatedItem | undefined {
  return buildSchedule().find((d) => d.item.id === id)
}
