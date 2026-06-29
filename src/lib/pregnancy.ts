import { addDays, addWeeks, differenceInCalendarDays, startOfDay, parseISO } from 'date-fns'

// Pregnancy is dated from the first day of the last menstrual period (LMP),
// ~2 weeks before conception. Due date = LMP + 280 days.
// Working anchor (confirm/adjust at the dating ultrasound): due ~2027-02-18.
export const DEFAULT_DUE_DATE = '2027-02-18'

const DUE_KEY = 'mfb.dueDate'

export function getDueDate(): Date {
  const stored = localStorage.getItem(DUE_KEY)
  // parseISO reads a plain date as LOCAL midnight (new Date() would read it as
  // UTC and shift the day backward in US timezones).
  return startOfDay(parseISO(stored ?? DEFAULT_DUE_DATE))
}

export function setDueDate(iso: string) {
  localStorage.setItem(DUE_KEY, iso)
}

export function lmpFromDue(due: Date): Date {
  return addDays(due, -280)
}

/** Start date (Monday-of-pregnancy-week) for a given gestational week number. */
export function dateForWeek(due: Date, week: number): Date {
  return addWeeks(lmpFromDue(due), week)
}

export interface Progress {
  week: number
  day: number
  daysToDue: number
  totalDays: number
  percent: number
}

export function getProgress(due: Date, today = new Date()): Progress {
  const lmp = lmpFromDue(due)
  const days = differenceInCalendarDays(startOfDay(today), lmp)
  const week = Math.floor(days / 7)
  const day = days % 7
  const daysToDue = differenceInCalendarDays(due, startOfDay(today))
  const percent = Math.max(0, Math.min(100, Math.round((days / 280) * 100)))
  return { week, day, daysToDue, totalDays: days, percent }
}

export function trimesterForWeek(week: number): 1 | 2 | 3 {
  if (week < 14) return 1
  if (week < 28) return 2
  return 3
}

// Friendly week-by-week size comparison (approximate, for delight not precision).
const SIZES: Record<number, string> = {
  6: 'a sweet pea', 7: 'a blueberry', 8: 'a raspberry', 9: 'a cherry',
  10: 'a strawberry', 11: 'a fig', 12: 'a lime', 13: 'a pea pod',
  14: 'a lemon', 15: 'an apple', 16: 'an avocado', 17: 'a pear',
  18: 'a bell pepper', 19: 'a mango', 20: 'a banana', 21: 'a carrot',
  22: 'a spaghetti squash', 23: 'a grapefruit', 24: 'an ear of corn',
  25: 'a rutabaga', 26: 'a scallion bunch', 27: 'a cauliflower',
  28: 'an eggplant', 29: 'a butternut squash', 30: 'a cabbage',
  31: 'a coconut', 32: 'a jicama', 33: 'a pineapple', 34: 'a cantaloupe',
  35: 'a honeydew melon', 36: 'a head of romaine', 37: 'a bunch of chard',
  38: 'a leek', 39: 'a mini watermelon', 40: 'a small pumpkin',
}

export function babySize(week: number): string {
  if (week < 6) return 'a poppy seed'
  if (week >= 40) return 'a small pumpkin'
  return SIZES[week] ?? SIZES[Math.max(6, Math.min(40, week))] ?? 'growing fast'
}
