// Task state lives on-device (localStorage) so the UI is always instant and works
// offline. When signed in and joined to a household, every change is ALSO mirrored
// to Supabase, and changes from the partner's phone flow back in via realtime.
// The local cache stays the synchronous source of truth the screens read from —
// the cloud just keeps both devices' caches in agreement.

import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Category } from '../data/timeline'

export type TaskStatus = 'todo' | 'done' | 'skipped'

export interface TaskState {
  status: TaskStatus
  notes: string
  customDate: string | null // ISO date; overrides the suggested window date
}

/** A user-created item (their own appointment / reminder), as opposed to a preset. */
export interface CustomEvent {
  id: string
  title: string
  date: string // ISO yyyy-MM-dd
  notes: string
  category: Category
  isAppointment: boolean
  done: boolean
}

const KEY = 'mfb.tasks'
const EVENTS_KEY = 'mfb.events'
const DUE_KEY = 'mfb.dueDate' // mirror of pregnancy.ts; cloud is the shared source of truth when signed in

type Store = Record<string, TaskState>
type EventStore = Record<string, CustomEvent>

const listeners = new Set<() => void>()
let version = 0

// ---------- cloud sync state ----------
let householdId: string | null = null
let joinCode: string | null = null
let channel: RealtimeChannel | null = null

export function getHouseholdId(): string | null {
  return householdId
}
export function getJoinCode(): string | null {
  return joinCode
}

export function getVersion(): number {
  return version
}

/** Notify subscribers without changing task data (e.g. when the due date changes). */
export function touch() {
  version++
  listeners.forEach((l) => l())
}

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

/** Write the local cache and re-render. Does NOT push to the cloud — used both by
 *  local edits (which push separately) and by incoming cloud changes. */
function writeLocal(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
  touch()
}

export const DEFAULT_STATE: TaskState = { status: 'todo', notes: '', customDate: null }

export function getTaskState(id: string): TaskState {
  return { ...DEFAULT_STATE, ...read()[id] }
}

export function getAllStates(): Store {
  return read()
}

export function setTaskState(id: string, patch: Partial<TaskState>) {
  const store = read()
  const next = { ...DEFAULT_STATE, ...store[id], ...patch }
  store[id] = next
  writeLocal(store)
  pushTask(id, next) // mirror to the cloud (no-op when offline / signed out)
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// =====================================================================
// Custom events (your own appointments / reminders) — same local-first
// model as tasks: instant local cache, mirrored to the cloud.
// =====================================================================

function readEvents(): EventStore {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeEventsLocal(store: EventStore) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(store))
  touch()
}

export function getEvents(): CustomEvent[] {
  return Object.values(readEvents())
}

export function getEvent(id: string): CustomEvent | undefined {
  return readEvents()[id]
}

export function addEvent(fields: Omit<CustomEvent, 'id'>): CustomEvent {
  const ev: CustomEvent = { ...fields, id: crypto.randomUUID() }
  const store = readEvents()
  store[ev.id] = ev
  writeEventsLocal(store)
  pushEvent(ev)
  return ev
}

export function updateEvent(id: string, patch: Partial<Omit<CustomEvent, 'id'>>) {
  const store = readEvents()
  const cur = store[id]
  if (!cur) return
  const next = { ...cur, ...patch }
  store[id] = next
  writeEventsLocal(store)
  pushEvent(next)
}

export function deleteEvent(id: string) {
  const store = readEvents()
  if (store[id]) {
    delete store[id]
    writeEventsLocal(store)
  }
  if (supabase && householdId) {
    supabase
      .from('events')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('[sync] could not delete event:', error.message)
      })
  }
}

function pushEvent(ev: CustomEvent) {
  if (!supabase || !householdId) return
  supabase
    .from('events')
    .upsert({
      id: ev.id,
      household_id: householdId,
      title: ev.title,
      date: ev.date,
      notes: ev.notes || null,
      category: ev.category,
      is_appointment: ev.isAppointment,
      done: ev.done,
      updated_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) console.warn('[sync] could not save event:', error.message)
    })
}

// =====================================================================
// Cloud sync — only active once a household is joined.
// =====================================================================

