// Labor tools store their logs on-device only (localStorage). These are things one
// person does in the moment on their own phone, so they don't sync to the partner.

export interface KickSession {
  id: string
  endedAt: number // ms timestamp
  kicks: number
  durationMs: number
}

export interface Contraction {
  id: string
  start: number // ms timestamp
  end: number
}

const KICKS = 'mfb.kicks'
const CONTRACTIONS = 'mfb.contractions'

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}
function write<T>(key: string, v: T[]) {
  localStorage.setItem(key, JSON.stringify(v))
}

export function getKickSessions(): KickSession[] {
  return read<KickSession>(KICKS)
}
export function addKickSession(s: KickSession) {
  write(KICKS, [s, ...read<KickSession>(KICKS)].slice(0, 50))
}
export function clearKickSessions() {
  write<KickSession>(KICKS, [])
}

export function getContractions(): Contraction[] {
  return read<Contraction>(CONTRACTIONS)
}
export function saveContractions(list: Contraction[]) {
  write(CONTRACTIONS, list.slice(0, 200))
}

// ---------- Generic checklist state (hospital bag, birth plan) ----------
export function getChecks(key: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('mfb.check.' + key) || '{}')
  } catch {
    return {}
  }
}
export function toggleCheck(key: string, id: string): Record<string, boolean> {
  const c = getChecks(key)
  c[id] = !c[id]
  localStorage.setItem('mfb.check.' + key, JSON.stringify(c))
  return { ...c }
}

// ---------- Free-text notes (birth plan) ----------
export function getNote(key: string): string {
  return localStorage.getItem('mfb.note.' + key) || ''
}
export function setNote(key: string, v: string) {
  localStorage.setItem('mfb.note.' + key, v)
}

// ---------- Custom birth-plan items ----------
export interface PlanItem {
  id: string
  group: string
  text: string
}
export function getPlanItems(): PlanItem[] {
  return read<PlanItem>('mfb.birthplan.custom')
}
export function savePlanItems(a: PlanItem[]) {
  write('mfb.birthplan.custom', a)
}

// ---------- Baby names ----------
export interface BabyName {
  id: string
  name: string
  sex: 'boy' | 'girl'
  fav: boolean
}
export function getNames(): BabyName[] {
  return read<BabyName>('mfb.names')
}
export function saveNames(a: BabyName[]) {
  write('mfb.names', a)
}

// ---------- Weight ----------
export interface WeightEntry {
  id: string
  date: string // ISO yyyy-MM-dd
  lbs: number
}
export function getWeights(): WeightEntry[] {
  return read<WeightEntry>('mfb.weights')
}
export function saveWeights(a: WeightEntry[]) {
  write('mfb.weights', a)
}