function pushTask(itemId: string, s: TaskState) {
  if (!supabase || !householdId) return
  supabase
    .from('tasks')
    .upsert(
      {
        household_id: householdId,
        item_id: itemId,
        status: s.status,
        notes: s.notes,
        custom_date: s.customDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,item_id' },
    )
    .then(({ error }) => {
      if (error) console.warn('[sync] could not save task:', error.message)
    })
}

/** Shared due date lives on the household row so both phones agree on it. */
export function pushDueDate(iso: string) {
  if (!supabase || !householdId) return
  supabase
    .from('households')
    .update({ due_date: iso })
    .eq('id', householdId)
    .then(({ error }) => {
      if (error) console.warn('[sync] could not save due date:', error.message)
    })
}

/** Turn on sync for a household: pull everything down, then listen for live changes. */
export async function activateSync(hid: string, code: string | null) {
  joinCode = code
  if (householdId === hid && channel) return // already syncing this household
  householdId = hid
  await hydrate()
  subscribeRealtime()
}

/** Sign-out: stop listening and clear the on-device copy (next sign-in re-pulls). */
export function deactivateSync() {
  if (channel) {
    supabase?.removeChannel(channel)
    channel = null
  }
  householdId = null
  joinCode = null
  localStorage.removeItem(KEY)
  localStorage.removeItem(EVENTS_KEY)
  localStorage.removeItem(DUE_KEY)
  touch()
}

/** Replace the local cache with the household's current cloud state. */
async function hydrate() {
  if (!supabase || !householdId) return

  const { data: rows, error } = await supabase
    .from('tasks')
    .select('item_id,status,notes,custom_date')
    .eq('household_id', householdId)
  if (error) {
    console.warn('[sync] could not load tasks:', error.message)
    return
  }

  const store: Store = {}
  for (const r of rows ?? []) {
    store[r.item_id] = {
      status: r.status as TaskStatus,
      notes: r.notes ?? '',
      customDate: r.custom_date,
    }
  }
  localStorage.setItem(KEY, JSON.stringify(store))

  // Custom events.
  const { data: evRows } = await supabase
    .from('events')
    .select('id,title,date,notes,category,is_appointment,done')
    .eq('household_id', householdId)
  const evStore: EventStore = {}
  for (const r of evRows ?? []) {
    evStore[r.id] = {
      id: r.id,
      title: r.title,
      date: r.date,
      notes: r.notes ?? '',
      category: r.category as Category,
      isAppointment: r.is_appointment,
      done: r.done,
    }
  }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(evStore))

  // Shared due date (cloud wins when it has one).
  const { data: h } = await supabase
    .from('households')
    .select('due_date')
    .eq('id', householdId)
    .maybeSingle()
  if (h?.due_date) localStorage.setItem(DUE_KEY, h.due_date)

  touch()
}

function applyEventRow(r: {
  id: string
  title: string
  date: string
  notes: string | null
  category: string
  is_appointment: boolean
  done: boolean
}) {
  const store = readEvents()
  store[r.id] = {
    id: r.id,
    title: r.title,
    date: r.date,
    notes: r.notes ?? '',
    category: r.category as Category,
    isAppointment: r.is_appointment,
    done: r.done,
  }
  writeEventsLocal(store)
}

function applyTaskRow(r: { item_id: string; status: string; notes: string | null; custom_date: string | null }) {
  const store = read()
  store[r.item_id] = { status: r.status as TaskStatus, notes: r.notes ?? '', customDate: r.custom_date }
  writeLocal(store)
}

function subscribeRealtime() {
  if (!supabase || !householdId) return
  if (channel) {
    supabase.removeChannel(channel) // drop any prior channel before re-subscribing
    channel = null
  }
  channel = supabase
    .channel('mfb-' + householdId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` },
      (payload) => {
        const r = payload.new as any
        if (r && r.item_id) applyTaskRow(r)
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `household_id=eq.${householdId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id
          if (id) {
            const s = readEvents()
            if (s[id]) {
              delete s[id]
              writeEventsLocal(s)
            }
          }
        } else {
          const r = payload.new as any
          if (r?.id) applyEventRow(r)
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
      (payload) => {
        const due = (payload.new as any)?.due_date
        if (due) {
          localStorage.setItem(DUE_KEY, due)
          touch()
        }
      },
    )
    .subscribe()
}

/** Seed the one known fixed appointment into a brand-new household. */
export function seedHousehold() {
  setTaskState('first-visit', { customDate: '2026-07-13' })
}

/**
 * Reset the milestone schedule to its recommended state: clears every preset's
 * moved date, check-off, and notes, then re-pins the known first appointment.
 * Optionally also deletes the events you added yourself. Photos & account untouched.
 */
export async function resetSchedule(opts: { clearEvents: boolean }) {
  if (supabase && householdId) {
    await supabase.from('tasks').delete().eq('household_id', householdId)
    if (opts.clearEvents) await supabase.from('events').delete().eq('household_id', householdId)
  }
  localStorage.removeItem(KEY)
  if (opts.clearEvents) localStorage.removeItem(EVENTS_KEY)
  touch()
  seedHousehold() // re-pin the first prenatal visit (July 13)
}

/** Local-only seed, used when Supabase isn't configured (offline / no account). */
export function seedOnce() {
  if (localStorage.getItem('mfb.seeded')) return
  setTaskState('first-visit', { customDate: '2026-07-13' })
  localStorage.setItem('mfb.seeded', '1')
}
